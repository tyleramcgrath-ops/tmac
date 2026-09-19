<?php
/**
 * Payment layer.
 *
 * No gateway ships with this plugin. What ships is the seam a gateway plugs
 * into: money fields on every booking, a quote calculator, a payment ledger, a
 * tokenised pay link, and a webhook route. Adding Stripe later means writing a
 * class that extends PTB_Gateway and calling ptb_register_gateway() — nothing
 * in this file or anywhere else in the plugin has to change.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Payment states a booking can be in.
 *
 * Deliberately separate from the booking workflow status: a booking can be
 * confirmed but unpaid, or paid but later cancelled.
 *
 * @return array<string, string>
 */
function ptb_payment_statuses() {
	return array(
		'unpaid'       => __( 'Unpaid', 'palm-tree-bookings' ),
		'deposit_paid' => __( 'Deposit paid', 'palm-tree-bookings' ),
		'paid'         => __( 'Paid in full', 'palm-tree-bookings' ),
		'refunded'     => __( 'Refunded', 'palm-tree-bookings' ),
		'failed'       => __( 'Payment failed', 'palm-tree-bookings' ),
	);
}

/**
 * Money fields stored on every booking.
 *
 * Amounts are stored in minor units (cents) as integers. Never store money as
 * a float.
 *
 * @return array<string, array<string, mixed>>
 */
function ptb_money_fields() {
	return array(
		'currency'        => array(
			'label'   => __( 'Currency', 'palm-tree-bookings' ),
			'type'    => 'select',
			'options' => array(
				'USD' => __( 'US Dollar', 'palm-tree-bookings' ),
				'CRC' => __( 'Costa Rican Colón', 'palm-tree-bookings' ),
				'EUR' => __( 'Euro', 'palm-tree-bookings' ),
			),
		),
		'quote_amount'    => array(
			'label' => __( 'Total quoted', 'palm-tree-bookings' ),
			'type'  => 'money',
		),
		'deposit_amount'  => array(
			'label' => __( 'Deposit due', 'palm-tree-bookings' ),
			'type'  => 'money',
		),
		'amount_paid'     => array(
			'label' => __( 'Amount paid', 'palm-tree-bookings' ),
			'type'  => 'money',
		),
		'payment_status'  => array(
			'label'   => __( 'Payment status', 'palm-tree-bookings' ),
			'type'    => 'select',
			'options' => ptb_payment_statuses(),
		),
		'payment_gateway' => array(
			'label' => __( 'Paid via', 'palm-tree-bookings' ),
			'type'  => 'text',
		),
	);
}

/**
 * Default currency for new bookings.
 *
 * @return string
 */
function ptb_currency() {
	return (string) apply_filters( 'ptb_currency', ptb_setting( 'currency' ) ? ptb_setting( 'currency' ) : 'USD' );
}

/**
 * Format an amount in minor units for display.
 *
 * @param int    $minor    Amount in cents.
 * @param string $currency ISO currency code.
 * @return string
 */
function ptb_format_money( $minor, $currency = '' ) {
	$currency = $currency ? $currency : ptb_currency();
	$symbols  = array(
		'USD' => '$',
		'EUR' => '€',
		'CRC' => '₡',
	);
	$symbol   = isset( $symbols[ $currency ] ) ? $symbols[ $currency ] : '';

	return $symbol . number_format_i18n( ( (int) $minor ) / 100, 2 ) . ( $symbol ? '' : ' ' . $currency );
}

/**
 * Work out what a booking should cost.
 *
 * Reads `price_from` (major units) off the chosen experience and multiplies by
 * the party size. Returns minor units. Filter `ptb_quote` to replace this with
 * real pricing rules — per-person tiers, seasonal rates, child discounts.
 *
 * @param int $booking_id Booking ID.
 * @return int Amount in minor units.
 */
function ptb_calculate_quote( $booking_id ) {
	$experience_id = (int) ptb_get( $booking_id, 'experience' );
	$adults        = max( 1, (int) ptb_get( $booking_id, 'party_adults' ) );
	$children      = (int) ptb_get( $booking_id, 'party_children' );
	$unit_major    = 0;

	if ( $experience_id ) {
		$price = get_post_meta( $experience_id, 'price_from', true );
		if ( '' === $price ) {
			$price = get_post_meta( $experience_id, '_pt_price_from', true );
		}
		$unit_major = (float) $price;
	}

	$quote = (int) round( $unit_major * 100 ) * ( $adults + $children );

	/**
	 * Filter the calculated quote.
	 *
	 * @param int $quote      Amount in minor units.
	 * @param int $booking_id Booking ID.
	 */
	return (int) apply_filters( 'ptb_quote', $quote, $booking_id );
}

/**
 * Deposit due on a booking.
 *
 * Defaults to the configured percentage of the quote.
 *
 * @param int $booking_id Booking ID.
 * @return int Amount in minor units.
 */
function ptb_calculate_deposit( $booking_id ) {
	$quote   = (int) ptb_get( $booking_id, 'quote_amount' );
	$percent = (int) ptb_setting( 'deposit_percent' );
	$percent = $percent > 0 && $percent <= 100 ? $percent : 100;

	return (int) apply_filters( 'ptb_deposit', (int) round( $quote * $percent / 100 ), $booking_id );
}

/**
 * Outstanding balance on a booking.
 *
 * @param int $booking_id Booking ID.
 * @return int Amount in minor units.
 */
function ptb_balance_due( $booking_id ) {
	return max( 0, (int) ptb_get( $booking_id, 'quote_amount' ) - (int) ptb_get( $booking_id, 'amount_paid' ) );
}

/**
 * Seed the money fields when a booking is first created.
 *
 * Called from ptb_store_booking() rather than hooked to ptb_booking_created,
 * because the notification emails must already see the quote.
 *
 * @param int $booking_id Booking ID.
 */
function ptb_seed_quote( $booking_id ) {
	ptb_set( $booking_id, 'currency', ptb_currency() );
	ptb_set( $booking_id, 'quote_amount', (string) ptb_calculate_quote( $booking_id ) );
	ptb_set( $booking_id, 'deposit_amount', (string) ptb_calculate_deposit( $booking_id ) );
	ptb_set( $booking_id, 'amount_paid', '0' );
	ptb_set( $booking_id, 'payment_status', 'unpaid' );
}

/* -------------------------------------------------------------------------
 * Payment ledger
 * ---------------------------------------------------------------------- */

/**
 * Every payment attempt against a booking, oldest first.
 *
 * @param int $booking_id Booking ID.
 * @return array<int, array<string, mixed>>
 */
function ptb_payment_log( $booking_id ) {
	$log = get_post_meta( $booking_id, '_ptb_payment_log', true );

	return is_array( $log ) ? $log : array();
}

/**
 * Record a payment against a booking and update its totals.
 *
 * Idempotent on `reference`: replaying the same gateway webhook will not
 * double-count a payment.
 *
 * @param int   $booking_id Booking ID.
 * @param array $args       Payment details.
 * @return bool True when a new entry was recorded.
 */
function ptb_record_payment( $booking_id, $args ) {
	$entry = wp_parse_args(
		$args,
		array(
			'amount'    => 0,
			'currency'  => ptb_currency(),
			'gateway'   => 'manual',
			'reference' => '',
			'kind'      => 'payment', // payment | refund.
			'recorded'  => current_time( 'mysql' ),
		)
	);

	$entry['amount'] = (int) $entry['amount'];
	$log             = ptb_payment_log( $booking_id );

	if ( $entry['reference'] ) {
		foreach ( $log as $existing ) {
			if ( ! empty( $existing['reference'] ) && $existing['reference'] === $entry['reference'] ) {
				return false;
			}
		}
	}

	$log[] = $entry;
	update_post_meta( $booking_id, '_ptb_payment_log', $log );

	$paid = 0;
	foreach ( $log as $row ) {
		$paid += 'refund' === $row['kind'] ? -( (int) $row['amount'] ) : (int) $row['amount'];
	}
	$paid = max( 0, $paid );

	ptb_set( $booking_id, 'amount_paid', (string) $paid );
	ptb_set( $booking_id, 'payment_gateway', $entry['gateway'] );

	$quote   = (int) ptb_get( $booking_id, 'quote_amount' );
	$deposit = (int) ptb_get( $booking_id, 'deposit_amount' );

	if ( 0 === $paid ) {
		$status = 'refunded' === $entry['kind'] || 'refund' === $entry['kind'] ? 'refunded' : 'unpaid';
	} elseif ( $quote > 0 && $paid >= $quote ) {
		$status = 'paid';
	} elseif ( $deposit > 0 && $paid >= $deposit ) {
		$status = 'deposit_paid';
	} else {
		$status = 'deposit_paid';
	}

	ptb_set( $booking_id, 'payment_status', $status );

	/**
	 * Fires after a payment is recorded and totals are updated.
	 *
	 * @param int   $booking_id Booking ID.
	 * @param array $entry      The recorded entry.
	 * @param string $status    Resulting payment status.
	 */
	do_action( 'ptb_payment_recorded', $booking_id, $entry, $status );

	return true;
}

/* -------------------------------------------------------------------------
 * Gateway registry
 * ---------------------------------------------------------------------- */

/**
 * Base class every payment gateway extends.
 *
 * A Stripe implementation needs `get_id`, `get_label` and `create_checkout`,
 * plus `handle_webhook` if it reports payments asynchronously.
 */
abstract class PTB_Gateway {

	/**
	 * Machine name, used in URLs. Lowercase, no spaces.
	 *
	 * @return string
	 */
	abstract public function get_id();

	/**
	 * Human label shown in the admin.
	 *
	 * @return string
	 */
	abstract public function get_label();

	/**
	 * Whether the gateway has the credentials it needs to run.
	 *
	 * @return bool
	 */
	public function is_configured() {
		return false;
	}

	/**
	 * Start a checkout and return the URL to send the customer to.
	 *
	 * @param int $booking_id Booking being paid for.
	 * @param int $amount     Amount in minor units.
	 * @return string|WP_Error
	 */
	abstract public function create_checkout( $booking_id, $amount );

	/**
	 * Handle an inbound webhook from the gateway.
	 *
	 * Implementations must verify the signature before calling
	 * ptb_record_payment().
	 *
	 * @param WP_REST_Request $request Inbound request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_webhook( $request ) {
		return new WP_Error( 'ptb_no_webhook', __( 'This gateway does not handle webhooks.', 'palm-tree-bookings' ), array( 'status' => 501 ) );
	}
}

/**
 * Registered gateways, keyed by ID.
 *
 * @return array<string, PTB_Gateway>
 */
function ptb_get_gateways() {
	static $gateways = null;

	if ( null === $gateways ) {
		$gateways = array();

		/**
		 * Register payment gateways.
		 *
		 * @param array $gateways Map of gateway ID to PTB_Gateway instance.
		 */
		$gateways = apply_filters( 'ptb_gateways', $gateways );
	}

	return $gateways;
}

/**
 * Register a gateway.
 *
 * @param PTB_Gateway $gateway Gateway instance.
 */
function ptb_register_gateway( PTB_Gateway $gateway ) {
	add_filter(
		'ptb_gateways',
		function ( $gateways ) use ( $gateway ) {
			$gateways[ $gateway->get_id() ] = $gateway;
			return $gateways;
		}
	);
}

/**
 * The gateway that should handle checkouts, or null when none is ready.
 *
 * @return PTB_Gateway|null
 */
function ptb_active_gateway() {
	$preferred = ptb_setting( 'gateway' );
	$gateways  = ptb_get_gateways();

	if ( $preferred && isset( $gateways[ $preferred ] ) && $gateways[ $preferred ]->is_configured() ) {
		return $gateways[ $preferred ];
	}

	foreach ( $gateways as $gateway ) {
		if ( $gateway->is_configured() ) {
			return $gateway;
		}
	}

	return null;
}

/**
 * Whether the site can currently take a payment online.
 *
 * @return bool
 */
function ptb_payments_enabled() {
	return null !== ptb_active_gateway();
}

/* -------------------------------------------------------------------------
 * Customer pay link
 * ---------------------------------------------------------------------- */

/**
 * A booking's pay token, created on first use.
 *
 * @param int $booking_id Booking ID.
 * @return string
 */
function ptb_pay_token( $booking_id ) {
	$token = get_post_meta( $booking_id, '_ptb_pay_token', true );

	if ( ! $token ) {
		$token = wp_generate_password( 24, false );
		update_post_meta( $booking_id, '_ptb_pay_token', $token );
	}

	return $token;
}

/**
 * The URL a customer uses to pay a booking.
 *
 * Safe to email: it carries an unguessable token, not a booking ID.
 *
 * @param int $booking_id Booking ID.
 * @return string
 */
function ptb_pay_url( $booking_id ) {
	return add_query_arg(
		array(
			'ptb_pay' => ptb_pay_token( $booking_id ),
		),
		home_url( '/' )
	);
}

/**
 * Resolve a pay token back to a booking.
 *
 * @param string $token Pay token.
 * @return int Booking ID, or 0.
 */
function ptb_booking_by_token( $token ) {
	if ( ! $token ) {
		return 0;
	}

	$found = get_posts(
		array(
			'post_type'      => PTB_POST_TYPE,
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_key'       => '_ptb_pay_token', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_value'     => $token, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
		)
	);

	return $found ? (int) $found[0] : 0;
}

/**
 * Send a customer arriving on a pay link to the gateway checkout.
 */
function ptb_handle_pay_link() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Unguessable token is the credential.
	$token = isset( $_GET['ptb_pay'] ) ? sanitize_text_field( wp_unslash( $_GET['ptb_pay'] ) ) : '';

	if ( ! $token ) {
		return;
	}

	$booking_id = ptb_booking_by_token( $token );

	if ( ! $booking_id ) {
		wp_die( esc_html__( 'That payment link is not valid. Please ask us for a new one.', 'palm-tree-bookings' ), '', array( 'response' => 404 ) );
	}

	$gateway = ptb_active_gateway();

	if ( ! $gateway ) {
		wp_die(
			esc_html__( 'Online payment is not set up yet. We will send you payment details directly.', 'palm-tree-bookings' ),
			'',
			array( 'response' => 503 )
		);
	}

	$amount = ptb_balance_due( $booking_id );
	$paid   = (int) ptb_get( $booking_id, 'amount_paid' );

	if ( 0 === $paid ) {
		$deposit = (int) ptb_get( $booking_id, 'deposit_amount' );
		$amount  = $deposit > 0 ? $deposit : $amount;
	}

	if ( $amount <= 0 ) {
		wp_die( esc_html__( 'This booking is already paid. Thank you!', 'palm-tree-bookings' ), '', array( 'response' => 200 ) );
	}

	$url = $gateway->create_checkout( $booking_id, $amount );

	if ( is_wp_error( $url ) ) {
		wp_die( esc_html( $url->get_error_message() ), '', array( 'response' => 502 ) );
	}

	wp_redirect( $url ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- Off-site gateway checkout.
	exit;
}
add_action( 'template_redirect', 'ptb_handle_pay_link', 5 );

/* -------------------------------------------------------------------------
 * Webhook route
 * ---------------------------------------------------------------------- */

/**
 * Register the gateway webhook endpoint.
 *
 * Lives at /wp-json/ptb/v1/webhook/<gateway>. Registered whether or not a
 * gateway exists, so the URL can be configured at the gateway before the
 * integration is written.
 */
function ptb_register_webhook_route() {
	register_rest_route(
		'ptb/v1',
		'/webhook/(?P<gateway>[a-z0-9_-]+)',
		array(
			'methods'             => 'POST',
			'callback'            => 'ptb_dispatch_webhook',
			'permission_callback' => '__return_true', // Gateways verify their own signatures.
			'args'                => array(
				'gateway' => array(
					'sanitize_callback' => 'sanitize_key',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'ptb_register_webhook_route' );

/**
 * Hand a webhook to the gateway that owns it.
 *
 * @param WP_REST_Request $request Inbound request.
 * @return WP_REST_Response|WP_Error
 */
function ptb_dispatch_webhook( $request ) {
	$id       = $request->get_param( 'gateway' );
	$gateways = ptb_get_gateways();

	if ( ! isset( $gateways[ $id ] ) ) {
		return new WP_Error( 'ptb_unknown_gateway', __( 'No such gateway.', 'palm-tree-bookings' ), array( 'status' => 404 ) );
	}

	return $gateways[ $id ]->handle_webhook( $request );
}
