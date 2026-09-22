<?php
/**
 * Stripe payments.
 *
 * The booking plugin defines an abstract PTB_Gateway and a registry filter, so
 * a gateway can be added from outside it. That is what this is: Stripe lives
 * in the theme, the plugin stays unforked, and nothing needs reinstalling to
 * turn payments on.
 *
 * It talks to Stripe's REST API directly with wp_remote_post rather than
 * pulling in their PHP SDK. Two calls are needed — create a Checkout Session,
 * and verify a webhook — and a vendored SDK in a theme is a maintenance
 * liability out of all proportion to that.
 *
 * Money never leaves integer minor units. The plugin quotes in minor units,
 * Stripe takes minor units, and the ledger records minor units, so no amount
 * is ever converted to a float and back.
 *
 * Nothing here runs until keys are entered. With no keys the gateway reports
 * itself unconfigured, the plugin offers no payment step, and the booking flow
 * behaves exactly as it does today — a request, answered by a human.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Where the Stripe keys are kept.
 *
 * Options rather than Customizer settings: these are credentials, not design,
 * and they should not be exported with a theme settings file or shown to
 * anyone who can open the Customizer.
 *
 * @param string $key One of secret_key, publishable_key, webhook_secret.
 * @return string
 */
function ptb_stripe_key( $key ) {
	/**
	 * Filter Stripe credentials, so a site can supply them from wp-config.php
	 * or an environment variable instead of the database.
	 *
	 * @param string $value Stored value.
	 * @param string $key   Which credential.
	 */
	$value = apply_filters( 'ptb_stripe_key', '', $key );

	if ( '' !== $value ) {
		return $value;
	}

	$stored = (array) get_option( 'pt_stripe', array() );

	return isset( $stored[ $key ] ) ? (string) $stored[ $key ] : '';
}

/**
 * Whether Stripe is ready to take a payment.
 *
 * @return bool
 */
function ptb_stripe_ready() {
	return '' !== ptb_stripe_key( 'secret_key' );
}

/**
 * Call the Stripe API.
 *
 * @param string $endpoint Path after /v1/, e.g. 'checkout/sessions'.
 * @param array  $body     Form-encoded body.
 * @return array|WP_Error Decoded response.
 */
function ptb_stripe_request( $endpoint, $body ) {
	$secret = ptb_stripe_key( 'secret_key' );

	if ( '' === $secret ) {
		return new WP_Error( 'ptb_stripe_unconfigured', __( 'Stripe has no secret key set.', 'palm-tree-bookings' ) );
	}

	$response = wp_remote_post(
		'https://api.stripe.com/v1/' . $endpoint,
		array(
			'timeout' => 20,
			'headers' => array(
				'Authorization' => 'Bearer ' . $secret,
				'Content-Type'  => 'application/x-www-form-urlencoded',
				// Pin the version so a Stripe upgrade cannot change responses underneath us.
				'Stripe-Version' => '2024-06-20',
			),
			'body'    => $body,
		)
	);

	if ( is_wp_error( $response ) ) {
		return $response;
	}

	$decoded = json_decode( wp_remote_retrieve_body( $response ), true );

	if ( ! is_array( $decoded ) ) {
		return new WP_Error( 'ptb_stripe_bad_response', __( 'Stripe sent a response we could not read.', 'palm-tree-bookings' ) );
	}

	if ( isset( $decoded['error'] ) ) {
		return new WP_Error(
			'ptb_stripe_error',
			isset( $decoded['error']['message'] ) ? $decoded['error']['message'] : __( 'Stripe refused the request.', 'palm-tree-bookings' )
		);
	}

	return $decoded;
}

/**
 * Register the gateway once the plugin's base class exists.
 */
function ptb_register_stripe_gateway() {
	if ( ! class_exists( 'PTB_Gateway' ) || ! function_exists( 'ptb_register_gateway' ) ) {
		return;
	}

	require_once PTB_DIR . 'inc/class-ptb-stripe-gateway.php';

	ptb_register_gateway( new PTB_Stripe_Gateway() );
}
add_action( 'plugins_loaded', 'ptb_register_stripe_gateway', 20 );

/* -------------------------------------------------------------------------
 * Settings screen
 * ---------------------------------------------------------------------- */

/**
 * Add a Stripe page under Settings.
 */
function ptb_stripe_settings_page() {
	add_options_page(
		__( 'Stripe payments', 'palm-tree-bookings' ),
		__( 'Stripe payments', 'palm-tree-bookings' ),
		'manage_options',
		'pt-stripe',
		'ptb_stripe_settings_render'
	);
}
add_action( 'admin_menu', 'ptb_stripe_settings_page' );

/**
 * Register the stored option.
 */
function ptb_stripe_register_setting() {
	register_setting(
		'pt_stripe',
		'pt_stripe',
		array(
			'type'              => 'array',
			'sanitize_callback' => 'ptb_stripe_sanitize',
			'default'           => array(),
		)
	);
}
add_action( 'admin_init', 'ptb_stripe_register_setting' );

/**
 * Clean the submitted keys.
 *
 * A blank secret or webhook secret leaves the stored one alone, so somebody
 * saving the page without re-typing a credential does not wipe it.
 *
 * @param mixed $input Submitted value.
 * @return array
 */
function ptb_stripe_sanitize( $input ) {
	$input  = (array) $input;
	$stored = (array) get_option( 'pt_stripe', array() );
	$clean  = array();

	foreach ( array( 'secret_key', 'publishable_key', 'webhook_secret' ) as $key ) {
		$value = isset( $input[ $key ] ) ? trim( sanitize_text_field( $input[ $key ] ) ) : '';

		if ( '' === $value && isset( $stored[ $key ] ) ) {
			$value = (string) $stored[ $key ];
		}

		$clean[ $key ] = $value;
	}

	return $clean;
}

/**
 * The settings screen.
 */
function ptb_stripe_settings_render() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$webhook = function_exists( 'ptb_webhook_url' )
		? ptb_webhook_url( 'stripe' )
		: rest_url( 'ptb/v1/webhook/stripe' );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Stripe payments', 'palm-tree-bookings' ); ?></h1>

		<p>
			<?php esc_html_e( 'With no keys entered, the booking form works as it does now: a request that a person answers. Once keys are in, the plugin can send a customer to Stripe to pay a deposit or the full amount.', 'palm-tree-bookings' ); ?>
		</p>

		<form method="post" action="options.php">
			<?php settings_fields( 'pt_stripe' ); ?>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="pt-stripe-pk"><?php esc_html_e( 'Publishable key', 'palm-tree-bookings' ); ?></label></th>
					<td>
						<input name="pt_stripe[publishable_key]" id="pt-stripe-pk" type="text" class="regular-text code"
							value="<?php echo esc_attr( ptb_stripe_key( 'publishable_key' ) ); ?>" autocomplete="off" />
						<p class="description"><?php esc_html_e( 'Starts pk_. Safe to be public.', 'palm-tree-bookings' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="pt-stripe-sk"><?php esc_html_e( 'Secret key', 'palm-tree-bookings' ); ?></label></th>
					<td>
						<input name="pt_stripe[secret_key]" id="pt-stripe-sk" type="password" class="regular-text code"
							value="" autocomplete="new-password"
							placeholder="<?php echo esc_attr( ptb_stripe_key( 'secret_key' ) ? __( 'Saved. Type a new key to replace it.', 'palm-tree-bookings' ) : __( 'sk_live_…', 'palm-tree-bookings' ) ); ?>" />
						<p class="description"><?php esc_html_e( 'Starts sk_. Never share it. Leave blank to keep the saved one.', 'palm-tree-bookings' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="pt-stripe-wh"><?php esc_html_e( 'Webhook signing secret', 'palm-tree-bookings' ); ?></label></th>
					<td>
						<input name="pt_stripe[webhook_secret]" id="pt-stripe-wh" type="password" class="regular-text code"
							value="" autocomplete="new-password"
							placeholder="<?php echo esc_attr( ptb_stripe_key( 'webhook_secret' ) ? __( 'Saved. Type a new secret to replace it.', 'palm-tree-bookings' ) : __( 'whsec_…', 'palm-tree-bookings' ) ); ?>" />
						<p class="description">
							<?php esc_html_e( 'From the webhook you create in Stripe. Without it a payment notification cannot be trusted and will be rejected.', 'palm-tree-bookings' ); ?>
						</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Webhook URL', 'palm-tree-bookings' ); ?></th>
					<td>
						<code><?php echo esc_html( $webhook ); ?></code>
						<p class="description">
							<?php esc_html_e( 'In Stripe, add an endpoint at this URL and subscribe it to checkout.session.completed.', 'palm-tree-bookings' ); ?>
						</p>
					</td>
				</tr>
			</table>

			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}
