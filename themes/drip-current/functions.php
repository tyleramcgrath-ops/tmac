<?php
/**
 * DRIP Current theme setup.
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;

define( 'DRIP_CURRENT_VERSION', '1.0.1' );
define( 'DRIP_CURRENT_DIR', get_template_directory() );
define( 'DRIP_CURRENT_URI', get_template_directory_uri() );

require DRIP_CURRENT_DIR . '/inc/template-tags.php';
require DRIP_CURRENT_DIR . '/inc/customizer.php';

if ( class_exists( 'WooCommerce' ) ) {
	require DRIP_CURRENT_DIR . '/inc/woocommerce.php';
}

/**
 * Theme supports, menus and image sizes.
 */
function drip_current_setup() {
	load_theme_textdomain( 'drip-current', DRIP_CURRENT_DIR . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 80,
			'width'       => 240,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);

	add_theme_support(
		'woocommerce',
		array(
			'thumbnail_image_width' => 600,
			'single_image_width'    => 1000,
			'product_grid'          => array(
				'default_rows'    => 4,
				'min_rows'        => 1,
				'default_columns' => 3,
				'min_columns'     => 1,
				'max_columns'     => 4,
			),
		)
	);
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );

	register_nav_menus(
		array(
			'primary' => __( 'Header menu', 'drip-current' ),
			'footer'  => __( 'Footer menu', 'drip-current' ),
		)
	);
}
add_action( 'after_setup_theme', 'drip_current_setup' );

/**
 * Fonts, styles and scripts.
 */
function drip_current_assets() {
	wp_enqueue_style(
		'drip-current-fonts',
		'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Syncopate:wght@400&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'drip-current', DRIP_CURRENT_URI . '/assets/css/main.css', array(), DRIP_CURRENT_VERSION );

	if ( class_exists( 'WooCommerce' ) ) {
		wp_enqueue_style( 'drip-current-woocommerce', DRIP_CURRENT_URI . '/assets/css/woocommerce.css', array( 'drip-current' ), DRIP_CURRENT_VERSION );
	}

	wp_enqueue_script( 'drip-current', DRIP_CURRENT_URI . '/assets/js/main.js', array(), DRIP_CURRENT_VERSION, true );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'drip_current_assets' );

/**
 * Preconnect to Google Fonts.
 *
 * @param array  $urls          URLs.
 * @param string $relation_type Relation type.
 * @return array
 */
function drip_current_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = 'https://fonts.googleapis.com';
		$urls[] = array(
			'href' => 'https://fonts.gstatic.com',
			'crossorigin',
		);
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'drip_current_resource_hints', 10, 2 );

/**
 * Body classes used by the header (transparent over the hero on the homepage).
 *
 * @param array $classes Classes.
 * @return array
 */
function drip_current_body_classes( $classes ) {
	if ( is_front_page() && ! is_paged() && get_theme_mod( 'drip_hero_show', true ) ) {
		$classes[] = 'has-hero';
	}
	return $classes;
}
add_filter( 'body_class', 'drip_current_body_classes' );

/**
 * Footer widget area (optional, shown above the footer bar when used).
 */
function drip_current_widgets() {
	register_sidebar(
		array(
			'name'          => __( 'Blog sidebar', 'drip-current' ),
			'id'            => 'sidebar-1',
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', 'drip_current_widgets' );

/**
 * Shorter excerpts for journal cards.
 */
add_filter(
	'excerpt_length',
	function () {
		return 24;
	}
);
