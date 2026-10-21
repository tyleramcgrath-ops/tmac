<?php
/**
 * WooCommerce integration.
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;

/**
 * Wrap WooCommerce pages in the theme's container instead of WooCommerce's default markup.
 */
remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );
remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );

add_action(
	'woocommerce_before_main_content',
	function () {
		echo '<main id="main" class="site-main shop-main"><div class="container">';
	},
	10
);
add_action(
	'woocommerce_after_main_content',
	function () {
		echo '</div></main>';
	},
	10
);

/**
 * Three columns, twelve per page.
 */
add_filter(
	'loop_shop_columns',
	function () {
		return 3;
	}
);
add_filter(
	'loop_shop_per_page',
	function () {
		return 12;
	}
);

/**
 * Three related products in three columns.
 *
 * @param array $args Args.
 * @return array
 */
function drip_current_related_args( $args ) {
	$args['posts_per_page'] = 3;
	$args['columns']        = 3;
	return $args;
}
add_filter( 'woocommerce_output_related_products_args', 'drip_current_related_args' );
add_filter(
	'woocommerce_upsell_display_args',
	function ( $args ) {
		$args['posts_per_page'] = 3;
		$args['columns']        = 3;
		return $args;
	}
);

/**
 * Lighter breadcrumb separator.
 *
 * @param array $defaults Defaults.
 * @return array
 */
function drip_current_breadcrumb( $defaults ) {
	$defaults['delimiter'] = '<span class="sep" aria-hidden="true">/</span>';
	return $defaults;
}
add_filter( 'woocommerce_breadcrumb_defaults', 'drip_current_breadcrumb' );

/**
 * Cart count markup (refreshed by WooCommerce cart fragments after add-to-cart).
 *
 * @return string
 */
function drip_current_cart_count() {
	$count = ( function_exists( 'WC' ) && WC()->cart ) ? WC()->cart->get_cart_contents_count() : 0;
	return '<span class="cart-count' . ( $count ? '' : ' is-empty' ) . '" data-count="' . esc_attr( $count ) . '">' . esc_html( $count ) . '</span>';
}

/**
 * Keep the header bag count in sync after AJAX add-to-cart.
 *
 * @param array $fragments Fragments.
 * @return array
 */
function drip_current_cart_fragment( $fragments ) {
	$fragments['span.cart-count'] = drip_current_cart_count();
	return $fragments;
}
add_filter( 'woocommerce_add_to_cart_fragments', 'drip_current_cart_fragment' );

/**
 * Make sure the cart-fragments script is available so the bag count updates on every page.
 */
add_action(
	'wp_enqueue_scripts',
	function () {
		if ( wp_script_is( 'wc-cart-fragments', 'registered' ) ) {
			wp_enqueue_script( 'wc-cart-fragments' );
		}
	},
	20
);

/**
 * Products for the homepage "Graphic Tee Edit".
 *
 * @return WC_Product[]
 */
function drip_current_edit_products() {
	$ids = array_filter( array_map( 'absint', explode( ',', (string) drip_current_mod( 'drip_edit_products' ) ) ) );
	if ( $ids ) {
		$products = wc_get_products(
			array(
				'include' => $ids,
				'status'  => 'publish',
				'limit'   => 3,
				'orderby' => 'include',
			)
		);
		if ( $products ) {
			return $products;
		}
	}

	$args = array(
		'status'     => 'publish',
		'limit'      => 3,
		'orderby'    => 'date',
		'order'      => 'DESC',
		'visibility' => 'catalog',
	);
	$cat  = drip_current_mod( 'drip_edit_category' );
	if ( $cat && term_exists( $cat, 'product_cat' ) ) {
		$args['category'] = array( $cat );
	}
	return wc_get_products( $args );
}

/**
 * Short product name for cards: "DRIP Silver Ribbon Back Tee – Black" → "Silver Ribbon Back Tee".
 * The full name is kept on the product page and in the card's accessible label.
 *
 * @param WC_Product $product Product.
 * @return string
 */
function drip_current_card_name( $product ) {
	$name = wp_strip_all_tags( html_entity_decode( $product->get_name(), ENT_QUOTES, 'UTF-8' ) );
	$name = preg_replace( '/^DRIP\s+/i', '', $name );
	$name = preg_replace( '/\s+[–—-]\s+[^–—-]+$/u', '', $name );
	return apply_filters( 'drip_current_card_name', $name, $product );
}

/**
 * Card colour variant from the product name (" – Black", " – White"…), shown under the price on archives.
 *
 * @param WC_Product $product Product.
 * @return string
 */
function drip_current_card_variant( $product ) {
	$name = html_entity_decode( $product->get_name(), ENT_QUOTES, 'UTF-8' );
	if ( preg_match( '/\s[–—-]\s([^–—-]+)$/u', $name, $m ) ) {
		return trim( $m[1] );
	}
	return '';
}

/**
 * Render a product card (used on the homepage and every product grid).
 *
 * @param WC_Product $product   Product.
 * @param string     $image_url Optional override image URL.
 */
function drip_current_product_card( $product, $image_url = '' ) {
	$link = $product->get_permalink();
	?>
	<a class="tee-card" href="<?php echo esc_url( $link ); ?>" aria-label="<?php echo esc_attr( wp_strip_all_tags( $product->get_name() ) . ', ' . wp_strip_all_tags( wc_price( wc_get_price_to_display( $product ) ) ) ); ?>">
		<span class="tee-card__media">
			<?php if ( $product->is_on_sale() ) : ?>
				<span class="tee-card__badge"><?php esc_html_e( 'Sale', 'drip-current' ); ?></span>
			<?php elseif ( ! $product->is_in_stock() ) : ?>
				<span class="tee-card__badge is-muted"><?php esc_html_e( 'Sold out', 'drip-current' ); ?></span>
			<?php endif; ?>
			<?php
			if ( $image_url ) {
				echo '<img src="' . esc_url( $image_url ) . '" alt="" loading="lazy" decoding="async">';
			} elseif ( $product->get_image_id() ) {
				echo wp_get_attachment_image( $product->get_image_id(), 'woocommerce_thumbnail', false, array( 'alt' => '', 'loading' => 'lazy' ) );
			} else {
				echo wc_placeholder_img( 'woocommerce_thumbnail' ); // phpcs:ignore WordPress.Security.EscapeOutput
			}
			?>
		</span>
		<span class="tee-card__meta">
			<span class="tee-card__text">
				<span class="tee-card__name"><?php echo esc_html( drip_current_card_name( $product ) ); ?></span>
				<span class="tee-card__price"><?php echo wp_kses_post( $product->get_price_html() ); ?></span>
			</span>
			<?php echo drip_current_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		</span>
	</a>
	<?php
}


/**
 * Keep WooCommerce's general styles (stars, select2, notices) but drop its
 * float-based layout sheets; the theme lays out grids and product pages itself.
 *
 * @param array $styles Styles.
 * @return array
 */
function drip_current_wc_styles( $styles ) {
	unset( $styles['woocommerce-layout'], $styles['woocommerce-smallscreen'] );
	return $styles;
}
add_filter( 'woocommerce_enqueue_styles', 'drip_current_wc_styles' );

/**
 * Category chips under the shop / category title.
 */
function drip_current_shop_category_chips() {
	if ( ! ( is_shop() || is_product_category() ) ) {
		return;
	}
	$terms = get_terms(
		array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => true,
			'exclude'    => array( (int) get_option( 'default_product_cat' ) ),
			'orderby'    => 'name',
		)
	);
	if ( is_wp_error( $terms ) || ! $terms ) {
		return;
	}
	$current = is_product_category() ? get_queried_object_id() : 0;
	echo '<ul class="shop-cats">';
	echo '<li class="' . ( $current ? '' : 'is-current' ) . '"><a href="' . esc_url( wc_get_page_permalink( 'shop' ) ) . '">' . esc_html__( 'All', 'drip-current' ) . '</a></li>';
	foreach ( $terms as $term ) {
		echo '<li class="' . ( $current === $term->term_id ? 'is-current' : '' ) . '"><a href="' . esc_url( get_term_link( $term ) ) . '">' . esc_html( $term->name ) . '</a></li>';
	}
	echo '</ul>';
}
add_action( 'woocommerce_archive_description', 'drip_current_shop_category_chips', 20 );
