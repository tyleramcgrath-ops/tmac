<?php
/**
 * One-time media sync on theme upgrade.
 *
 * The content seeder only ever runs once, so an install that was already set up
 * would never pick up newly shipped photography. This assigns featured images
 * to the seeded experiences on the first request after the theme version
 * changes.
 *
 * It only ever replaces an image the seeder itself sideloaded — those carry
 * `_pt_seed_source`. A featured image chosen by the client is left alone.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Experience slug to bundled photograph.
 *
 * Fishing Charter is deliberately absent: the asset set has no fishing
 * photograph, and putting a snorkelling or boat shot on a fishing charter would
 * misrepresent what is being sold.
 *
 * @return array<string, array{file: string, alt: string}>
 */
function pt_experience_photo_map() {
	return array(
		'surf-lesson-beginner'     => array(
			'file' => 'beginner-surf-lesson-action.jpg',
			'alt'  => __( 'Beginner surf lesson group on the beach', 'palmtreesurf' ),
		),
		'surf-lesson-intermediate' => array(
			'file' => 'intermediate-surf-action.jpg',
			'alt'  => __( 'Surfer riding a wave at Tamarindo', 'palmtreesurf' ),
		),
		'private-surf-coaching'    => array(
			'file' => 'private-surf-coaching.jpg',
			'alt'  => __( 'One-to-one surf coaching on the sand', 'palmtreesurf' ),
		),
		'sunset-boat-tour'         => array(
			'file' => 'sunset-catamaran-tour.jpg',
			'alt'  => __( 'Catamaran under sail at sunset', 'palmtreesurf' ),
		),
		'estuary-wildlife-trip'    => array(
			'file' => 'sea-turtle-wildlife-underwater.jpg',
			'alt'  => __( 'Sea turtle gliding over the reef', 'palmtreesurf' ),
		),
	);
}

/**
 * Whether an attachment was placed by the theme rather than chosen by a person.
 *
 * @param int $attachment_id Attachment ID.
 * @return bool
 */
function pt_is_theme_placed_image( $attachment_id ) {
	return (bool) get_post_meta( $attachment_id, '_pt_seed_source', true );
}

/**
 * Assign bundled photography to the seeded experiences.
 *
 * Runs once per theme version.
 */
function pt_sync_experience_media() {
	if ( get_option( 'pt_media_version' ) === PT_VERSION ) {
		return;
	}

	// Record first, so a failure part-way cannot loop this on every request.
	update_option( 'pt_media_version', PT_VERSION );

	if ( ! function_exists( 'pt_sideload_theme_image' ) ) {
		return;
	}

	foreach ( pt_experience_photo_map() as $slug => $photo ) {
		$post = get_page_by_path( $slug, OBJECT, PT_EXPERIENCE_POST_TYPE );

		if ( ! $post ) {
			continue;
		}

		$current = (int) get_post_thumbnail_id( $post->ID );

		// Never overwrite a photograph the client picked themselves.
		if ( $current && ! pt_is_theme_placed_image( $current ) ) {
			continue;
		}

		$attachment_id = pt_sideload_theme_image( $photo['file'], $photo['alt'] );

		if ( $attachment_id ) {
			set_post_thumbnail( $post->ID, $attachment_id );
		}
	}
}
add_action( 'init', 'pt_sync_experience_media', 997 );
