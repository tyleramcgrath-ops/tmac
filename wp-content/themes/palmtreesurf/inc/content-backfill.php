<?php
/**
 * Carry new starter content onto an install that was already set up.
 *
 * The seeder is guarded by `pt_content_seeded` and runs exactly once, which is
 * right — it must never trample a client's edits. The cost is that anything
 * added to the definitions afterwards (a new category, a new tour) would never
 * reach a site seeded by an earlier version. This closes that gap on the first
 * request after the theme version changes.
 *
 * Everything here is additive and idempotent: it creates what is missing and
 * never edits or removes what exists, with one exception documented below.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Add terms and experiences that the current version defines but this install
 * does not have, and drop featured images whose source photo the theme no
 * longer ships.
 */
function pt_backfill_content() {
	if ( get_option( 'pt_backfill_version' ) === PT_VERSION ) {
		return;
	}

	// Record first, so a failure part-way cannot loop this on every request.
	update_option( 'pt_backfill_version', PT_VERSION );

	// Nothing to backfill onto a site that has not been seeded at all; the
	// seeder itself will run and create everything.
	if ( ! get_option( 'pt_content_seeded' ) ) {
		return;
	}

	pt_backfill_terms();
	pt_backfill_experiences();
	pt_backfill_guide_names();
	pt_drop_retired_images();
}
add_action( 'init', 'pt_backfill_content', 996 );

/**
 * Create any starter term this install is missing.
 */
function pt_backfill_terms() {
	foreach ( pt_seed_terms_map() as $taxonomy => $terms ) {
		foreach ( $terms as $term ) {
			if ( ! term_exists( $term, $taxonomy ) ) {
				wp_insert_term( $term, $taxonomy );
			}
		}
	}
}

/**
 * Create any starter experience this install is missing.
 *
 * pt_insert_experience() returns 0 when the slug already exists, so an
 * experience the client has edited — or deleted on purpose and does not want
 * back — is never touched. A deliberately deleted one does return, which is the
 * one rough edge here; it is preferable to silently withholding a tour the
 * client is waiting for.
 */
function pt_backfill_experiences() {
	foreach ( pt_seed_experiences() as $index => $item ) {
		pt_insert_experience( $item, $index );
	}
}

/**
 * Unset featured images whose bundled source photograph is gone.
 *
 * When a photo is retired from the theme — a stock plate replaced by the
 * client's own work, say — the attachment sideloaded from it stays in the
 * Media Library and stays pinned as somebody's featured image, so the retired
 * photo keeps rendering. Anything the theme placed itself, and can no longer
 * account for, is unpinned here so the manifest or a newer photo takes over.
 *
 * Only images the theme placed are considered: they carry `_pt_seed_source`.
 * A photograph the client chose has no such marker and is never touched. The
 * attachments are left in the Media Library rather than deleted — removing a
 * client's uploads is their call, not a migration's.
 */
function pt_drop_retired_images() {
	$placed = get_posts(
		array(
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'meta_key'       => '_pt_seed_source', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		)
	);

	if ( ! $placed ) {
		return;
	}

	$retired = array();

	foreach ( $placed as $attachment_id ) {
		$source = (string) get_post_meta( $attachment_id, '_pt_seed_source', true );

		if ( $source && ! file_exists( PT_DIR . 'assets/images/src/' . $source ) ) {
			$retired[] = (int) $attachment_id;
		}
	}

	if ( ! $retired ) {
		return;
	}

	foreach ( $retired as $attachment_id ) {
		$pinned = get_posts(
			array(
				'post_type'      => 'any',
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'meta_key'       => '_thumbnail_id', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value'     => $attachment_id, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			)
		);

		foreach ( $pinned as $post_id ) {
			delete_post_thumbnail( $post_id );
		}
	}

	/*
	 * Let the media sync run again on this request. It is registered later on
	 * init and is version-gated on the same constant, so clearing its stamp
	 * here means the experiences that just lost an image get the current one
	 * immediately rather than on some later upgrade.
	 */
	delete_option( 'pt_media_version' );
}

/**
 * Rename a seeded guide once the client tells us who it actually is.
 *
 * The seeder shipped four guides titled by role — "Lead Instructor", "Surf
 * Guide" and so on — as stand-ins. When a real name arrives it is mapped here,
 * and the stand-in is renamed in place so the guide keeps its ID, its photo and
 * anything else already attached to it.
 *
 * Only a post still carrying the exact stand-in title is touched. Once somebody
 * has renamed a guide themselves the title no longer matches and this leaves it
 * alone for good.
 *
 * @return void
 */
function pt_backfill_guide_names() {
	$names = array(
		// Stand-in title => real name.
		'Lead Instructor' => 'Ezekiel',
	);

	foreach ( $names as $placeholder => $name ) {
		$found = get_posts(
			array(
				'post_type'      => 'instructor',
				'post_status'    => 'any',
				'posts_per_page' => 1,
				'title'          => $placeholder,
			)
		);

		if ( ! $found ) {
			continue;
		}

		$guide = $found[0];

		wp_update_post(
			array(
				'ID'         => $guide->ID,
				'post_title' => $name,
			)
		);

		// Give the guide the role the client stated, unless they set one already.
		$role    = (string) get_post_meta( $guide->ID, '_pt_role', true );
		$stand_in = array( '', 'Head Coach', 'Lead Instructor' );

		if ( in_array( $role, $stand_in, true ) ) {
			update_post_meta( $guide->ID, '_pt_role', 'Guide and Lead Instructor' );
		}

		/*
		 * The stand-in bio described an invented person. Clear it rather than
		 * leave a fictional history attached to somebody real.
		 */
		$bio = (string) get_post_meta( $guide->ID, '_pt_bio_short', true );

		if ( false !== strpos( $bio, 'Grew up on this beach' ) ) {
			delete_post_meta( $guide->ID, '_pt_bio_short' );
		}
	}
}
