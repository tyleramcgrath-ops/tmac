<?php
/**
 * Teddy Midnight theme bootstrap.
 *
 * The storefront markup and behavior are shared with the static redesign:
 * assets/site.css and assets/site.js are the same files. WordPress passes
 * window.TEDDY (asset base, page URLs, the WooCommerce catalog, the cart
 * endpoint) so the script runs against the real store.
 */

defined( 'ABSPATH' ) || exit;

define( 'TEDDY_VER', '1.0.0' );
define( 'TEDDY_DIR', get_template_directory() );
define( 'TEDDY_URI', get_template_directory_uri() );

require TEDDY_DIR . '/inc/catalog.php';
require TEDDY_DIR . '/inc/customizer.php';
require TEDDY_DIR . '/inc/subscribers.php';
require TEDDY_DIR . '/inc/woocommerce.php';
require TEDDY_DIR . '/inc/setup.php';

/** URL of a file inside the theme's assets folder. */
function teddy_asset( $path ) {
	return TEDDY_URI . '/assets/' . ltrim( $path, '/' );
}

/** True when WooCommerce is active. */
function teddy_has_wc() {
	return class_exists( 'WooCommerce' ) && function_exists( 'WC' );
}

/** Find a page by slug, falling back to the first page using a template. */
function teddy_page_id( $slug, $template = '' ) {
	$page = get_page_by_path( $slug );
	if ( $page && 'publish' === $page->post_status ) {
		return (int) $page->ID;
	}
	if ( $template ) {
		$ids = get_posts( array( 'post_type' => 'page', 'meta_key' => '_wp_page_template', 'meta_value' => $template, 'fields' => 'ids', 'numberposts' => 1 ) );
		if ( $ids ) {
			return (int) $ids[0];
		}
	}
	return 0;
}

/** Storefront URLs by key: home, shop, studio, campaign, checkout, cart. */
function teddy_url( $key, $hash = '' ) {
	switch ( $key ) {
		case 'shop':
			$url = teddy_has_wc() ? wc_get_page_permalink( 'shop' ) : home_url( '/' );
			break;
		case 'studio':
			$id  = teddy_page_id( 'monogram-studio', 'page-templates/studio.php' );
			$url = $id ? get_permalink( $id ) : home_url( '/' );
			break;
		case 'campaign':
			$id  = teddy_page_id( 'campaign', 'page-templates/campaign.php' );
			$url = $id ? get_permalink( $id ) : home_url( '/' );
			break;
		case 'checkout':
			$url = teddy_has_wc() ? wc_get_checkout_url() : '';
			break;
		case 'cart':
			$url = teddy_has_wc() ? wc_get_cart_url() : '';
			break;
		default:
			$url = home_url( '/' );
	}
	return $hash ? $url . '#' . $hash : $url;
}

/** Permalink of a product by slug (falls back to the shop). */
function teddy_product_url( $slug ) {
	$post = get_page_by_path( $slug, OBJECT, 'product' );
	return $post ? get_permalink( $post ) : teddy_url( 'shop' );
}

/** Per-request body settings: which page script runs and whether the header floats over a hero. */
function teddy_body( $set = null ) {
	static $body = array( 'page' => '', 'id' => '', 'hero' => false );
	if ( is_array( $set ) ) {
		$body = array_merge( $body, $set );
	}
	return $body;
}

add_action( 'after_setup_theme', function () {
	load_theme_textdomain( 'teddy', TEDDY_DIR . '/languages' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'woocommerce', array( 'product_grid' => array( 'default_columns' => 4 ) ) );
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );
	add_theme_support( 'editor-styles' );
} );

add_action( 'wp_enqueue_scripts', function () {
	$fonts = 'https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,300..900;1,62..125,300..900&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=IBM+Plex+Mono:wght@400;500&family=Yellowtail&family=Graduate&family=Rye&display=swap';
	wp_enqueue_style( 'teddy-fonts', $fonts, array(), null );
	$deps = array( 'teddy-fonts' );
	foreach ( array( 'woocommerce-general', 'woocommerce-layout', 'wc-blocks-style' ) as $h ) {
		if ( wp_style_is( $h, 'registered' ) ) {
			$deps[] = $h;
		}
	}
	wp_enqueue_style( 'teddy-site', teddy_asset( 'site.css' ), $deps, TEDDY_VER );
	wp_enqueue_style( 'teddy-wp', teddy_asset( 'wp.css' ), array( 'teddy-site' ), TEDDY_VER );

	wp_enqueue_script( 'teddy-site', teddy_asset( 'site.js' ), array(), TEDDY_VER, true );
	wp_add_inline_script( 'teddy-site', 'window.TEDDY = ' . wp_json_encode( teddy_js_config() ) . ';', 'before' );
}, 20 );

/** Everything site.js needs from WordPress. */
function teddy_js_config() {
	$cfg = array(
		'assets' => teddy_asset( '' ),
		'urls'   => array(
			'home'      => home_url( '/' ),
			'shop'      => teddy_url( 'shop' ),
			'studio'    => teddy_url( 'studio' ),
			'campaign'  => teddy_url( 'campaign' ),
			'checkout'  => teddy_url( 'checkout' ),
			'faq'       => get_theme_mod( 'teddy_faq_url', 'https://teddyheadwear.com/pages/faq' ),
			'instagram' => get_theme_mod( 'teddy_instagram_url', 'https://www.instagram.com/teddyheadwear/' ),
		),
		'fee'    => (float) get_theme_mod( 'teddy_monogram_fee', 25 ),
	);
	if ( teddy_has_wc() ) {
		$cfg['ajax']  = admin_url( 'admin-ajax.php' );
		$cfg['nonce'] = wp_create_nonce( 'teddy' );
		$catalog      = teddy_catalog_json();
		if ( $catalog ) {
			$cfg['products'] = $catalog;
			$prices          = array();
			foreach ( $catalog as $p ) {
				if ( 'hat' === $p['kind'] && ! isset( $prices[ $p['type'] ] ) ) {
					$prices[ $p['type'] ] = $p['price'];
				}
			}
			$cfg['hatPrice'] = (object) $prices;
		}
	} else {
		// Without WooCommerce the theme still renders the full catalog from its bundled data, with a browser-only cart.
		$cfg['urls']['checkout'] = '';
	}
	return $cfg;
}

/** Strip WooCommerce's general styles from the custom storefront templates (cart, checkout and account keep them). */
add_filter( 'woocommerce_enqueue_styles', function ( $styles ) {
	if ( is_front_page() || ( function_exists( 'is_shop' ) && ( is_shop() || is_product() || is_product_taxonomy() ) ) || is_page_template( array( 'page-templates/studio.php', 'page-templates/campaign.php' ) ) ) {
		return array();
	}
	return $styles;
} );

/** Favicon: Teddy's bear, unless the site sets its own icon. */
add_action( 'wp_head', function () {
	if ( ! has_site_icon() ) {
		echo '<link rel="icon" href="' . esc_url( teddy_asset( 'img/bear-favicon.png' ) ) . '">' . "\n";
	}
	echo '<meta name="theme-color" content="#07110C">' . "\n";
}, 5 );

/** Hero image from the Customizer, or the bundled campaign shot. */
function teddy_hero_image() {
	$id = (int) get_theme_mod( 'teddy_hero_image', 0 );
	$src = $id ? wp_get_attachment_image_url( $id, 'full' ) : '';
	return $src ? $src : teddy_asset( 'img/hero-noir.webp' );
}
