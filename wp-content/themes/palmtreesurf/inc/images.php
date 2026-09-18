<?php
/**
 * Manifest-driven image slots.
 *
 * Photography arrives after the build, so no template ever writes a raw <img>
 * for a content photo. Every one goes through pt_image(), which reads
 * assets/images/manifest.json and renders either the real photo or a grey block
 * occupying the identical box. Swapping a placeholder for a photo is therefore
 * a file copy plus one JSON edit — no template change, and no layout shift.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * The image manifest, read once per request.
 *
 * @return array<string, array<string, mixed>>
 */
function pt_image_manifest() {
	static $manifest = null;

	if ( null !== $manifest ) {
		return $manifest;
	}

	$manifest = array();
	$path     = PT_DIR . 'assets/images/manifest.json';

	if ( ! file_exists( $path ) ) {
		return $manifest;
	}

	$raw     = file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local theme file.
	$decoded = json_decode( $raw, true );

	if ( is_array( $decoded ) ) {
		unset( $decoded['_readme'] );
		$manifest = $decoded;
	}

	return $manifest;
}

/**
 * One slot's definition.
 *
 * @param string $slot Slot key.
 * @return array<string, mixed>|null
 */
function pt_image_slot( $slot ) {
	$manifest = pt_image_manifest();

	return isset( $manifest[ $slot ] ) ? $manifest[ $slot ] : null;
}

/**
 * Render an image slot.
 *
 * Resolution order: a Media Library attachment named by the slot's `option`
 * (which is how the client supplies photos), then a theme-bundled `file`, then
 * a placeholder.
 *
 * @param string $slot Slot key.
 * @param array  $args Optional overrides: class, alt, loading, sizes, priority.
 */
function pt_image( $slot, $args = array() ) {
	$definition = pt_image_slot( $slot );

	if ( ! $definition ) {
		return;
	}

	$args = wp_parse_args(
		$args,
		array(
			'class'    => '',
			'alt'      => isset( $definition['alt'] ) ? $definition['alt'] : '',
			'loading'  => 'lazy',
			'priority' => false,
			'sizes'    => '',
		)
	);

	$width  = (int) $definition['w'];
	$height = (int) $definition['h'];
	$class  = trim( 'pt-image pt-image--' . sanitize_html_class( $slot ) . ' ' . $args['class'] );

	// 1. A Media Library attachment set by the client wins.
	if ( ! empty( $definition['option'] ) ) {
		$attachment_id = (int) get_theme_mod( $definition['option'], 0 );

		if ( $attachment_id ) {
			echo wp_get_attachment_image(
				$attachment_id,
				'full',
				false,
				array(
					'class'         => $class,
					'alt'           => $args['alt'],
					'loading'       => $args['priority'] ? 'eager' : $args['loading'],
					'decoding'      => 'async',
					'fetchpriority' => $args['priority'] ? 'high' : 'auto',
				)
			);
			return;
		}
	}

	// 2. A photo bundled with the theme.
	if ( ! empty( $definition['file'] ) ) {
		$file = PT_DIR . 'assets/images/src/' . $definition['file'];

		if ( file_exists( $file ) ) {
			printf(
				'<img src="%1$s" width="%2$d" height="%3$d" alt="%4$s" class="%5$s" loading="%6$s" decoding="async"%7$s />',
				esc_url( PT_URI . 'assets/images/src/' . rawurlencode( $definition['file'] ) ),
				$width,
				$height,
				esc_attr( $args['alt'] ),
				esc_attr( $class ),
				esc_attr( $args['priority'] ? 'eager' : $args['loading'] ),
				$args['priority'] ? ' fetchpriority="high"' : ''
			);
			return;
		}
	}

	// 3. A placeholder occupying the exact box the photo will.
	printf(
		'<div class="%1$s pt-image--placeholder" style="aspect-ratio:%2$d/%3$d" role="img" aria-label="%4$s"><span>%5$s<br />%2$d&times;%3$d</span></div>',
		esc_attr( $class ),
		$width,
		$height,
		esc_attr(
			sprintf(
				/* translators: %s: image slot description. */
				__( 'Photo coming soon: %s', 'palmtreesurf' ),
				isset( $definition['role'] ) ? $definition['role'] : $slot
			)
		),
		esc_html( $slot )
	);
}

/**
 * Whether a slot currently has a real photo behind it.
 *
 * Lets a section hide itself rather than render a wall of grey boxes.
 *
 * @param string $slot Slot key.
 * @return bool
 */
function pt_image_exists( $slot ) {
	$definition = pt_image_slot( $slot );

	if ( ! $definition ) {
		return false;
	}

	if ( ! empty( $definition['option'] ) && get_theme_mod( $definition['option'], 0 ) ) {
		return true;
	}

	return ! empty( $definition['file'] ) && file_exists( PT_DIR . 'assets/images/src/' . $definition['file'] );
}

/**
 * Register the theme's crops.
 */
function pt_image_sizes() {
	add_image_size( 'pt-card', 800, 600, true );
	add_image_size( 'pt-hero', 1920, 1080, true );
	add_image_size( 'pt-portrait', 800, 1067, true );
	add_image_size( 'pt-gallery', 1200, 1200, false );
}
add_action( 'after_setup_theme', 'pt_image_sizes' );

/**
 * URL for the hero poster image, used as the video poster.
 *
 * @return string
 */
function pt_hero_poster_url() {
	$attachment_id = (int) get_theme_mod( 'pt_hero_image', 0 );

	if ( $attachment_id ) {
		$url = wp_get_attachment_image_url( $attachment_id, 'pt-hero' );
		if ( $url ) {
			return $url;
		}
	}

	$slot = pt_image_slot( 'hero-home' );

	if ( $slot && ! empty( $slot['file'] ) && file_exists( PT_DIR . 'assets/images/src/' . $slot['file'] ) ) {
		return PT_URI . 'assets/images/src/' . rawurlencode( $slot['file'] );
	}

	return '';
}
