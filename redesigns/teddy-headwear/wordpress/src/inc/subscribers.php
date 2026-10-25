<?php
/**
 * Bear Club signups. Emails are stored as a private post type and listed
 * under "Bear Club" in the admin, with a CSV copy box for email tools.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', function () {
	register_post_type( 'teddy_subscriber', array(
		'labels'          => array(
			'name'          => __( 'Bear Club', 'teddy' ),
			'singular_name' => __( 'Subscriber', 'teddy' ),
			'all_items'     => __( 'Members', 'teddy' ),
		),
		'public'          => false,
		'show_ui'         => true,
		'show_in_menu'    => true,
		'menu_icon'       => 'dashicons-email-alt',
		'menu_position'   => 58,
		'supports'        => array( 'title' ),
		'capability_type' => 'post',
		'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
		'map_meta_cap'    => true,
	) );
} );

function teddy_subscribe_handler() {
	if ( ! check_ajax_referer( 'teddy', 'nonce', false ) ) {
		wp_send_json_error( array( 'message' => __( 'Your session expired. Refresh the page and try again.', 'teddy' ) ), 403 );
	}
	$email = sanitize_email( wp_unslash( $_POST['email'] ?? '' ) );
	if ( ! is_email( $email ) ) {
		wp_send_json_error( array( 'message' => __( 'Enter an email like you@email.com to join the list.', 'teddy' ) ), 400 );
	}
	$exists = get_posts( array( 'post_type' => 'teddy_subscriber', 'title' => $email, 'post_status' => 'any', 'fields' => 'ids', 'numberposts' => 1 ) );
	if ( ! $exists ) {
		wp_insert_post( array( 'post_type' => 'teddy_subscriber', 'post_title' => $email, 'post_status' => 'publish' ) );
		do_action( 'teddy_new_subscriber', $email );
	}
	wp_send_json_success( array( 'email' => $email ) );
}
add_action( 'wp_ajax_teddy_subscribe', 'teddy_subscribe_handler' );
add_action( 'wp_ajax_nopriv_teddy_subscribe', 'teddy_subscribe_handler' );

/** Copy-all box above the member list. */
add_action( 'admin_notices', function () {
	$screen = get_current_screen();
	if ( ! $screen || 'edit-teddy_subscriber' !== $screen->id ) {
		return;
	}
	$emails = get_posts( array( 'post_type' => 'teddy_subscriber', 'numberposts' => -1, 'fields' => 'ids' ) );
	$list   = implode( "\n", array_map( 'get_the_title', $emails ) );
	echo '<div class="notice notice-info"><p><strong>' . esc_html__( 'All Bear Club emails', 'teddy' ) . '</strong> (' . count( $emails ) . ') — ' . esc_html__( 'select and copy into your email tool.', 'teddy' ) . '</p>';
	echo '<textarea readonly rows="4" style="width:100%;font-family:monospace">' . esc_textarea( $list ) . '</textarea></div>';
} );
