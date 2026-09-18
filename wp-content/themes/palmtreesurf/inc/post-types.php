<?php
/**
 * Surf packages: the bookable lessons, tours and custom experiences.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register the package post type and its taxonomies.
 */
function pts_register_post_types() {
	register_post_type(
		PTS_PACKAGE_POST_TYPE,
		array(
			'labels'        => array(
				'name'               => __( 'Surf Packages', 'palmtreesurf' ),
				'singular_name'      => __( 'Surf Package', 'palmtreesurf' ),
				'add_new_item'       => __( 'Add New Package', 'palmtreesurf' ),
				'edit_item'          => __( 'Edit Package', 'palmtreesurf' ),
				'new_item'           => __( 'New Package', 'palmtreesurf' ),
				'view_item'          => __( 'View Package', 'palmtreesurf' ),
				'search_items'       => __( 'Search Packages', 'palmtreesurf' ),
				'not_found'          => __( 'No packages yet.', 'palmtreesurf' ),
				'not_found_in_trash' => __( 'No packages in the trash.', 'palmtreesurf' ),
				'all_items'          => __( 'All Packages', 'palmtreesurf' ),
				'menu_name'          => __( 'Packages', 'palmtreesurf' ),
			),
			'public'        => true,
			'has_archive'   => 'packages',
			'rewrite'       => array(
				'slug'       => 'packages',
				'with_front' => false,
			),
			'menu_icon'     => 'dashicons-palmtree',
			'menu_position' => 20,
			'supports'      => array( 'title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'page-attributes' ),
			'show_in_rest'  => true,
			'rest_base'     => 'packages',
		)
	);

	register_taxonomy(
		'pts_package_type',
		PTS_PACKAGE_POST_TYPE,
		array(
			'labels'            => array(
				'name'          => __( 'Package Types', 'palmtreesurf' ),
				'singular_name' => __( 'Package Type', 'palmtreesurf' ),
				'add_new_item'  => __( 'Add New Package Type', 'palmtreesurf' ),
				'menu_name'     => __( 'Types', 'palmtreesurf' ),
			),
			'public'            => true,
			'hierarchical'      => true,
			'show_admin_column' => true,
			'show_in_rest'      => true,
			'rewrite'           => array(
				'slug'       => 'package-type',
				'with_front' => false,
			),
		)
	);

	register_taxonomy(
		'pts_skill_level',
		PTS_PACKAGE_POST_TYPE,
		array(
			'labels'            => array(
				'name'          => __( 'Skill Levels', 'palmtreesurf' ),
				'singular_name' => __( 'Skill Level', 'palmtreesurf' ),
				'add_new_item'  => __( 'Add New Skill Level', 'palmtreesurf' ),
				'menu_name'     => __( 'Skill Levels', 'palmtreesurf' ),
			),
			'public'            => true,
			'hierarchical'      => false,
			'show_admin_column' => true,
			'show_in_rest'      => true,
			'rewrite'           => array(
				'slug'       => 'skill-level',
				'with_front' => false,
			),
		)
	);
}
add_action( 'init', 'pts_register_post_types' );

/**
 * Seed the starter taxonomy terms the first time the theme is activated.
 *
 * Only ever runs once, and never overwrites terms the client has edited.
 */
function pts_seed_terms() {
	if ( get_option( 'pts_terms_seeded' ) ) {
		return;
	}

	$seed = array(
		'pts_package_type' => array(
			__( 'Surf Lessons', 'palmtreesurf' ),
			__( 'Ocean Tours', 'palmtreesurf' ),
			__( 'Custom Experiences', 'palmtreesurf' ),
		),
		'pts_skill_level'  => array(
			__( 'Beginner', 'palmtreesurf' ),
			__( 'Intermediate', 'palmtreesurf' ),
			__( 'Advanced', 'palmtreesurf' ),
			__( 'All Levels', 'palmtreesurf' ),
		),
	);

	foreach ( $seed as $taxonomy => $terms ) {
		foreach ( $terms as $term ) {
			if ( ! term_exists( $term, $taxonomy ) ) {
				wp_insert_term( $term, $taxonomy );
			}
		}
	}

	update_option( 'pts_terms_seeded', 1 );
}

/**
 * Flush rewrite rules once on activation so /packages/ resolves immediately.
 */
function pts_on_activation() {
	pts_register_post_types();
	pts_seed_terms();
	flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'pts_on_activation' );

/**
 * Leave the permalink table clean for the next theme.
 */
function pts_on_deactivation() {
	flush_rewrite_rules();
}
add_action( 'switch_theme', 'pts_on_deactivation' );
