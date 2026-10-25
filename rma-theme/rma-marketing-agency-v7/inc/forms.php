<?php
/**
 * The contact form and the newsletter sign-up both email the site admin.
 * v6 rendered these forms with nowhere to send them.
 *
 * @package rma
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'admin_post_nopriv_rma_form', 'rma_handle_form' );
add_action( 'admin_post_rma_form', 'rma_handle_form' );

/**
 * Validate a submission, email it to the admin, and send the visitor back.
 */
function rma_handle_form() {
	$back = wp_get_referer() ? wp_get_referer() : home_url( '/' );
	$back = remove_query_arg( 'rma', $back );

	// No nonce: these are public, logged-out forms, and SiteGround's page
	// cache would serve stale nonces that make real submissions fail.
	// Bots fill every field; people never see this one.
	if ( ! empty( $_POST['website'] ) ) {
		wp_safe_redirect( add_query_arg( 'rma', 'sent', $back ) );
		exit;
	}

	$kind  = isset( $_POST['kind'] ) && 'newsletter' === $_POST['kind'] ? 'newsletter' : 'contact';
	$email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	if ( ! is_email( $email ) ) {
		wp_safe_redirect( add_query_arg( 'rma', 'error', $back ) );
		exit;
	}

	$fields = array(
		'Name'     => isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '',
		'Email'    => $email,
		'Company'  => isset( $_POST['company'] ) ? sanitize_text_field( wp_unslash( $_POST['company'] ) ) : '',
		'Interest' => isset( $_POST['interest'] ) ? sanitize_text_field( wp_unslash( $_POST['interest'] ) ) : '',
		'Message'  => isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '',
	);

	$body = '';
	foreach ( array_filter( $fields ) as $label => $value ) {
		$body .= $label . ': ' . $value . "\n";
	}

	$subject = 'newsletter' === $kind ? 'New newsletter sign-up' : 'New inquiry from ' . ( $fields['Name'] ? $fields['Name'] : $email );
	$sent    = wp_mail( get_option( 'admin_email' ), '[RMA] ' . $subject, $body, array( 'Reply-To: ' . $email ) );

	wp_safe_redirect( add_query_arg( 'rma', $sent ? 'sent' : 'error', $back ) . ( 'newsletter' === $kind ? '#newsletter' : '#contact-form' ) );
	exit;
}

/**
 * The status line shown after a form posts back, if any.
 */
function rma_form_status() {
	if ( empty( $_GET['rma'] ) ) {
		return '';
	}
	if ( 'sent' === $_GET['rma'] ) {
		return '<p class="form-status is-ok" role="status">Thanks — we got it and will be in touch shortly.</p>';
	}
	return '<p class="form-status is-error" role="alert">That did not go through. Check the email address and try again.</p>';
}

/**
 * Hidden fields every RMA form needs.
 *
 * @param string $kind 'contact' or 'newsletter'.
 */
function rma_form_fields( $kind ) {
	return '<input type="hidden" name="action" value="rma_form">'
		. '<input type="hidden" name="kind" value="' . esc_attr( $kind ) . '">'
		. wp_referer_field( false )
		. '<label class="hp" aria-hidden="true">Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>';
}
