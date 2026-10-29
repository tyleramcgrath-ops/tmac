<?php
/**
 * Wayra Tamarindo theme setup.
 *
 * @package Wayra
 */

defined( 'ABSPATH' ) || exit;

define( 'WAYRA_VERSION', '1.0.0' );
define( 'WAYRA_DIR', get_template_directory() );
define( 'WAYRA_URI', get_template_directory_uri() );

require WAYRA_DIR . '/inc/template-tags.php';
require WAYRA_DIR . '/inc/customizer.php';
require WAYRA_DIR . '/inc/setup-content.php';

if ( class_exists( 'WooCommerce' ) ) {
	require WAYRA_DIR . '/inc/woocommerce.php';
	require WAYRA_DIR . '/inc/booking.php';
}

/**
 * Theme supports, menus and image sizes.
 */
function wayra_setup() {
	load_theme_textdomain( 'wayra', WAYRA_DIR . '/languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 154,
			'width'       => 440,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);

	add_theme_support(
		'woocommerce',
		array(
			'thumbnail_image_width' => 640,
			'single_image_width'    => 960,
			'product_grid'          => array(
				'default_rows'    => 3,
				'default_columns' => 3,
				'min_columns'     => 1,
				'max_columns'     => 4,
			),
		)
	);
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );

	add_image_size( 'wayra-card', 720, 540, true );
	add_image_size( 'wayra-wide', 1400, 788, true );

	register_nav_menus(
		array(
			'primary' => __( 'Primary menu', 'wayra' ),
			'footer'  => __( 'Footer menu', 'wayra' ),
			'social'  => __( 'Social links', 'wayra' ),
		)
	);
}
add_action( 'after_setup_theme', 'wayra_setup' );

/**
 * Widget areas.
 */
function wayra_widgets_init() {
	register_sidebar(
		array(
			'name'          => __( 'Sidebar', 'wayra' ),
			'id'            => 'sidebar-1',
			'description'   => __( 'Shown beside blog posts.', 'wayra' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);
	register_sidebar(
		array(
			'name'          => __( 'Shop sidebar', 'wayra' ),
			'id'            => 'shop',
			'description'   => __( 'Shown beside the program catalogue.', 'wayra' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', 'wayra_widgets_init' );

/**
 * Styles and scripts.
 */
function wayra_assets() {
	wp_enqueue_style(
		'wayra-fonts',
		'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Figtree:ital,wght@0,400..700;1,400&family=Caveat:wght@600&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'wayra-main', WAYRA_URI . '/assets/css/main.css', array(), WAYRA_VERSION );
	wp_enqueue_script( 'wayra-main', WAYRA_URI . '/assets/js/main.js', array(), WAYRA_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'wayra_assets' );

/**
 * Preconnect to Google Fonts.
 *
 * @param array  $urls          URLs to print.
 * @param string $relation_type Relation type.
 * @return array
 */
function wayra_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = array( 'href' => 'https://fonts.gstatic.com', 'crossorigin' );
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'wayra_resource_hints', 10, 2 );

/**
 * Shorter excerpts that fit the cards.
 */
add_filter(
	'excerpt_length',
	function () {
		return 24;
	}
);
add_filter(
	'excerpt_more',
	function () {
		return '&hellip;';
	}
);
