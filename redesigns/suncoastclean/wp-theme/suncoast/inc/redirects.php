<?php
/**
 * Old addresses keep working: the site's .aspx links from before WordPress, and a few
 * WordPress-era addresses that the redesign no longer has.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'template_redirect', function () {
	$uri  = wp_parse_url( $_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH );
	$path = trim( (string) $uri, '/' );
	if ( $path === '' ) {
		return;
	}
	if ( $path === 'home' ) {
		wp_safe_redirect( home_url( '/' ), 301 );
		exit;
	}
	if ( substr( $path, -5 ) === '.aspx' ) {
		$key = substr( $path, 0, -5 );
		$map = suncoast_aspx_map();
		if ( isset( $map[ $key ] ) ) {
			$target = $map[ $key ];
			if ( $target === '/#reviews' ) {
				wp_safe_redirect( home_url( '/#reviews' ), 301 );
			} else {
				wp_safe_redirect( suncoast_url( $target ), 301 );
			}
			exit;
		}
		$page = get_page_by_path( $key ) ?: get_page_by_path( $key, OBJECT, 'post' );
		wp_safe_redirect( $page ? get_permalink( $page ) : home_url( '/' ), 301 );
		exit;
	}
	if ( is_404() && preg_match( '#^([a-z0-9-]+)\.html?$#', $path, $m ) ) {
		$page = $m[1] === 'index' ? null : ( get_page_by_path( $m[1] ) ?: get_page_by_path( $m[1], OBJECT, 'post' ) );
		wp_safe_redirect( $page ? get_permalink( $page ) : home_url( '/' ), 301 );
		exit;
	}
} );
