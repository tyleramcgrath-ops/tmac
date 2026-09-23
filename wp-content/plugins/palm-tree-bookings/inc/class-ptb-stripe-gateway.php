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

		$params = array(
			'mode'                                 => 'payment',
			'client_reference_id'                  => (string) $booking_id,
			'success_url'                          => add_query_arg( 'ptb_paid', '1', $return ),
			'cancel_url'                           => add_query_arg( 'ptb_paid', '0', $return ),
			'metadata[booking_id]'                 => (string) $booking_id,

			/*
			 * The same booking id again, one level down. Session metadata does
			 * not appear on the payment itself, and the payment is what somebody
			 * reconciling a bank line or issuing a refund is looking at.
			 */
			'payment_intent_data[metadata][booking_id]' => (string) $booking_id,

			'line_items[0][quantity]'              => 1,
			'line_items[0][price_data][currency]'  => $currency,
			'line_items[0][price_data][unit_amount]' => $amount,
			'line_items[0][price_data][product_data][name]' => wp_strip_all_tags( $name ),
		);

		/*
		 * Hand Stripe the address we already have. It prefills the checkout, it
		 * is what Stripe sends the receipt to, and without it there is no
		 * customer record for a receipt or a tax calculation to hang off.
		 */
		$email = function_exists( 'ptb_get' ) ? (string) ptb_get( $booking_id, 'email' ) : '';

		if ( is_email( $email ) ) {
			$params['customer_email'] = $email;
		}

		if ( function_exists( 'ptb_stripe_tax_enabled' ) && ptb_stripe_tax_enabled() ) {
			$params['automatic_tax[enabled]'] = 'true';

			/*
			 * Whether the listed price contains the tax or the tax goes on top.
			 * Set by the operator, never defaulted — see the settings screen.
			 */
			$params['line_items[0][price_data][tax_behavior]'] = ptb_stripe_tax_behavior();

			// Stripe cannot work out a tax without knowing where the customer is.
			$params['billing_address_collection'] = 'required';
		}

		/**
		 * Filter the Checkout Session parameters before they are sent.
		 *
		 * @param array $params     Stripe parameters.
		 * @param int   $booking_id Booking being paid for.
		 * @param int   $amount     Amount in minor units.
		 */
		$params = apply_filters( 'ptb_stripe_checkout_params', $params, $booking_id, $amount );

		/*
		 * Keyed on the booking, the amount and the hour. A double-click or a
		 * mail client fetching the link replays one session; a genuine second
		 * attempt later, or a different amount, gets its own.
		 */
		$idempotency_key = 'ptb-' . $booking_id . '-' . $amount . '-' . gmdate( 'YmdH' );

		$session = ptb_stripe_request( 'checkout/sessions', $params, $idempotency_key );

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

		$object = isset( $event['data']['object'] ) ? $event['data']['object'] : array();

		switch ( $event['type'] ) {
			/*
			 * A completed session is not necessarily a paid one. Checkout can
			 * offer methods that settle hours or days later, and the session
			 * completes as soon as the customer is done with it — with
			 * payment_status still 'unpaid'. Recording that as money would mark
			 * a booking paid on the strength of an intention.
			 */
			case 'checkout.session.completed':
			case 'checkout.session.async_payment_succeeded':
				if ( 'paid' !== ( isset( $object['payment_status'] ) ? $object['payment_status'] : '' ) ) {
					// Stripe sends async_payment_succeeded when it settles.
					return new WP_REST_Response( array( 'awaiting_payment' => true ), 200 );
				}

				return $this->record_session( $object );

			case 'charge.refunded':
				return $this->record_refund( $object );

			default:
				// Acknowledge anything else so Stripe stops retrying it.
				return new WP_REST_Response( array( 'ignored' => $event['type'] ), 200 );
		}
	}

	/**
	 * Find the booking an event's object belongs to.
	 *
	 * @param array $object Stripe object.
	 * @return int Booking ID, or 0.
	 */
	protected function booking_from( $object ) {
		if ( ! empty( $object['metadata']['booking_id'] ) ) {
			return (int) $object['metadata']['booking_id'];
		}

		if ( ! empty( $object['client_reference_id'] ) ) {
			return (int) $object['client_reference_id'];
		}

		return 0;
	}

	/**
	 * Record a paid Checkout Session against its booking.
	 *
	 * @param array $object The session.
	 * @return WP_REST_Response
	 */
	protected function record_session( $object ) {
		$booking_id = $this->booking_from( $object );

		if ( ! $booking_id || ! get_post( $booking_id ) ) {
			/*
			 * Answered 200, not 404. Stripe retries a failure for three days,
			 * and no amount of retrying will conjure up a booking that is not
			 * there — the usual cause is a payment made against a site that has
			 * since been restored from a backup. Retrying that hourly for three
			 * days helps nobody; a line in the log does.
			 */
			$this->log_orphan( $object );

			return new WP_REST_Response( array( 'unmatched' => true ), 200 );
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
	 * Record a refund against its booking.
	 *
	 * A refund issued from the Stripe dashboard is the normal way one happens,
	 * and without this the booking goes on claiming it is paid.
	 *
	 * @param array $object The charge.
	 * @return WP_REST_Response
	 */
	protected function record_refund( $object ) {
		$booking_id = $this->booking_from( $object );

		if ( ! $booking_id || ! get_post( $booking_id ) ) {
			$this->log_orphan( $object );

			return new WP_REST_Response( array( 'unmatched' => true ), 200 );
		}

		$refunded = isset( $object['amount_refunded'] ) ? (int) $object['amount_refunded'] : 0;

		if ( $refunded <= 0 ) {
			return new WP_REST_Response( array( 'nothing_refunded' => true ), 200 );
		}

		/*
		 * Keyed on the running total rather than the charge, because a charge
		 * can be refunded in parts and each part arrives as another
		 * charge.refunded carrying the total so far.
		 */
		$reference = ( isset( $object['id'] ) ? sanitize_text_field( $object['id'] ) : 'charge' ) . ':refund:' . $refunded;

		if ( $this->already_recorded( $booking_id, $reference ) ) {
			return new WP_REST_Response( array( 'duplicate' => true ), 200 );
		}

		$already = 0;

		foreach ( (array) ptb_payment_log( $booking_id ) as $entry ) {
			if ( isset( $entry['kind'] ) && 'refund' === $entry['kind'] ) {
				$already += (int) $entry['amount'];
			}
		}

		$delta = $refunded - $already;

		if ( $delta <= 0 ) {
			return new WP_REST_Response( array( 'duplicate' => true ), 200 );
		}

		if ( function_exists( 'ptb_record_payment' ) ) {
			ptb_record_payment(
				$booking_id,
				array(
					'amount'    => $delta,
					'currency'  => isset( $object['currency'] ) ? strtoupper( sanitize_text_field( $object['currency'] ) ) : '',
					'gateway'   => $this->get_id(),
					'reference' => $reference,
					'kind'      => 'refund',
				)
			);
		}

		return new WP_REST_Response( array( 'refunded' => $delta ), 200 );
	}

	/**
	 * Note a Stripe object that does not match any booking here.
	 *
	 * @param array $object Stripe object.
	 */
	protected function log_orphan( $object ) {
		$orphans = (array) get_option( 'ptb_stripe_orphans', array() );

		array_unshift(
			$orphans,
			array(
				'id'   => isset( $object['id'] ) ? sanitize_text_field( $object['id'] ) : '',
				'when' => current_time( 'mysql' ),
			)
		);

		// Keep the recent ones only; this is a breadcrumb, not an archive.
		update_option( 'ptb_stripe_orphans', array_slice( $orphans, 0, 20 ), false );
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
