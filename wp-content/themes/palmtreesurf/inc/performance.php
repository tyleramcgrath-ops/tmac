<?php
/**
 * Front-end performance.
 *
 * Everything here removes work the browser was doing for nothing, or brings the
 * largest image forward. Nothing here changes what the page looks like.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Drop the emoji script and its stylesheet.
 *
 * WordPress ships a script that scans every page for emoji and swaps them for
 * images on platforms that cannot render them. Every current browser can, so
 * this is a render-blocking request and an inline script for nothing.
 */
function pt_disable_emojis() {
	remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
	remove_action( 'wp_print_styles', 'print_emoji_styles' );
	remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
	remove_action( 'admin_print_styles', 'print_emoji_styles' );
	remove_filter( 'the_content_feed', 'wp_staticize_emoji' );
	remove_filter( 'comment_text_rss', 'wp_staticize_emoji' );
	remove_filter( 'wp_mail', 'wp_staticize_emoji_for_email' );

	add_filter(
		'tiny_mce_plugins',
		function ( $plugins ) {
			return is_array( $plugins ) ? array_diff( $plugins, array( 'wpemoji' ) ) : $plugins;
		}
	);
}
add_action( 'init', 'pt_disable_emojis' );

/**
 * Remove head links nothing uses any more.
 *
 * RSD and wlwmanifest served Windows Live Writer and remote publishing clients
 * that no longer exist. The shortlink and oEmbed discovery tags are unused by
 * this site. Each is a line in every response and, for oEmbed, a script.
 */
function pt_clean_head() {
	remove_action( 'wp_head', 'rsd_link' );
	remove_action( 'wp_head', 'wlwmanifest_link' );
	remove_action( 'wp_head', 'wp_shortlink_wp_head' );
	remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );
	remove_action( 'wp_head', 'wp_oembed_add_host_js' );
	remove_action( 'wp_head', 'adjacent_posts_rel_link_wp_head', 10 );
}
add_action( 'init', 'pt_clean_head' );

/**
 * Drop the block library CSS on the front end unless the page uses blocks.
 *
 * Most of this site is templates, not block content. Loading the full block
 * library stylesheet on a page with no blocks is a render-blocking request for
 * rules nothing matches.
 */
function pt_trim_block_styles() {
	if ( is_admin() ) {
		return;
	}

	$post = get_post();

	if ( $post instanceof WP_Post && has_blocks( $post->post_content ) ) {
		return;
	}

	// The journal and any listing can still surface block content in excerpts.
	if ( is_home() || is_archive() || is_search() ) {
		return;
	}

	wp_dequeue_style( 'wp-block-library' );
	wp_dequeue_style( 'wp-block-library-theme' );
	wp_dequeue_style( 'classic-theme-styles' );
	wp_dequeue_style( 'global-styles' );
}
add_action( 'wp_enqueue_scripts', 'pt_trim_block_styles', 100 );

/**
 * Preload the image the page is about to paint largest.
 *
 * LCP is usually the hero photo, and the browser only discovers it after the
 * CSS has parsed. Preloading it starts the download with the HTML.
 */
function pt_preload_lcp_image() {
	$url    = '';
	$srcset = '';
	$sizes  = '100vw';

	if ( is_front_page() ) {
		$url    = pt_image_src( 'hero-home' );
		$srcset = pt_slot_srcset( 'hero-home' );
	} elseif ( is_singular( PT_EXPERIENCE_POST_TYPE ) || is_singular( 'post' ) ) {
		$id = get_queried_object_id();

		if ( has_post_thumbnail( $id ) ) {
			$url    = (string) get_the_post_thumbnail_url( $id, 'pt-hero' );
			$srcset = (string) wp_get_attachment_image_srcset( get_post_thumbnail_id( $id ), 'pt-hero' );
		}
	} elseif ( is_tax( pt_experience_taxonomies() ) ) {
		$term   = get_queried_object();
		$slot   = $term instanceof WP_Term ? pt_term_image_slot( $term ) : '';
		$slot   = $slot ? $slot : 'story-banner';
		$url    = pt_image_src( $slot );
		$srcset = pt_slot_srcset( $slot );
	} elseif ( is_post_type_archive( PT_EXPERIENCE_POST_TYPE ) ) {
		$url    = pt_image_src( 'story-banner' );
		$srcset = pt_slot_srcset( 'story-banner' );
	}

	if ( ! $url ) {
		return;
	}

	printf(
		'<link rel="preload" as="image" href="%s"%s%s fetchpriority="high" />' . "\n",
		esc_url( $url ),
		$srcset ? ' imagesrcset="' . esc_attr( $srcset ) . '"' : '',
		$srcset ? ' imagesizes="' . esc_attr( $sizes ) . '"' : ''
	);
}
add_action( 'wp_head', 'pt_preload_lcp_image', 2 );

/**
 * The srcset a bundled slot will render with.
 *
 * The preload has to offer the browser the same candidates as the <img>, or it
 * picks the full-size file and the page downloads the hero twice.
 *
 * @param string $slot Slot key.
 * @return string
 */
function pt_slot_srcset( $slot ) {
	$definition = pt_image_slot( $slot );

	if ( ! $definition || empty( $definition['file'] ) || ! function_exists( 'pt_bundled_srcset' ) ) {
		return '';
	}

	// An attachment set by the client wins in pt_image(), and carries its own.
	if ( ! empty( $definition['option'] ) && get_theme_mod( $definition['option'], 0 ) ) {
		return '';
	}

	return pt_bundled_srcset( $definition['file'], (int) $definition['w'] );
}

/**
 * The URL behind an image slot, following the same resolution order as
 * pt_image() so a preload never points at a file the page will not use.
 *
 * @param string $slot Slot key.
 * @return string
 */
function pt_image_src( $slot ) {
	$definition = pt_image_slot( $slot );

	if ( ! $definition ) {
		return '';
	}

	if ( ! empty( $definition['option'] ) ) {
		$attachment_id = (int) get_theme_mod( $definition['option'], 0 );

		if ( $attachment_id ) {
			return (string) wp_get_attachment_image_url( $attachment_id, 'full' );
		}
	}

	if ( ! empty( $definition['file'] ) && file_exists( PT_DIR . 'assets/images/src/' . $definition['file'] ) ) {
		return PT_URI . 'assets/images/src/' . rawurlencode( $definition['file'] );
	}

	return '';
}

/**
 * Stop WordPress guessing the LCP image itself.
 *
 * Core marks what it thinks is the first meaningful image as high priority.
 * The theme already does that deliberately, and core's guess on these templates
 * is frequently a card thumbnail further down the page.
 *
 * @param int $count Number of images to consider.
 * @return int
 */
function pt_omit_auto_fetchpriority( $count ) {
	unset( $count );

	return 0;
}
add_filter( 'wp_omit_loading_attr_threshold', 'pt_omit_auto_fetchpriority' );

/**
 * Serve bundled theme photos with a srcset.
 *
 * pt_image() prints a single file, so a phone downloads the same 2400px banner
 * a desktop does. The variants are generated on upload into the uploads folder
 * for attachments; for bundled files the theme ships pre-sized copies and this
 * builds the srcset from whichever ones exist.
 *
 * @param string $file  Filename in assets/images/src/.
 * @param int    $width Intrinsic width.
 * @return string Empty when no variants are present.
 */
function pt_bundled_srcset( $file, $width ) {
	$name      = pathinfo( $file, PATHINFO_FILENAME );
	$extension = pathinfo( $file, PATHINFO_EXTENSION );
	$sources   = array();

	foreach ( array( 480, 768, 1200, 1600 ) as $size ) {
		if ( $size >= $width ) {
			continue;
		}

		$variant = sprintf( '%s-%d.%s', $name, $size, $extension );

		if ( file_exists( PT_DIR . 'assets/images/src/' . $variant ) ) {
			$sources[] = PT_URI . 'assets/images/src/' . rawurlencode( $variant ) . ' ' . $size . 'w';
		}
	}

	if ( ! $sources ) {
		return '';
	}

	$sources[] = PT_URI . 'assets/images/src/' . rawurlencode( $file ) . ' ' . (int) $width . 'w';

	return implode( ', ', $sources );
}

/**
 * A sane JPEG quality for generated sizes.
 *
 * WordPress defaults to 82, which is already reasonable; this pins it so a host
 * or plugin raising it does not quietly double every thumbnail.
 *
 * @return int
 */
function pt_jpeg_quality() {
	return 82;
}
add_filter( 'jpeg_quality', 'pt_jpeg_quality' );
add_filter( 'wp_editor_set_quality', 'pt_jpeg_quality' );

/**
 * Render a bundled photograph directly, outside the manifest.
 *
 * The manifest exists so a slot can be re-pointed without touching a template,
 * but a page banner sometimes needs one specific file — typically because the
 * slot it would otherwise use is already on screen further down the page.
 *
 * @param string $file Filename in assets/images/src/.
 * @param string $alt  Alt text. Empty for a decorative banner.
 * @param int    $width Intrinsic width to advertise.
 */
function pt_bundled_image( $file, $alt = '', $width = 1600 ) {
	$path = PT_DIR . 'assets/images/src/' . $file;

	if ( ! file_exists( $path ) ) {
		return;
	}

	$size   = getimagesize( $path );
	$width  = $size ? (int) $size[0] : (int) $width;
	$height = $size ? (int) $size[1] : 0;
	$srcset = pt_bundled_srcset( $file, $width );

	$style = pt_focus_style( '', pt_image_focus( $file ) );

	printf(
		'<img src="%1$s"%2$s sizes="100vw" width="%3$d"%4$s alt="%5$s" decoding="async" fetchpriority="high"%6$s />',
		esc_url( PT_URI . 'assets/images/src/' . rawurlencode( $file ) ),
		$srcset ? ' srcset="' . esc_attr( $srcset ) . '"' : '',
		(int) $width,
		$height ? ' height="' . (int) $height . '"' : '',
		esc_attr( $alt ),
		$style ? ' style="' . esc_attr( $style ) . '"' : ''
	);
}
