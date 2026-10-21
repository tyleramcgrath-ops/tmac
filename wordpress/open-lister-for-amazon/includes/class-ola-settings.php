<?php
/**
 * Plugin settings: Amazon credentials, marketplace, and sync behaviour.
 * Everything lives in a single option, `ola_settings`.
 */

defined( 'ABSPATH' ) || exit;

class OLA_Settings {

	const OPTION = 'ola_settings';

	/** Fields that are never echoed back into the form. */
	const SECRET_FIELDS = array( 'lwa_client_secret', 'refresh_token' );

	private static $cache = null;

	/**
	 * Amazon marketplaces: id => [label, region, currency, language tag].
	 */
	public static function marketplaces() {
		return array(
			'ATVPDKIKX0DER'  => array( 'United States', 'na', 'USD', 'en_US' ),
			'A2EUQ1WTGCTBG2' => array( 'Canada', 'na', 'CAD', 'en_CA' ),
			'A1AM78C64UM0Y8' => array( 'Mexico', 'na', 'MXN', 'es_MX' ),
			'A2Q3Y263D00KWC' => array( 'Brazil', 'na', 'BRL', 'pt_BR' ),
			'A1F83G8C2ARO7P' => array( 'United Kingdom', 'eu', 'GBP', 'en_GB' ),
			'A28R8C7NBKEWEA' => array( 'Ireland', 'eu', 'EUR', 'en_IE' ),
			'A1PA6795UKMFR9' => array( 'Germany', 'eu', 'EUR', 'de_DE' ),
			'A13V1IB3VIYZZH' => array( 'France', 'eu', 'EUR', 'fr_FR' ),
			'APJ6JRA9NG5V4'  => array( 'Italy', 'eu', 'EUR', 'it_IT' ),
			'A1RKKUPIHCS9HS' => array( 'Spain', 'eu', 'EUR', 'es_ES' ),
			'A1805IZSGTT6HS' => array( 'Netherlands', 'eu', 'EUR', 'nl_NL' ),
			'AMEN7PMS3EDWL'  => array( 'Belgium', 'eu', 'EUR', 'fr_BE' ),
			'A2NODRKZP88ZB9' => array( 'Sweden', 'eu', 'SEK', 'sv_SE' ),
			'A1C3SOZRARQ6R3' => array( 'Poland', 'eu', 'PLN', 'pl_PL' ),
			'A33AVAJ2PDY3EV' => array( 'Turkey', 'eu', 'TRY', 'tr_TR' ),
			'A2VIGQ35RCS4UG' => array( 'United Arab Emirates', 'eu', 'AED', 'en_AE' ),
			'A17E79C6D8DWNP' => array( 'Saudi Arabia', 'eu', 'SAR', 'en_AE' ),
			'ARBP9OOSHTCHU'  => array( 'Egypt', 'eu', 'EGP', 'en_AE' ),
			'A21TJRUUN4KGV'  => array( 'India', 'eu', 'INR', 'en_IN' ),
			'A1VC38T7YXB528' => array( 'Japan', 'fe', 'JPY', 'ja_JP' ),
			'A39IBJ37TRP1C6' => array( 'Australia', 'fe', 'AUD', 'en_AU' ),
			'A19VAU5U5O7RUS' => array( 'Singapore', 'fe', 'SGD', 'en_SG' ),
		);
	}

	public static function defaults() {
		return array(
			'marketplace_id'      => 'ATVPDKIKX0DER',
			'seller_id'           => '',
			'lwa_client_id'       => '',
			'lwa_client_secret'   => '',
			'refresh_token'       => '',
			'language_tag'        => '',
			'default_condition'   => 'new_new',
			'default_brand'       => '',
			'handling_time'       => 2,
			'price_adjust_type'   => 'none',
			'price_adjust_value'  => 0,
			'sync_price'          => 1,
			'sync_stock'          => 1,
			'stock_buffer'        => 0,
			'import_orders'       => 1,
			'order_days_back'     => 3,
			'reduce_stock_fba'    => 0,
			'skip_pending_orders' => 1,
			'default_carrier'     => 'USPS',
			'debug_log'           => 0,
		);
	}

	public static function init() {
		add_action( 'admin_init', array( __CLASS__, 'register' ) );
	}

	public static function all() {
		if ( null === self::$cache ) {
			self::$cache = wp_parse_args( (array) get_option( self::OPTION, array() ), self::defaults() );
		}
		return self::$cache;
	}

	public static function get( $key ) {
		$all = self::all();
		return isset( $all[ $key ] ) ? $all[ $key ] : null;
	}

	public static function flush_cache() {
		self::$cache = null;
	}

	public static function is_connected() {
		return self::get( 'lwa_client_id' ) && self::get( 'lwa_client_secret' ) && self::get( 'refresh_token' ) && self::get( 'seller_id' );
	}

	public static function marketplace() {
		$all = self::marketplaces();
		$id  = self::get( 'marketplace_id' );
		return isset( $all[ $id ] ) ? $all[ $id ] : $all['ATVPDKIKX0DER'];
	}

	public static function region() {
		return self::marketplace()[1];
	}

	public static function currency() {
		return self::marketplace()[2];
	}

	public static function language_tag() {
		$override = self::get( 'language_tag' );
		return $override ? $override : self::marketplace()[3];
	}

	public static function register() {
		register_setting(
			'ola_settings_group',
			self::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize' ),
			)
		);
	}

	public static function sanitize( $input ) {
		$current  = self::all();
		$defaults = self::defaults();
		$input    = is_array( $input ) ? $input : array();
		$clean    = array();

		foreach ( $defaults as $key => $default ) {
			$value = isset( $input[ $key ] ) ? $input[ $key ] : null;

			if ( in_array( $key, self::SECRET_FIELDS, true ) ) {
				// An empty secret field means "keep what is saved".
				$clean[ $key ] = ( null === $value || '' === trim( $value ) ) ? $current[ $key ] : trim( sanitize_text_field( $value ) );
				continue;
			}

			if ( is_int( $default ) && in_array( $key, array( 'sync_price', 'sync_stock', 'import_orders', 'reduce_stock_fba', 'skip_pending_orders', 'debug_log' ), true ) ) {
				$clean[ $key ] = empty( $value ) ? 0 : 1;
			} elseif ( 'price_adjust_value' === $key ) {
				$clean[ $key ] = (float) $value;
			} elseif ( is_int( $default ) ) {
				$clean[ $key ] = max( 0, (int) $value );
			} else {
				$clean[ $key ] = null === $value ? $default : trim( sanitize_text_field( $value ) );
			}
		}

		if ( ! isset( self::marketplaces()[ $clean['marketplace_id'] ] ) ) {
			$clean['marketplace_id'] = $defaults['marketplace_id'];
		}
		if ( ! in_array( $clean['price_adjust_type'], array( 'none', 'percent', 'fixed' ), true ) ) {
			$clean['price_adjust_type'] = 'none';
		}

		// Credentials changed: drop the cached access token.
		if ( $clean['lwa_client_id'] !== $current['lwa_client_id'] || $clean['refresh_token'] !== $current['refresh_token'] ) {
			delete_transient( OLA_API::TOKEN_TRANSIENT );
		}

		self::$cache = null;
		return $clean;
	}

	/**
	 * Applies the store-wide price rule (markup or discount) to a WooCommerce price.
	 */
	public static function adjust_price( $price ) {
		$price = (float) $price;
		$value = (float) self::get( 'price_adjust_value' );

		switch ( self::get( 'price_adjust_type' ) ) {
			case 'percent':
				$price = $price * ( 1 + $value / 100 );
				break;
			case 'fixed':
				$price = $price + $value;
				break;
		}

		return round( max( 0, $price ), 2 );
	}
}
