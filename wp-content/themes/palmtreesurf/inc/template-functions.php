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
function pt_body_classes( $classes ) {
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
add_filter( 'body_class', 'pt_body_classes' );

/**
 * Print the pingback URL for singular views that accept pings.
 */
function pt_pingback_header() {
	if ( is_singular() && pings_open() ) {
		printf( '<link rel="pingback" href="%s">', esc_url( get_bloginfo( 'pingback_url' ) ) );
	}
}
add_action( 'wp_head', 'pt_pingback_header' );

/**
 * Use the theme excerpt length on archives.
 *
 * @return int
 */
function pt_excerpt_length() {
	return 28;
}
add_filter( 'excerpt_length', 'pt_excerpt_length' );

/**
 * Replace the default excerpt ellipsis.
 *
 * @return string
 */
function pt_excerpt_more() {
	return '&hellip;';
}
add_filter( 'excerpt_more', 'pt_excerpt_more' );

/**
 * Show packages on the packages archive without pagination gaps.
 *
 * @param WP_Query $query Query being prepared.
 */
function pt_adjust_queries( $query ) {
	if ( is_admin() || ! $query->is_main_query() ) {
		return;
	}

	if ( $query->is_post_type_archive( PT_EXPERIENCE_POST_TYPE ) || $query->is_tax( array( 'experience_type', 'skill_level' ) ) ) {
		$query->set( 'posts_per_page', 12 );
		$query->set( 'orderby', array( 'menu_order' => 'ASC', 'title' => 'ASC' ) );
	}
}
add_action( 'pre_get_posts', 'pt_adjust_queries' );

/**
 * Print the Google Analytics tag built from the configured measurement ID.
 */
function pt_print_analytics() {
	$ga_id = pt_mod( 'pt_ga_id' );

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
add_action( 'wp_head', 'pt_print_analytics', 20 );

/**
 * Print the Meta Pixel tag built from the configured pixel ID.
 */
function pt_print_pixel() {
	$pixel_id = preg_replace( '/\D/', '', pt_mod( 'pt_pixel_id' ) );

	if ( ! $pixel_id ) {
		return;
	}

	printf(
		'<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init",%s);fbq("track","PageView");</script>',
		wp_json_encode( $pixel_id )
	);
}
add_action( 'wp_head', 'pt_print_pixel', 21 );

/**
 * Print the administrator-authored header scripts.
 *
 * The value is stored only by users with unfiltered_html (see
 * pt_sanitize_scripts) and is deliberately printed verbatim.
 */
function pt_print_head_scripts() {
	$scripts = pt_mod( 'pt_head_scripts' );

	if ( $scripts ) {
		echo $scripts; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Raw markup saved by an unfiltered_html user by design.
	}
}
add_action( 'wp_head', 'pt_print_head_scripts', 99 );

/**
 * Print the administrator-authored footer scripts.
 */
function pt_print_footer_scripts() {
	$scripts = pt_mod( 'pt_footer_scripts' );

	if ( $scripts ) {
		echo $scripts; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Raw markup saved by an unfiltered_html user by design.
	}
}
add_action( 'wp_footer', 'pt_print_footer_scripts', 99 );
