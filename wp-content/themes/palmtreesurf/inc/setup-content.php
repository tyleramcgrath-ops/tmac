<?php
/**
 * First-run content scaffold.
 *
 * A fresh WordPress install has no pages, no menus and no experiences, so the
 * theme would activate onto a blank site. This builds the whole structure once,
 * on activation, then records a flag and never touches it again — so nothing
 * the client edits afterwards is ever overwritten.
 *
 * Every business fact that is not known stays a {{PT_*}} placeholder or is left
 * empty. Prices and review counts are never invented: a wrong price on a real
 * booking page is worse than a missing one.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Copy an image bundled with the theme into the Media Library.
 *
 * @param string $filename File in assets/images/src/.
 * @param string $alt      Alt text.
 * @return int Attachment ID, or 0 on failure.
 */
function pt_sideload_theme_image( $filename, $alt = '' ) {
	$source = PT_DIR . 'assets/images/src/' . $filename;

	if ( ! file_exists( $source ) ) {
		return 0;
	}

	// Reuse an existing copy rather than duplicating on every call.
	$existing = get_posts(
		array(
			'post_type'      => 'attachment',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_key'       => '_pt_seed_source', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_value'     => $filename, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
		)
	);

	if ( $existing ) {
		return (int) $existing[0];
	}

	require_once ABSPATH . 'wp-admin/includes/image.php';
	require_once ABSPATH . 'wp-admin/includes/file.php';

	$uploads = wp_upload_dir();

	if ( ! empty( $uploads['error'] ) ) {
		return 0;
	}

	$target = trailingslashit( $uploads['path'] ) . wp_unique_filename( $uploads['path'], $filename );

	if ( ! copy( $source, $target ) ) {
		return 0;
	}

	$filetype = wp_check_filetype( basename( $target ), null );

	$attachment_id = wp_insert_attachment(
		array(
			'guid'           => trailingslashit( $uploads['url'] ) . basename( $target ),
			'post_mime_type' => $filetype['type'],
			'post_title'     => sanitize_file_name( pathinfo( $filename, PATHINFO_FILENAME ) ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		),
		$target
	);

	if ( is_wp_error( $attachment_id ) || ! $attachment_id ) {
		return 0;
	}

	wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, $target ) );
	update_post_meta( $attachment_id, '_wp_attachment_image_alt', $alt );
	update_post_meta( $attachment_id, '_pt_seed_source', $filename );

	return (int) $attachment_id;
}

/**
 * Create a page if one with that slug does not exist.
 *
 * @param string $title    Page title.
 * @param string $slug     Page slug.
 * @param string $content  Block content.
 * @param string $template Page template file, relative to the theme.
 * @return int Page ID.
 */
function pt_seed_page( $title, $slug, $content = '', $template = '' ) {
	$existing = get_page_by_path( $slug );

	if ( $existing ) {
		return (int) $existing->ID;
	}

	$page_id = wp_insert_post(
		array(
			'post_type'    => 'page',
			'post_title'   => $title,
			'post_name'    => $slug,
			'post_content' => $content,
			'post_status'  => 'publish',
		)
	);

	if ( is_wp_error( $page_id ) || ! $page_id ) {
		return 0;
	}

	if ( $template ) {
		update_post_meta( $page_id, '_wp_page_template', $template );
	}

	// Stamp what the theme wrote, so a later update can tell edits apart.
	if ( $content && function_exists( 'pt_stamp_seeded' ) ) {
		pt_stamp_seeded( $page_id, $content );
	}

	return (int) $page_id;
}

/**
 * The experiences seeded on first run.
 *
 * The three surf lessons carry the names and review figures from the live site.
 * The rest are structural starters with no invented price or rating — those are
 * listed in TODO-CONTENT.md for someone who knows the real numbers.
 *
 * @return array<int, array<string, mixed>>
 */
function pt_seed_experiences() {
	return array(
		array(
			'title'    => __( 'Surf Lesson — Beginner', 'palmtreesurf' ),
			'excerpt'  => __( 'Learn the fundamentals with certified instructors on a forgiving sandbar break.', 'palmtreesurf' ),
			'type'     => __( 'Surf Lessons', 'palmtreesurf' ),
			'level'    => __( 'First Timer', 'palmtreesurf' ),
			'badge'    => __( 'Most Popular', 'palmtreesurf' ),
			'rating'   => '4.9',
			'reviews'  => '342',
			'duration' => __( '2 hours', 'palmtreesurf' ),
			'group'    => __( 'Up to 6 guests', 'palmtreesurf' ),
			'image'    => 'group-lesson-beach.jpg',
			'alt'      => __( 'Beginner surf lesson group on the beach at Tamarindo', 'palmtreesurf' ),
			'includes' => array(
				__( 'Soft-top board sized to you', 'palmtreesurf' ),
				__( 'Rash guard and reef-safe sunscreen', 'palmtreesurf' ),
				__( 'Beach safety and pop-up coaching', 'palmtreesurf' ),
				__( 'Photos of your session', 'palmtreesurf' ),
			),
			'bring'    => array(
				__( 'Swimwear and a towel', 'palmtreesurf' ),
				__( 'Water bottle', 'palmtreesurf' ),
			),
			'itinerary' => array(
				__( 'Arrival | Meet your guide, get sized for a board', 'palmtreesurf' ),
				__( 'On the sand | Safety briefing and pop-up practice', 'palmtreesurf' ),
				__( 'In the water | Guided waves with in-water corrections', 'palmtreesurf' ),
				__( 'Wrap up | Photos and what to work on next', 'palmtreesurf' ),
			),
			'faq'      => array(
				__( 'Do I need to be a strong swimmer? | You should be comfortable in waist-deep water. Tell us about any non-swimmers and we will adjust.', 'palmtreesurf' ),
				__( 'What if the surf is too big? | Your guide moves the group to a sheltered peak, or reschedules at no cost.', 'palmtreesurf' ),
			),
		),
		array(
			'title'    => __( 'Surf Lesson — Intermediate', 'palmtreesurf' ),
			'excerpt'  => __( 'Refine your technique, read waves better and start surfing on the shoulder.', 'palmtreesurf' ),
			'type'     => __( 'Surf Lessons', 'palmtreesurf' ),
			'level'    => __( 'Intermediate', 'palmtreesurf' ),
			'rating'   => '4.8',
			'reviews'  => '189',
			'duration' => __( '2 hours', 'palmtreesurf' ),
			'group'    => __( 'Up to 4 guests', 'palmtreesurf' ),
			'image'    => 'instructor-popup-stance.jpg',
			'alt'      => __( 'Instructor demonstrating the pop-up stance on a surfboard', 'palmtreesurf' ),
			'includes' => array(
				__( 'Board matched to your level', 'palmtreesurf' ),
				__( 'Wave selection and paddling technique', 'palmtreesurf' ),
				__( 'Video or photo feedback', 'palmtreesurf' ),
			),
		),
		array(
			'title'    => __( 'Private Surf Coaching', 'palmtreesurf' ),
			'excerpt'  => __( 'One-on-one sessions tailored to exactly what you want to improve.', 'palmtreesurf' ),
			'type'     => __( 'Private & Custom', 'palmtreesurf' ),
			'level'    => __( 'All Levels', 'palmtreesurf' ),
			'badge'    => __( 'Premium', 'palmtreesurf' ),
			'rating'   => '5',
			'reviews'  => '127',
			'duration' => __( '90 minutes', 'palmtreesurf' ),
			'group'    => __( 'Private, 1 guest', 'palmtreesurf' ),
			'image'    => 'group-instruction-sand.jpg',
			'alt'      => __( 'Small group receiving surf instruction on the sand', 'palmtreesurf' ),
			'includes' => array(
				__( 'Dedicated coach for the whole session', 'palmtreesurf' ),
				__( 'Session plan built around your goals', 'palmtreesurf' ),
			),
		),
		array(
			'title'    => __( 'Fishing Charter', 'palmtreesurf' ),
			'excerpt'  => __( 'Half and full-day charters off the Guanacaste coast with local captains.', 'palmtreesurf' ),
			'type'     => __( 'Fishing Charters', 'palmtreesurf' ),
			'level'    => __( 'All Levels', 'palmtreesurf' ),
			'duration' => __( 'Half or full day', 'palmtreesurf' ),
			'image'    => 'kayak-surf-tent.jpg',
			'alt'      => __( 'Boats and gear at the beach launch point', 'palmtreesurf' ),
			'includes' => array(
				__( 'Rods, tackle and bait', 'palmtreesurf' ),
				__( 'Captain and mate', 'palmtreesurf' ),
				__( 'Water and soft drinks', 'palmtreesurf' ),
			),
		),
		array(
			'title'    => __( 'Sunset Boat Tour', 'palmtreesurf' ),
			'excerpt'  => __( 'Cruise the coastline as the light drops, with a swim and snorkel stop.', 'palmtreesurf' ),
			'type'     => __( 'Boat Tours', 'palmtreesurf' ),
			'level'    => __( 'All Levels', 'palmtreesurf' ),
			'duration' => __( '2.5 hours', 'palmtreesurf' ),
			'includes' => array(
				__( 'Snorkel gear', 'palmtreesurf' ),
				__( 'Drinks and fresh fruit', 'palmtreesurf' ),
			),
		),
		array(
			'title'    => __( 'Estuary & Wildlife Trip', 'palmtreesurf' ),
			'excerpt'  => __( 'Paddle the mangroves at first light, when the birds and howlers are loudest.', 'palmtreesurf' ),
			'type'     => __( 'Wildlife & Nature', 'palmtreesurf' ),
			'level'    => __( 'All Levels', 'palmtreesurf' ),
			'duration' => __( '3 hours', 'palmtreesurf' ),
			'includes' => array(
				__( 'Kayak or paddleboard and life vest', 'palmtreesurf' ),
				__( 'Naturalist guide', 'palmtreesurf' ),
			),
		),
	);
}

/**
 * Build the whole starter site. Runs once.
 */
function pt_seed_content() {
	if ( get_option( 'pt_content_seeded' ) ) {
		return;
	}

	// Mark it done first, so a fatal midway cannot loop the seeder on reload.
	update_option( 'pt_content_seeded', 1 );

	pt_seed_terms();

	/* ---------------------------------------------------------- Pages */

	$home_id = pt_seed_page(
		__( 'Home', 'palmtreesurf' ),
		'home',
		''
	);

	$blog_id    = pt_seed_page( __( 'Journal', 'palmtreesurf' ), 'journal' );
	$about_id   = pt_seed_page( __( 'About', 'palmtreesurf' ), 'about', pt_seed_about_body(), 'page-templates/page-about.php' );
	$gallery_id = pt_seed_page( __( 'Gallery', 'palmtreesurf' ), 'gallery', '', 'page-templates/page-gallery.php' );
	$operator_id = pt_seed_page(
		__( 'List Your Tours', 'palmtreesurf' ),
		'list-your-tours',
		pt_seed_operators_body(),
		'page-templates/page-operators.php'
	);
	$contact_id = pt_seed_page(
		__( 'Contact', 'palmtreesurf' ),
		'contact',
		pt_seed_contact_body(),
		'page-templates/page-contact.php'
	);
	$privacy_id = pt_seed_page(
		__( 'Privacy Policy', 'palmtreesurf' ),
		'privacy-policy',
		'<!-- wp:paragraph --><p>' . esc_html__( 'Replace this with your privacy policy. It must describe what the booking form collects and how long you keep it.', 'palmtreesurf' ) . '</p><!-- /wp:paragraph -->'
	);

	if ( $home_id ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $home_id );
	}

	if ( $blog_id ) {
		update_option( 'page_for_posts', $blog_id );
	}

	if ( $privacy_id ) {
		update_option( 'wp_page_for_privacy_policy', $privacy_id );
	}

	/* ---------------------------------------------------- Experiences */

	$first_image = 0;

	foreach ( pt_seed_experiences() as $index => $item ) {
		if ( get_page_by_path( sanitize_title( $item['title'] ), OBJECT, PT_EXPERIENCE_POST_TYPE ) ) {
			continue;
		}

		$slug   = sanitize_title( $item['title'] );
		$bodies = pt_seed_bodies();
		$body   = isset( $bodies[ $slug ] )
			? $bodies[ $slug ]
			: '<!-- wp:paragraph --><p>' . esc_html( isset( $item['excerpt'] ) ? $item['excerpt'] : '' ) . '</p><!-- /wp:paragraph -->';

		$post_id = wp_insert_post(
			array(
				'post_type'    => PT_EXPERIENCE_POST_TYPE,
				'post_title'   => $item['title'],
				'post_name'    => $slug,
				'post_excerpt' => isset( $item['excerpt'] ) ? $item['excerpt'] : '',
				'post_content' => $body,
				'post_status'  => 'publish',
				'menu_order'   => $index,
			)
		);

		if ( is_wp_error( $post_id ) || ! $post_id ) {
			continue;
		}

		if ( ! empty( $item['type'] ) ) {
			wp_set_object_terms( $post_id, $item['type'], 'experience_type' );
		}

		if ( ! empty( $item['level'] ) ) {
			wp_set_object_terms( $post_id, $item['level'], 'skill_level' );
		}

		$fields = array(
			'duration'     => isset( $item['duration'] ) ? $item['duration'] : '',
			'group_size'   => isset( $item['group'] ) ? $item['group'] : '',
			'badge'        => isset( $item['badge'] ) ? $item['badge'] : '',
			'rating'       => isset( $item['rating'] ) ? $item['rating'] : '',
			'review_count' => isset( $item['reviews'] ) ? $item['reviews'] : '',
			'price_suffix' => __( 'per person', 'palmtreesurf' ),
			'includes'     => isset( $item['includes'] ) ? implode( "\n", $item['includes'] ) : '',
			'bring'        => isset( $item['bring'] ) ? implode( "\n", $item['bring'] ) : '',
			'itinerary'    => isset( $item['itinerary'] ) ? implode( "\n", $item['itinerary'] ) : '',
			'faq'          => isset( $item['faq'] ) ? implode( "\n", $item['faq'] ) : '',
		);

		foreach ( $fields as $key => $value ) {
			if ( '' !== $value ) {
				update_post_meta( $post_id, '_pt_' . $key, $value );
			}
		}

		// A sensible default schedule so availability works out of the box.
		update_post_meta( $post_id, '_ptb_sched_days', '0,1,2,3,4,5,6' );
		update_post_meta( $post_id, '_ptb_sched_times', "07:00\n09:30\n14:00" );
		update_post_meta( $post_id, '_ptb_sched_capacity', 6 );
		update_post_meta( $post_id, '_ptb_sched_lead', 12 );
		update_post_meta( $post_id, '_ptb_sched_window', 365 );

		if ( ! empty( $item['image'] ) ) {
			$attachment_id = pt_sideload_theme_image( $item['image'], isset( $item['alt'] ) ? $item['alt'] : '' );

			if ( $attachment_id ) {
				set_post_thumbnail( $post_id, $attachment_id );

				if ( ! $first_image ) {
					$first_image = $attachment_id;
				}
			}
		}
	}

	/*
	 * The hero is NOT pinned to a seeded photo. Those uploads are portrait 3:4
	 * and the hero slot is a full-bleed landscape; the manifest ships a proper
	 * landscape plate for it. Leaving this unset lets the manifest win, while a
	 * hero image the client picks themselves still overrides everything.
	 */
	unset( $first_image );

	/* ---------------------------------------------------- Instructors */

	$instructors = array(
		array( __( 'Lead Instructor', 'palmtreesurf' ), __( 'Head Coach', 'palmtreesurf' ), __( 'Grew up on this beach and has been coaching here for years.', 'palmtreesurf' ) ),
		array( __( 'Surf Guide', 'palmtreesurf' ), __( 'Instructor', 'palmtreesurf' ), __( 'Specialises in first-timers and nervous beginners.', 'palmtreesurf' ) ),
		array( __( 'Boat Captain', 'palmtreesurf' ), __( 'Captain', 'palmtreesurf' ), __( 'Runs the fishing charters and sunset tours.', 'palmtreesurf' ) ),
		array( __( 'Naturalist Guide', 'palmtreesurf' ), __( 'Guide', 'palmtreesurf' ), __( 'Leads the estuary and mangrove wildlife trips.', 'palmtreesurf' ) ),
	);

	foreach ( $instructors as $index => $person ) {
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'instructor',
				'post_title'  => $person[0],
				'post_status' => 'publish',
				'menu_order'  => $index,
			)
		);

		if ( ! is_wp_error( $post_id ) && $post_id ) {
			update_post_meta( $post_id, '_pt_role', $person[1] );
			update_post_meta( $post_id, '_pt_bio_short', $person[2] );
		}
	}

	/* ---------------------------------------------------- Testimonials */

	/*
	 * Placeholder reviews, clearly labelled as samples. Real guest quotes and
	 * ratings must replace these before launch — see TODO-CONTENT.md. Nothing
	 * here claims to be a real review.
	 */
	$testimonials = array(
		array( __( 'Sample Review — replace', 'palmtreesurf' ), __( 'Replace this with a real guest review. Keep it to two or three sentences and name the experience they booked.', 'palmtreesurf' ), '5', __( 'City, Country', 'palmtreesurf' ) ),
		array( __( 'Sample Review — replace', 'palmtreesurf' ), __( 'Replace this with a real guest review. Reviews mentioning a specific guide or moment convert best.', 'palmtreesurf' ), '5', __( 'City, Country', 'palmtreesurf' ) ),
		array( __( 'Sample Review — replace', 'palmtreesurf' ), __( 'Replace this with a real guest review from Google or Tripadvisor, with permission.', 'palmtreesurf' ), '5', __( 'City, Country', 'palmtreesurf' ) ),
	);

	foreach ( $testimonials as $index => $review ) {
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'testimonial',
				'post_title'  => $review[0],
				'post_status' => 'publish',
				'menu_order'  => $index,
			)
		);

		if ( ! is_wp_error( $post_id ) && $post_id ) {
			update_post_meta( $post_id, '_pt_quote', $review[1] );
			update_post_meta( $post_id, '_pt_rating', $review[2] );
			update_post_meta( $post_id, '_pt_origin', $review[3] );
		}
	}

	/* ----------------------------------------------------------- Menus */

	pt_seed_menus(
		array(
			'experiences' => get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ),
			'about'       => $about_id,
			'gallery'     => $gallery_id,
			'operators'   => $operator_id,
			'journal'     => $blog_id,
			'contact'     => $contact_id,
			'privacy'     => $privacy_id,
		)
	);

	flush_rewrite_rules();
}

/**
 * Create and assign the three menus.
 *
 * @param array $refs Page IDs and URLs to link.
 */
function pt_seed_menus( $refs ) {
	$locations = get_theme_mod( 'nav_menu_locations', array() );

	/* Primary */
	if ( ! has_nav_menu( 'primary' ) ) {
		$menu_id = wp_create_nav_menu( __( 'Primary', 'palmtreesurf' ) );

		if ( ! is_wp_error( $menu_id ) ) {
			$parent = wp_update_nav_menu_item(
				$menu_id,
				0,
				array(
					'menu-item-title'  => __( 'Experiences', 'palmtreesurf' ),
					'menu-item-url'    => $refs['experiences'],
					'menu-item-status' => 'publish',
				)
			);

			$types = get_terms(
				array(
					'taxonomy'   => 'experience_type',
					'hide_empty' => false,
				)
			);

			if ( $types && ! is_wp_error( $types ) && ! is_wp_error( $parent ) ) {
				foreach ( $types as $term ) {
					wp_update_nav_menu_item(
						$menu_id,
						0,
						array(
							'menu-item-title'     => $term->name,
							'menu-item-object'    => 'experience_type',
							'menu-item-object-id' => $term->term_id,
							'menu-item-type'      => 'taxonomy',
							'menu-item-parent-id' => $parent,
							'menu-item-status'    => 'publish',
						)
					);
				}
			}

			foreach ( array( 'about', 'gallery', 'journal', 'contact' ) as $key ) {
				if ( empty( $refs[ $key ] ) ) {
					continue;
				}

				wp_update_nav_menu_item(
					$menu_id,
					0,
					array(
						'menu-item-object'    => 'page',
						'menu-item-object-id' => (int) $refs[ $key ],
						'menu-item-type'      => 'post_type',
						'menu-item-status'    => 'publish',
					)
				);
			}

			$locations['primary'] = $menu_id;
		}
	}

	/* Footer */
	if ( ! has_nav_menu( 'footer' ) ) {
		$menu_id = wp_create_nav_menu( __( 'Footer', 'palmtreesurf' ) );

		if ( ! is_wp_error( $menu_id ) ) {
			foreach ( array( 'about', 'gallery', 'journal', 'contact', 'privacy' ) as $key ) {
				if ( empty( $refs[ $key ] ) ) {
					continue;
				}

				wp_update_nav_menu_item(
					$menu_id,
					0,
					array(
						'menu-item-object'    => 'page',
						'menu-item-object-id' => (int) $refs[ $key ],
						'menu-item-type'      => 'post_type',
						'menu-item-status'    => 'publish',
					)
				);
			}

			$locations['footer'] = $menu_id;
		}
	}

	/* Legal */
	if ( ! has_nav_menu( 'legal' ) && ! empty( $refs['privacy'] ) ) {
		$menu_id = wp_create_nav_menu( __( 'Legal', 'palmtreesurf' ) );

		if ( ! is_wp_error( $menu_id ) ) {
			wp_update_nav_menu_item(
				$menu_id,
				0,
				array(
					'menu-item-object'    => 'page',
					'menu-item-object-id' => (int) $refs['privacy'],
					'menu-item-type'      => 'post_type',
					'menu-item-status'    => 'publish',
				)
			);

			$locations['legal'] = $menu_id;
		}
	}

	set_theme_mod( 'nav_menu_locations', $locations );
}

/**
 * Seed after the post types exist, on activation only.
 */
function pt_maybe_seed_content() {
	pt_register_post_types();
	pt_register_taxonomies();
	pt_seed_content();
}
add_action( 'after_switch_theme', 'pt_maybe_seed_content', 20 );
