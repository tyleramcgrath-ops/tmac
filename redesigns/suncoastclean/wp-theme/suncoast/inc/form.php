<?php
/**
 * The free-estimate form: emails the request to the site owner.
 */

defined( 'ABSPATH' ) || exit;

function suncoast_handle_estimate() {
	$back = isset( $_POST['_sc_return'] ) ? esc_url_raw( wp_unslash( $_POST['_sc_return'] ) ) : home_url( '/' );
	if ( strpos( $back, home_url() ) !== 0 ) {
		$back = home_url( '/' );
	}
	$fail = add_query_arg( 'estimate', 'error', $back ) . '#estimate';
	if ( ! isset( $_POST['_sc_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_sc_nonce'] ) ), 'suncoast_estimate' ) ) {
		wp_safe_redirect( $fail );
		exit;
	}
	if ( ! empty( $_POST['website'] ) ) {   // honeypot
		wp_safe_redirect( add_query_arg( 'estimate', 'sent', $back ) . '#estimate' );
		exit;
	}
	$f = function ( $k, $max = 200 ) {
		return isset( $_POST[ $k ] ) ? mb_substr( sanitize_text_field( wp_unslash( $_POST[ $k ] ) ), 0, $max ) : '';
	};
	$name    = $f( 'name' );
	$phone   = $f( 'phone', 40 );
	$service = $f( 'service', 60 );
	$zip     = $f( 'zip', 12 );
	$notes   = isset( $_POST['notes'] ) ? mb_substr( sanitize_textarea_field( wp_unslash( $_POST['notes'] ) ), 0, 2000 ) : '';
	if ( $name === '' || $phone === '' ) {
		wp_safe_redirect( $fail );
		exit;
	}
	$to      = suncoast_option( 'estimate_to' );
	$subject = 'Free estimate request: ' . $service . ' (' . $name . ')';
	$body    = "A visitor asked for a free estimate on " . home_url( '/' ) . "\n\n" .
		"Name: $name\nPhone: $phone\nService: $service\nZIP: $zip\n\n$notes\n\nSent from the page: $back\n";
	$headers = array( 'Content-Type: text/plain; charset=UTF-8' );
	$ok      = wp_mail( $to, $subject, $body, $headers );
	wp_safe_redirect( add_query_arg( 'estimate', $ok ? 'sent' : 'error', $back ) . '#estimate' );
	exit;
}
add_action( 'admin_post_nopriv_suncoast_estimate', 'suncoast_handle_estimate' );
add_action( 'admin_post_suncoast_estimate', 'suncoast_handle_estimate' );
