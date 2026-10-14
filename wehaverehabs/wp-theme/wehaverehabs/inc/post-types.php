<?php
/**
 * Sanctuary listings, inquiries and the taxonomies that organise them.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', 'whr_register_content_types' );

/**
 * Register post types and taxonomies.
 */
function whr_register_content_types() {
	register_post_type(
		'sanctuary',
		array(
			'labels'        => array(
				'name'               => __( 'Sanctuaries', 'wehaverehabs' ),
				'singular_name'      => __( 'Sanctuary', 'wehaverehabs' ),
				'add_new_item'       => __( 'Add new sanctuary', 'wehaverehabs' ),
				'edit_item'          => __( 'Edit sanctuary', 'wehaverehabs' ),
				'all_items'          => __( 'All sanctuaries', 'wehaverehabs' ),
				'search_items'       => __( 'Search sanctuaries', 'wehaverehabs' ),
				'not_found'          => __( 'No sanctuaries found.', 'wehaverehabs' ),
				'featured_image'     => __( 'Hero photo', 'wehaverehabs' ),
				'set_featured_image' => __( 'Set hero photo', 'wehaverehabs' ),
			),
			'public'        => true,
			'has_archive'   => 'sanctuaries',
			'rewrite'       => array( 'slug' => 'sanctuary', 'with_front' => false ),
			'menu_icon'     => 'dashicons-palmtree',
			'menu_position' => 5,
			'supports'      => array( 'title', 'editor', 'excerpt', 'thumbnail', 'revisions' ),
			'show_in_rest'  => true,
		)
	);

	register_post_type(
		'whr_inquiry',
		array(
			'labels'              => array(
				'name'          => __( 'Inquiries', 'wehaverehabs' ),
				'singular_name' => __( 'Inquiry', 'wehaverehabs' ),
				'edit_item'     => __( 'Inquiry', 'wehaverehabs' ),
				'all_items'     => __( 'All inquiries', 'wehaverehabs' ),
			),
			'public'              => false,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'menu_icon'           => 'dashicons-email-alt',
			'menu_position'       => 6,
			'supports'            => array( 'title', 'editor' ),
			'capability_type'     => 'post',
			'capabilities'        => array( 'create_posts' => 'do_not_allow' ),
			'map_meta_cap'        => true,
			'exclude_from_search' => true,
		)
	);

	$taxonomies = array(
		'destination' => array(
			'plural'       => __( 'Destinations', 'wehaverehabs' ),
			'singular'     => __( 'Destination', 'wehaverehabs' ),
			'slug'         => 'destinations',
			'hierarchical' => true,
		),
		'condition'   => array(
			'plural'       => __( 'What we help with', 'wehaverehabs' ),
			'singular'     => __( 'Condition', 'wehaverehabs' ),
			'slug'         => 'healing',
			'hierarchical' => true,
		),
		'care_level'  => array(
			'plural'       => __( 'Care levels', 'wehaverehabs' ),
			'singular'     => __( 'Care level', 'wehaverehabs' ),
			'slug'         => 'care',
			'hierarchical' => true,
		),
		'approach'    => array(
			'plural'       => __( 'Ways of healing', 'wehaverehabs' ),
			'singular'     => __( 'Way of healing', 'wehaverehabs' ),
			'slug'         => 'approach',
			'hierarchical' => true,
		),
		'setting'     => array(
			'plural'       => __( 'Settings', 'wehaverehabs' ),
			'singular'     => __( 'Setting', 'wehaverehabs' ),
			'slug'         => 'setting',
			'hierarchical' => true,
		),
	);

	foreach ( $taxonomies as $tax => $t ) {
		register_taxonomy(
			$tax,
			array( 'sanctuary' ),
			array(
				'labels'            => array(
					'name'          => $t['plural'],
					'singular_name' => $t['singular'],
					/* translators: %s: taxonomy singular name */
					'add_new_item'  => sprintf( __( 'Add %s', 'wehaverehabs' ), $t['singular'] ),
				),
				'hierarchical'      => $t['hierarchical'],
				'public'            => true,
				'show_admin_column' => true,
				'show_in_rest'      => true,
				'rewrite'           => array( 'slug' => $t['slug'], 'with_front' => false, 'hierarchical' => true ),
			)
		);
	}
}

/** Flush permalinks once after the theme is switched on, so the new URLs work immediately. */
add_action(
	'after_switch_theme',
	function () {
		whr_register_content_types();
		flush_rewrite_rules();
	}
);
