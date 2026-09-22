<?php
/**
 * Per-experience pricing.
 *
 * The booking plugin ships a deliberately simple quote — one price multiplied
 * by the party size — and exposes a `ptb_quote` filter to replace it. This is
 * that replacement, and it lives in the theme so the plugin stays unforked and
 * never needs reinstalling.
 *
 * Everything a price depends on is a plain field on the experience itself, so
 * changing what a tour costs is editing one number on its edit screen. Nothing
 * here is hard-coded per tour.
 *
 * The model covers how these trips are actually sold:
 *
 * - **Per person.** An adult rate, and optionally a lower rate for children.
 *   This is how lessons and kayak tours price.
 * - **Flat rate.** A whole-boat price covering a set number of people, with a
 *   per-head charge beyond that. This is how charters price.
 * - **Time surcharge.** A per-booking addition on particular start times, which
 *   is how a sunset departure carries a premium.
 *
 * Amounts are entered in whole currency units because that is what a person
 * types. They are converted to minor units at the last moment, and all
 * arithmetic downstream is integer, so nothing rounds twice.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Pricing fields, merged into the experience detail box.
 *
 * @return array<string, array<string, string>>
 */
function ptb_price_fields() {
	return array(
		'price_adult'       => array(
			'label' => __( 'Price per adult', 'palm-tree-bookings' ),
			'type'  => 'number',
			'hint'  => __( 'Whole currency units, digits only. Example: 65. This is what the booking form charges per adult.', 'palm-tree-bookings' ),
		),
		'price_child'       => array(
			'label' => __( 'Price per child', 'palm-tree-bookings' ),
			'type'  => 'number',
			'hint'  => __( 'For guests under 12. Leave empty to charge them the adult rate.', 'palm-tree-bookings' ),
		),
		'price_flat'        => array(
			'label' => __( 'Flat rate for the whole booking', 'palm-tree-bookings' ),
			'type'  => 'number',
			'hint'  => __( 'For charters and private hire. When set, this replaces the per-person rates. Example: 650.', 'palm-tree-bookings' ),
		),
		'price_flat_guests' => array(
			'label' => __( 'People the flat rate covers', 'palm-tree-bookings' ),
			'type'  => 'number',
			'hint'  => __( 'Example: 4. Anyone beyond this is charged the extra-person rate below.', 'palm-tree-bookings' ),
		),
		'price_extra_person' => array(
			'label' => __( 'Extra person rate', 'palm-tree-bookings' ),
			'type'  => 'number',
			'hint'  => __( 'Charged per person beyond what the flat rate covers.', 'palm-tree-bookings' ),
		),
		'price_time_extra'  => array(
			'label' => __( 'Start time surcharges', 'palm-tree-bookings' ),
			'type'  => 'textarea',
			'hint'  => __( 'One per line as TIME | AMOUNT, for example 17:00 | 15. Added once per booking, not per person. Use it for a sunset departure.', 'palm-tree-bookings' ),
		),
	);
}

/**
 * A Pricing box on the experience edit screen.
 *
 * Its own box rather than an addition to the theme's, so pricing works the
 * same whether or not this theme is the active one.
 */
function ptb_price_meta_box() {
	add_meta_box(
		'ptb-pricing',
		__( 'Pricing', 'palm-tree-bookings' ),
		'ptb_price_meta_box_render',
		ptb_experience_post_type(),
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'ptb_price_meta_box' );

/**
 * Render the Pricing box.
 *
 * @param WP_Post $post Experience being edited.
 */
function ptb_price_meta_box_render( $post ) {
	wp_nonce_field( 'ptb_save_prices', 'ptb_prices_nonce' );

	if ( get_post_meta( $post->ID, '_pt_price_placeholder', true ) ) {
		printf(
			'<div class="notice notice-error inline"><p><strong>%s</strong> %s</p></div>',
			esc_html__( 'These prices are made up.', 'palm-tree-bookings' ),
			esc_html__( 'They were added so the booking and payment flow could be tested. Replace them with your real rates and save — this warning then disappears for this tour.', 'palm-tree-bookings' )
		);
	}

	echo '<p>' . esc_html__( 'Fill in either the per-person rates or the flat rate, not both. The flat rate wins if it is set.', 'palm-tree-bookings' ) . '</p>';
	echo '<table class="form-table" role="presentation">';

	foreach ( ptb_price_fields() as $key => $field ) {
		$value = get_post_meta( $post->ID, '_pt_' . $key, true );
		$id    = 'ptb-' . $key;

		echo '<tr><th scope="row"><label for="' . esc_attr( $id ) . '">' . esc_html( $field['label'] ) . '</label></th><td>';

		if ( 'textarea' === $field['type'] ) {
			printf(
				'<textarea id="%1$s" name="ptb_price[%2$s]" rows="3" class="large-text code">%3$s</textarea>',
				esc_attr( $id ),
				esc_attr( $key ),
				esc_textarea( (string) $value )
			);
		} else {
			printf(
				'<input id="%1$s" name="ptb_price[%2$s]" type="number" min="0" step="1" class="small-text" value="%3$s" />',
				esc_attr( $id ),
				esc_attr( $key ),
				esc_attr( (string) $value )
			);
		}

		if ( ! empty( $field['hint'] ) ) {
			echo '<p class="description">' . esc_html( $field['hint'] ) . '</p>';
		}

		echo '</td></tr>';
	}

	echo '</table>';
}

/**
 * Save the Pricing box.
 *
 * @param int     $post_id Post ID.
 * @param WP_Post $post    Post.
 */
function ptb_save_prices( $post_id, $post ) {
	if ( ptb_experience_post_type() !== $post->post_type ) {
		return;
	}

	if ( ! isset( $_POST['ptb_prices_nonce'] ) ) {
		return;
	}

	if ( ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['ptb_prices_nonce'] ) ), 'ptb_save_prices' ) ) {
		return;
	}

	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$submitted = isset( $_POST['ptb_price'] ) ? (array) wp_unslash( $_POST['ptb_price'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitized per field below.

	foreach ( ptb_price_fields() as $key => $field ) {
		if ( ! array_key_exists( $key, $submitted ) ) {
			continue;
		}

		$value = 'textarea' === $field['type']
			? sanitize_textarea_field( $submitted[ $key ] )
			: sanitize_text_field( $submitted[ $key ] );

		if ( '' === trim( $value ) ) {
			delete_post_meta( $post_id, '_pt_' . $key );
		} else {
			update_post_meta( $post_id, '_pt_' . $key, $value );
		}
	}

	// A person has set the prices, so they are no longer placeholders.
	delete_post_meta( $post_id, '_pt_price_placeholder' );
}
add_action( 'save_post', 'ptb_save_prices', 10, 2 );

/**
 * A pricing number off an experience, in whole currency units.
 *
 * Read raw rather than through pt_field(), which runs values through the
 * Spanish catalogue — harmless for a number, but pointless work on every call.
 *
 * @param int    $post_id Experience ID.
 * @param string $key     Field key without the `_pt_` prefix.
 * @return float
 */
function ptb_price_value( $post_id, $key ) {
	$raw = get_post_meta( $post_id, '_pt_' . $key, true );

	return '' === $raw ? 0.0 : (float) $raw;
}

/**
 * Surcharges keyed by start time.
 *
 * @param int $post_id Experience ID.
 * @return array<string, float>
 */
function ptb_price_time_extras( $post_id ) {
	$raw = (string) get_post_meta( $post_id, '_pt_price_time_extra', true );

	if ( '' === trim( $raw ) ) {
		return array();
	}

	$extras = array();

	foreach ( preg_split( '/\r\n|\r|\n/', $raw ) as $line ) {
		if ( false === strpos( $line, '|' ) ) {
			continue;
		}

		list( $time, $amount ) = array_map( 'trim', explode( '|', $line, 2 ) );

		if ( '' !== $time ) {
			$extras[ $time ] = (float) $amount;
		}
	}

	return $extras;
}

/**
 * Price a booking.
 *
 * @param int    $experience_id Experience being booked.
 * @param int    $adults        Adults, at least one.
 * @param int    $children      Children under 12.
 * @param string $start_time    Chosen start time, `HH:MM`, or ''.
 * @return array{total: int, lines: array<int, array{label: string, amount: int}>}
 *         Amounts in minor units.
 */
function ptb_price_quote( $experience_id, $adults, $children = 0, $start_time = '' ) {
	$experience_id = (int) $experience_id;
	$adults        = max( 1, (int) $adults );
	$children      = max( 0, (int) $children );
	$lines         = array();

	if ( ! $experience_id ) {
		return array(
			'total' => 0,
			'lines' => array(),
		);
	}

	$minor = static function ( $major ) {
		return (int) round( $major * 100 );
	};

	$flat = ptb_price_value( $experience_id, 'price_flat' );

	if ( $flat > 0 ) {
		$covers = (int) ptb_price_value( $experience_id, 'price_flat_guests' );
		$covers = $covers > 0 ? $covers : 1;
		$extra  = ptb_price_value( $experience_id, 'price_extra_person' );
		$party  = $adults + $children;

		$lines[] = array(
			/* translators: %d: number of guests the flat rate covers. */
			'label'  => sprintf( _n( 'Charter, up to %d guest', 'Charter, up to %d guests', $covers, 'palm-tree-bookings' ), $covers ),
			'amount' => $minor( $flat ),
		);

		if ( $party > $covers && $extra > 0 ) {
			$over = $party - $covers;

			$lines[] = array(
				/* translators: %d: number of additional guests. */
				'label'  => sprintf( _n( '%d extra guest', '%d extra guests', $over, 'palm-tree-bookings' ), $over ),
				'amount' => $minor( $extra ) * $over,
			);
		}
	} else {
		$adult_rate = ptb_price_value( $experience_id, 'price_adult' );

		// Fall back to the headline "from" price when no adult rate is set.
		if ( $adult_rate <= 0 ) {
			$adult_rate = ptb_price_value( $experience_id, 'price_from' );
		}

		$child_rate = ptb_price_value( $experience_id, 'price_child' );
		$child_rate = $child_rate > 0 ? $child_rate : $adult_rate;

		if ( $adult_rate > 0 ) {
			$lines[] = array(
				/* translators: %d: number of adults. */
				'label'  => sprintf( _n( '%d adult', '%d adults', $adults, 'palm-tree-bookings' ), $adults ),
				'amount' => $minor( $adult_rate ) * $adults,
			);
		}

		if ( $children > 0 && $child_rate > 0 ) {
			$lines[] = array(
				/* translators: %d: number of children. */
				'label'  => sprintf( _n( '%d child', '%d children', $children, 'palm-tree-bookings' ), $children ),
				'amount' => $minor( $child_rate ) * $children,
			);
		}
	}

	if ( $start_time ) {
		$extras = ptb_price_time_extras( $experience_id );

		if ( isset( $extras[ $start_time ] ) && $extras[ $start_time ] > 0 ) {
			$lines[] = array(
				/* translators: %s: start time, for example 17:00. */
				'label'  => sprintf( __( '%s departure', 'palm-tree-bookings' ), $start_time ),
				'amount' => $minor( $extras[ $start_time ] ),
			);
		}
	}

	$total = 0;

	foreach ( $lines as $line ) {
		$total += (int) $line['amount'];
	}

	return array(
		'total' => $total,
		'lines' => $lines,
	);
}

/**
 * Replace the plugin's quote with this one.
 *
 * Returning the plugin's own figure when nothing is priced keeps its behaviour
 * intact on an experience that has no rates entered.
 *
 * @param int $quote      Plugin's amount in minor units.
 * @param int $booking_id Booking ID.
 * @return int
 */
function ptb_filter_booking_quote( $quote, $booking_id ) {
	if ( ! function_exists( 'ptb_get' ) ) {
		return $quote;
	}

	$priced = ptb_price_quote(
		(int) ptb_get( $booking_id, 'experience' ),
		(int) ptb_get( $booking_id, 'party_adults' ),
		(int) ptb_get( $booking_id, 'party_children' ),
		(string) ptb_get( $booking_id, 'start_time' )
	);

	return $priced['total'] > 0 ? $priced['total'] : $quote;
}
add_filter( 'ptb_quote', 'ptb_filter_booking_quote', 10, 2 );

/**
 * Whether an experience has enough entered to quote a price at all.
 *
 * @param int $post_id Experience ID.
 * @return bool
 */
function ptb_has_price( $post_id ) {
	foreach ( array( 'price_adult', 'price_flat', 'price_from' ) as $key ) {
		if ( ptb_price_value( $post_id, $key ) > 0 ) {
			return true;
		}
	}

	return false;
}

/* -------------------------------------------------------------------------
 * Live quote endpoint, so the form can price before anything is submitted
 * ---------------------------------------------------------------------- */

/**
 * Register the quote route.
 */
function ptb_register_quote_route() {
	register_rest_route(
		'ptb/v1',
		'/quote',
		array(
			'methods'             => 'GET',
			'callback'            => 'ptb_quote_response',
			'permission_callback' => '__return_true', // Public, read-only, no personal data.
			'args'                => array(
				'experience' => array(
					'required'          => true,
					'sanitize_callback' => 'absint',
				),
				'adults'     => array( 'sanitize_callback' => 'absint' ),
				'children'   => array( 'sanitize_callback' => 'absint' ),
				'time'       => array( 'sanitize_callback' => 'sanitize_text_field' ),
			),
		)
	);
}
add_action( 'rest_api_init', 'ptb_register_quote_route' );

/**
 * Price a prospective booking for the form.
 *
 * Reads nothing and writes nothing: it takes a party size and returns what it
 * would cost, so it is safe to leave public.
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response
 */
function ptb_quote_response( $request ) {
	$experience = (int) $request->get_param( 'experience' );
	$post       = $experience ? get_post( $experience ) : null;

	if ( ! $post || ptb_experience_post_type() !== $post->post_type || 'publish' !== $post->post_status ) {
		return new WP_REST_Response(
			array(
				'priced' => false,
				'lines'  => array(),
			),
			200
		);
	}

	$quote = ptb_price_quote(
		$experience,
		(int) $request->get_param( 'adults' ),
		(int) $request->get_param( 'children' ),
		(string) $request->get_param( 'time' )
	);

	$format = function_exists( 'ptb_format_money' )
		? 'ptb_format_money'
		: static function ( $minor ) {
			return '$' . number_format_i18n( $minor / 100, 2 );
		};

	$lines = array();

	foreach ( $quote['lines'] as $line ) {
		$lines[] = array(
			'label'  => $line['label'],
			'amount' => call_user_func( $format, $line['amount'] ),
		);
	}

	return new WP_REST_Response(
		array(
			'priced'   => $quote['total'] > 0,
			'total'    => call_user_func( $format, $quote['total'] ),
			'lines'    => $lines,
			'deposit'  => ptb_quote_deposit_label( $quote['total'] ),
			'estimate' => __( 'Estimated total. We confirm the final price when we reply.', 'palm-tree-bookings' ),
		),
		200
	);
}

/**
 * A deposit line for the quote, when the plugin is set to take one.
 *
 * @param int $total Total in minor units.
 * @return string
 */
function ptb_quote_deposit_label( $total ) {
	if ( $total <= 0 || ! function_exists( 'ptb_setting' ) ) {
		return '';
	}

	$percent = (int) ptb_setting( 'deposit_percent' );

	if ( $percent <= 0 || $percent >= 100 ) {
		return '';
	}

	$deposit = (int) round( $total * $percent / 100 );
	$money   = function_exists( 'ptb_format_money' ) ? ptb_format_money( $deposit ) : '$' . number_format_i18n( $deposit / 100, 2 );

	return sprintf(
		/* translators: 1: deposit amount, 2: percentage. */
		__( '%1$s deposit (%2$d%%) to confirm', 'palm-tree-bookings' ),
		$money,
		$percent
	);
}

/* -------------------------------------------------------------------------
 * Placeholder rates
 * ---------------------------------------------------------------------- */

/**
 * Starter rates, so the booking flow can be seen working end to end.
 *
 * **These are made up.** They are shaped like real Tamarindo pricing so the
 * quote, the deposit and the Stripe checkout can be demonstrated, but not one
 * of them came from the client. Every experience carrying one is flagged, the
 * admin says so on the edit screen, and the flag clears the moment a real
 * number is saved.
 *
 * @return array<string, array<string, int>>
 */
function ptb_placeholder_rates() {
	return array(
		'surf-lesson-beginner'     => array( 'price_from' => 65, 'price_adult' => 65, 'price_child' => 55 ),
		'surf-lesson-intermediate' => array( 'price_from' => 75, 'price_adult' => 75, 'price_child' => 65 ),
		'private-surf-coaching'    => array( 'price_from' => 120, 'price_adult' => 120 ),
		'island-kayak-tour'        => array( 'price_from' => 55, 'price_adult' => 55, 'price_child' => 40 ),
		'mangrove-kayak-tour'      => array( 'price_from' => 60, 'price_adult' => 60, 'price_child' => 45 ),
		'estuary-wildlife-trip'    => array( 'price_from' => 70, 'price_adult' => 70, 'price_child' => 50 ),
		'turtle-tour'              => array( 'price_from' => 80, 'price_adult' => 80, 'price_child' => 60 ),
		'sunset-boat-tour'         => array( 'price_from' => 90, 'price_adult' => 90, 'price_child' => 65 ),
		'fishing-charter'          => array(
			'price_from'         => 650,
			'price_flat'         => 650,
			'price_flat_guests'  => 4,
			'price_extra_person' => 85,
		),
	);
}

/**
 * Put the placeholder rates on any experience that has no price at all.
 *
 * Never overwrites a figure that is already there, so running it again after
 * the client has priced their tours changes nothing.
 *
 * @return int How many experiences were given a placeholder.
 */
function ptb_seed_placeholder_rates() {
	$count = 0;

	foreach ( ptb_placeholder_rates() as $slug => $rates ) {
		$post = get_page_by_path( $slug, OBJECT, ptb_experience_post_type() );

		if ( ! $post || ptb_has_price( $post->ID ) ) {
			continue;
		}

		foreach ( $rates as $key => $value ) {
			update_post_meta( $post->ID, '_pt_' . $key, (string) $value );
		}

		if ( 'sunset-boat-tour' === $slug ) {
			// Shows how a departure-time surcharge is written.
			update_post_meta( $post->ID, '_pt_price_time_extra', "17:00 | 10" );
		}

		update_post_meta( $post->ID, '_pt_price_placeholder', '1' );
		++$count;
	}

	return $count;
}



/**
 * Experiences still carrying a made-up price.
 *
 * @return array<int, WP_Post>
 */
function ptb_placeholder_priced() {
	return get_posts(
		array(
			'post_type'      => ptb_experience_post_type(),
			'post_status'    => 'any',
			'posts_per_page' => -1,
			'meta_key'       => '_pt_price_placeholder', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_value'     => '1', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
		)
	);
}

/**
 * Say loudly, in the admin, that the prices on the site are invented.
 *
 * A wrong price on a live booking page is worse than a missing one, so this
 * is deliberately hard to miss and does not dismiss.
 */
function ptb_placeholder_price_notice() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}

	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;

	if ( $screen && ! in_array( $screen->base, array( 'dashboard', 'edit', 'post', 'toplevel_page_ptb-pricing' ), true ) ) {
		return;
	}

	$pending = ptb_placeholder_priced();

	if ( ! $pending ) {
		return;
	}

	$names = array();

	foreach ( $pending as $post ) {
		$names[] = $post->post_title;
	}

	printf(
		'<div class="notice notice-error"><p><strong>%1$s</strong> %2$s</p><p>%3$s</p></div>',
		esc_html__( 'These prices are made up.', 'palm-tree-bookings' ),
		esc_html(
			sprintf(
				/* translators: %s: comma-separated experience names. */
				__( 'Placeholder rates are live on: %s. They were added so the booking and payment flow could be tested, and none of them came from you.', 'palm-tree-bookings' ),
				implode( ', ', $names )
			)
		),
		esc_html__( 'Set your real rates before taking bookings. This warning clears itself for each tour as you save its prices.', 'palm-tree-bookings' )
	);
}
add_action( 'admin_notices', 'ptb_placeholder_price_notice' );

/**
 * Put the placeholder rates in once per plugin version.
 *
 * Runs on the first request after an upgrade so a site that already had the
 * booking plugin picks the rates up without anything being reinstalled.
 * ptb_seed_placeholder_rates() skips anything already priced, so this is safe
 * to run again and cannot overwrite a real figure.
 */
function ptb_maybe_seed_rates() {
	if ( get_option( 'ptb_rates_version' ) === PTB_VERSION ) {
		return;
	}

	// Record first, so a failure part-way cannot loop this on every request.
	update_option( 'ptb_rates_version', PTB_VERSION );

	ptb_seed_placeholder_rates();
}
add_action( 'init', 'ptb_maybe_seed_rates', 998 );
