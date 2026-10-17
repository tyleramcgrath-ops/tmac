<?php
/**
 * Theme supports, assets, menus and head tags.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'after_setup_theme',
	function () {
		load_theme_textdomain( 'wehaverehabs', WHR_DIR . '/languages' );
		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'html5', array( 'search-form', 'comment-form', 'gallery', 'caption', 'style', 'script' ) );
		add_theme_support( 'responsive-embeds' );
		add_theme_support( 'editor-styles' );

		add_image_size( 'whr-hero', 2400, 1400, true );
		add_image_size( 'whr-wide', 1600, 1000, true );
		add_image_size( 'whr-card', 900, 1200, true );
		add_image_size( 'whr-square', 800, 800, true );

		register_nav_menus(
			array(
				'primary'   => __( 'Header — left', 'wehaverehabs' ),
				'secondary' => __( 'Header — right', 'wehaverehabs' ),
				'footer'    => __( 'Footer — About column', 'wehaverehabs' ),
			)
		);
	}
);

/** Front-end styles and scripts. */
add_action(
	'wp_enqueue_scripts',
	function () {
		wp_enqueue_style(
			'whr-fonts',
			'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Jost:wght@300;400;500&display=swap',
			array(),
			null
		);
		wp_enqueue_style( 'whr-style', get_stylesheet_uri(), array( 'whr-fonts' ), WHR_VERSION );
		wp_enqueue_script( 'whr-theme', WHR_URI . '/assets/js/theme.js', array(), WHR_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );
	}
);

add_filter(
	'wp_resource_hints',
	function ( $urls, $relation ) {
		if ( 'preconnect' === $relation ) {
			$urls[] = array( 'href' => 'https://fonts.gstatic.com', 'crossorigin' );
			$urls[] = 'https://fonts.googleapis.com';
		}
		return $urls;
	},
	10,
	2
);

/** Favicons and social sharing tags (skipped when an SEO plugin handles Open Graph). */
add_action(
	'wp_head',
	function () {
		$assets = WHR_URI . '/assets/brand';
		if ( ! has_site_icon() ) {
			printf( '<link rel="icon" href="%s" sizes="any">' . "\n", esc_url( $assets . '/favicon.ico' ) );
			printf( '<link rel="icon" href="%s" type="image/svg+xml">' . "\n", esc_url( $assets . '/icon-forest.svg' ) );
			printf( '<link rel="apple-touch-icon" href="%s">' . "\n", esc_url( $assets . '/apple-touch-icon.png' ) );
		}
		echo '<meta name="theme-color" content="#2f3a2f">' . "\n";

		if ( defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) || class_exists( 'All_in_One_SEO_Pack' ) ) {
			return;
		}
		$title = wp_get_document_title();
		$desc  = is_singular() && has_excerpt() ? get_the_excerpt() : get_bloginfo( 'description' );
		$image = $assets . '/social-og-image-1200x630.jpg';
		if ( is_singular() && has_post_thumbnail() ) {
			$image = get_the_post_thumbnail_url( null, 'whr-wide' );
		}
		printf( '<meta property="og:title" content="%s">' . "\n", esc_attr( $title ) );
		printf( '<meta property="og:description" content="%s">' . "\n", esc_attr( wp_strip_all_tags( $desc ) ) );
		printf( '<meta property="og:image" content="%s">' . "\n", esc_url( $image ) );
		printf( '<meta property="og:type" content="%s">' . "\n", is_singular() ? 'article' : 'website' );
		echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
	},
	5
);

/** Pages whose hero is a photo get the transparent header; everything else gets the light one. */
add_filter(
	'body_class',
	function ( $classes ) {
		$classes[] = whr_has_photo_header() ? 'site--photo' : 'site--light';
		return $classes;
	}
);

/**
 * Whether the current view opens with a full-bleed photo under the header.
 *
 * @return bool
 */
function whr_has_photo_header() {
	if ( is_front_page() || is_singular( 'sanctuary' ) || is_post_type_archive( 'sanctuary' ) || is_tax( 'destination' ) || is_tax( 'condition' ) || is_tax( 'care_level' ) || is_tax( 'setting' ) || is_tax( 'approach' ) ) {
		return true;
	}
	return false;
}

/** Keep excerpts short on cards. */
add_filter(
	'excerpt_length',
	function () {
		return 26;
	}
);
add_filter(
	'excerpt_more',
	function () {
		return '…';
	}
);
