<?php
/**
 * The photo gallery.
 *
 * Two sources, in order: images the client has put in the Gallery page's own
 * block gallery, and failing that the theme's bundled `gallery-N` slots. So the
 * gallery works out of the box and becomes client-managed the moment they add
 * photos to the page, with no template change.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * One normalised gallery entry.
 *
 * @param int $attachment_id Attachment ID.
 * @return array<string, mixed>|null
 */
function pt_gallery_entry_from_attachment( $attachment_id ) {
	$full = wp_get_attachment_image_src( $attachment_id, 'full' );

	if ( ! $full ) {
		return null;
	}

	return array(
		'id'     => (int) $attachment_id,
		'full'   => $full[0],
		'width'  => (int) $full[1],
		'height' => (int) $full[2],
		'alt'    => (string) get_post_meta( $attachment_id, '_wp_attachment_image_alt', true ),
		'slot'   => '',
	);
}

/**
 * Gallery images for the site.
 *
 * @param int $limit Maximum images.
 * @return array<int, array<string, mixed>>
 */
function pt_gallery_images( $limit = 24 ) {
	$images = array();

	/*
	 * 1. Whatever the client put on the Gallery page. Parsing the blocks rather
	 *    than querying attachments keeps the client's own ordering.
	 */
	$page = get_page_by_path( 'gallery' );

	if ( $page instanceof WP_Post && has_blocks( $page->post_content ) ) {
		foreach ( parse_blocks( $page->post_content ) as $block ) {
			foreach ( pt_gallery_block_ids( $block ) as $attachment_id ) {
				$entry = pt_gallery_entry_from_attachment( $attachment_id );

				if ( $entry ) {
					$images[ $attachment_id ] = $entry;
				}
			}
		}
	}

	if ( $images ) {
		return array_slice( array_values( $images ), 0, $limit );
	}

	// 2. The bundled slots.
	for ( $i = 1; $i <= 12; $i++ ) {
		$slot = 'gallery-' . $i;

		if ( ! pt_image_exists( $slot ) ) {
			continue;
		}

		$definition = pt_image_slot( $slot );

		$images[] = array(
			'id'     => 0,
			'full'   => PT_URI . 'assets/images/src/' . rawurlencode( $definition['file'] ),
			'width'  => (int) $definition['w'],
			'height' => (int) $definition['h'],
			'alt'    => isset( $definition['alt'] ) ? $definition['alt'] : '',
			'slot'   => $slot,
		);
	}

	return array_slice( $images, 0, $limit );
}

/**
 * Attachment IDs inside an image or gallery block, including nested blocks.
 *
 * @param array $block Parsed block.
 * @return array<int, int>
 */
function pt_gallery_block_ids( $block ) {
	$ids = array();

	if ( isset( $block['blockName'] ) && 'core/image' === $block['blockName'] && ! empty( $block['attrs']['id'] ) ) {
		$ids[] = (int) $block['attrs']['id'];
	}

	if ( isset( $block['blockName'] ) && 'core/gallery' === $block['blockName'] && ! empty( $block['attrs']['ids'] ) ) {
		foreach ( (array) $block['attrs']['ids'] as $id ) {
			$ids[] = (int) $id;
		}
	}

	if ( ! empty( $block['innerBlocks'] ) ) {
		foreach ( $block['innerBlocks'] as $inner ) {
			$ids = array_merge( $ids, pt_gallery_block_ids( $inner ) );
		}
	}

	return $ids;
}

/**
 * Render one gallery tile's image at thumbnail size.
 *
 * @param array $image    Gallery entry.
 * @param bool  $priority Whether this is the first tile.
 */
function pt_gallery_thumb( $image, $priority = false ) {
	$sizes = '(min-width: 1100px) 300px, (min-width: 700px) 33vw, 50vw';

	if ( $image['id'] ) {
		echo wp_get_attachment_image(
			$image['id'],
			'pt-card',
			false,
			array(
				'class'         => 'gallery__img',
				'alt'           => $image['alt'],
				'sizes'         => $sizes,
				'loading'       => $priority ? 'eager' : 'lazy',
				'decoding'      => 'async',
				'fetchpriority' => $priority ? 'high' : 'auto',
			)
		);
		return;
	}

	$srcset = '';

	if ( $image['slot'] ) {
		$definition = pt_image_slot( $image['slot'] );

		if ( $definition && ! empty( $definition['file'] ) && function_exists( 'pt_bundled_srcset' ) ) {
			$srcset = pt_bundled_srcset( $definition['file'], (int) $image['width'] );
		}
	}

	printf(
		'<img class="gallery__img" src="%1$s" width="%2$d" height="%3$d" alt="%4$s" loading="%5$s" decoding="async"%6$s />',
		esc_url( $image['full'] ),
		(int) $image['width'],
		(int) $image['height'],
		esc_attr( $image['alt'] ),
		esc_attr( $priority ? 'eager' : 'lazy' ),
		$srcset ? ' srcset="' . esc_attr( $srcset ) . '" sizes="' . esc_attr( $sizes ) . '"' : ''
	);
}

/**
 * ImageGallery schema, so the gallery is eligible for image results.
 */
function pt_print_gallery_schema() {
	if ( ! is_page_template( 'page-templates/page-gallery.php' ) ) {
		return;
	}

	$images = pt_gallery_images();

	if ( ! $images ) {
		return;
	}

	$items = array();

	foreach ( $images as $index => $image ) {
		$items[] = array(
			'@type'    => 'ListItem',
			'position' => $index + 1,
			'item'     => array_filter(
				array(
					'@type'       => 'ImageObject',
					'contentUrl'  => $image['full'],
					'width'       => $image['width'],
					'height'      => $image['height'],
					'description' => $image['alt'],
				)
			),
		);
	}

	pt_print_jsonld(
		array(
			'@context'        => 'https://schema.org',
			'@type'           => 'ImageGallery',
			'name'            => get_the_title(),
			'url'             => get_permalink(),
			'itemListElement' => $items,
		)
	);
}
add_action( 'wp_head', 'pt_print_gallery_schema', 33 );
