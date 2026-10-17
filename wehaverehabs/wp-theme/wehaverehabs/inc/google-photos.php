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
			'Referer'          => home_url( '/' ), // Lets keys restricted to this website work from the server.
		),
	);
	if ( $body ) {
		$args['body'] = wp_json_encode( $body );
	}
	$res = wp_remote_request( $url, $args );
	return whr_places_result( $res );
}

/**
 * Decode a Places API response, remembering the last error for the admin screens.
 *
 * @param array|WP_Error $res HTTP response.
 * @return array|null
 */
function whr_places_result( $res ) {
	if ( is_wp_error( $res ) ) {
		update_option( 'whr_gphoto_error', array( time(), 0, $res->get_error_message() ), false );
		return null;
	}
	$code = (int) wp_remote_retrieve_response_code( $res );
	$data = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( 200 !== $code ) {
		$msg = isset( $data['error']['message'] ) ? $data['error']['message'] : wp_remote_retrieve_response_message( $res );
		update_option( 'whr_gphoto_error', array( time(), $code, $msg ), false );
		if ( 429 === $code ) {
			set_transient( 'whr_gphoto_paused', 1, HOUR_IN_SECONDS ); // Google's quota is used up: stop asking for a while.
		}
		return null;
	}
	delete_option( 'whr_gphoto_error' );
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
	if ( $shared >= 0.75 ) {
		return true; // Clearly the same name, and Google searched near our address.
	}
	$city = trim( strtolower( remove_accents( (string) preg_split( '/[,·]/u', (string) whr_meta( 'location', $post_id ) )[0] ) ) );
	$addr = strtolower( remove_accents( (string) ( $place['formattedAddress'] ?? '' ) ) );
	return $shared >= 0.5 && ( '' === $city || false !== strpos( $addr, $city ) );
}

/**
 * Find a photo for a listing on Google.
 *
 * @param int    $id  Listing.
 * @param string $why Set to the reason when no photo is returned.
 * @return array|null { uri, credits }
 */
function whr_google_photo_fetch( $id, &$why = '' ) {
	$place_id = (string) whr_meta( 'gplace', $id );
	$photos   = null;
	if ( '' === $place_id ) {
		$query = trim( get_the_title( $id ) . ', ' . ( whr_meta( 'address', $id ) ? whr_meta( 'address', $id ) : whr_location( $id ) . ', ' . whr_term_names( 'destination', $id ) ), ', ' );
		$found = whr_places_request( 'POST', 'https://places.googleapis.com/v1/places:searchText', 'places.id,places.displayName,places.formattedAddress,places.photos', array( 'textQuery' => $query, 'pageSize' => 1 ) );
		if ( null === $found ) {
			$why = 'search-error: ' . whr_gphoto_error_text();
			return null; // Try again on a later visit.
		}
		$place = $found['places'][0] ?? null;
		if ( ! $place || ! whr_places_is_match( $place, $id ) ) {
			update_post_meta( $id, 'whr_gplace', 'none' ); // Not on Google, or not confidently the same place.
			$why = $place ? 'no-match: ' . ( $place['displayName']['text'] ?? '' ) : 'not-found';
			return null;
		}
		update_post_meta( $id, 'whr_gplace', sanitize_text_field( $place['id'] ) ); // Place IDs may be stored.
		$photos = $place['photos'] ?? array();
	} else {
		$details = whr_places_request( 'GET', 'https://places.googleapis.com/v1/places/' . rawurlencode( $place_id ), 'photos' );
		if ( null === $details ) {
			$why = 'details-error: ' . whr_gphoto_error_text();
			return null;
		}
		$photos = $details['photos'] ?? array();
	}
	if ( empty( $photos[0]['name'] ) ) {
		$why = 'no-photos';
		return null;
	}
	$media = whr_places_result(
		wp_remote_get(
			'https://places.googleapis.com/v1/' . $photos[0]['name'] . '/media?maxWidthPx=1600&skipHttpRedirect=true&key=' . rawurlencode( whr_option( 'google_places_key' ) ),
			array( 'timeout' => 8, 'headers' => array( 'Referer' => home_url( '/' ) ) )
		)
	);
	$uri = $media['photoUri'] ?? '';
	if ( ! $uri ) {
		$why = 'media-error: ' . ( null === $media ? whr_gphoto_error_text() : 'no photoUri' );
		return null;
	}
	$credits = array();
	foreach ( (array) ( $photos[0]['authorAttributions'] ?? array() ) as $a ) {
		$credits[] = array( 'name' => sanitize_text_field( $a['displayName'] ?? '' ), 'uri' => esc_url_raw( $a['uri'] ?? '' ) );
	}
	return array( 'uri' => esc_url_raw( $uri ), 'credits' => $credits );
}

/** Google's last error as one line. */
function whr_gphoto_error_text() {
	$e = get_option( 'whr_gphoto_error' );
	return $e ? 'HTTP ' . $e[1] . ' ' . $e[2] : 'unknown';
}

/**
 * GET /wp-json/whr/v1/photo/<id> → { uri, credits: [ { name, uri } ] }, or 204 with the reason
 * in an X-WHR-Photo header.
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response
 */
function whr_google_photo_endpoint( WP_REST_Request $request ) {
	$id   = (int) $request['id'];
	$none = function ( $why ) use ( $id ) {
		update_option( 'whr_gphoto_last', array( time(), $id, $why ), false );
		$r = new WP_REST_Response( null, 204 );
		$r->header( 'X-WHR-Photo', substr( preg_replace( '/[^\x20-\x7E]/', '', $why ), 0, 200 ) );
		$r->header( 'Cache-Control', 'no-store' );
		return $r;
	};
	if ( 'sanctuary' !== get_post_type( $id ) || 'publish' !== get_post_status( $id ) || ! whr_wants_google_photo( $id ) ) {
		return $none( 'not-wanted' );
	}

	// Cost guards: a daily cap for the site and an hourly cap per visitor.
	$day_key = 'whr_gphoto_day_' . gmdate( 'Ymd' );
	$ip      = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$ip_key  = 'whr_gphoto_ip_' . md5( $ip );
	$cap     = (int) whr_option( 'google_places_daily_cap', 2000 );
	if ( (int) get_transient( $day_key ) >= $cap || (int) get_transient( $ip_key ) >= 300 ) {
		return $none( 'cap-reached' );
	}
	if ( get_transient( 'whr_gphoto_paused' ) ) {
		return $none( 'paused: Google quota exceeded — ' . whr_gphoto_error_text() );
	}
	set_transient( $day_key, (int) get_transient( $day_key ) + 1, DAY_IN_SECONDS );
	set_transient( $ip_key, (int) get_transient( $ip_key ) + 1, HOUR_IN_SECONDS );

	$why   = '';
	$photo = whr_google_photo_fetch( $id, $why );
	if ( ! $photo ) {
		return $none( $why );
	}
	$response = new WP_REST_Response( $photo, 200 );
	$response->header( 'Cache-Control', 'no-store' ); // Google does not allow caching photo data.
	return $response;
}

/**
 * Look up one listing on Google and describe what happened (for the admin test button).
 *
 * @param int $post_id Listing.
 * @return string
 */
function whr_google_photo_diagnose( $post_id ) {
	$query = trim( get_the_title( $post_id ) . ', ' . ( whr_meta( 'address', $post_id ) ? whr_meta( 'address', $post_id ) : whr_location( $post_id ) . ', ' . whr_term_names( 'destination', $post_id ) ), ', ' );
	$found = whr_places_request( 'POST', 'https://places.googleapis.com/v1/places:searchText', 'places.id,places.displayName,places.formattedAddress,places.photos', array( 'textQuery' => $query, 'pageSize' => 1 ) );
	if ( null === $found ) {
		$e = get_option( 'whr_gphoto_error' );
		/* translators: 1: HTTP status 2: Google's message */
		return sprintf( __( 'Google refused the request (HTTP %1$s): %2$s', 'wehaverehabs' ), $e ? $e[1] : '?', $e ? $e[2] : '' );
	}
	$place = $found['places'][0] ?? null;
	if ( ! $place ) {
		/* translators: %s: search text */
		return sprintf( __( 'The key works. Google found nothing for “%s”.', 'wehaverehabs' ), $query );
	}
	return sprintf(
		/* translators: 1: our name 2: Google's name 3: address 4: photo count 5: match */
		__( 'The key works. “%1$s” → Google: “%2$s”, %3$s — %4$d photos — %5$s.', 'wehaverehabs' ),
		get_the_title( $post_id ),
		$place['displayName']['text'] ?? '',
		$place['formattedAddress'] ?? '',
		count( $place['photos'] ?? array() ),
		whr_places_is_match( $place, $post_id ) ? __( 'counted as the same place', 'wehaverehabs' ) : __( 'not counted as the same place', 'wehaverehabs' )
	);
}

/** Staff warning when Google keeps refusing the key. */
add_action(
	'admin_notices',
	function () {
		$e = get_option( 'whr_gphoto_error' );
		if ( ! $e || ! whr_option( 'google_places_key' ) || ! current_user_can( 'manage_options' ) || time() - $e[0] > DAY_IN_SECONDS ) {
			return;
		}
		/* translators: 1: Google's message 2: link */
		$text = 429 === (int) $e[1] ? __( 'Google’s daily quota for your project is used up, so photos are paused for an hour. Raise the quota or turn on billing in Google Cloud — %s', 'wehaverehabs' ) : __( 'Google is refusing the API key — %s', 'wehaverehabs' );
		echo '<div class="notice notice-error"><p><strong>Google photos:</strong> ' . esc_html( sprintf( $text, $e[2] ) ) . ' <a href="' . esc_url( admin_url( 'edit.php?post_type=sanctuary&page=whr-plans#google' ) ) . '">' . esc_html__( 'Test it', 'wehaverehabs' ) . '</a></p></div>';
	}
);

/** Google photos panel on Sanctuaries → Plans & upgrades (staff). */
function whr_render_google_panel() {
	echo '<h2 id="google">' . esc_html__( 'Google Maps photos', 'wehaverehabs' ) . '</h2>';
	if ( ! whr_option( 'google_places_key' ) ) {
		echo '<p>' . esc_html__( 'Off: add a Places API (New) key in Appearance → Customize → We Have Rehabs.', 'wehaverehabs' ) . '</p>';
		return;
	}
	global $wpdb;
	$none    = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = 'whr_gplace' AND meta_value = 'none'" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
	$matched = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = 'whr_gplace' AND meta_value <> 'none' AND meta_value <> ''" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
	/* translators: 1: matched 2: unmatched 3: lookups today 4: cap */
	echo '<p>' . esc_html( sprintf( __( 'Matched on Google: %1$s · not matched: %2$s · lookups today: %3$s of %4$s.', 'wehaverehabs' ), number_format_i18n( $matched ), number_format_i18n( $none ), number_format_i18n( (int) get_transient( 'whr_gphoto_day_' . gmdate( 'Ymd' ) ) ), number_format_i18n( (int) whr_option( 'google_places_daily_cap', 2000 ) ) ) ) . '</p>';

	$last = get_option( 'whr_gphoto_last' );
	if ( $last ) {
		/* translators: 1: listing 2: reason */
		echo '<p class="description">' . esc_html( sprintf( __( 'Last photo that could not be shown: %1$s — %2$s', 'wehaverehabs' ), get_the_title( $last[1] ), $last[2] ) ) . '</p>';
	}
	if ( isset( $_POST['whr_gtest'] ) && check_admin_referer( 'whr_gtest' ) ) {
		$matched = get_posts( array( 'post_type' => 'sanctuary', 'numberposts' => 1, 'meta_query' => array( array( 'key' => 'whr_gplace', 'value' => array( '', 'none' ), 'compare' => 'NOT IN' ) ) ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
		if ( $matched ) {
			$why   = '';
			$photo = whr_google_photo_fetch( $matched[0]->ID, $why );
			/* translators: 1: listing 2: result */
			echo '<div class="notice notice-info inline"><p>' . esc_html( sprintf( __( 'Photo for %1$s: %2$s', 'wehaverehabs' ), $matched[0]->post_title, $photo ? __( 'OK — Google returned a photo.', 'wehaverehabs' ) : $why ) ) . '</p></div>';
		}
		$sample = get_posts( array( 'post_type' => 'sanctuary', 'numberposts' => 1, 'orderby' => 'rand', 'meta_key' => 'whr_source', 'meta_value' => 'web' ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
		$sample = $sample ? $sample : get_posts( array( 'post_type' => 'sanctuary', 'numberposts' => 1, 'orderby' => 'rand' ) );
		if ( $sample ) {
			echo '<div class="notice notice-info inline"><p>' . esc_html( whr_google_photo_diagnose( $sample[0]->ID ) ) . '</p></div>';
		}
	}
	if ( isset( $_POST['whr_gretry'] ) && check_admin_referer( 'whr_gtest' ) ) {
		$n = $wpdb->query( "DELETE FROM {$wpdb->postmeta} WHERE meta_key = 'whr_gplace' AND meta_value = 'none'" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		delete_option( 'whr_gphoto_error' );
		/* translators: %s: count */
		echo '<div class="notice notice-success inline"><p>' . esc_html( sprintf( __( '%s listings will be looked up again when next viewed.', 'wehaverehabs' ), number_format_i18n( (int) $n ) ) ) . '</p></div>';
	}
	echo '<form method="post">';
	wp_nonce_field( 'whr_gtest' );
	echo '<p><button class="button button-primary" name="whr_gtest" value="1">' . esc_html__( 'Test Google photos', 'wehaverehabs' ) . '</button> <button class="button" name="whr_gretry" value="1">' . esc_html__( 'Retry listings marked “not matched”', 'wehaverehabs' ) . '</button></p></form>';
}
