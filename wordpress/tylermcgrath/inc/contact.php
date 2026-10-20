<?php
/**
 * Contact form: works with JavaScript (AJAX, the compass celebrates) and
 * without it (a normal POST and redirect).
 *
 * @package tylermcgrath
 */

defined( 'ABSPATH' ) || exit;

/**
 * A private inbox for form messages.
 */
function tm_register_messages() {
	register_post_type(
		'tm_message',
		array(
			'labels'          => array(
				'name'          => __( 'Messages', 'tylermcgrath' ),
				'singular_name' => __( 'Message', 'tylermcgrath' ),
			),
			'public'          => false,
			'show_ui'         => true,
			'menu_icon'       => 'dashicons-email-alt',
			'menu_position'   => 26,
			'supports'        => array( 'title', 'editor' ),
			'capability_type' => 'post',
			'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
			'map_meta_cap'    => true,
		)
	);
}
add_action( 'init', 'tm_register_messages' );

/**
 * Validate and send a contact message.
 *
 * @return true|string True on success, or an error message.
 */
function tm_contact_process() {
	if ( ! isset( $_POST['tm_contact_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['tm_contact_nonce'] ) ), 'tm_contact' ) ) {
		return __( 'Your session expired. Please refresh the page and try again.', 'tylermcgrath' );
	}

	// Honeypot: real people never fill this field.
	if ( ! empty( $_POST['tm_website'] ) ) {
		return true;
	}

	$name    = isset( $_POST['tm_name'] ) ? sanitize_text_field( wp_unslash( $_POST['tm_name'] ) ) : '';
	$email   = isset( $_POST['tm_email'] ) ? sanitize_email( wp_unslash( $_POST['tm_email'] ) ) : '';
	$topic   = isset( $_POST['tm_topic'] ) ? sanitize_text_field( wp_unslash( $_POST['tm_topic'] ) ) : '';
	$message = isset( $_POST['tm_message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['tm_message'] ) ) : '';

	if ( '' === $name || ! is_email( $email ) || '' === trim( $message ) ) {
		return __( 'Please add your name, a valid email and a message.', 'tylermcgrath' );
	}

	// One message per minute per address keeps the inbox clean.
	$key = 'tm_contact_' . md5( isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : $email );
	if ( get_transient( $key ) ) {
		return __( 'Thanks, your last message is already on its way. Please wait a minute before sending another.', 'tylermcgrath' );
	}

	$to      = tm_mod( 'contact_email' ) ? tm_mod( 'contact_email' ) : get_option( 'admin_email' );
	$subject = sprintf( '[%s] %s', wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ), $topic ? $topic : __( 'New message', 'tylermcgrath' ) );
	$body    = sprintf( "Name: %s\nEmail: %s\nTopic: %s\n\n%s\n", $name, $email, $topic, $message );
	$headers = array( 'Reply-To: ' . $name . ' <' . $email . '>' );

	// Every message is kept in WP Admin → Messages, so nothing is lost if the
	// host's email is misconfigured.
	$saved = wp_insert_post(
		array(
			'post_type'    => 'tm_message',
			'post_status'  => 'private',
			'post_title'   => sprintf( '%s — %s', $name, $topic ? $topic : __( 'Message', 'tylermcgrath' ) ),
			'post_content' => $body,
		)
	);
	$mailed = wp_mail( $to, $subject, $body, $headers );

	if ( ! $mailed && ( ! $saved || is_wp_error( $saved ) ) ) {
		return __( 'The message could not be sent. Please email me directly.', 'tylermcgrath' );
	}

	set_transient( $key, 1, MINUTE_IN_SECONDS );
	return true;
}

/**
 * AJAX handler.
 */
function tm_contact_ajax() {
	$result = tm_contact_process();
	if ( true === $result ) {
		wp_send_json_success();
	}
	wp_send_json_error( array( 'message' => $result ) );
}
add_action( 'wp_ajax_tm_contact', 'tm_contact_ajax' );
add_action( 'wp_ajax_nopriv_tm_contact', 'tm_contact_ajax' );

/**
 * No-JavaScript handler.
 */
function tm_contact_post() {
	$result = tm_contact_process();
	$back   = wp_get_referer() ? wp_get_referer() : home_url( '/' );
	$back   = remove_query_arg( array( 'tm_sent', 'tm_error' ), $back );
	if ( true === $result ) {
		$back = add_query_arg( 'tm_sent', 1, $back );
	} else {
		$back = add_query_arg( 'tm_error', 1, $back );
	}
	wp_safe_redirect( $back . '#connect' );
	exit;
}
add_action( 'admin_post_tm_contact', 'tm_contact_post' );
add_action( 'admin_post_nopriv_tm_contact', 'tm_contact_post' );
