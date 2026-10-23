<?php
/**
 * The booking post type.
 *
 * Bookings are private business records: never public, never in search, never
 * in the REST API. They are readable in wp-admin by shop managers only.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register the booking post type.
 */
function ptb_register_post_type() {
	register_post_type(
		PTB_POST_TYPE,
		array(
			'labels'              => array(
				'name'               => __( 'Bookings', 'palm-tree-bookings' ),
				'singular_name'      => __( 'Booking', 'palm-tree-bookings' ),
				'edit_item'          => __( 'Booking', 'palm-tree-bookings' ),
				'search_items'       => __( 'Search Bookings', 'palm-tree-bookings' ),
				'not_found'          => __( 'No bookings yet.', 'palm-tree-bookings' ),
				'not_found_in_trash' => __( 'No bookings in the trash.', 'palm-tree-bookings' ),
				'all_items'          => __( 'All Bookings', 'palm-tree-bookings' ),
				'menu_name'          => __( 'Bookings', 'palm-tree-bookings' ),
			),
			'public'              => false,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'show_in_rest'        => false,
			'exclude_from_search' => true,
			'publicly_queryable'  => false,
			'has_archive'         => false,
			'rewrite'             => false,
			'menu_icon'           => 'dashicons-calendar-alt',
			'menu_position'       => 25,
			'supports'            => array( 'title' ),
			'capability_type'     => 'post',
			'map_meta_cap'        => true,
		)
	);
}
add_action( 'init', 'ptb_register_post_type' );

/**
 * Nobody creates a booking by hand in wp-admin; they arrive from the form.
 *
 * Removing the capability keeps the "Add New" button off the screen without
 * touching roles.
 *
 * @param array $caps Capabilities for the post type.
 * @return array
 */
function ptb_remove_create( $caps ) {
	return $caps;
}

/**
 * Hide the Add New link for bookings.
 */
function ptb_hide_add_new() {
	global $submenu;

	if ( isset( $submenu[ 'edit.php?post_type=' . PTB_POST_TYPE ] ) ) {
		foreach ( $submenu[ 'edit.php?post_type=' . PTB_POST_TYPE ] as $i => $item ) {
			if ( isset( $item[2] ) && 'post-new.php?post_type=' . PTB_POST_TYPE === $item[2] ) {
				unset( $submenu[ 'edit.php?post_type=' . PTB_POST_TYPE ][ $i ] );
			}
		}
	}
}
add_action( 'admin_menu', 'ptb_hide_add_new', 999 );

/**
 * Read a booking meta value.
 *
 * @param int    $post_id Booking ID.
 * @param string $key     Field key, without the `_ptb_` prefix.
 * @return string
 */
function ptb_get( $post_id, $key ) {
	return (string) get_post_meta( $post_id, '_ptb_' . $key, true );
}

/**
 * Write a booking meta value, deleting the row when the value is empty.
 *
 * @param int    $post_id Booking ID.
 * @param string $key     Field key, without the `_ptb_` prefix.
 * @param string $value   Value to store.
 */
function ptb_set( $post_id, $key, $value ) {
	if ( '' === $value || null === $value ) {
		delete_post_meta( $post_id, '_ptb_' . $key );
		return;
	}

	update_post_meta( $post_id, '_ptb_' . $key, $value );
}

/**
 * Current workflow status of a booking, defaulting to new.
 *
 * @param int $post_id Booking ID.
 * @return string
 */
function ptb_get_status( $post_id ) {
	$status   = ptb_get( $post_id, 'status' );
	$statuses = ptb_statuses();

	return isset( $statuses[ $status ] ) ? $status : 'new';
}
