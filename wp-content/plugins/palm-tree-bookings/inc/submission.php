<?php
/**
 * Booking submission: validate, store, notify.
 *
 * Uses post/redirect/get so a refresh never resubmits, and carries state
 * across the redirect in a short-lived transient so entered values survive a
 * validation error.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Handle a submitted booking form.
 */
function ptb_handle_submission() {
	if ( ! isset( $_POST['ptb_submit'] ) ) {
		return;
	}

	$redirect = ptb_current_url();

	$nonce = isset( $_POST['ptb_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['ptb_nonce'] ) ) : '';
	if ( ! wp_verify_nonce( $nonce, 'ptb_submit' ) ) {
		ptb_redirect_with_state( $redirect, array(), array( __( 'Your session expired. Please send the form again.', 'palm-tree-bookings' ) ) );
	}

	// Honeypot: a real visitor never fills this in.
	if ( ! empty( $_POST['ptb_company'] ) ) {
		ptb_redirect_success( $redirect, 0 );
	}

	// Timestamp check: a human cannot complete this form in under three seconds.
	$ts = isset( $_POST['ptb_ts'] ) ? absint( $_POST['ptb_ts'] ) : 0;
	if ( $ts && ( time() - $ts ) < 3 ) {
		ptb_redirect_success( $redirect, 0 );
	}

	$ip         = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$throttle   = 'ptb_rate_' . md5( $ip );
	if ( $ip && get_transient( $throttle ) ) {
		ptb_redirect_with_state( $redirect, array(), array( __( 'You just sent a request. Please wait a minute before sending another.', 'palm-tree-bookings' ) ) );
	}

	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Each value is sanitised per field below.
	$raw    = isset( $_POST['ptb'] ) && is_array( $_POST['ptb'] ) ? wp_unslash( $_POST['ptb'] ) : array();
	$fields = ptb_fields();
	$values = array();
	$errors = array();

	foreach ( $fields as $key => $field ) {
		$submitted      = isset( $raw[ $key ] ) ? $raw[ $key ] : '';
		$values[ $key ] = ptb_sanitize_value( $submitted, $field );

		if ( ! empty( $field['required'] ) && '' === $values[ $key ] ) {
			/* translators: %s: field label. */
			$errors[] = sprintf( __( '%s is required.', 'palm-tree-bookings' ), $field['label'] );
		}
	}

	if ( '' !== $values['email'] && ! is_email( $values['email'] ) ) {
		$errors[] = __( 'That email address does not look right.', 'palm-tree-bookings' );
	}

	if ( $values['date_primary'] && $values['date_primary'] < gmdate( 'Y-m-d' ) ) {
		$errors[] = __( 'Your preferred date is in the past.', 'palm-tree-bookings' );
	}

	if ( $errors ) {
		ptb_redirect_with_state( $redirect, $values, $errors );
	}

	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitised in the loop below.
	$meta_raw   = isset( $_POST['ptb_meta'] ) && is_array( $_POST['ptb_meta'] ) ? wp_unslash( $_POST['ptb_meta'] ) : array();
	$attribution = array();
	foreach ( array_keys( ptb_attribution_fields() ) as $key ) {
		$attribution[ $key ] = isset( $meta_raw[ $key ] ) ? sanitize_text_field( $meta_raw[ $key ] ) : '';
	}

	$booking_id = ptb_store_booking( $values, $attribution );

	if ( is_wp_error( $booking_id ) || ! $booking_id ) {
		ptb_redirect_with_state( $redirect, $values, array( __( 'Sorry, we could not save that. Please email or WhatsApp us instead.', 'palm-tree-bookings' ) ) );
	}

	if ( $ip ) {
		set_transient( $throttle, 1, MINUTE_IN_SECONDS );
	}

	ptb_notify_business( $booking_id );
	ptb_notify_customer( $booking_id );

	/**
	 * Fires once a booking has been stored and both emails have been sent.
	 *
	 * @param int $booking_id Stored booking ID.
	 */
	do_action( 'ptb_booking_created', $booking_id );

	ptb_redirect_success( $redirect, $booking_id );
}
add_action( 'template_redirect', 'ptb_handle_submission' );

/**
 * Persist a booking.
 *
 * @param array $values      Sanitised customer values.
 * @param array $attribution Sanitised attribution values.
 * @return int|WP_Error
 */
function ptb_store_booking( $values, $attribution ) {
	$experience = ptb_display_value( 'experience', $values['experience'] );

	$title = sprintf(
		/* translators: 1: customer name, 2: experience, 3: date. */
		__( '%1$s — %2$s — %3$s', 'palm-tree-bookings' ),
		$values['name'] ? $values['name'] : __( 'Unknown', 'palm-tree-bookings' ),
		$experience ? $experience : __( 'Experience TBC', 'palm-tree-bookings' ),
		$values['date_primary'] ? $values['date_primary'] : __( 'date TBC', 'palm-tree-bookings' )
	);

	$booking_id = wp_insert_post(
		array(
			'post_type'   => PTB_POST_TYPE,
			'post_title'  => $title,
			'post_status' => 'publish',
		),
		true
	);

	if ( is_wp_error( $booking_id ) ) {
		return $booking_id;
	}

	foreach ( $values as $key => $value ) {
		ptb_set( $booking_id, $key, $value );
	}

	foreach ( $attribution as $key => $value ) {
		ptb_set( $booking_id, $key, $value );
	}

	ptb_set( $booking_id, 'status', 'new' );
	ptb_set( $booking_id, 'submitted_at', current_time( 'mysql' ) );

	// Price it before the notifications go out, so both emails carry the quote.
	ptb_seed_quote( $booking_id );

	return (int) $booking_id;
}

/**
 * Redirect back to the form carrying values and errors.
 *
 * @param string $redirect Base URL.
 * @param array  $values   Submitted values to restore.
 * @param array  $errors   Error messages.
 */
function ptb_redirect_with_state( $redirect, $values, $errors ) {
	$token = wp_generate_password( 12, false );

	set_transient(
		'ptb_state_' . $token,
		array(
			'values' => $values,
			'errors' => $errors,
		),
		10 * MINUTE_IN_SECONDS
	);

	wp_safe_redirect( add_query_arg( 'ptb', $token, $redirect ) . '#booking' );
	exit;
}

/**
 * Redirect back to the form in its success state.
 *
 * @param string $redirect   Base URL.
 * @param int    $booking_id Stored booking ID.
 */
function ptb_redirect_success( $redirect, $booking_id ) {
	$token = wp_generate_password( 12, false );

	set_transient(
		'ptb_state_' . $token,
		array(
			'status'     => 'success',
			'booking_id' => $booking_id,
		),
		10 * MINUTE_IN_SECONDS
	);

	wp_safe_redirect( add_query_arg( 'ptb', $token, $redirect ) . '#booking' );
	exit;
}

/**
 * Read the form state for this request.
 *
 * @return array{status: string, values: array, errors: array}
 */
function ptb_get_form_state() {
	$default = array(
		'status' => '',
		'values' => array(),
		'errors' => array(),
	);

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Opaque one-shot token from our own redirect.
	$token = isset( $_GET['ptb'] ) ? sanitize_text_field( wp_unslash( $_GET['ptb'] ) ) : '';

	if ( ! $token ) {
		return $default;
	}

	$state = get_transient( 'ptb_state_' . $token );

	if ( ! is_array( $state ) ) {
		return $default;
	}

	return wp_parse_args( $state, $default );
}
