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
function ptb_price_quote( $experience_id, $adults, $children = 0, $start_time = '', $option_index = null ) {
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

	/*
	 * An option, when the tour has them, replaces the rate card rather than
	 * adding to it: a half-day charter is not the full day with something
	 * taken off, it is its own price.
	 */
	$option = ptb_quote_option( $experience_id, $option_index );

	if ( $option ) {
		$party = $adults + $children;

		$lines[] = array(
			'label'  => ( 'flat' === $option['mode'] )
				? $option['label']
				: sprintf(
					/* translators: 1: option name, 2: number of guests. */
					_n( '%1$s — %2$d guest', '%1$s — %2$d guests', $party, 'palm-tree-bookings' ),
					$option['label'],
					$party
				),
			'amount' => ptb_option_total( $option, $party ),
		);

		return ptb_quote_with_time( $experience_id, $lines, $start_time, $minor );
	}

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

	return ptb_quote_with_time( $experience_id, $lines, $start_time, $minor );
}

/**
 * The option a quote should be priced at, if any.
 *
 * With options set but none chosen the first is used, because that is what the
 * booking form shows selected — a quote must match the row the customer is
 * looking at.
 *
 * @param int      $experience_id Experience ID.
 * @param int|null $index         Chosen index, or null.
 * @return array<string, string>|null
 */
function ptb_quote_option( $experience_id, $index ) {
	if ( ! function_exists( 'ptb_options' ) ) {
		return null;
	}

	$options = ptb_options( $experience_id );

	if ( ! $options ) {
		return null;
	}

	if ( null !== $index && isset( $options[ (int) $index ] ) ) {
		return $options[ (int) $index ];
	}

	return $options[0];
}

/**
 * Add any start-time surcharge and total the lines.
 *
 * Shared so an option-priced quote and a rate-card quote treat a sunset
 * departure the same way.
 *
 * @param int                                              $experience_id Experience ID.
 * @param array<int, array{label: string, amount: int}>    $lines         Lines so far.
 * @param string                                           $start_time    Chosen start time.
 * @param callable                                         $minor         Major to minor units.
 * @return array{total: int, lines: array<int, array{label: string, amount: int}>}
 */
function ptb_quote_with_time( $experience_id, $lines, $start_time, $minor ) {
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

	$chosen = ptb_get( $booking_id, 'trip_option' );

	$priced = ptb_price_quote(
		(int) ptb_get( $booking_id, 'experience' ),
		(int) ptb_get( $booking_id, 'party_adults' ),
		(int) ptb_get( $booking_id, 'party_children' ),
		(string) ptb_get( $booking_id, 'start_time' ),
		( '' === $chosen || null === $chosen ) ? null : (int) $chosen
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
	if ( function_exists( 'ptb_options_from_price' ) && ptb_options_from_price( $post_id ) > 0 ) {
		return true;
	}

	foreach ( array( 'price_adult', 'price_flat', 'price_from' ) as $key ) {
		if ( ptb_price_value( $post_id, $key ) > 0 ) {
			return true;
		}
	}

	return false;
}

/**
 * The headline "from" figure for an experience.
 *
 * The site shows a from-price in seven places — the booking sidebar, the cards,
 * the schema markup, the assistant. Those used to read a price_from field that
 * was stored separately from the rates the booking is actually quoted at, so
 * changing a price on the Pricing screen left the advertised figure stale and a
 * customer could be shown one number and charged another.
 *
 * So it is derived here instead: the cheapest per-head rate a booking could
 * start at, or the flat rate for a charter. price_from remains only as the
 * fallback for a site running the theme without this plugin.
 *
 * @param int $post_id Experience ID.
 * @return float The headline rate, or 0.0 when none is set.
 */
function ptb_price_from( $post_id ) {
	// An optioned tour advertises its cheapest option, which is the number a
	// customer comparing tours is being quoted.
	if ( function_exists( 'ptb_options_from_price' ) ) {
		$lowest = ptb_options_from_price( $post_id );

		if ( $lowest > 0 ) {
			return $lowest;
		}
	}

	$flat = ptb_price_value( $post_id, 'price_flat' );

	// A flat rate wins over the per-person rates wherever it is set, and the
	// whole-booking figure is what the customer is quoted.
	if ( $flat > 0 ) {
		return $flat;
	}

	$adult = ptb_price_value( $post_id, 'price_adult' );

	if ( $adult > 0 ) {
		return $adult;
	}

	// Nothing priced through this plugin, so leave whatever the theme holds.
	return ptb_price_value( $post_id, 'price_from' );
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
				'option'     => array( 'sanitize_callback' => 'sanitize_text_field' ),
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

	$chosen = $request->get_param( 'option' );

	$quote = ptb_price_quote(
		$experience,
		(int) $request->get_param( 'adults' ),
		(int) $request->get_param( 'children' ),
		(string) $request->get_param( 'time' ),
		( null === $chosen || '' === $chosen ) ? null : (int) $chosen
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
 * The operator's rates, as they gave them.
 *
 * These are real prices, not invented ones — which is the whole difference
 * from the figures that used to sit here. Nothing writes a made-up-price flag
 * any more, and the migration below clears the flags the old numbers left
 * behind, because a warning that cries wolf about correct prices is worse than
 * no warning at all.
 *
 * They are a starting point, not a fixture: every one of them is editable
 * under Pricing, and this never overwrites a figure already set.
 *
 * @return array<string, array<string, mixed>>
 */
function ptb_operator_rates() {
	return array(
		// Two hours, whoever comes. The rate is what changes with party size.
		'private-surf-lesson'      => array( 'price_from' => 85, 'price_adult' => 85, 'price_child' => 85 ),
		'semi-private-surf-lesson' => array( 'price_from' => 65, 'price_adult' => 65, 'price_child' => 65 ),
		'group-surf-lesson'        => array( 'price_from' => 55, 'price_adult' => 55, 'price_child' => 55 ),

		// Children are charged a lower rate only on the catamaran.
		'catamaran-tour'           => array( 'price_from' => 85, 'price_adult' => 85, 'price_child' => 55 ),

		// Kids pay the adult rate on the kayak tours and the safari boat.
		'island-kayak-tour'        => array( 'price_from' => 75, 'price_adult' => 75, 'price_child' => 75 ),
		'mangrove-kayak-tour'      => array( 'price_from' => 75, 'price_adult' => 75, 'price_child' => 75 ),
		'safari-boat'              => array( 'price_from' => 55, 'price_adult' => 55, 'price_child' => 55 ),
		'turtle-tour'              => array( 'price_from' => 65, 'price_adult' => 65, 'price_child' => 65 ),

		/*
		 * Priced by trip length rather than head count, so the rate card cannot
		 * express it and the options below do instead.
		 */
		'fishing-charter'          => array( 'price_from' => 800 ),
	);
}

/**
 * The tours sold more than one way, and how.
 *
 * @return array<string, array<int, array<string, mixed>>>
 */
function ptb_operator_options() {
	return array(
		'fishing-charter' => array(
			array(
				'label'    => __( 'Full day', 'palm-tree-bookings' ),
				'price'    => 1300,
				'mode'     => 'flat',
				'max'      => 5,
				'duration' => __( 'Full day', 'palm-tree-bookings' ),
				'includes' => implode(
					"\n",
					array(
						__( 'Lunch', 'palm-tree-bookings' ),
						__( 'Fruit and water', 'palm-tree-bookings' ),
						__( 'Beers', 'palm-tree-bookings' ),
					)
				),
			),
			array(
				'label'    => __( 'Three-quarter day', 'palm-tree-bookings' ),
				'price'    => 1000,
				'mode'     => 'flat',
				'max'      => 5,
				'duration' => __( 'Three-quarter day', 'palm-tree-bookings' ),
				'includes' => implode(
					"\n",
					array(
						__( 'Lunch', 'palm-tree-bookings' ),
						__( 'Fruit and water', 'palm-tree-bookings' ),
						__( 'Beers', 'palm-tree-bookings' ),
					)
				),
			),
			array(
				'label'    => __( 'Half day', 'palm-tree-bookings' ),
				'price'    => 800,
				'mode'     => 'flat',
				'max'      => 5,
				'duration' => __( 'Half day', 'palm-tree-bookings' ),
				'includes' => implode(
					"\n",
					array(
						__( 'A sandwich', 'palm-tree-bookings' ),
						__( 'Fruit and water', 'palm-tree-bookings' ),
						__( 'Beers', 'palm-tree-bookings' ),
					)
				),
			),
		),
	);
}

/**
 * Put the operator's rates and options onto their tours.
 *
 * Never overwrites a price that is already set, so once they have edited
 * something in Pricing this leaves it alone.
 *
 * @return int How many experiences were priced.
 */
function ptb_seed_operator_rates() {
	$count = 0;

	foreach ( ptb_operator_rates() as $slug => $rates ) {
		$post = get_page_by_path( $slug, OBJECT, ptb_experience_post_type() );

		if ( ! $post ) {
			continue;
		}

		/*
		 * A price left over from the placeholder era is not something to
		 * protect — it was never theirs. A price they have set since is.
		 */
		$placeholder = (bool) get_post_meta( $post->ID, '_pt_price_placeholder', true );

		if ( ptb_has_price( $post->ID ) && ! $placeholder ) {
			continue;
		}

		foreach ( $rates as $key => $value ) {
			update_post_meta( $post->ID, '_pt_' . $key, (string) $value );
		}

		delete_post_meta( $post->ID, '_pt_price_placeholder' );
		++$count;
	}

	foreach ( ptb_operator_options() as $slug => $options ) {
		$post = get_page_by_path( $slug, OBJECT, ptb_experience_post_type() );

		if ( ! $post || ! function_exists( 'ptb_save_options' ) ) {
			continue;
		}

		// Only when they have not built their own set.
		if ( ptb_options( $post->ID ) ) {
			continue;
		}

		ptb_save_options( $post->ID, $options );

		/*
		 * The charter used to be a flat 650 for 4 with an extra-person rate.
		 * Leaving those behind would quote the old price alongside the new
		 * options.
		 */
		foreach ( array( 'price_flat', 'price_flat_guests', 'price_extra_person', 'price_adult', 'price_child' ) as $key ) {
			delete_post_meta( $post->ID, '_pt_' . $key );
		}

		++$count;
	}

	/*
	 * The sunset surcharge was an illustration on a tour that no longer exists
	 * under that name, and the catamaran it became is one price all day.
	 */
	$catamaran = get_page_by_path( 'catamaran-tour', OBJECT, ptb_experience_post_type() );

	if ( $catamaran ) {
		$extras = get_post_meta( $catamaran->ID, '_pt_price_time_extra', true );

		if ( '17:00 | 10' === trim( (string) $extras ) ) {
			delete_post_meta( $catamaran->ID, '_pt_price_time_extra' );
		}
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
 * Put the operator's rates in once per plugin version.
 *
 * Runs on the first request after an upgrade so a site that already had the
 * booking plugin picks the rates up without anything being reinstalled.
 * ptb_seed_operator_rates() skips anything they have priced themselves, so
 * this is safe to run again and cannot overwrite their figure.
 *
 * Priority 999 so it lands after the theme's content backfill at 996, which is
 * what renames the tours: these rates are keyed by the new slugs and would
 * find nothing if they ran first.
 */
function ptb_maybe_seed_rates() {
	if ( get_option( 'ptb_rates_version' ) === PTB_VERSION ) {
		return;
	}

	// Record first, so a failure part-way cannot loop this on every request.
	update_option( 'ptb_rates_version', PTB_VERSION );

	ptb_seed_operator_rates();
}
add_action( 'init', 'ptb_maybe_seed_rates', 999 );
