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

	/*
	 * Renames run before anything creates an experience. pt_backfill_experiences()
	 * adds whatever the seed definitions describe and is missing, and those
	 * definitions now carry the new names — so creating first would make a
	 * second "Catamaran Tour" and leave the real one, bookings and all,
	 * renamed to catamaran-tour-2 beside it.
	 */
	pt_backfill_tour_lineup();
	pt_backfill_experiences();
	pt_backfill_guide_names();
	pt_backfill_post_images();
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

/**
 * Bring an existing site onto the 2026 tour line-up.
 *
 * The seeder only runs on a fresh install, so a site set up earlier keeps the
 * old names, the old copy and the old inclusions forever. These are the same
 * tours renamed and described properly rather than new ones, so they are
 * updated in place: the post IDs, their bookings and their URLs survive.
 *
 * @return int How many experiences were changed.
 */
function pt_backfill_tour_lineup() {
	/*
	 * Old title => new title. The surf lessons map by how they were sold
	 * rather than by name: the old beginner lesson was the group one, and the
	 * intermediate lesson was the small-group rate.
	 */
	$renames = array(
		'Sunset Boat Tour'          => 'Catamaran Tour',
		'Estuary & Wildlife Trip'   => 'Safari Boat',
		'Estuary &amp; Wildlife Trip' => 'Safari Boat',
		'Surf Lesson — Beginner'    => 'Group Surf Lesson',
		'Surf Lesson — Intermediate' => 'Semi-Private Surf Lesson',
		'Private Surf Coaching'     => 'Private Surf Lesson',
	);

	$changed = 0;

	foreach ( $renames as $old => $new ) {
		$post = pt_find_experience_by_title( $old );

		if ( ! $post ) {
			continue;
		}

		/*
		 * Somebody may have made the new one by hand already. Renaming onto it
		 * would take a "-2" slug and leave two of the same tour, so leave the
		 * old one alone and let a person decide which to keep.
		 */
		if ( pt_find_experience_by_title( $new ) ) {
			continue;
		}

		wp_update_post(
			array(
				'ID'         => $post->ID,
				'post_title' => $new,
				'post_name'  => sanitize_title( $new ),
			)
		);

		++$changed;
	}

	/*
	 * Now re-apply the copy. Every tour's inclusions, duration and summary
	 * were rewritten from what the operator actually sells, so the old text is
	 * not worth preserving — but anything they have edited by hand on top of a
	 * seeded value would be, which is why this runs once per version rather
	 * than on every load.
	 */
	foreach ( pt_seed_experiences() as $item ) {
		$post = pt_find_experience_by_title( $item['title'] );

		if ( ! $post ) {
			// Genuinely new in this release, so create it.
			pt_insert_experience( $item, 0 );
			++$changed;

			continue;
		}

		pt_refresh_experience_copy( $post->ID, $item );
		++$changed;
	}

	return $changed;
}

/**
 * An experience by its exact title.
 *
 * @param string $title Title.
 * @return WP_Post|null
 */
function pt_find_experience_by_title( $title ) {
	$found = get_posts(
		array(
			'post_type'        => PT_EXPERIENCE_POST_TYPE,
			'post_status'      => 'any',
			'posts_per_page'   => 1,
			'title'            => $title,
			'suppress_filters' => true,
		)
	);

	return $found ? $found[0] : null;
}

/**
 * Write a seed definition's copy onto an experience that already exists.
 *
 * Only the descriptive fields. Prices are left alone because the operator sets
 * those, and the schedule is left alone because they may have tuned it.
 *
 * @param int                  $post_id Experience ID.
 * @param array<string, mixed> $item    Seed definition.
 */
function pt_refresh_experience_copy( $post_id, $item ) {
	if ( ! empty( $item['excerpt'] ) ) {
		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_excerpt' => $item['excerpt'],
			)
		);
	}

	if ( ! empty( $item['type'] ) ) {
		wp_set_object_terms( $post_id, $item['type'], 'experience_type' );
	}

	if ( ! empty( $item['level'] ) ) {
		wp_set_object_terms( $post_id, $item['level'], 'skill_level' );
	}

	$fields = array(
		'duration'   => isset( $item['duration'] ) ? $item['duration'] : '',
		'group_size' => isset( $item['group'] ) ? $item['group'] : '',
		'includes'   => isset( $item['includes'] ) ? implode( "\n", $item['includes'] ) : '',
		'bring'      => isset( $item['bring'] ) ? implode( "\n", $item['bring'] ) : '',
		'faq'        => isset( $item['faq'] ) ? implode( "\n", $item['faq'] ) : '',
	);

	foreach ( $fields as $key => $value ) {
		if ( '' !== $value ) {
			update_post_meta( $post_id, '_pt_' . $key, $value );
		}
	}

	/*
	 * The three lessons that were replaced carried an invented rating and
	 * review count. Nothing on this site should show a score nobody gave it.
	 */
	delete_post_meta( $post_id, '_pt_rating' );
	delete_post_meta( $post_id, '_pt_review_count' );

	if ( ! empty( $item['image'] ) ) {
		$attachment_id = pt_sideload_theme_image( $item['image'], isset( $item['alt'] ) ? $item['alt'] : '' );

		if ( $attachment_id ) {
			set_post_thumbnail( $post_id, $attachment_id );
		}
	}
}

/**
 * Put a photograph back on every article.
 *
 * Three of the five referenced stock files that were deleted when the site
 * moved to the operator's own photography, so those posts have been running
 * with no featured image — which is why the Journal showed the same fallback
 * picture five times in a row.
 *
 * @return int How many articles were given an image.
 */
function pt_backfill_post_images() {
	if ( ! function_exists( 'pt_seed_post_map' ) || ! function_exists( 'pt_sideload_theme_image' ) ) {
		return 0;
	}

	$fixed = 0;

	foreach ( pt_seed_post_map() as $item ) {
		if ( empty( $item['slug'] ) || empty( $item['image'] ) ) {
			continue;
		}

		$post = get_page_by_path( $item['slug'], OBJECT, 'post' );

		if ( ! $post ) {
			continue;
		}

		/*
		 * Replace a missing image, and also one pointing at a file the theme
		 * no longer ships — that attachment renders as a broken tile.
		 */
		$current = get_post_thumbnail_id( $post->ID );
		$source  = $current ? (string) get_post_meta( $current, '_pt_seed_source', true ) : '';
		$stale   = $source && ! file_exists( PT_DIR . 'assets/images/src/' . $source );

		if ( $current && ! $stale && $source === $item['image'] ) {
			continue;
		}

		$attachment_id = pt_sideload_theme_image(
			$item['image'],
			isset( $item['alt'] ) ? $item['alt'] : ''
		);

		if ( $attachment_id ) {
			set_post_thumbnail( $post->ID, $attachment_id );
			++$fixed;
		}
	}

	return $fixed;
}
