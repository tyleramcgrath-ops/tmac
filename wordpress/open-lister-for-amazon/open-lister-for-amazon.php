<?php
/**
 * Plugin Name:       Open Lister for Amazon
 * Description:       List WooCommerce products on Amazon, keep price and stock in sync, and import Amazon orders into WooCommerce. Free and open source. Connects directly to Amazon's Selling Partner API with your own (free) private developer credentials.
 * Version:           1.0.0
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * Author:            Open Lister contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       open-lister-amazon
 * Requires Plugins:  woocommerce
 * WC requires at least: 7.0
 */

defined( 'ABSPATH' ) || exit;

define( 'OLA_VERSION', '1.0.0' );
define( 'OLA_FILE', __FILE__ );
define( 'OLA_DIR', plugin_dir_path( __FILE__ ) );
define( 'OLA_URL', plugin_dir_url( __FILE__ ) );

require_once OLA_DIR . 'includes/class-ola-logger.php';
require_once OLA_DIR . 'includes/class-ola-settings.php';
require_once OLA_DIR . 'includes/class-ola-api.php';
require_once OLA_DIR . 'includes/class-ola-listing-builder.php';
require_once OLA_DIR . 'includes/class-ola-listings.php';
require_once OLA_DIR . 'includes/class-ola-product-admin.php';
require_once OLA_DIR . 'includes/class-ola-orders.php';
require_once OLA_DIR . 'includes/class-ola-research.php';
require_once OLA_DIR . 'includes/class-ola-admin-pages.php';
require_once OLA_DIR . 'includes/class-ola-plugin.php';

// Works with WooCommerce's High-Performance Order Storage.
add_action(
	'before_woocommerce_init',
	function () {
		if ( class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', OLA_FILE, true );
		}
	}
);

register_activation_hook( OLA_FILE, array( 'OLA_Plugin', 'activate' ) );
register_deactivation_hook( OLA_FILE, array( 'OLA_Plugin', 'deactivate' ) );

add_action( 'plugins_loaded', array( 'OLA_Plugin', 'instance' ) );
