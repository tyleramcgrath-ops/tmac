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
			/*
			 * Serve the pre-sized variants when they exist, so a phone does not
			 * download a 1920px banner. Without this every device gets the
			 * full-size file, which dominates page weight on mobile.
			 */
			$srcset = function_exists( 'pt_bundled_srcset' )
				? pt_bundled_srcset( $definition['file'], $width )
				: '';

			$sizes = $args['sizes'] ? $args['sizes'] : '100vw';

			/*
			 * Bundled photos never pass through the attachment pipeline, so the
			 * focal point is applied here too — otherwise a banner crops to the
			 * middle and cuts the subject out.
			 */
			$style = pt_focus_style( '', pt_image_focus( $definition['file'] ) );

			printf(
				'<img src="%1$s" width="%2$d" height="%3$d" alt="%4$s" class="%5$s" loading="%6$s" decoding="async"%7$s%8$s%9$s />',
				esc_url( PT_URI . 'assets/images/src/' . rawurlencode( $definition['file'] ) ),
				$width,
				$height,
				esc_attr( $args['alt'] ),
				esc_attr( $class ),
				esc_attr( $args['priority'] ? 'eager' : $args['loading'] ),
				$args['priority'] ? ' fetchpriority="high"' : '',
				$srcset ? ' srcset="' . esc_attr( $srcset ) . '" sizes="' . esc_attr( $sizes ) . '"' : '',
				$style ? ' style="' . esc_attr( $style ) . '"' : ''
			);
			return;
		}
	}

	/*
	 * 3. A designed brand panel occupying the exact box the photo will.
	 *
	 * Deliberately not a grey debug box: the client shows this site to people
	 * before the photography lands, so an empty slot should read as an
	 * intentional brand surface. The slot key is only rendered for logged-in
	 * editors, who need to know which slot to fill.
	 */
	$show_key = is_user_logged_in() && current_user_can( 'edit_posts' );

	printf(
		'<div class="%1$s pt-image--placeholder" style="aspect-ratio:%2$d/%3$d" role="img" aria-label="%4$s">%5$s</div>',
		esc_attr( $class ),
		$width,
		$height,
		esc_attr(
			sprintf(
				/* translators: %s: image slot description. */
				__( 'Photograph coming soon: %s', 'palmtreesurf' ),
				isset( $definition['role'] ) ? $definition['role'] : $slot
			)
		),
		$show_key
			? '<span class="pt-image__slot">' . esc_html( $slot ) . ' &middot; ' . (int) $width . '&times;' . (int) $height . '</span>'
			: ''
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

	/*
	 * Half-width companions. Without a smaller crop in the same aspect ratio
	 * WordPress has nothing to put in the srcset, so a phone downloads the
	 * 800px card image for a 300px slot however good the `sizes` hint is.
	 */
	add_image_size( 'pt-card-sm', 400, 300, true );
	add_image_size( 'pt-portrait-sm', 400, 534, true );
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
