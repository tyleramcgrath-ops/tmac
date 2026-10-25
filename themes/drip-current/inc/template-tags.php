<?php
/**
 * Small rendering helpers: icons, logo, links and menu fallbacks.
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;

/**
 * Inline SVG icons.
 *
 * @param string $name Icon name.
 * @return string
 */
function drip_current_icon( $name ) {
	$icons = array(
		'search'    => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="7"/><path d="m15.8 15.8 5.7 5.7"/></svg>',
		'account'   => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="7.5" r="4.3"/><path d="M3.5 21.5v-1.2c0-3.4 2.8-6 6.2-6h4.6c3.4 0 6.2 2.6 6.2 6v1.2z"/></svg>',
		'bag'       => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 7.5h15l-.9 14h-13.2z"/><path d="M8.5 9.5V6a3.5 3.5 0 0 1 7 0v3.5"/></svg>',
		'chevron'   => '<svg viewBox="0 0 10 6" aria-hidden="true" focusable="false"><path d="m1 1 4 4 4-4"/></svg>',
		'chevron-r' => '<svg viewBox="0 0 6 10" aria-hidden="true" focusable="false"><path d="m1 1 4 4-4 4"/></svg>',
		'arrow'     => '<svg viewBox="0 0 16 10" aria-hidden="true" focusable="false"><path d="M0 5h15M10.5 .8 15 5l-4.5 4.2"/></svg>',
		'menu'      => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 7h18M3 12h18M3 17h18"/></svg>',
		'close'     => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 5 14 14M19 5 5 19"/></svg>',
		'instagram' => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="is-filled"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9z"/></svg>',
		'tiktok'    => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="is-filled"><path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.5v13.7a2.9 2.9 0 1 1-2-2.8V9.4a6.4 6.4 0 1 0 5.5 6.3V8.8a8.3 8.3 0 0 0 4.8 1.5V6.8z"/></svg>',
		'youtube'   => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="is-filled"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6z"/></svg>',
		'facebook'  => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="is-filled"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/></svg>',
	);

	return isset( $icons[ $name ] ) ? '<span class="icon icon-' . esc_attr( $name ) . '">' . $icons[ $name ] . '</span>' : '';
}

/**
 * The DRIP drop mark (vector, so it stays crisp at any size).
 *
 * @return string
 */
function drip_current_drop_svg() {
	static $n = 0;
	$n++;
	$id = 'drip-grad-' . $n;
	return '<svg class="drip-drop" viewBox="0 0 40 56" aria-hidden="true" focusable="false"><defs><linearGradient id="' . $id . '" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#4fd6ff"/><stop offset="1" stop-color="#1f7cf2"/></linearGradient></defs><path fill="url(#' . $id . ')" d="M20 1.5C17 11 3 23.5 3 36.3 3 46.3 10.6 54 20 54s17-7.7 17-17.7C37 23.5 23 11 20 1.5zm0 7.6c3.3 7.4 13.6 17.2 13.6 27.2 0 8.1-6.1 14.3-13.6 14.3S6.4 44.4 6.4 36.3C6.4 26.3 16.7 16.5 20 9.1z"/><path fill="url(#' . $id . ')" d="M17.5 19.5c-4.6 5.5-8 11.2-7.4 17.6.6 6.3 5.3 10.6 11.6 11-4.6-1.8-7.6-5.7-8-10.8-.4-5.6 1.4-11.6 3.8-17.8z"/></svg>';
}

/**
 * Brand mark: custom logo when set and chosen, otherwise drop + wordmark.
 *
 * @param string $context header|footer.
 */
function drip_current_brand( $context = 'header' ) {
	$use_custom = get_theme_mod( 'drip_use_custom_logo', false ) && has_custom_logo();
	$label      = get_bloginfo( 'name' );
	echo '<a class="brand brand--' . esc_attr( $context ) . '" href="' . esc_url( home_url( '/' ) ) . '" rel="home" aria-label="' . esc_attr( $label ) . '">';
	if ( $use_custom ) {
		$logo_id = get_theme_mod( 'custom_logo' );
		echo wp_get_attachment_image( $logo_id, 'full', false, array( 'class' => 'brand__logo', 'alt' => $label ) );
	} else {
		echo drip_current_drop_svg(); // phpcs:ignore WordPress.Security.EscapeOutput -- static SVG.
		echo '<span class="brand__word">' . esc_html( get_theme_mod( 'drip_wordmark', 'DRIP' ) ) . '</span>';
	}
	echo '</a>';
}

/**
 * Resolve a link: a page path if that page exists, otherwise the given fallback.
 *
 * @param string $path     Page path, e.g. "our-story".
 * @param string $fallback Fallback URL.
 * @return string
 */
function drip_current_page_url( $path, $fallback = '' ) {
	$page = get_page_by_path( $path );
	if ( $page ) {
		return get_permalink( $page );
	}
	return $fallback ? $fallback : home_url( '/' . $path . '/' );
}

/**
 * Shop URL (works with or without WooCommerce).
 *
 * @return string
 */
function drip_current_shop_url() {
	if ( function_exists( 'wc_get_page_permalink' ) ) {
		return wc_get_page_permalink( 'shop' );
	}
	return home_url( '/shop/' );
}

/**
 * Product category link by slug, falling back to the shop.
 *
 * @param string $slug Category slug.
 * @return string
 */
function drip_current_cat_url( $slug ) {
	if ( taxonomy_exists( 'product_cat' ) ) {
		$term = get_term_by( 'slug', $slug, 'product_cat' );
		if ( $term && ! is_wp_error( $term ) ) {
			$link = get_term_link( $term );
			if ( ! is_wp_error( $link ) ) {
				return $link;
			}
		}
	}
	return drip_current_shop_url();
}

/**
 * Journal (blog) URL.
 *
 * @return string
 */
function drip_current_journal_url() {
	$posts_page = (int) get_option( 'page_for_posts' );
	if ( $posts_page ) {
		return get_permalink( $posts_page );
	}
	return drip_current_page_url( 'blog' );
}

/**
 * Build a dropdown list of product categories under a parent slug (or top level).
 *
 * @param string $parent_slug Parent slug, or '' for top-level categories.
 * @return array[] label/url pairs.
 */
function drip_current_category_links( $parent_slug = '' ) {
	if ( ! taxonomy_exists( 'product_cat' ) ) {
		return array();
	}
	$parent = 0;
	if ( $parent_slug ) {
		$term = get_term_by( 'slug', $parent_slug, 'product_cat' );
		if ( ! $term ) {
			return array();
		}
		$parent = (int) $term->term_id;
	}
	$terms = get_terms(
		array(
			'taxonomy'   => 'product_cat',
			'parent'     => $parent,
			'hide_empty' => true,
			'exclude'    => array( (int) get_option( 'default_product_cat' ) ),
			'orderby'    => 'name',
		)
	);
	$links = array();
	if ( ! is_wp_error( $terms ) ) {
		foreach ( $terms as $term ) {
			$links[] = array(
				'label' => $term->name,
				'url'   => get_term_link( $term ),
			);
		}
	}
	return $links;
}

/**
 * Default header navigation used until a menu is assigned to "Header menu".
 * Mirrors the mockup: Shop ▾ / Tees / Collections ▾ / Our Story.
 */
function drip_current_primary_fallback() {
	$shop_children = array_merge(
		array(
			array(
				'label' => __( 'Shop all', 'drip-current' ),
				'url'   => drip_current_shop_url(),
			),
		),
		drip_current_category_links( 'apparel' ),
		drip_current_category_links( 'accessories' )
	);
	$collections   = drip_current_category_links( '' );

	$items = array(
		array(
			'label'    => __( 'Shop', 'drip-current' ),
			'url'      => drip_current_shop_url(),
			'children' => $shop_children,
		),
		array(
			'label' => __( 'Tees', 'drip-current' ),
			'url'   => drip_current_cat_url( 'tees' ),
		),
		array(
			'label'    => __( 'Collections', 'drip-current' ),
			'url'      => drip_current_shop_url(),
			'children' => $collections,
		),
		array(
			'label' => __( 'Our Story', 'drip-current' ),
			'url'   => drip_current_page_url( 'our-story' ),
		),
	);

	echo '<ul class="menu">';
	foreach ( $items as $item ) {
		$has = ! empty( $item['children'] );
		echo '<li class="menu-item' . ( $has ? ' menu-item-has-children' : '' ) . '">';
		echo '<a href="' . esc_url( $item['url'] ) . '">' . esc_html( $item['label'] ) . '</a>';
		if ( $has ) {
			/* translators: %s menu item */
			echo '<button class="submenu-toggle" aria-expanded="false" aria-label="' . esc_attr( sprintf( __( 'Show %s submenu', 'drip-current' ), $item['label'] ) ) . '">' . drip_current_icon( 'chevron' ) . '</button>'; // phpcs:ignore WordPress.Security.EscapeOutput
			echo '<ul class="sub-menu">';
			foreach ( $item['children'] as $child ) {
				echo '<li class="menu-item"><a href="' . esc_url( $child['url'] ) . '">' . esc_html( $child['label'] ) . '</a></li>';
			}
			echo '</ul>';
		}
		echo '</li>';
	}
	echo '</ul>';
}

/**
 * Default footer navigation used until a menu is assigned to "Footer menu".
 */
function drip_current_footer_fallback() {
	$items = array(
		__( 'Shop', 'drip-current' )        => drip_current_shop_url(),
		__( 'Tees', 'drip-current' )        => drip_current_cat_url( 'tees' ),
		__( 'Collections', 'drip-current' ) => drip_current_cat_url( 'apparel' ),
		__( 'Our Story', 'drip-current' )   => drip_current_page_url( 'our-story' ),
		__( 'Journal', 'drip-current' )     => drip_current_journal_url(),
		__( 'Support', 'drip-current' )     => drip_current_page_url( 'help', drip_current_page_url( 'contact' ) ),
	);
	echo '<ul class="menu">';
	foreach ( $items as $label => $url ) {
		echo '<li class="menu-item"><a href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a></li>';
	}
	echo '</ul>';
}

/**
 * Add a chevron toggle after parent items in the header menu.
 *
 * @param string   $output Item output.
 * @param WP_Post  $item   Menu item.
 * @param int      $depth  Depth.
 * @param stdClass $args   Args.
 * @return string
 */
function drip_current_nav_chevron( $output, $item, $depth, $args ) {
	if ( isset( $args->theme_location ) && 'primary' === $args->theme_location && 0 === $depth && in_array( 'menu-item-has-children', (array) $item->classes, true ) ) {
		$output .= '<button class="submenu-toggle" aria-expanded="false" aria-label="' . esc_attr( sprintf( /* translators: %s menu item */ __( 'Show %s submenu', 'drip-current' ), $item->title ) ) . '">' . drip_current_icon( 'chevron' ) . '</button>';
	}
	return $output;
}
add_filter( 'walker_nav_menu_start_el', 'drip_current_nav_chevron', 10, 4 );

/**
 * Social links from the Customizer.
 */
function drip_current_social_links() {
	$networks = array(
		'instagram' => 'Instagram',
		'tiktok'    => 'TikTok',
		'youtube'   => 'YouTube',
		'facebook'  => 'Facebook',
	);
	$out = '';
	foreach ( $networks as $key => $label ) {
		$url = get_theme_mod( 'drip_social_' . $key, '' );
		if ( $url ) {
			$out .= '<a href="' . esc_url( $url ) . '" target="_blank" rel="noopener" aria-label="' . esc_attr( $label ) . '">' . drip_current_icon( $key ) . '</a>';
		}
	}
	if ( $out ) {
		echo '<div class="footer-social">' . $out . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput -- escaped above.
	}
}

/**
 * Image URL from a Customizer image setting, falling back to a bundled asset.
 *
 * @param string $mod     Theme mod key.
 * @param string $default Bundled file name in assets/images.
 * @return string
 */
function drip_current_image( $mod, $default ) {
	$value = get_theme_mod( $mod, '' );
	if ( $value ) {
		return $value;
	}
	return DRIP_CURRENT_URI . '/assets/images/' . $default;
}
