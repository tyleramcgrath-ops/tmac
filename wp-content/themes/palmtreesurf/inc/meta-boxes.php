<?php
/**
 * Package detail fields (price, duration, group size, booking link).
 *
 * Implemented with core meta boxes so the theme has no plugin dependency.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * The package fields, in the order they render.
 *
 * @return array<string, array<string, string>>
 */
function pts_package_fields() {
	return array(
		'_pts_price'        => array(
			'label' => __( 'Price', 'palmtreesurf' ),
			'type'  => 'text',
			'hint'  => __( 'Digits only, no currency symbol. Example: 85', 'palmtreesurf' ),
		),
		'_pts_price_suffix' => array(
			'label' => __( 'Price suffix', 'palmtreesurf' ),
			'type'  => 'text',
			'hint'  => __( 'Shown after the price. Example: per person', 'palmtreesurf' ),
		),
		'_pts_duration'     => array(
			'label' => __( 'Duration', 'palmtreesurf' ),
			'type'  => 'text',
			'hint'  => __( 'Example: 2 hours', 'palmtreesurf' ),
		),
		'_pts_group_size'   => array(
			'label' => __( 'Group size', 'palmtreesurf' ),
			'type'  => 'text',
			'hint'  => __( 'Example: Up to 4 surfers', 'palmtreesurf' ),
		),
		'_pts_includes'     => array(
			'label' => __( 'What is included', 'palmtreesurf' ),
			'type'  => 'textarea',
			'hint'  => __( 'One item per line. Rendered as a list on the package page.', 'palmtreesurf' ),
		),
		'_pts_booking_url'  => array(
			'label' => __( 'Booking link', 'palmtreesurf' ),
			'type'  => 'url',
			'hint'  => __( 'Leave empty to send visitors to the enquiry form instead.', 'palmtreesurf' ),
		),
	);
}

/**
 * Register the fields so they are revisioned and exposed to the REST API.
 */
function pts_register_package_meta() {
	foreach ( pts_package_fields() as $key => $field ) {
		register_post_meta(
			PTS_PACKAGE_POST_TYPE,
			$key,
			array(
				'single'            => true,
				'type'              => 'string',
				'show_in_rest'      => true,
				'sanitize_callback' => 'textarea' === $field['type'] ? 'sanitize_textarea_field' : ( 'url' === $field['type'] ? 'esc_url_raw' : 'sanitize_text_field' ),
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}
}
add_action( 'init', 'pts_register_package_meta' );

/**
 * Add the package details meta box.
 */
function pts_add_meta_boxes() {
	add_meta_box(
		'pts-package-details',
		__( 'Package Details', 'palmtreesurf' ),
		'pts_render_package_meta_box',
		PTS_PACKAGE_POST_TYPE,
		'side',
		'default'
	);
}
add_action( 'add_meta_boxes', 'pts_add_meta_boxes' );

/**
 * Render the package details meta box.
 *
 * @param WP_Post $post Post being edited.
 */
function pts_render_package_meta_box( $post ) {
	wp_nonce_field( 'pts_save_package', 'pts_package_nonce' );

	foreach ( pts_package_fields() as $key => $field ) {
		$value = get_post_meta( $post->ID, $key, true );
		$id    = 'pts-field-' . sanitize_key( $key );

		echo '<p class="pts-field">';
		printf(
			'<label for="%1$s"><strong>%2$s</strong></label><br />',
			esc_attr( $id ),
			esc_html( $field['label'] )
		);

		if ( 'textarea' === $field['type'] ) {
			printf(
				'<textarea id="%1$s" name="%2$s" rows="4" class="widefat">%3$s</textarea>',
				esc_attr( $id ),
				esc_attr( $key ),
				esc_textarea( $value )
			);
		} else {
			printf(
				'<input type="%1$s" id="%2$s" name="%3$s" value="%4$s" class="widefat" />',
				esc_attr( 'url' === $field['type'] ? 'url' : 'text' ),
				esc_attr( $id ),
				esc_attr( $key ),
				esc_attr( $value )
			);
		}

		printf( '<span class="description">%s</span>', esc_html( $field['hint'] ) );
		echo '</p>';
	}
}

/**
 * Persist the package details.
 *
 * @param int $post_id Post being saved.
 */
function pts_save_package_meta( $post_id ) {
	if ( ! isset( $_POST['pts_package_nonce'] ) ) {
		return;
	}

	$nonce = sanitize_text_field( wp_unslash( $_POST['pts_package_nonce'] ) );
	if ( ! wp_verify_nonce( $nonce, 'pts_save_package' ) ) {
		return;
	}

	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	foreach ( pts_package_fields() as $key => $field ) {
		if ( ! isset( $_POST[ $key ] ) ) {
			delete_post_meta( $post_id, $key );
			continue;
		}

		$raw = wp_unslash( $_POST[ $key ] );

		if ( 'textarea' === $field['type'] ) {
			$value = sanitize_textarea_field( $raw );
		} elseif ( 'url' === $field['type'] ) {
			$value = esc_url_raw( $raw );
		} else {
			$value = sanitize_text_field( $raw );
		}

		if ( '' === $value ) {
			delete_post_meta( $post_id, $key );
		} else {
			update_post_meta( $post_id, $key, $value );
		}
	}
}
add_action( 'save_post_' . PTS_PACKAGE_POST_TYPE, 'pts_save_package_meta' );
