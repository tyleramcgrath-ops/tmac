<?php
/**
 * Trip options: the ways one experience can be booked.
 *
 * A fishing charter is not one price. It is a full day at one rate, a
 * three-quarter day at another and a half day at a third, and the half day
 * feeds you a sandwich where the full day feeds you lunch. Pricing an
 * experience with a single adult rate cannot say any of that, and a customer
 * who cannot see what separates the tiers has to ask before they can book.
 *
 * So an experience may carry a list of options. Each one is a name, a price,
 * whether that price is per person or for the whole boat, how many it takes,
 * how long it runs, and what is included. A tour with no options priced the
 * plain per-person way is unaffected — most of them are.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Where options are stored.
 */
const PTB_OPTIONS_META = '_pt_price_options';

/**
 * The columns one option carries.
 *
 * @return array<string, array<string, mixed>>
 */
function ptb_option_fields() {
	return array(
		'label'    => array(
			'label' => __( 'Option', 'palm-tree-bookings' ),
			'type'  => 'text',
			'hint'  => __( 'What the customer picks. Example: Full day', 'palm-tree-bookings' ),
		),
		'price'    => array(
			'label' => __( 'Price', 'palm-tree-bookings' ),
			'type'  => 'number',
			'hint'  => __( 'Whole numbers, digits only.', 'palm-tree-bookings' ),
		),
		'mode'     => array(
			'label' => __( 'Charged', 'palm-tree-bookings' ),
			'type'  => 'mode',
			'hint'  => __( 'Per person multiplies by the party size. For the whole trip is one price however many come.', 'palm-tree-bookings' ),
		),
		'max'      => array(
			'label' => __( 'Max guests', 'palm-tree-bookings' ),
			'type'  => 'number',
			'hint'  => __( 'Leave empty for no limit.', 'palm-tree-bookings' ),
		),
		'duration' => array(
			'label' => __( 'Duration', 'palm-tree-bookings' ),
			'type'  => 'text',
			'hint'  => __( 'Example: 5 hours', 'palm-tree-bookings' ),
		),
		'includes' => array(
			'label' => __( 'What is included', 'palm-tree-bookings' ),
			'type'  => 'textarea',
			'hint'  => __( 'One per line. Shown to the customer under this option.', 'palm-tree-bookings' ),
		),
	);
}

/**
 * The two ways an option's price can be read.
 *
 * @return array<string, string>
 */
function ptb_option_modes() {
	return array(
		'person' => __( 'Per person', 'palm-tree-bookings' ),
		'flat'   => __( 'For the whole trip', 'palm-tree-bookings' ),
	);
}

/**
 * An experience's options.
 *
 * Stored as JSON rather than a serialised array so the value stays readable in
 * the database and survives being moved between installs by hand.
 *
 * @param int $post_id Experience ID.
 * @return array<int, array<string, string>>
 */
function ptb_options( $post_id ) {
	$raw = get_post_meta( $post_id, PTB_OPTIONS_META, true );

	if ( '' === $raw || ! is_string( $raw ) ) {
		return array();
	}

	$decoded = json_decode( $raw, true );

	if ( ! is_array( $decoded ) ) {
		return array();
	}

	$options = array();

	foreach ( $decoded as $row ) {
		if ( ! is_array( $row ) ) {
			continue;
		}

		$option = ptb_normalise_option( $row );

		// A nameless or free option is a half-filled row, not a choice.
		if ( '' !== $option['label'] ) {
			$options[] = $option;
		}
	}

	return $options;
}

/**
 * Fill in an option's missing keys and clean the ones present.
 *
 * @param array<string, mixed> $row Raw row.
 * @return array<string, string>
 */
function ptb_normalise_option( $row ) {
	$modes = ptb_option_modes();

	$mode = isset( $row['mode'] ) ? (string) $row['mode'] : 'person';

	return array(
		'label'    => isset( $row['label'] ) ? sanitize_text_field( (string) $row['label'] ) : '',
		'price'    => isset( $row['price'] ) ? (string) max( 0, (int) $row['price'] ) : '0',
		'mode'     => isset( $modes[ $mode ] ) ? $mode : 'person',
		'max'      => isset( $row['max'] ) && '' !== $row['max'] ? (string) max( 0, (int) $row['max'] ) : '',
		'duration' => isset( $row['duration'] ) ? sanitize_text_field( (string) $row['duration'] ) : '',
		'includes' => isset( $row['includes'] ) ? sanitize_textarea_field( (string) $row['includes'] ) : '',
	);
}

/**
 * Save an experience's options.
 *
 * @param int                               $post_id Experience ID.
 * @param array<int, array<string, mixed>>  $rows    Rows as submitted.
 */
function ptb_save_options( $post_id, $rows ) {
	$clean = array();

	foreach ( (array) $rows as $row ) {
		if ( ! is_array( $row ) ) {
			continue;
		}

		$option = ptb_normalise_option( $row );

		if ( '' === $option['label'] ) {
			continue;
		}

		$clean[] = $option;
	}

	if ( ! $clean ) {
		delete_post_meta( $post_id, PTB_OPTIONS_META );

		return;
	}

	/*
	 * wp_slash() before storing, because update_post_meta() unslashes what it
	 * is given. JSON writes a newline as the two characters \ and n, so
	 * without this the unslash eats the backslash and every inclusion list
	 * comes back as "LunchnFruit and waternBeers" — one run-on line instead of
	 * three bullets. The same goes for any apostrophe an operator types.
	 */
	update_post_meta(
		$post_id,
		PTB_OPTIONS_META,
		wp_slash( wp_json_encode( $clean, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) )
	);
}

/**
 * One option by its index, or null.
 *
 * @param int $post_id Experience ID.
 * @param int $index   Zero-based index.
 * @return array<string, string>|null
 */
function ptb_option_at( $post_id, $index ) {
	$options = ptb_options( $post_id );

	return isset( $options[ $index ] ) ? $options[ $index ] : null;
}

/**
 * What one option costs for a given party, in minor units.
 *
 * @param array<string, string> $option Option.
 * @param int                   $guests Party size.
 * @return int
 */
function ptb_option_total( $option, $guests ) {
	$price  = (float) $option['price'];
	$guests = max( 1, (int) $guests );

	$total = ( 'flat' === $option['mode'] ) ? $price : $price * $guests;

	return (int) round( $total * 100 );
}

/**
 * The cheapest an experience can be booked for, in whole units.
 *
 * A per-person option is compared on its per-head rate and a whole-trip option
 * on its total, because that is the number each one advertises.
 *
 * @param int $post_id Experience ID.
 * @return float 0.0 when the experience has no options.
 */
function ptb_options_from_price( $post_id ) {
	$lowest = 0.0;

	foreach ( ptb_options( $post_id ) as $option ) {
		$price = (float) $option['price'];

		if ( $price <= 0 ) {
			continue;
		}

		if ( 0.0 === $lowest || $price < $lowest ) {
			$lowest = $price;
		}
	}

	return $lowest;
}

/**
 * An option's inclusions as a list.
 *
 * @param array<string, string> $option Option.
 * @return array<int, string>
 */
function ptb_option_includes( $option ) {
	if ( '' === trim( $option['includes'] ) ) {
		return array();
	}

	$lines = preg_split( '/\r\n|\r|\n/', $option['includes'] );

	return array_values( array_filter( array_map( 'trim', (array) $lines ) ) );
}

/* -------------------------------------------------------------------------
 * The booking form needs the options for whichever tour is chosen
 * ---------------------------------------------------------------------- */

/**
 * Register the options route.
 */
function ptb_register_options_route() {
	register_rest_route(
		'ptb/v1',
		'/options',
		array(
			'methods'             => 'GET',
			'callback'            => 'ptb_options_response',
			'permission_callback' => '__return_true',
			'args'                => array(
				'experience' => array(
					'required'          => true,
					'sanitize_callback' => 'absint',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'ptb_register_options_route' );

/**
 * The options for one experience, as the form needs them.
 *
 * Prices come back formatted rather than raw so the label a customer reads is
 * built server-side, like every other price in this plugin.
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response
 */
function ptb_options_response( $request ) {
	$experience = (int) $request->get_param( 'experience' );
	$post       = $experience ? get_post( $experience ) : null;

	if ( ! $post || ptb_experience_post_type() !== $post->post_type || 'publish' !== $post->post_status ) {
		return new WP_REST_Response( array( 'options' => array() ), 200 );
	}

	$format = function_exists( 'ptb_format_money' )
		? 'ptb_format_money'
		: static function ( $minor ) {
			return '$' . number_format_i18n( $minor / 100, 2 );
		};

	$out = array();

	foreach ( ptb_options( $experience ) as $index => $option ) {
		$price = call_user_func( $format, (int) round( (float) $option['price'] * 100 ) );

		$out[] = array(
			'index'    => $index,
			'label'    => $option['label'],
			'price'    => $price,
			'mode'     => $option['mode'],
			'max'      => $option['max'],
			'duration' => $option['duration'],
			'summary'  => ( 'flat' === $option['mode'] )
				? sprintf(
					/* translators: 1: option name, 2: price. */
					__( '%1$s — %2$s for the trip', 'palm-tree-bookings' ),
					$option['label'],
					$price
				)
				: sprintf(
					/* translators: 1: option name, 2: price. */
					__( '%1$s — %2$s per person', 'palm-tree-bookings' ),
					$option['label'],
					$price
				),
		);
	}

	return new WP_REST_Response( array( 'options' => $out ), 200 );
}
