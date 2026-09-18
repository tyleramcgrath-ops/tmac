<?php
/**
 * Filters and hooks that adjust rendered output.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Add layout hints to the body element.
 *
 * @param array $classes Existing body classes.
 * @return array
 */
function pts_body_classes( $classes ) {
	if ( ! is_singular() ) {
		$classes[] = 'hfeed';
	}

	if ( is_front_page() ) {
		$classes[] = 'is-front-page';
	}

	if ( ! is_active_sidebar( 'sidebar-1' ) ) {
		$classes[] = 'no-sidebar';
	}

	if ( has_custom_logo() ) {
		$classes[] = 'has-logo';
	}

	return $classes;
}
add_filter( 'body_class', 'pts_body_classes' );

/**
 * Print the pingback URL for singular views that accept pings.
 */
function pts_pingback_header() {
	if ( is_singular() && pings_open() ) {
		printf( '<link rel="pingback" href="%s">', esc_url( get_bloginfo( 'pingback_url' ) ) );
	}
}
add_action( 'wp_head', 'pts_pingback_header' );

/**
 * Use the theme excerpt length on archives.
 *
 * @return int
 */
function pts_excerpt_length() {
	return 28;
}
add_filter( 'excerpt_length', 'pts_excerpt_length' );

/**
 * Replace the default excerpt ellipsis.
 *
 * @return string
 */
function pts_excerpt_more() {
	return '&hellip;';
}
add_filter( 'excerpt_more', 'pts_excerpt_more' );

/**
 * Show packages on the packages archive without pagination gaps.
 *
 * @param WP_Query $query Query being prepared.
 */
function pts_adjust_queries( $query ) {
	if ( is_admin() || ! $query->is_main_query() ) {
		return;
	}

	if ( $query->is_post_type_archive( PTS_PACKAGE_POST_TYPE ) || $query->is_tax( array( 'pts_package_type', 'pts_skill_level' ) ) ) {
		$query->set( 'posts_per_page', 12 );
		$query->set( 'orderby', array( 'menu_order' => 'ASC', 'title' => 'ASC' ) );
	}
}
add_action( 'pre_get_posts', 'pts_adjust_queries' );

/**
 * Print the Google Analytics tag built from the configured measurement ID.
 */
function pts_print_analytics() {
	$ga_id = pts_mod( 'pts_ga_id' );

	if ( ! $ga_id || ! preg_match( '/^G-[A-Z0-9]+$/i', $ga_id ) ) {
		return;
	}

	printf(
		'<script async src="https://www.googletagmanager.com/gtag/js?id=%s"></script>',
		esc_attr( rawurlencode( $ga_id ) )
	);
	printf(
		'<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config",%s);</script>',
		wp_json_encode( $ga_id )
	);
}
add_action( 'wp_head', 'pts_print_analytics', 20 );

/**
 * Print the Meta Pixel tag built from the configured pixel ID.
 */
function pts_print_pixel() {
	$pixel_id = preg_replace( '/\D/', '', pts_mod( 'pts_pixel_id' ) );

	if ( ! $pixel_id ) {
		return;
	}

	printf(
		'<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init",%s);fbq("track","PageView");</script>',
		wp_json_encode( $pixel_id )
	);
}
add_action( 'wp_head', 'pts_print_pixel', 21 );

/**
 * Print the administrator-authored header scripts.
 *
 * The value is stored only by users with unfiltered_html (see
 * pts_sanitize_scripts) and is deliberately printed verbatim.
 */
function pts_print_head_scripts() {
	$scripts = pts_mod( 'pts_head_scripts' );

	if ( $scripts ) {
		echo $scripts; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Raw markup saved by an unfiltered_html user by design.
	}
}
add_action( 'wp_head', 'pts_print_head_scripts', 99 );

/**
 * Print the administrator-authored footer scripts.
 */
function pts_print_footer_scripts() {
	$scripts = pts_mod( 'pts_footer_scripts' );

	if ( $scripts ) {
		echo $scripts; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Raw markup saved by an unfiltered_html user by design.
	}
}
add_action( 'wp_footer', 'pts_print_footer_scripts', 99 );
