<?php
/**
 * Removes the plugin's settings and its own bookkeeping. Search titles and
 * descriptions it saved in All in One SEO stay, because they belong to the products now.
 *
 * @package comfy-product-seo
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'cps_settings' );
foreach ( array( '_cps_title', '_cps_desc', '_cps_fallback', '_cps_guides', '_cps_optimized', '_cps_linked_products' ) as $key ) {
	delete_post_meta_by_key( $key );
}
