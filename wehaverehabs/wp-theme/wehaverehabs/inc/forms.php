<?php
/**
 * Guest inquiries and "list your sanctuary" requests.
 *
 * Each submission is stored as a private Inquiry post (wp-admin → Inquiries)
 * and emailed to the sanctuary's inquiry address or the site admin.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_post_nopriv_whr_inquiry', 'whr_handle_inquiry' );
add_action( 'admin_post_whr_inquiry', 'whr_handle_inquiry' );
add_action( 'admin_post_nopriv_whr_listing', 'whr_handle_listing' );
add_action( 'admin_post_whr_listing', 'whr_handle_listing' );
add_action( 'admin_post_nopriv_whr_claim', 'whr_handle_claim' );
add_action( 'admin_post_whr_claim', 'whr_handle_claim' );

/**
 * Basic abuse protection: nonce, honeypot and a per-IP hourly cap.
 *
 * @param string $action Nonce action.
 * @return bool
 */
function whr_form_is_valid( $action ) {
	if ( ! isset( $_POST['_whr_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['_whr_nonce'] ), $action ) ) {
		return false;
	}
	if ( ! empty( $_POST['website'] ) ) { // Honeypot: real people never see this field.
		return false;
	}
	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
	$key = 'whr_rate_' . md5( $ip );
	$n   = (int) get_transient( $key );
	if ( $n >= 8 ) {
		return false;
	}
	set_transient( $key, $n + 1, HOUR_IN_SECONDS );
	return true;
}

/**
 * Read a posted text field.
 *
 * @param string $key   Field name.
 * @param bool   $multi Multi-line.
 * @return string
 */
function whr_posted( $key, $multi = false ) {
	if ( ! isset( $_POST[ $key ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified in whr_form_is_valid().
		return '';
	}
	$value = wp_unslash( $_POST[ $key ] ); // phpcs:ignore WordPress.Security.NonceVerification.Missing,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	return $multi ? sanitize_textarea_field( $value ) : sanitize_text_field( $value );
}

/**
 * Redirect back to the form with a status flag.
 *
 * @param string $url    Return URL.
 * @param string $status sent|error.
 * @param string $anchor Fragment.
 */
function whr_form_redirect( $url, $status, $anchor ) {
	wp_safe_redirect( add_query_arg( 'whr', $status, $url ) . '#' . $anchor );
	exit;
}

/** Guest inquiry to a sanctuary. */
function whr_handle_inquiry() {
	$sanctuary_id = isset( $_POST['sanctuary_id'] ) ? absint( $_POST['sanctuary_id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified below.
	$back         = $sanctuary_id ? get_permalink( $sanctuary_id ) : home_url( '/' );

	if ( ! $sanctuary_id || 'sanctuary' !== get_post_type( $sanctuary_id ) || ! whr_form_is_valid( 'whr_inquiry' ) ) {
		whr_form_redirect( $back, 'error', 'inquire' );
	}

	$name    = whr_posted( 'guest_name' );
	$contact = whr_posted( 'guest_contact' );
	if ( '' === $name || '' === $contact ) {
		whr_form_redirect( $back, 'error', 'inquire' );
	}
	$fields = array(
		__( 'Name', 'wehaverehabs' )           => $name,
		__( 'Email or WhatsApp', 'wehaverehabs' ) => $contact,
		__( 'Arriving', 'wehaverehabs' )       => whr_posted( 'arriving' ),
		__( 'Stay', 'wehaverehabs' )           => whr_posted( 'stay' ),
		__( 'Travelling from', 'wehaverehabs' ) => whr_posted( 'country' ),
		__( 'Message', 'wehaverehabs' )        => whr_posted( 'message', true ),
	);

	$title = get_the_title( $sanctuary_id );
	$body  = '';
	foreach ( $fields as $label => $value ) {
		$body .= $label . ': ' . ( '' === $value ? '—' : $value ) . "\n";
	}

	wp_insert_post(
		array(
			'post_type'    => 'whr_inquiry',
			'post_status'  => 'private',
			/* translators: 1: guest name 2: sanctuary */
			'post_title'   => sprintf( __( '%1$s → %2$s', 'wehaverehabs' ), $name, $title ),
			'post_content' => $body,
			'meta_input'   => array( '_whr_sanctuary' => $sanctuary_id, '_whr_kind' => 'inquiry' ),
		)
	);

	$to = whr_meta( 'inquiry_email', $sanctuary_id );
	$to = is_email( $to ) ? $to : get_option( 'admin_email' );
	$headers = array();
	if ( is_email( $contact ) ) {
		$headers[] = 'Reply-To: ' . $name . ' <' . $contact . '>';
	}
	wp_mail(
		$to,
		/* translators: %s: sanctuary name */
		sprintf( __( 'New inquiry for %s via We Have Rehabs', 'wehaverehabs' ), $title ),
		$body . "\n— " . get_permalink( $sanctuary_id ),
		$headers
	);

	whr_form_redirect( $back, 'sent', 'inquire' );
}

/** Request from a retreat or clinic to be listed. */
function whr_handle_listing() {
	$back = isset( $_POST['return_to'] ) ? esc_url_raw( wp_unslash( $_POST['return_to'] ) ) : home_url( '/' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified below.
	$back = wp_validate_redirect( $back, home_url( '/' ) );
	if ( ! whr_form_is_valid( 'whr_listing' ) ) {
		whr_form_redirect( $back, 'error', 'list' );
	}
	$sanctuary = whr_posted( 'sanctuary_name' );
	$email     = sanitize_email( whr_posted( 'email' ) );
	if ( '' === $sanctuary || ! is_email( $email ) ) {
		whr_form_redirect( $back, 'error', 'list' );
	}
	$fields = array(
		__( 'Sanctuary', 'wehaverehabs' ) => $sanctuary,
		__( 'Contact', 'wehaverehabs' )   => whr_posted( 'contact_name' ),
		__( 'Email', 'wehaverehabs' )     => $email,
		__( 'Country', 'wehaverehabs' )   => whr_posted( 'country' ),
		__( 'Website', 'wehaverehabs' )   => whr_posted( 'site' ),
		__( 'Care level', 'wehaverehabs' ) => whr_posted( 'care' ),
		__( 'Message', 'wehaverehabs' )   => whr_posted( 'message', true ),
	);
	$body = '';
	foreach ( $fields as $label => $value ) {
		$body .= $label . ': ' . ( '' === $value ? '—' : $value ) . "\n";
	}
	wp_insert_post(
		array(
			'post_type'    => 'whr_inquiry',
			'post_status'  => 'private',
			/* translators: %s: sanctuary name */
			'post_title'   => sprintf( __( 'Listing request: %s', 'wehaverehabs' ), $sanctuary ),
			'post_content' => $body,
			'meta_input'   => array( '_whr_kind' => 'listing' ),
		)
	);
	wp_mail(
		get_option( 'admin_email' ),
		/* translators: %s: sanctuary name */
		sprintf( __( 'Listing request: %s', 'wehaverehabs' ), $sanctuary ),
		$body,
		array( 'Reply-To: ' . $email )
	);
	whr_form_redirect( $back, 'sent', 'list' );
}

/**
 * A facility asks to take over its public listing. An admin verifies the request, then ticks
 * "Claimed by the facility" on the sanctuary and sets its inquiry email.
 */
function whr_handle_claim() {
	$sanctuary_id = isset( $_POST['sanctuary_id'] ) ? absint( $_POST['sanctuary_id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified below.
	$back         = $sanctuary_id ? get_permalink( $sanctuary_id ) : home_url( '/' );

	if ( ! $sanctuary_id || 'sanctuary' !== get_post_type( $sanctuary_id ) || ! whr_form_is_valid( 'whr_claim' ) ) {
		whr_form_redirect( $back, 'error', 'claim' );
	}
	$name  = whr_posted( 'claim_name' );
	$email = sanitize_email( whr_posted( 'claim_email' ) );
	if ( '' === $name || ! is_email( $email ) || '1' !== whr_posted( 'claim_confirm' ) ) {
		whr_form_redirect( $back, 'error', 'claim' );
	}
	$title  = get_the_title( $sanctuary_id );
	$site   = whr_meta( 'website', $sanctuary_id );
	$host   = $site ? preg_replace( '/^www\./', '', (string) wp_parse_url( $site, PHP_URL_HOST ) ) : '';
	$domain = substr( strrchr( $email, '@' ), 1 );
	$fields = array(
		__( 'Facility', 'wehaverehabs' )  => $title,
		__( 'Name', 'wehaverehabs' )      => $name,
		__( 'Role', 'wehaverehabs' )      => whr_posted( 'claim_role' ),
		__( 'Email', 'wehaverehabs' )     => $email,
		__( 'Phone', 'wehaverehabs' )     => whr_posted( 'claim_phone' ),
		__( 'Message', 'wehaverehabs' )   => whr_posted( 'message', true ),
		__( 'Listed website', 'wehaverehabs' ) => $site,
		__( 'Email matches website', 'wehaverehabs' ) => $host ? ( strtolower( $domain ) === strtolower( $host ) || '.' . strtolower( $domain ) === substr( strtolower( $host ), -strlen( $domain ) - 1 ) ? __( 'Yes', 'wehaverehabs' ) : __( 'No — verify by phone', 'wehaverehabs' ) ) : __( 'No website on file', 'wehaverehabs' ),
		__( 'Listing phone', 'wehaverehabs' ) => whr_meta( 'phone', $sanctuary_id ),
	);
	$body = '';
	foreach ( $fields as $label => $value ) {
		$body .= $label . ': ' . ( '' === $value ? '—' : $value ) . "\n";
	}
	wp_insert_post(
		array(
			'post_type'    => 'whr_inquiry',
			'post_status'  => 'private',
			/* translators: %s: facility name */
			'post_title'   => sprintf( __( 'Claim request: %s', 'wehaverehabs' ), $title ),
			'post_content' => $body,
			'meta_input'   => array( '_whr_sanctuary' => $sanctuary_id, '_whr_kind' => 'claim', '_whr_email' => $email, '_whr_name' => $name ),
		)
	);
	wp_mail(
		get_option( 'admin_email' ),
		/* translators: %s: facility name */
		sprintf( __( 'Claim request: %s', 'wehaverehabs' ), $title ),
		$body . "\n— " . get_permalink( $sanctuary_id ) . "\n— " . __( 'Approve it under Inquiries (hover the claim → Approve claim):', 'wehaverehabs' ) . ' ' . admin_url( 'edit.php?post_type=whr_inquiry' ),
		array( 'Reply-To: ' . $name . ' <' . $email . '>' )
	);
	whr_form_redirect( $back, 'sent', 'claim' );
}

/**
 * Success / error notice after a redirect.
 *
 * @param string $sent_text Message on success.
 */
function whr_form_notice( $sent_text ) {
	$status = isset( $_GET['whr'] ) ? sanitize_key( $_GET['whr'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only.
	if ( 'sent' === $status ) {
		echo '<div class="notice" role="status">' . esc_html( $sent_text ) . '</div>';
	} elseif ( 'error' === $status ) {
		echo '<div class="notice notice--error" role="alert">' . esc_html__( 'Sorry, that did not go through. Please check your name and contact details and try again.', 'wehaverehabs' ) . '</div>';
	}
}

/** Show who an inquiry is for in the admin list. */
add_filter(
	'manage_whr_inquiry_posts_columns',
	function ( $cols ) {
		$cols['whr_kind'] = __( 'Type', 'wehaverehabs' );
		return $cols;
	}
);
add_action(
	'manage_whr_inquiry_posts_custom_column',
	function ( $col, $post_id ) {
		if ( 'whr_kind' === $col ) {
			$labels = array(
				'listing' => __( 'Listing request', 'wehaverehabs' ),
				'claim'   => __( 'Claim request', 'wehaverehabs' ),
			);
			$kind   = get_post_meta( $post_id, '_whr_kind', true );
			echo esc_html( isset( $labels[ $kind ] ) ? $labels[ $kind ] : __( 'Guest inquiry', 'wehaverehabs' ) );
		}
	},
	10,
	2
);
