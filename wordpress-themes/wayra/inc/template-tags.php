<?php
/**
 * Small template helpers.
 *
 * @package Wayra
 */

defined( 'ABSPATH' ) || exit;

/**
 * URL of an image bundled with the theme.
 *
 * @param string $path Path relative to assets/images.
 * @return string
 */
function wayra_img( $path ) {
	return WAYRA_URI . '/assets/images/' . ltrim( $path, '/' );
}

/**
 * Inline SVG icon from a small built-in set.
 *
 * @param string $name Icon name.
 * @return string
 */
function wayra_icon( $name ) {
	$paths = array(
		'phone'    => '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
		'clock'    => '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
		'cart'     => '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6"/>',
		'user'     => '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
		'search'   => '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
		'arrow'    => '<path d="M5 12h14M13 6l6 6-6 6"/>',
		'menu'     => '<path d="M4 7h16M4 12h16M4 17h16"/>',
		'close'    => '<path d="M6 6l12 12M18 6 6 18"/>',
		'pin'      => '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
		'mail'     => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
		'check'    => '<path d="m5 12 5 5 9-10"/>',
		'calendar' => '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
		'home'     => '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
		'wave'     => '<path d="M2 15c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3"/><path d="M2 20c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3"/>',
		'award'    => '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>',
		'play'     => '<path d="M8 5v14l11-7z" fill="currentColor"/>',
	);
	if ( ! isset( $paths[ $name ] ) ) {
		return '';
	}
	return '<svg class="icon icon-' . esc_attr( $name ) . '" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $paths[ $name ] . '</svg>';
}

/**
 * Site logo, falling back to the bundled Wayra logo.
 */
function wayra_logo() {
	if ( has_custom_logo() ) {
		the_custom_logo();
		return;
	}
	printf(
		'<a class="custom-logo-link" href="%1$s" rel="home"><img class="custom-logo" src="%2$s" width="220" height="77" alt="%3$s"></a>',
		esc_url( home_url( '/' ) ),
		esc_url( wayra_img( 'logo.png' ) ),
		esc_attr( get_bloginfo( 'name' ) )
	);
}

/**
 * Decorative wave divider.
 *
 * @param string $class Extra class.
 */
function wayra_wave( $class = '' ) {
	echo '<svg class="wave ' . esc_attr( $class ) . '" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40c120-30 240-30 360 0s240 30 360 0 240-30 360 0 240 30 360 0v40H0z"/></svg>';
}

/**
 * Posted-on line for blog posts.
 */
function wayra_posted_on() {
	printf(
		'<span class="posted-on"><time datetime="%1$s">%2$s</time></span>',
		esc_attr( get_the_date( DATE_W3C ) ),
		esc_html( get_the_date() )
	);
}

/**
 * Fallback for the primary menu before one is assigned.
 */
function wayra_menu_fallback() {
	$items = array(
		home_url( '/' )        => __( 'Home', 'wayra' ),
		wayra_shop_url()       => __( 'Programs', 'wayra' ),
		home_url( '/lodging' ) => __( 'Lodging', 'wayra' ),
		home_url( '/school' )  => __( 'The School', 'wayra' ),
		home_url( '/blog' )    => __( 'Blog', 'wayra' ),
		home_url( '/contact' ) => __( 'Contact', 'wayra' ),
	);
	echo '<ul id="primary-menu" class="menu">';
	foreach ( $items as $url => $label ) {
		printf( '<li class="menu-item"><a href="%s">%s</a></li>', esc_url( $url ), esc_html( $label ) );
	}
	echo '</ul>';
}

/**
 * Shop URL, falling back to /programs when WooCommerce is inactive.
 *
 * @return string
 */
function wayra_shop_url() {
	if ( function_exists( 'wc_get_page_permalink' ) ) {
		return wc_get_page_permalink( 'shop' );
	}
	return home_url( '/programs' );
}
