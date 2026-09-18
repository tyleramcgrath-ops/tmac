<?php
/**
 * Front-end and editor assets.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Build the Google Fonts URL for Inter.
 *
 * Kept in one function so the front end and the block editor request the same
 * weights and never download two different subsets.
 *
 * @return string
 */
function pts_fonts_url() {
	return 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
}

/**
 * Preconnect to the Google Fonts hosts so the stylesheet resolves sooner.
 *
 * @param array  $urls           URLs to print for the given relation.
 * @param string $relation_type  Relation type being printed.
 * @return array
 */
function pts_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = array( 'href' => 'https://fonts.googleapis.com' );
		$urls[] = array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		);
	}

	return $urls;
}
add_filter( 'wp_resource_hints', 'pts_resource_hints', 10, 2 );

/**
 * Enqueue front-end styles and scripts.
 */
function pts_enqueue_assets() {
	wp_enqueue_style( 'pts-fonts', pts_fonts_url(), array(), null );

	// Tokens first: every other rule reads from the custom properties it defines.
	wp_enqueue_style(
		'pts-tokens',
		PTS_URI . 'assets/css/tokens.css',
		array( 'pts-fonts' ),
		PTS_VERSION
	);

	wp_enqueue_style(
		'pts-main',
		PTS_URI . 'assets/css/main.css',
		array( 'pts-tokens' ),
		PTS_VERSION
	);

	// Keeps the WordPress theme header discoverable to child themes and tools.
	wp_enqueue_style( 'pts-style', get_stylesheet_uri(), array( 'pts-main' ), PTS_VERSION );

	wp_enqueue_script(
		'pts-main',
		PTS_URI . 'assets/js/main.js',
		array(),
		PTS_VERSION,
		true
	);

	wp_localize_script(
		'pts-main',
		'ptsL10n',
		array(
			'openMenu'  => __( 'Open menu', 'palmtreesurf' ),
			'closeMenu' => __( 'Close menu', 'palmtreesurf' ),
		)
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'pts_enqueue_assets' );

/**
 * Load the front-end fonts and editor styles inside the block editor so the
 * admin preview matches the rendered page.
 */
function pts_editor_assets() {
	add_editor_style( array( pts_fonts_url(), 'assets/css/tokens.css', 'assets/css/editor.css' ) );
}
add_action( 'after_setup_theme', 'pts_editor_assets' );
