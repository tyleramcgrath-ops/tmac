<?php
/**
 * Plugin settings screen.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Default settings.
 *
 * @return array<string, string>
 */
function ptb_default_settings() {
	return array(
		'notify_email'   => get_option( 'admin_email' ),
		'from_name'      => get_bloginfo( 'name' ),
		'confirmation'   => __( 'Thanks — we have your request. We reply within 24 hours to confirm availability and sort out the details.', 'palm-tree-bookings' ),
		'customer_email' => '1',
		'whatsapp'       => '',
		'currency'        => 'USD',
		'deposit_percent' => '30',
		'gateway'         => '',
	);
}

/**
 * Read one setting.
 *
 * @param string $key Setting name.
 * @return string
 */
function ptb_setting( $key ) {
	$settings = wp_parse_args( (array) get_option( 'ptb_settings', array() ), ptb_default_settings() );

	return isset( $settings[ $key ] ) ? (string) $settings[ $key ] : '';
}

/**
 * The message shown after a successful submission.
 *
 * @return string
 */
function ptb_confirmation_message() {
	return ptb_setting( 'confirmation' );
}

/**
 * Register the settings screen under the Bookings menu.
 */
function ptb_settings_menu() {
	add_submenu_page(
		'edit.php?post_type=' . PTB_POST_TYPE,
		__( 'Booking Settings', 'palm-tree-bookings' ),
		__( 'Settings', 'palm-tree-bookings' ),
		'manage_options',
		'ptb-settings',
		'ptb_render_settings_page'
	);
}
add_action( 'admin_menu', 'ptb_settings_menu' );

/**
 * Register the settings field.
 */
function ptb_register_settings() {
	register_setting(
		'ptb_settings_group',
		'ptb_settings',
		array(
			'sanitize_callback' => 'ptb_sanitize_settings',
			'default'           => ptb_default_settings(),
		)
	);
}
add_action( 'admin_init', 'ptb_register_settings' );

/**
 * Sanitise the settings payload.
 *
 * @param mixed $input Submitted settings.
 * @return array<string, string>
 */
function ptb_sanitize_settings( $input ) {
	$input = (array) $input;

	return array(
		'notify_email'   => sanitize_email( isset( $input['notify_email'] ) ? $input['notify_email'] : '' ),
		'from_name'      => sanitize_text_field( isset( $input['from_name'] ) ? $input['from_name'] : '' ),
		'confirmation'   => sanitize_textarea_field( isset( $input['confirmation'] ) ? $input['confirmation'] : '' ),
		'customer_email' => empty( $input['customer_email'] ) ? '' : '1',
		'whatsapp'       => preg_replace( '/\D/', '', isset( $input['whatsapp'] ) ? $input['whatsapp'] : '' ),
		'currency'        => in_array( isset( $input['currency'] ) ? $input['currency'] : '', array( 'USD', 'CRC', 'EUR' ), true ) ? $input['currency'] : 'USD',
		'deposit_percent' => (string) max( 0, min( 100, absint( isset( $input['deposit_percent'] ) ? $input['deposit_percent'] : 30 ) ) ),
		'gateway'         => sanitize_key( isset( $input['gateway'] ) ? $input['gateway'] : '' ),
	);
}

/**
 * Render the settings screen.
 */
function ptb_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Booking Settings', 'palm-tree-bookings' ); ?></h1>

		<form method="post" action="options.php">
			<?php settings_fields( 'ptb_settings_group' ); ?>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="ptb-notify"><?php esc_html_e( 'Send new bookings to', 'palm-tree-bookings' ); ?></label></th>
					<td>
						<input type="email" id="ptb-notify" name="ptb_settings[notify_email]" value="<?php echo esc_attr( ptb_setting( 'notify_email' ) ); ?>" class="regular-text" />
						<p class="description"><?php esc_html_e( 'Where booking notifications arrive.', 'palm-tree-bookings' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="ptb-from"><?php esc_html_e( 'Reply-from name', 'palm-tree-bookings' ); ?></label></th>
					<td><input type="text" id="ptb-from" name="ptb_settings[from_name]" value="<?php echo esc_attr( ptb_setting( 'from_name' ) ); ?>" class="regular-text" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="ptb-confirm"><?php esc_html_e( 'On-screen confirmation', 'palm-tree-bookings' ); ?></label></th>
					<td>
						<textarea id="ptb-confirm" name="ptb_settings[confirmation]" rows="3" class="large-text"><?php echo esc_textarea( ptb_setting( 'confirmation' ) ); ?></textarea>
						<p class="description"><?php esc_html_e( 'Shown in place of the form after a successful request.', 'palm-tree-bookings' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Customer email', 'palm-tree-bookings' ); ?></th>
					<td>
						<label>
							<input type="checkbox" name="ptb_settings[customer_email]" value="1" <?php checked( ptb_setting( 'customer_email' ), '1' ); ?> />
							<?php esc_html_e( 'Send the customer a copy of their request', 'palm-tree-bookings' ); ?>
						</label>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="ptb-wa"><?php esc_html_e( 'WhatsApp number', 'palm-tree-bookings' ); ?></label></th>
					<td>
						<input type="text" id="ptb-wa" name="ptb_settings[whatsapp]" value="<?php echo esc_attr( ptb_setting( 'whatsapp' ) ); ?>" class="regular-text" />
						<p class="description"><?php esc_html_e( 'Digits and country code only. Offered as a fallback if email fails.', 'palm-tree-bookings' ); ?></p>
					</td>
				</tr>
			</table>

			<h2><?php esc_html_e( 'Payments', 'palm-tree-bookings' ); ?></h2>
			<p><?php esc_html_e( 'Quotes and deposits are calculated on every booking now. Online card payment starts working as soon as a gateway is installed — nothing here needs to change when that happens.', 'palm-tree-bookings' ); ?></p>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="ptb-currency"><?php esc_html_e( 'Currency', 'palm-tree-bookings' ); ?></label></th>
					<td>
						<select id="ptb-currency" name="ptb_settings[currency]">
							<?php foreach ( array( 'USD' => 'US Dollar', 'CRC' => 'Costa Rican Colón', 'EUR' => 'Euro' ) as $code => $label ) : ?>
								<option value="<?php echo esc_attr( $code ); ?>" <?php selected( ptb_setting( 'currency' ), $code ); ?>><?php echo esc_html( $label ); ?></option>
							<?php endforeach; ?>
						</select>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="ptb-deposit"><?php esc_html_e( 'Deposit percentage', 'palm-tree-bookings' ); ?></label></th>
					<td>
						<input type="number" id="ptb-deposit" name="ptb_settings[deposit_percent]" value="<?php echo esc_attr( ptb_setting( 'deposit_percent' ) ); ?>" min="0" max="100" class="small-text" /> %
						<p class="description"><?php esc_html_e( 'Share of the quote asked for up front. 100 means payment in full.', 'palm-tree-bookings' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Payment gateway', 'palm-tree-bookings' ); ?></th>
					<td>
						<?php $ptb_gateways = ptb_get_gateways(); ?>
						<?php if ( empty( $ptb_gateways ) ) : ?>
							<p>
								<strong><?php esc_html_e( 'No gateway installed.', 'palm-tree-bookings' ); ?></strong><br />
								<?php esc_html_e( 'Bookings are captured and quoted, and you collect payment yourself. Install a gateway add-on to take cards online.', 'palm-tree-bookings' ); ?>
							</p>
							<p><code><?php echo esc_html( rest_url( 'ptb/v1/webhook/<gateway>' ) ); ?></code><br />
							<span class="description"><?php esc_html_e( 'The webhook URL a gateway will use. It is live already.', 'palm-tree-bookings' ); ?></span></p>
						<?php else : ?>
							<select name="ptb_settings[gateway]">
								<option value=""><?php esc_html_e( 'Automatic', 'palm-tree-bookings' ); ?></option>
								<?php foreach ( $ptb_gateways as $ptb_id => $ptb_gateway ) : ?>
									<option value="<?php echo esc_attr( $ptb_id ); ?>" <?php selected( ptb_setting( 'gateway' ), $ptb_id ); ?>>
										<?php echo esc_html( $ptb_gateway->get_label() ); ?>
										<?php echo $ptb_gateway->is_configured() ? '' : esc_html__( ' (not configured)', 'palm-tree-bookings' ); ?>
									</option>
								<?php endforeach; ?>
							</select>
						<?php endif; ?>
					</td>
				</tr>
			</table>

			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}
