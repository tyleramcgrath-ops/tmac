<?php
/**
 * Relative Marketing Agency (RMA) theme functions.
 *
 * @package rma
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'RMA_VERSION', '1.0.0' );

require_once get_template_directory() . '/inc/setup.php';

/**
 * Theme setup.
 */
function rma_setup() {
	load_theme_textdomain( 'rma', get_template_directory() . '/languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'custom-logo', array(
		'height'      => 40,
		'width'       => 140,
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

	register_nav_menus( array(
		'primary' => __( 'Primary Menu', 'rma' ),
		'footer_services'  => __( 'Footer — Services', 'rma' ),
		'footer_company'   => __( 'Footer — Company', 'rma' ),
		'footer_resources' => __( 'Footer — Resources', 'rma' ),
	) );
}
add_action( 'after_setup_theme', 'rma_setup' );

/**
 * Content width.
 */
function rma_content_width() {
	$GLOBALS['content_width'] = 760;
}
add_action( 'after_setup_theme', 'rma_content_width', 0 );

/**
 * Enqueue styles and scripts.
 */
function rma_assets() {
	// Google Fonts: Inter.
	wp_enqueue_style(
		'rma-fonts',
		'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
		array(),
		null
	);

	// Theme stylesheet header (style.css) + main styles.
	wp_enqueue_style( 'rma-style', get_stylesheet_uri(), array(), RMA_VERSION );
	wp_enqueue_style( 'rma-theme', get_template_directory_uri() . '/assets/css/theme.css', array( 'rma-style' ), RMA_VERSION );

	wp_enqueue_script( 'rma-main', get_template_directory_uri() . '/assets/js/main.js', array(), RMA_VERSION, true );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'rma_assets' );

/**
 * Register sidebar / widget areas.
 */
function rma_widgets_init() {
	register_sidebar( array(
		'name'          => __( 'Footer Contact', 'rma' ),
		'id'            => 'footer-contact',
		'description'   => __( 'Shown in the footer contact column.', 'rma' ),
		'before_widget' => '<div class="footer-widget %2$s">',
		'after_widget'  => '</div>',
		'before_title'  => '<h5>',
		'after_title'   => '</h5>',
	) );
}
add_action( 'widgets_init', 'rma_widgets_init' );

/**
 * Fallback menu when no primary menu is assigned — mirrors the mockup.
 */
function rma_default_menu() {
	$items = array(
		'#services'     => __( 'Services', 'rma' ),
		'#case-studies' => __( 'Case Studies', 'rma' ),
		'#about'        => __( 'About', 'rma' ),
		'#insights'     => __( 'Insights', 'rma' ),
		'#contact'      => __( 'Contact', 'rma' ),
	);
	echo '<ul id="primary-menu" class="menu">';
	foreach ( $items as $url => $label ) {
		printf( '<li><a href="%s">%s</a></li>', esc_url( home_url( '/' ) . $url ), esc_html( $label ) );
	}
	echo '</ul>';
}

/**
 * Helper: brand wordmark markup.
 */
function rma_brand_mark( $light = false ) {
	if ( has_custom_logo() ) {
		return get_custom_logo();
	}
	$class = 'logo-rma' . ( $light ? ' logo-rma--light' : '' );
	return '<span class="' . esc_attr( $class ) . '">R<span class="m">M</span>A</span>';
}

/**
 * Estimated reading time for posts.
 */
function rma_reading_time( $post_id = null ) {
	$post_id = $post_id ? $post_id : get_the_ID();
	$content = get_post_field( 'post_content', $post_id );
	$words   = str_word_count( wp_strip_all_tags( $content ) );
	$minutes = max( 1, (int) ceil( $words / 200 ) );
	/* translators: %d: minutes to read. */
	return sprintf( _n( '%d min read', '%d min read', $minutes, 'rma' ), $minutes );
}

/**
 * Excerpt length + more.
 */
function rma_excerpt_length() { return 22; }
add_filter( 'excerpt_length', 'rma_excerpt_length' );
function rma_excerpt_more() { return '&hellip;'; }
add_filter( 'excerpt_more', 'rma_excerpt_more' );

/**
 * Register the page templates that ship with the theme so they appear in
 * the Page Attributes → Template dropdown.
 */
function rma_page_templates( $templates ) {
	$templates['template-services.php']        = __( 'RMA — Services', 'rma' );
	$templates['template-service-details.php'] = __( 'RMA — Service Details', 'rma' );
	$templates['template-about.php']           = __( 'RMA — About', 'rma' );
	$templates['template-case-studies.php']    = __( 'RMA — Case Studies', 'rma' );
	$templates['template-contact.php']         = __( 'RMA — Contact', 'rma' );
	$templates['template-careers.php']         = __( 'RMA — Careers', 'rma' );
	return $templates;
}
add_filter( 'theme_page_templates', 'rma_page_templates' );

/**
 * SVG icon helper used throughout the templates.
 */
function rma_icon( $name, $size = 22 ) {
	$icons = array(
		'arrow'   => '<path d="M5 12h14M13 6l6 6-6 6"/>',
		'play'    => '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
		'spark'   => '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
		'search'  => '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
		'send'    => '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
		'monitor' => '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
		'shield'  => '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
		'gauge'   => '<path d="M4 18a8 8 0 1116 0"/><path d="M12 14l4-3"/>',
		'check'   => '<path d="M20 6L9 17l-5-5"/>',
		'mail'    => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
		'phone'   => '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.5-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z"/>',
		'pin'     => '<path d="M12 21s-7-5.7-7-11a7 7 0 0114 0c0 5.3-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
		'compass' => '<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-4 0 2-6z" fill="currentColor" stroke="none"/>',
		'target'  => '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
		'rocket'  => '<path d="M5 15c-1 1-1 4-1 4s3 0 4-1M9 11a8 8 0 016-6c3 0 4 1 4 4a8 8 0 01-6 6l-4 1-1-1z"/><circle cx="14.5" cy="9.5" r="1.2"/>',
		'layers'  => '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
		'users'   => '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 5a3.5 3.5 0 010 7M22 20a6.2 6.2 0 00-5-6"/>',
	);
	$path = isset( $icons[ $name ] ) ? $icons[ $name ] : $icons['arrow'];
	return sprintf(
		'<svg width="%1$d" height="%1$d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%2$s</svg>',
		(int) $size,
		$path
	);
}
