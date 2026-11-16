<?php
/**
 * Sun Coast theme: setup, assets and the pieces in /inc.
 */

defined( 'ABSPATH' ) || exit;

define( 'SUNCOAST_VERSION', '1.0.0' );

require get_template_directory() . '/inc/config.php';
require get_template_directory() . '/inc/template-tags.php';
require get_template_directory() . '/inc/content.php';
require get_template_directory() . '/inc/seo.php';
require get_template_directory() . '/inc/redirects.php';
require get_template_directory() . '/inc/form.php';
require get_template_directory() . '/inc/customizer.php';

add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'custom-logo', array( 'height' => 162, 'width' => 283, 'flex-width' => true, 'flex-height' => true ) );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'automatic-feed-links' );
	register_nav_menus( array(
		'primary' => 'Main menu (header)',
		'company' => 'Footer: Company',
	) );
	remove_theme_support( 'widgets-block-editor' );
} );

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'suncoast-fonts', 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Instrument+Sans:wght@400;500;600&display=swap', array(), null );
	wp_enqueue_style( 'suncoast', get_stylesheet_uri(), array( 'suncoast-fonts' ), SUNCOAST_VERSION );
	wp_enqueue_style( 'suncoast-wp', get_template_directory_uri() . '/assets/wp.css', array( 'suncoast' ), SUNCOAST_VERSION );
	wp_enqueue_script( 'suncoast', get_template_directory_uri() . '/assets/main.js', array(), SUNCOAST_VERSION, true );
} );

add_filter( 'style_loader_tag', function ( $tag, $handle ) {
	if ( $handle === 'suncoast-fonts' ) {
		$tag = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n" . $tag;
	}
	return $tag;
}, 10, 2 );

/** The posts page shows every article on one page, grouped by year. */
add_action( 'pre_get_posts', function ( WP_Query $q ) {
	if ( ! is_admin() && $q->is_main_query() && ( $q->is_home() || $q->is_archive() ) ) {
		$q->set( 'posts_per_page', -1 );
	}
} );

/** Dropdowns in the main menu get the theme's markup. */
class Suncoast_Walker extends Walker_Nav_Menu {
	public function start_lvl( &$output, $depth = 0, $args = null ) {
		$output .= '<ul>';
	}
	public function start_el( &$output, $item, $depth = 0, $args = null, $id = 0 ) {
		$classes = empty( $item->classes ) ? array() : (array) $item->classes;
		$has_kids = in_array( 'menu-item-has-children', $classes, true );
		$cur = in_array( 'current-menu-item', $classes, true ) || in_array( 'current_page_item', $classes, true ) ? ' aria-current="page"' : '';
		if ( $depth === 0 ) {
			$output .= $has_kids ? '<div class="dd">' : '';
			$output .= '<a href="' . esc_url( $item->url ) . '"' . $cur . '>' . esc_html( $item->title ) . ( $has_kids ? '<svg aria-hidden="true"><use href="#chev"/></svg>' : '' ) . '</a>';
		} else {
			$output .= '<li><a href="' . esc_url( $item->url ) . '"' . $cur . '>' . esc_html( $item->title ) . '</a>';
		}
	}
	public function end_el( &$output, $item, $depth = 0, $args = null ) {
		$classes = empty( $item->classes ) ? array() : (array) $item->classes;
		if ( $depth === 0 ) {
			$output .= in_array( 'menu-item-has-children', $classes, true ) ? '</div>' : '';
		} else {
			$output .= '</li>';
		}
	}
	public function end_lvl( &$output, $depth = 0, $args = null ) {
		$output .= '</ul>';
	}
}

/** The main menu when none is assigned: the live site's own menu. */
function suncoast_fallback_menu( $mobile = false ) {
	$about = suncoast_url( 'about-suncoast-carpet-cleaning' );
	$svc   = suncoast_url( 'best-cleaning-services-in-florida' );
	$cur   = function ( $slug ) { return is_page( $slug ) ? ' aria-current="page"' : ''; };
	$items = '';
	foreach ( suncoast_nav_services() as $slug => $label ) {
		$items .= $mobile ? '<a href="' . esc_url( suncoast_url( $slug ) ) . '">' . esc_html( $label ) . '</a>'
			: '<li><a href="' . esc_url( suncoast_url( $slug ) ) . '"' . $cur( $slug ) . '>' . esc_html( $label ) . '</a></li>';
	}
	if ( $mobile ) {
		return '<a href="' . esc_url( $about ) . '">About Us</a><a href="' . esc_url( $svc ) . '">Services</a><div class="sub">' . $items . '</div>' .
			'<a href="' . esc_url( suncoast_url( 'news' ) ) . '">News</a><a href="' . esc_url( suncoast_url( 'locations' ) ) . '">Locations</a>' .
			'<a href="' . esc_url( suncoast_url( 'get-that-stain-out' ) ) . '">Get That Stain Out!</a><a href="' . esc_url( suncoast_url( 'contact-us' ) ) . '">Contact Us</a>';
	}
	return '<a href="' . esc_url( $about ) . '"' . $cur( 'about-suncoast-carpet-cleaning' ) . '>About Us</a>' .
		'<div class="dd"><a href="' . esc_url( $svc ) . '"' . $cur( 'best-cleaning-services-in-florida' ) . '>Services<svg aria-hidden="true"><use href="#chev"/></svg></a><ul>' . $items . '</ul></div>' .
		'<a href="' . esc_url( suncoast_url( 'news' ) ) . '"' . ( is_home() || is_singular( 'post' ) ? ' aria-current="page"' : '' ) . '>News</a>' .
		'<a href="' . esc_url( suncoast_url( 'locations' ) ) . '"' . $cur( 'locations' ) . '>Locations</a>' .
		'<a href="' . esc_url( suncoast_url( 'contact-us' ) ) . '"' . $cur( 'contact-us' ) . '>Contact Us</a>';
}

/** Icons used by the templates, printed once at the top of the body. */
function suncoast_icons() {
	return '<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="phone" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
  <symbol id="chat" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
  <symbol id="star" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></symbol>
  <symbol id="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="fb" viewBox="0 0 24 24"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8z"/></symbol>
  <symbol id="tw" viewBox="0 0 24 24"><path d="M22 5.9c-.7.3-1.5.5-2.4.6.9-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.7a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5 0 2 1.4 3.7 3.3 4.1-.6.2-1.2.2-1.9.1a4.1 4.1 0 0 0 3.8 2.8A8.3 8.3 0 0 1 2 18.4 11.7 11.7 0 0 0 8.3 20c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z"/></symbol>
</svg>';
}

/** No comments anywhere; the live site never used them. */
add_filter( 'comments_open', '__return_false', 20 );
add_filter( 'pings_open', '__return_false', 20 );
add_filter( 'comments_array', '__return_empty_array', 10 );

/** Excerpts without the ellipsis link. */
add_filter( 'excerpt_more', function () { return '…'; } );
