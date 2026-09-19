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
 * The stylesheet declaring the self-hosted fonts.
 *
 * Kept in one function so the front end and the block editor load the same one.
 *
 * @return string
 */
function pt_fonts_url() {
	return PT_URI . 'assets/css/fonts.css';
}

/**
 * Preload the font files the first screen actually uses.
 *
 * Only the latin subsets, and only the two families in the hero. A preload for
 * a file the page does not end up using is a wasted request, so latin-ext is
 * deliberately left to load on demand.
 */
function pt_preload_fonts() {
	$fonts = array( 'manrope-latin.woff2', 'dancing-script-latin.woff2' );

	foreach ( $fonts as $font ) {
		$path = PT_DIR . 'assets/fonts/' . $font;

		if ( ! file_exists( $path ) ) {
			continue;
		}

		printf(
			'<link rel="preload" as="font" type="font/woff2" href="%s" crossorigin />' . "\n",
			esc_url( PT_URI . 'assets/fonts/' . $font )
		);
	}
}
add_action( 'wp_head', 'pt_preload_fonts', 1 );

/**
 * Enqueue front-end styles and scripts.
 */
function pt_enqueue_assets() {
	wp_enqueue_style( 'pt-fonts', pt_fonts_url(), array(), pt_asset_version( 'assets/css/fonts.css' ) );

	/*
	 * Every asset is versioned by its OWN modification time. Versioning one
	 * file by another's timestamp - or pinning to a constant - means an edited
	 * stylesheet keeps its old URL, and any caching host or CDN goes on serving
	 * the previous file. That looks exactly like "the design did not change".
	 */

	// Tokens first: every other rule reads from the custom properties it defines.
	wp_enqueue_style(
		'pt-tokens',
		PT_URI . 'assets/css/tokens.css',
		array( 'pt-fonts' ),
		pt_asset_version( 'assets/css/tokens.css' )
	);

	wp_enqueue_style(
		'pt-main',
		PT_URI . 'assets/css/main.css',
		array( 'pt-tokens' ),
		pt_asset_version( 'assets/css/main.css' )
	);

	/*
	 * style.css is deliberately NOT enqueued. It holds the theme header and
	 * nothing else, so loading it costs a request and delivers no CSS. A child
	 * theme's own style.css is enqueued by WordPress regardless.
	 */

	wp_enqueue_script(
		'pt-main',
		PT_URI . 'assets/js/main.js',
		array(),
		pt_asset_version( 'assets/js/main.js' ),
		array(
			'strategy'  => 'defer',
			'in_footer' => true,
		)
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

	if ( function_exists( 'pt_assistant_enabled' ) && pt_assistant_enabled() ) {
		wp_enqueue_script(
			'pt-assistant',
			PT_URI . 'assets/js/assistant.js',
			array(),
			pt_asset_version( 'assets/js/assistant.js' ),
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);

		wp_localize_script( 'pt-assistant', 'ptAssistant', pt_assistant_data() );
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
