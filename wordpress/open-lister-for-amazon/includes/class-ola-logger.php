<?php
/**
 * Thin wrapper over the WooCommerce logger. Entries appear under
 * WooCommerce > Status > Logs with the source "open-lister-amazon".
 */

defined( 'ABSPATH' ) || exit;

class OLA_Logger {

	const SOURCE = 'open-lister-amazon';

	public static function info( $message, $context = array() ) {
		self::log( 'info', $message, $context );
	}

	public static function error( $message, $context = array() ) {
		self::log( 'error', $message, $context );
	}

	public static function debug( $message, $context = array() ) {
		if ( OLA_Settings::get( 'debug_log' ) ) {
			self::log( 'debug', $message, $context );
		}
	}

	private static function log( $level, $message, $context ) {
		if ( ! function_exists( 'wc_get_logger' ) ) {
			return;
		}
		if ( $context ) {
			$message .= ' ' . wp_json_encode( $context );
		}
		wc_get_logger()->log( $level, $message, array( 'source' => self::SOURCE ) );
	}
}
