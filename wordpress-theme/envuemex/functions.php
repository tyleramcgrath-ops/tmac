<?php
/**
 * Envue Mex theme bootstrap.
 *
 * @package envuemex
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ENVUEMEX_VERSION', '1.0.0' );
define( 'ENVUEMEX_DIR', get_template_directory() );
define( 'ENVUEMEX_URI', get_template_directory_uri() );

/**
 * Theme supports + setup.
 */
function envuemex_setup() {
	load_theme_textdomain( 'envuemex', ENVUEMEX_DIR . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'custom-logo', array(
		'height'      => 60,
		'width'       => 220,
		'flex-height' => true,
		'flex-width'  => true,
	) );
	add_theme_support( 'html5', array(
		'search-form',
		'comment-form',
		'comment-list',
		'gallery',
		'caption',
		'style',
		'script',
	) );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );

	// Block editor color palette mirrors the design tokens in main.css.
	add_theme_support( 'editor-color-palette', array(
		array( 'name' => __( 'Brand Purple', 'envuemex' ),  'slug' => 'brand',        'color' => '#4B2E83' ),
		array( 'name' => __( 'Deep Purple', 'envuemex' ),   'slug' => 'brand-deep',   'color' => '#2E1A56' ),
		array( 'name' => __( 'Light Purple', 'envuemex' ),  'slug' => 'brand-light',  'color' => '#8A5CF6' ),
		array( 'name' => __( 'Lavender', 'envuemex' ),      'slug' => 'lavender',     'color' => '#C9A4FF' ),
		array( 'name' => __( 'Ink', 'envuemex' ),           'slug' => 'ink',          'color' => '#0B0712' ),
		array( 'name' => __( 'Paper', 'envuemex' ),         'slug' => 'paper',        'color' => '#F7F4FB' ),
		array( 'name' => __( 'White', 'envuemex' ),         'slug' => 'white',        'color' => '#FFFFFF' ),
	) );

	register_nav_menus( array(
		'primary' => __( 'Primary Menu', 'envuemex' ),
		'footer-solutions' => __( 'Footer · Solutions', 'envuemex' ),
		'footer-company'   => __( 'Footer · Company', 'envuemex' ),
		'footer-support'   => __( 'Footer · Support', 'envuemex' ),
	) );
}
add_action( 'after_setup_theme', 'envuemex_setup' );

/**
 * Enqueue front-end assets.
 */
function envuemex_assets() {
	wp_enqueue_style(
		'envuemex-fonts',
		'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap',
		array(),
		null
	);
	wp_enqueue_style(
		'envuemex-main',
		ENVUEMEX_URI . '/assets/css/main.css',
		array( 'envuemex-fonts' ),
		ENVUEMEX_VERSION
	);
	// Theme header (style.css) for screen readers / required by WP.
	wp_enqueue_style(
		'envuemex-theme',
		get_stylesheet_uri(),
		array( 'envuemex-main' ),
		ENVUEMEX_VERSION
	);

	wp_enqueue_script(
		'envuemex-main',
		ENVUEMEX_URI . '/assets/js/main.js',
		array(),
		ENVUEMEX_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'envuemex_assets' );

/**
 * Editor styles so the block editor mirrors the front end.
 */
function envuemex_editor_assets() {
	add_editor_style( 'assets/css/main.css' );
}
add_action( 'after_setup_theme', 'envuemex_editor_assets' );

/**
 * SVG favicon.
 */
function envuemex_favicon() {
	printf(
		'<link rel="icon" href="%s" type="image/svg+xml" />' . "\n",
		esc_url( ENVUEMEX_URI . '/assets/img/favicon.svg' )
	);
	echo '<meta name="theme-color" content="#4B2E83" />' . "\n";
}
add_action( 'wp_head', 'envuemex_favicon', 5 );

/**
 * Set <html lang> dynamically and expose data-lang from cookie/locale.
 */
function envuemex_html_attrs( $output ) {
	$lang = 'es';
	if ( ! empty( $_COOKIE['envue-lang'] ) && in_array( $_COOKIE['envue-lang'], array( 'es', 'en' ), true ) ) {
		$lang = sanitize_text_field( wp_unslash( $_COOKIE['envue-lang'] ) );
	} elseif ( function_exists( 'pll_current_language' ) ) {
		$lang = pll_current_language() === 'en' ? 'en' : 'es';
	}
	$output  = preg_replace( '/lang="[^"]*"/', 'lang="' . esc_attr( $lang ) . '"', $output );
	$output .= ' data-lang="' . esc_attr( $lang ) . '"';
	return $output;
}
add_filter( 'language_attributes', 'envuemex_html_attrs' );

/**
 * Bilingual string helper.
 *
 * Usage: envuemex_t( 'Inicio', 'Home' );
 *
 * Outputs the Spanish string with both data-es and data-en attributes baked
 * into a wrapping <span>. The front-end script.js swaps text content on
 * language toggle. If you migrate to Polylang/WPML, just call pll__() etc.
 */
function envuemex_t( $es, $en, $echo = true ) {
	$html = sprintf(
		'<span data-es="%1$s" data-en="%2$s">%1$s</span>',
		esc_attr( $es ),
		esc_attr( $en )
	);
	if ( $echo ) {
		echo $html; // already escaped above
	}
	return $html;
}

/**
 * Plain text variant of envuemex_t — used for attributes / titles.
 */
function envuemex_t_attr( $es, $en ) {
	$lang = ( ! empty( $_COOKIE['envue-lang'] ) && $_COOKIE['envue-lang'] === 'en' ) ? 'en' : 'es';
	return $lang === 'en' ? $en : $es;
}

/**
 * Register customizable site options.
 */
function envuemex_customize_register( $wp_customize ) {
	$wp_customize->add_section( 'envuemex_contact', array(
		'title'    => __( 'Envue Mex · Contact', 'envuemex' ),
		'priority' => 40,
	) );

	$fields = array(
		'envuemex_email'         => array( 'label' => __( 'Sales email', 'envuemex' ),      'default' => 'ventas@envuemex.com' ),
		'envuemex_support_email' => array( 'label' => __( 'Support email', 'envuemex' ),    'default' => 'soporte@envuemex.com' ),
		'envuemex_phone'         => array( 'label' => __( 'Phone', 'envuemex' ),            'default' => '+52 800 123 4567' ),
		'envuemex_offices'       => array( 'label' => __( 'Offices', 'envuemex' ),          'default' => 'Monterrey · Ciudad de México · Guadalajara' ),
		'envuemex_us_url'        => array( 'label' => __( 'TMAC USA URL', 'envuemex' ),     'default' => 'https://tyleramcgrath-ops.github.io/tmac/' ),
	);

	foreach ( $fields as $id => $info ) {
		$wp_customize->add_setting( $id, array(
			'default'           => $info['default'],
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'refresh',
		) );
		$wp_customize->add_control( $id, array(
			'label'   => $info['label'],
			'section' => 'envuemex_contact',
			'type'    => 'text',
		) );
	}
}
add_action( 'customize_register', 'envuemex_customize_register' );

/**
 * Helper: get a contact field with default fallback.
 */
function envuemex_get( $key, $default = '' ) {
	return get_theme_mod( $key, $default );
}

/**
 * Elementor compatibility (Canvas + Header-Footer template support).
 */
require_once ENVUEMEX_DIR . '/inc/elementor.php';

/**
 * Body classes — add a marker so CSS can target the homepage when needed.
 */
function envuemex_body_class( $classes ) {
	if ( is_front_page() ) {
		$classes[] = 'envuemex-front';
	}
	return $classes;
}
add_filter( 'body_class', 'envuemex_body_class' );
