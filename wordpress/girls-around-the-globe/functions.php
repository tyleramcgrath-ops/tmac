<?php
/**
 * Girls Around the Globe theme.
 *
 * @package gag
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'GAG_VERSION', '1.0.0' );

require_once get_template_directory() . '/inc/signups.php';

/**
 * Theme supports and menus.
 */
function gag_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'custom-logo', array( 'height' => 120, 'width' => 280, 'flex-height' => true, 'flex-width' => true ) );

	register_nav_menus(
		array(
			'primary' => __( 'Header menu', 'gag' ),
			'footer'  => __( 'Footer menu', 'gag' ),
		)
	);
}
add_action( 'after_setup_theme', 'gag_setup' );

/**
 * URL of a file bundled with the theme.
 *
 * @param string $path Path under assets/.
 * @return string
 */
function gag_asset( $path ) {
	return get_template_directory_uri() . '/assets/' . ltrim( $path, '/' );
}

/**
 * Styles and scripts. Cache-busted by file time so edits show up immediately.
 */
function gag_enqueue() {
	$dir = get_template_directory();
	wp_enqueue_style( 'gag', get_stylesheet_uri(), array(), (string) filemtime( $dir . '/style.css' ) );
	wp_enqueue_script( 'gag', gag_asset( 'js/theme.js' ), array(), (string) filemtime( $dir . '/assets/js/theme.js' ), array( 'strategy' => 'defer', 'in_footer' => true ) );
}
add_action( 'wp_enqueue_scripts', 'gag_enqueue' );

/**
 * Preload the hero photo and the display font on the homepage.
 */
function gag_preload() {
	if ( is_front_page() ) {
		printf( '<link rel="preload" as="image" href="%s">' . "\n", esc_url( gag_asset( 'img/hero.jpg' ) ) );
	}
	printf( '<link rel="preload" as="font" type="font/woff2" crossorigin href="%s">' . "\n", esc_url( gag_asset( 'fonts/instrument-serif.woff2' ) ) );
	echo '<meta name="theme-color" content="#0b0908">' . "\n";
}
add_action( 'wp_head', 'gag_preload', 2 );

/**
 * Bundled icon when no Site Icon is set in Settings.
 */
function gag_fallback_icon() {
	if ( ! has_site_icon() ) {
		printf( '<link rel="icon" href="%1$s"><link rel="apple-touch-icon" href="%1$s">' . "\n", esc_url( gag_asset( 'img/site-icon.png' ) ) );
	}
}
add_action( 'wp_head', 'gag_fallback_icon' );

/**
 * Customizer: where the Join and Log in buttons go, and the Globe+ price.
 *
 * @param WP_Customize_Manager $wp_customize Customizer.
 */
function gag_customize( $wp_customize ) {
	$wp_customize->add_section(
		'gag_links',
		array(
			'title'       => __( 'Girls Around the Globe', 'gag' ),
			'description' => __( 'Leave "Join link" empty to use the sign-up form on the homepage (sign-ups appear under Sign-ups in the admin). Set it to your app\'s sign-up page once the app is live.', 'gag' ),
			'priority'    => 30,
		)
	);

	$fields = array(
		'gag_join_url'  => array( __( 'Join link', 'gag' ), 'esc_url_raw', '' ),
		'gag_login_url' => array( __( 'Log in link', 'gag' ), 'esc_url_raw', '' ),
		'gag_price'     => array( __( 'Globe+ price', 'gag' ), 'sanitize_text_field', '$14.99/month' ),
	);
	foreach ( $fields as $id => $field ) {
		$wp_customize->add_setting( $id, array( 'default' => $field[2], 'sanitize_callback' => $field[1] ) );
		$wp_customize->add_control( $id, array( 'label' => $field[0], 'section' => 'gag_links', 'type' => 'esc_url_raw' === $field[1] ? 'url' : 'text' ) );
	}
}
add_action( 'customize_register', 'gag_customize' );

/**
 * Where "Join" buttons point: the app's sign-up page if set, else the form on the homepage.
 *
 * @param string $looking Optional looking-for value to carry over.
 * @return string
 */
function gag_join_url( $looking = '' ) {
	$url = get_theme_mod( 'gag_join_url', '' );
	if ( $url ) {
		return $looking ? add_query_arg( 'looking', $looking, $url ) : $url;
	}
	return home_url( '/#join' );
}

/**
 * Inline SVG icon (stroke style, inherits currentColor).
 *
 * @param string $name Icon name.
 * @param int    $size Pixel size.
 * @return string
 */
function gag_icon( $name, $size = 20 ) {
	$paths = array(
		'heart'     => 'M12 20.5s-7-4.3-9.2-8.7A5.3 5.3 0 0 1 12 6.4a5.3 5.3 0 0 1 9.2 5.4c-2.2 4.4-9.2 8.7-9.2 8.7z',
		'video'     => 'M3 7.5A1.5 1.5 0 0 1 4.5 6h10A1.5 1.5 0 0 1 16 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 16.5zM16 10.5l5-3v9l-5-3',
		'translate' => 'M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8M11 5c-1 4-4 7-7 8M13 21l4-10 4 10M14.5 17.5h5',
		'shield'    => 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM9 12l2 2 4-4',
		'check'     => 'M5 12.5l4.5 4.5L19 7.5',
		'arrow'     => 'M5 12h14M13 6l6 6-6 6',
		'menu'      => 'M4 8h16M4 16h16',
	);
	if ( ! isset( $paths[ $name ] ) ) {
		return '';
	}
	return sprintf(
		'<svg width="%1$d" height="%1$d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="%2$s"/></svg>',
		(int) $size,
		esc_attr( $paths[ $name ] )
	);
}

/**
 * The logo: the Customizer logo (Appearance > Customize > Site Identity) if one
 * is set, else the bundled GAG logo.
 *
 * @param string $variant 'mark' (GAG) or 'full' (with tagline).
 * @return string
 */
function gag_logo( $variant = 'mark' ) {
	if ( 'mark' === $variant && has_custom_logo() ) {
		return wp_get_attachment_image( get_theme_mod( 'custom_logo' ), 'full', false, array( 'alt' => get_bloginfo( 'name' ) ) );
	}
	$file = 'full' === $variant ? 'img/gag-logo.png' : 'img/gag-mark.png';
	return sprintf( '<img src="%s" alt="%s">', esc_url( gag_asset( $file ) ), esc_attr__( 'GAG, Girls Around the Globe', 'gag' ) );
}

/**
 * Fallback header menu when none is assigned under Appearance > Menus.
 */
function gag_default_menu() {
	$front = is_front_page() ? '' : home_url( '/' );
	$items = array(
		$front . '#try'    => __( 'Try it', 'gag' ),
		$front . '#cities' => __( 'Cities', 'gag' ),
		$front . '#how'    => __( 'How it works', 'gag' ),
		$front . '#faq'    => __( 'FAQ', 'gag' ),
	);
	echo '<ul>';
	foreach ( $items as $href => $label ) {
		printf( '<li><a href="%s">%s</a></li>', esc_url( $href ), esc_html( $label ) );
	}
	echo '</ul>';
}
