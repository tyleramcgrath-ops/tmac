<?php
/**
 * DRIP Clothing Co. — theme setup.
 *
 * @package drip
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'DRIP_VERSION', '1.0.0' );

require_once get_template_directory() . '/inc/icons.php';
require_once get_template_directory() . '/inc/art.php';
require_once get_template_directory() . '/inc/forms.php';
require_once get_template_directory() . '/inc/woo.php';

add_action(
	'after_setup_theme',
	function () {
		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'html5', array( 'search-form', 'comment-form', 'gallery', 'caption', 'style', 'script' ) );
		add_theme_support(
			'custom-logo',
			array(
				'height'      => 120,
				'width'       => 120,
				'flex-height' => true,
				'flex-width'  => true,
			)
		);
		add_theme_support( 'align-wide' );
		add_theme_support( 'responsive-embeds' );
		add_theme_support(
			'woocommerce',
			array(
				'thumbnail_image_width' => 600,
				'single_image_width'    => 1024,
			)
		);
		add_theme_support( 'wc-product-gallery-zoom' );
		add_theme_support( 'wc-product-gallery-lightbox' );
		register_nav_menus(
			array(
				'primary' => 'Primary menu',
				'footer'  => 'Footer menu',
			)
		);
	}
);

add_action(
	'wp_enqueue_scripts',
	function () {
		$uri = get_template_directory_uri();
		wp_enqueue_style(
			'drip-fonts',
			'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,500;1,500&display=swap',
			array(),
			null
		);
		wp_enqueue_style( 'drip-main', $uri . '/assets/css/main.css', array( 'drip-fonts' ), DRIP_VERSION );
		wp_enqueue_script( 'drip-main', $uri . '/assets/js/main.js', array(), DRIP_VERSION, true );
	}
);

add_action(
	'wp_head',
	function () {
		echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
		echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
		echo '<meta name="theme-color" content="#08090b">' . "\n";
		echo '<link rel="icon" href="' . esc_url( get_template_directory_uri() . '/assets/images/drop.svg' ) . '" type="image/svg+xml">' . "\n";
		echo "<script>document.documentElement.classList.add('js')</script>\n";
	},
	1
);

/**
 * The site title is set to "DRP"; the brand on every shirt is DRIP. Show the
 * brand in browser tabs until the title is changed in Settings > General.
 */
add_filter(
	'document_title_parts',
	function ( $parts ) {
		foreach ( array( 'title', 'site' ) as $key ) {
			if ( isset( $parts[ $key ] ) && in_array( $parts[ $key ], array( 'DRP', 'DRP -' ), true ) ) {
				$parts[ $key ] = 'DRIP';
			}
		}
		if ( is_front_page() ) {
			$parts['tagline'] = 'Born from salt water';
		}
		return $parts;
	}
);

/**
 * A page URL by slug.
 *
 * @param string $slug Page slug, or '' for home.
 */
function drip_url( $slug = '' ) {
	return esc_url( home_url( $slug ? '/' . $slug . '/' : '/' ) );
}

/**
 * Whether the current page was built with Elementor, in which case the
 * template steps aside and lets Elementor own the layout.
 */
function drip_is_elementor_page() {
	$id = get_the_ID();
	return $id && 'builder' === get_post_meta( $id, '_elementor_edit_mode', true );
}

/**
 * The logo: the Customizer's if one is set, the drawn drop + wordmark otherwise.
 *
 * @param string $context 'header' or 'footer'.
 */
function drip_logo( $context = 'header' ) {
	if ( has_custom_logo() ) {
		$src = wp_get_attachment_image_url( get_theme_mod( 'custom_logo' ), 'medium' );
		return '<img class="brand-img" src="' . esc_url( $src ) . '" alt="DRIP">';
	}
	return drip_drop( 'brand-drop', $context ) . '<span class="brand-word">DRIP</span>';
}

/**
 * Pages whose layout the theme draws itself. Return false from the
 * 'drip_builtin_page' filter to show that page's editor content instead.
 */
function drip_builtin_pages() {
	return array( 'about', 'contact' );
}
