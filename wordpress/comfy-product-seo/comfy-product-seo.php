<?php
/**
 * Plugin Name: Comfy Product SEO
 * Description: One-button search optimization for Amazon affiliate products: Product schema with your own Comfy Meter review, unique search titles and descriptions in All in One SEO, image alt text, and links from each product to the guides that feature it.
 * Version: 1.0.0
 * Requires at least: 6.2
 * Requires PHP: 7.4
 * Requires Plugins: woocommerce
 * Author: Comfy Humans
 * License: GPLv2 or later
 * Text Domain: comfy-product-seo
 *
 * @package comfy-product-seo
 */

defined( 'ABSPATH' ) || exit;

define( 'CPS_VERSION', '1.0.0' );
define( 'CPS_DIR', plugin_dir_path( __FILE__ ) );

require_once CPS_DIR . 'includes/class-cps-data.php';
require_once CPS_DIR . 'includes/class-cps-optimizer.php';
require_once CPS_DIR . 'includes/class-cps-frontend.php';
require_once CPS_DIR . 'includes/class-cps-admin.php';

/**
 * Plugin settings with defaults.
 */
function cps_settings() {
	$defaults = array(
		'schema'      => 1, // Product schema on product pages.
		'guides_box'  => 1, // "Featured in our guides" box on product pages.
		'auto'        => 1, // Optimize products when they are saved or imported.
		'overwrite'   => 0, // Replace search titles/descriptions someone wrote by hand.
	);
	return wp_parse_args( (array) get_option( 'cps_settings', array() ), $defaults );
}

add_action(
	'plugins_loaded',
	function () {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}
		CPS_Optimizer::init();
		CPS_Frontend::init();
		if ( is_admin() ) {
			CPS_Admin::init();
		}
	}
);
