<?php
/**
 * NetworkIP theme bootstrap.
 *
 * @package NetworkIP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'NETWORKIP_VERSION', '1.2.0' );

require get_template_directory() . '/inc/content.php';
require get_template_directory() . '/inc/template-tags.php';
require get_template_directory() . '/inc/customizer.php';
require get_template_directory() . '/inc/contact-form.php';
require get_template_directory() . '/inc/pages.php';
require get_template_directory() . '/inc/compat.php';

/**
 * Theme supports and menus.
 */
function networkip_setup() {
	load_theme_textdomain( 'networkip', get_template_directory() . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'editor-styles' );
	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
	);
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 80,
			'width'       => 360,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);

	register_nav_menus(
		array(
			'primary'           => __( 'Primary navigation', 'networkip' ),
			'footer-company'    => __( 'Footer: Company', 'networkip' ),
			'footer-service'    => __( 'Footer: Service', 'networkip' ),
			'footer-technology' => __( 'Footer: Technology', 'networkip' ),
		)
	);

	add_editor_style( 'assets/css/editor.css' );
}
add_action( 'after_setup_theme', 'networkip_setup' );

/**
 * Front-end assets.
 */
function networkip_enqueue_assets() {
	$uri = get_template_directory_uri();

	wp_enqueue_style( 'networkip-theme', $uri . '/assets/css/theme.css', array(), NETWORKIP_VERSION );
	wp_enqueue_script( 'networkip-navigation', $uri . '/assets/js/navigation.js', array(), NETWORKIP_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );
}
add_action( 'wp_enqueue_scripts', 'networkip_enqueue_assets' );

/**
 * Preload the latin font file and, on the homepage, the hero image (the LCP element).
 */
function networkip_preload_assets() {
	$uri = get_template_directory_uri();
	printf(
		'<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n",
		esc_url( $uri . '/assets/fonts/manrope-latin-var.woff2' )
	);
	if ( is_front_page() ) {
		printf(
			'<link rel="preload" as="image" type="image/webp" imagesrcset="%1$s" imagesizes="100vw" fetchpriority="high">' . "\n",
			esc_attr( networkip_srcset( 'hero-globe' ) )
		);
	}
}
add_action( 'wp_head', 'networkip_preload_assets', 1 );

/**
 * Swap the no-js class for js before paint so the mobile menu doesn't flash.
 */
function networkip_js_class() {
	echo "<script>document.documentElement.classList.replace('no-js','js');</script>\n";
}
add_action( 'wp_head', 'networkip_js_class', 0 );

/**
 * Add a body class for the transparent header used over the homepage hero.
 *
 * @param string[] $classes Body classes.
 * @return string[]
 */
function networkip_body_classes( $classes ) {
	if ( is_front_page() ) {
		$classes[] = 'has-hero-header';
	}
	return $classes;
}
add_filter( 'body_class', 'networkip_body_classes' );
