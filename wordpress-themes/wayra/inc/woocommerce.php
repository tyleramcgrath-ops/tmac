<?php
/**
 * WooCommerce layout tweaks.
 *
 * @package Wayra
 */

defined( 'ABSPATH' ) || exit;

// Our own wrappers, no WooCommerce sidebar.
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
 * Breadcrumb styling.
 *
 * @return array
 */
add_filter(
	'woocommerce_breadcrumb_defaults',
	function ( $args ) {
		$args['delimiter']   = '<span class="sep" aria-hidden="true">/</span>';
		$args['wrap_before'] = '<nav class="breadcrumb" aria-label="' . esc_attr__( 'Breadcrumb', 'wayra' ) . '">';
		$args['wrap_after']  = '</nav>';
		return $args;
	}
);

/**
 * Three programs per row, nine per page.
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
add_filter(
	'woocommerce_output_related_products_args',
	function ( $args ) {
		$args['posts_per_page'] = 3;
		$args['columns']        = 3;
		return $args;
	}
);

/**
 * Shop page intro.
 */
function wayra_shop_intro() {
	if ( ! is_shop() && ! is_product_taxonomy() ) {
		return;
	}
	echo '<p class="shop-intro">' . esc_html__( 'Every program is taught by native speakers in groups of 3–4 students. Choose a program, pick your Monday, add lodging and check out. We confirm every booking by email within one business day.', 'wayra' ) . '</p>';
}
add_action( 'woocommerce_archive_description', 'wayra_shop_intro', 20 );

/**
 * Category filter chips above the catalogue.
 */
function wayra_category_chips() {
	if ( ! is_shop() && ! is_product_category() ) {
		return;
	}
	$terms = get_terms(
		array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => true,
			'exclude'    => array( (int) get_option( 'default_product_cat' ) ),
		)
	);
	if ( is_wp_error( $terms ) || ! $terms ) {
		return;
	}
	$current = is_product_category() ? get_queried_object_id() : 0;
	echo '<nav class="chips" aria-label="' . esc_attr__( 'Program types', 'wayra' ) . '">';
	printf( '<a class="chip%s" href="%s">%s</a>', $current ? '' : ' is-active', esc_url( wc_get_page_permalink( 'shop' ) ), esc_html__( 'All programs', 'wayra' ) );
	foreach ( $terms as $term ) {
		printf( '<a class="chip%s" href="%s">%s</a>', $current === $term->term_id ? ' is-active' : '', esc_url( get_term_link( $term ) ), esc_html( $term->name ) );
	}
	echo '</nav>';
}
add_action( 'woocommerce_before_shop_loop', 'wayra_category_chips', 5 );

/**
 * Key facts list on the single program page.
 */
function wayra_product_facts() {
	global $product;
	$raw = get_post_meta( $product->get_id(), '_wayra_facts', true );
	if ( ! $raw ) {
		return;
	}
	echo '<dl class="facts">';
	foreach ( preg_split( '/\r?\n/', $raw ) as $line ) {
		$parts = array_map( 'trim', explode( ':', $line, 2 ) );
		if ( 2 === count( $parts ) && '' !== $parts[0] ) {
			printf( '<div><dt>%s</dt><dd>%s</dd></div>', esc_html( $parts[0] ), esc_html( $parts[1] ) );
		}
	}
	echo '</dl>';
}
add_action( 'woocommerce_single_product_summary', 'wayra_product_facts', 25 );

/**
 * Reassurance under the booking button.
 */
function wayra_product_trust() {
	global $product;
	if ( ! function_exists( 'wayra_booking_config' ) || ! wayra_booking_config( $product ) ) {
		return;
	}
	?>
	<ul class="trust-list">
		<li><?php echo wayra_icon( 'award' ); // phpcs:ignore WordPress.Security.EscapeOutput ?> <?php esc_html_e( 'Instituto Cervantes accredited center', 'wayra' ); ?></li>
		<li><?php echo wayra_icon( 'check' ); // phpcs:ignore WordPress.Security.EscapeOutput ?> <?php esc_html_e( 'Placement test and certificate included', 'wayra' ); ?></li>
		<li><?php echo wayra_icon( 'phone' ); // phpcs:ignore WordPress.Security.EscapeOutput ?> <?php
			/* translators: %s: toll free number */
			printf( esc_html__( 'Questions? Call toll-free %s', 'wayra' ), '<a href="tel:' . esc_attr( preg_replace( '/[^\d+]/', '', '+' . wayra_opt( 'tollfree' ) ) ) . '">' . esc_html( wayra_opt( 'tollfree' ) ) . '</a>' );
		?></li>
	</ul>
	<?php
}
add_action( 'woocommerce_single_product_summary', 'wayra_product_trust', 35 );

/**
 * Header cart count, kept fresh by WooCommerce cart fragments.
 *
 * @param array $fragments Fragments.
 * @return array
 */
function wayra_cart_fragment( $fragments ) {
	ob_start();
	wayra_cart_count();
	$fragments['span.cart-count'] = ob_get_clean();
	return $fragments;
}
add_filter( 'woocommerce_add_to_cart_fragments', 'wayra_cart_fragment' );

/**
 * Print the cart count badge.
 */
function wayra_cart_count() {
	$count = WC()->cart ? WC()->cart->get_cart_contents_count() : 0;
	printf( '<span class="cart-count%s">%d</span>', $count ? '' : ' is-empty', (int) $count );
}

/**
 * Make sure cart fragments load so the header badge updates.
 */
add_action(
	'wp_enqueue_scripts',
	function () {
		wp_enqueue_script( 'wc-cart-fragments' );
	},
	20
);
