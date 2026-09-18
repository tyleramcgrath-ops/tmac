<?php
/**
 * Content model: experiences, testimonials, instructors.
 *
 * Experiences are the whole product: surf lessons, fishing charters, boat
 * tours, wildlife trips and custom trips. Category is a taxonomy rather than a
 * hardcoded list, so adding a vertical later is a term, not a release.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register the post types.
 */
function pt_register_post_types() {
	register_post_type(
		PT_EXPERIENCE_POST_TYPE,
		array(
			'labels'        => array(
				'name'               => __( 'Experiences', 'palmtreesurf' ),
				'singular_name'      => __( 'Experience', 'palmtreesurf' ),
				'add_new_item'       => __( 'Add New Experience', 'palmtreesurf' ),
				'edit_item'          => __( 'Edit Experience', 'palmtreesurf' ),
				'new_item'           => __( 'New Experience', 'palmtreesurf' ),
				'view_item'          => __( 'View Experience', 'palmtreesurf' ),
				'search_items'       => __( 'Search Experiences', 'palmtreesurf' ),
				'not_found'          => __( 'No experiences yet.', 'palmtreesurf' ),
				'not_found_in_trash' => __( 'No experiences in the trash.', 'palmtreesurf' ),
				'all_items'          => __( 'All Experiences', 'palmtreesurf' ),
				'menu_name'          => __( 'Experiences', 'palmtreesurf' ),
			),
			'public'        => true,
			'has_archive'   => 'experiences',
			'rewrite'       => array(
				'slug'       => 'experiences',
				'with_front' => false,
			),
			'menu_icon'     => 'dashicons-palmtree',
			'menu_position' => 20,
			'supports'      => array( 'title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'page-attributes' ),
			'show_in_rest'  => true,
			'rest_base'     => 'experiences',
		)
	);

	register_post_type(
		'testimonial',
		array(
			'labels'        => array(
				'name'          => __( 'Testimonials', 'palmtreesurf' ),
				'singular_name' => __( 'Testimonial', 'palmtreesurf' ),
				'add_new_item'  => __( 'Add New Testimonial', 'palmtreesurf' ),
				'edit_item'     => __( 'Edit Testimonial', 'palmtreesurf' ),
				'all_items'     => __( 'Testimonials', 'palmtreesurf' ),
				'menu_name'     => __( 'Testimonials', 'palmtreesurf' ),
			),
			'public'        => false,
			'show_ui'       => true,
			'show_in_menu'  => true,
			'menu_icon'     => 'dashicons-format-quote',
			'menu_position' => 21,
			'supports'      => array( 'title', 'page-attributes' ),
			'show_in_rest'  => true,
		)
	);

	register_post_type(
		'instructor',
		array(
			'labels'        => array(
				'name'          => __( 'Instructors', 'palmtreesurf' ),
				'singular_name' => __( 'Instructor', 'palmtreesurf' ),
				'add_new_item'  => __( 'Add New Instructor', 'palmtreesurf' ),
				'edit_item'     => __( 'Edit Instructor', 'palmtreesurf' ),
				'all_items'     => __( 'Instructors', 'palmtreesurf' ),
				'menu_name'     => __( 'Instructors', 'palmtreesurf' ),
			),
			'public'        => false,
			'show_ui'       => true,
			'show_in_menu'  => true,
			'menu_icon'     => 'dashicons-groups',
			'menu_position' => 22,
			'supports'      => array( 'title', 'thumbnail', 'page-attributes' ),
			'show_in_rest'  => true,
		)
	);
}
add_action( 'init', 'pt_register_post_types', 10 );

/**
 * Register the experience taxonomies.
 */
function pt_register_taxonomies() {
	register_taxonomy(
		'experience_type',
		PT_EXPERIENCE_POST_TYPE,
		array(
			'labels'            => array(
				'name'          => __( 'Categories', 'palmtreesurf' ),
				'singular_name' => __( 'Category', 'palmtreesurf' ),
				'add_new_item'  => __( 'Add New Category', 'palmtreesurf' ),
				'menu_name'     => __( 'Categories', 'palmtreesurf' ),
			),
			'public'            => true,
			'hierarchical'      => true,
			'show_admin_column' => true,
			'show_in_rest'      => true,
			'rewrite'           => array(
				'slug'       => 'experiences/category',
				'with_front' => false,
			),
		)
	);

	register_taxonomy(
		'skill_level',
		PT_EXPERIENCE_POST_TYPE,
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
				'slug'       => 'experiences/level',
				'with_front' => false,
			),
		)
	);
}
add_action( 'init', 'pt_register_taxonomies', 9 );

/**
 * Starter taxonomy terms.
 *
 * Deliberately broader than surf. Food delivery, nightlife and transportation
 * are out of scope for this build, so they are not seeded — but nothing here
 * prevents adding them later as terms or as their own post type.
 *
 * @return array<string, array<int, string>>
 */
function pt_seed_terms_map() {
	return array(
		'experience_type' => array(
			__( 'Surf Lessons', 'palmtreesurf' ),
			__( 'Fishing Charters', 'palmtreesurf' ),
			__( 'Boat Tours', 'palmtreesurf' ),
			__( 'Wildlife & Nature', 'palmtreesurf' ),
			__( 'Adventure', 'palmtreesurf' ),
			__( 'Private & Custom', 'palmtreesurf' ),
		),
		'skill_level'     => array(
			__( 'All Levels', 'palmtreesurf' ),
			__( 'First Timer', 'palmtreesurf' ),
			__( 'Beginner', 'palmtreesurf' ),
			__( 'Intermediate', 'palmtreesurf' ),
			__( 'Advanced', 'palmtreesurf' ),
		),
	);
}

/**
 * Seed the starter terms once, and never overwrite client edits after that.
 */
function pt_seed_terms() {
	if ( get_option( 'pt_terms_seeded' ) ) {
		return;
	}

	foreach ( pt_seed_terms_map() as $taxonomy => $terms ) {
		foreach ( $terms as $term ) {
			if ( ! term_exists( $term, $taxonomy ) ) {
				wp_insert_term( $term, $taxonomy );
			}
		}
	}

	update_option( 'pt_terms_seeded', 1 );
}

/**
 * Register everything and flush permalinks once on activation.
 */
function pt_on_activation() {
	pt_register_taxonomies();
	pt_register_post_types();
	pt_seed_terms();

	// Defer the flush to the next init, once every rule is definitely registered.
	update_option( 'pt_needs_flush', 1 );
	flush_rewrite_rules();
}

/**
 * Force the taxonomy rules ahead of the post type's own rules.
 *
 * `experiences/category/<term>` sits underneath the `experiences` archive slug,
 * so WordPress's generated rule `experiences/([^/]+)` can swallow it and 404.
 * Registration order fixes that most of the time; an explicit rule added at the
 * top of the table fixes it every time, including when another plugin adds
 * rules after us.
 */
function pt_add_taxonomy_rules() {
	$map = array(
		'category' => 'experience_type',
		'level'    => 'skill_level',
	);

	foreach ( $map as $segment => $taxonomy ) {
		// Paged archive first: the more specific pattern must win.
		add_rewrite_rule(
			'^experiences/' . $segment . '/([^/]+)/page/?([0-9]{1,})/?$',
			'index.php?' . $taxonomy . '=$matches[1]&paged=$matches[2]',
			'top'
		);

		add_rewrite_rule(
			'^experiences/' . $segment . '/([^/]+)/?$',
			'index.php?' . $taxonomy . '=$matches[1]',
			'top'
		);
	}
}
add_action( 'init', 'pt_add_taxonomy_rules', 11 );

/**
 * Flush when the theme's version changes, not only when it is switched on.
 *
 * Uploading a new zip over an existing theme never fires `after_switch_theme`,
 * so an update would otherwise keep serving the old rewrite rules until someone
 * re-saved permalinks by hand. Comparing a stored version catches that.
 */
function pt_maybe_flush_on_update() {
	if ( get_option( 'pt_rules_version' ) === PT_VERSION ) {
		return;
	}

	update_option( 'pt_rules_version', PT_VERSION );
	flush_rewrite_rules();
}
add_action( 'init', 'pt_maybe_flush_on_update', 998 );

/**
 * Flush once on the first request after activation.
 *
 * Runs late on init so both taxonomies and post types have registered.
 */
function pt_maybe_flush() {
	if ( ! get_option( 'pt_needs_flush' ) ) {
		return;
	}

	delete_option( 'pt_needs_flush' );
	flush_rewrite_rules();
}
add_action( 'init', 'pt_maybe_flush', 999 );
add_action( 'after_switch_theme', 'pt_on_activation' );

/**
 * Leave the rewrite table clean for the next theme.
 */
function pt_on_deactivation() {
	flush_rewrite_rules();
}
add_action( 'switch_theme', 'pt_on_deactivation' );
