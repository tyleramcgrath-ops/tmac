<?php
/**
 * RMA Marketing Agency v7 — theme setup.
 *
 * @package rma
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'RMA_VERSION', '7.0.0' );

require_once get_template_directory() . '/inc/data.php';
require_once get_template_directory() . '/inc/icons.php';
require_once get_template_directory() . '/inc/forms.php';

add_action(
	'after_setup_theme',
	function () {
		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'html5', array( 'search-form', 'comment-form', 'gallery', 'caption', 'style', 'script' ) );
		add_theme_support(
			'custom-logo',
			array(
				'height'      => 96,
				'width'       => 96,
				'flex-height' => true,
				'flex-width'  => true,
			)
		);
		add_theme_support( 'align-wide' );
		add_theme_support( 'responsive-embeds' );
	}
);

add_action(
	'wp_enqueue_scripts',
	function () {
		$uri = get_template_directory_uri();
		wp_enqueue_style(
			'rma-fonts',
			'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;600&display=swap',
			array(),
			null
		);
		wp_enqueue_style( 'rma-main', $uri . '/assets/css/main.css', array( 'rma-fonts' ), RMA_VERSION );
		wp_enqueue_script( 'rma-main', $uri . '/assets/js/main.js', array(), RMA_VERSION, true );
	}
);

add_action(
	'wp_head',
	function () {
		echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
		echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
		echo '<meta name="theme-color" content="#070b14">' . "\n";
		// Mark JS as available, and skip the intro before first paint for
		// visitors who have seen it this session or prefer reduced motion.
		echo "<script>(function(d){d.classList.add('js');try{if(sessionStorage.getItem('rmaIntroSeen')||matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('intro-done')}}catch(e){}})(document.documentElement)</script>\n";
	},
	1
);

/**
 * The site title is still WordPress's default "My WordPress"; until it is
 * changed in Settings > General, show the agency name in browser tabs.
 */
add_filter(
	'document_title_parts',
	function ( $parts ) {
		foreach ( array( 'title', 'site' ) as $key ) {
			if ( isset( $parts[ $key ] ) && 'My WordPress' === $parts[ $key ] ) {
				$parts[ $key ] = 'Relative Marketing Agency';
			}
		}
		if ( is_front_page() ) {
			$parts['tagline'] = 'Strategy. Creativity. Real Growth.';
		}
		return $parts;
	}
);

/**
 * Whether the current page was built with Elementor, in which case the
 * template steps aside and lets Elementor own the layout.
 */
function rma_is_elementor_page() {
	$id = get_the_ID();
	return $id && 'builder' === get_post_meta( $id, '_elementor_edit_mode', true );
}

/**
 * Make sure every page the menu links to exists. v6 also pinned a template
 * file to each page; v7 has no such files, so WordPress falls through to
 * page.php, which routes by slug. The pins are left alone so switching back
 * to v6 still works.
 */
add_action(
	'after_switch_theme',
	function () {
		$pages = array();
		foreach ( rma_company_pages() as $slug => $page ) {
			$pages[ $slug ] = $page['title'];
		}
		foreach ( rma_services() as $slug => $service ) {
			$pages[ $slug ] = $service['title'];
		}
		foreach ( $pages as $slug => $title ) {
			if ( get_page_by_path( $slug ) ) {
				continue;
			}
			wp_insert_post(
				array(
					'post_title'   => $title,
					'post_name'    => $slug,
					'post_status'  => 'publish',
					'post_type'    => 'page',
					'post_content' => '',
				)
			);
		}
	}
);

/**
 * The logo: the Customizer's if one is set, the bundled RMA mark otherwise.
 */
function rma_logo() {
	if ( has_custom_logo() ) {
		$id  = get_theme_mod( 'custom_logo' );
		$src = wp_get_attachment_image_url( $id, 'medium' );
	} else {
		$src = get_template_directory_uri() . '/assets/images/logo.png';
	}
	return '<img class="brand-mark" src="' . esc_url( $src ) . '" alt="" width="120" height="39">';
}
