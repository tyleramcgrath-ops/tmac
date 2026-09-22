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
			'title'    => __( 'Private Surf Lesson', 'palmtreesurf' ),
			'excerpt'  => __( 'Two hours of one-to-one coaching, pitched at exactly where your surfing is.', 'palmtreesurf' ),
			'type'     => __( 'Surf Lessons', 'palmtreesurf' ),
			'level'    => __( 'All Levels', 'palmtreesurf' ),
			'duration' => __( '2 hours', 'palmtreesurf' ),
			'group'    => __( '1 guest', 'palmtreesurf' ),
			'image'    => 'group-instruction-sand.jpg',
			'alt'      => __( 'Surf instructor coaching a student on the sand at Tamarindo', 'palmtreesurf' ),
			'includes' => array(
				__( 'Your own instructor for the full two hours', 'palmtreesurf' ),
				__( 'Board and rash guard sized to you', 'palmtreesurf' ),
				__( 'Departs Tamarindo — hotel pickup can be arranged', 'palmtreesurf' ),
			),
			'bring'    => array(
				__( 'Swimwear and a towel', 'palmtreesurf' ),
				__( 'Water bottle', 'palmtreesurf' ),
			),
		),
		array(
			'title'    => __( 'Semi-Private Surf Lesson', 'palmtreesurf' ),
			'excerpt'  => __( 'Two of you, one instructor, two hours. The pair rate for friends and couples.', 'palmtreesurf' ),
			'type'     => __( 'Surf Lessons', 'palmtreesurf' ),
			'level'    => __( 'All Levels', 'palmtreesurf' ),
			'duration' => __( '2 hours', 'palmtreesurf' ),
			'group'    => __( '2 guests maximum', 'palmtreesurf' ),
			'image'    => 'surf-lesson-group-briefing.jpg',
			'alt'      => __( 'Two surf students listening to a briefing before paddling out', 'palmtreesurf' ),
			'includes' => array(
				__( 'One instructor between the two of you', 'palmtreesurf' ),
				__( 'Boards and rash guards sized to each of you', 'palmtreesurf' ),
				__( 'Departs Tamarindo — hotel pickup can be arranged', 'palmtreesurf' ),
			),
			'bring'    => array(
				__( 'Swimwear and a towel', 'palmtreesurf' ),
				__( 'Water bottle', 'palmtreesurf' ),
			),
		),
		array(
			'title'    => __( 'Group Surf Lesson', 'palmtreesurf' ),
			'excerpt'  => __( 'Three or more of you learning together for two hours, at the per-person rate.', 'palmtreesurf' ),
			'type'     => __( 'Surf Lessons', 'palmtreesurf' ),
			'level'    => __( 'All Levels', 'palmtreesurf' ),
			'badge'    => __( 'Most Popular', 'palmtreesurf' ),
			'duration' => __( '2 hours', 'palmtreesurf' ),
			'group'    => __( '3 guests or more', 'palmtreesurf' ),
			'image'    => 'group-lesson-beach.jpg',
			'alt'      => __( 'Group surf lesson on the beach at Tamarindo', 'palmtreesurf' ),
			'includes' => array(
				__( 'Instruction for the full two hours', 'palmtreesurf' ),
				__( 'Board and rash guard sized to each guest', 'palmtreesurf' ),
				__( 'Departs Tamarindo — hotel pickup can be arranged', 'palmtreesurf' ),
			),
			'bring'    => array(
				__( 'Swimwear and a towel', 'palmtreesurf' ),
				__( 'Water bottle', 'palmtreesurf' ),
			),
		),
		array(
			'title'    => __( 'Fishing Charter', 'palmtreesurf' ),
			'excerpt'  => __( 'Full, three-quarter and half-day charters off the Guanacaste coast, up to five aboard.', 'palmtreesurf' ),
			'type'     => __( 'Fishing Charters', 'palmtreesurf' ),
			'level'    => __( 'All Levels', 'palmtreesurf' ),
			'duration' => __( 'Half, three-quarter or full day', 'palmtreesurf' ),
			'group'    => __( '5 guests maximum', 'palmtreesurf' ),
			'image'    => 'kayak-surf-tent.jpg',
			'alt'      => __( 'Boats and gear at the beach launch point in Tamarindo', 'palmtreesurf' ),
			'includes' => array(
				__( 'Rods, tackle and bait', 'palmtreesurf' ),
				__( 'Captain and mate', 'palmtreesurf' ),
				__( 'Fruit, water and beers', 'palmtreesurf' ),
				__( 'Lunch on the full and three-quarter day, a sandwich on the half day', 'palmtreesurf' ),
				__( 'Departs Tamarindo — hotel pickup can be arranged', 'palmtreesurf' ),
			),
		),
		array(
			'title'    => __( 'Catamaran Tour', 'palmtreesurf' ),
			'excerpt'  => __( 'Five hours aboard the catamaran with an open bar, lunch buffet and everything to play with in the water.', 'palmtreesurf' ),
			'type'     => __( 'Boat Tours', 'palmtreesurf' ),
			'level'    => __( 'All Levels', 'palmtreesurf' ),
			'badge'    => __( 'Most Popular', 'palmtreesurf' ),
			'duration' => __( '5 hours', 'palmtreesurf' ),
			'image'    => 'sunset-catamaran-tour.jpg',
			'alt'      => __( 'Catamaran under sail off the Guanacaste coast at sunset', 'palmtreesurf' ),
			'includes' => array(
				__( 'Open bar', 'palmtreesurf' ),
				__( 'Lunch buffet', 'palmtreesurf' ),
				__( 'Snacks and fresh fruit', 'palmtreesurf' ),
				__( 'Snorkelling gear', 'palmtreesurf' ),
				__( 'Paddle board and kayak', 'palmtreesurf' ),
				__( 'Water toys', 'palmtreesurf' ),
				__( 'Departs Tamarindo — hotel pickup can be arranged', 'palmtreesurf' ),
			),
			'bring'    => array(
				__( 'Swimwear and a towel', 'palmtreesurf' ),
				__( 'Reef-safe sunscreen', 'palmtreesurf' ),
			),
		),
		array(
			'title'    => __( 'Island Kayak Tour', 'palmtreesurf' ),
			'excerpt'  => __( 'Two and a half hours paddling out to Captain Island, with snorkelling once you are there.', 'palmtreesurf' ),
			'type'     => __( 'Kayak Tours', 'palmtreesurf' ),
			'level'    => __( 'All Levels', 'palmtreesurf' ),
			'duration' => __( '2.5 hours', 'palmtreesurf' ),
			'image'    => 'kayak-guides-paddles.jpg',
			'alt'      => __( 'Two guides with paddles and kayaks ready on the sand', 'palmtreesurf' ),
			'includes' => array(
				__( 'Kayak, paddle and life vest', 'palmtreesurf' ),
				__( 'Guided tour of Captain Island', 'palmtreesurf' ),
				__( 'Snorkelling gear', 'palmtreesurf' ),
				__( 'Fresh fruit and water', 'palmtreesurf' ),
				__( 'Departs Tamarindo — hotel pickup can be arranged', 'palmtreesurf' ),
			),
			'bring'    => array(
				__( 'Swimwear, a hat and reef-safe sunscreen', 'palmtreesurf' ),
				__( 'Water bottle', 'palmtreesurf' ),
			),
		),
		array(
			'title'    => __( 'Mangrove Kayak Tour', 'palmtreesurf' ),
			'excerpt'  => __( 'Two and a half hours through the mangrove channels, with a trail walk and the wildlife that lives in there.', 'palmtreesurf' ),
			'type'     => __( 'Kayak Tours', 'palmtreesurf' ),
			'level'    => __( 'All Levels', 'palmtreesurf' ),
			'duration' => __( '2.5 hours', 'palmtreesurf' ),
			'image'    => 'estuary-mangrove-kayak.jpg',
			'alt'      => __( 'Two guests paddling a kayak through the mangrove channel', 'palmtreesurf' ),
			'includes' => array(
				__( 'Kayak, paddle and life vest', 'palmtreesurf' ),
				__( 'Guided tour of the mangroves', 'palmtreesurf' ),
				__( 'A walk on the trail', 'palmtreesurf' ),
				__( 'Fresh fruit and water', 'palmtreesurf' ),
				__( 'Departs Tamarindo — hotel pickup can be arranged', 'palmtreesurf' ),
			),
			'bring'    => array(
				__( 'Swimwear, a hat and reef-safe sunscreen', 'palmtreesurf' ),
				__( 'Insect repellent', 'palmtreesurf' ),
			),
		),
		array(
			'title'    => __( 'Turtle Tour', 'palmtreesurf' ),
			'excerpt'  => __( 'An evening run up the coast to a beach where the turtles hatch, leaving Tamarindo at 5pm.', 'palmtreesurf' ),
			'type'     => __( 'Wildlife & Nature', 'palmtreesurf' ),
			'level'    => __( 'All Levels', 'palmtreesurf' ),
			'duration' => __( '4 to 5 hours', 'palmtreesurf' ),
			'image'    => 'turtle-nesting-red-light.jpg',
			'alt'      => __( 'A nesting turtle on the beach at night under a guide\'s red light', 'palmtreesurf' ),
			'includes' => array(
				__( 'Boat from Tamarindo to the turtle beach and back', 'palmtreesurf' ),
				__( 'Local guide for the whole evening', 'palmtreesurf' ),
				__( 'Departs Tamarindo at 5pm — hotel pickup can be arranged', 'palmtreesurf' ),
			),
			'bring'    => array(
				__( 'Your own drinks', 'palmtreesurf' ),
				__( 'A layer for after dark', 'palmtreesurf' ),
			),
			'faq'      => array(
				__( 'Is there food on the trip? | No. Eat before you come aboard, and bring your own drinks for the evening.', 'palmtreesurf' ),
				__( 'What time do we get back? | The trip runs four to five hours from the 5pm departure, so expect to be back late evening.', 'palmtreesurf' ),
			),
		),
		array(
			'title'    => __( 'Safari Boat', 'palmtreesurf' ),
			'excerpt'  => __( 'Two and a half hours out on the water watching for wildlife. Departure times follow the tide.', 'palmtreesurf' ),
			'type'     => __( 'Wildlife & Nature', 'palmtreesurf' ),
			'level'    => __( 'All Levels', 'palmtreesurf' ),
			'duration' => __( '2.5 hours', 'palmtreesurf' ),
			'image'    => 'estuary-mangrove-kayak.jpg',
			'alt'      => __( 'Boat moving through the estuary channel at Tamarindo', 'palmtreesurf' ),
			'includes' => array(
				__( 'Guided boat trip', 'palmtreesurf' ),
				__( 'Fresh fruit and water', 'palmtreesurf' ),
				__( 'Departs Tamarindo — hotel pickup can be arranged', 'palmtreesurf' ),
			),
			'faq'      => array(
				__( 'What time does it leave? | It depends on the tide, so the departure moves day to day. Tell us your date and we will confirm the time.', 'palmtreesurf' ),
			),
		),

	);
}

/**
 * Create one experience from a seed definition.
 *
 * Split out of the seeder so the backfill can reuse it: the seeder only ever
 * runs once, so an install set up by an earlier version would otherwise never
 * receive an experience added to the definitions later.
 *
 * @param array $item  Seed definition.
 * @param int   $index Menu order.
 * @return int Post ID, or 0 when it already exists or could not be created.
 */
function pt_insert_experience( $item, $index = 0 ) {
	if ( get_page_by_path( sanitize_title( $item['title'] ), OBJECT, PT_EXPERIENCE_POST_TYPE ) ) {
		return 0;
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
		return 0;
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
		}
	}
	return (int) $post_id;
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
		$post_id = pt_insert_experience( $item, $index );

		if ( $post_id && ! $first_image ) {
			$first_image = (int) get_post_thumbnail_id( $post_id );
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
		// Ezekiel is a real, named person. The role is what the client told us;
		// the bio stays empty rather than inventing a history for him.
		array( 'Ezekiel', __( 'Guide and Lead Instructor', 'palmtreesurf' ), '' ),
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
