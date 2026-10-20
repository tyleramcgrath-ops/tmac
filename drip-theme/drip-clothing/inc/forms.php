<?php
/**
 * The contact form and the "join the swell" sign-up both email the site
 * admin through wp_mail().
 *
 * @package drip
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'admin_post_nopriv_drip_form', 'drip_handle_form' );
add_action( 'admin_post_drip_form', 'drip_handle_form' );

/**
 * Validate a submission, email it to the admin, and send the visitor back.
 */
function drip_handle_form() {
	$back = wp_get_referer() ? wp_get_referer() : home_url( '/' );
	$back = remove_query_arg( 'drip', $back );

	// No nonce: these are public, logged-out forms, and SiteGround's page
	// cache would serve stale nonces that make real submissions fail.
	// Bots fill every field; people never see this one.
	if ( ! empty( $_POST['website'] ) ) {
		wp_safe_redirect( add_query_arg( 'drip', 'sent', $back ) );
		exit;
	}

	$kind  = isset( $_POST['kind'] ) && 'newsletter' === $_POST['kind'] ? 'newsletter' : 'contact';
	$email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	if ( ! is_email( $email ) ) {
		wp_safe_redirect( add_query_arg( 'drip', 'error', $back ) . ( 'newsletter' === $kind ? '#join' : '#contact-form' ) );
		exit;
	}

	$fields = array(
		'Name'    => isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '',
		'Email'   => $email,
		'Order'   => isset( $_POST['order'] ) ? sanitize_text_field( wp_unslash( $_POST['order'] ) ) : '',
		'Topic'   => isset( $_POST['topic'] ) ? sanitize_text_field( wp_unslash( $_POST['topic'] ) ) : '',
		'Message' => isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '',
	);

	$body = '';
	foreach ( array_filter( $fields ) as $label => $value ) {
		$body .= $label . ': ' . $value . "\n";
	}

	$subject = 'newsletter' === $kind ? 'New drop-list sign-up' : 'New message from ' . ( $fields['Name'] ? $fields['Name'] : $email );
	$sent    = wp_mail( get_option( 'admin_email' ), '[DRIP] ' . $subject, $body, array( 'Reply-To: ' . $email ) );

	wp_safe_redirect( add_query_arg( 'drip', $sent ? 'sent' : 'error', $back ) . ( 'newsletter' === $kind ? '#join' : '#contact-form' ) );
	exit;
}

/**
 * The status line shown after a form posts back, if any.
 *
 * @param string $kind 'contact' or 'newsletter'.
 */
function drip_form_status( $kind = 'contact' ) {
	if ( empty( $_GET['drip'] ) ) {
		return '';
	}
	if ( 'sent' === $_GET['drip'] ) {
		$msg = 'newsletter' === $kind ? 'You are on the list. We will tell you when the next drop lands.' : 'Got it. We will get back to you soon.';
		return '<p class="form-status is-ok" role="status">' . esc_html( $msg ) . '</p>';
	}
	return '<p class="form-status is-error" role="alert">That did not go through. Check the email address and try again.</p>';
}

/**
 * Hidden fields every DRIP form needs.
 *
 * @param string $kind 'contact' or 'newsletter'.
 */
function drip_form_fields( $kind ) {
	return '<input type="hidden" name="action" value="drip_form">'
		. '<input type="hidden" name="kind" value="' . esc_attr( $kind ) . '">'
		. wp_referer_field( false )
		. '<label class="hp" aria-hidden="true">Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>';
}
