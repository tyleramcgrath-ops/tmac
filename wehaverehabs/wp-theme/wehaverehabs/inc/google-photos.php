<?php
/**
 * Facility photos from Google Maps (Places API, New) for listings that have no photos of their own.
 *
 * Google's terms allow showing place photos through the API with their author attributions, but
 * not downloading or caching them. So the page asks this site's REST endpoint for a photo after it
 * loads; the endpoint looks the facility up on Google (the Place ID is the only thing stored, which
 * Google permits), fetches a fresh photo URL and returns it with its attributions.
 *
 * Off until a Places API key is set in Appearance → Customize → We Have Rehabs. A daily cap
 * bounds what Google can bill.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

/**
 * Whether to try a Google photo for this listing (no own photo on show, key set, not disabled).
 *
 * @param int|null $post_id Post ID.
 * @return bool
 */
function whr_wants_google_photo( $post_id = null ) {
	$post_id = $post_id ? $post_id : get_the_ID();
	if ( ! whr_option( 'google_places_key' ) || 'none' === whr_meta( 'gplace', $post_id ) ) {
		return false;
	}
	return ! ( whr_has_full_profile( $post_id ) && get_post_thumbnail_id( $post_id ) );
}

/**
 * Markup for a Google photo: an empty image the script fills in when it scrolls into view,
 * plus its credit line.
 *
 * @param int|null $post_id Post ID.
 * @param string   $class   Image class (hero__img on profiles, card__gphoto on cards).
 * @return string HTML.
 */
function whr_google_photo_slot( $post_id = null, $class = 'hero__img' ) {
	$post_id = $post_id ? $post_id : get_the_ID();
	if ( ! whr_wants_google_photo( $post_id ) ) {
		return '';
	}
	return '<img class="' . esc_attr( $class ) . ' whr-gphoto" alt="" data-whr-gphoto="' . esc_attr( $post_id ) . '" hidden>'
		. '<span class="whr-gphoto-credit" hidden></span>';
}

add_action(
	'wp_enqueue_scripts',
	function () {
		if ( whr_option( 'google_places_key' ) ) { // Profiles and every page with listing cards.
			wp_add_inline_script( 'whr-theme', 'window.whrPhotoApi=' . wp_json_encode( esc_url_raw( rest_url( 'whr/v1/photo/' ) ) ) . ';', 'before' );
		}
	}
);

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'whr/v1',
			'/photo/(?P<id>\d+)',
			array(
				'methods'             => 'GET',
				'callback'            => 'whr_google_photo_endpoint',
				'permission_callback' => '__return_true',
				'args'                => array( 'id' => array( 'sanitize_callback' => 'absint' ) ),
			)
		);
	}
);

/**
 * Call the Places API.
 *
 * @param string $method GET|POST.
 * @param string $url    URL.
 * @param string $fields Field mask.
 * @param array  $body   JSON body for POST.
 * @return array|null Decoded response.
 */
function whr_places_request( $method, $url, $fields, $body = array() ) {
	$args = array(
		'method'  => $method,
		'timeout' => 8,
		'headers' => array(
			'X-Goog-Api-Key'   => whr_option( 'google_places_key' ),
			'X-Goog-FieldMask' => $fields,
			'Content-Type'     => 'application/json',
		),
	);
	if ( $body ) {
		$args['body'] = wp_json_encode( $body );
	}
	$res = wp_remote_request( $url, $args );
	if ( is_wp_error( $res ) || 200 !== wp_remote_retrieve_response_code( $res ) ) {
		return null;
	}
	$data = json_decode( wp_remote_retrieve_body( $res ), true );
	return is_array( $data ) ? $data : null;
}

/**
 * Whether a Google result is the same facility: shares most of the name's words and the town.
 *
 * @param array $place  Text Search result.
 * @param int   $post_id Listing.
 * @return bool
 */
function whr_places_is_match( $place, $post_id ) {
	$words = function ( $s ) {
		$s = strtolower( remove_accents( (string) $s ) );
		$w = preg_split( '/[^a-z0-9]+/', $s, -1, PREG_SPLIT_NO_EMPTY );
		return array_values( array_diff( $w, array( 'the', 'of', 'and', 'a', 'inc', 'llc', 'center', 'centre' ) ) );
	};
	$ours   = $words( get_the_title( $post_id ) );
	$theirs = $words( $place['displayName']['text'] ?? '' );
	if ( ! $ours || ! $theirs ) {
		return false;
	}
	$shared = count( array_intersect( $ours, $theirs ) ) / min( count( $ours ), count( $theirs ) );
	$city   = strtolower( remove_accents( (string) strtok( (string) whr_meta( 'location', $post_id ), ',' ) ) );
	$addr   = strtolower( remove_accents( (string) ( $place['formattedAddress'] ?? '' ) ) );
	return $shared >= 0.5 && ( '' === $city || false !== strpos( $addr, $city ) );
}

/**
 * GET /wp-json/whr/v1/photo/<id> → { uri, credits: [ { name, uri } ] } or 204.
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response
 */
function whr_google_photo_endpoint( WP_REST_Request $request ) {
	$id = (int) $request['id'];
	if ( 'sanctuary' !== get_post_type( $id ) || 'publish' !== get_post_status( $id ) || ! whr_wants_google_photo( $id ) ) {
		return new WP_REST_Response( null, 204 );
	}

	// Cost guards: a daily cap for the site and an hourly cap per visitor.
	$day_key = 'whr_gphoto_day_' . gmdate( 'Ymd' );
	$ip      = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$ip_key  = 'whr_gphoto_ip_' . md5( $ip );
	$cap     = (int) whr_option( 'google_places_daily_cap', 2000 );
	if ( (int) get_transient( $day_key ) >= $cap || (int) get_transient( $ip_key ) >= 300 ) {
		return new WP_REST_Response( null, 204 );
	}
	set_transient( $day_key, (int) get_transient( $day_key ) + 1, DAY_IN_SECONDS );
	set_transient( $ip_key, (int) get_transient( $ip_key ) + 1, HOUR_IN_SECONDS );

	$place_id = (string) whr_meta( 'gplace', $id );
	$photos   = null;
	if ( '' === $place_id ) {
		$query = trim( get_the_title( $id ) . ', ' . ( whr_meta( 'address', $id ) ? whr_meta( 'address', $id ) : whr_location( $id ) . ', ' . whr_term_names( 'destination', $id ) ), ', ' );
		$found = whr_places_request( 'POST', 'https://places.googleapis.com/v1/places:searchText', 'places.id,places.displayName,places.formattedAddress,places.photos', array( 'textQuery' => $query, 'pageSize' => 1 ) );
		if ( null === $found ) {
			return new WP_REST_Response( null, 204 ); // API error: try again on a later visit.
		}
		$place = $found['places'][0] ?? null;
		if ( ! $place || ! whr_places_is_match( $place, $id ) ) {
			update_post_meta( $id, 'whr_gplace', 'none' ); // Not on Google, or not confidently the same place.
			return new WP_REST_Response( null, 204 );
		}
		$place_id = sanitize_text_field( $place['id'] );
		update_post_meta( $id, 'whr_gplace', $place_id ); // Place IDs may be stored.
		$photos = $place['photos'] ?? array();
	} else {
		$details = whr_places_request( 'GET', 'https://places.googleapis.com/v1/places/' . rawurlencode( $place_id ), 'photos' );
		$photos  = $details['photos'] ?? array();
	}
	if ( empty( $photos[0]['name'] ) ) {
		return new WP_REST_Response( null, 204 );
	}

	$media = wp_remote_get(
		'https://places.googleapis.com/v1/' . $photos[0]['name'] . '/media?maxWidthPx=1600&skipHttpRedirect=true&key=' . rawurlencode( whr_option( 'google_places_key' ) ),
		array( 'timeout' => 8 )
	);
	$uri = is_wp_error( $media ) ? '' : ( json_decode( wp_remote_retrieve_body( $media ), true )['photoUri'] ?? '' );
	if ( ! $uri ) {
		return new WP_REST_Response( null, 204 );
	}
	$credits = array();
	foreach ( (array) ( $photos[0]['authorAttributions'] ?? array() ) as $a ) {
		$credits[] = array( 'name' => sanitize_text_field( $a['displayName'] ?? '' ), 'uri' => esc_url_raw( $a['uri'] ?? '' ) );
	}
	$response = new WP_REST_Response( array( 'uri' => esc_url_raw( $uri ), 'credits' => $credits ), 200 );
	$response->header( 'Cache-Control', 'no-store' ); // Google does not allow caching photo data.
	return $response;
}
