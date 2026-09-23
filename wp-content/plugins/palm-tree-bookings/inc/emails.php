<?php
/**
 * Booking notification emails.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Build a plain-text summary of a booking.
 *
 * @param int  $booking_id Booking ID.
 * @param bool $internal   Whether to include attribution and admin link.
 * @return string
 */
function ptb_booking_summary( $booking_id, $internal = false ) {
	$lines = array();

	foreach ( ptb_field_groups() as $group ) {
		$group_lines = array();

		foreach ( $group['fields'] as $key => $field ) {
			$value = ptb_get( $booking_id, $key );

			if ( '' === $value ) {
				continue;
			}

			$group_lines[] = $field['label'] . ': ' . ptb_display_value( $key, $value, $booking_id );
		}

		if ( $group_lines ) {
			$lines[] = strtoupper( $group['label'] );
			$lines   = array_merge( $lines, $group_lines );
			$lines[] = '';
		}
	}

	if ( $internal ) {
		$currency = ptb_get( $booking_id, 'currency' );
		$lines[]  = strtoupper( __( 'Money', 'palm-tree-bookings' ) );
		$lines[]  = __( 'Quoted', 'palm-tree-bookings' ) . ': ' . ptb_format_money( (int) ptb_get( $booking_id, 'quote_amount' ), $currency );
		$lines[]  = __( 'Deposit due', 'palm-tree-bookings' ) . ': ' . ptb_format_money( (int) ptb_get( $booking_id, 'deposit_amount' ), $currency );
		$lines[]  = '';

		$attribution = array();
		foreach ( ptb_attribution_fields() as $key => $label ) {
			$value = ptb_get( $booking_id, $key );
			if ( '' !== $value ) {
				$attribution[] = $label . ': ' . $value;
			}
		}

		if ( $attribution ) {
			$lines[] = strtoupper( __( 'Where it came from', 'palm-tree-bookings' ) );
			$lines   = array_merge( $lines, $attribution );
			$lines[] = '';
		}

		$lines[] = __( 'Manage this booking:', 'palm-tree-bookings' );
		$lines[] = admin_url( 'post.php?post=' . $booking_id . '&action=edit' );
	}

	return implode( "\n", $lines );
}

/**
 * Standard mail headers.
 *
 * @param string $reply_to_name  Reply-to display name.
 * @param string $reply_to_email Reply-to address.
 * @return array<int, string>
 */
function ptb_mail_headers( $reply_to_name = '', $reply_to_email = '' ) {
	$headers = array( 'Content-Type: text/plain; charset=UTF-8' );

	if ( $reply_to_email && is_email( $reply_to_email ) ) {
		$headers[] = sprintf( 'Reply-To: %s <%s>', $reply_to_name, $reply_to_email );
	}

	return $headers;
}

/**
 * Email the business about a new booking.
 *
 * @param int $booking_id Booking ID.
 * @return bool
 */
function ptb_notify_business( $booking_id ) {
	$to = ptb_setting( 'notify_email' );

	if ( ! $to || ! is_email( $to ) ) {
		$to = get_option( 'admin_email' );
	}

	$subject = sprintf(
		/* translators: 1: experience, 2: date. */
		__( 'New booking request: %1$s on %2$s', 'palm-tree-bookings' ),
		ptb_display_value( 'experience', ptb_get( $booking_id, 'experience' ) ),
		ptb_get( $booking_id, 'date_primary' )
	);

	return wp_mail(
		$to,
		$subject,
		ptb_booking_summary( $booking_id, true ),
		ptb_mail_headers( ptb_get( $booking_id, 'name' ), ptb_get( $booking_id, 'email' ) )
	);
}

/**
 * Email the customer a copy of their request.
 *
 * @param int $booking_id Booking ID.
 * @return bool
 */
function ptb_notify_customer( $booking_id ) {
	if ( '1' !== ptb_setting( 'customer_email' ) ) {
		return false;
	}

	$to = ptb_get( $booking_id, 'email' );

	if ( ! $to || ! is_email( $to ) ) {
		return false;
	}

	$body = array(
		sprintf(
			/* translators: %s: customer first name. */
			__( 'Hi %s,', 'palm-tree-bookings' ),
			strtok( ptb_get( $booking_id, 'name' ), ' ' )
		),
		'',
		ptb_confirmation_message(),
		'',
		__( 'Here is what you sent us:', 'palm-tree-bookings' ),
		'',
		ptb_booking_summary( $booking_id ),
		'',
		get_bloginfo( 'name' ),
		home_url( '/' ),
	);

	return wp_mail(
		$to,
		__( 'We have your booking request', 'palm-tree-bookings' ),
		implode( "\n", $body ),
		ptb_mail_headers()
	);
}
