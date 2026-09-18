<?php
/**
 * CSV export of bookings.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Add the export button above the booking list.
 */
function ptb_export_button() {
	global $typenow;

	if ( PTB_POST_TYPE !== $typenow || ! current_user_can( 'edit_posts' ) ) {
		return;
	}

	printf(
		'<a class="button" href="%1$s">%2$s</a>',
		esc_url(
			wp_nonce_url(
				admin_url( 'edit.php?post_type=' . PTB_POST_TYPE . '&ptb_export=1' ),
				'ptb_export',
				'ptb_export_nonce'
			)
		),
		esc_html__( 'Export CSV', 'palm-tree-bookings' )
	);
}
add_action( 'restrict_manage_posts', 'ptb_export_button', 20 );

/**
 * Column headings for the export, in output order.
 *
 * @return array<string, string>
 */
function ptb_export_columns() {
	$columns = array(
		'id'           => __( 'Booking ID', 'palm-tree-bookings' ),
		'submitted_at' => __( 'Received', 'palm-tree-bookings' ),
		'status'       => __( 'Status', 'palm-tree-bookings' ),
	);

	foreach ( ptb_fields() as $key => $field ) {
		$columns[ $key ] = $field['label'];
	}

	foreach ( ptb_money_fields() as $key => $field ) {
		$columns[ $key ] = $field['label'];
	}

	$columns['balance_due'] = __( 'Balance due', 'palm-tree-bookings' );

	foreach ( ptb_internal_fields() as $key => $field ) {
		$columns[ $key ] = $field['label'];
	}

	foreach ( ptb_attribution_fields() as $key => $label ) {
		$columns[ $key ] = $label;
	}

	return $columns;
}

/**
 * Stream the export when requested.
 */
function ptb_maybe_export() {
	if ( ! isset( $_GET['ptb_export'] ) ) {
		return;
	}

	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( esc_html__( 'You cannot export bookings.', 'palm-tree-bookings' ) );
	}

	$nonce = isset( $_GET['ptb_export_nonce'] ) ? sanitize_text_field( wp_unslash( $_GET['ptb_export_nonce'] ) ) : '';
	if ( ! wp_verify_nonce( $nonce, 'ptb_export' ) ) {
		wp_die( esc_html__( 'That export link expired. Please try again.', 'palm-tree-bookings' ) );
	}

	$bookings = get_posts(
		array(
			'post_type'      => PTB_POST_TYPE,
			'posts_per_page' => -1,
			'orderby'        => 'date',
			'order'          => 'DESC',
			'post_status'    => 'any',
		)
	);

	$columns  = ptb_export_columns();
	$filename = 'palm-tree-bookings-' . gmdate( 'Y-m-d' ) . '.csv';

	nocache_headers();
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename=' . $filename );

	$out = fopen( 'php://output', 'w' );

	// Byte order mark so Excel reads UTF-8 correctly.
	fwrite( $out, "\xEF\xBB\xBF" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite

	fputcsv( $out, array_values( $columns ) );

	$statuses         = ptb_statuses();
	$payment_statuses = ptb_payment_statuses();

	foreach ( $bookings as $booking ) {
		$row = array();

		foreach ( array_keys( $columns ) as $key ) {
			switch ( $key ) {
				case 'id':
					$row[] = $booking->ID;
					break;

				case 'status':
					$status = ptb_get_status( $booking->ID );
					$row[]  = isset( $statuses[ $status ] ) ? $statuses[ $status ] : $status;
					break;

				case 'payment_status':
					$status = ptb_get( $booking->ID, 'payment_status' );
					$row[]  = isset( $payment_statuses[ $status ] ) ? $payment_statuses[ $status ] : '';
					break;

				case 'quote_amount':
				case 'deposit_amount':
				case 'amount_paid':
					$row[] = number_format( (int) ptb_get( $booking->ID, $key ) / 100, 2, '.', '' );
					break;

				case 'balance_due':
					$row[] = number_format( ptb_balance_due( $booking->ID ) / 100, 2, '.', '' );
					break;

				default:
					$row[] = ptb_display_value( $key, ptb_get( $booking->ID, $key ) );
			}
		}

		fputcsv( $out, $row );
	}

	fclose( $out ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
	exit;
}
add_action( 'admin_init', 'ptb_maybe_export' );
