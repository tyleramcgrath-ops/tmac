<?php
/**
 * Homepage sign-up form: stores each sign-up as a private "Sign-up" entry,
 * listed under Sign-ups in the admin. Used until the dating app is live.
 *
 * @package gag
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const GAG_LOOKING = array(
	'relationship' => 'A relationship',
	'marriage'     => 'Marriage & family',
	'dating'       => 'Dating to see',
);

/**
 * Private post type for sign-ups. Never public, no front-end URLs.
 */
function gag_register_signups() {
	register_post_type(
		'gag_signup',
		array(
			'labels'          => array(
				'name'          => __( 'Sign-ups', 'gag' ),
				'singular_name' => __( 'Sign-up', 'gag' ),
				'menu_name'     => __( 'Sign-ups', 'gag' ),
			),
			'public'          => false,
			'show_ui'         => true,
			'show_in_menu'    => true,
			'menu_icon'       => 'dashicons-heart',
			'supports'        => array( 'title' ),
			'capability_type' => 'post',
			'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
			'map_meta_cap'    => true,
		)
	);
}
add_action( 'init', 'gag_register_signups' );

/**
 * Handle the form post (logged-in and anonymous visitors).
 */
function gag_handle_signup() {
	$back = home_url( '/#join' );

	if ( ! isset( $_POST['gag_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['gag_nonce'] ) ), 'gag_signup' ) ) {
		wp_safe_redirect( add_query_arg( 'signup', 'error', $back ) );
		exit;
	}
	// Honeypot: real people never fill this hidden field.
	if ( ! empty( $_POST['website'] ) ) {
		wp_safe_redirect( add_query_arg( 'signup', 'thanks', $back ) );
		exit;
	}

	$name    = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
	$email   = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$looking = isset( $_POST['looking'] ) ? sanitize_key( wp_unslash( $_POST['looking'] ) ) : 'relationship';
	$adult   = ! empty( $_POST['adult'] );

	if ( '' === $name || ! is_email( $email ) || ! $adult ) {
		wp_safe_redirect( add_query_arg( 'signup', 'missing', $back ) );
		exit;
	}
	if ( ! isset( GAG_LOOKING[ $looking ] ) ) {
		$looking = 'relationship';
	}

	$existing = get_posts(
		array(
			'post_type'      => 'gag_signup',
			'post_status'    => 'private',
			'meta_key'       => '_gag_email',
			'meta_value'     => $email,
			'fields'         => 'ids',
			'posts_per_page' => 1,
		)
	);

	if ( ! $existing ) {
		wp_insert_post(
			array(
				'post_type'   => 'gag_signup',
				'post_status' => 'private',
				'post_title'  => mb_substr( $name, 0, 60 ),
				'meta_input'  => array(
					'_gag_email'   => $email,
					'_gag_looking' => $looking,
				),
			)
		);
	}

	wp_safe_redirect( add_query_arg( 'signup', 'thanks', $back ) );
	exit;
}
add_action( 'admin_post_nopriv_gag_signup', 'gag_handle_signup' );
add_action( 'admin_post_gag_signup', 'gag_handle_signup' );

/**
 * Email and looking-for columns on the Sign-ups list.
 *
 * @param array $columns Columns.
 * @return array
 */
function gag_signup_columns( $columns ) {
	return array(
		'cb'          => $columns['cb'],
		'title'       => __( 'Name', 'gag' ),
		'gag_email'   => __( 'Email', 'gag' ),
		'gag_looking' => __( 'Looking for', 'gag' ),
		'date'        => __( 'Signed up', 'gag' ),
	);
}
add_filter( 'manage_gag_signup_posts_columns', 'gag_signup_columns' );

/**
 * Column values.
 *
 * @param string $column  Column key.
 * @param int    $post_id Post ID.
 */
function gag_signup_column_values( $column, $post_id ) {
	if ( 'gag_email' === $column ) {
		$email = get_post_meta( $post_id, '_gag_email', true );
		printf( '<a href="mailto:%1$s">%2$s</a>', esc_attr( $email ), esc_html( $email ) );
	} elseif ( 'gag_looking' === $column ) {
		$looking = get_post_meta( $post_id, '_gag_looking', true );
		echo esc_html( GAG_LOOKING[ $looking ] ?? $looking );
	}
}
add_action( 'manage_gag_signup_posts_custom_column', 'gag_signup_column_values', 10, 2 );

/**
 * Export sign-ups as CSV from the Sign-ups screen.
 */
function gag_signup_export_link() {
	$screen = get_current_screen();
	if ( ! $screen || 'edit-gag_signup' !== $screen->id ) {
		return;
	}
	$url = wp_nonce_url( admin_url( 'admin-post.php?action=gag_signup_export' ), 'gag_signup_export' );
	printf( '<div class="notice notice-info"><p><a class="button" href="%s">%s</a></p></div>', esc_url( $url ), esc_html__( 'Download all sign-ups (CSV)', 'gag' ) );
}
add_action( 'admin_notices', 'gag_signup_export_link' );

/**
 * Stops a cell being read as a spreadsheet formula when the CSV is opened.
 *
 * @param string $value Cell value.
 * @return string
 */
function gag_csv_cell( $value ) {
	return preg_match( '/^[=+\-@\t\r]/', (string) $value ) ? "'" . $value : (string) $value;
}

/**
 * Stream the CSV. Admins only.
 */
function gag_signup_export() {
	if ( ! current_user_can( 'edit_posts' ) || ! check_admin_referer( 'gag_signup_export' ) ) {
		wp_die( esc_html__( 'Not allowed.', 'gag' ) );
	}
	nocache_headers();
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename=gag-signups.csv' );
	$out = fopen( 'php://output', 'w' );
	fputcsv( $out, array( 'Name', 'Email', 'Looking for', 'Signed up' ) );
	$ids = get_posts( array( 'post_type' => 'gag_signup', 'post_status' => 'private', 'posts_per_page' => -1, 'fields' => 'ids' ) );
	foreach ( $ids as $id ) {
		$looking = get_post_meta( $id, '_gag_looking', true );
		$row     = array( get_the_title( $id ), get_post_meta( $id, '_gag_email', true ), GAG_LOOKING[ $looking ] ?? $looking, get_the_date( 'Y-m-d H:i', $id ) );
		fputcsv( $out, array_map( 'gag_csv_cell', $row ) );
	}
	fclose( $out ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
	exit;
}
add_action( 'admin_post_gag_signup_export', 'gag_signup_export' );
