<?php
/**
 * Bootstraps every component once WooCommerce is available.
 */

defined( 'ABSPATH' ) || exit;

class OLA_Plugin {

	const ORDER_IMPORT_HOOK = 'ola_import_orders';

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			add_action( 'admin_notices', array( $this, 'missing_woocommerce_notice' ) );
			return;
		}

		OLA_Settings::init();
		OLA_Listings::init();
		OLA_Product_Admin::init();
		OLA_Orders::init();
		OLA_Research::init();
		OLA_Admin_Pages::init();

		add_filter( 'cron_schedules', array( __CLASS__, 'cron_schedules' ) );
		add_action( 'init', array( __CLASS__, 'schedule_order_import' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( OLA_FILE ), array( $this, 'action_links' ) );
	}

	public function missing_woocommerce_notice() {
		echo '<div class="notice notice-error"><p>' . esc_html__( 'Open Lister for Amazon needs WooCommerce to be installed and active.', 'open-lister-amazon' ) . '</p></div>';
	}

	public function action_links( $links ) {
		array_unshift( $links, '<a href="' . esc_url( admin_url( 'admin.php?page=ola-settings' ) ) . '">' . esc_html__( 'Settings', 'open-lister-amazon' ) . '</a>' );
		return $links;
	}

	public static function cron_schedules( $schedules ) {
		$schedules['ola_fifteen_minutes'] = array(
			'interval' => 15 * MINUTE_IN_SECONDS,
			'display'  => __( 'Every 15 minutes', 'open-lister-amazon' ),
		);
		return $schedules;
	}

	public static function schedule_order_import() {
		$enabled = OLA_Settings::get( 'import_orders' ) && OLA_Settings::is_connected();
		$next    = wp_next_scheduled( self::ORDER_IMPORT_HOOK );

		if ( $enabled && ! $next ) {
			wp_schedule_event( time() + MINUTE_IN_SECONDS, 'ola_fifteen_minutes', self::ORDER_IMPORT_HOOK );
		} elseif ( ! $enabled && $next ) {
			wp_clear_scheduled_hook( self::ORDER_IMPORT_HOOK );
		}
	}

	public static function activate() {
		add_filter( 'cron_schedules', array( __CLASS__, 'cron_schedules' ) );
	}

	public static function deactivate() {
		wp_clear_scheduled_hook( self::ORDER_IMPORT_HOOK );
		if ( function_exists( 'as_unschedule_all_actions' ) ) {
			as_unschedule_all_actions( '', array(), OLA_Listings::GROUP );
		}
	}
}
