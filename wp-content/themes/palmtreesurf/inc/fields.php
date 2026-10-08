<?php
/**
 * Detail fields for experiences, testimonials and instructors.
 *
 * Core meta box API, so the theme needs no ACF or other plugin.
 * Repeating data (inclusions, itinerary, FAQ) is stored as one-per-line text
 * rather than a repeater UI: it keeps the theme dependency-free, and it is
 * quicker for staff to edit than a row builder.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Field definitions per post type.
 *
 * @return array<string, array<string, array<string, mixed>>>
 */
function pt_field_map() {
	$map = array(
		PT_EXPERIENCE_POST_TYPE => array(
			'price_from'   => array(
				'label' => __( 'Price from', 'palmtreesurf' ),
				'type'  => 'number',
				'hint'  => __( 'Per person, digits only. Example: 65', 'palmtreesurf' ),
			),
			'price_suffix' => array(
				'label' => __( 'Price suffix', 'palmtreesurf' ),
				'type'  => 'text',
				'hint'  => __( 'Example: per person', 'palmtreesurf' ),
			),
			'duration'     => array(
				'label' => __( 'Duration', 'palmtreesurf' ),
				'type'  => 'text',
				'hint'  => __( 'Example: 2 hours', 'palmtreesurf' ),
			),
			'group_size'   => array(
				'label' => __( 'Group size', 'palmtreesurf' ),
				'type'  => 'text',
				'hint'  => __( 'Example: Up to 4 guests', 'palmtreesurf' ),
			),
			'video_url'    => array(
				'label' => __( 'Video URL', 'palmtreesurf' ),
				'type'  => 'url',
				'hint'  => __( 'Optional. Paste the URL of an MP4 uploaded to the Media Library to show it on this page.', 'palmtreesurf' ),
			),
			'min_age'      => array(
				'label' => __( 'Minimum age', 'palmtreesurf' ),
				'type'  => 'text',
			),
			'badge'        => array(
				'label' => __( 'Card badge', 'palmtreesurf' ),
				'type'  => 'text',
				'hint'  => __( 'Shown on the card corner. Example: Most Popular', 'palmtreesurf' ),
			),
			'rating'       => array(
				'label' => __( 'Rating', 'palmtreesurf' ),
				'type'  => 'text',
				'hint'  => __( 'Example: 4.9. Leave empty to hide the rating pill.', 'palmtreesurf' ),
			),
			'review_count' => array(
				'label' => __( 'Review count', 'palmtreesurf' ),
				'type'  => 'number',
			),
			'includes'     => array(
				'label' => __( 'What is included', 'palmtreesurf' ),
				'type'  => 'textarea',
				'hint'  => __( 'One item per line.', 'palmtreesurf' ),
			),
			'bring'        => array(
				'label' => __( 'What to bring', 'palmtreesurf' ),
				'type'  => 'textarea',
				'hint'  => __( 'One item per line.', 'palmtreesurf' ),
			),
			'itinerary'    => array(
				'label' => __( 'Itinerary', 'palmtreesurf' ),
				'type'  => 'textarea',
				'hint'  => __( 'One step per line, as "time | what happens".', 'palmtreesurf' ),
			),
			'faq'          => array(
				'label' => __( 'FAQ', 'palmtreesurf' ),
				'type'  => 'textarea',
				'hint'  => __( 'One per line, as "question | answer". Also feeds FAQ schema.', 'palmtreesurf' ),
			),
			'booking_url'  => array(
				'label' => __( 'External booking link', 'palmtreesurf' ),
				'type'  => 'url',
				'hint'  => __( 'Leave empty to use the on-site booking form.', 'palmtreesurf' ),
			),
		),
		'testimonial'           => array(
			'quote'  => array(
				'label' => __( 'Quote', 'palmtreesurf' ),
				'type'  => 'textarea',
			),
			'rating' => array(
				'label' => __( 'Rating out of 5', 'palmtreesurf' ),
				'type'  => 'number',
			),
			'origin' => array(
				'label' => __( 'Where they are from', 'palmtreesurf' ),
				'type'  => 'text',
			),
		),
		'instructor'            => array(
			'role'           => array(
				'label' => __( 'Role', 'palmtreesurf' ),
				'type'  => 'text',
			),
			'bio_short'      => array(
				'label' => __( 'Short bio', 'palmtreesurf' ),
				'type'  => 'textarea',
				'hint'  => __( 'One or two lines, shown on the card.', 'palmtreesurf' ),
			),
			'certifications' => array(
				'label' => __( 'Certifications', 'palmtreesurf' ),
				'type'  => 'text',
			),
		),
	);

	/**
	 * Filter the editable fields, so a module can add its own without
	 * editing this map. Pricing uses it.
	 *
	 * @param array $map Post type to field definitions.
	 */
	return apply_filters( 'pt_field_map', $map );
}

/**
 * Read a theme field.
 *
 * @param int    $post_id Post ID.
 * @param string $key     Field key, without the `_pt_` prefix.
 * @return string
 */
function pt_field( $post_id, $key ) {
	/*
	 * The advertised from-price is derived from the booking plugin's rates
	 * rather than stored beside them. Editing a price on the Pricing screen
	 * has to move the figure on the card, the sidebar and the schema markup
	 * too — otherwise a visitor is shown one number and quoted another, which
	 * is the drift having a single set of rates was meant to prevent.
	 */
	if ( 'price_from' === $key && function_exists( 'ptb_price_from' ) ) {
		$derived = ptb_price_from( $post_id );

		return $derived > 0 ? pt_format_price_number( $derived ) : '';
	}

	/*
	 * "per person" was a stored string set to the same value on every tour,
	 * which meant a charter sold at 1300 for the whole boat advertised itself
	 * as "From $1,300 per person". Derived from how the tour is actually
	 * charged, it cannot say the wrong thing.
	 */
	if ( 'price_suffix' === $key && function_exists( 'pt_price_is_per_person' ) ) {
		$per_person = pt_price_is_per_person( $post_id );

		if ( null === $per_person ) {
			return (string) get_post_meta( $post_id, '_pt_price_suffix', true );
		}

		return $per_person
			? __( 'per person', 'palmtreesurf' )
			: __( 'for the trip', 'palmtreesurf' );
	}

	$value = (string) get_post_meta( $post_id, '_pt_' . $key, true );

	/*
	 * Seeded values are stored in English. In Spanish mode they are looked up
	 * in the catalogue on the way out, so inclusions, itineraries and FAQs
	 * turn over with the rest of the page instead of staying English inside a
	 * translated layout.
	 */
	return function_exists( 'pt_translate_seeded' ) ? pt_translate_seeded( $value ) : $value;
}


/**
 * A rate as the price field used to be typed: whole numbers bare, otherwise
 * two decimals.
 *
 * Deliberately not localised. Two of the callers are not display: the schema
 * markup puts this straight into JSON-LD, where schema.org requires a plain
 * number, and the booking quote casts it to float. A locale that writes 1.234,56
 * would be invalid in the first and silently truncate in the second.
 *
 * @param float $amount Amount.
 * @return string
 */
function pt_format_price_number( $amount ) {
	$amount = (float) $amount;

	return ( floor( $amount ) === $amount )
		? (string) (int) $amount
		: number_format( $amount, 2, '.', '' );
}

/**
 * Split a one-per-line field into trimmed items.
 *
 * @param int    $post_id Post ID.
 * @param string $key     Field key.
 * @return array<int, string>
 */
function pt_field_lines( $post_id, $key ) {
	$raw = pt_field( $post_id, $key );

	if ( '' === $raw ) {
		return array();
	}

	return array_values( array_filter( array_map( 'trim', explode( "\n", $raw ) ) ) );
}

/**
 * Split a "left | right" field into pairs.
 *
 * @param int    $post_id Post ID.
 * @param string $key     Field key.
 * @return array<int, array{0: string, 1: string}>
 */
function pt_field_pairs( $post_id, $key ) {
	$pairs = array();

	foreach ( pt_field_lines( $post_id, $key ) as $line ) {
		$parts   = array_map( 'trim', explode( '|', $line, 2 ) );
		$pairs[] = array( $parts[0], isset( $parts[1] ) ? $parts[1] : '' );
	}

	return $pairs;
}

/**
 * Register the fields for REST and revisions.
 */
function pt_register_meta() {
	foreach ( pt_field_map() as $post_type => $fields ) {
		foreach ( $fields as $key => $field ) {
			register_post_meta(
				$post_type,
				'_pt_' . $key,
				array(
					'single'            => true,
					'type'              => 'string',
					'show_in_rest'      => false,
					'sanitize_callback' => pt_sanitizer_for( $field['type'] ),
					'auth_callback'     => function () {
						return current_user_can( 'edit_posts' );
					},
				)
			);
		}
	}
}
add_action( 'init', 'pt_register_meta' );

/**
 * Map a field type to its sanitiser.
 *
 * @param string $type Field type.
 * @return string
 */
function pt_sanitizer_for( $type ) {
	switch ( $type ) {
		case 'textarea':
			return 'sanitize_textarea_field';
		case 'url':
			return 'esc_url_raw';
		default:
			return 'sanitize_text_field';
	}
}

/**
 * Add the detail meta boxes.
 */
function pt_add_meta_boxes() {
	foreach ( array_keys( pt_field_map() ) as $post_type ) {
		add_meta_box(
			'pt-details',
			__( 'Details', 'palmtreesurf' ),
			'pt_render_meta_box',
			$post_type,
			PT_EXPERIENCE_POST_TYPE === $post_type ? 'normal' : 'side',
			'high'
		);
	}
}
add_action( 'add_meta_boxes', 'pt_add_meta_boxes' );

/**
 * Render the detail meta box.
 *
 * @param WP_Post $post Post being edited.
 */
function pt_render_meta_box( $post ) {
	$map = pt_field_map();

	if ( ! isset( $map[ $post->post_type ] ) ) {
		return;
	}

	wp_nonce_field( 'pt_save_fields', 'pt_fields_nonce' );

	echo '<div class="pt-fields">';

	foreach ( $map[ $post->post_type ] as $key => $field ) {
		$value = pt_field( $post->ID, $key );
		$id    = 'pt-field-' . sanitize_key( $key );

		echo '<p style="margin:0 0 14px">';
		printf(
			'<label for="%1$s"><strong>%2$s</strong></label><br />',
			esc_attr( $id ),
			esc_html( $field['label'] )
		);

		if ( 'textarea' === $field['type'] ) {
			printf(
				'<textarea id="%1$s" name="pt_fields[%2$s]" rows="4" class="widefat">%3$s</textarea>',
				esc_attr( $id ),
				esc_attr( $key ),
				esc_textarea( $value )
			);
		} else {
			printf(
				'<input type="%1$s" id="%2$s" name="pt_fields[%3$s]" value="%4$s" class="widefat" />',
				esc_attr( 'url' === $field['type'] ? 'url' : 'text' ),
				esc_attr( $id ),
				esc_attr( $key ),
				esc_attr( $value )
			);
		}

		if ( ! empty( $field['hint'] ) ) {
			printf( '<span class="description">%s</span>', esc_html( $field['hint'] ) );
		}

		echo '</p>';
	}

	echo '</div>';
}

/**
 * Persist the detail fields.
 *
 * @param int     $post_id Post ID.
 * @param WP_Post $post    Post object.
 */
function pt_save_fields( $post_id, $post ) {
	if ( ! isset( $_POST['pt_fields_nonce'] ) ) {
		return;
	}

	$nonce = sanitize_text_field( wp_unslash( $_POST['pt_fields_nonce'] ) );
	if ( ! wp_verify_nonce( $nonce, 'pt_save_fields' ) ) {
		return;
	}

	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$map = pt_field_map();
	if ( ! isset( $map[ $post->post_type ] ) ) {
		return;
	}

	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitised per field below.
	$submitted = isset( $_POST['pt_fields'] ) && is_array( $_POST['pt_fields'] ) ? wp_unslash( $_POST['pt_fields'] ) : array();

	foreach ( $map[ $post->post_type ] as $key => $field ) {
		$raw       = isset( $submitted[ $key ] ) ? $submitted[ $key ] : '';
		$sanitizer = pt_sanitizer_for( $field['type'] );
		$value     = call_user_func( $sanitizer, $raw );

		if ( '' === $value ) {
			delete_post_meta( $post_id, '_pt_' . $key );
		} else {
			update_post_meta( $post_id, '_pt_' . $key, $value );
		}
	}
}
add_action( 'save_post', 'pt_save_fields', 10, 2 );
