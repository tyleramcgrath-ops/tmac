<?php
/**
 * Where to keep a photograph when it has to be cropped.
 *
 * Most of these are portrait phone photographs and most of the slots they fill
 * are wide bands. A tour hero is roughly two and a half times as wide as it is
 * tall; a picture shot at three to four is a third of that. Something has to go.
 *
 * Left alone, two separate things both threw away the middle of the frame and
 * kept the centre. WordPress hard-crops `pt-hero` and `pt-card` when it builds
 * the intermediate sizes, and then `object-fit: cover` crops what is left again
 * in the browser. On a photograph of people standing on a beach, the centre of
 * the frame is their waists, so the site was running heroes of headless torsos.
 *
 * So every photograph records one number: how far down the frame its subject
 * sits. Both crops anchor on it. That rule has the useful property of being
 * idempotent — anchor a crop at 35% of the frame and the subject is still at
 * 35% of what comes out — so the same number is correct for WordPress's crop
 * and for the browser's, and the two compose instead of fighting.
 *
 * The numbers were read off the photographs, not guessed: faces were detected,
 * then each candidate was rendered at the hero's aspect ratio and looked at.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * How far down the frame each photograph's subject sits, as a percentage.
 *
 * A photograph that is not listed keeps the middle, which is right for a
 * landscape and for anything an operator uploads themselves.
 *
 * @return array<string, int>
 */
function pt_image_focus_map() {
	$map = array(
		// People standing up: the faces are near the top of the frame.
		'surf-students-with-boards.jpg'     => 0,
		'group-instruction-sand.jpg'        => 15,
		'kayak-guides-paddles.jpg'          => 15,
		'kayak-surf-tent.jpg'               => 18,
		'fishing-grouper.jpg'               => 22,
		'fishing-mahi-mahi.jpg'             => 22,
		'hero-tamarindo-beach.jpg'          => 30,
		'kayak-group-guests.jpg'            => 30,
		'fishing-sailfish-release.jpg'      => 32,
		'fishing-yellowfin-tuna.jpg'        => 32,
		'fishing-anglers-tuna.jpg'          => 35,

		// Subject around the middle, but not quite on it.
		'group-lesson-beach.jpg'            => 40,
		'instructor-popup-stance.jpg'       => 40,
		'estuary-crocodile-surfacing.jpg'   => 42,
		'fishing-trolling-wake.jpg'         => 42,
		'fishing-marlin-release.jpg'        => 45,
		'estuary-capuchin-monkey.jpg'       => 48,
		'estuary-capuchin-troop.jpg'        => 48,

		// Subject sits low: a boat on the water, a turtle on the sand.
		'fishing-charter-boat.jpg'          => 52,
		'estuary-mangrove-kayak.jpg'        => 55,
		'estuary-kayaks-mangrove-shore.jpg' => 58,
		'fishing-boat-rods-out.jpg'         => 58,
		'sunset-catamaran-tour.jpg'         => 58,
		'estuary-mangrove-paddlers.jpg'     => 60,
		'turtle-nest-guide-light.jpg'       => 60,
		'turtle-nesting-red-light.jpg'      => 72,
		'turtle-beach-night-stars.jpg'      => 78,
		'turtle-returning-to-sea.jpg'       => 78,
		'turtle-tracks-night-beach.jpg'     => 78,
	);

	/**
	 * Filter where a photograph's subject sits.
	 *
	 * @param array<string, int> $map Filename to percentage from the top.
	 */
	return apply_filters( 'pt_image_focus_map', $map );
}

/**
 * The focal point for one file, as a percentage from the top.
 *
 * Matches on the filename with any uploader suffix removed, because a second
 * copy of a photograph lands as `turtle-returning-to-sea-1.jpg` and is the same
 * picture.
 *
 * @param string $file Filename or path.
 * @return int 0-100, defaulting to 50.
 */
function pt_image_focus( $file ) {
	$map  = pt_image_focus_map();
	$name = basename( (string) $file );

	if ( isset( $map[ $name ] ) ) {
		return (int) $map[ $name ];
	}

	$stripped = preg_replace( '/-\d+(\.[A-Za-z0-9]+)$/', '$1', $name );

	if ( $stripped && isset( $map[ $stripped ] ) ) {
		return (int) $map[ $stripped ];
	}

	return 50;
}

/**
 * Add `object-position` to an image tag's inline style.
 *
 * @param string $style Existing style attribute, possibly empty.
 * @param int    $focus Percentage from the top.
 * @return string
 */
function pt_focus_style( $style, $focus ) {
	if ( 50 === (int) $focus ) {
		return $style;
	}

	$style = trim( (string) $style );
	$style = '' === $style ? '' : rtrim( $style, ';' ) . '; ';

	return $style . sprintf( 'object-position: 50%% %d%%;', (int) $focus );
}

/* -------------------------------------------------------------------------
 * The browser's crop
 * ---------------------------------------------------------------------- */

/**
 * Put the focal point on every image rendered from the media library.
 *
 * Applied to the attachment rather than to a template, so a photograph is
 * framed the same way wherever it appears — hero, card, banner or gallery tile.
 *
 * @param array<string, string> $attr       Attributes.
 * @param WP_Post               $attachment Attachment.
 * @return array<string, string>
 */
function pt_focus_attachment_attributes( $attr, $attachment ) {
	$source = (string) get_post_meta( $attachment->ID, '_pt_seed_source', true );

	if ( ! $source ) {
		$source = (string) get_post_meta( $attachment->ID, '_wp_attached_file', true );
	}

	if ( ! $source ) {
		return $attr;
	}

	$focus = pt_image_focus( $source );

	if ( 50 === $focus ) {
		return $attr;
	}

	$attr['style'] = pt_focus_style( isset( $attr['style'] ) ? $attr['style'] : '', $focus );

	return $attr;
}
add_filter( 'wp_get_attachment_image_attributes', 'pt_focus_attachment_attributes', 10, 2 );

/* -------------------------------------------------------------------------
 * WordPress's crop
 * ---------------------------------------------------------------------- */

/**
 * The focal point of the attachment whose sizes are being generated.
 *
 * `image_resize_dimensions` is not told which attachment it is working on, so
 * the value is picked up one step earlier, where the filename is available, and
 * put back afterwards.
 *
 * @param int|null $set Value to remember, or null to read the current one.
 * @return int|null
 */
function pt_focus_current( $set = null ) {
	static $focus = null;

	if ( 1 === func_num_args() ) {
		$focus = $set;
	}

	return $focus;
}

/**
 * Remember the focal point before the intermediate sizes are cut.
 *
 * @param array<string, array<string, mixed>> $sizes      Sizes to generate.
 * @param array<string, mixed>                $image_meta Attachment metadata.
 * @return array<string, array<string, mixed>>
 */
function pt_focus_remember( $sizes, $image_meta = array() ) {
	$file = isset( $image_meta['file'] ) ? (string) $image_meta['file'] : '';

	pt_focus_current( $file ? pt_image_focus( $file ) : null );

	return $sizes;
}
add_filter( 'intermediate_image_sizes_advanced', 'pt_focus_remember', 10, 2 );

/**
 * Forget it again once they are.
 *
 * @param array<string, mixed> $metadata Attachment metadata.
 * @return array<string, mixed>
 */
function pt_focus_forget( $metadata ) {
	pt_focus_current( null );

	return $metadata;
}
add_filter( 'wp_generate_attachment_metadata', 'pt_focus_forget', 99 );

/**
 * Cut a hard-cropped size from the subject rather than from the middle.
 *
 * Mirrors core's own arithmetic and changes one thing: where the source
 * rectangle starts vertically. Horizontal framing is left centred, which is
 * right for every photograph here — the problem is always heads, never edges.
 *
 * @param null|array<int, int> $out     Short-circuit value.
 * @param int                  $orig_w  Original width.
 * @param int                  $orig_h  Original height.
 * @param int                  $dest_w  Requested width.
 * @param int                  $dest_h  Requested height.
 * @param bool|array           $crop    Whether, and how, to crop.
 * @return null|array<int, int>
 */
function pt_focus_resize_dimensions( $out, $orig_w, $orig_h, $dest_w, $dest_h, $crop ) {
	// Another filter already answered, or this size is not a hard crop, or the
	// caller asked for a specific corner. Leave all three alone.
	if ( null !== $out || ! $crop || is_array( $crop ) ) {
		return $out;
	}

	$focus = pt_focus_current();

	if ( null === $focus || 50 === (int) $focus ) {
		return $out;
	}

	if ( $orig_w <= 0 || $orig_h <= 0 || ( $dest_w <= 0 && $dest_h <= 0 ) ) {
		return $out;
	}

	$aspect_ratio = $orig_w / $orig_h;
	$new_w        = min( $dest_w, $orig_w );
	$new_h        = min( $dest_h, $orig_h );

	if ( ! $new_w ) {
		$new_w = (int) round( $new_h * $aspect_ratio );
	}

	if ( ! $new_h ) {
		$new_h = (int) round( $new_w / $aspect_ratio );
	}

	$size_ratio = max( $new_w / $orig_w, $new_h / $orig_h );

	$crop_w = round( $new_w / $size_ratio );
	$crop_h = round( $new_h / $size_ratio );

	$slack = $orig_h - $crop_h;

	if ( $slack <= 0 ) {
		return $out;
	}

	$s_x = floor( ( $orig_w - $crop_w ) / 2 );
	$s_y = floor( $slack * ( (int) $focus / 100 ) );

	return array( 0, 0, (int) $s_x, (int) $s_y, (int) $new_w, (int) $new_h, (int) $crop_w, (int) $crop_h );
}
add_filter( 'image_resize_dimensions', 'pt_focus_resize_dimensions', 10, 6 );

/* -------------------------------------------------------------------------
 * Re-cutting what was already cut
 * ---------------------------------------------------------------------- */

/**
 * How many photographs to re-cut per request.
 *
 * Regenerating every size of every photograph in one hit is a minute of image
 * work on modest hosting, and it would land on whichever visitor happened to
 * arrive first after an update. A few at a time finishes within a handful of
 * page loads and nobody waits.
 */
const PT_FOCUS_RECROP_BATCH = 4;

/**
 * Where the remaining work is kept.
 */
const PT_FOCUS_RECROP_OPTION = 'pt_focus_recrop_queue';

/**
 * Which version's focal points the library was cut with.
 */
const PT_FOCUS_VERSION_OPTION = 'pt_focus_version';

/**
 * Queue every photograph that has a focal point, after the map changes.
 *
 * The intermediate sizes on an install that already ran were cut from the
 * middle of the frame, and no amount of CSS puts back a head that WordPress
 * threw away. They have to be cut again.
 */
function pt_focus_queue_recrop() {
	if ( get_option( PT_FOCUS_VERSION_OPTION ) === PT_VERSION ) {
		return;
	}

	update_option( PT_FOCUS_VERSION_OPTION, PT_VERSION );

	$placed = get_posts(
		array(
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'post_mime_type' => 'image',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'meta_key'       => '_pt_seed_source', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		)
	);

	$queue = array();

	foreach ( $placed as $attachment_id ) {
		$source = (string) get_post_meta( $attachment_id, '_pt_seed_source', true );

		if ( $source && 50 !== pt_image_focus( $source ) ) {
			$queue[] = (int) $attachment_id;
		}
	}

	if ( $queue ) {
		update_option( PT_FOCUS_RECROP_OPTION, $queue, false );
	}
}

/**
 * Work through the queue a few at a time.
 */
function pt_focus_run_recrop() {
	pt_focus_queue_recrop();

	$queue = get_option( PT_FOCUS_RECROP_OPTION );

	if ( ! is_array( $queue ) || ! $queue ) {
		return;
	}

	require_once ABSPATH . 'wp-admin/includes/image.php';

	$batch = array_splice( $queue, 0, PT_FOCUS_RECROP_BATCH );

	// Written back first: a photograph that makes the image editor fall over
	// must not be retried on every request for the rest of time.
	if ( $queue ) {
		update_option( PT_FOCUS_RECROP_OPTION, $queue, false );
	} else {
		delete_option( PT_FOCUS_RECROP_OPTION );
	}

	foreach ( $batch as $attachment_id ) {
		$file = get_attached_file( $attachment_id );

		if ( ! $file || ! file_exists( $file ) ) {
			continue;
		}

		$metadata = wp_generate_attachment_metadata( $attachment_id, $file );

		if ( $metadata && ! is_wp_error( $metadata ) ) {
			wp_update_attachment_metadata( $attachment_id, $metadata );
		}
	}
}
add_action( 'init', 'pt_focus_run_recrop', 997 );
