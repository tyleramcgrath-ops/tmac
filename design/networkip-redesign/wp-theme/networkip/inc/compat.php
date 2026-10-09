<?php
/**
 * Page-builder compatibility.
 *
 * The current networkip.net is built with Elementor. Elementor's global "kit"
 * styles target `body.elementor-kit-N` and load after the theme, so they recolor
 * the theme's menu and headings and swap its font. This file stops that while
 * leaving Elementor itself installed and working.
 *
 * @package NetworkIP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Remove Elementor's global kit class from <body> so kit colors and fonts stop
 * applying to theme markup. Elementor widgets keep their own per-widget styles.
 *
 * @param string[] $classes Body classes.
 * @return string[]
 */
function networkip_strip_builder_body_classes( $classes ) {
	if ( '1' !== networkip_mod( 'neutralize_builders' ) ) {
		return $classes;
	}
	return array_values(
		array_filter(
			$classes,
			function ( $class ) {
				return 0 !== strpos( $class, 'elementor-kit-' );
			}
		)
	);
}
add_filter( 'body_class', 'networkip_strip_builder_body_classes', 999 );

/**
 * Skip Elementor's global Google Fonts on the front end. The theme bundles its own font.
 */
function networkip_disable_builder_google_fonts() {
	if ( '1' === networkip_mod( 'neutralize_builders' ) ) {
		add_filter( 'elementor/frontend/print_google_fonts', '__return_false' );
	}
}
add_action( 'after_setup_theme', 'networkip_disable_builder_google_fonts' );
