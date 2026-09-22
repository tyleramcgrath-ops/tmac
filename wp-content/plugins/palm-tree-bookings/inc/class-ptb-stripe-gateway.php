<?php
/**
 * Stripe Checkout as a booking gateway.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Sends the customer to Stripe Checkout and records what comes back.
 */
class PTB_Stripe_Gateway extends PTB_Gateway {

	/**
	 * Machine name. Also the last segment of the webhook URL.
	 *
	 * @return string
	 */
	public function get_id() {
		return 'stripe';
	}

	/**
	 * Label for the admin.
	 *
	 * @return string
	 */
	public function get_label() {
		return __( 'Stripe', 'palm-tree-bookings' );
	}

	/**
	 * Whether a secret key has been entered.
	 *
	 * @return bool
	 */
	public function is_configured() {
		return ptb_stripe_ready();
	}

	/**
	 * Create a Checkout Session and return its URL.
	 *
	 * The amount is passed in by the plugin in minor units and handed to Stripe
	 * unchanged. The booking ID travels in metadata and in client_reference_id,
	 * so the webhook can find its way back without trusting anything in the URL.
	 *
	 * @param int $booking_id Booking being paid for.
	 * @param int $amount     Amount in minor units.
	 * @return string|WP_Error
	 */
	public function create_checkout( $booking_id, $amount ) {
		$booking_id = (int) $booking_id;
		$amount     = (int) $amount;

		if ( $amount <= 0 ) {
			return new WP_Error( 'ptb_stripe_no_amount', __( 'There is nothing to pay on this booking.', 'palm-tree-bookings' ) );
		}

		$currency = function_exists( 'ptb_currency' ) ? strtolower( ptb_currency() ) : 'usd';
		$return   = function_exists( 'ptb_pay_url' ) ? ptb_pay_url( $booking_id ) : home_url( '/' );

		$experience = (int) get_post_meta( $booking_id, '_ptb_experience', true );
		$name       = $experience ? get_the_title( $experience ) : __( 'Booking', 'palm-tree-bookings' );

		$session = ptb_stripe_request(
			'checkout/sessions',
			array(
				'mode'                                 => 'payment',
				'client_reference_id'                  => (string) $booking_id,
				'success_url'                          => add_query_arg( 'ptb_paid', '1', $return ),
				'cancel_url'                           => add_query_arg( 'ptb_paid', '0', $return ),
				'metadata[booking_id]'                 => (string) $booking_id,
				'line_items[0][quantity]'              => 1,
				'line_items[0][price_data][currency]'  => $currency,
				'line_items[0][price_data][unit_amount]' => $amount,
				'line_items[0][price_data][product_data][name]' => wp_strip_all_tags( $name ),
			)
		);

		if ( is_wp_error( $session ) ) {
			return $session;
		}

		if ( empty( $session['url'] ) ) {
			return new WP_Error( 'ptb_stripe_no_url', __( 'Stripe did not return a checkout URL.', 'palm-tree-bookings' ) );
		}

		// Keep the session ID so a payment can be reconciled by hand if needed.
		if ( ! empty( $session['id'] ) ) {
			update_post_meta( $booking_id, '_ptb_stripe_session', sanitize_text_field( $session['id'] ) );
		}

		return (string) $session['url'];
	}

	/**
	 * Handle Stripe's notification that a payment completed.
	 *
	 * The signature is verified before anything is read out of the body. An
	 * unsigned or wrongly signed request is rejected outright: without that,
	 * the endpoint is an open invitation to mark any booking paid.
	 *
	 * @param WP_REST_Request $request Inbound request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_webhook( $request ) {
		$secret = ptb_stripe_key( 'webhook_secret' );

		if ( '' === $secret ) {
			return new WP_Error(
				'ptb_stripe_no_webhook_secret',
				__( 'No webhook signing secret is configured, so this notification cannot be trusted.', 'palm-tree-bookings' ),
				array( 'status' => 403 )
			);
		}

		$payload   = $request->get_body();
		$signature = $request->get_header( 'stripe_signature' );

		if ( ! $this->verify_signature( $payload, (string) $signature, $secret ) ) {
			return new WP_Error( 'ptb_stripe_bad_signature', __( 'Signature check failed.', 'palm-tree-bookings' ), array( 'status' => 400 ) );
		}

		$event = json_decode( $payload, true );

		if ( ! is_array( $event ) || empty( $event['type'] ) ) {
			return new WP_Error( 'ptb_stripe_bad_payload', __( 'Unreadable payload.', 'palm-tree-bookings' ), array( 'status' => 400 ) );
		}

		if ( 'checkout.session.completed' !== $event['type'] ) {
			// Acknowledge anything else so Stripe stops retrying it.
			return new WP_REST_Response( array( 'ignored' => $event['type'] ), 200 );
		}

		$object     = isset( $event['data']['object'] ) ? $event['data']['object'] : array();
		$booking_id = 0;

		if ( ! empty( $object['metadata']['booking_id'] ) ) {
			$booking_id = (int) $object['metadata']['booking_id'];
		} elseif ( ! empty( $object['client_reference_id'] ) ) {
			$booking_id = (int) $object['client_reference_id'];
		}

		if ( ! $booking_id || ! get_post( $booking_id ) ) {
			return new WP_Error( 'ptb_stripe_unknown_booking', __( 'That payment does not match a booking.', 'palm-tree-bookings' ), array( 'status' => 404 ) );
		}

		$reference = isset( $object['id'] ) ? sanitize_text_field( $object['id'] ) : '';

		/*
		 * Stripe retries until it gets a 2xx, so the same event can arrive more
		 * than once. Recording the reference and checking it first keeps the
		 * ledger from double-counting a payment.
		 */
		if ( $reference && $this->already_recorded( $booking_id, $reference ) ) {
			return new WP_REST_Response( array( 'duplicate' => true ), 200 );
		}

		if ( function_exists( 'ptb_record_payment' ) ) {
			ptb_record_payment(
				$booking_id,
				array(
					'amount'    => isset( $object['amount_total'] ) ? (int) $object['amount_total'] : 0,
					'currency'  => isset( $object['currency'] ) ? strtoupper( sanitize_text_field( $object['currency'] ) ) : '',
					'gateway'   => $this->get_id(),
					'reference' => $reference,
					'kind'      => 'payment',
				)
			);
		}

		return new WP_REST_Response( array( 'recorded' => true ), 200 );
	}

	/**
	 * Whether this Stripe reference is already in the booking's ledger.
	 *
	 * @param int    $booking_id Booking ID.
	 * @param string $reference  Stripe object ID.
	 * @return bool
	 */
	protected function already_recorded( $booking_id, $reference ) {
		if ( ! function_exists( 'ptb_payment_log' ) ) {
			return false;
		}

		foreach ( (array) ptb_payment_log( $booking_id ) as $entry ) {
			if ( isset( $entry['reference'] ) && $entry['reference'] === $reference ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Verify Stripe's `Stripe-Signature` header.
	 *
	 * Implements the scheme Stripe documents: the header carries a timestamp
	 * and one or more v1 signatures; the signed payload is the timestamp, a
	 * full stop, and the raw body. Comparison is timing-safe, and a stale
	 * timestamp is refused so a captured request cannot be replayed later.
	 *
	 * @param string $payload   Raw request body.
	 * @param string $header    Stripe-Signature header.
	 * @param string $secret    Webhook signing secret.
	 * @param int    $tolerance Seconds of clock drift allowed.
	 * @return bool
	 */
	protected function verify_signature( $payload, $header, $secret, $tolerance = 300 ) {
		if ( '' === $payload || '' === $header ) {
			return false;
		}

		$timestamp  = '';
		$signatures = array();

		foreach ( explode( ',', $header ) as $part ) {
			$pair = explode( '=', trim( $part ), 2 );

			if ( 2 !== count( $pair ) ) {
				continue;
			}

			if ( 't' === $pair[0] ) {
				$timestamp = $pair[1];
			} elseif ( 'v1' === $pair[0] ) {
				$signatures[] = $pair[1];
			}
		}

		if ( '' === $timestamp || ! $signatures ) {
			return false;
		}

		if ( abs( time() - (int) $timestamp ) > $tolerance ) {
			return false;
		}

		$expected = hash_hmac( 'sha256', $timestamp . '.' . $payload, $secret );

		foreach ( $signatures as $signature ) {
			if ( hash_equals( $expected, $signature ) ) {
				return true;
			}
		}

		return false;
	}
}
