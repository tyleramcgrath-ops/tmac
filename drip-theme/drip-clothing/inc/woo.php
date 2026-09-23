<?php
/**
 * WooCommerce: wrappers, the product card, the bag count, and small
 * helpers the templates share.
 *
 * @package drip
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Whether WooCommerce is active.
 */
function drip_has_woo() {
	return class_exists( 'WooCommerce' );
}

// The theme styles buttons, forms, notices and tables itself; WooCommerce's
// color-and-button sheet fights it. Layout and small-screen sheets stay.
add_filter(
	'woocommerce_enqueue_styles',
	function ( $styles ) {
		unset( $styles['woocommerce-general'] );
		return $styles;
	}
);

remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );
remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );

// "Bag", not "cart", everywhere a shopper sees a button.
add_filter(
	'woocommerce_product_single_add_to_cart_text',
	function () {
		return 'Add to bag';
	}
);

add_filter(
	'loop_shop_per_page',
	function () {
		return 24;
	}
);

add_filter(
	'woocommerce_breadcrumb_defaults',
	function ( $d ) {
		$d['delimiter']   = '<span class="crumb-sep" aria-hidden="true">/</span>';
		$d['wrap_before'] = '<nav class="crumbs" aria-label="Breadcrumb">';
		$d['wrap_after']  = '</nav>';
		return $d;
	}
);

// Keep the bag count in the header current after an AJAX add-to-cart.
add_filter(
	'woocommerce_add_to_cart_fragments',
	function ( $fragments ) {
		$fragments['span.bag-count'] = drip_bag_count_html();
		return $fragments;
	}
);

/**
 * Items in the bag.
 */
function drip_cart_count() {
	if ( ! drip_has_woo() || ! function_exists( 'WC' ) || ! WC()->cart ) {
		return 0;
	}
	return (int) WC()->cart->get_cart_contents_count();
}

/**
 * The bag count badge.
 */
function drip_bag_count_html() {
	$n = drip_cart_count();
	return '<span class="bag-count' . ( $n ? '' : ' is-empty' ) . '" aria-label="' . esc_attr( $n . ' items in bag' ) . '">' . (int) $n . '</span>';
}

/**
 * Shop page URL, or a fallback.
 *
 * @param string $page 'shop', 'cart', 'checkout' or 'myaccount'.
 */
function drip_wc_url( $page = 'shop' ) {
	if ( drip_has_woo() ) {
		$url = wc_get_page_permalink( $page );
		if ( $url ) {
			return esc_url( $url );
		}
	}
	$map = array(
		'shop'      => 'shop',
		'cart'      => 'cart',
		'checkout'  => 'checkout',
		'myaccount' => 'my-account',
	);
	return drip_url( $map[ $page ] );
}

/**
 * Split "DRIP Shatter Wave Back Tee – Black" into a title and a color.
 *
 * @param string $name Product name.
 */
function drip_split_name( $name ) {
	$name  = trim( html_entity_decode( $name, ENT_QUOTES, 'UTF-8' ) );
	$name  = preg_replace( '/^DRIP\s+/i', '', $name );
	$parts = preg_split( '/\s+[–—-]\s+/u', $name, 2 );
	return array(
		'title' => $parts[0],
		'color' => isset( $parts[1] ) ? $parts[1] : '',
	);
}

/**
 * 'black', 'white', or 'other', read from the product name.
 *
 * @param WC_Product $product Product.
 */
function drip_tone( $product ) {
	$name = strtolower( $product->get_name() );
	if ( false !== strpos( $name, 'white' ) ) {
		return 'white';
	}
	if ( false !== strpos( $name, 'black' ) ) {
		return 'black';
	}
	return 'other';
}

/**
 * The first product category's name.
 *
 * @param WC_Product $product Product.
 */
function drip_category_name( $product ) {
	$terms = get_the_terms( $product->get_id(), 'product_cat' );
	if ( ! $terms || is_wp_error( $terms ) ) {
		return '';
	}
	foreach ( $terms as $term ) {
		if ( 'uncategorized' !== $term->slug ) {
			return $term->name;
		}
	}
	return '';
}

/**
 * Percent off, or 0.
 *
 * @param WC_Product $product Product.
 */
function drip_percent_off( $product ) {
	if ( ! $product->is_on_sale() || ! $product->is_type( 'simple' ) ) {
		return 0;
	}
	$reg   = (float) $product->get_regular_price();
	$price = (float) $product->get_price();
	return $reg > 0 ? (int) round( ( $reg - $price ) / $reg * 100 ) : 0;
}

/**
 * Products with no price yet are shown as "coming soon" rather than $0.
 *
 * @param WC_Product $product Product.
 */
function drip_is_coming_soon( $product ) {
	return '' === $product->get_price() || ( 0.0 === (float) $product->get_price() && ! $product->is_purchasable() );
}

/**
 * A product image tag.
 *
 * @param int    $id    Attachment id.
 * @param string $size  Image size.
 * @param string $class CSS class.
 * @param string $alt   Alt text.
 */
function drip_image( $id, $size, $class, $alt = '' ) {
	if ( ! $id ) {
		return drip_has_woo() ? wc_placeholder_img( $size, array( 'class' => $class ) ) : '';
	}
	return wp_get_attachment_image(
		$id,
		$size,
		false,
		array(
			'class'   => $class,
			'alt'     => $alt,
			'loading' => 'lazy',
			'sizes'   => '(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw',
		)
	);
}

/**
 * The product card, used by the shop grid, the homepage, and related items.
 *
 * @param WC_Product $product Product.
 * @param array      $opts    'size' => 'wide' for the large layout.
 */
function drip_card( $product, $opts = array() ) {
	if ( ! $product ) {
		return;
	}
	$name    = drip_split_name( $product->get_name() );
	$tone    = drip_tone( $product );
	$link    = $product->get_permalink();
	$gallery = $product->get_gallery_image_ids();
	$alt_id  = $gallery ? $gallery[0] : 0;
	$off     = drip_percent_off( $product );
	$soon    = drip_is_coming_soon( $product );
	$cat     = drip_category_name( $product );
	$sub     = array_filter( array( $name['color'], $cat ) );
	$class   = 'card tone-' . $tone . ( $alt_id ? ' has-alt' : '' ) . ( ! empty( $opts['size'] ) ? ' card-' . $opts['size'] : '' );
	?>
	<article class="<?php echo esc_attr( $class ); ?>" data-tone="<?php echo esc_attr( $tone ); ?>" data-reveal>
		<a class="card-media" href="<?php echo esc_url( $link ); ?>" tabindex="-1" aria-hidden="true">
			<?php echo drip_image( $product->get_image_id(), 'woocommerce_thumbnail', 'card-img', $product->get_name() ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			<?php
			if ( $alt_id ) {
				echo drip_image( $alt_id, 'woocommerce_thumbnail', 'card-img card-img-alt' ); // phpcs:ignore WordPress.Security.EscapeOutput
			}
			?>
			<?php if ( $soon ) : ?>
				<span class="card-badge is-soon">Coming soon</span>
			<?php elseif ( $off ) : ?>
				<span class="card-badge"><?php echo esc_html( '−' . $off . '%' ); ?></span>
			<?php endif; ?>
		</a>
		<div class="card-info">
			<div class="card-text">
				<h3 class="card-title"><a href="<?php echo esc_url( $link ); ?>"><?php echo esc_html( $name['title'] ); ?></a></h3>
				<?php if ( $sub ) : ?>
					<p class="card-sub"><?php echo esc_html( implode( ' · ', $sub ) ); ?></p>
				<?php endif; ?>
			</div>
			<div class="card-price">
				<?php
				if ( $soon ) {
					echo '<span class="price-soon">Next drop</span>';
				} else {
					echo wp_kses_post( $product->get_price_html() );
				}
				?>
			</div>
		</div>
		<?php if ( ! $soon && $product->is_purchasable() && $product->is_in_stock() && $product->is_type( 'simple' ) ) : ?>
			<a class="card-add add_to_cart_button ajax_add_to_cart" href="<?php echo esc_url( $product->add_to_cart_url() ); ?>" data-quantity="1" data-product_id="<?php echo esc_attr( $product->get_id() ); ?>" data-product_sku="<?php echo esc_attr( $product->get_sku() ); ?>" rel="nofollow" aria-label="<?php echo esc_attr( 'Add ' . $name['title'] . ' to bag' ); ?>">
				<?php echo drip_icon( 'plus', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><span>Add to bag</span>
			</a>
		<?php elseif ( ! $soon ) : ?>
			<a class="card-add" href="<?php echo esc_url( $link ); ?>"><?php echo drip_icon( 'arrow', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><span>Choose options</span></a>
		<?php endif; ?>
	</article>
	<?php
}

/**
 * Published products, newest first, leaving out reference rows (the
 * "Details" and "Mockups" categories) that aren't meant for the storefront.
 *
 * @param array $args 'limit', 'filter' => callable, 'exclude_cats' => slugs.
 */
function drip_catalog( $args = array() ) {
	if ( ! drip_has_woo() ) {
		return array();
	}
	$args     = array_merge(
		array(
			'limit'        => 8,
			'filter'       => null,
			'exclude_cats' => apply_filters( 'drip_hidden_categories', array( 'details', 'mockups' ) ),
		),
		$args
	);
	$products = wc_get_products(
		array(
			'status'  => 'publish',
			'limit'   => 60,
			'orderby' => 'date',
			'order'   => 'DESC',
		)
	);
	$out      = array();
	foreach ( $products as $product ) {
		$terms = get_the_terms( $product->get_id(), 'product_cat' );
		$slugs = $terms && ! is_wp_error( $terms ) ? wp_list_pluck( $terms, 'slug' ) : array();
		if ( array_intersect( $slugs, $args['exclude_cats'] ) ) {
			continue;
		}
		if ( $args['filter'] && ! call_user_func( $args['filter'], $product ) ) {
			continue;
		}
		$out[] = $product;
		if ( count( $out ) >= $args['limit'] ) {
			break;
		}
	}
	return $out;
}

/**
 * Product categories that have products, for the shop's filter chips.
 */
function drip_shop_categories() {
	if ( ! drip_has_woo() ) {
		return array();
	}
	$terms = get_terms(
		array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => true,
			'orderby'    => 'count',
			'order'      => 'DESC',
		)
	);
	if ( is_wp_error( $terms ) ) {
		return array();
	}
	$hidden = array_merge( array( 'uncategorized' ), apply_filters( 'drip_hidden_categories', array( 'details', 'mockups' ) ) );
	return array_values(
		array_filter(
			$terms,
			function ( $t ) use ( $hidden ) {
				return ! in_array( $t->slug, $hidden, true );
			}
		)
	);
}

/**
 * A product by its slug, or null.
 *
 * @param string $slug Product slug.
 */
function drip_product_by_slug( $slug ) {
	if ( ! drip_has_woo() ) {
		return null;
	}
	$post = get_page_by_path( $slug, OBJECT, 'product' );
	return $post ? wc_get_product( $post->ID ) : null;
}
