<?php
/**
 * Homepage contact form, handled through admin-post.php.
 *
 * Protections: nonce, honeypot field, minimum fill time, per-IP rate limit,
 * sanitization and validation of every field, and header-injection-safe wp_mail().
 * Messages go to the Customizer recipient, or to the site admin email when blank.
 * Use an SMTP plugin in production so mail is actually delivered.
 *
 * @package NetworkIP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Status messages shown after a submission.
 *
 * @return array<string,array{type:string,text:string}>
 */
function networkip_contact_messages() {
	return array(
		'sent'    => array( 'type' => 'success', 'text' => __( 'Thank you. Your message has been sent and we’ll get back to you as soon as possible.', 'networkip' ) ),
		'invalid' => array( 'type' => 'error', 'text' => __( 'Please fill in your name, a valid email address and a message.', 'networkip' ) ),
		'expired' => array( 'type' => 'error', 'text' => __( 'Your session expired. Please try sending the form again.', 'networkip' ) ),
		'limited' => array( 'type' => 'error', 'text' => __( 'Too many messages were sent from your connection. Please try again later or email us directly.', 'networkip' ) ),
		'failed'  => array( 'type' => 'error', 'text' => __( 'Sorry, your message could not be sent. Please call or email us directly.', 'networkip' ) ),
	);
}

/**
 * Redirect back to the form with a status code.
 *
 * @param string $status Status key.
 */
function networkip_contact_redirect( $status ) {
	$back = wp_get_referer();
	if ( ! $back ) {
		$back = home_url( '/' );
	}
	$back = remove_query_arg( 'networkip_contact', $back );
	$back = preg_replace( '/#.*$/', '', $back );
	wp_safe_redirect( add_query_arg( 'networkip_contact', $status, $back ) . '#contact' );
	exit;
}

/**
 * Handle a contact form submission.
 */
function networkip_handle_contact() {
	if ( 'POST' !== ( isset( $_SERVER['REQUEST_METHOD'] ) ? $_SERVER['REQUEST_METHOD'] : '' ) ) {
		networkip_contact_redirect( 'invalid' );
	}

	if ( ! isset( $_POST['networkip_contact_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['networkip_contact_nonce'] ) ), 'networkip_contact' ) ) {
		networkip_contact_redirect( 'expired' );
	}

	// Honeypot: real visitors never see or fill this field. Pretend success for bots.
	if ( ! empty( $_POST['nip_website'] ) ) {
		networkip_contact_redirect( 'sent' );
	}

	// Submissions faster than 3 seconds after page load are almost always bots.
	$started = isset( $_POST['nip_started'] ) ? absint( $_POST['nip_started'] ) : 0;
	if ( $started && ( time() - $started ) < 3 ) {
		networkip_contact_redirect( 'sent' );
	}

	$ip       = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$rate_key = 'networkip_cf_' . md5( $ip );
	$count    = (int) get_transient( $rate_key );
	if ( $count >= 5 ) {
		networkip_contact_redirect( 'limited' );
	}

	$name    = isset( $_POST['nip_name'] ) ? sanitize_text_field( wp_unslash( $_POST['nip_name'] ) ) : '';
	$company = isset( $_POST['nip_company'] ) ? sanitize_text_field( wp_unslash( $_POST['nip_company'] ) ) : '';
	$email   = isset( $_POST['nip_email'] ) ? sanitize_email( wp_unslash( $_POST['nip_email'] ) ) : '';
	$phone   = isset( $_POST['nip_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['nip_phone'] ) ) : '';
	$message = isset( $_POST['nip_message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['nip_message'] ) ) : '';

	$name    = mb_substr( $name, 0, 120 );
	$company = mb_substr( $company, 0, 160 );
	$phone   = mb_substr( preg_replace( '/[^0-9+().\-\s]/', '', $phone ), 0, 40 );
	$message = mb_substr( $message, 0, 5000 );

	if ( '' === $name || ! is_email( $email ) || '' === trim( $message ) ) {
		networkip_contact_redirect( 'invalid' );
	}

	$to = networkip_mod( 'contact_recipient' );
	if ( ! is_email( $to ) ) {
		$to = get_option( 'admin_email' );
	}

	/* translators: %s: sender name. */
	$subject = sprintf( __( 'Website enquiry from %s', 'networkip' ), $name );
	$body    = implode(
		"\n",
		array(
			__( 'Name:', 'networkip' ) . ' ' . $name,
			__( 'Company:', 'networkip' ) . ' ' . $company,
			__( 'Email:', 'networkip' ) . ' ' . $email,
			__( 'Phone:', 'networkip' ) . ' ' . $phone,
			'',
			$message,
		)
	);
	// sanitize_text_field() strips line breaks, so the name cannot inject headers.
	$headers = array( 'Reply-To: ' . str_replace( array( '"', '<', '>', ',', ';' ), '', $name ) . ' <' . $email . '>' );

	set_transient( $rate_key, $count + 1, HOUR_IN_SECONDS );

	$sent = wp_mail( $to, $subject, $body, $headers );

	/**
	 * Fires after a contact form submission was processed.
	 *
	 * @param bool  $sent   Whether wp_mail() reported success.
	 * @param array $fields Sanitized fields.
	 */
	do_action( 'networkip_contact_submitted', $sent, compact( 'name', 'company', 'email', 'phone', 'message' ) );

	networkip_contact_redirect( $sent ? 'sent' : 'failed' );
}
add_action( 'admin_post_nopriv_networkip_contact', 'networkip_handle_contact' );
add_action( 'admin_post_networkip_contact', 'networkip_handle_contact' );

/**
 * Current status message from the query string, if any.
 *
 * @return array{type:string,text:string}|null
 */
function networkip_contact_status() {
	if ( empty( $_GET['networkip_contact'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only.
		return null;
	}
	$key      = sanitize_key( wp_unslash( $_GET['networkip_contact'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$messages = networkip_contact_messages();
	return isset( $messages[ $key ] ) ? $messages[ $key ] : null;
}
