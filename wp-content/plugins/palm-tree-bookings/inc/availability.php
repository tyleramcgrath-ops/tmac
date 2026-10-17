<?php
/**
 * Availability: schedules, slots and capacity.
 *
 * Each experience carries a weekly schedule of start times, a capacity per
 * slot, a season window, blackout dates and a lead time. Bookings consume
 * capacity, so a slot stops being offered once it fills.
 *
 * Schedule data lives on the EXPERIENCE post, not here, because it belongs to
 * the excursion. The plugin owns the behaviour; the theme owns the excursion.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * The post type holding experiences.
 *
 * @return string
 */
function ptb_experience_post_type() {
	return (string) apply_filters( 'ptb_experience_post_type', 'experience' );
}

/**
 * Booking statuses that consume capacity.
 *
 * Cancelled bookings release their seats; everything else holds them.
 *
 * @return array<int, string>
 */
function ptb_blocking_statuses() {
	return (array) apply_filters( 'ptb_blocking_statuses', array( 'new', 'contacted', 'confirmed', 'completed' ) );
}

/**
 * Schedule fields stored on an experience.
 *
 * @return array<string, array<string, mixed>>
 */
function ptb_schedule_fields() {
	return array(
		'sched_days'      => array(
			'label'   => __( 'Days it runs', 'palm-tree-bookings' ),
			'type'    => 'days',
			'default' => '0,1,2,3,4,5,6',
		),
		'sched_times'     => array(
			'label'   => __( 'Start times', 'palm-tree-bookings' ),
			'type'    => 'textarea',
			'hint'    => __( 'One per line, 24-hour, e.g. 07:00. Leave empty for a full-day excursion with no set time.', 'palm-tree-bookings' ),
			'default' => "07:00\n09:30\n14:00",
		),
		'sched_capacity'  => array(
			'label'   => __( 'Guests per slot', 'palm-tree-bookings' ),
			'type'    => 'number',
			'hint'    => __( 'How many people you can take at one start time.', 'palm-tree-bookings' ),
			'default' => '8',
		),
		'sched_lead'      => array(
			'label'   => __( 'Minimum notice (hours)', 'palm-tree-bookings' ),
			'type'    => 'number',
			'hint'    => __( 'Slots closer than this are not offered.', 'palm-tree-bookings' ),
			'default' => '12',
		),
		'sched_window'    => array(
			'label'   => __( 'Bookable how far ahead (days)', 'palm-tree-bookings' ),
			'type'    => 'number',
			'default' => '365',
		),
		'sched_season'    => array(
			'label' => __( 'Season', 'palm-tree-bookings' ),
			'type'  => 'season',
			'hint'  => __( 'Leave empty to run year round.', 'palm-tree-bookings' ),
		),
		'sched_blackout'  => array(
			'label' => __( 'Blackout dates', 'palm-tree-bookings' ),
			'type'  => 'textarea',
			'hint'  => __( 'One per line as YYYY-MM-DD. Closures, holidays, maintenance.', 'palm-tree-bookings' ),
		),
	);
}

/**
 * Read a schedule value from an experience.
 *
 * @param int    $experience_id Experience ID.
 * @param string $key           Field key.
 * @return string
 */
function ptb_schedule_value( $experience_id, $key ) {
	$stored = get_post_meta( $experience_id, '_ptb_' . $key, true );

	if ( '' !== $stored && null !== $stored ) {
		return (string) $stored;
	}

	$fields = ptb_schedule_fields();

	return isset( $fields[ $key ]['default'] ) ? (string) $fields[ $key ]['default'] : '';
}

/**
 * The normalised schedule for an experience.
 *
 * @param int $experience_id Experience ID.
 * @return array<string, mixed>
 */
function ptb_schedule( $experience_id ) {
	$times = array_values(
		array_filter(
			array_map( 'trim', explode( "\n", ptb_schedule_value( $experience_id, 'sched_times' ) ) ),
			function ( $time ) {
				return (bool) preg_match( '/^\d{2}:\d{2}$/', $time );
			}
		)
	);

	sort( $times );

	$days = array_values(
		array_filter(
			array_map( 'absint', explode( ',', ptb_schedule_value( $experience_id, 'sched_days' ) ) ),
			function ( $day ) {
				return $day >= 0 && $day <= 6;
			}
		)
	);

	$blackout = array_values(
		array_filter(
			array_map( 'trim', explode( "\n", ptb_schedule_value( $experience_id, 'sched_blackout' ) ) ),
			function ( $date ) {
				return (bool) preg_match( '/^\d{4}-\d{2}-\d{2}$/', $date );
			}
		)
	);

	return array(
		'days'         => $days ? $days : range( 0, 6 ),
		'times'        => $times,
		'capacity'     => max( 1, (int) ptb_schedule_value( $experience_id, 'sched_capacity' ) ),
		'lead_hours'   => max( 0, (int) ptb_schedule_value( $experience_id, 'sched_lead' ) ),
		'window_days'  => max( 1, (int) ptb_schedule_value( $experience_id, 'sched_window' ) ),
		'season_start' => ptb_schedule_value( $experience_id, 'sched_season_start' ),
		'season_end'   => ptb_schedule_value( $experience_id, 'sched_season_end' ),
		'blackout'     => $blackout,
	);
}

/**
 * Whether an experience runs at all on a given date.
 *
 * Ignores capacity; this is the calendar question only.
 *
 * @param int    $experience_id Experience ID.
 * @param string $date          Date as YYYY-MM-DD.
 * @return bool
 */
function ptb_runs_on_date( $experience_id, $date ) {
	if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $date ) ) {
		return false;
	}

	$schedule = ptb_schedule( $experience_id );
	$today    = current_time( 'Y-m-d' );

	if ( $date < $today ) {
		return false;
	}

	$horizon = gmdate( 'Y-m-d', strtotime( $today . ' +' . $schedule['window_days'] . ' days' ) );
	if ( $date > $horizon ) {
		return false;
	}

	if ( in_array( $date, $schedule['blackout'], true ) ) {
		return false;
	}

	$weekday = (int) gmdate( 'w', strtotime( $date ) );
	if ( ! in_array( $weekday, $schedule['days'], true ) ) {
		return false;
	}

	// Season window, compared on month-day so it works year to year.
	if ( $schedule['season_start'] && $schedule['season_end'] ) {
		$md    = gmdate( 'm-d', strtotime( $date ) );
		$start = $schedule['season_start'];
		$end   = $schedule['season_end'];

		if ( $start <= $end ) {
			if ( $md < $start || $md > $end ) {
				return false;
			}
		} elseif ( $md < $start && $md > $end ) {
			// Season wraps the new year.
			return false;
		}
	}

	return true;
}

/**
 * How many guests are already booked into a slot.
 *
 * @param int    $experience_id Experience ID.
 * @param string $date          Date as YYYY-MM-DD.
 * @param string $time          Time as HH:MM, or '' for an unslotted day.
 * @return int
 */
function ptb_booked_guests( $experience_id, $date, $time = '' ) {
	$meta_query = array(
		'relation' => 'AND',
		array(
			'key'   => '_ptb_experience',
			'value' => (string) $experience_id,
		),
		array(
			'key'   => '_ptb_date_primary',
			'value' => $date,
		),
	);

	if ( '' !== $time ) {
		$meta_query[] = array(
			'key'   => '_ptb_slot_time',
			'value' => $time,
		);
	}

	$bookings = get_posts(
		array(
			'post_type'      => PTB_POST_TYPE,
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'post_status'    => 'publish',
			'no_found_rows'  => true,
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Bounded by date; the set is small.
			'meta_query'     => $meta_query,
		)
	);

	$blocking = ptb_blocking_statuses();
	$guests   = 0;

	foreach ( $bookings as $booking_id ) {
		if ( ! in_array( ptb_get_status( $booking_id ), $blocking, true ) ) {
			continue;
		}

		$guests += max( 1, (int) ptb_get( $booking_id, 'party_adults' ) ) + (int) ptb_get( $booking_id, 'party_children' );
	}

	return $guests;
}

/**
 * Bookable slots for an experience on a date.
 *
 * @param int    $experience_id Experience ID.
 * @param string $date          Date as YYYY-MM-DD.
 * @return array<int, array{time: string, label: string, capacity: int, booked: int, remaining: int}>
 */
function ptb_slots_for_date( $experience_id, $date ) {
	if ( ! ptb_runs_on_date( $experience_id, $date ) ) {
		return array();
	}

	$schedule = ptb_schedule( $experience_id );
	$times    = $schedule['times'] ? $schedule['times'] : array( '' );
	$slots    = array();
	$cutoff   = strtotime( current_time( 'mysql' ) ) + ( $schedule['lead_hours'] * HOUR_IN_SECONDS );

	foreach ( $times as $time ) {
		// Respect the minimum notice.
		$slot_at = strtotime( $date . ' ' . ( $time ? $time : '23:59' ) );
		if ( $slot_at < $cutoff ) {
			continue;
		}

		$booked    = ptb_booked_guests( $experience_id, $date, $time );
		$remaining = max( 0, $schedule['capacity'] - $booked );

		$slots[] = array(
			'time'      => $time,
			'label'     => $time ? ptb_format_time( $time ) : __( 'Any time', 'palm-tree-bookings' ),
			'capacity'  => $schedule['capacity'],
			'booked'    => $booked,
			'remaining' => $remaining,
		);
	}

	return $slots;
}

/**
 * Format a 24-hour time for display in the site's locale.
 *
 * @param string $time Time as HH:MM.
 * @return string
 */
function ptb_format_time( $time ) {
	$timestamp = strtotime( '2000-01-01 ' . $time );

	return $timestamp ? date_i18n( get_option( 'time_format', 'g:i a' ), $timestamp ) : $time;
}

/**
 * Whether a party can still be taken on a slot.
 *
 * @param int    $experience_id Experience ID.
 * @param string $date          Date as YYYY-MM-DD.
 * @param string $time          Time as HH:MM.
 * @param int    $party         Party size.
 * @return bool
 */
function ptb_slot_has_room( $experience_id, $date, $time, $party ) {
	foreach ( ptb_slots_for_date( $experience_id, $date ) as $slot ) {
		if ( $slot['time'] === $time ) {
			return $slot['remaining'] >= max( 1, (int) $party );
		}
	}

	return false;
}

/**
 * Dates with at least one open slot, from a start date forward.
 *
 * Powers the date picker, so it never offers a day that cannot be booked.
 *
 * @param int    $experience_id Experience ID.
 * @param string $from          Start date as YYYY-MM-DD.
 * @param int    $days          How many days to scan.
 * @return array<int, string>
 */
function ptb_open_dates( $experience_id, $from = '', $days = 60 ) {
	$from  = $from ? $from : current_time( 'Y-m-d' );
	$open  = array();
	$start = strtotime( $from );

	for ( $i = 0; $i < $days; $i++ ) {
		$date = gmdate( 'Y-m-d', strtotime( '+' . $i . ' days', $start ) );

		foreach ( ptb_slots_for_date( $experience_id, $date ) as $slot ) {
			if ( $slot['remaining'] > 0 ) {
				$open[] = $date;
				break;
			}
		}
	}

	return $open;
}

/* -------------------------------------------------------------------------
 * REST: powers the front-end date and time picker
 * ---------------------------------------------------------------------- */

/**
 * Register the availability endpoint.
 */
function ptb_register_availability_route() {
	register_rest_route(
		'ptb/v1',
		'/availability',
		array(
			'methods'             => 'GET',
			'callback'            => 'ptb_availability_response',
			'permission_callback' => '__return_true', // Public, read-only, no personal data.
			'args'                => array(
				'experience' => array(
					'required'          => true,
					'sanitize_callback' => 'absint',
				),
				'date'       => array(
					'sanitize_callback' => 'sanitize_text_field',
				),
				'days'       => array(
					'sanitize_callback' => 'absint',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'ptb_register_availability_route' );

/**
 * Availability for an experience: open dates, or slots on one date.
 *
 * Returns only counts, never customer data.
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response|WP_Error
 */
function ptb_availability_response( $request ) {
	$experience_id = (int) $request->get_param( 'experience' );

	if ( ! $experience_id || get_post_type( $experience_id ) !== ptb_experience_post_type() ) {
		return new WP_Error( 'ptb_bad_experience', __( 'Unknown experience.', 'palm-tree-bookings' ), array( 'status' => 404 ) );
	}

	$date = (string) $request->get_param( 'date' );

	if ( $date ) {
		$slots = array();

		foreach ( ptb_slots_for_date( $experience_id, $date ) as $slot ) {
			$slots[] = array(
				'time'      => $slot['time'],
				'label'     => $slot['label'],
				'remaining' => $slot['remaining'],
				'full'      => 0 === $slot['remaining'],
			);
		}

		return new WP_REST_Response(
			array(
				'date'  => $date,
				'slots' => $slots,
			),
			200
		);
	}

	$days = (int) $request->get_param( 'days' );

	return new WP_REST_Response(
		array(
			'open_dates' => ptb_open_dates( $experience_id, '', $days ? min( 120, $days ) : 60 ),
		),
		200
	);
}
