<?php
/**
 * "Experience" post type (charter experiences) and its details meta box.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', 'popeye_register_experiences' );
/**
 * Register the post type.
 */
function popeye_register_experiences() {
	register_post_type(
		'experience',
		array(
			'labels'       => array(
				'name'          => __( 'Experiences', 'popeye-charters' ),
				'singular_name' => __( 'Experience', 'popeye-charters' ),
				'add_new_item'  => __( 'Add New Experience', 'popeye-charters' ),
				'edit_item'     => __( 'Edit Experience', 'popeye-charters' ),
				'all_items'     => __( 'All Experiences', 'popeye-charters' ),
				'menu_name'     => __( 'Experiences', 'popeye-charters' ),
			),
			'public'       => true,
			'has_archive'  => 'experiences',
			'rewrite'      => array(
				'slug'       => 'experiences',
				'with_front' => false,
			),
			'menu_icon'    => 'dashicons-palmtree',
			'menu_position' => 20,
			'show_in_rest' => true,
			'supports'     => array( 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes' ),
		)
	);
}

add_action( 'pre_get_posts', 'popeye_experience_order' );
/**
 * Show experiences in menu order on the archive.
 *
 * @param WP_Query $q Query.
 */
function popeye_experience_order( $q ) {
	if ( ! is_admin() && $q->is_main_query() && $q->is_post_type_archive( 'experience' ) ) {
		$q->set( 'orderby', array( 'menu_order' => 'ASC', 'title' => 'ASC' ) );
		$q->set( 'posts_per_page', 50 );
	}
}

/**
 * Meta fields for an experience: key => [label, type, help].
 *
 * @return array
 */
function popeye_experience_fields() {
	return array(
		'tagline'           => array( __( 'Tagline', 'popeye-charters' ), 'text', __( 'e.g. "Golden hour on the water"', 'popeye-charters' ) ),
		'duration_short'    => array( __( 'Duration (card badge)', 'popeye-charters' ), 'text', __( 'e.g. "2–3 hrs"', 'popeye-charters' ) ),
		'duration'          => array( __( 'Duration (detail bar)', 'popeye-charters' ), 'text', '' ),
		'capacity'          => array( __( 'Capacity', 'popeye-charters' ), 'text', '' ),
		'perfect_for_short' => array( __( 'Perfect for (detail bar)', 'popeye-charters' ), 'text', '' ),
		'perfect_for'       => array( __( 'Perfect for (sidebar text)', 'popeye-charters' ), 'textarea', '' ),
		'highlights'        => array( __( 'What makes this special', 'popeye-charters' ), 'textarea', __( 'One per line: Title | Description', 'popeye-charters' ) ),
		'included'          => array( __( "What's included", 'popeye-charters' ), 'textarea', __( 'One item per line', 'popeye-charters' ) ),
		'gallery'           => array( __( 'Gallery', 'popeye-charters' ), 'textarea', __( 'One per line: image URL | caption (a bundled theme image name also works)', 'popeye-charters' ) ),
		'quote'             => array( __( 'Guest quote', 'popeye-charters' ), 'textarea', '' ),
		'quote_cite'        => array( __( 'Quote attribution', 'popeye-charters' ), 'text', '' ),
		'cta_label'         => array( __( 'Booking button label', 'popeye-charters' ), 'text', __( 'e.g. "Book the Sunset Cruise"', 'popeye-charters' ) ),
		'hero_image'        => array( __( 'Fallback hero image', 'popeye-charters' ), 'text', __( 'Used only when no Featured Image is set. URL or bundled theme image name.', 'popeye-charters' ) ),
	);
}

/**
 * Read an experience meta value.
 *
 * @param string   $key  Field key.
 * @param int|null $post Post ID.
 * @return string
 */
function popeye_exp( $key, $post = null ) {
	return (string) get_post_meta( $post ? $post : get_the_ID(), '_popeye_' . $key, true );
}

/**
 * Image URL for an experience (featured image, falling back to the bundled image).
 *
 * @param int|null $post Post ID.
 * @param string   $size Image size.
 * @return string
 */
function popeye_exp_image( $post = null, $size = 'large' ) {
	$post = $post ? $post : get_the_ID();
	if ( has_post_thumbnail( $post ) ) {
		return (string) get_the_post_thumbnail_url( $post, $size );
	}
	$fallback = popeye_exp( 'hero_image', $post );
	return $fallback ? popeye_img( $fallback ) : popeye_img( 'public_4114_7215344bbf124e30a59b01153b1bd2d3' );
}

add_action( 'add_meta_boxes', 'popeye_experience_metabox' );
/**
 * Add the details meta box.
 */
function popeye_experience_metabox() {
	add_meta_box( 'popeye-experience', __( 'Experience Details', 'popeye-charters' ), 'popeye_experience_metabox_html', 'experience', 'normal', 'high' );
}

/**
 * Render the meta box.
 *
 * @param WP_Post $post Post.
 */
function popeye_experience_metabox_html( $post ) {
	wp_nonce_field( 'popeye_experience_save', 'popeye_experience_nonce' );
	echo '<table class="form-table" role="presentation"><tbody>';
	foreach ( popeye_experience_fields() as $key => $field ) {
		list( $label, $type, $help ) = $field;
		$id    = 'popeye_' . $key;
		$value = popeye_exp( $key, $post->ID );
		echo '<tr><th scope="row"><label for="' . esc_attr( $id ) . '">' . esc_html( $label ) . '</label></th><td>';
		if ( 'textarea' === $type ) {
			echo '<textarea class="large-text" rows="' . ( in_array( $key, array( 'highlights', 'included', 'gallery' ), true ) ? 6 : 3 ) . '" id="' . esc_attr( $id ) . '" name="' . esc_attr( $id ) . '">' . esc_textarea( $value ) . '</textarea>';
		} else {
			echo '<input type="text" class="regular-text" id="' . esc_attr( $id ) . '" name="' . esc_attr( $id ) . '" value="' . esc_attr( $value ) . '">';
		}
		if ( $help ) {
			echo '<p class="description">' . esc_html( $help ) . '</p>';
		}
		echo '</td></tr>';
	}
	echo '</tbody></table>';
}

add_action( 'save_post_experience', 'popeye_experience_save' );
/**
 * Save meta box values.
 *
 * @param int $post_id Post ID.
 */
function popeye_experience_save( $post_id ) {
	if ( ! isset( $_POST['popeye_experience_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['popeye_experience_nonce'] ) ), 'popeye_experience_save' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	foreach ( popeye_experience_fields() as $key => $field ) {
		$name = 'popeye_' . $key;
		if ( ! isset( $_POST[ $name ] ) ) {
			continue;
		}
		$raw   = wp_unslash( $_POST[ $name ] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$value = 'textarea' === $field[1] ? sanitize_textarea_field( $raw ) : sanitize_text_field( $raw );
		update_post_meta( $post_id, '_popeye_' . $key, $value );
	}
}

add_filter( 'manage_experience_posts_columns', 'popeye_experience_columns' );
/**
 * Admin list columns.
 *
 * @param array $cols Columns.
 * @return array
 */
function popeye_experience_columns( $cols ) {
	$new = array();
	foreach ( $cols as $k => $v ) {
		$new[ $k ] = $v;
		if ( 'title' === $k ) {
			$new['popeye_duration'] = __( 'Duration', 'popeye-charters' );
			$new['popeye_order']    = __( 'Order', 'popeye-charters' );
		}
	}
	return $new;
}

add_action( 'manage_experience_posts_custom_column', 'popeye_experience_column_values', 10, 2 );
/**
 * Admin list column values.
 *
 * @param string $col     Column.
 * @param int    $post_id Post ID.
 */
function popeye_experience_column_values( $col, $post_id ) {
	if ( 'popeye_duration' === $col ) {
		echo esc_html( popeye_exp( 'duration', $post_id ) );
	} elseif ( 'popeye_order' === $col ) {
		echo (int) get_post_field( 'menu_order', $post_id );
	}
}
