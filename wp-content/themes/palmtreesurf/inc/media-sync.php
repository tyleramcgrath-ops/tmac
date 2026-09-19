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

/**
 * Refresh seeded media whose theme source has changed.
 *
 * pt_sideload_theme_image() reuses an existing copy rather than duplicating, so
 * a site that sideloaded the originals keeps them even after the theme ships
 * smaller, better-compressed versions. This overwrites the file in uploads and
 * regenerates the crops, keeping the same attachment ID so every reference to
 * it still resolves.
 *
 * Only ever touches attachments the theme itself placed — those carry
 * `_pt_seed_source`. A file the client uploaded is never rewritten.
 */
function pt_refresh_seeded_media() {
	if ( get_option( 'pt_media_refresh_version' ) === PT_VERSION ) {
		return;
	}

	// Marker first: a failure midway must not retry on every request.
	update_option( 'pt_media_refresh_version', PT_VERSION );

	$attachments = get_posts(
		array(
			'post_type'      => 'attachment',
			// Attachments are 'inherit', and get_posts() defaults to 'publish',
			// so without this the query silently returns nothing.
			'post_status'    => 'inherit',
			'posts_per_page' => 100,
			'fields'         => 'ids',
			'meta_key'       => '_pt_seed_source', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		)
	);

	if ( ! $attachments ) {
		return;
	}

	require_once ABSPATH . 'wp-admin/includes/image.php';

	foreach ( $attachments as $attachment_id ) {
		$filename = (string) get_post_meta( $attachment_id, '_pt_seed_source', true );
		$source   = PT_DIR . 'assets/images/src/' . $filename;
		$current  = get_attached_file( $attachment_id );

		if ( ! $filename || ! file_exists( $source ) || ! $current || ! file_exists( $current ) ) {
			continue;
		}

		$changed  = filesize( $source ) !== filesize( $current );
		$metadata = wp_get_attachment_metadata( $attachment_id );

		/*
		 * Also regenerate when a crop the theme registers is missing — a size
		 * added in a later release does not exist on media uploaded before it,
		 * and without the crop there is nothing for the srcset to offer.
		 */
		$missing = false;

		foreach ( array( 'pt-card', 'pt-card-sm', 'pt-portrait', 'pt-portrait-sm' ) as $size ) {
			if ( empty( $metadata['sizes'][ $size ] ) ) {
				$missing = true;
				break;
			}
		}

		if ( ! $changed && ! $missing ) {
			continue;
		}

		if ( $changed && ! copy( $source, $current ) ) {
			continue;
		}

		$metadata = wp_generate_attachment_metadata( $attachment_id, $current );

		if ( ! is_wp_error( $metadata ) && $metadata ) {
			wp_update_attachment_metadata( $attachment_id, $metadata );
		}
	}
}
add_action( 'init', 'pt_refresh_seeded_media', 996 );
