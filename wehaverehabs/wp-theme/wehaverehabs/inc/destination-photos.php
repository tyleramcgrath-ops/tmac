<?php
/**
 * Landscape photos for destinations (countries and regions) from Wikimedia Commons.
 *
 * Imported countries and regions start without a photo. In the background, the site looks in each
 * one's Commons category "Landscapes of <place>" for a wide, freely licensed photo (CC BY, CC BY-SA,
 * CC0 or public domain), saves it to the media library and stores its credit, which is shown
 * wherever the photo appears. A region without a match uses its country's photo. These are photos
 * of the place, never presented as a facility.
 *
 * Staff can replace any photo on the destination's edit screen.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

/**
 * Photo attachment for a destination, walking up to the country when the region has none.
 *
 * @param WP_Term $term Destination.
 * @return array [ attachment ID, term that owns the photo ] or [ 0, null ].
 */
function whr_destination_photo( $term ) {
	$seen = 0;
	while ( $term && ! is_wp_error( $term ) && $seen++ < 5 ) {
		$id = (int) get_term_meta( $term->term_id, 'whr_image', true );
		if ( $id && wp_attachment_is_image( $id ) ) {
			return array( $id, $term );
		}
		$term = $term->parent ? get_term( $term->parent, 'destination' ) : null;
	}
	return array( 0, null );
}

/**
 * Credit line for a destination photo.
 *
 * @param WP_Term|null $owner      Term that owns the photo.
 * @param bool         $links      Allow links (not inside a card link).
 * @param string       $place_note Prefix such as "Photo of Texas".
 * @return string Escaped HTML.
 */
function whr_destination_photo_credit( $owner, $links = true, $place_note = '' ) {
	if ( ! $owner ) {
		return '';
	}
	$c = get_term_meta( $owner->term_id, 'whr_image_credit', true );
	if ( ! is_array( $c ) || empty( $c['artist'] ) ) {
		return '';
	}
	$label = $place_note ? $place_note : __( 'Photo', 'wehaverehabs' );
	$who   = esc_html( $c['artist'] );
	$lic   = esc_html( $c['license'] ?? '' );
	if ( $links && ! empty( $c['page'] ) ) {
		$who = '<a href="' . esc_url( $c['page'] ) . '" target="_blank" rel="noopener nofollow">' . $who . '</a>';
	}
	if ( $links && ! empty( $c['license_url'] ) ) {
		$lic = '<a href="' . esc_url( $c['license_url'] ) . '" target="_blank" rel="noopener nofollow">' . $lic . '</a>';
	}
	return esc_html( $label ) . ': ' . $who . ( $lic ? ' · ' . $lic : '' ) . ' · Wikimedia Commons';
}

/**
 * Credit for whatever photo a destination shows (its own or its country's).
 *
 * @param WP_Term $term  Destination.
 * @param bool    $links Allow links.
 * @return string Escaped HTML.
 */
function whr_term_photo_credit( $term, $links = true ) {
	if ( 'destination' !== $term->taxonomy ) {
		return '';
	}
	list( $id, $owner ) = whr_destination_photo( $term );
	if ( ! $id ) {
		return '';
	}
	/* translators: %s: place */
	$note = $owner->term_id !== $term->term_id ? sprintf( __( 'Photo of %s', 'wehaverehabs' ), $owner->name ) : '';
	return whr_destination_photo_credit( $owner, $links, $note );
}

/**
 * The hero background for a listing without photos of its own: its region's (or country's)
 * landscape photo, with a "Photo of <place>" credit so it is never mistaken for the facility.
 *
 * @param int|null $post_id Listing.
 * @return string HTML or ''.
 */
function whr_listing_place_photo( $post_id = null ) {
	$post_id = $post_id ? $post_id : get_the_ID();
	$dest    = whr_first_term( 'destination', $post_id );
	if ( ! $dest ) {
		return '';
	}
	list( $id, $owner ) = whr_destination_photo( $dest );
	if ( ! $id ) {
		return '';
	}
	/* translators: %s: place */
	$note = sprintf( __( 'Photo of %s', 'wehaverehabs' ), $owner->name );
	return wp_get_attachment_image( $id, 'whr-hero', false, array( 'class' => 'hero__img whr-place-photo', 'alt' => '', 'loading' => 'eager' ) )
		. '<span class="whr-place-credit">' . whr_destination_photo_credit( $owner, true, $note ) . '</span>';
}

/* ---------------------------------------------------------------------------
 * Background fetch
 * ------------------------------------------------------------------------- */

/**
 * Commons category names to try for a destination.
 *
 * @param WP_Term $term Destination.
 * @return string[]
 */
function whr_commons_categories( $term ) {
	$name   = html_entity_decode( $term->name, ENT_QUOTES );
	$name   = preg_replace( '/^Co\.\s+/', 'County ', $name );
	$parent = $term->parent ? get_term( $term->parent, 'destination' ) : null;
	$cands  = array( 'Landscapes of ' . $name );
	if ( $parent && ! is_wp_error( $parent ) ) {
		$country = html_entity_decode( $parent->name, ENT_QUOTES );
		if ( 'United States' === $country ) {
			$cands[] = 'Landscapes of ' . $name . ' (state)';
			$cands[] = 'Landscapes of ' . $name . ' (U.S. state)';
		}
		$cands[] = 'Landscapes of ' . $name . ', ' . $country;
		$cands[] = 'Landscapes of ' . preg_replace( '/\s+(District|Province|Region|Community)$/', '', $name );
	} else {
		$cands[] = 'Landscapes of the ' . $name;
	}
	return array_values( array_unique( $cands ) );
}

/**
 * Ask Commons for a suitable photo. Uses search (ranked by relevance, not alphabetically) and
 * prefers Commons "Quality images".
 *
 * @param string $search CirrusSearch query.
 * @return array|null
 */
function whr_commons_pick( $search, $must = '' ) {
	$url = add_query_arg(
		array(
			'action'       => 'query',
			'format'       => 'json',
			'generator'    => 'search',
			'gsrnamespace' => 6,
			'gsrlimit'     => 20,
			'gsrsearch'    => $search . ' filemime:image/jpeg filew:>1599',
			'prop'         => 'imageinfo',
			'iiprop'       => 'url|size|mime|extmetadata',
			'iiurlwidth'   => 1600,
		),
		'https://commons.wikimedia.org/w/api.php'
	);
	$res = wp_remote_get( $url, array( 'timeout' => 15, 'user-agent' => 'WeHaveRehabsTheme/' . WHR_VERSION . ' (' . home_url( '/' ) . ')' ) );
	if ( is_wp_error( $res ) || 200 !== wp_remote_retrieve_response_code( $res ) ) {
		update_option( 'whr_destphotos_error', is_wp_error( $res ) ? $res->get_error_message() : 'Commons HTTP ' . wp_remote_retrieve_response_code( $res ), false );
		return null;
	}
	$data  = json_decode( wp_remote_retrieve_body( $res ), true );
	$pages = isset( $data['query']['pages'] ) ? array_values( $data['query']['pages'] ) : array();
	usort(
		$pages,
		function ( $a, $b ) {
			return ( $a['index'] ?? 99 ) - ( $b['index'] ?? 99 );
		}
	);
	foreach ( $pages as $p ) {
		$ii   = $p['imageinfo'][0] ?? array();
		$meta = $ii['extmetadata'] ?? array();
		$lic  = trim( wp_strip_all_tags( $meta['LicenseShortName']['value'] ?? '' ) );
		$text = $p['title'] . ' ' . wp_strip_all_tags( $meta['ImageDescription']['value'] ?? '' ) . ' ' . wp_strip_all_tags( $meta['DateTimeOriginal']['value'] ?? '' );
		if ( 'image/jpeg' !== ( $ii['mime'] ?? '' ) || ( $ii['width'] ?? 0 ) < 1600 || $ii['width'] < 1.3 * ( $ii['height'] ?? 0 ) || $ii['width'] > 4 * ( $ii['height'] ?? 1 ) ) {
			continue;
		}
		if ( ! preg_match( '/^(CC BY(-SA)? [0-9.]+|CC0|Public domain)/i', $lic ) ) {
			continue;
		}
		if ( '' !== $must && false === stripos( remove_accents( $text ), remove_accents( $must ) ) ) {
			continue; // Keyword search: the photo must actually be of this place.
		}
		// Not maps, flags, old prints, paintings or night shots — a calm, modern landscape.
		if ( preg_match( '/\b(map|flag|logo|coat of arms|seal|diagram|stamp|night|stereo\w*|postcard|engraving|lithograph|painting|drawing|illustration|sketch|aerial view of the|panorama of the city|1[0-9]{3}s?|19[0-6][0-9])\b/i', $text ) ) {
			continue;
		}
		return array(
			'url'         => $ii['thumburl'] ?? $ii['url'],
			'page'        => $ii['descriptionurl'] ?? '',
			'artist'      => mb_substr( trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( html_entity_decode( $meta['Artist']['value'] ?? '', ENT_QUOTES ) ) ) ), 0, 80 ),
			'license'     => $lic,
			'license_url' => $meta['LicenseUrl']['value'] ?? '',
			'title'       => $p['title'],
		);
	}
	return null;
}

/**
 * Find and save a photo for one destination.
 *
 * @param WP_Term $term Destination.
 * @return bool Found one.
 */
function whr_fetch_destination_photo( $term ) {
	// Only photos filed directly under the place's landscape category (Quality images first, then by
	// search relevance); last, Quality images that name the place in their title or description.
	$pick  = null;
	$cats  = whr_commons_categories( $term );
	$tries = array();
	foreach ( $cats as $cat ) {
		$tries[] = array( 'incategory:"' . $cat . '" incategory:"Quality images"', '' );
	}
	foreach ( $cats as $cat ) {
		$tries[] = array( 'incategory:"' . $cat . '"', '' );
	}
	$place   = html_entity_decode( preg_replace( '/^Co\.\s+/', '', $term->name ), ENT_QUOTES );
	$tries[] = array( '"' . $place . '" landscape incategory:"Quality images"', $place );
	foreach ( $tries as $try ) {
		list( $query, $must ) = $try;
		$pick = whr_commons_pick( $query, $must );
		if ( $pick ) {
			break;
		}
	}
	if ( ! $pick ) {
		update_term_meta( $term->term_id, 'whr_image_none', 1 ); // Use the country's photo instead.
		return false;
	}
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';
	// Keep only the sizes tiles and heroes use (about 300 destinations; keeps the uploads folder small).
	$sizes = function ( $all ) {
		return array_intersect_key( $all, array_flip( array( 'whr-card', 'whr-wide' ) ) );
	};
	add_filter( 'intermediate_image_sizes_advanced', $sizes );
	/* translators: %s: place */
	$id = media_sideload_image( $pick['url'], 0, sprintf( __( 'Landscape of %s', 'wehaverehabs' ), $term->name ), 'id' );
	remove_filter( 'intermediate_image_sizes_advanced', $sizes );
	if ( is_wp_error( $id ) ) {
		update_option( 'whr_destphotos_error', 'Download: ' . $id->get_error_message(), false );
		$tries = (int) get_term_meta( $term->term_id, 'whr_image_tries', true ) + 1;
		update_term_meta( $term->term_id, 'whr_image_tries', $tries );
		if ( $tries >= 3 ) {
			update_term_meta( $term->term_id, 'whr_image_none', 1 ); // Give up: use the country's photo.
		}
		return false; // Otherwise try again on a later run.
	}
	update_post_meta( $id, '_wp_attachment_image_alt', '' );
	update_post_meta( $id, '_whr_commons', $pick['page'] );
	update_term_meta( $term->term_id, 'whr_image', (string) $id );
	update_term_meta( $term->term_id, 'whr_image_credit', array_intersect_key( $pick, array_flip( array( 'artist', 'license', 'license_url', 'page' ) ) ) );
	$recent = (array) get_option( 'whr_destphotos_recent', array() );
	array_unshift( $recent, $term->name . ': ' . $pick['title'] . ' (' . $query . ')' );
	update_option( 'whr_destphotos_recent', array_slice( $recent, 0, 30 ), false );
	return true;
}

/** Destinations still waiting for a photo (countries first). */
function whr_destinations_missing_photo( $limit ) {
	return get_terms(
		array(
			'taxonomy'   => 'destination',
			'hide_empty' => false,
			'number'     => $limit,
			'orderby'    => 'parent',
			'meta_query' => array( // phpcs:ignore WordPress.DB.SlowDBQuery
				'relation' => 'AND',
				array(
					'relation' => 'OR',
					array( 'key' => 'whr_image', 'compare' => 'NOT EXISTS' ),
					array( 'key' => 'whr_image', 'value' => '' ),
				),
				array( 'key' => 'whr_image_none', 'compare' => 'NOT EXISTS' ),
			),
		)
	);
}

/**
 * Process a few destinations, then chain the next batch.
 *
 * @param int $count Destinations per batch.
 */
function whr_destphotos_batch( $count = 6 ) {
	if ( get_transient( 'whr_destphotos_lock' ) ) {
		return;
	}
	if ( 'running' === get_option( 'whr_autoimport' ) ) {
		wp_schedule_single_event( time() + 120, 'whr_destphotos_batch' ); // Listings first.
		return;
	}
	set_transient( 'whr_destphotos_lock', 1, 120 );
	if ( function_exists( 'set_time_limit' ) ) {
		set_time_limit( 120 ); // phpcs:ignore Squiz.PHP.DiscouragedFunctions.Discouraged
	}
	$terms = whr_destinations_missing_photo( $count );
	$start = microtime( true );
	foreach ( is_wp_error( $terms ) ? array() : $terms as $term ) {
		whr_fetch_destination_photo( $term );
		if ( microtime( true ) - $start > 18 ) {
			break; // Stay well inside the host's time limit; the next run carries on.
		}
	}
	delete_transient( 'whr_destphotos_lock' );
	if ( is_wp_error( $terms ) || ! $terms ) {
		update_option( 'whr_destphotos', 'done', false );
		return;
	}
	wp_schedule_single_event( time() + 60, 'whr_destphotos_batch' );
	whr_loopback_kick( 'whr_destphotos' );
}
add_action(
	'whr_destphotos_batch',
	function () {
		whr_destphotos_batch( 6 );
	}
);

/**
 * Picker version 3 (direct landscape categories only, Quality images first, no old prints): clear
 * the photos earlier versions chose automatically, so they are picked again. Photos set by hand are kept.
 */
function whr_destphotos_upgrade() {
	if ( (int) get_option( 'whr_destphotos_picker' ) >= 3 ) {
		return;
	}
	$terms = get_terms( array( 'taxonomy' => 'destination', 'hide_empty' => false, 'fields' => 'ids' ) );
	foreach ( is_wp_error( $terms ) ? array() : $terms as $tid ) {
		$credit = get_term_meta( $tid, 'whr_image_credit', true );
		if ( $credit ) {
			$att = (int) get_term_meta( $tid, 'whr_image', true );
			if ( $att && get_post_meta( $att, '_whr_commons', true ) ) {
				wp_delete_attachment( $att, true );
			}
			delete_term_meta( $tid, 'whr_image' );
			delete_term_meta( $tid, 'whr_image_credit' );
		}
		delete_term_meta( $tid, 'whr_image_none' );
	}
	update_option( 'whr_destphotos_picker', 3, false );
	delete_option( 'whr_destphotos_recent' );
	delete_option( 'whr_destphotos' );
}

/** Start (or restart a stalled run) on admin page loads until every destination has been tried. */
add_action(
	'admin_init',
	function () {
		whr_destphotos_upgrade();
		if ( 'done' === get_option( 'whr_destphotos' ) || 'running' === get_option( 'whr_autoimport' ) || wp_doing_ajax() ) {
			return;
		}
		update_option( 'whr_destphotos', 'running', false );
		if ( ! wp_next_scheduled( 'whr_destphotos_batch' ) && ! get_transient( 'whr_destphotos_lock' ) ) {
			wp_schedule_single_event( time() + 60, 'whr_destphotos_batch' );
			whr_loopback_kick( 'whr_destphotos' );
		}
	}
);

/**
 * Background request to this site (see whr_autoimport_kick()).
 *
 * @param string $action AJAX action.
 */
function whr_loopback_kick( $action ) {
	$token = get_option( 'whr_autoimport_token' );
	if ( ! $token ) {
		$token = wp_generate_password( 32, false );
		update_option( 'whr_autoimport_token', $token, false );
	}
	wp_remote_post(
		admin_url( 'admin-ajax.php' ),
		array(
			'timeout'   => 0.01,
			'blocking'  => false,
			'sslverify' => apply_filters( 'https_local_ssl_verify', false ), // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals -- core filter.
			'body'      => array( 'action' => $action, 'token' => $token ),
		)
	);
}
foreach ( array( 'wp_ajax_whr_destphotos', 'wp_ajax_nopriv_whr_destphotos' ) as $whr_dp_hook ) {
	add_action(
		$whr_dp_hook,
		function () {
			$token = isset( $_POST['token'] ) ? sanitize_text_field( wp_unslash( $_POST['token'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- loopback request authenticated by token.
			if ( $token && hash_equals( (string) get_option( 'whr_autoimport_token' ), $token ) ) {
				ignore_user_abort( true );
				whr_destphotos_batch( 6 );
			}
			wp_die( '', '', array( 'response' => 200 ) );
		}
	);
}

/** Progress notice for staff. */
add_action(
	'admin_notices',
	function () {
		if ( 'running' !== get_option( 'whr_destphotos' ) || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$left = whr_destinations_missing_photo( 500 );
		/* translators: %s: count */
		echo '<div class="notice notice-info"><p><strong>We Have Rehabs:</strong> ' . esc_html( sprintf( __( 'Adding landscape photos to destinations in the background — %s to go.', 'wehaverehabs' ), number_format_i18n( is_wp_error( $left ) ? 0 : count( $left ) ) ) ) . '</p></div>';
	}
);

/** GET /wp-json/whr/v1/status: progress of the background jobs (counts only). */
add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'whr/v1',
			'/status',
			array(
				'methods'             => 'GET',
				'permission_callback' => '__return_true',
				'callback'            => function () {
					$left   = whr_destinations_missing_photo( 1000 );
					$photos = get_terms( array( 'taxonomy' => 'destination', 'hide_empty' => false, 'fields' => 'ids', 'meta_key' => 'whr_image_credit' ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
					$r      = new WP_REST_Response(
						array(
							'version'        => WHR_VERSION,
							'listings'       => get_option( 'whr_autoimport' ),
							'photos'         => get_option( 'whr_destphotos' ),
							'with_photo'     => is_wp_error( $photos ) ? 0 : count( $photos ),
							'waiting'        => is_wp_error( $left ) ? 0 : count( $left ),
							'next_run'       => wp_next_scheduled( 'whr_destphotos_batch' ),
							'last_error'     => get_option( 'whr_destphotos_error' ),
							'recent'         => get_option( 'whr_destphotos_recent', array() ),
						)
					);
					$r->header( 'Cache-Control', 'no-store' );
					return $r;
				},
			)
		);
	}
);
