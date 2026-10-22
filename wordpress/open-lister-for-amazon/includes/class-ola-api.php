<?php
/**
 * Minimal Amazon Selling Partner API client.
 *
 * Authenticates with Login with Amazon (LWA) using a refresh token from a
 * self-authorized private app. SP-API no longer requires AWS SigV4 signing,
 * so a bearer-style `x-amz-access-token` header is all a request needs.
 */

defined( 'ABSPATH' ) || exit;

class OLA_API {

	const TOKEN_TRANSIENT = 'ola_lwa_access_token';
	const LWA_URL         = 'https://api.amazon.com/auth/o2/token';
	const MAX_RETRIES     = 2;

	/** Region to use instead of the saved marketplace's region (used while detecting it). */
	public static $region_override = null;

	private static $endpoints = array(
		'na' => 'https://sellingpartnerapi-na.amazon.com',
		'eu' => 'https://sellingpartnerapi-eu.amazon.com',
		'fe' => 'https://sellingpartnerapi-fe.amazon.com',
	);

	/**
	 * Exchanges the refresh token for an access token (cached for ~55 minutes).
	 *
	 * @return string|WP_Error
	 */
	public static function access_token( $force = false ) {
		if ( ! $force ) {
			$cached = get_transient( self::TOKEN_TRANSIENT );
			if ( $cached ) {
				return $cached;
			}
		}

		if ( ! OLA_Settings::get( 'lwa_client_id' ) || ! OLA_Settings::get( 'lwa_client_secret' ) || ! OLA_Settings::get( 'refresh_token' ) ) {
			return new WP_Error( 'ola_not_configured', __( 'Amazon credentials are missing. Add them under Amazon > Settings.', 'open-lister-amazon' ) );
		}

		$response = wp_remote_post(
			self::LWA_URL,
			array(
				'timeout' => 20,
				'body'    => array(
					'grant_type'    => 'refresh_token',
					'refresh_token' => OLA_Settings::get( 'refresh_token' ),
					'client_id'     => OLA_Settings::get( 'lwa_client_id' ),
					'client_secret' => OLA_Settings::get( 'lwa_client_secret' ),
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( empty( $body['access_token'] ) ) {
			$message = self::lwa_error_message( isset( $body['error'] ) ? $body['error'] : '', isset( $body['error_description'] ) ? $body['error_description'] : '' );
			OLA_Logger::error( 'LWA token exchange failed', array( 'response' => $body ) );
			return new WP_Error( 'ola_lwa_failed', $message );
		}

		$ttl = isset( $body['expires_in'] ) ? (int) $body['expires_in'] - 300 : 3300;
		set_transient( self::TOKEN_TRANSIENT, $body['access_token'], max( 60, $ttl ) );

		return $body['access_token'];
	}

	private static function lwa_error_message( $code, $description ) {
		switch ( $code ) {
			case 'invalid_client':
				return __( 'Amazon did not accept the Client ID or Client Secret. Copy them again from your app in Seller Central (click "View" next to LWA credentials).', 'open-lister-amazon' );
			case 'invalid_grant':
				return __( 'Amazon did not accept the refresh token. In Seller Central, click "Authorize" next to your app again and copy the new token.', 'open-lister-amazon' );
		}
		return $description ? $description : __( 'Login with Amazon did not return an access token.', 'open-lister-amazon' );
	}

	/**
	 * Sends a request to SP-API.
	 *
	 * @param string      $method HTTP method.
	 * @param string      $path   Path beginning with a slash.
	 * @param array       $query  Query parameters.
	 * @param array|null  $body   JSON body.
	 * @param string|null $token  Restricted Data Token to use instead of the access token.
	 * @return array|WP_Error Decoded JSON body (empty array for 204).
	 */
	public static function request( $method, $path, $query = array(), $body = null, $token = null ) {
		$region = self::$region_override ? self::$region_override : OLA_Settings::region();
		$url    = self::$endpoints[ $region ] . $path;
		if ( $query ) {
			$url .= '?' . self::build_query( $query );
		}

		for ( $attempt = 0; $attempt <= self::MAX_RETRIES; $attempt++ ) {
			$access = $token ? $token : self::access_token( $attempt > 0 );
			if ( is_wp_error( $access ) ) {
				return $access;
			}

			$args = array(
				'method'  => $method,
				'timeout' => 30,
				'headers' => array(
					'x-amz-access-token' => $access,
					'x-amz-date'         => gmdate( 'Ymd\THis\Z' ),
					'user-agent'         => 'OpenListerForAmazon/' . OLA_VERSION . ' (Language=PHP; Platform=WordPress)',
					'accept'             => 'application/json',
				),
			);
			if ( null !== $body ) {
				$args['headers']['content-type'] = 'application/json';
				$args['body']                    = wp_json_encode( $body );
			}

			OLA_Logger::debug( "SP-API {$method} {$path}", array( 'query' => $query, 'body' => $body ) );

			$response = wp_remote_request( $url, $args );
			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$code    = (int) wp_remote_retrieve_response_code( $response );
			$decoded = json_decode( wp_remote_retrieve_body( $response ), true );
			$decoded = is_array( $decoded ) ? $decoded : array();

			// Expired token: refresh once and retry (only for normal access tokens).
			if ( 403 === $code && ! $token && $attempt < self::MAX_RETRIES && self::is_token_error( $decoded ) ) {
				delete_transient( self::TOKEN_TRANSIENT );
				continue;
			}

			// Throttled: wait briefly and retry. Long backoffs are left to the job queue.
			if ( 429 === $code && $attempt < self::MAX_RETRIES ) {
				sleep( 2 * ( $attempt + 1 ) );
				continue;
			}

			if ( $code >= 200 && $code < 300 ) {
				return $decoded;
			}

			$message = self::error_message( $decoded, $code );
			OLA_Logger::error( "SP-API {$method} {$path} failed ({$code}): {$message}" );
			return new WP_Error( 'ola_api_' . $code, $message, array( 'status' => $code, 'body' => $decoded ) );
		}

		return new WP_Error( 'ola_api_throttled', __( 'Amazon is throttling requests. The action will be retried.', 'open-lister-amazon' ), array( 'status' => 429 ) );
	}

	private static function build_query( $query ) {
		$parts = array();
		foreach ( $query as $key => $value ) {
			if ( is_array( $value ) ) {
				$value = implode( ',', $value );
			}
			$parts[] = rawurlencode( $key ) . '=' . rawurlencode( (string) $value );
		}
		return implode( '&', $parts );
	}

	private static function is_token_error( $decoded ) {
		$message = strtolower( self::error_message( $decoded, 403 ) );
		return false !== strpos( $message, 'expired' ) || false !== strpos( $message, 'access token' );
	}

	private static function error_message( $decoded, $code ) {
		if ( ! empty( $decoded['errors'] ) && is_array( $decoded['errors'] ) ) {
			$messages = array();
			foreach ( $decoded['errors'] as $error ) {
				$messages[] = trim( ( isset( $error['code'] ) ? $error['code'] . ': ' : '' ) . ( isset( $error['message'] ) ? $error['message'] : '' ) . ( isset( $error['details'] ) ? ' ' . $error['details'] : '' ) );
			}
			return implode( '; ', $messages );
		}
		/* translators: %d: HTTP status code */
		return sprintf( __( 'Amazon returned HTTP %d.', 'open-lister-amazon' ), $code );
	}

	/* ---------------------------------------------------------------------
	 * Endpoint helpers
	 * ------------------------------------------------------------------- */

	public static function marketplace_participations() {
		return self::request( 'GET', '/sellers/v1/marketplaceParticipations' );
	}

	private static function listing_path( $sku ) {
		return '/listings/2021-08-01/items/' . rawurlencode( OLA_Settings::get( 'seller_id' ) ) . '/' . rawurlencode( $sku );
	}

	public static function put_listing( $sku, $product_type, $requirements, $attributes, $validate_only = false ) {
		$query = array(
			'marketplaceIds' => OLA_Settings::get( 'marketplace_id' ),
			'includedData'   => 'issues',
		);
		if ( $validate_only ) {
			$query['mode'] = 'VALIDATION_PREVIEW';
		}
		return self::request(
			'PUT',
			self::listing_path( $sku ),
			$query,
			array(
				'productType'  => $product_type,
				'requirements' => $requirements,
				'attributes'   => $attributes,
			)
		);
	}

	public static function patch_listing( $sku, $product_type, $patches ) {
		return self::request(
			'PATCH',
			self::listing_path( $sku ),
			array(
				'marketplaceIds' => OLA_Settings::get( 'marketplace_id' ),
				'includedData'   => 'issues',
			),
			array(
				'productType' => $product_type,
				'patches'     => $patches,
			)
		);
	}

	public static function get_listing( $sku ) {
		return self::request(
			'GET',
			self::listing_path( $sku ),
			array(
				'marketplaceIds' => OLA_Settings::get( 'marketplace_id' ),
				'includedData'   => 'summaries,issues,offers,fulfillmentAvailability',
			)
		);
	}

	public static function delete_listing( $sku ) {
		return self::request( 'DELETE', self::listing_path( $sku ), array( 'marketplaceIds' => OLA_Settings::get( 'marketplace_id' ) ) );
	}

	public static function search_product_types( $keywords ) {
		return self::request(
			'GET',
			'/definitions/2020-09-01/productTypes',
			array(
				'marketplaceIds' => OLA_Settings::get( 'marketplace_id' ),
				'keywords'       => $keywords,
			)
		);
	}

	/**
	 * Looks up catalog items by identifier (UPC, EAN, ISBN, GTIN) or by keywords.
	 */
	public static function search_catalog( $term, $identifier_type = '' ) {
		$query = array(
			'marketplaceIds' => OLA_Settings::get( 'marketplace_id' ),
			'includedData'   => 'summaries,images',
			'pageSize'       => 10,
		);
		if ( $identifier_type ) {
			$query['identifiers']     = $term;
			$query['identifiersType'] = strtoupper( $identifier_type );
		} else {
			$query['keywords'] = $term;
		}
		return self::request( 'GET', '/catalog/2022-04-01/items', $query );
	}

	/**
	 * Restricted Data Token so order requests include buyer name and full address.
	 * Requires the "Direct-to-Consumer Shipping" role on the app; returns WP_Error otherwise.
	 */
	public static function orders_rdt() {
		$response = self::request(
			'POST',
			'/tokens/2021-03-01/restrictedDataToken',
			array(),
			array(
				'restrictedResources' => array(
					array(
						'method'       => 'GET',
						'path'         => '/orders/v0/orders',
						'dataElements' => array( 'buyerInfo', 'shippingAddress' ),
					),
				),
			)
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		return isset( $response['restrictedDataToken'] ) ? $response['restrictedDataToken'] : new WP_Error( 'ola_rdt', 'No restricted data token returned.' );
	}

	public static function get_orders( $query, $rdt = null ) {
		return self::request( 'GET', '/orders/v0/orders', $query, null, $rdt );
	}

	public static function get_order_items( $amazon_order_id ) {
		$items = array();
		$query = array();
		do {
			$response = self::request( 'GET', '/orders/v0/orders/' . rawurlencode( $amazon_order_id ) . '/orderItems', $query );
			if ( is_wp_error( $response ) ) {
				return $response;
			}
			$payload = isset( $response['payload'] ) ? $response['payload'] : array();
			$items   = array_merge( $items, isset( $payload['OrderItems'] ) ? $payload['OrderItems'] : array() );
			$query   = ! empty( $payload['NextToken'] ) ? array( 'NextToken' => $payload['NextToken'] ) : array();
		} while ( $query );

		return $items;
	}

	public static function confirm_shipment( $amazon_order_id, $package ) {
		return self::request( 'POST', '/orders/v0/orders/' . rawurlencode( $amazon_order_id ) . '/shipmentConfirmation', array(), $package );
	}
}
