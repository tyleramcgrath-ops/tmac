<?php
/**
 * Listing lifecycle: submit, sync price/stock, refresh status, end.
 * Work runs in the background through WooCommerce's Action Scheduler.
 */

defined( 'ABSPATH' ) || exit;

class OLA_Listings {

	const GROUP = 'open-lister-amazon';

	const STATUS_LABELS = array(
		'queued'    => 'Queued',
		'submitted' => 'Submitted',
		'active'    => 'Active',
		'inactive'  => 'Inactive',
		'error'     => 'Error',
		'ended'     => 'Ended',
	);

	public static function init() {
		add_action( 'ola_submit_listing', array( __CLASS__, 'submit' ) );
		add_action( 'ola_sync_offer', array( __CLASS__, 'sync_offer' ) );
		add_action( 'ola_refresh_status', array( __CLASS__, 'refresh_status' ) );
		add_action( 'ola_end_listing', array( __CLASS__, 'end' ) );

		// Keep Amazon in step with WooCommerce.
		add_action( 'woocommerce_update_product', array( __CLASS__, 'on_product_change' ) );
		add_action( 'woocommerce_update_product_variation', array( __CLASS__, 'on_product_change' ) );
		add_action( 'woocommerce_product_set_stock', array( __CLASS__, 'on_stock_change' ) );
		add_action( 'woocommerce_variation_set_stock', array( __CLASS__, 'on_stock_change' ) );
	}

	/* ---------------------------------------------------------------------
	 * State helpers
	 * ------------------------------------------------------------------- */

	public static function status( $product_id ) {
		return get_post_meta( $product_id, '_ola_status', true );
	}

	public static function set_status( $product_id, $status, $issues = null ) {
		update_post_meta( $product_id, '_ola_status', $status );
		update_post_meta( $product_id, '_ola_last_sync', time() );
		if ( null !== $issues ) {
			update_post_meta( $product_id, '_ola_issues', $issues );
		}
	}

	public static function is_listed( $product_id ) {
		return in_array( self::status( $product_id ), array( 'submitted', 'active', 'inactive' ), true );
	}

	private static function enqueue( $hook, $product_id, $delay = 0 ) {
		$args = array( (int) $product_id );
		if ( as_has_scheduled_action( $hook, $args, self::GROUP ) ) {
			return;
		}
		if ( $delay ) {
			as_schedule_single_action( time() + $delay, $hook, $args, self::GROUP );
		} else {
			as_enqueue_async_action( $hook, $args, self::GROUP );
		}
	}

	/** Queues a product (or a variable product family) for listing. */
	public static function queue_submit( $product_id ) {
		update_post_meta( $product_id, '_ola_enabled', 'yes' );
		self::set_status( $product_id, 'queued', array() );
		self::enqueue( 'ola_submit_listing', $product_id );
	}

	public static function queue_sync( $product_id ) {
		self::enqueue( 'ola_sync_offer', $product_id );
	}

	public static function queue_refresh( $product_id, $delay = 0 ) {
		self::enqueue( 'ola_refresh_status', $product_id, $delay );
	}

	public static function queue_end( $product_id ) {
		self::enqueue( 'ola_end_listing', $product_id );
	}

	/** Product IDs that hold an Amazon offer (variations for a variable product). */
	private static function offer_ids( $product ) {
		if ( $product->is_type( 'variable' ) ) {
			return array_values(
				array_filter(
					$product->get_children(),
					function ( $id ) {
						return OLA_Listings::is_listed( $id );
					}
				)
			);
		}
		return self::is_listed( $product->get_id() ) ? array( $product->get_id() ) : array();
	}

	/* ---------------------------------------------------------------------
	 * Change listeners
	 * ------------------------------------------------------------------- */

	public static function on_product_change( $product_id ) {
		if ( ( OLA_Settings::get( 'sync_price' ) || OLA_Settings::get( 'sync_stock' ) ) && self::is_listed( $product_id ) ) {
			self::queue_sync( $product_id );
		}
	}

	public static function on_stock_change( $product ) {
		if ( OLA_Settings::get( 'sync_stock' ) && self::is_listed( $product->get_id() ) ) {
			self::queue_sync( $product->get_id() );
		}
	}

	/* ---------------------------------------------------------------------
	 * Jobs
	 * ------------------------------------------------------------------- */

	public static function submit( $product_id ) {
		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return;
		}

		$payloads = OLA_Listing_Builder::build( $product );
		if ( is_wp_error( $payloads ) ) {
			self::set_status( $product_id, 'error', array( self::issue( $payloads->get_error_message() ) ) );
			return;
		}

		$all_ok = true;
		foreach ( $payloads as $payload ) {
			list( $id, $sku, $product_type, $requirements, $attributes ) = $payload;

			$response = OLA_API::put_listing( $sku, $product_type, $requirements, $attributes );
			update_post_meta( $id, '_ola_listed_sku', $sku );
			update_post_meta( $id, '_ola_amazon_product_type', $product_type );

			if ( is_wp_error( $response ) ) {
				self::set_status( $id, 'error', array( self::issue( $response->get_error_message() ) ) );
				$all_ok = false;
				continue;
			}

			$issues = isset( $response['issues'] ) ? $response['issues'] : array();
			if ( isset( $response['status'] ) && 'INVALID' === $response['status'] ) {
				self::set_status( $id, 'error', $issues );
				$all_ok = false;
				continue;
			}

			update_post_meta( $id, '_ola_submission_id', isset( $response['submissionId'] ) ? $response['submissionId'] : '' );
			self::set_status( $id, 'submitted', $issues );
			OLA_Logger::info( "Submitted SKU {$sku} as {$product_type}" );

			// Amazon processes submissions asynchronously; check back shortly.
			self::queue_refresh( $id, 5 * MINUTE_IN_SECONDS );
		}

		if ( $product->is_type( 'variable' ) && $all_ok && 'create' !== OLA_Listing_Builder::mode( $product ) ) {
			// Offer-only families have no parent listing; reflect the children on the parent row.
			self::set_status( $product_id, 'submitted', array() );
		}
	}

	public static function sync_offer( $product_id ) {
		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return;
		}

		foreach ( self::offer_ids( $product ) as $id ) {
			$item = wc_get_product( $id );
			$sku  = get_post_meta( $id, '_ola_listed_sku', true );
			if ( ! $item || ! $sku ) {
				continue;
			}

			$patches = array();
			if ( OLA_Settings::get( 'sync_price' ) ) {
				$patches[] = array(
					'op'    => 'replace',
					'path'  => '/attributes/purchasable_offer',
					'value' => OLA_Listing_Builder::offer_attribute( $item ),
				);
			}
			if ( OLA_Settings::get( 'sync_stock' ) && ! OLA_Listing_Builder::is_fba( $item ) ) {
				$patches[] = array(
					'op'    => 'replace',
					'path'  => '/attributes/fulfillment_availability',
					'value' => OLA_Listing_Builder::fulfillment_attribute( $item ),
				);
			}
			if ( ! $patches ) {
				continue;
			}

			$product_type = get_post_meta( $id, '_ola_amazon_product_type', true );
			$response     = OLA_API::patch_listing( $sku, $product_type ? $product_type : OLA_Listing_Builder::OFFER_PRODUCT_TYPE, $patches );

			if ( is_wp_error( $response ) ) {
				$status = $response->get_error_data();
				if ( isset( $status['status'] ) && 429 === $status['status'] ) {
					self::enqueue( 'ola_sync_offer', $id, MINUTE_IN_SECONDS );
				}
				update_post_meta( $id, '_ola_issues', array( self::issue( $response->get_error_message() ) ) );
				continue;
			}

			update_post_meta( $id, '_ola_last_sync', time() );
			if ( ! empty( $response['issues'] ) ) {
				update_post_meta( $id, '_ola_issues', $response['issues'] );
			}
		}
	}

	public static function refresh_status( $product_id ) {
		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return;
		}

		if ( $product->is_type( 'variable' ) ) {
			foreach ( $product->get_children() as $child_id ) {
				if ( self::is_listed( $child_id ) || 'error' === self::status( $child_id ) ) {
					self::refresh_status( $child_id );
				}
			}
			if ( 'create' !== OLA_Listing_Builder::mode( $product ) ) {
				return;
			}
		}

		$sku = get_post_meta( $product_id, '_ola_listed_sku', true );
		if ( ! $sku ) {
			return;
		}

		$response = OLA_API::get_listing( $sku );
		if ( is_wp_error( $response ) ) {
			$data = $response->get_error_data();
			if ( isset( $data['status'] ) && 404 === $data['status'] ) {
				// Still processing on Amazon's side, or the listing was removed.
				self::set_status( $product_id, 'submitted' === self::status( $product_id ) ? 'submitted' : 'ended' );
			}
			return;
		}

		$summary = ! empty( $response['summaries'][0] ) ? $response['summaries'][0] : array();
		$issues  = isset( $response['issues'] ) ? $response['issues'] : array();
		$flags   = isset( $summary['status'] ) ? (array) $summary['status'] : array();

		if ( ! empty( $summary['asin'] ) ) {
			update_post_meta( $product_id, '_ola_asin', $summary['asin'] );
		}

		$has_error = false;
		foreach ( $issues as $issue ) {
			if ( isset( $issue['severity'] ) && 'ERROR' === $issue['severity'] ) {
				$has_error = true;
			}
		}

		if ( in_array( 'BUYABLE', $flags, true ) ) {
			$status = 'active';
		} elseif ( $has_error ) {
			$status = 'error';
		} else {
			$status = $flags ? 'inactive' : 'submitted';
		}

		self::set_status( $product_id, $status, $issues );

		if ( $product->get_parent_id() && 'active' === $status ) {
			self::set_status( $product->get_parent_id(), 'active' );
		}
	}

	public static function end( $product_id ) {
		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return;
		}

		$ids = $product->is_type( 'variable' ) ? array_merge( $product->get_children(), array( $product_id ) ) : array( $product_id );

		foreach ( $ids as $id ) {
			$sku = get_post_meta( $id, '_ola_listed_sku', true );
			if ( ! $sku ) {
				continue;
			}
			$response = OLA_API::delete_listing( $sku );
			if ( is_wp_error( $response ) ) {
				update_post_meta( $id, '_ola_issues', array( self::issue( $response->get_error_message() ) ) );
				continue;
			}
			delete_post_meta( $id, '_ola_listed_sku' );
			self::set_status( $id, 'ended', array() );
			OLA_Logger::info( "Ended listing for SKU {$sku}" );
		}

		update_post_meta( $product_id, '_ola_enabled', 'no' );
		self::set_status( $product_id, 'ended', array() );
	}

	/**
	 * Runs a VALIDATION_PREVIEW submission without changing anything on Amazon.
	 *
	 * @return array|WP_Error List of [sku, status, issues].
	 */
	public static function validate( $product_id ) {
		$product  = wc_get_product( $product_id );
		$payloads = $product ? OLA_Listing_Builder::build( $product ) : new WP_Error( 'ola_missing', 'Product not found.' );
		if ( is_wp_error( $payloads ) ) {
			return $payloads;
		}

		$results = array();
		foreach ( $payloads as $payload ) {
			list( , $sku, $product_type, $requirements, $attributes ) = $payload;
			$response = OLA_API::put_listing( $sku, $product_type, $requirements, $attributes, true );
			if ( is_wp_error( $response ) ) {
				return $response;
			}
			$results[] = array(
				'sku'    => $sku,
				'status' => isset( $response['status'] ) ? $response['status'] : '',
				'issues' => isset( $response['issues'] ) ? $response['issues'] : array(),
			);
		}
		return $results;
	}

	private static function issue( $message ) {
		return array(
			'severity' => 'ERROR',
			'message'  => $message,
		);
	}
}
