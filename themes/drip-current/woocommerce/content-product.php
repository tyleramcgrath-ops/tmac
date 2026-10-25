<?php
/**
 * Product card in shop, category, related and upsell grids.
 *
 * Overrides woocommerce/templates/content-product.php so every grid uses the
 * same card as the homepage tee edit.
 *
 * @package drip-current
 * @version 9.4.0
 */

defined( 'ABSPATH' ) || exit;

global $product;

if ( ! is_a( $product, WC_Product::class ) || ! $product->is_visible() ) {
	return;
}
?>
<li <?php wc_product_class( '', $product ); ?>>
	<?php drip_current_product_card( $product ); ?>
</li>
