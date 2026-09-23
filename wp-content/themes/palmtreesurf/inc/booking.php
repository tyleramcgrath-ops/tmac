<?php
/**
 * Booking CTAs and the handoff to the booking plugin.
 *
 * The theme never hard-depends on the plugin: if Palm Tree Bookings is not
 * active, booking CTAs fall back to the theme's own enquiry form, so the theme
 * activates cleanly on a bare WordPress install (VISUAL-SPEC.md section 13.7).
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Whether the booking plugin is available.
 *
 * @return bool
 */
function pt_has_booking_plugin() {
	return function_exists( 'ptb_render_form' );
}

/**
 * The page that hosts the booking form.
 *
 * @return string
 */
function pt_booking_page_url() {
	$page = get_page_by_path( 'book' );

	if ( ! $page ) {
		$page = get_page_by_path( 'contact' );
	}

	return $page ? get_permalink( $page ) . '#booking' : home_url( '/#booking' );
}

/**
 * Where a booking CTA should point.
 *
 * Order: the experience's own external link, then a site-wide booking system,
 * then the on-site booking page. A CTA never renders dead.
 *
 * @param int|null $post_id Optional experience to check first.
 * @return string
 */
function pt_booking_url( $post_id = null ) {
	if ( $post_id ) {
		$external = pt_field( $post_id, 'booking_url' );
		if ( $external ) {
			return $external;
		}
	}

	$site_wide = pt_mod( 'pt_booking_url' );
	if ( $site_wide ) {
		return $site_wide;
	}

	if ( $post_id && pt_has_booking_plugin() ) {
		return get_permalink( $post_id ) . '#booking';
	}

	return pt_booking_page_url();
}

/**
 * Whether a booking URL leaves the site.
 *
 * @param string $url Candidate URL.
 * @return bool
 */
function pt_is_external_url( $url ) {
	$host = wp_parse_url( $url, PHP_URL_HOST );

	return $host && $host !== wp_parse_url( home_url(), PHP_URL_HOST );
}

/**
 * Render a booking button.
 *
 * Tags every CTA with the section that produced it, so the booking record shows
 * which part of the page converts.
 *
 * @param array $args Button arguments.
 */
function pt_booking_button( $args = array() ) {
	$args = wp_parse_args(
		$args,
		array(
			'label'      => __( 'Book Now', 'palmtreesurf' ),
			'post_id'    => null,
			'location'   => 'header',
			'class'      => 'btn btn--primary',
		)
	);

	$url      = pt_booking_url( $args['post_id'] );
	$external = pt_is_external_url( $url );

	// Attribute an off-site booking back to the section that sent it.
	if ( $external ) {
		$url = add_query_arg(
			array(
				'utm_source'   => wp_parse_url( home_url(), PHP_URL_HOST ),
				'utm_medium'   => 'referral',
				'utm_campaign' => sanitize_key( $args['location'] ),
			),
			$url
		);
	}

	printf(
		'<a class="%1$s" href="%2$s" data-cta-location="%3$s"%4$s>%5$s</a>',
		esc_attr( $args['class'] ),
		esc_url( $url ),
		esc_attr( $args['location'] ),
		$external ? ' rel="noopener"' : '',
		esc_html( $args['label'] )
	);
}

/**
 * Render the booking form, preferring the plugin.
 *
 * @param array $args Form arguments.
 */
function pt_booking_form( $args = array() ) {
	$args = wp_parse_args(
		$args,
		array(
			'experience' => '',
			'title'      => __( 'Request your booking', 'palmtreesurf' ),
			'location'   => 'page',
		)
	);

	if ( pt_has_booking_plugin() ) {
		/*
		 * The plugin escapes its own output. In Spanish mode the markup is run
		 * through the theme's catalogue on the way out, which catches the one
		 * thing the gettext bridge cannot: the experience names in the picker,
		 * which the plugin reads straight off $post->post_title and so never
		 * pass through the_title.
		 */
		$form = ptb_render_form( $args );

		if ( function_exists( 'pt_translate_seeded_html' ) ) {
			$form = pt_translate_seeded_html( $form );
		}

		echo $form; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped inside the plugin template.
		return;
	}

	echo pt_enquiry_form( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped inside the template.
		array(
			'package' => $args['experience'] ? get_the_title( (int) $args['experience'] ) : '',
			'title'   => $args['title'],
		)
	);
}

/**
 * Point the plugin's experience picker at this theme's post type.
 *
 * @return string
 */
function pt_booking_post_type() {
	return PT_EXPERIENCE_POST_TYPE;
}
add_filter( 'ptb_experience_post_type', 'pt_booking_post_type' );

/**
 * Drop the theme's Price from box once the booking plugin owns pricing.
 *
 * Leaving it on screen gives an operator two boxes that look like they set the
 * same number, only one of which the site reads — so editing the wrong one
 * appears to do nothing, which is exactly the report this fixes. The stored
 * value stays in the database untouched and is used again if the plugin is
 * ever deactivated.
 *
 * @param array<string, array<string, array<string, mixed>>> $map Field map.
 * @return array<string, array<string, array<string, mixed>>>
 */
function pt_drop_duplicate_price_field( $map ) {
	if ( ! function_exists( 'ptb_price_from' ) ) {
		return $map;
	}

	unset( $map[ PT_EXPERIENCE_POST_TYPE ]['price_from'] );

	return $map;
}
add_filter( 'pt_field_map', 'pt_drop_duplicate_price_field' );

/**
 * Feed the plugin real prices from the experience fields.
 *
 * Stored as minor units, per the plugin's money model.
 *
 * @param int $quote      Amount in minor units.
 * @param int $booking_id Booking ID.
 * @return int
 */
function pt_booking_quote( $quote, $booking_id ) {
	if ( $quote > 0 || ! function_exists( 'ptb_get' ) ) {
		return $quote;
	}

	$experience_id = (int) ptb_get( $booking_id, 'experience' );
	if ( ! $experience_id ) {
		return $quote;
	}

	$price = (float) pt_field( $experience_id, 'price_from' );
	if ( $price <= 0 ) {
		return $quote;
	}

	$people = max( 1, (int) ptb_get( $booking_id, 'party_adults' ) ) + (int) ptb_get( $booking_id, 'party_children' );

	return (int) round( $price * 100 ) * $people;
}
add_filter( 'ptb_quote', 'pt_booking_quote', 10, 2 );

/**
 * Whether a tour's headline price is per head or for the whole trip.
 *
 * A charter at 1300 for up to five people and a lesson at 55 each are both
 * "From $…", and only this decides whether the words after it are true.
 *
 * @param int $post_id Experience ID.
 * @return bool|null True for per person, false for the whole trip, null when
 *                   the booking plugin is not present to say.
 */
function pt_price_is_per_person( $post_id ) {
	if ( ! function_exists( 'ptb_options' ) || ! function_exists( 'ptb_price_value' ) ) {
		return null;
	}

	$options = ptb_options( $post_id );

	if ( $options ) {
		/*
		 * The cheapest option is the one the "From" price quotes, so it is the
		 * one the suffix has to describe.
		 */
		$cheapest = null;

		foreach ( $options as $option ) {
			$price = (float) $option['price'];

			if ( $price <= 0 ) {
				continue;
			}

			if ( null === $cheapest || $price < (float) $cheapest['price'] ) {
				$cheapest = $option;
			}
		}

		if ( $cheapest ) {
			return 'person' === $cheapest['mode'];
		}
	}

	// No options: a flat rate covers the booking, anything else is per head.
	return ptb_price_value( $post_id, 'price_flat' ) <= 0;
}
