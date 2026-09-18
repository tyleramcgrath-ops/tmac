<?php
/**
 * Schedule editing on the experience, and the day-by-day schedule view.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Add the schedule box to whatever post type holds experiences.
 */
function ptb_add_schedule_meta_box() {
	$post_type = ptb_experience_post_type();

	if ( ! post_type_exists( $post_type ) ) {
		return;
	}

	add_meta_box(
		'ptb-schedule',
		__( 'Availability & Schedule', 'palm-tree-bookings' ),
		'ptb_render_schedule_meta_box',
		$post_type,
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'ptb_add_schedule_meta_box' );

/**
 * Render the schedule editor.
 *
 * @param WP_Post $post Experience being edited.
 */
function ptb_render_schedule_meta_box( $post ) {
	wp_nonce_field( 'ptb_save_schedule', 'ptb_schedule_nonce' );

	$schedule  = ptb_schedule( $post->ID );
	$weekdays  = array(
		0 => __( 'Sun', 'palm-tree-bookings' ),
		1 => __( 'Mon', 'palm-tree-bookings' ),
		2 => __( 'Tue', 'palm-tree-bookings' ),
		3 => __( 'Wed', 'palm-tree-bookings' ),
		4 => __( 'Thu', 'palm-tree-bookings' ),
		5 => __( 'Fri', 'palm-tree-bookings' ),
		6 => __( 'Sat', 'palm-tree-bookings' ),
	);
	?>
	<style>
		.ptb-sched-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
		.ptb-days { display: flex; flex-wrap: wrap; gap: 6px; }
		.ptb-days label { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border: 1px solid #c3c4c7; border-radius: 999px; cursor: pointer; }
		.ptb-days input:checked + span { font-weight: 700; }
		.ptb-preview { margin-top: 14px; padding: 12px; background: #f6f7f7; border-left: 4px solid #2271b1; }
	</style>

	<p class="description">
		<?php esc_html_e( 'Set when this excursion runs. The booking form only offers dates and times that are open, and a slot stops being offered once it fills.', 'palm-tree-bookings' ); ?>
	</p>

	<div class="ptb-sched-grid">
		<div>
			<p><strong><?php esc_html_e( 'Days it runs', 'palm-tree-bookings' ); ?></strong></p>
			<div class="ptb-days">
				<?php foreach ( $weekdays as $index => $label ) : ?>
					<label>
						<input type="checkbox" name="ptb_sched[days][]" value="<?php echo esc_attr( $index ); ?>" <?php checked( in_array( $index, $schedule['days'], true ) ); ?> />
						<span><?php echo esc_html( $label ); ?></span>
					</label>
				<?php endforeach; ?>
			</div>

			<p style="margin-top:14px">
				<label for="ptb-times"><strong><?php esc_html_e( 'Start times', 'palm-tree-bookings' ); ?></strong></label><br />
				<textarea id="ptb-times" name="ptb_sched[times]" rows="5" class="widefat" placeholder="07:00&#10;09:30&#10;14:00"><?php echo esc_textarea( implode( "\n", $schedule['times'] ) ); ?></textarea>
				<span class="description"><?php esc_html_e( 'One per line, 24-hour. Leave empty for an all-day excursion with no set start time.', 'palm-tree-bookings' ); ?></span>
			</p>
		</div>

		<div>
			<p>
				<label for="ptb-capacity"><strong><?php esc_html_e( 'Guests per slot', 'palm-tree-bookings' ); ?></strong></label><br />
				<input type="number" id="ptb-capacity" name="ptb_sched[capacity]" value="<?php echo esc_attr( $schedule['capacity'] ); ?>" min="1" max="200" class="small-text" />
				<span class="description"><?php esc_html_e( 'How many people you can take at one start time.', 'palm-tree-bookings' ); ?></span>
			</p>

			<p>
				<label for="ptb-lead"><strong><?php esc_html_e( 'Minimum notice (hours)', 'palm-tree-bookings' ); ?></strong></label><br />
				<input type="number" id="ptb-lead" name="ptb_sched[lead]" value="<?php echo esc_attr( $schedule['lead_hours'] ); ?>" min="0" max="720" class="small-text" />
			</p>

			<p>
				<label for="ptb-window"><strong><?php esc_html_e( 'Bookable how far ahead (days)', 'palm-tree-bookings' ); ?></strong></label><br />
				<input type="number" id="ptb-window" name="ptb_sched[window]" value="<?php echo esc_attr( $schedule['window_days'] ); ?>" min="1" max="730" class="small-text" />
			</p>
		</div>

		<div>
			<p>
				<strong><?php esc_html_e( 'Season', 'palm-tree-bookings' ); ?></strong><br />
				<label for="ptb-season-start"><?php esc_html_e( 'From', 'palm-tree-bookings' ); ?></label>
				<input type="text" id="ptb-season-start" name="ptb_sched[season_start]" value="<?php echo esc_attr( $schedule['season_start'] ); ?>" placeholder="12-01" size="6" />
				<label for="ptb-season-end"><?php esc_html_e( 'to', 'palm-tree-bookings' ); ?></label>
				<input type="text" id="ptb-season-end" name="ptb_sched[season_end]" value="<?php echo esc_attr( $schedule['season_end'] ); ?>" placeholder="04-30" size="6" />
				<br /><span class="description"><?php esc_html_e( 'Month-day, e.g. 12-01 to 04-30. Leave empty to run year round. A range may cross the new year.', 'palm-tree-bookings' ); ?></span>
			</p>

			<p>
				<label for="ptb-blackout"><strong><?php esc_html_e( 'Blackout dates', 'palm-tree-bookings' ); ?></strong></label><br />
				<textarea id="ptb-blackout" name="ptb_sched[blackout]" rows="4" class="widefat" placeholder="2026-12-25"><?php echo esc_textarea( implode( "\n", $schedule['blackout'] ) ); ?></textarea>
				<span class="description"><?php esc_html_e( 'One per line as YYYY-MM-DD. Closures, holidays, maintenance.', 'palm-tree-bookings' ); ?></span>
			</p>
		</div>
	</div>

	<?php
	$open = ptb_open_dates( $post->ID, '', 21 );
	?>
	<div class="ptb-preview">
		<strong><?php esc_html_e( 'Next open dates', 'palm-tree-bookings' ); ?></strong>
		<?php if ( $open ) : ?>
			<p style="margin:6px 0 0"><?php echo esc_html( implode( '   ·   ', array_slice( $open, 0, 10 ) ) ); ?></p>
		<?php else : ?>
			<p style="margin:6px 0 0"><?php esc_html_e( 'Nothing open in the next three weeks. Check the days, times, season and minimum notice above.', 'palm-tree-bookings' ); ?></p>
		<?php endif; ?>
		<p class="description" style="margin:6px 0 0"><?php esc_html_e( 'Updates after you save.', 'palm-tree-bookings' ); ?></p>
	</div>
	<?php
}

/**
 * Save the schedule.
 *
 * @param int $post_id Experience ID.
 */
function ptb_save_schedule( $post_id ) {
	if ( ! isset( $_POST['ptb_schedule_nonce'] ) ) {
		return;
	}

	$nonce = sanitize_text_field( wp_unslash( $_POST['ptb_schedule_nonce'] ) );
	if ( ! wp_verify_nonce( $nonce, 'ptb_save_schedule' ) ) {
		return;
	}

	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitised per key below.
	$raw = isset( $_POST['ptb_sched'] ) && is_array( $_POST['ptb_sched'] ) ? wp_unslash( $_POST['ptb_sched'] ) : array();

	$days = isset( $raw['days'] ) && is_array( $raw['days'] ) ? array_map( 'absint', $raw['days'] ) : array();
	$days = array_values(
		array_filter(
			$days,
			function ( $day ) {
				return $day >= 0 && $day <= 6;
			}
		)
	);
	update_post_meta( $post_id, '_ptb_sched_days', implode( ',', $days ) );

	$times = isset( $raw['times'] ) ? sanitize_textarea_field( $raw['times'] ) : '';
	$times = array_values(
		array_filter(
			array_map( 'trim', explode( "\n", $times ) ),
			function ( $time ) {
				return (bool) preg_match( '/^\d{1,2}:\d{2}$/', $time );
			}
		)
	);
	// Normalise 7:00 to 07:00 so string comparison against stored slots holds.
	$times = array_map(
		function ( $time ) {
			list( $h, $m ) = explode( ':', $time );
			return sprintf( '%02d:%02d', (int) $h, (int) $m );
		},
		$times
	);
	update_post_meta( $post_id, '_ptb_sched_times', implode( "\n", $times ) );

	update_post_meta( $post_id, '_ptb_sched_capacity', max( 1, absint( isset( $raw['capacity'] ) ? $raw['capacity'] : 8 ) ) );
	update_post_meta( $post_id, '_ptb_sched_lead', absint( isset( $raw['lead'] ) ? $raw['lead'] : 12 ) );
	update_post_meta( $post_id, '_ptb_sched_window', max( 1, absint( isset( $raw['window'] ) ? $raw['window'] : 365 ) ) );

	foreach ( array( 'season_start', 'season_end' ) as $key ) {
		$value = isset( $raw[ $key ] ) ? sanitize_text_field( $raw[ $key ] ) : '';
		update_post_meta( $post_id, '_ptb_sched_' . $key, preg_match( '/^\d{2}-\d{2}$/', $value ) ? $value : '' );
	}

	$blackout = isset( $raw['blackout'] ) ? sanitize_textarea_field( $raw['blackout'] ) : '';
	$blackout = array_values(
		array_filter(
			array_map( 'trim', explode( "\n", $blackout ) ),
			function ( $date ) {
				return (bool) preg_match( '/^\d{4}-\d{2}-\d{2}$/', $date );
			}
		)
	);
	update_post_meta( $post_id, '_ptb_sched_blackout', implode( "\n", $blackout ) );
}
add_action( 'save_post', 'ptb_save_schedule' );

/* -------------------------------------------------------------------------
 * Schedule view: what is actually happening, day by day
 * ---------------------------------------------------------------------- */

/**
 * Add the schedule screen under Bookings.
 */
function ptb_schedule_menu() {
	add_submenu_page(
		'edit.php?post_type=' . PTB_POST_TYPE,
		__( 'Schedule', 'palm-tree-bookings' ),
		__( 'Schedule', 'palm-tree-bookings' ),
		'edit_posts',
		'ptb-schedule',
		'ptb_render_schedule_page'
	);
}
add_action( 'admin_menu', 'ptb_schedule_menu' );

/**
 * Render the day-by-day schedule of upcoming bookings.
 */
function ptb_render_schedule_page() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only date filter.
	$days = isset( $_GET['days'] ) ? absint( $_GET['days'] ) : 14;
	$days = $days > 0 ? min( 90, $days ) : 14;
	$from = current_time( 'Y-m-d' );
	$to   = gmdate( 'Y-m-d', strtotime( $from . ' +' . $days . ' days' ) );

	$bookings = get_posts(
		array(
			'post_type'      => PTB_POST_TYPE,
			'posts_per_page' => -1,
			'post_status'    => 'publish',
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Bounded by date range.
			'meta_query'     => array(
				array(
					'key'     => '_ptb_date_primary',
					'value'   => array( $from, $to ),
					'compare' => 'BETWEEN',
					'type'    => 'DATE',
				),
			),
		)
	);

	$by_date  = array();
	$blocking = ptb_blocking_statuses();

	foreach ( $bookings as $booking ) {
		if ( ! in_array( ptb_get_status( $booking->ID ), $blocking, true ) ) {
			continue;
		}

		$date               = ptb_get( $booking->ID, 'date_primary' );
		$by_date[ $date ][] = $booking;
	}

	ksort( $by_date );
	$statuses = ptb_statuses();
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Schedule', 'palm-tree-bookings' ); ?></h1>
		<p class="description">
			<?php
			printf(
				/* translators: %d: number of days. */
				esc_html__( 'Confirmed and pending bookings for the next %d days. Cancelled bookings are not shown and their seats are released.', 'palm-tree-bookings' ),
				(int) $days
			);
			?>
		</p>

		<p>
			<?php foreach ( array( 7, 14, 30, 90 ) as $option ) : ?>
				<a class="button<?php echo $days === $option ? ' button-primary' : ''; ?>" href="<?php echo esc_url( add_query_arg( 'days', $option ) ); ?>">
					<?php
					printf(
						/* translators: %d: number of days. */
						esc_html__( '%d days', 'palm-tree-bookings' ),
						(int) $option
					);
					?>
				</a>
			<?php endforeach; ?>
		</p>

		<?php if ( ! $by_date ) : ?>
			<p><strong><?php esc_html_e( 'Nothing booked in this window.', 'palm-tree-bookings' ); ?></strong></p>
		<?php endif; ?>

		<?php foreach ( $by_date as $date => $day_bookings ) : ?>
			<h2 style="margin-bottom:6px">
				<?php echo esc_html( date_i18n( 'l j F Y', strtotime( $date ) ) ); ?>
			</h2>
			<table class="widefat striped" style="margin-bottom:20px">
				<thead>
					<tr>
						<th style="width:110px"><?php esc_html_e( 'Time', 'palm-tree-bookings' ); ?></th>
						<th><?php esc_html_e( 'Experience', 'palm-tree-bookings' ); ?></th>
						<th><?php esc_html_e( 'Customer', 'palm-tree-bookings' ); ?></th>
						<th style="width:90px"><?php esc_html_e( 'Guests', 'palm-tree-bookings' ); ?></th>
						<th style="width:120px"><?php esc_html_e( 'Status', 'palm-tree-bookings' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php
					usort(
						$day_bookings,
						function ( $a, $b ) {
							return strcmp( ptb_get( $a->ID, 'slot_time' ), ptb_get( $b->ID, 'slot_time' ) );
						}
					);
					?>
					<?php foreach ( $day_bookings as $booking ) : ?>
						<?php
						$slot    = ptb_get( $booking->ID, 'slot_time' );
						$status  = ptb_get_status( $booking->ID );
						$guests  = max( 1, (int) ptb_get( $booking->ID, 'party_adults' ) ) + (int) ptb_get( $booking->ID, 'party_children' );
						?>
						<tr>
							<td><strong><?php echo esc_html( $slot ? ptb_format_time( $slot ) : __( 'Any time', 'palm-tree-bookings' ) ); ?></strong></td>
							<td><?php echo esc_html( ptb_display_value( 'experience', ptb_get( $booking->ID, 'experience' ) ) ); ?></td>
							<td>
								<a href="<?php echo esc_url( get_edit_post_link( $booking->ID ) ); ?>">
									<?php echo esc_html( ptb_get( $booking->ID, 'name' ) ); ?>
								</a>
							</td>
							<td><?php echo esc_html( $guests ); ?></td>
							<td>
								<span class="ptb-pill ptb-pill--<?php echo esc_attr( $status ); ?>">
									<?php echo esc_html( isset( $statuses[ $status ] ) ? $statuses[ $status ] : $status ); ?>
								</span>
							</td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		<?php endforeach; ?>
	</div>
	<style>
		.ptb-pill{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;background:#e5e7eb;color:#111}
		.ptb-pill--new{background:#dbeafe;color:#1e40af}
		.ptb-pill--contacted{background:#fef3c7;color:#92400e}
		.ptb-pill--confirmed{background:#d1fae5;color:#065f46}
		.ptb-pill--completed{background:#e5e7eb;color:#374151}
	</style>
	<?php
}
