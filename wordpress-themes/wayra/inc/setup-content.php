<?php
/**
 * One-click starter content: programs as WooCommerce products, pages and menu.
 *
 * Appearance → Wayra setup. Safe to run more than once: anything that already
 * exists (matched by slug) is left alone.
 *
 * @package Wayra
 */

defined( 'ABSPATH' ) || exit;

/**
 * Program catalogue, from the WAYRA 2026 rate sheet.
 *
 * @return array
 */
function wayra_starter_programs() {
	$weekly_facts = "Start dates: Every Monday\nLevels: A1 to C2\nClass size: Max 6, average 3–4\nSchedule: 8:00–12:00 or 13:00–17:00\nCertificate: Attendance and achievement";

	return array(
		array(
			'slug'    => 'standard-course',
			'name'    => 'Standard Spanish Course',
			'cat'     => 'Group courses',
			'image'   => 'programs/standard-course.jpg',
			'short'   => '20 group lessons a week. Our most popular way to learn Spanish quickly while leaving your afternoons for the beach.',
			'content' => '<p>The standard Spanish course is designed for people who want to learn quickly and improve their communication skills. You don’t need any previous Spanish to begin. The program covers everything from basic survival Spanish to the most advanced communication needs.</p><p>All teachers are native speakers and experienced professionals who use interactive, communicative methods. Classes weave in local culture, interesting topics and your own interests so learning stays easy and fun.</p><p>If only one student is registered at your level, you receive 15 one-to-one lessons instead of 20 group lessons and reach the same goals by the end of the week.</p>',
			'rates'   => "1=367\n2=734\n3=1102\n4=1469\n+=326",
			'facts'   => "Lessons per week: 20 (4 a day)\n" . $weekly_facts,
			'lodging' => true,
			'book'    => true,
			'featured' => true,
		),
		array(
			'slug'    => 'intensive-course',
			'name'    => 'Intensive Spanish Course',
			'cat'     => 'Group courses',
			'image'   => 'programs/intensive-course.jpg',
			'short'   => '30 lessons a week for students who want to get the most out of every day in Tamarindo.',
			'content' => '<p>The intensive course is for students who want to maximize their Spanish practice: 20 group lessons plus 10 more lessons each week focused on conversation and the areas you most want to improve.</p>',
			'rates'   => "1=612\n2=1224\n3=1836\n4=2448\n+=571",
			'facts'   => "Lessons per week: 30 (6 a day)\n" . $weekly_facts,
			'lodging' => true,
			'book'    => true,
			'featured' => true,
		),
		array(
			'slug'    => 'standard-course-plus-5',
			'name'    => 'Standard Course + 5 Private Lessons',
			'cat'     => 'Group courses',
			'image'   => 'programs/standard-course.jpg',
			'short'   => '20 group lessons plus 5 one-to-one lessons each week.',
			'content' => '<p>The standard group course, plus five private lessons a week with your own teacher to work on exactly what you need.</p>',
			'rates'   => "1=520\n2=1040\n3=1561\n4=2081\n+=479",
			'facts'   => "Lessons per week: 20 group + 5 private\n" . $weekly_facts,
			'lodging' => true,
			'book'    => true,
		),
		array(
			'slug'    => 'standard-course-plus-10',
			'name'    => 'Standard Course + 10 Private Lessons',
			'cat'     => 'Group courses',
			'image'   => 'programs/standard-course.jpg',
			'short'   => '20 group lessons plus 10 one-to-one lessons each week.',
			'content' => '<p>The standard group course, plus ten private lessons a week for faster progress.</p>',
			'rates'   => "1=673\n2=1346\n3=2020\n4=2693\n+=632",
			'facts'   => "Lessons per week: 20 group + 10 private\n" . $weekly_facts,
			'lodging' => true,
			'book'    => true,
		),
		array(
			'slug'    => 'private-course',
			'name'    => 'Private Spanish Course',
			'cat'     => 'Private & specialty',
			'image'   => 'programs/private-course.jpg',
			'short'   => '20 one-to-one lessons a week, tailored entirely to you.',
			'content' => '<p>Our private courses are tailored to individual requirements. They are highly effective and geared towards tangible results in a short time.</p>',
			'rates'   => "1=612\n2=1224\n3=1836\n4=2448\n+=571",
			'facts'   => "Lessons per week: 20 private\nStart dates: Every Monday\nLevels: A1 to C2\nSchedule: Arranged with you",
			'lodging' => true,
			'book'    => true,
			'featured' => true,
		),
		array(
			'slug'    => 'semiprivate-course',
			'name'    => 'Semi-private Spanish Course',
			'cat'     => 'Private & specialty',
			'image'   => 'programs/private-course.jpg',
			'short'   => '20 lessons a week for two people learning together. Price is per person.',
			'content' => '<p>Learn with your partner, friend or colleague: 20 lessons a week for just the two of you.</p>',
			'rates'   => "1=459\n2=918\n3=1377\n4=1836\n+=428",
			'facts'   => "Lessons per week: 20\nClass size: 2 students\nStart dates: Every Monday\nLevels: A1 to C2",
			'lodging' => true,
			'book'    => true,
		),
		array(
			'slug'    => 'spanish-for-specific-purposes',
			'name'    => 'Spanish for Specific Purposes',
			'cat'     => 'Private & specialty',
			'image'   => 'programs/spanish-for-specific-purposes.jpg',
			'short'   => 'Medical, business and finance, teaching, real estate or law enforcement Spanish.',
			'content' => '<p>We offer Spanish for specific purposes in fields such as medicine, business and finance, teaching, real estate and law enforcement. Rates shown are for one student; two students pay the semi-private rate, and groups of three or more are quoted on request.</p>',
			'rates'   => "1=612\n2=1224\n3=1836\n4=2448\n+=571",
			'facts'   => "Lessons per week: 20 private\nFields: Medical, business, teaching, real estate, law\nStart dates: Every Monday",
			'lodging' => true,
		),
		array(
			'slug'    => 'dele-exam-preparation-course',
			'name'    => 'DELE Exam Preparation Course',
			'cat'     => 'Exams',
			'image'   => 'programs/dele-exam-preparation-course.jpg',
			'short'   => 'The only DELE preparation in Tamarindo and Guanacaste. Prepare and sit the exam right here.',
			'content' => '<p>WAYRA is the only school in Tamarindo and the province of Guanacaste that prepares students for the DELE exams, the official Spanish diplomas of the Instituto Cervantes. Exam fees are paid separately: A1 $105, A2 $110, B1 $130, B2 $150, C1 $165, C2 $180.</p>',
			'rates'   => "2=979\n3=1469\n4=1958",
			'facts'   => "Length: 2 to 4 weeks\nLevels: A1 to C2\nExam: Taken in Costa Rica",
			'lodging' => true,
			'book'    => true,
			'featured' => true,
		),
		array(
			'slug'    => 'survival-spanish-course',
			'name'    => 'Survival Spanish Course',
			'cat'     => 'Group courses',
			'image'   => 'programs/standard-course.jpg',
			'short'   => '2, 3 or 4 days of practical Spanish, 4 lessons a day. Perfect for a short stay.',
			'content' => '<p>Short on time? Learn the Spanish you need for travel in Costa Rica in two to four days.</p>',
			'rates'   => "2=179\n3=265\n4=352",
			'unit'    => 'day',
			'facts'   => "Lessons per day: 4\nLength: 2 to 4 days",
		),
		array(
			'slug'    => 'teenager-program',
			'name'    => 'Teenager Program (13–16)',
			'cat'     => 'Youth',
			'image'   => 'programs/teenager-program.jpg',
			'short'   => 'A Spanish course built for teens, with beach walks, games and activities around Tamarindo.',
			'content' => '<p>Our teenager course is designed so students enjoy their Spanish classes as much as their time at the beach. Walks to the beach and the center of Tamarindo and all kinds of games keep learning interesting and fun.</p>',
			'rates'   => "1=367\n2=734\n3=1102\n4=1469\n+=326",
			'facts'   => "Ages: 13 to 16\nLessons per week: 20\nStart dates: Every Monday",
			'lodging' => true,
			'book'    => true,
		),
		array(
			'slug'    => 'bildungsurlaub-course',
			'name'    => 'Bildungsurlaub Course',
			'cat'     => 'Group courses',
			'image'   => 'programs/intensive-course.jpg',
			'short'   => 'Our intensive course, recognized as Bildungsurlaub in several German states.',
			'content' => '<p>Our intensive courses of one or two weeks are recognized as Bildungsurlaub in several German states, so German employees can study Spanish at WAYRA while receiving their regular income.</p>',
			'rates'   => "1=612\n2=1224",
			'facts'   => "Lessons per week: 30\nLength: 1 or 2 weeks",
			'lodging' => true,
		),
		array(
			'slug'    => 'spanish-and-surf-program',
			'name'    => 'Surf Package (add to any course)',
			'cat'     => 'Surf & activities',
			'image'   => 'programs/spanish-and-surf-program.jpg',
			'short'   => 'Group surf lessons, board rental and a photo bundle. Add it to any Spanish course.',
			'content' => '<p>Costa Rica is one of the best places in the world to surf. 1 week: 2 group lessons, board rental and photo bundle. 2 weeks: 3 lessons. 3 weeks: 6 lessons plus a surf trip (or 9 lessons). 4 weeks: 8 lessons, a surf trip and a free rash guard (or 11 lessons), all with board rental and a photography package. Spanish lessons are booked separately.</p>',
			'rates'   => "1=200\n2=305\n3=740\n4=930",
			'facts'   => "Includes: Group lessons, board rental, photos\nLength: 1 to 4 weeks",
			'featured' => true,
			'start'   => false,
			'transfer' => false,
		),
		array(
			'slug'    => 'water-sports-package',
			'name'    => 'Water Sports Package',
			'cat'     => 'Surf & activities',
			'image'   => 'gallery/tours.jpg',
			'short'   => 'Surf, SUP and more: 3 activities a week, swap any of them as you like.',
			'content' => '<p>Three activities per week, such as surf lessons or stand-up paddle sessions. Swap any activity, for example two surf lessons instead of a SUP session. Spanish lessons are not included.</p>',
			'rates'   => "1=240\n2=460",
			'facts'   => "Activities: 3 per week\nLength: 1 or 2 weeks",
			'start'   => false,
			'transfer' => false,
		),
		array(
			'slug'    => 'spanish-volunteering',
			'name'    => 'Spanish & Volunteering',
			'cat'     => 'Volunteering',
			'image'   => 'programs/spanish-volunteering.jpg',
			'short'   => 'Volunteer in the community with full-board accommodation. Includes the one-time registration fee.',
			'content' => '<p>WAYRA offers a wide range of opportunities to volunteer in Costa Rica, from social work at CEPIA to sea turtle rescue and teaching English. The first week includes the one-time $150 registration fee; every week includes accommodation with full board.</p>',
			'rates'   => "1=427\n+=277",
			'facts'   => "Includes: Full-board accommodation\nProjects: CEPIA, sea turtles, teaching English",
			'featured' => true,
		),
		array(
			'slug'    => 'online-spanish-classes',
			'name'    => 'Online Spanish Classes',
			'cat'     => 'Online',
			'image'   => 'programs/online-spanish-classes.jpg',
			'short'   => 'Personal one-to-one lessons by video call with a WAYRA teacher, from anywhere.',
			'content' => '<p>Personalized online lessons by Zoom or Skype, tailored to your goals. We will email you within one business day to schedule your first lesson.</p>',
			'rates'   => "1=36\n10=313\n20=612",
			'unit'    => 'lesson',
			'facts'   => "Format: One-to-one video call\nSchedule: Arranged with you",
			'start'   => false,
			'transfer' => false,
			'featured' => true,
		),
	);
}

/**
 * Starter pages.
 *
 * @return array slug => [title, content]
 */
function wayra_starter_pages() {
	return array(
		'home'    => array( 'Home', '' ),
		'blog'    => array( 'Blog', '' ),
		'lodging' => array(
			'Lodging',
			'<!-- wp:paragraph --><p>To learn Spanish in Costa Rica it helps to immerse yourself in the language. Choose a host family or one of our student houses in Playa Tamarindo. You can add lodging when you book any program.</p><!-- /wp:paragraph --><!-- wp:heading --><h2>Homestay</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Living with a Costa Rican family is a unique experience. Includes a private room, breakfast and dinner, laundry service and transportation to the school. $277 per week.</p><!-- /wp:paragraph --><!-- wp:heading --><h2>Student houses</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Casa El Mar, Casa La Carolina and Casa WAYRA are a short walk from the school and the beach, with shared or private rooms and housekeeping. From $305 per week.</p><!-- /wp:paragraph -->',
		),
		'school'  => array(
			'The School',
			'<!-- wp:paragraph --><p>The WAYRA campus is in the center of Playa Tamarindo, just 150 meters from the beach, in a beautiful tropical garden. Our 12 classrooms are spacious, with large open windows for a comfortable place to study.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>WAYRA is accredited by the Instituto Cervantes, the only international accreditation focused exclusively on teaching Spanish as a foreign language.</p><!-- /wp:paragraph -->',
		),
		'contact' => array(
			'Contact',
			'<!-- wp:paragraph --><p>Write to <a href="mailto:info@wayra.cr">info@wayra.cr</a>, call +506 2653 0359, or call toll-free from the USA and Canada on 1 (800) 670-9864. Office hours are Monday to Friday, 7:00 am to 5:30 pm Costa Rica time.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>East Road, 50309 Playa Tamarindo, Guanacaste, Costa Rica.</p><!-- /wp:paragraph -->',
		),
	);
}

/**
 * Import a bundled image into the media library.
 *
 * @param string $path    Path under assets/images.
 * @param int    $post_id Parent post.
 * @return int Attachment ID or 0.
 */
function wayra_import_image( $path, $post_id ) {
	static $cache = array();
	if ( isset( $cache[ $path ] ) ) {
		return $cache[ $path ];
	}
	$existing = get_posts(
		array(
			'post_type'   => 'attachment',
			'meta_key'    => '_wayra_source', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value'  => $path, // phpcs:ignore WordPress.DB.SlowDBQuery
			'fields'      => 'ids',
			'numberposts' => 1,
		)
	);
	if ( $existing ) {
		$cache[ $path ] = (int) $existing[0];
		return $cache[ $path ];
	}

	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$source = WAYRA_DIR . '/assets/images/' . $path;
	if ( ! file_exists( $source ) ) {
		return 0;
	}
	$tmp = wp_tempnam( basename( $source ) );
	copy( $source, $tmp );
	$id = media_handle_sideload(
		array(
			'name'     => basename( $source ),
			'tmp_name' => $tmp,
		),
		$post_id
	);
	if ( is_wp_error( $id ) ) {
		wp_delete_file( $tmp );
		return 0;
	}
	update_post_meta( $id, '_wayra_source', $path );
	$cache[ $path ] = (int) $id;
	return $cache[ $path ];
}

/**
 * Create programs, pages and the main menu.
 *
 * @return string[] Log lines.
 */
function wayra_run_setup() {
	$log = array();

	// Pages.
	$page_ids = array();
	foreach ( wayra_starter_pages() as $slug => $page ) {
		$found = get_page_by_path( $slug );
		if ( $found ) {
			$page_ids[ $slug ] = $found->ID;
			continue;
		}
		$page_ids[ $slug ] = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_name'    => $slug,
				'post_title'   => $page[0],
				'post_content' => $page[1],
			)
		);
		/* translators: %s: page title */
		$log[] = sprintf( __( 'Created page: %s', 'wayra' ), $page[0] );
	}
	update_option( 'show_on_front', 'page' );
	update_option( 'page_on_front', $page_ids['home'] );
	update_option( 'page_for_posts', $page_ids['blog'] );

	// Programs.
	if ( class_exists( 'WooCommerce' ) ) {
		foreach ( wayra_starter_programs() as $p ) {
			if ( get_page_by_path( $p['slug'], OBJECT, 'product' ) ) {
				continue;
			}
			$term = term_exists( $p['cat'], 'product_cat' );
			if ( ! $term ) {
				$term = wp_insert_term( $p['cat'], 'product_cat' );
			}
			$rates   = wayra_parse_rates( $p['rates'] );
			$product = new WC_Product_Simple();
			$product->set_name( $p['name'] );
			$product->set_slug( $p['slug'] );
			$product->set_status( 'publish' );
			$product->set_description( $p['content'] );
			$product->set_short_description( $p['short'] );
			$product->set_regular_price( (string) reset( $rates['tiers'] ) );
			$product->set_virtual( true );
			$product->set_featured( ! empty( $p['featured'] ) );
			if ( ! is_wp_error( $term ) ) {
				$product->set_category_ids( array( (int) $term['term_id'] ) );
			}
			$id = $product->save();

			update_post_meta( $id, '_wayra_rates', $p['rates'] );
			update_post_meta( $id, '_wayra_unit', isset( $p['unit'] ) ? $p['unit'] : 'week' );
			update_post_meta( $id, '_wayra_facts', $p['facts'] );
			update_post_meta( $id, '_wayra_start_date', ( isset( $p['start'] ) && ! $p['start'] ) ? 'no' : 'yes' );
			update_post_meta( $id, '_wayra_lodging', empty( $p['lodging'] ) ? 'no' : 'yes' );
			update_post_meta( $id, '_wayra_transfer', ( isset( $p['transfer'] ) && ! $p['transfer'] ) ? 'no' : 'yes' );
			update_post_meta( $id, '_wayra_book', empty( $p['book'] ) ? 'no' : 'yes' );

			$image = wayra_import_image( $p['image'], $id );
			if ( $image ) {
				set_post_thumbnail( $id, $image );
			}
			/* translators: %s: program name */
			$log[] = sprintf( __( 'Created program: %s', 'wayra' ), $p['name'] );
		}
	} else {
		$log[] = __( 'WooCommerce is not active, so no programs were created. Activate WooCommerce and run setup again.', 'wayra' );
	}

	// Primary menu.
	$locations = get_theme_mod( 'nav_menu_locations', array() );
	if ( empty( $locations['primary'] ) ) {
		$menu_id = wp_create_nav_menu( __( 'Main menu', 'wayra' ) );
		if ( ! is_wp_error( $menu_id ) ) {
			$entries = array( 'home' => __( 'Home', 'wayra' ) );
			foreach ( $entries as $slug => $title ) {
				wp_update_nav_menu_item( $menu_id, 0, array( 'menu-item-title' => $title, 'menu-item-object' => 'page', 'menu-item-object-id' => $page_ids[ $slug ], 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish' ) );
			}
			if ( function_exists( 'wc_get_page_id' ) && wc_get_page_id( 'shop' ) > 0 ) {
				$programs = wp_update_nav_menu_item( $menu_id, 0, array( 'menu-item-title' => __( 'Programs', 'wayra' ), 'menu-item-object' => 'page', 'menu-item-object-id' => wc_get_page_id( 'shop' ), 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish' ) );
				$cats     = get_terms( array( 'taxonomy' => 'product_cat', 'hide_empty' => true, 'exclude' => array( (int) get_option( 'default_product_cat' ) ) ) );
				foreach ( is_wp_error( $cats ) ? array() : $cats as $cat ) {
					wp_update_nav_menu_item( $menu_id, 0, array( 'menu-item-title' => $cat->name, 'menu-item-object' => 'product_cat', 'menu-item-object-id' => $cat->term_id, 'menu-item-type' => 'taxonomy', 'menu-item-parent-id' => $programs, 'menu-item-status' => 'publish' ) );
				}
			}
			foreach ( array( 'lodging', 'school', 'blog', 'contact' ) as $slug ) {
				wp_update_nav_menu_item( $menu_id, 0, array( 'menu-item-title' => get_the_title( $page_ids[ $slug ] ), 'menu-item-object' => 'page', 'menu-item-object-id' => $page_ids[ $slug ], 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish' ) );
			}
			$locations['primary'] = $menu_id;
			set_theme_mod( 'nav_menu_locations', $locations );
			$log[] = __( 'Created the main menu.', 'wayra' );
		}
	}

	if ( ! $log ) {
		$log[] = __( 'Everything was already set up. Nothing to do.', 'wayra' );
	}
	return $log;
}

/**
 * Admin page.
 */
function wayra_setup_menu() {
	add_theme_page( __( 'Wayra setup', 'wayra' ), __( 'Wayra setup', 'wayra' ), 'manage_options', 'wayra-setup', 'wayra_setup_page' );
}
add_action( 'admin_menu', 'wayra_setup_menu' );

/**
 * Render the setup page.
 */
function wayra_setup_page() {
	$log = array();
	if ( isset( $_POST['wayra_setup'] ) && check_admin_referer( 'wayra_setup' ) && current_user_can( 'manage_options' ) ) {
		$log = wayra_run_setup();
	}
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Wayra setup', 'wayra' ); ?></h1>
		<p><?php esc_html_e( 'Creates all WAYRA programs as bookable WooCommerce products using the 2026 rate sheet, adds the Home, Blog, Lodging, School and Contact pages, and builds the main menu. Anything that already exists is left untouched.', 'wayra' ); ?></p>
		<?php if ( ! class_exists( 'WooCommerce' ) ) : ?>
			<div class="notice notice-warning"><p><?php esc_html_e( 'Install and activate WooCommerce first so the programs can be created.', 'wayra' ); ?></p></div>
		<?php endif; ?>
		<?php if ( $log ) : ?>
			<div class="notice notice-success"><ul><?php foreach ( $log as $line ) { echo '<li>' . esc_html( $line ) . '</li>'; } ?></ul></div>
		<?php endif; ?>
		<form method="post">
			<?php wp_nonce_field( 'wayra_setup' ); ?>
			<?php submit_button( __( 'Create programs, pages and menu', 'wayra' ), 'primary', 'wayra_setup' ); ?>
		</form>
	</div>
	<?php
}

/**
 * Point new installs at the setup page.
 */
function wayra_setup_notice() {
	if ( get_option( 'wayra_setup_dismissed' ) || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$screen = get_current_screen();
	if ( $screen && 'appearance_page_wayra-setup' === $screen->id ) {
		update_option( 'wayra_setup_dismissed', 1 );
		return;
	}
	printf(
		'<div class="notice notice-info"><p>%s <a href="%s">%s</a></p></div>',
		esc_html__( 'Wayra theme is active.', 'wayra' ),
		esc_url( admin_url( 'themes.php?page=wayra-setup' ) ),
		esc_html__( 'Create the programs and pages →', 'wayra' )
	);
}
add_action( 'admin_notices', 'wayra_setup_notice' );
