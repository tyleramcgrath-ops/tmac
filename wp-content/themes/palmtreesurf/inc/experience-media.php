<?php
/**
 * Per-experience photography and video.
 *
 * A single featured image sells a tour badly: somebody deciding whether to
 * book a fishing charter wants to see the boat, the deck and what comes over
 * the side, not one thumbnail. Each experience therefore carries its own set
 * of the operator's photographs, rendered through the same grid and lightbox
 * as the main gallery so there is one component and one set of styles.
 *
 * Everything here is bundled with the theme. An experience the client adds
 * themselves gets nothing from this file and simply renders its own featured
 * image, which is the correct behaviour — the theme must not guess which
 * photographs belong to a tour it knows nothing about.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Experience slug to the photographs that belong to it.
 *
 * Order matters: the first entry is the one a visitor sees first.
 *
 * @return array<string, array<int, string>>
 */
function pt_experience_photo_sets() {
	return array(
		/*
		 * Every photograph belongs to exactly one tour. A picture that turns up
		 * under three different tours tells a visitor the pictures are stock,
		 * so where there were not enough distinct shots the gallery is simply
		 * shorter rather than padded with a repeat.
		 */
		'private-surf-lesson'      => array(
			'instructor-popup-stance.jpg',
		),
		'island-kayak-tour'        => array(
			'kayak-fleet-beach.jpg',
			'kayak-group-guests.jpg',
			'kayak-surf-tent.jpg',
		),
		'mangrove-kayak-tour'      => array(
			'estuary-mangrove-paddlers.jpg',
			'estuary-kayaks-mangrove-shore.jpg',
		),
		'safari-boat'              => array(
			'estuary-crocodile-surfacing.jpg',
			'estuary-capuchin-troop.jpg',
			'estuary-capuchin-monkey.jpg',
		),
		'turtle-tour'              => array(
			'turtle-nest-guide-light.jpg',
			'turtle-beach-night-stars.jpg',
			'turtle-returning-to-sea.jpg',
			'turtle-tracks-night-beach.jpg',
		),
		'fishing-charter'          => array(
			'fishing-charter-boat.jpg',
			'fishing-sailfish-release.jpg',
			'fishing-marlin-release.jpg',
			'fishing-mahi-mahi.jpg',
			'fishing-yellowfin-tuna.jpg',
			'fishing-trolling-wake.jpg',
			'fishing-anglers-tuna.jpg',
			'fishing-grouper.jpg',
			'fishing-boat-headland.jpg',
		),

	);
}

/**
 * Experience slug to a bundled video clip.
 *
 * Only clips small enough to ship in a theme belong here. Anything larger goes
 * in the Media Library and gets pasted into the experience's Video URL field,
 * which wins over this map.
 *
 * @return array<string, array{file: string, poster: string}>
 */
function pt_experience_video_map() {
	return array(
		'safari-boat'         => array(
			'file'   => 'estuary-crocodile.mp4',
			'poster' => 'estuary-crocodile.jpg',
		),
		/*
		 * Shipped in the same batch as the turtle photographs, so it is that
		 * tour's footage. Worth confirming: the clip cannot be played in this
		 * environment, so the pairing comes from how it arrived rather than
		 * from watching it.
		 */
		'turtle-tour'         => array(
			'file'   => 'turtle-tour.mp4',
			'poster' => 'turtle-nesting-red-light.jpg',
		),
	);
}

/**
 * The photographs for one experience, in the shape the gallery grid expects.
 *
 * @param int $post_id Experience ID.
 * @return array<int, array<string, mixed>>
 */
function pt_experience_gallery_images( $post_id ) {
	$sets = pt_experience_photo_sets();
	$slug = get_post_field( 'post_name', $post_id );

	if ( empty( $sets[ $slug ] ) ) {
		return array();
	}

	$manifest = pt_image_manifest();
	$alts     = array();

	foreach ( $manifest as $definition ) {
		if ( ! empty( $definition['file'] ) && ! empty( $definition['alt'] ) && ! isset( $alts[ $definition['file'] ] ) ) {
			$alts[ $definition['file'] ] = $definition['alt'];
		}
	}

	$images = array();

	foreach ( $sets[ $slug ] as $file ) {
		$path = PT_DIR . 'assets/images/src/' . $file;

		if ( ! file_exists( $path ) ) {
			continue;
		}

		$size = @getimagesize( $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- A corrupt file should not fatal the page.

		$images[] = array(
			'id'     => 0,
			'full'   => PT_URI . 'assets/images/src/' . rawurlencode( $file ),
			'width'  => $size ? (int) $size[0] : 0,
			'height' => $size ? (int) $size[1] : 0,
			'alt'    => isset( $alts[ $file ] ) ? $alts[ $file ] : '',
			'slot'   => '',
			'file'   => $file,
		);
	}

	return $images;
}

/**
 * The video for one experience, or '' when it has none.
 *
 * A URL in the experience's own Video URL field wins, so the client can point
 * any page at footage they uploaded themselves.
 *
 * @param int $post_id Experience ID.
 * @return array{src: string, poster: string}|array{}
 */
function pt_experience_video_source( $post_id ) {
	$custom = pt_field( $post_id, 'video_url' );

	if ( $custom ) {
		return array(
			'src'    => $custom,
			'poster' => has_post_thumbnail( $post_id ) ? get_the_post_thumbnail_url( $post_id, 'pt-hero' ) : '',
		);
	}

	$map  = pt_experience_video_map();
	$slug = get_post_field( 'post_name', $post_id );

	if ( empty( $map[ $slug ] ) ) {
		return array();
	}

	$clip = $map[ $slug ];

	if ( ! file_exists( PT_DIR . 'assets/video/' . $clip['file'] ) ) {
		return array();
	}

	return array(
		'src'    => PT_URI . 'assets/video/' . rawurlencode( $clip['file'] ),
		'poster' => file_exists( PT_DIR . 'assets/images/src/' . $clip['poster'] )
			? PT_URI . 'assets/images/src/' . rawurlencode( $clip['poster'] )
			: '',
	);
}

/**
 * Print the video for an experience.
 *
 * `preload="none"` with a poster is deliberate: the clip costs nothing until
 * somebody presses play, so a page carrying video weighs the same as one that
 * does not. It never autoplays — an unexpected video on a booking page is an
 * annoyance, not a feature.
 *
 * @param int $post_id Experience ID.
 */
function pt_experience_video( $post_id ) {
	$video = pt_experience_video_source( $post_id );

	if ( ! $video ) {
		return;
	}

	printf(
		'<figure class="exp-video"><video class="exp-video__player" controls preload="none" playsinline%1$s><source src="%2$s" type="video/mp4" />%3$s</video><figcaption class="exp-video__caption">%4$s</figcaption></figure>',
		$video['poster'] ? ' poster="' . esc_url( $video['poster'] ) . '"' : '',
		esc_url( $video['src'] ),
		esc_html__( 'Your browser cannot play this video.', 'palmtreesurf' ),
		esc_html__( 'Filmed on one of our trips.', 'palmtreesurf' )
	);
}
