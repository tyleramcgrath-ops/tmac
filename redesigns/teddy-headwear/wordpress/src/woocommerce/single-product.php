<?php
/**
 * Product page. site.js draws the gallery, options, add to cart, the city story and
 * related products from the WooCommerce catalog. The title, price and description are
 * printed here too, so the page reads correctly before the script runs and for search engines.
 */
defined( 'ABSPATH' ) || exit;

$teddy_product = wc_get_product( get_queried_object_id() );
teddy_body( array( 'page' => 'product', 'id' => $teddy_product ? $teddy_product->get_slug() : '' ) );
get_header();
?>
<div class="wrap" id="pdp">
	<?php if ( $teddy_product ) : ?>
		<div class="pdp" style="padding-top:calc(var(--hdr) + 40px)">
			<div class="gallery__main"><?php echo $teddy_product->get_image( 'large' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
			<div class="buy">
				<h1 class="display"><?php echo esc_html( $teddy_product->get_name() ); ?></h1>
				<div class="buy__price"><?php echo wp_kses_post( $teddy_product->get_price_html() ); ?></div>
				<div class="lede"><?php echo wp_kses_post( wpautop( $teddy_product->get_short_description() ) ); ?></div>
			</div>
		</div>
	<?php endif; ?>
</div>
<div id="after"></div>
<?php
add_action( 'teddy_after_main', function () use ( $teddy_product ) {
	if ( ! $teddy_product ) {
		return;
	}
	echo '<div class="mbar" id="mbar"><span id="mbarTxt">' . esc_html( $teddy_product->get_name() ) . '</span><button class="btn btn--sm" id="mbarBtn">' . esc_html__( 'Add to cart', 'teddy' ) . '</button></div>';
	$ld = array(
		'@context'    => 'https://schema.org',
		'@type'       => 'Product',
		'name'        => $teddy_product->get_name(),
		'description' => wp_strip_all_tags( $teddy_product->get_short_description() ),
		'image'       => wp_get_attachment_image_url( $teddy_product->get_image_id(), 'large' ),
		'sku'         => $teddy_product->get_sku(),
		'brand'       => array( '@type' => 'Brand', 'name' => get_bloginfo( 'name' ) ),
		'offers'      => array(
			'@type'         => 'Offer',
			'price'         => wc_format_decimal( $teddy_product->get_price(), wc_get_price_decimals() ),
			'priceCurrency' => get_woocommerce_currency(),
			'availability'  => 'https://schema.org/' . ( $teddy_product->is_in_stock() ? 'InStock' : 'OutOfStock' ),
			'url'           => get_permalink( $teddy_product->get_id() ),
		),
	);
	echo '<script type="application/ld+json">' . wp_json_encode( $ld ) . '</script>';
} );
get_footer();
