<?php
/**
 * Booking admin screens.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register the booking meta boxes.
 */
function ptb_add_meta_boxes() {
	add_meta_box( 'ptb-request', __( 'Booking request', 'palm-tree-bookings' ), 'ptb_render_request_box', PTB_POST_TYPE, 'normal', 'high' );
	add_meta_box( 'ptb-internal', __( 'Internal', 'palm-tree-bookings' ), 'ptb_render_internal_box', PTB_POST_TYPE, 'normal', 'default' );
	add_meta_box( 'ptb-status', __( 'Status', 'palm-tree-bookings' ), 'ptb_render_status_box', PTB_POST_TYPE, 'side', 'high' );
	add_meta_box( 'ptb-payment', __( 'Payment', 'palm-tree-bookings' ), 'ptb_render_payment_box', PTB_POST_TYPE, 'side', 'default' );
	add_meta_box( 'ptb-attribution', __( 'Where it came from', 'palm-tree-bookings' ), 'ptb_render_attribution_box', PTB_POST_TYPE, 'side', 'low' );
}
add_action( 'add_meta_boxes_' . PTB_POST_TYPE, 'ptb_add_meta_boxes' );

/**
 * Everything the customer submitted, read-only.
 *
 * @param WP_Post $post Booking.
 */
function ptb_render_request_box( $post ) {
	wp_nonce_field( 'ptb_save_booking', 'ptb_booking_nonce' );

	foreach ( ptb_field_groups() as $group ) {
		$rows = array();

		foreach ( $group['fields'] as $key => $field ) {
			$value = ptb_get( $post->ID, $key );
			if ( '' === $value ) {
				continue;
			}
			$rows[ $field['label'] ] = ptb_display_value( $key, $value );
		}

		if ( ! $rows ) {
			continue;
		}

		printf( '<h3 style="margin-bottom:4px">%s</h3>', esc_html( $group['label'] ) );
		echo '<table class="widefat striped" style="margin-bottom:16px"><tbody>';
		foreach ( $rows as $label => $value ) {
			printf(
				'<tr><th scope="row" style="width:220px">%1$s</th><td>%2$s</td></tr>',
				esc_html( $label ),
				nl2br( esc_html( $value ) )
			);
		}
		echo '</tbody></table>';
	}

	$email = ptb_get( $post->ID, 'email' );
	$phone = preg_replace( '/\D/', '', ptb_get( $post->ID, 'phone' ) );

	echo '<p>';
	if ( $email && is_email( $email ) ) {
		printf(
			'<a class="button" href="%1$s">%2$s</a> ',
			esc_url( 'mailto:' . $email ),
			esc_html__( 'Email customer', 'palm-tree-bookings' )
		);
	}
	if ( $phone ) {
		printf(
			'<a class="button" href="%1$s" target="_blank" rel="noopener">%2$s</a>',
			esc_url( 'https://wa.me/' . $phone ),
			esc_html__( 'WhatsApp customer', 'palm-tree-bookings' )
		);
	}
	echo '</p>';
}

/**
 * Fields the business fills in.
 *
 * @param WP_Post $post Booking.
 */
function ptb_render_internal_box( $post ) {
	echo '<table class="form-table" role="presentation"><tbody>';

	foreach ( ptb_internal_fields() as $key => $field ) {
		$value = ptb_get( $post->ID, $key );
		$id    = 'ptb-internal-' . sanitize_key( $key );

		echo '<tr><th scope="row">';
		printf( '<label for="%1$s">%2$s</label>', esc_attr( $id ), esc_html( $field['label'] ) );
		echo '</th><td>';

		if ( 'textarea' === $field['type'] ) {
			printf(
				'<textarea id="%1$s" name="ptb_internal[%2$s]" rows="%3$d" class="large-text">%4$s</textarea>',
				esc_attr( $id ),
				esc_attr( $key ),
				isset( $field['rows'] ) ? (int) $field['rows'] : 4,
				esc_textarea( $value )
			);
		} elseif ( 'checkbox' === $field['type'] ) {
			printf(
				'<label><input type="checkbox" id="%1$s" name="ptb_internal[%2$s]" value="1"%3$s /> %4$s</label>',
				esc_attr( $id ),
				esc_attr( $key ),
				checked( $value, '1', false ),
				esc_html__( 'Yes', 'palm-tree-bookings' )
			);
		} else {
			printf(
				'<input type="text" id="%1$s" name="ptb_internal[%2$s]" value="%3$s" class="regular-text" />',
				esc_attr( $id ),
				esc_attr( $key ),
				esc_attr( $value )
			);
		}

		echo '</td></tr>';
	}

	echo '</tbody></table>';
}

/**
 * Workflow status.
 *
 * @param WP_Post $post Booking.
 */
function ptb_render_status_box( $post ) {
	$current = ptb_get_status( $post->ID );

	echo '<p><select name="ptb_status" style="width:100%">';
	foreach ( ptb_statuses() as $value => $label ) {
		printf(
			'<option value="%1$s"%2$s>%3$s</option>',
			esc_attr( $value ),
			selected( $current, $value, false ),
			esc_html( $label )
		);
	}
	echo '</select></p>';

	$submitted = ptb_get( $post->ID, 'submitted_at' );
	if ( $submitted ) {
		printf(
			'<p class="description">%s %s</p>',
			esc_html__( 'Received', 'palm-tree-bookings' ),
			esc_html( $submitted )
		);
	}
}

/**
 * Money panel: quote, deposit, ledger, pay link.
 *
 * @param WP_Post $post Booking.
 */
function ptb_render_payment_box( $post ) {
	$currency = ptb_get( $post->ID, 'currency' );
	$currency = $currency ? $currency : ptb_currency();

	echo '<table class="form-table" role="presentation" style="margin:0"><tbody>';

	foreach ( array( 'quote_amount' => __( 'Total quoted', 'palm-tree-bookings' ), 'deposit_amount' => __( 'Deposit due', 'palm-tree-bookings' ) ) as $key => $label ) {
		printf(
			'<tr><th scope="row" style="padding:6px 0"><label for="ptb-%1$s">%2$s</label></th><td style="padding:6px 0">
				<input type="text" id="ptb-%1$s" name="ptb_money[%1$s]" value="%3$s" class="small-text" inputmode="decimal" /> %4$s</td></tr>',
			esc_attr( $key ),
			esc_html( $label ),
			esc_attr( number_format( (int) ptb_get( $post->ID, $key ) / 100, 2, '.', '' ) ),
			esc_html( $currency )
		);
	}

	printf(
		'<tr><th scope="row" style="padding:6px 0">%1$s</th><td style="padding:6px 0"><strong>%2$s</strong></td></tr>',
		esc_html__( 'Paid', 'palm-tree-bookings' ),
		esc_html( ptb_format_money( (int) ptb_get( $post->ID, 'amount_paid' ), $currency ) )
	);

	printf(
		'<tr><th scope="row" style="padding:6px 0">%1$s</th><td style="padding:6px 0"><strong>%2$s</strong></td></tr>',
		esc_html__( 'Balance', 'palm-tree-bookings' ),
		esc_html( ptb_format_money( ptb_balance_due( $post->ID ), $currency ) )
	);

	$statuses = ptb_payment_statuses();
	$current  = ptb_get( $post->ID, 'payment_status' );
	echo '<tr><th scope="row" style="padding:6px 0">' . esc_html__( 'Status', 'palm-tree-bookings' ) . '</th><td style="padding:6px 0"><select name="ptb_money[payment_status]" style="width:100%">';
	foreach ( $statuses as $value => $label ) {
		printf( '<option value="%1$s"%2$s>%3$s</option>', esc_attr( $value ), selected( $current, $value, false ), esc_html( $label ) );
	}
	echo '</select></td></tr>';
	echo '</tbody></table>';

	$log = ptb_payment_log( $post->ID );
	if ( $log ) {
		echo '<h4>' . esc_html__( 'Payments', 'palm-tree-bookings' ) . '</h4><ul style="margin:0">';
		foreach ( $log as $row ) {
			printf(
				'<li>%1$s &mdash; %2$s <span class="description">(%3$s)</span></li>',
				esc_html( ptb_format_money( (int) $row['amount'], $currency ) ),
				esc_html( $row['gateway'] ),
				esc_html( $row['recorded'] )
			);
		}
		echo '</ul>';
	}

	echo '<hr />';

	if ( ptb_payments_enabled() ) {
		printf(
			'<p><label>%1$s</label><br /><input type="text" readonly value="%2$s" class="widefat" onclick="this.select()" /></p><p class="description">%3$s</p>',
			esc_html__( 'Payment link for the customer', 'palm-tree-bookings' ),
			esc_url( ptb_pay_url( $post->ID ) ),
			esc_html__( 'Send this and they can pay online.', 'palm-tree-bookings' )
		);
	} else {
		printf(
			'<p class="description">%s</p>',
			esc_html__( 'No payment gateway installed yet, so there is no online payment link. Quotes and deposits still track here, and a link appears automatically once a gateway is added.', 'palm-tree-bookings' )
		);
	}

	echo '<h4>' . esc_html__( 'Record a payment', 'palm-tree-bookings' ) . '</h4>';
	printf(
		'<p><input type="text" name="ptb_manual_payment" value="" class="small-text" placeholder="0.00" inputmode="decimal" /> %1$s<br />
		<span class="description">%2$s</span></p>',
		esc_html( $currency ),
		esc_html__( 'Logs a payment you took in cash or by transfer, and updates the balance.', 'palm-tree-bookings' )
	);
}

/**
 * Attribution panel.
 *
 * @param WP_Post $post Booking.
 */
function ptb_render_attribution_box( $post ) {
	$rows = array();

	foreach ( ptb_attribution_fields() as $key => $label ) {
		$value = ptb_get( $post->ID, $key );
		if ( '' !== $value ) {
			$rows[ $label ] = $value;
		}
	}

	if ( ! $rows ) {
		printf( '<p class="description">%s</p>', esc_html__( 'No attribution recorded.', 'palm-tree-bookings' ) );
		return;
	}

	echo '<ul style="margin:0">';
	foreach ( $rows as $label => $value ) {
		printf( '<li><strong>%1$s:</strong> %2$s</li>', esc_html( $label ), esc_html( $value ) );
	}
	echo '</ul>';
}

/**
 * Save the admin-editable parts of a booking.
 *
 * @param int $post_id Booking ID.
 */
function ptb_save_booking( $post_id ) {
	if ( ! isset( $_POST['ptb_booking_nonce'] ) ) {
		return;
	}

	$nonce = sanitize_text_field( wp_unslash( $_POST['ptb_booking_nonce'] ) );
	if ( ! wp_verify_nonce( $nonce, 'ptb_save_booking' ) ) {
		return;
	}

	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	if ( isset( $_POST['ptb_status'] ) ) {
		$status   = sanitize_key( wp_unslash( $_POST['ptb_status'] ) );
		$statuses = ptb_statuses();
		if ( isset( $statuses[ $status ] ) ) {
			ptb_set( $post_id, 'status', $status );
		}
	}

	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitised per field below.
	$internal = isset( $_POST['ptb_internal'] ) && is_array( $_POST['ptb_internal'] ) ? wp_unslash( $_POST['ptb_internal'] ) : array();
	foreach ( ptb_internal_fields() as $key => $field ) {
		$raw = isset( $internal[ $key ] ) ? $internal[ $key ] : '';
		ptb_set( $post_id, $key, ptb_sanitize_value( $raw, $field ) );
	}

	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitised per field below.
	$money = isset( $_POST['ptb_money'] ) && is_array( $_POST['ptb_money'] ) ? wp_unslash( $_POST['ptb_money'] ) : array();

	foreach ( array( 'quote_amount', 'deposit_amount' ) as $key ) {
		if ( isset( $money[ $key ] ) ) {
			$major = (float) str_replace( ',', '', sanitize_text_field( $money[ $key ] ) );
			ptb_set( $post_id, $key, (string) (int) round( $major * 100 ) );
		}
	}

	if ( isset( $money['payment_status'] ) ) {
		$status   = sanitize_key( $money['payment_status'] );
		$statuses = ptb_payment_statuses();
		if ( isset( $statuses[ $status ] ) ) {
			ptb_set( $post_id, 'payment_status', $status );
		}
	}

	if ( ! empty( $_POST['ptb_manual_payment'] ) ) {
		$amount = (float) str_replace( ',', '', sanitize_text_field( wp_unslash( $_POST['ptb_manual_payment'] ) ) );
		if ( $amount > 0 ) {
			ptb_record_payment(
				$post_id,
				array(
					'amount'    => (int) round( $amount * 100 ),
					'gateway'   => 'manual',
					'reference' => 'manual-' . time(),
				)
			);
		}
	}
}
add_action( 'save_post_' . PTB_POST_TYPE, 'ptb_save_booking' );

/**
 * Booking list columns.
 *
 * @param array $columns Existing columns.
 * @return array
 */
function ptb_columns( $columns ) {
	return array(
		'cb'           => isset( $columns['cb'] ) ? $columns['cb'] : '',
		'ptb_name'     => __( 'Customer', 'palm-tree-bookings' ),
		'ptb_exp'      => __( 'Experience', 'palm-tree-bookings' ),
		'ptb_date'     => __( 'Requested date', 'palm-tree-bookings' ),
		'ptb_party'    => __( 'People', 'palm-tree-bookings' ),
		'ptb_status'   => __( 'Status', 'palm-tree-bookings' ),
		'ptb_payment'  => __( 'Payment', 'palm-tree-bookings' ),
		'ptb_received' => __( 'Received', 'palm-tree-bookings' ),
	);
}
add_filter( 'manage_' . PTB_POST_TYPE . '_posts_columns', 'ptb_columns' );

/**
 * Booking list column output.
 *
 * @param string $column  Column key.
 * @param int    $post_id Booking ID.
 */
function ptb_column_content( $column, $post_id ) {
	switch ( $column ) {
		case 'ptb_name':
			printf(
				'<strong><a class="row-title" href="%1$s">%2$s</a></strong><br /><span class="description">%3$s</span>',
				esc_url( get_edit_post_link( $post_id ) ),
				esc_html( ptb_get( $post_id, 'name' ) ),
				esc_html( ptb_get( $post_id, 'email' ) )
			);
			break;

		case 'ptb_exp':
			echo esc_html( ptb_display_value( 'experience', ptb_get( $post_id, 'experience' ) ) );
			break;

		case 'ptb_date':
			$slot = ptb_get( $post_id, 'slot_time' );
			printf(
				'%1$s%2$s',
				esc_html( ptb_get( $post_id, 'date_primary' ) ),
				$slot ? '<br /><span class="description">' . esc_html( ptb_format_time( $slot ) ) . '</span>' : ''
			);
			break;

		case 'ptb_party':
			$adults   = (int) ptb_get( $post_id, 'party_adults' );
			$children = (int) ptb_get( $post_id, 'party_children' );
			echo esc_html( $children ? sprintf( '%d + %d', $adults, $children ) : (string) $adults );
			break;

		case 'ptb_status':
			$statuses = ptb_statuses();
			$status   = ptb_get_status( $post_id );
			printf(
				'<span class="ptb-pill ptb-pill--%1$s">%2$s</span>',
				esc_attr( $status ),
				esc_html( isset( $statuses[ $status ] ) ? $statuses[ $status ] : $status )
			);
			break;

		case 'ptb_payment':
			$statuses = ptb_payment_statuses();
			$status   = ptb_get( $post_id, 'payment_status' );
			$label    = isset( $statuses[ $status ] ) ? $statuses[ $status ] : $statuses['unpaid'];
			printf(
				'%1$s<br /><span class="description">%2$s</span>',
				esc_html( $label ),
				esc_html( ptb_format_money( (int) ptb_get( $post_id, 'amount_paid' ), ptb_get( $post_id, 'currency' ) ) )
			);
			break;

		case 'ptb_received':
			echo esc_html( ptb_get( $post_id, 'submitted_at' ) );
			break;
	}
}
add_action( 'manage_' . PTB_POST_TYPE . '_posts_custom_column', 'ptb_column_content', 10, 2 );

/**
 * Filter bookings by workflow status.
 */
function ptb_status_filter() {
	global $typenow;

	if ( PTB_POST_TYPE !== $typenow ) {
		return;
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only list filter.
	$current = isset( $_GET['ptb_status_filter'] ) ? sanitize_key( wp_unslash( $_GET['ptb_status_filter'] ) ) : '';

	echo '<select name="ptb_status_filter">';
	printf( '<option value="">%s</option>', esc_html__( 'All statuses', 'palm-tree-bookings' ) );
	foreach ( ptb_statuses() as $value => $label ) {
		printf( '<option value="%1$s"%2$s>%3$s</option>', esc_attr( $value ), selected( $current, $value, false ), esc_html( $label ) );
	}
	echo '</select>';
}
add_action( 'restrict_manage_posts', 'ptb_status_filter' );

/**
 * Apply the status filter and default ordering.
 *
 * @param WP_Query $query Admin query.
 */
function ptb_filter_query( $query ) {
	global $pagenow;

	if ( ! is_admin() || 'edit.php' !== $pagenow || ! $query->is_main_query() ) {
		return;
	}

	if ( PTB_POST_TYPE !== $query->get( 'post_type' ) ) {
		return;
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only list filter.
	$status = isset( $_GET['ptb_status_filter'] ) ? sanitize_key( wp_unslash( $_GET['ptb_status_filter'] ) ) : '';

	if ( $status ) {
		$query->set(
			'meta_query', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
			array(
				array(
					'key'   => '_ptb_status',
					'value' => $status,
				),
			)
		);
	}
}
add_action( 'pre_get_posts', 'ptb_filter_query' );

/**
 * A little colour for the status pills.
 */
function ptb_admin_styles() {
	global $typenow;

	if ( PTB_POST_TYPE !== $typenow ) {
		return;
	}

	echo '<style>
		.ptb-pill{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;background:#e5e7eb;color:#111}
		.ptb-pill--new{background:#dbeafe;color:#1e40af}
		.ptb-pill--contacted{background:#fef3c7;color:#92400e}
		.ptb-pill--confirmed{background:#d1fae5;color:#065f46}
		.ptb-pill--completed{background:#e5e7eb;color:#374151}
		.ptb-pill--cancelled{background:#fee2e2;color:#991b1b}
	</style>';
}
add_action( 'admin_head', 'ptb_admin_styles' );
