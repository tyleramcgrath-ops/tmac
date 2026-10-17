<?php
/**
 * Sanctuary details and destination-guide fields, edited in wp-admin.
 *
 * Multi-row fields ("one per line") use " | " between columns so they stay
 * editable without a page-builder plugin.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

/**
 * Sanctuary field definitions: key => [label, type, help, group].
 *
 * @return array
 */
function whr_sanctuary_fields() {
	return array(
		'whr_location'          => array( __( 'Location label', 'wehaverehabs' ), 'text', __( 'Shown on cards, e.g. "Nosara · Guanacaste".', 'wehaverehabs' ), 'basics' ),
		'whr_tagline'           => array( __( 'Tagline', 'wehaverehabs' ), 'text', __( 'One line under the name in the hero.', 'wehaverehabs' ), 'basics' ),
		'whr_price_from'        => array( __( 'Price from, per week', 'wehaverehabs' ), 'number', __( 'Whole number, no symbols. Leave empty for "Rates on request".', 'wehaverehabs' ), 'basics' ),
		'whr_currency'          => array( __( 'Currency', 'wehaverehabs' ), 'text', __( 'ISO code, e.g. USD, EUR, CRC.', 'wehaverehabs' ), 'basics' ),
		'whr_stay_min'          => array( __( 'Shortest stay (nights)', 'wehaverehabs' ), 'number', '', 'basics' ),
		'whr_stay_max'          => array( __( 'Longest stay (nights)', 'wehaverehabs' ), 'number', '', 'basics' ),
		'whr_guests'            => array( __( 'Maximum guests', 'wehaverehabs' ), 'number', '', 'basics' ),
		'whr_languages'         => array( __( 'Languages', 'wehaverehabs' ), 'text', __( 'e.g. English · Español', 'wehaverehabs' ), 'basics' ),
		'whr_sponsored'         => array( __( 'Sponsored placement', 'wehaverehabs' ), 'checkbox', __( 'Shows a "Sponsored" label and lifts the listing in results.', 'wehaverehabs' ), 'basics' ),
		'whr_featured'          => array( __( 'Feature on the homepage', 'wehaverehabs' ), 'checkbox', '', 'basics' ),

		'whr_license_authority' => array( __( 'Licensing authority', 'wehaverehabs' ), 'text', __( 'e.g. Ministerio de Salud, Costa Rica', 'wehaverehabs' ), 'trust' ),
		'whr_license_number'    => array( __( 'License number', 'wehaverehabs' ), 'text', '', 'trust' ),
		'whr_license_checked'   => array( __( 'License last checked', 'wehaverehabs' ), 'date', __( 'Shown publicly as the verification date.', 'wehaverehabs' ), 'trust' ),

		'whr_inquiry_email'     => array( __( 'Inquiry email', 'wehaverehabs' ), 'email', __( 'Inquiries are sent here (and stored under Inquiries).', 'wehaverehabs' ), 'contact' ),
		'whr_whatsapp'          => array( __( 'WhatsApp number', 'wehaverehabs' ), 'text', __( 'International format, digits only, e.g. 50688887777.', 'wehaverehabs' ), 'contact' ),
		'whr_airport'           => array( __( 'Getting there', 'wehaverehabs' ), 'textarea', __( 'Nearest airport and transfer details.', 'wehaverehabs' ), 'contact' ),

		'whr_gallery'           => array( __( 'Gallery', 'wehaverehabs' ), 'gallery', __( 'Pick 5+ photos. The first two also appear beside the story.', 'wehaverehabs' ), 'content' ),
		'whr_schedule'          => array( __( 'A day here', 'wehaverehabs' ), 'lines', __( 'One per line: time | title | description', 'wehaverehabs' ), 'content' ),
		'whr_clinical'          => array( __( 'Clinical therapies', 'wehaverehabs' ), 'lines', __( 'One per line. Delivered by licensed clinicians.', 'wehaverehabs' ), 'content' ),
		'whr_complementary'     => array( __( 'Complementary practices', 'wehaverehabs' ), 'lines', __( 'One per line, e.g. Yoga, Surf therapy.', 'wehaverehabs' ), 'content' ),
		'whr_team'              => array( __( 'Team', 'wehaverehabs' ), 'lines', __( 'One per line: name, credentials | role', 'wehaverehabs' ), 'content' ),
		'whr_rooms'             => array( __( 'Rooms & rates', 'wehaverehabs' ), 'lines', __( 'One per line: room name | description and rates | image ID (optional)', 'wehaverehabs' ), 'content' ),
		'whr_included'          => array( __( 'Included', 'wehaverehabs' ), 'textarea', '', 'content' ),
		'whr_not_included'      => array( __( 'Not included', 'wehaverehabs' ), 'textarea', '', 'content' ),
		'whr_guest_quote'       => array( __( 'Guest reflection', 'wehaverehabs' ), 'textarea', __( 'Only publish real, consented guest words.', 'wehaverehabs' ), 'content' ),
		'whr_guest_attribution' => array( __( 'Guest attribution', 'wehaverehabs' ), 'text', __( 'e.g. J.M. · Canada · 30 nights', 'wehaverehabs' ), 'content' ),

		'whr_claimed'           => array( __( 'Claimed by the facility', 'wehaverehabs' ), 'checkbox', __( 'Tick once you have verified the person claiming works there. Claimed listings get the full profile and the inquiry form.', 'wehaverehabs' ), 'listing' ),
		'whr_address'           => array( __( 'Address', 'wehaverehabs' ), 'text', '', 'listing' ),
		'whr_phone'             => array( __( 'Public phone', 'wehaverehabs' ), 'text', '', 'listing' ),
		'whr_intake_phone'      => array( __( 'Intake phone', 'wehaverehabs' ), 'text', '', 'listing' ),
		'whr_website'           => array( __( 'Website', 'wehaverehabs' ), 'url', '', 'listing' ),
		'whr_lat'               => array( __( 'Latitude', 'wehaverehabs' ), 'text', '', 'listing' ),
		'whr_lng'               => array( __( 'Longitude', 'wehaverehabs' ), 'text', '', 'listing' ),
		'whr_operator'          => array( __( 'Operated by', 'wehaverehabs' ), 'text', '', 'listing' ),
		'whr_service_setting'   => array( __( 'Service settings', 'wehaverehabs' ), 'textarea', '', 'listing' ),
		'whr_approaches'        => array( __( 'Treatment approaches', 'wehaverehabs' ), 'textarea', '', 'listing' ),
		'whr_programs'          => array( __( 'Programs & groups', 'wehaverehabs' ), 'textarea', '', 'listing' ),
		'whr_payment'           => array( __( 'Payment & insurance', 'wehaverehabs' ), 'textarea', '', 'listing' ),
		'whr_license_text'      => array( __( 'Licenses & accreditation (from source)', 'wehaverehabs' ), 'textarea', '', 'listing' ),
		'whr_ages'              => array( __( 'Ages accepted', 'wehaverehabs' ), 'text', '', 'listing' ),
		'whr_source'            => array( __( 'Data source', 'wehaverehabs' ), 'text', __( 'samhsa, cqc, web or manual.', 'wehaverehabs' ), 'listing' ),
		'whr_source_id'         => array( __( 'Source ID', 'wehaverehabs' ), 'text', '', 'listing' ),
		'whr_source_url'        => array( __( 'Source page', 'wehaverehabs' ), 'url', '', 'listing' ),
		'whr_source_date'       => array( __( 'Source retrieved', 'wehaverehabs' ), 'date', '', 'listing' ),
	);
}

/**
 * Destination term field definitions.
 *
 * @return array
 */
function whr_destination_fields() {
	return array(
		'whr_image'   => array( __( 'Hero photo', 'wehaverehabs' ), 'image', '' ),
		'whr_tagline' => array( __( 'Tagline', 'wehaverehabs' ), 'textarea', __( 'Shown under the destination name.', 'wehaverehabs' ) ),
		'whr_card'    => array( __( 'Short card text', 'wehaverehabs' ), 'text', __( 'For region tiles, e.g. "Volcano views, hot springs".', 'wehaverehabs' ) ),
		'whr_story'   => array( __( 'Why come here', 'wehaverehabs' ), 'textarea', __( 'Intro paragraph for the destination guide.', 'wehaverehabs' ) ),
		'whr_facts'   => array( __( 'At a glance', 'wehaverehabs' ), 'lines', __( 'One per line: label | value (e.g. Fly into | SJO · LIR)', 'wehaverehabs' ) ),
		'whr_reasons' => array( __( 'Reasons', 'wehaverehabs' ), 'lines', __( 'One per line: title | text', 'wehaverehabs' ) ),
		'whr_guide'   => array( __( 'Before you go', 'wehaverehabs' ), 'lines', __( 'One per line: title | text', 'wehaverehabs' ) ),
		'whr_faq'     => array( __( 'FAQ', 'wehaverehabs' ), 'lines', __( 'One per line: question | answer', 'wehaverehabs' ) ),
	);
}

/** Register meta so it is available in the REST API and block editor. */
add_action(
	'init',
	function () {
		foreach ( whr_sanctuary_fields() as $key => $f ) {
			$type = in_array( $f[1], array( 'number' ), true ) ? 'integer' : ( 'checkbox' === $f[1] ? 'boolean' : 'string' );
			register_post_meta(
				'sanctuary',
				$key,
				array(
					'type'          => $type,
					'single'        => true,
					'show_in_rest'  => true,
					'auth_callback' => function ( $allowed, $meta_key, $post_id ) {
						return current_user_can( 'edit_post', $post_id ) && ( whr_is_staff() || ! in_array( $meta_key, whr_staff_only_fields(), true ) );
					},
				)
			);
		}
		foreach ( array_keys( whr_destination_fields() ) as $key ) {
			register_term_meta( 'destination', $key, array( 'type' => 'string', 'single' => true, 'show_in_rest' => true ) );
		}
	}
);

/**
 * Sanitize a value for a field type.
 *
 * @param string $type  Field type.
 * @param mixed  $value Raw value.
 * @return mixed
 */
function whr_sanitize_field( $type, $value ) {
	switch ( $type ) {
		case 'number':
			return '' === $value ? '' : absint( $value );
		case 'checkbox':
			return $value ? 1 : 0;
		case 'email':
			return sanitize_email( $value );
		case 'url':
			return esc_url_raw( $value );
		case 'date':
			return preg_match( '/^\d{4}-\d{2}-\d{2}$/', $value ) ? $value : '';
		case 'gallery':
			return implode( ',', array_filter( array_map( 'absint', explode( ',', (string) $value ) ) ) );
		case 'image':
			return $value ? (string) absint( $value ) : '';
		case 'textarea':
		case 'lines':
			return sanitize_textarea_field( $value );
		default:
			return sanitize_text_field( $value );
	}
}

/**
 * Render one admin input.
 *
 * @param string $key   Field key.
 * @param array  $f     Field definition.
 * @param mixed  $value Current value.
 */
function whr_render_field( $key, $f, $value ) {
	list( $label, $type, $help ) = $f;
	$id = esc_attr( $key );
	echo '<div class="whr-field whr-field--' . esc_attr( $type ) . '">';
	if ( 'checkbox' === $type ) {
		printf( '<label><input type="checkbox" name="%1$s" value="1" %2$s> %3$s</label>', $id, checked( $value, 1, false ), esc_html( $label ) );
	} else {
		printf( '<label for="%s"><strong>%s</strong></label>', $id, esc_html( $label ) );
		if ( 'textarea' === $type || 'lines' === $type ) {
			printf( '<textarea id="%1$s" name="%1$s" rows="%3$d" class="widefat">%2$s</textarea>', $id, esc_textarea( $value ), 'lines' === $type ? 5 : 3 );
		} elseif ( 'gallery' === $type || 'image' === $type ) {
			printf( '<input type="hidden" id="%1$s" name="%1$s" value="%2$s" class="whr-media-ids">', $id, esc_attr( $value ) );
			echo '<div class="whr-media-preview">';
			foreach ( array_filter( explode( ',', (string) $value ) ) as $att ) {
				echo wp_get_attachment_image( (int) $att, array( 80, 80 ) );
			}
			echo '</div>';
			printf(
				'<button type="button" class="button whr-media-pick" data-multiple="%s">%s</button> <button type="button" class="button-link whr-media-clear">%s</button>',
				'gallery' === $type ? '1' : '0',
				esc_html( 'gallery' === $type ? __( 'Choose photos', 'wehaverehabs' ) : __( 'Choose photo', 'wehaverehabs' ) ),
				esc_html__( 'Clear', 'wehaverehabs' )
			);
		} else {
			$input = array( 'number' => 'number', 'email' => 'email', 'date' => 'date', 'url' => 'url' );
			printf( '<input type="%1$s" id="%2$s" name="%2$s" value="%3$s" class="widefat">', esc_attr( $input[ $type ] ?? 'text' ), $id, esc_attr( $value ) );
		}
	}
	if ( $help ) {
		printf( '<p class="description">%s</p>', esc_html( $help ) );
	}
	echo '</div>';
}

/** Sanctuary meta boxes. */
add_action(
	'add_meta_boxes_sanctuary',
	function () {
		$groups = array(
			'basics'  => __( 'Sanctuary details', 'wehaverehabs' ),
			'trust'   => __( 'License & verification', 'wehaverehabs' ),
			'contact' => __( 'Inquiries & travel', 'wehaverehabs' ),
			'content' => __( 'Profile page content', 'wehaverehabs' ),
			'listing' => __( 'Public listing & claim status', 'wehaverehabs' ),
		);
		foreach ( $groups as $group => $title ) {
			add_meta_box(
				'whr_' . $group,
				$title,
				function ( $post ) use ( $group ) {
					if ( 'basics' === $group ) {
						wp_nonce_field( 'whr_save_sanctuary', 'whr_sanctuary_nonce' );
					}
					if ( in_array( $group, array( 'basics', 'content' ), true ) && ! whr_has_full_profile( $post->ID ) ) {
						echo '<p class="notice notice-info inline" style="padding:8px 12px">' . esc_html__( 'Fields marked ★ are shown on the page with the Signature or Featured plan (see Plan & billing). You can fill them in now.', 'wehaverehabs' ) . '</p>';
					}
					foreach ( whr_sanctuary_fields() as $key => $f ) {
						if ( ! whr_is_staff() && in_array( $key, whr_staff_only_fields(), true ) ) {
							continue;
						}
						if ( in_array( $key, whr_paid_fields(), true ) && ! whr_has_full_profile( $post->ID ) ) {
							$f[0] = '★ ' . $f[0];
						}
						if ( $f[3] === $group ) {
							whr_render_field( $key, $f, get_post_meta( $post->ID, $key, true ) );
						}
					}
				},
				'sanctuary',
				in_array( $group, array( 'basics', 'content', 'listing' ), true ) ? 'normal' : 'side',
				'basics' === $group ? 'high' : 'default'
			);
		}
	}
);

add_action(
	'save_post_sanctuary',
	function ( $post_id ) {
		if ( ! isset( $_POST['whr_sanctuary_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['whr_sanctuary_nonce'] ), 'whr_save_sanctuary' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$fields = whr_sanctuary_fields();
		if ( whr_is_staff() ) {
			$fields += whr_plan_fields();
		}
		foreach ( $fields as $key => $f ) {
			if ( ! whr_is_staff() && in_array( $key, whr_staff_only_fields(), true ) ) {
				continue; // Owners cannot change placement, verification or billing.
			}
			$raw = isset( $_POST[ $key ] ) ? wp_unslash( $_POST[ $key ] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized below per type.
			if ( 'select' === $f[1] ) {
				$value = in_array( $raw, array( 'essential', 'signature', 'featured' ), true ) ? $raw : '';
			} else {
				$value = whr_sanitize_field( $f[1], $raw );
			}
			update_post_meta( $post_id, $key, $value );
		}
	}
);

/** Destination term fields. */
add_action(
	'destination_edit_form_fields',
	function ( $term ) {
		wp_nonce_field( 'whr_save_destination', 'whr_destination_nonce' );
		foreach ( whr_destination_fields() as $key => $f ) {
			echo '<tr class="form-field"><th scope="row"></th><td>';
			whr_render_field( $key, $f, get_term_meta( $term->term_id, $key, true ) );
			echo '</td></tr>';
		}
	}
);
add_action(
	'destination_add_form_fields',
	function () {
		wp_nonce_field( 'whr_save_destination', 'whr_destination_nonce' );
		foreach ( whr_destination_fields() as $key => $f ) {
			echo '<div class="form-field">';
			whr_render_field( $key, $f, '' );
			echo '</div>';
		}
	}
);

/**
 * Save destination term meta.
 *
 * @param int $term_id Term ID.
 */
function whr_save_destination_meta( $term_id ) {
	if ( ! isset( $_POST['whr_destination_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['whr_destination_nonce'] ), 'whr_save_destination' ) ) {
		return;
	}
	if ( ! current_user_can( 'manage_categories' ) ) {
		return;
	}
	foreach ( whr_destination_fields() as $key => $f ) {
		$raw = isset( $_POST[ $key ] ) ? wp_unslash( $_POST[ $key ] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized below per type.
		update_term_meta( $term_id, $key, whr_sanitize_field( $f[1], $raw ) );
	}
}
add_action( 'created_destination', 'whr_save_destination_meta' );
add_action( 'edited_destination', 'whr_save_destination_meta' );

/** Media picker for gallery and image fields. */
add_action(
	'admin_enqueue_scripts',
	function ( $hook ) {
		$screen = get_current_screen();
		if ( ! $screen || ! in_array( $screen->id, array( 'sanctuary', 'edit-destination' ), true ) ) {
			return;
		}
		wp_enqueue_media();
		wp_enqueue_script( 'whr-admin', WHR_URI . '/assets/js/admin.js', array( 'jquery' ), WHR_VERSION, true );
		wp_add_inline_style( 'wp-admin', '.whr-field{margin:0 0 16px}.whr-media-preview{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.whr-media-preview img{width:64px;height:64px;object-fit:cover}' );
	}
);
