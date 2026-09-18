<?php
/**
 * Front-end and editor assets.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Asset version tied to file modification time, so a changed file busts cache
 * without a manual version bump (section 11).
 *
 * @param string $relative Path relative to the theme root.
 * @return string
 */
function pt_asset_version( $relative ) {
	$path = PT_DIR . $relative;

	return file_exists( $path ) ? (string) filemtime( $path ) : PT_VERSION;
}

/**
 * Build the Google Fonts URL for Inter.
 *
 * Kept in one function so the front end and the block editor request the same
 * weights and never download two different subsets.
 *
 * @return string
 */
function pt_fonts_url() {
	return 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
}

/**
 * Preconnect to the Google Fonts hosts so the stylesheet resolves sooner.
 *
 * @param array  $urls           URLs to print for the given relation.
 * @param string $relation_type  Relation type being printed.
 * @return array
 */
function pt_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = array( 'href' => 'https://fonts.googleapis.com' );
		$urls[] = array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		);
	}

	return $urls;
}
add_filter( 'wp_resource_hints', 'pt_resource_hints', 10, 2 );

/**
 * Enqueue front-end styles and scripts.
 */
function pt_enqueue_assets() {
	wp_enqueue_style( 'pt-fonts', pt_fonts_url(), array(), null );

	// Tokens first: every other rule reads from the custom properties it defines.
	wp_enqueue_style(
		'pt-tokens',
		PT_URI . 'assets/css/tokens.css',
		array( 'pt-fonts' ),
		pt_asset_version( 'assets/css/main.css' )
	);

	wp_enqueue_style(
		'pt-main',
		PT_URI . 'assets/css/main.css',
		array( 'pt-tokens' ),
		PT_VERSION
	);

	// Keeps the WordPress theme header discoverable to child themes and tools.
	wp_enqueue_style( 'pt-style', get_stylesheet_uri(), array( 'pt-main' ), PT_VERSION );

	wp_enqueue_script(
		'pt-main',
		PT_URI . 'assets/js/main.js',
		array(),
		PT_VERSION,
		true
	);

	wp_localize_script(
		'pt-main',
		'ptsL10n',
		array(
			'openMenu'  => __( 'Open menu', 'palmtreesurf' ),
			'closeMenu' => __( 'Close menu', 'palmtreesurf' ),
			'close'     => __( 'Close', 'palmtreesurf' ),
			'prev'      => __( 'Previous image', 'palmtreesurf' ),
			'next'      => __( 'Next image', 'palmtreesurf' ),
			'map'       => __( 'Map of our location', 'palmtreesurf' ),
		)
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'pt_enqueue_assets' );

/**
 * Load the front-end fonts and editor styles inside the block editor so the
 * admin preview matches the rendered page.
 */
function pt_editor_assets() {
	add_editor_style( array( pt_fonts_url(), 'assets/css/tokens.css', 'assets/css/editor.css' ) );
}
add_action( 'after_setup_theme', 'pt_editor_assets' );
