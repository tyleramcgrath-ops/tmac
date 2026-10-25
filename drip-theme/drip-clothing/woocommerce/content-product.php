<?php
/**
 * A product in any WooCommerce loop (shortcodes, widgets, related items).
 *
 * Overrides woocommerce/templates/content-product.php.
 *
 * @package drip
 */

defined( 'ABSPATH' ) || exit;

global $product;

if ( empty( $product ) || ! $product->is_visible() ) {
	return;
}
echo '<li class="drip-loop-item">';
drip_card( $product );
echo '</li>';
