<?php
/**
 * Program booking for WooCommerce.
 *
 * Each program is a simple WooCommerce product with a rate table such as
 *
 *     1=367
 *     2=734
 *     4=1469
 *     +=326
 *
 * Keys are units (weeks, days or lessons); "+" is the price of each unit past
 * the last listed tier. Without "+", students can only pick the listed tiers.
 * Students choose a start Monday, the length, lodging and an airport transfer,
 * and the cart price is worked out from those choices.
 *
 * @package Wayra
 */

defined( 'ABSPATH' ) || exit;

/**
 * Units a rate table can be priced in.
 *
 * @return array
 */
function wayra_units() {
	return array(
		'week'    => array( __( 'week', 'wayra' ), __( 'weeks', 'wayra' ) ),
		'day'     => array( __( 'day', 'wayra' ), __( 'days', 'wayra' ) ),
		'lesson'  => array( __( 'lesson', 'wayra' ), __( 'lessons', 'wayra' ) ),
		'package' => array( __( 'package', 'wayra' ), __( 'packages', 'wayra' ) ),
	);
}

/**
 * Label for a number of units, e.g. "3 weeks".
 *
 * @param int    $count Count.
 * @param string $unit  Unit key.
 * @return string
 */
function wayra_unit_label( $count, $unit ) {
	$units = wayra_units();
	$pair  = isset( $units[ $unit ] ) ? $units[ $unit ] : $units['week'];
	return sprintf( '%d %s', $count, 1 === (int) $count ? $pair[0] : $pair[1] );
}

/**
 * Lodging options, priced per person per week.
 *
 * @return array
 */
function wayra_lodging_options() {
	return apply_filters(
		'wayra_lodging_options',
		array(
			'host-family'        => array( 'label' => __( 'Host family · private room, breakfast & dinner', 'wayra' ), 'price' => 277 ),
			'el-mar-shared'      => array( 'label' => __( 'Casa El Mar · shared room', 'wayra' ), 'price' => 305 ),
			'el-mar-private'     => array( 'label' => __( 'Casa El Mar · private room', 'wayra' ), 'price' => 475 ),
			'carolina-shared'    => array( 'label' => __( 'Casa La Carolina · shared room', 'wayra' ), 'price' => 396 ),
			'carolina-private'   => array( 'label' => __( 'Casa La Carolina · private room', 'wayra' ), 'price' => 565 ),
			'casa-wayra-shared'  => array( 'label' => __( 'Casa WAYRA · shared room', 'wayra' ), 'price' => 396 ),
			'casa-wayra-private' => array( 'label' => __( 'Casa WAYRA · private room', 'wayra' ), 'price' => 565 ),
		)
	);
}

/**
 * Airport transfer options, priced per person one way.
 *
 * @return array
 */
function wayra_transfer_options() {
	return apply_filters(
		'wayra_transfer_options',
		array(
			'interbus' => array( 'label' => __( 'Interbus shuttle San José → Tamarindo', 'wayra' ), 'price' => 68 ),
			'lir'      => array( 'label' => __( 'Private transfer Liberia airport (LIR) → Tamarindo', 'wayra' ), 'price' => 113 ),
		)
	);
}

/**
 * Price of the course book.
 *
 * @return float
 */
function wayra_book_price() {
	return (float) apply_filters( 'wayra_book_price', 45 );
}

/**
 * Parse a rate table string.
 *
 * @param string $raw Raw meta.
 * @return array{tiers: array<int,float>, plus: float|null}
 */
function wayra_parse_rates( $raw ) {
	$tiers = array();
	$plus  = null;
	foreach ( preg_split( '/[\r\n,]+/', (string) $raw ) as $line ) {
		if ( ! preg_match( '/^\s*(\+|\d+)\s*=\s*([\d.]+)\s*$/', $line, $m ) ) {
			continue;
		}
		if ( '+' === $m[1] ) {
			$plus = (float) $m[2];
		} elseif ( (int) $m[1] > 0 ) {
			$tiers[ (int) $m[1] ] = (float) $m[2];
		}
	}
	ksort( $tiers );
	return array(
		'tiers' => $tiers,
		'plus'  => $plus,
	);
}

/**
 * Booking configuration for a product, or null when it is not a program.
 *
 * @param int|WC_Product $product Product.
 * @return array|null
 */
function wayra_booking_config( $product ) {
	$product = wc_get_product( $product );
	if ( ! $product ) {
		return null;
	}
	$id    = $product->get_parent_id() ? $product->get_parent_id() : $product->get_id();
	$rates = wayra_parse_rates( get_post_meta( $id, '_wayra_rates', true ) );
	if ( empty( $rates['tiers'] ) ) {
		return null;
	}
	$unit = get_post_meta( $id, '_wayra_unit', true );
	$unit = array_key_exists( $unit, wayra_units() ) ? $unit : 'week';

	if ( null !== $rates['plus'] ) {
		$max     = max( max( array_keys( $rates['tiers'] ) ), (int) wayra_opt( 'max_weeks' ) );
		$options = range( min( array_keys( $rates['tiers'] ) ), $max );
	} else {
		$options = array_keys( $rates['tiers'] );
	}

	return array(
		'unit'       => $unit,
		'tiers'      => $rates['tiers'],
		'plus'       => $rates['plus'],
		'options'    => $options,
		'start_date' => 'no' !== get_post_meta( $id, '_wayra_start_date', true ),
		'lodging'    => 'week' === $unit && 'yes' === get_post_meta( $id, '_wayra_lodging', true ),
		'book'       => 'yes' === get_post_meta( $id, '_wayra_book', true ),
		'transfer'   => 'no' !== get_post_meta( $id, '_wayra_transfer', true ),
	);
}

/**
 * Tuition for a number of units.
 *
 * @param array $config Booking config.
 * @param int   $units  Units.
 * @return float|null Null when the length is not offered.
 */
function wayra_tuition( $config, $units ) {
	$units = (int) $units;
	if ( isset( $config['tiers'][ $units ] ) ) {
		return $config['tiers'][ $units ];
	}
	if ( null === $config['plus'] || $units < 1 ) {
		return null;
	}
	$below = array_filter(
		array_keys( $config['tiers'] ),
		function ( $k ) use ( $units ) {
			return $k < $units;
		}
	);
	if ( ! $below ) {
		return null;
	}
	$base = max( $below );
	return $config['tiers'][ $base ] + ( $units - $base ) * $config['plus'];
}

/**
 * Closed date ranges from the Customizer.
 *
 * @return array<int, array{0: string, 1: string}>
 */
function wayra_closed_ranges() {
	$ranges = array();
	foreach ( preg_split( '/\r?\n/', (string) wayra_opt( 'closed_ranges' ) ) as $line ) {
		if ( preg_match( '/(\d{4}-\d{2}-\d{2})\D+(\d{4}-\d{2}-\d{2})/', $line, $m ) ) {
			$ranges[] = array( $m[1], $m[2] );
		}
	}
	return $ranges;
}

/**
 * Validate a start date. Returns an error message or an empty string.
 *
 * @param string $date Y-m-d.
 * @return string
 */
function wayra_start_date_error( $date ) {
	$d = DateTimeImmutable::createFromFormat( '!Y-m-d', (string) $date, wp_timezone() );
	if ( ! $d || $d->format( 'Y-m-d' ) !== $date ) {
		return __( 'Please choose a start date.', 'wayra' );
	}
	if ( '1' !== $d->format( 'N' ) ) {
		return __( 'Courses start on Mondays. Please pick a Monday.', 'wayra' );
	}
	$today = new DateTimeImmutable( 'today', wp_timezone() );
	if ( $d < $today ) {
		return __( 'That start date has already passed.', 'wayra' );
	}
	foreach ( wayra_closed_ranges() as $range ) {
		if ( $date >= $range[0] && $date <= $range[1] ) {
			/* translators: 1: first closed day, 2: last closed day */
			return sprintf( __( 'The school is closed from %1$s to %2$s. Please choose another Monday.', 'wayra' ), date_i18n( 'M j', strtotime( $range[0] ) ), date_i18n( 'M j, Y', strtotime( $range[1] ) ) );
		}
	}
	return '';
}

/**
 * Upcoming Mondays the school is open, for the start date picker.
 *
 * @param int $count How many.
 * @return string[] Y-m-d dates.
 */
function wayra_upcoming_mondays( $count = 26 ) {
	$dates = array();
	$d     = new DateTimeImmutable( 'today', wp_timezone() );
	if ( '1' !== $d->format( 'N' ) ) {
		$d = $d->modify( 'next monday' );
	}
	for ( $i = 0; count( $dates ) < $count && $i < 104; $i++, $d = $d->modify( '+1 week' ) ) {
		if ( '' === wayra_start_date_error( $d->format( 'Y-m-d' ) ) ) {
			$dates[] = $d->format( 'Y-m-d' );
		}
	}
	return $dates;
}

/* -------------------------------------------------------------------------
 * Admin: program fields on the product edit screen.
 * ---------------------------------------------------------------------- */

/**
 * Print the program fields in the General tab.
 */
function wayra_admin_fields() {
	echo '<div class="options_group wayra-program-fields">';
	echo '<p class="form-field"><strong>' . esc_html__( 'Wayra program booking', 'wayra' ) . '</strong></p>';

	woocommerce_wp_textarea_input(
		array(
			'id'          => '_wayra_rates',
			'label'       => __( 'Rate table (USD)', 'wayra' ),
			'placeholder' => "1=367\n2=734\n3=1102\n4=1469\n+=326",
			'desc_tip'    => true,
			'description' => __( 'One line per length: units=price. Add "+=price" for each extra unit after the last line. Leave empty to sell this as a normal product.', 'wayra' ),
			'rows'        => 6,
		)
	);
	woocommerce_wp_select(
		array(
			'id'      => '_wayra_unit',
			'label'   => __( 'Priced per', 'wayra' ),
			'options' => array(
				'week'    => __( 'Week', 'wayra' ),
				'day'     => __( 'Day', 'wayra' ),
				'lesson'  => __( 'Lesson', 'wayra' ),
				'package' => __( 'Package', 'wayra' ),
			),
		)
	);
	woocommerce_wp_checkbox(
		array(
			'id'          => '_wayra_start_date',
			'label'       => __( 'Ask for a start Monday', 'wayra' ),
			'value'       => 'no' === get_post_meta( get_the_ID(), '_wayra_start_date', true ) ? 'no' : 'yes',
			'description' => __( 'Students pick a Monday the school is open.', 'wayra' ),
		)
	);
	woocommerce_wp_checkbox(
		array(
			'id'          => '_wayra_lodging',
			'label'       => __( 'Offer lodging', 'wayra' ),
			'description' => __( 'Homestay and student houses, priced per week (weekly programs only).', 'wayra' ),
		)
	);
	woocommerce_wp_checkbox(
		array(
			'id'          => '_wayra_transfer',
			'label'       => __( 'Offer airport transfer', 'wayra' ),
			'value'       => 'no' === get_post_meta( get_the_ID(), '_wayra_transfer', true ) ? 'no' : 'yes',
		)
	);
	woocommerce_wp_checkbox(
		array(
			'id'          => '_wayra_book',
			'label'       => __( 'Offer the course book', 'wayra' ),
			/* translators: %s: price */
			'description' => sprintf( __( 'Adds an optional schoolbook for %s.', 'wayra' ), wp_strip_all_tags( wc_price( wayra_book_price() ) ) ),
		)
	);
	woocommerce_wp_textarea_input(
		array(
			'id'          => '_wayra_facts',
			'label'       => __( 'Key facts', 'wayra' ),
			'placeholder' => "Lessons per week: 20\nClass size: max 6 students\nLevels: A1–C2",
			'desc_tip'    => true,
			'description' => __( 'One per line as "Label: value". Shown as a fact sheet on the program page.', 'wayra' ),
			'rows'        => 5,
		)
	);
	echo '</div>';
}
add_action( 'woocommerce_product_options_general_product_data', 'wayra_admin_fields' );

/**
 * Save the program fields.
 *
 * @param int $post_id Product ID.
 */
function wayra_admin_save( $post_id ) {
	// Nonce is verified by WooCommerce before this hook runs.
	// phpcs:disable WordPress.Security.NonceVerification.Missing
	update_post_meta( $post_id, '_wayra_rates', sanitize_textarea_field( wp_unslash( $_POST['_wayra_rates'] ?? '' ) ) );
	update_post_meta( $post_id, '_wayra_facts', sanitize_textarea_field( wp_unslash( $_POST['_wayra_facts'] ?? '' ) ) );
	$unit = sanitize_key( wp_unslash( $_POST['_wayra_unit'] ?? 'week' ) );
	update_post_meta( $post_id, '_wayra_unit', array_key_exists( $unit, wayra_units() ) ? $unit : 'week' );
	foreach ( array( '_wayra_start_date', '_wayra_lodging', '_wayra_transfer', '_wayra_book' ) as $key ) {
		update_post_meta( $post_id, $key, isset( $_POST[ $key ] ) ? 'yes' : 'no' );
	}
	// phpcs:enable

	// Keep the catalogue price in sync with the one-unit rate so sorting and filters work.
	$config = wayra_booking_config( $post_id );
	if ( $config ) {
		$from    = reset( $config['tiers'] );
		$product = wc_get_product( $post_id );
		if ( $product && ! $product->get_regular_price() ) {
			$product->set_regular_price( (string) $from );
			$product->save();
		}
	}
}
add_action( 'woocommerce_process_product_meta', 'wayra_admin_save', 20 );

/* -------------------------------------------------------------------------
 * Front end: catalogue prices and buttons.
 * ---------------------------------------------------------------------- */

/**
 * "From $367 / week" on program prices.
 *
 * @param string     $html    Price HTML.
 * @param WC_Product $product Product.
 * @return string
 */
function wayra_price_html( $html, $product ) {
	$config = wayra_booking_config( $product );
	if ( ! $config ) {
		return $html;
	}
	$first = array_key_first( $config['tiers'] );
	$units = wayra_units();
	if ( 1 === $first ) {
		/* translators: 1: price, 2: unit, e.g. week */
		return sprintf( __( '<span class="from">From</span> %1$s <span class="per">/ %2$s</span>', 'wayra' ), wc_price( $config['tiers'][1] ), esc_html( $units[ $config['unit'] ][0] ) );
	}
	/* translators: 1: price, 2: length, e.g. 2 weeks */
	return sprintf( __( '<span class="from">From</span> %1$s <span class="per">/ %2$s</span>', 'wayra' ), wc_price( $config['tiers'][ $first ] ), esc_html( wayra_unit_label( $first, $config['unit'] ) ) );
}
add_filter( 'woocommerce_get_price_html', 'wayra_price_html', 20, 2 );

/**
 * Programs need options, so catalogue buttons link to the program page.
 *
 * @param string     $url     URL.
 * @param WC_Product $product Product.
 * @return string
 */
function wayra_loop_cart_url( $url, $product ) {
	return wayra_booking_config( $product ) ? $product->get_permalink() : $url;
}
add_filter( 'woocommerce_product_add_to_cart_url', 'wayra_loop_cart_url', 20, 2 );

/**
 * Catalogue button text.
 *
 * @param string     $text    Text.
 * @param WC_Product $product Product.
 * @return string
 */
function wayra_loop_cart_text( $text, $product ) {
	return wayra_booking_config( $product ) ? __( 'Choose dates', 'wayra' ) : $text;
}
add_filter( 'woocommerce_product_add_to_cart_text', 'wayra_loop_cart_text', 20, 2 );

/**
 * No AJAX add-to-cart from the catalogue for programs.
 *
 * @param bool       $supports Supports.
 * @param string     $feature  Feature.
 * @param WC_Product $product  Product.
 * @return bool
 */
function wayra_product_supports( $supports, $feature, $product ) {
	if ( 'ajax_add_to_cart' === $feature && wayra_booking_config( $product ) ) {
		return false;
	}
	return $supports;
}
add_filter( 'woocommerce_product_supports', 'wayra_product_supports', 20, 3 );

/**
 * Single add-to-cart button label.
 *
 * @param string     $text    Text.
 * @param WC_Product $product Product.
 * @return string
 */
function wayra_single_cart_text( $text, $product = null ) {
	return ( $product && wayra_booking_config( $product ) ) ? __( 'Add program to booking', 'wayra' ) : $text;
}
add_filter( 'woocommerce_product_single_add_to_cart_text', 'wayra_single_cart_text', 20, 2 );

/* -------------------------------------------------------------------------
 * Front end: booking form on the program page.
 * ---------------------------------------------------------------------- */

/**
 * Print the booking fields above the add-to-cart button.
 */
function wayra_booking_fields() {
	global $product;
	$config = wayra_booking_config( $product );
	if ( ! $config ) {
		return;
	}

	// phpcs:disable WordPress.Security.NonceVerification.Missing, WordPress.Security.NonceVerification.Recommended
	$sel_units    = isset( $_REQUEST['wayra_units'] ) ? absint( $_REQUEST['wayra_units'] ) : (int) $config['options'][0];
	$sel_start    = isset( $_REQUEST['wayra_start'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['wayra_start'] ) ) : '';
	$sel_lodging  = isset( $_REQUEST['wayra_lodging'] ) ? sanitize_key( wp_unslash( $_REQUEST['wayra_lodging'] ) ) : '';
	$sel_transfer = isset( $_REQUEST['wayra_transfer'] ) ? sanitize_key( wp_unslash( $_REQUEST['wayra_transfer'] ) ) : '';
	// phpcs:enable

	$prices = array();
	foreach ( $config['options'] as $u ) {
		$prices[ $u ] = wayra_tuition( $config, $u );
	}
	$lodging  = $config['lodging'] ? wayra_lodging_options() : array();
	$transfer = $config['transfer'] ? wayra_transfer_options() : array();
	$data     = array(
		'unit'     => $config['unit'],
		'units'    => wayra_units()[ $config['unit'] ],
		'tuition'  => $prices,
		'lodging'  => wp_list_pluck( $lodging, 'price' ),
		'transfer' => wp_list_pluck( $transfer, 'price' ),
		'book'     => $config['book'] ? wayra_book_price() : 0,
		'currency' => html_entity_decode( get_woocommerce_currency_symbol() ),
		'decimals' => wc_get_price_decimals(),
	);
	?>
	<div class="wayra-booking" data-booking="<?php echo esc_attr( wp_json_encode( $data ) ); ?>">
		<div class="wayra-booking__grid">
			<?php if ( $config['start_date'] ) : ?>
				<p class="field">
					<label for="wayra_start"><?php esc_html_e( 'Start date', 'wayra' ); ?> <span class="hint"><?php esc_html_e( 'Mondays', 'wayra' ); ?></span></label>
					<select name="wayra_start" id="wayra_start" required>
						<option value=""><?php esc_html_e( 'Choose a Monday', 'wayra' ); ?></option>
						<?php foreach ( wayra_upcoming_mondays() as $monday ) : ?>
							<option value="<?php echo esc_attr( $monday ); ?>" <?php selected( $sel_start, $monday ); ?>><?php echo esc_html( date_i18n( 'l, F j, Y', strtotime( $monday ) ) ); ?></option>
						<?php endforeach; ?>
					</select>
				</p>
			<?php endif; ?>

			<p class="field">
				<label for="wayra_units"><?php esc_html_e( 'Length', 'wayra' ); ?></label>
				<select name="wayra_units" id="wayra_units">
					<?php foreach ( $config['options'] as $u ) : ?>
						<option value="<?php echo esc_attr( $u ); ?>" <?php selected( $sel_units, $u ); ?>><?php echo esc_html( wayra_unit_label( $u, $config['unit'] ) ); ?></option>
					<?php endforeach; ?>
				</select>
			</p>

			<?php if ( $lodging ) : ?>
				<p class="field field--wide">
					<label for="wayra_lodging"><?php esc_html_e( 'Lodging', 'wayra' ); ?> <span class="hint"><?php esc_html_e( 'per week', 'wayra' ); ?></span></label>
					<select name="wayra_lodging" id="wayra_lodging">
						<option value=""><?php esc_html_e( 'No lodging, I have my own place', 'wayra' ); ?></option>
						<?php foreach ( $lodging as $key => $opt ) : ?>
							<option value="<?php echo esc_attr( $key ); ?>" <?php selected( $sel_lodging, $key ); ?>><?php echo esc_html( $opt['label'] . ' — ' . wp_strip_all_tags( wc_price( $opt['price'] ) ) ); ?></option>
						<?php endforeach; ?>
					</select>
				</p>
			<?php endif; ?>

			<?php if ( $transfer ) : ?>
				<p class="field field--wide">
					<label for="wayra_transfer"><?php esc_html_e( 'Arrival transfer', 'wayra' ); ?></label>
					<select name="wayra_transfer" id="wayra_transfer">
						<option value=""><?php esc_html_e( 'No transfer, I will get there myself', 'wayra' ); ?></option>
						<?php foreach ( $transfer as $key => $opt ) : ?>
							<option value="<?php echo esc_attr( $key ); ?>" <?php selected( $sel_transfer, $key ); ?>><?php echo esc_html( $opt['label'] . ' — ' . wp_strip_all_tags( wc_price( $opt['price'] ) ) ); ?></option>
						<?php endforeach; ?>
					</select>
				</p>
			<?php endif; ?>

			<?php if ( $config['book'] ) : ?>
				<p class="field field--wide field--check">
					<label><input type="checkbox" name="wayra_book" value="1"> <?php
						/* translators: %s: price */
						printf( esc_html__( 'Add the WAYRA course book (%s)', 'wayra' ), esc_html( wp_strip_all_tags( wc_price( wayra_book_price() ) ) ) );
					?></label>
				</p>
			<?php endif; ?>
		</div>

		<dl class="wayra-booking__summary" aria-live="polite">
			<div><dt><?php esc_html_e( 'Tuition', 'wayra' ); ?></dt><dd data-line="tuition">—</dd></div>
			<?php if ( $lodging ) : ?><div data-row="lodging" hidden><dt><?php esc_html_e( 'Lodging', 'wayra' ); ?></dt><dd data-line="lodging">—</dd></div><?php endif; ?>
			<?php if ( $transfer ) : ?><div data-row="transfer" hidden><dt><?php esc_html_e( 'Transfer', 'wayra' ); ?></dt><dd data-line="transfer">—</dd></div><?php endif; ?>
			<?php if ( $config['book'] ) : ?><div data-row="book" hidden><dt><?php esc_html_e( 'Course book', 'wayra' ); ?></dt><dd data-line="book">—</dd></div><?php endif; ?>
			<div class="total"><dt><?php esc_html_e( 'Per student', 'wayra' ); ?></dt><dd data-line="total">—</dd></div>
		</dl>
		<p class="wayra-booking__note"><?php esc_html_e( 'All rates in USD, VAT included. Registration fee and placement test included.', 'wayra' ); ?></p>
	</div>
	<?php
}
add_action( 'woocommerce_before_add_to_cart_button', 'wayra_booking_fields', 5 );

/**
 * Label the quantity input as students.
 */
function wayra_quantity_label() {
	global $product;
	if ( wayra_booking_config( $product ) ) {
		echo '<span class="qty-label">' . esc_html__( 'Students', 'wayra' ) . '</span>';
	}
}
add_action( 'woocommerce_before_add_to_cart_quantity', 'wayra_quantity_label' );

/* -------------------------------------------------------------------------
 * Cart: validate, store, price and display the booking.
 * ---------------------------------------------------------------------- */

/**
 * Read and check the posted booking for a product.
 *
 * @param int $product_id Product ID.
 * @return array|WP_Error|null Booking, error, or null when not a program.
 */
function wayra_posted_booking( $product_id ) {
	$config = wayra_booking_config( $product_id );
	if ( ! $config ) {
		return null;
	}
	// phpcs:disable WordPress.Security.NonceVerification.Missing, WordPress.Security.NonceVerification.Recommended
	$units    = isset( $_REQUEST['wayra_units'] ) ? absint( $_REQUEST['wayra_units'] ) : 0;
	$start    = isset( $_REQUEST['wayra_start'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['wayra_start'] ) ) : '';
	$lodging  = isset( $_REQUEST['wayra_lodging'] ) ? sanitize_key( wp_unslash( $_REQUEST['wayra_lodging'] ) ) : '';
	$transfer = isset( $_REQUEST['wayra_transfer'] ) ? sanitize_key( wp_unslash( $_REQUEST['wayra_transfer'] ) ) : '';
	$book     = ! empty( $_REQUEST['wayra_book'] );
	// phpcs:enable

	if ( ! in_array( $units, $config['options'], true ) || null === wayra_tuition( $config, $units ) ) {
		return new WP_Error( 'wayra', __( 'Please choose how long you would like to study.', 'wayra' ) );
	}
	if ( $config['start_date'] ) {
		$error = wayra_start_date_error( $start );
		if ( $error ) {
			return new WP_Error( 'wayra', $error );
		}
	} else {
		$start = '';
	}
	if ( $lodging && ( ! $config['lodging'] || ! isset( wayra_lodging_options()[ $lodging ] ) ) ) {
		return new WP_Error( 'wayra', __( 'Please choose a lodging option from the list.', 'wayra' ) );
	}
	if ( $transfer && ( ! $config['transfer'] || ! isset( wayra_transfer_options()[ $transfer ] ) ) ) {
		return new WP_Error( 'wayra', __( 'Please choose a transfer option from the list.', 'wayra' ) );
	}

	return array(
		'units'    => $units,
		'unit'     => $config['unit'],
		'start'    => $start,
		'lodging'  => $lodging,
		'transfer' => $transfer,
		'book'     => $book && $config['book'],
	);
}

/**
 * Block add-to-cart when the booking is incomplete.
 *
 * @param bool $passed     Passed.
 * @param int  $product_id Product ID.
 * @return bool
 */
function wayra_validate_add_to_cart( $passed, $product_id ) {
	$booking = wayra_posted_booking( $product_id );
	if ( is_wp_error( $booking ) ) {
		wc_add_notice( $booking->get_error_message(), 'error' );
		return false;
	}
	return $passed;
}
add_filter( 'woocommerce_add_to_cart_validation', 'wayra_validate_add_to_cart', 10, 2 );

/**
 * Store the booking on the cart item.
 *
 * @param array $data       Cart item data.
 * @param int   $product_id Product ID.
 * @return array
 */
function wayra_cart_item_data( $data, $product_id ) {
	$booking = wayra_posted_booking( $product_id );
	if ( is_array( $booking ) ) {
		$data['wayra'] = $booking;
	}
	return $data;
}
add_filter( 'woocommerce_add_cart_item_data', 'wayra_cart_item_data', 10, 2 );

/**
 * Price breakdown for a booking.
 *
 * @param int|WC_Product $product Product.
 * @param array          $booking Booking.
 * @return array|null
 */
function wayra_booking_breakdown( $product, $booking ) {
	$config = wayra_booking_config( $product );
	if ( ! $config ) {
		return null;
	}
	$tuition = wayra_tuition( $config, $booking['units'] );
	if ( null === $tuition ) {
		return null;
	}
	$lodging_opts  = wayra_lodging_options();
	$transfer_opts = wayra_transfer_options();
	$lodging       = ( $booking['lodging'] && isset( $lodging_opts[ $booking['lodging'] ] ) ) ? $lodging_opts[ $booking['lodging'] ]['price'] * $booking['units'] : 0;
	$transfer      = ( $booking['transfer'] && isset( $transfer_opts[ $booking['transfer'] ] ) ) ? $transfer_opts[ $booking['transfer'] ]['price'] : 0;
	$book          = $booking['book'] ? wayra_book_price() : 0;

	return array(
		'tuition'  => $tuition,
		'lodging'  => $lodging,
		'transfer' => $transfer,
		'book'     => $book,
		'total'    => $tuition + $lodging + $transfer + $book,
	);
}

/**
 * Set cart item prices from the booking.
 *
 * @param WC_Cart $cart Cart.
 */
function wayra_cart_prices( $cart ) {
	if ( is_admin() && ! wp_doing_ajax() ) {
		return;
	}
	foreach ( $cart->get_cart() as $item ) {
		if ( empty( $item['wayra'] ) ) {
			continue;
		}
		$breakdown = wayra_booking_breakdown( $item['data'], $item['wayra'] );
		if ( $breakdown ) {
			$item['data']->set_price( $breakdown['total'] );
		}
	}
}
add_action( 'woocommerce_before_calculate_totals', 'wayra_cart_prices', 20 );

/**
 * Human-readable booking lines.
 *
 * @param array $booking Booking.
 * @return array<string,string> label => value.
 */
function wayra_booking_lines( $booking ) {
	$lines = array();
	if ( ! empty( $booking['start'] ) ) {
		$lines[ __( 'Start date', 'wayra' ) ] = date_i18n( 'D, M j, Y', strtotime( $booking['start'] ) );
	}
	$lines[ __( 'Length', 'wayra' ) ] = wayra_unit_label( $booking['units'], $booking['unit'] );
	$lodging                         = wayra_lodging_options();
	if ( ! empty( $booking['lodging'] ) && isset( $lodging[ $booking['lodging'] ] ) ) {
		$lines[ __( 'Lodging', 'wayra' ) ] = $lodging[ $booking['lodging'] ]['label'];
	}
	$transfer = wayra_transfer_options();
	if ( ! empty( $booking['transfer'] ) && isset( $transfer[ $booking['transfer'] ] ) ) {
		$lines[ __( 'Transfer', 'wayra' ) ] = $transfer[ $booking['transfer'] ]['label'];
	}
	if ( ! empty( $booking['book'] ) ) {
		$lines[ __( 'Course book', 'wayra' ) ] = __( 'Included', 'wayra' );
	}
	return $lines;
}

/**
 * Show the booking under the cart item name (classic and block cart).
 *
 * @param array $data Item data.
 * @param array $item Cart item.
 * @return array
 */
function wayra_cart_item_display( $data, $item ) {
	if ( empty( $item['wayra'] ) ) {
		return $data;
	}
	foreach ( wayra_booking_lines( $item['wayra'] ) as $label => $value ) {
		$data[] = array(
			'key'   => $label,
			'value' => $value,
		);
	}
	return $data;
}
add_filter( 'woocommerce_get_item_data', 'wayra_cart_item_display', 10, 2 );

/**
 * Save the booking on the order line item.
 *
 * @param WC_Order_Item_Product $item          Line item.
 * @param string                $cart_item_key Key.
 * @param array                 $values        Cart item.
 */
function wayra_order_item_meta( $item, $cart_item_key, $values ) {
	if ( empty( $values['wayra'] ) ) {
		return;
	}
	foreach ( wayra_booking_lines( $values['wayra'] ) as $label => $value ) {
		$item->add_meta_data( $label, $value, true );
	}
	$item->add_meta_data( '_wayra_booking', $values['wayra'], true );
}
add_action( 'woocommerce_checkout_create_order_line_item', 'wayra_order_item_meta', 10, 3 );

/**
 * Programs don't ship.
 *
 * @param bool       $needs   Needs shipping.
 * @param WC_Product $product Product.
 * @return bool
 */
function wayra_no_shipping( $needs, $product ) {
	return wayra_booking_config( $product ) ? false : $needs;
}
add_filter( 'woocommerce_product_needs_shipping', 'wayra_no_shipping', 10, 2 );
