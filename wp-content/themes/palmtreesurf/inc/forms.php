<?php
/**
 * Booking enquiry form.
 *
 * Works on its own so the site can take enquiries with no plugin installed. If
 * Contact Form 7 or WPForms is active, set the shortcode in the Customizer and
 * that form renders instead.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Enquiry form fields and their sanitiser.
 *
 * @return array<string, array{label: string, type: string, required: bool, sanitize: string}>
 */
function pt_enquiry_fields() {
	return array(
		'pt_name'    => array(
			'label'    => __( 'Your name', 'palmtreesurf' ),
			'type'     => 'text',
			'required' => true,
			'sanitize' => 'sanitize_text_field',
		),
		'pt_email'   => array(
			'label'    => __( 'Email', 'palmtreesurf' ),
			'type'     => 'email',
			'required' => true,
			'sanitize' => 'sanitize_email',
		),
		'pt_phone'   => array(
			'label'    => __( 'Phone or WhatsApp', 'palmtreesurf' ),
			'type'     => 'tel',
			'required' => false,
			'sanitize' => 'sanitize_text_field',
		),
		'pt_date'    => array(
			'label'    => __( 'Preferred date', 'palmtreesurf' ),
			'type'     => 'date',
			'required' => false,
			'sanitize' => 'sanitize_text_field',
		),
		'pt_guests'  => array(
			'label'    => __( 'Number of people', 'palmtreesurf' ),
			'type'     => 'number',
			'required' => false,
			'sanitize' => 'absint',
		),
		'pt_message' => array(
			'label'    => __( 'Tell us what you are looking for', 'palmtreesurf' ),
			'type'     => 'textarea',
			'required' => true,
			'sanitize' => 'sanitize_textarea_field',
		),
	);
}

/**
 * Handle an enquiry submission before any output is sent.
 *
 * Redirects back to the form with a status flag so a refresh never resubmits.
 */
function pt_handle_enquiry() {
	if ( ! isset( $_POST['pt_enquiry_submit'] ) ) {
		return;
	}

	$redirect = wp_get_referer() ? wp_get_referer() : home_url( '/' );

	$nonce = isset( $_POST['pt_enquiry_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['pt_enquiry_nonce'] ) ) : '';
	if ( ! wp_verify_nonce( $nonce, 'pt_enquiry' ) ) {
		wp_safe_redirect( add_query_arg( 'enquiry', 'error', $redirect ) );
		exit;
	}

	// Honeypot: real visitors never fill this in.
	if ( ! empty( $_POST['pt_website'] ) ) {
		wp_safe_redirect( add_query_arg( 'enquiry', 'sent', $redirect ) );
		exit;
	}

	// Throttle repeat submissions from the same address.
	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$key = 'pt_enquiry_' . md5( $ip );
	if ( $ip && get_transient( $key ) ) {
		wp_safe_redirect( add_query_arg( 'enquiry', 'throttled', $redirect ) );
		exit;
	}

	$values = array();
	foreach ( pt_enquiry_fields() as $name => $field ) {
		$raw             = isset( $_POST[ $name ] ) ? wp_unslash( $_POST[ $name ] ) : '';
		$values[ $name ] = call_user_func( $field['sanitize'], $raw );

		if ( $field['required'] && empty( $values[ $name ] ) ) {
			wp_safe_redirect( add_query_arg( 'enquiry', 'invalid', $redirect ) );
			exit;
		}
	}

	if ( ! is_email( $values['pt_email'] ) ) {
		wp_safe_redirect( add_query_arg( 'enquiry', 'invalid', $redirect ) );
		exit;
	}

	$package = isset( $_POST['pt_package'] ) ? sanitize_text_field( wp_unslash( $_POST['pt_package'] ) ) : '';

	$to = pt_mod( 'pt_email' );
	if ( ! $to || ! is_email( $to ) ) {
		$to = get_option( 'admin_email' );
	}

	$lines = array();
	foreach ( pt_enquiry_fields() as $name => $field ) {
		if ( '' === (string) $values[ $name ] ) {
			continue;
		}
		$lines[] = $field['label'] . ': ' . $values[ $name ];
	}

	if ( $package ) {
		$lines[] = __( 'Package', 'palmtreesurf' ) . ': ' . $package;
	}

	$subject = sprintf(
		/* translators: %s: visitor name. */
		__( 'Booking enquiry from %s', 'palmtreesurf' ),
		$values['pt_name']
	);

	$sent = wp_mail(
		$to,
		$subject,
		implode( "\n", $lines ),
		array(
			'Content-Type: text/plain; charset=UTF-8',
			'Reply-To: ' . $values['pt_name'] . ' <' . $values['pt_email'] . '>',
		)
	);

	if ( $ip ) {
		set_transient( $key, 1, MINUTE_IN_SECONDS );
	}

	wp_safe_redirect( add_query_arg( 'enquiry', $sent ? 'sent' : 'error', $redirect ) . '#enquiry' );
	exit;
}
add_action( 'template_redirect', 'pt_handle_enquiry' );

/**
 * Status message for the current request, if any.
 *
 * @return array{type: string, text: string}|null
 */
function pt_enquiry_notice() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only status flag set by our own redirect.
	$status = isset( $_GET['enquiry'] ) ? sanitize_key( wp_unslash( $_GET['enquiry'] ) ) : '';

	$messages = array(
		'sent'      => array( 'success', __( 'Thanks. We have your enquiry and will reply shortly.', 'palmtreesurf' ) ),
		'invalid'   => array( 'error', __( 'Please fill in your name, email and message.', 'palmtreesurf' ) ),
		'throttled' => array( 'error', __( 'You just sent an enquiry. Give us a minute before sending another.', 'palmtreesurf' ) ),
		'error'     => array( 'error', __( 'Sorry, that did not send. Please email or WhatsApp us instead.', 'palmtreesurf' ) ),
	);

	if ( ! isset( $messages[ $status ] ) ) {
		return null;
	}

	return array(
		'type' => $messages[ $status ][0],
		'text' => $messages[ $status ][1],
	);
}

/**
 * Render the enquiry form.
 *
 * @param array $atts Shortcode attributes.
 * @return string
 */
function pt_enquiry_form( $atts = array() ) {
	$atts = shortcode_atts(
		array(
			'package' => '',
			'title'   => __( 'Book your session', 'palmtreesurf' ),
		),
		$atts,
		'pt_enquiry_form'
	);

	ob_start();
	?>
	<section class="enquiry" id="enquiry">
		<?php if ( $atts['title'] ) : ?>
			<h2 class="enquiry__title"><?php echo esc_html( $atts['title'] ); ?></h2>
		<?php endif; ?>

		<?php $notice = pt_enquiry_notice(); ?>
		<?php if ( $notice ) : ?>
			<p class="notice notice--<?php echo esc_attr( $notice['type'] ); ?>" role="status">
				<?php echo esc_html( $notice['text'] ); ?>
			</p>
		<?php endif; ?>

		<form class="enquiry__form" method="post" action="">
			<?php wp_nonce_field( 'pt_enquiry', 'pt_enquiry_nonce' ); ?>
			<input type="hidden" name="pt_package" value="<?php echo esc_attr( $atts['package'] ); ?>" />

			<p class="enquiry__hp" aria-hidden="true">
				<label for="pts-website"><?php esc_html_e( 'Leave this field empty', 'palmtreesurf' ); ?></label>
				<input type="text" id="pts-website" name="pt_website" tabindex="-1" autocomplete="off" />
			</p>

			<?php foreach ( pt_enquiry_fields() as $name => $field ) : ?>
				<p class="enquiry__field enquiry__field--<?php echo esc_attr( $field['type'] ); ?>">
					<label for="<?php echo esc_attr( $name ); ?>">
						<?php echo esc_html( $field['label'] ); ?>
						<?php if ( $field['required'] ) : ?>
							<span class="required" aria-hidden="true">*</span>
						<?php endif; ?>
					</label>
					<?php if ( 'textarea' === $field['type'] ) : ?>
						<textarea id="<?php echo esc_attr( $name ); ?>" name="<?php echo esc_attr( $name ); ?>" rows="5" <?php echo $field['required'] ? 'required' : ''; ?>></textarea>
					<?php else : ?>
						<input type="<?php echo esc_attr( $field['type'] ); ?>" id="<?php echo esc_attr( $name ); ?>" name="<?php echo esc_attr( $name ); ?>" <?php echo $field['required'] ? 'required' : ''; ?> />
					<?php endif; ?>
				</p>
			<?php endforeach; ?>

			<p class="enquiry__actions">
				<button class="btn btn--primary" type="submit" name="pt_enquiry_submit" value="1">
					<?php esc_html_e( 'Send enquiry', 'palmtreesurf' ); ?>
				</button>
			</p>
		</form>
	</section>
	<?php
	return (string) ob_get_clean();
}
add_shortcode( 'pt_enquiry_form', 'pt_enquiry_form' );
