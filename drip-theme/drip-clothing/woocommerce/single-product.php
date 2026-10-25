<?php
/**
 * A single product.
 *
 * Overrides woocommerce/templates/single-product.php. The add-to-cart form
 * is WooCommerce's own, so variations, stock, and quantity rules still work.
 *
 * @package drip
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' );

while ( have_posts() ) :
	the_post();
	global $product;
	$product = wc_get_product( get_the_ID() );

	$drip_name    = drip_split_name( $product->get_name() );
	$drip_images  = array_values( array_filter( array_merge( array( $product->get_image_id() ), $product->get_gallery_image_ids() ) ) );
	$drip_off     = drip_percent_off( $product );
	$drip_soon    = drip_is_coming_soon( $product );
	$drip_cat     = drip_category_name( $product );
	$drip_short   = $product->get_short_description();
	$drip_long    = $product->get_description();
	$drip_related = function_exists( 'wc_get_related_products' ) ? array_filter( array_map( 'wc_get_product', wc_get_related_products( $product->get_id(), 4 ) ) ) : array();
	?>
	<main id="main" class="product-page light">
		<div class="wrap">
			<?php woocommerce_breadcrumb(); ?>
			<?php do_action( 'woocommerce_before_single_product' ); // Prints notices. ?>

			<div id="product-<?php the_ID(); ?>" <?php wc_product_class( 'pdp', $product ); ?>>
				<div class="pdp-gallery" data-gallery>
					<div class="pdp-stage tone-<?php echo esc_attr( drip_tone( $product ) ); ?>">
						<?php foreach ( $drip_images as $drip_i => $drip_img ) : ?>
							<figure class="pdp-frame<?php echo 0 === $drip_i ? ' is-on' : ''; ?>" data-frame="<?php echo (int) $drip_i; ?>">
								<?php
								echo wp_get_attachment_image( // phpcs:ignore WordPress.Security.EscapeOutput
									$drip_img,
									'woocommerce_single',
									false,
									array(
										'class'   => 'pdp-img',
										'alt'     => $product->get_name(),
										'loading' => 0 === $drip_i ? 'eager' : 'lazy',
										'sizes'   => '(max-width: 900px) 100vw, 55vw',
									)
								);
								?>
							</figure>
						<?php endforeach; ?>
						<?php if ( ! $drip_images ) : ?>
							<figure class="pdp-frame is-on"><?php echo wc_placeholder_img( 'woocommerce_single' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></figure>
						<?php endif; ?>
						<?php if ( $drip_soon ) : ?>
							<span class="card-badge is-soon">Coming soon</span>
						<?php elseif ( $drip_off ) : ?>
							<span class="card-badge"><?php echo esc_html( '−' . $drip_off . '%' ); ?></span>
						<?php endif; ?>
					</div>
					<?php if ( count( $drip_images ) > 1 ) : ?>
						<div class="pdp-thumbs" role="group" aria-label="Product images">
							<?php foreach ( $drip_images as $drip_i => $drip_img ) : ?>
								<button type="button" class="pdp-thumb<?php echo 0 === $drip_i ? ' is-on' : ''; ?>" data-show="<?php echo (int) $drip_i; ?>" aria-label="<?php echo esc_attr( 'Show image ' . ( $drip_i + 1 ) ); ?>">
									<?php echo wp_get_attachment_image( $drip_img, 'woocommerce_gallery_thumbnail', false, array( 'alt' => '' ) ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
								</button>
							<?php endforeach; ?>
						</div>
					<?php endif; ?>
				</div>

				<div class="pdp-info">
					<div class="pdp-sticky">
						<p class="eyebrow"><?php echo esc_html( implode( ' · ', array_filter( array( $drip_cat, $drip_name['color'] ) ) ) ); ?></p>
						<h1 class="pdp-title"><?php echo esc_html( $drip_name['title'] ); ?></h1>
						<div class="pdp-price">
							<?php if ( $drip_soon ) : ?>
								<span class="price-soon">Coming in the next drop</span>
							<?php else : ?>
								<?php echo wp_kses_post( $product->get_price_html() ); ?>
								<?php if ( $drip_off ) : ?>
									<span class="pdp-save"><?php echo esc_html( 'Save ' . $drip_off . '%' ); ?></span>
								<?php endif; ?>
							<?php endif; ?>
						</div>

						<?php if ( $drip_short ) : ?>
							<div class="pdp-short"><?php echo wp_kses_post( wpautop( $drip_short ) ); ?></div>
						<?php endif; ?>

						<div class="pdp-buy">
							<?php if ( $drip_soon ) : ?>
								<a class="btn btn-ink btn-block" href="#join">Tell me when it drops <?php echo drip_icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
							<?php else : ?>
								<?php woocommerce_template_single_add_to_cart(); ?>
							<?php endif; ?>
						</div>

						<ul class="pdp-notes">
							<li><?php echo drip_icon( 'shirt', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Back print, clean front</li>
							<li><?php echo drip_icon( 'wave', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Drawn from the swell</li>
							<li><?php echo drip_icon( 'mail', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><a href="<?php echo drip_url( 'contact' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Questions? Ask us</a></li>
						</ul>

						<div class="pdp-more">
							<?php if ( $drip_long ) : ?>
								<details open>
									<summary>Description</summary>
									<div class="entry"><?php echo wp_kses_post( wpautop( $drip_long ) ); ?></div>
								</details>
							<?php endif; ?>
							<?php if ( $product->has_attributes() || $product->get_sku() ) : ?>
								<details>
									<summary>Details</summary>
									<div class="entry">
										<?php if ( $product->get_sku() ) : ?>
											<p class="pdp-sku">SKU <?php echo esc_html( $product->get_sku() ); ?></p>
										<?php endif; ?>
										<?php
										if ( $product->has_attributes() ) {
											wc_display_product_attributes( $product );
										}
										?>
									</div>
								</details>
							<?php endif; ?>
						</div>
					</div>
				</div>
			</div>

			<?php do_action( 'woocommerce_after_single_product' ); ?>
		</div>

		<?php if ( $drip_related ) : ?>
			<section class="section related" aria-labelledby="related-title">
				<div class="wrap">
					<div class="section-head">
						<div>
							<p class="eyebrow">Keep scrolling</p>
							<h2 class="section-title" id="related-title">More from the drop.</h2>
						</div>
						<a class="link-arrow" href="<?php echo drip_wc_url( 'shop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Shop all <?php echo drip_icon( 'arrow', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
					</div>
					<div class="grid products-grid">
						<?php
						foreach ( $drip_related as $drip_rel ) {
							drip_card( $drip_rel );
						}
						?>
					</div>
				</div>
			</section>
		<?php endif; ?>
	</main>
	<?php
endwhile;

get_footer( 'shop' );
