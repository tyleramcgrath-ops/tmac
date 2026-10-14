<?php
/**
 * One-click demo content so a fresh install looks like the design.
 *
 * Appearance → Demo content, or WP-CLI: `wp whr-demo import` / `wp whr-demo remove`.
 * Everything created is tagged, so "remove" deletes only demo items.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

/**
 * Import a bundled photo into the media library once and reuse it.
 *
 * @param string $file File name in assets/img/.
 * @return int Attachment ID or 0.
 */
function whr_demo_image( $file ) {
	$map = get_option( 'whr_demo_media', array() );
	if ( ! empty( $map[ $file ] ) && get_post( $map[ $file ] ) ) {
		return (int) $map[ $file ];
	}
	$src = WHR_DIR . '/assets/img/' . $file;
	if ( ! file_exists( $src ) ) {
		return 0;
	}
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$tmp = wp_tempnam( $file );
	copy( $src, $tmp );
	$id = media_handle_sideload( array( 'name' => $file, 'tmp_name' => $tmp ), 0 );
	if ( is_wp_error( $id ) ) {
		wp_delete_file( $tmp );
		return 0;
	}
	update_post_meta( $id, '_whr_demo', 1 );
	$map[ $file ] = $id;
	update_option( 'whr_demo_media', $map, false );
	return (int) $id;
}

/**
 * Create (or reuse) a demo term.
 *
 * @param string $taxonomy Taxonomy.
 * @param string $name     Name.
 * @param array  $args     slug, parent, description, meta.
 * @return int Term ID.
 */
function whr_demo_term( $taxonomy, $name, $args = array() ) {
	$slug     = isset( $args['slug'] ) ? $args['slug'] : sanitize_title( $name );
	$existing = get_term_by( 'slug', $slug, $taxonomy );
	if ( $existing ) {
		$term_id = (int) $existing->term_id;
	} else {
		$made = wp_insert_term(
			$name,
			$taxonomy,
			array(
				'slug'        => $slug,
				'parent'      => isset( $args['parent'] ) ? $args['parent'] : 0,
				'description' => isset( $args['description'] ) ? $args['description'] : '',
			)
		);
		if ( is_wp_error( $made ) ) {
			return 0;
		}
		$term_id = (int) $made['term_id'];
		update_term_meta( $term_id, 'whr_demo', 1 );
	}
	foreach ( isset( $args['meta'] ) ? $args['meta'] : array() as $key => $value ) {
		if ( 'whr_image' === $key ) {
			$value = (string) whr_demo_image( $value );
		}
		update_term_meta( $term_id, $key, $value );
	}
	return $term_id;
}

/**
 * The demo data set.
 *
 * @return array
 */
function whr_demo_data() {
	$cr_story = "Costa Rica has become one of the most thoughtful places in the Americas to step away and heal. Small programs sit in the rainforest and along the Pacific coast, many of them led by licensed therapists and psychiatrists who chose to work somewhere quieter.\n\nFor guests from North America the journey is short, the time difference is small, and English is widely spoken alongside Spanish — so the distance from daily life comes without the strain of a long trip.";
	return array(
		'care'       => array(
			array( 'Retreat', 'retreat', 'Non-clinical wellbeing programs: rest, movement, coaching and community. Not a substitute for treatment.' ),
			array( 'Clinical program', 'clinical-program', 'Therapy is delivered by licensed mental-health clinicians.' ),
			array( 'Medically supervised', 'medically-supervised', 'Doctors and nursing on site, including medical detox where offered.' ),
		),
		'conditions' => array( 'Anxiety & depression', 'Burnout & exhaustion', 'Trauma & PTSD', 'Alcohol & substance use', 'Grief & life transitions' ),
		'approaches' => array(
			array( 'Psychotherapy', 'CBT, DBT, EMDR, ACT — one-to-one and in small groups.' ),
			array( 'Somatic & breath', 'Somatic experiencing, breathwork, trauma-sensitive yoga.' ),
			array( 'Nature', 'Surf, forest, cenote and equine therapy.' ),
			array( 'Nourishment', 'Whole-food kitchens, sleep and integrative medicine.' ),
		),
		'settings'   => array( 'Ocean', 'Jungle', 'Mountains', 'Hot springs' ),
		'destinations' => array(
			'costa-rica' => array(
				'name'     => 'Costa Rica',
				'meta'     => array(
					'whr_image'   => 'aerial.jpg',
					'whr_tagline' => 'Rainforest and ocean, a slower pace of life — and some of the most thoughtful healing sanctuaries in the Americas.',
					'whr_story'   => $cr_story,
					'whr_facts'   => "Fly into | SJO · LIR\nTime zone | UTC−6\nDry season | Dec – Apr\nCurrency | Colón · USD",
					'whr_reasons' => "Close to home | Direct flights from many North American cities, on a Central-time clock.\nNature as medicine | Ocean, rainforest and hot springs woven into daily care.\nCare in your language | Many sanctuaries offer therapy in English and Spanish.",
					'whr_guide'   => "Entry | Requirements depend on your passport. Check the official Costa Rican immigration guidance before you book.\nMoney | The colón (CRC) is the local currency; US dollars are widely accepted.\nInsurance | Most health plans don’t cover care abroad — ask for itemized receipts.\nMedication | Bring prescriptions with a doctor’s letter and tell your sanctuary before you arrive.\nSeasons | Dry roughly December to April; the green season brings afternoon rain.\nComing home | Arrange a therapist at home; many sanctuaries offer online aftercare.",
					'whr_faq'     => "Is a retreat enough, or do I need treatment? | If you are struggling to function day to day, using alcohol or drugs to cope, or have thoughts of harming yourself, look for a clinical or medically supervised program — or speak to your doctor first. Retreats suit people who are stable and want rest and perspective.\nAre the therapists licensed? | Clinical programs list their clinicians and where they are licensed. We check the facility’s local health license and show the date we last checked it.\nWhat happens in an emergency? | Each sanctuary should explain its emergency protocol and the nearest hospital. Ask before you book — the Central Valley is closest to major hospitals.",
				),
				'children' => array(
					array( 'Guanacaste & Nosara', 'guanacaste-nosara', 'beachview.jpg', 'Sun, surf and small clinical programs' ),
					array( 'Arenal & La Fortuna', 'arenal-la-fortuna', 'pool2.jpg', 'Volcano views, hot springs, cool nights' ),
					array( 'Santa Teresa & Nicoya', 'santa-teresa-nicoya', 'junglepool.jpg', 'Barefoot retreats by the sea' ),
					array( 'Central Valley', 'central-valley', 'valley.jpg', 'Closest to major hospitals' ),
				),
			),
			'mexico'     => array(
				'name'     => 'Mexico',
				'meta'     => array( 'whr_image' => 'hacienda.jpg', 'whr_tagline' => 'Haciendas, cenotes and the Caribbean coast.' ),
				'children' => array( array( 'Tulum & Riviera Maya', 'tulum-riviera-maya', 'poolpalms.jpg', 'Cenotes, jungle and the Caribbean' ) ),
			),
			'bali'       => array(
				'name'     => 'Bali',
				'meta'     => array( 'whr_image' => 'bali.jpg', 'whr_tagline' => 'Rice terraces, ritual and quiet.' ),
				'children' => array( array( 'Ubud', 'ubud', 'daybed.jpg', 'The island’s green heart' ) ),
			),
			'thailand'   => array(
				'name'     => 'Thailand',
				'meta'     => array( 'whr_image' => 'thailand.jpg', 'whr_tagline' => 'Mountain temples and slow beaches.' ),
				'children' => array( array( 'Chiang Mai', 'chiang-mai', 'rock.jpg', 'Mountains and monasteries' ) ),
			),
		),
		'sanctuaries' => array(
			array(
				'title'    => 'Selva Verde Sanctuary',
				'dest'     => 'guanacaste-nosara',
				'care'     => 'clinical-program',
				'needs'    => array( 'trauma-ptsd', 'anxiety-depression' ),
				'approach' => array( 'psychotherapy', 'somatic-breath', 'nature' ),
				'setting'  => array( 'jungle', 'ocean' ),
				'hero'     => 'villas.jpg',
				'gallery'  => array( 'bedroom.jpg', 'smoke.jpg', 'palapa.jpg', 'daybed.jpg', 'pool2.jpg', 'shala.jpg', 'beachview.jpg' ),
				'excerpt'  => 'A small, trauma-informed clinical program in the jungle above the Pacific. Mornings with licensed therapists; afternoons for surf, breath and long, slow meals.',
				'meta'     => array(
					'location' => 'Nosara · Guanacaste', 'tagline' => 'Where the jungle meets the Pacific, a small circle of healers holds space for deep, unhurried work.',
					'stay_min' => 14, 'stay_max' => 30, 'guests' => 12, 'languages' => 'English · Español', 'featured' => 1,
					'license_authority' => 'Ministerio de Salud, Costa Rica',
					'airport' => 'Fly into Liberia (LIR). The sanctuary’s driver meets you at arrivals.',
					'schedule' => "6:30 | Sunrise meditation | Gentle movement on the shala as the howler monkeys wake.\n9:00 | Individual therapy | EMDR, CBT or somatic work with your own clinician.\n11:00 | Circle | Small-group process, led by licensed therapists.\n15:30 | Ocean & body | Surf therapy, forest walks or breathwork.\n19:30 | Supper by candlelight | Then journaling or a sound bath before sleep.",
					'clinical' => "EMDR\nCBT\nDBT skills\nSomatic experiencing\nPsychiatric review",
					'complementary' => "Yoga & breathwork\nSurf therapy\nSound & whole-food nourishment",
					'team' => "[Clinical director name], PsyD | Clinical director — add license\n[Psychiatrist name], MD | Consulting psychiatrist\n[Therapist name], LCSW | Trauma therapist · EMDR",
					'rooms' => "Garden suite | Shared · rates on request\nJungle casita | Private · rates on request\nPlunge-pool villa | Private · rates on request",
					'included' => "All therapy & rituals\nMeals and room\nTransfer from Liberia (LIR)\nOnline aftercare",
					'not_included' => "Flights\nMedication\nTravel insurance",
				),
			),
			array(
				'title'   => 'Arenal Springs',
				'dest'    => 'arenal-la-fortuna',
				'care'    => 'clinical-program',
				'needs'   => array( 'anxiety-depression', 'grief-life-transitions' ),
				'approach' => array( 'psychotherapy', 'nature' ),
				'setting' => array( 'mountains', 'hot-springs' ),
				'hero'    => 'pool2.jpg',
				'gallery' => array( 'garden.jpg', 'candles.jpg', 'waterfall.jpg', 'hall.jpg', 'boho.jpg' ),
				'excerpt' => 'Depression and grief care with a psychiatrist on site, beside the hot springs below the volcano.',
				'meta'    => array( 'location' => 'La Fortuna · Arenal', 'stay_min' => 21, 'stay_max' => 45, 'guests' => 16, 'languages' => 'English · Español', 'sponsored' => 1 ),
			),
			array(
				'title'   => 'Casa Marea',
				'dest'    => 'santa-teresa-nicoya',
				'care'    => 'retreat',
				'needs'   => array( 'burnout-exhaustion', 'anxiety-depression' ),
				'approach' => array( 'somatic-breath', 'nourishment' ),
				'setting' => array( 'ocean' ),
				'hero'    => 'bedroom.jpg',
				'gallery' => array( 'beachaerial.jpg', 'mexico.jpg', 'calm.jpg', 'coast.jpg' ),
				'excerpt' => 'A week to reset from anxiety and burnout: yoga, breath, coaching and the sea.',
				'meta'    => array( 'location' => 'Santa Teresa · Nicoya', 'stay_min' => 7, 'stay_max' => 14, 'guests' => 14, 'languages' => 'English' ),
			),
			array(
				'title'   => 'Casa Río Claro',
				'dest'    => 'central-valley',
				'care'    => 'medically-supervised',
				'needs'   => array( 'alcohol-substance-use' ),
				'approach' => array( 'psychotherapy', 'nourishment' ),
				'setting' => array( 'mountains' ),
				'hero'    => 'hacienda.jpg',
				'gallery' => array( 'arches.jpg', 'circle.jpg', 'grass.jpg', 'hut.jpg' ),
				'excerpt' => 'Recovery from alcohol and substances, with 24-hour nursing and a quiet garden.',
				'meta'    => array( 'location' => 'Central Valley', 'stay_min' => 30, 'stay_max' => 90, 'guests' => 20, 'languages' => 'English · Español' ),
			),
			array(
				'title'   => 'Casa Sol',
				'dest'    => 'tulum-riviera-maya',
				'care'    => 'medically-supervised',
				'needs'   => array( 'alcohol-substance-use', 'trauma-ptsd' ),
				'approach' => array( 'psychotherapy', 'nature' ),
				'setting' => array( 'jungle' ),
				'hero'    => 'poolpalms.jpg',
				'gallery' => array( 'boho.jpg', 'arches.jpg', 'plunge.jpg', 'junglepool.jpg' ),
				'excerpt' => 'A restored hacienda turned recovery home for addiction and dual diagnosis. Medical care, cenote swims and a garden that takes its time.',
				'meta'    => array( 'location' => 'Tulum · Mexico', 'stay_min' => 30, 'stay_max' => 60, 'guests' => 18, 'languages' => 'English · Español', 'featured' => 1 ),
			),
			array(
				'title'   => 'Rumah Tenang',
				'dest'    => 'ubud',
				'care'    => 'retreat',
				'needs'   => array( 'burnout-exhaustion' ),
				'approach' => array( 'somatic-breath', 'nourishment' ),
				'setting' => array( 'jungle' ),
				'hero'    => 'daybed.jpg',
				'gallery' => array( 'hero.jpg', 'bali.jpg', 'hall.jpg' ),
				'excerpt' => 'Rest, breath and gentle coaching among Ubud’s rice terraces.',
				'meta'    => array( 'location' => 'Ubud · Bali', 'stay_min' => 7, 'stay_max' => 21, 'guests' => 10, 'languages' => 'English' ),
			),
			array(
				'title'   => 'Mountain Breath',
				'dest'    => 'chiang-mai',
				'care'    => 'retreat',
				'needs'   => array( 'burnout-exhaustion', 'grief-life-transitions' ),
				'approach' => array( 'somatic-breath', 'nature' ),
				'setting' => array( 'mountains' ),
				'hero'    => 'rock.jpg',
				'gallery' => array( 'thailand.jpg', 'valley.jpg', 'hut.jpg' ),
				'excerpt' => 'Meditation, mountain walks and quiet in the hills above Chiang Mai.',
				'meta'    => array( 'location' => 'Chiang Mai · Thailand', 'stay_min' => 7, 'stay_max' => 14, 'guests' => 12, 'languages' => 'English · ไทย' ),
			),
		),
	);
}

/**
 * Run the import. Safe to run twice.
 *
 * @return string Summary.
 */
function whr_demo_import() {
	if ( function_exists( 'set_time_limit' ) ) {
		set_time_limit( 300 ); // phpcs:ignore Squiz.PHP.DiscouragedFunctions.Discouraged -- image processing can be slow on shared hosting.
	}
	$d = whr_demo_data();

	foreach ( $d['care'] as $c ) {
		whr_demo_term( 'care_level', $c[0], array( 'slug' => $c[1], 'description' => $c[2] ) );
	}
	foreach ( $d['conditions'] as $c ) {
		whr_demo_term( 'condition', $c );
	}
	foreach ( $d['approaches'] as $a ) {
		whr_demo_term( 'approach', $a[0], array( 'description' => $a[1] ) );
	}
	foreach ( $d['settings'] as $s ) {
		whr_demo_term( 'setting', $s );
	}
	foreach ( $d['destinations'] as $slug => $dest ) {
		$parent = whr_demo_term( 'destination', $dest['name'], array( 'slug' => $slug, 'meta' => $dest['meta'] ) );
		foreach ( $dest['children'] as $child ) {
			whr_demo_term( 'destination', $child[0], array( 'slug' => $child[1], 'parent' => $parent, 'meta' => array( 'whr_image' => $child[2], 'whr_card' => $child[3] ) ) );
		}
	}

	$made = 0;
	foreach ( $d['sanctuaries'] as $i => $s ) {
		$slug     = sanitize_title( $s['title'] );
		$existing = get_page_by_path( $slug, OBJECT, 'sanctuary' );
		if ( $existing ) {
			continue;
		}
		$content = '<p>' . esc_html( $s['excerpt'] ) . '</p><p><em>' . esc_html__( 'Demo listing — replace with the sanctuary’s own story, photos and details.', 'wehaverehabs' ) . '</em></p>';
		$id      = wp_insert_post(
			array(
				'post_type'    => 'sanctuary',
				'post_status'  => 'publish',
				'post_title'   => $s['title'],
				'post_name'    => $slug,
				'post_excerpt' => $s['excerpt'],
				'post_content' => $content,
				'menu_order'   => $i,
			)
		);
		if ( ! $id || is_wp_error( $id ) ) {
			continue;
		}
		update_post_meta( $id, '_whr_demo', 1 );
		set_post_thumbnail( $id, whr_demo_image( $s['hero'] ) );
		update_post_meta( $id, 'whr_gallery', implode( ',', array_filter( array_map( 'whr_demo_image', $s['gallery'] ) ) ) );
		foreach ( wp_parse_args( $s['meta'], array( 'sponsored' => 0, 'featured' => 0, 'currency' => 'USD' ) ) as $key => $value ) {
			update_post_meta( $id, 'whr_' . $key, $value );
		}
		whr_sync_sort_keys( $id );
		wp_set_object_terms( $id, $s['dest'], 'destination' );
		wp_set_object_terms( $id, $s['care'], 'care_level' );
		wp_set_object_terms( $id, $s['needs'], 'condition' );
		wp_set_object_terms( $id, $s['approach'], 'approach' );
		wp_set_object_terms( $id, $s['setting'], 'setting' );
		++$made;
	}

	// Pages.
	$pages = array(
		'home'                   => array( 'Home', '', '' ),
		'journal'                => array( 'Journal', '', '' ),
		'for-sanctuaries'        => array( 'For sanctuaries', '', 'page-templates/for-sanctuaries.php' ),
		'how-we-choose'          => array( 'How we choose', whr_demo_how_we_choose(), '' ),
		'advertising-disclosure' => array( 'Advertising disclosure', '<p>We Have Rehabs is free for guests. Sanctuaries can list for free; some pay for extra features or for placement. Paid placements are always marked “Sponsored”.</p><p>Payment never changes a sanctuary’s care-level label, our license check, or what guests write about them. We do not sell guests’ details, and inquiries go only to the sanctuary a guest chooses.</p>', '' ),
	);
	$ids = array();
	foreach ( $pages as $slug => $p ) {
		$page = get_page_by_path( $slug );
		if ( ! $page ) {
			$pid = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p[0], 'post_name' => $slug, 'post_content' => $p[1] ) );
			update_post_meta( $pid, '_whr_demo', 1 );
			if ( $p[2] ) {
				update_post_meta( $pid, '_wp_page_template', $p[2] );
			}
			if ( 'for-sanctuaries' === $slug ) {
				set_post_thumbnail( $pid, whr_demo_image( 'hacienda.jpg' ) );
			}
			$ids[ $slug ] = $pid;
		} else {
			$ids[ $slug ] = $page->ID;
		}
	}
	update_option( 'show_on_front', 'page' );
	update_option( 'page_on_front', $ids['home'] );
	update_option( 'page_for_posts', $ids['journal'] );

	// Journal.
	foreach ( whr_demo_posts() as $post ) {
		if ( get_page_by_path( sanitize_title( $post[0] ), OBJECT, 'post' ) ) {
			continue;
		}
		$pid = wp_insert_post( array( 'post_status' => 'publish', 'post_title' => $post[0], 'post_content' => $post[2] ) );
		update_post_meta( $pid, '_whr_demo', 1 );
		set_post_thumbnail( $pid, whr_demo_image( $post[1] ) );
		wp_set_post_categories( $pid, array( whr_demo_term( 'category', $post[3] ) ) );
	}

	update_option( 'whr_demo_imported', time() );
	flush_rewrite_rules();
	/* translators: %d: number of sanctuaries */
	return sprintf( __( 'Demo content imported: %d new sanctuaries, destinations, pages and journal posts.', 'wehaverehabs' ), $made );
}

/**
 * Listing standards page copy.
 *
 * @return string
 */
function whr_demo_how_we_choose() {
	return '<p>Beautiful places are easy to find. Good care takes checking. Every sanctuary on We Have Rehabs carries one of three honest labels, so you know what you are booking before you get on a plane.</p>'
		. '<h2>The three care levels</h2>'
		. '<p><strong>Retreat</strong> — non-clinical wellbeing programs: rest, movement, coaching and community. A retreat is not a substitute for treatment.</p>'
		. '<p><strong>Clinical program</strong> — therapy is delivered by licensed mental-health clinicians. We ask for the facility’s local health license and the credentials of the clinicians who lead care.</p>'
		. '<p><strong>Medically supervised</strong> — doctors and nursing on site, including medical detox where offered.</p>'
		. '<h2>What we check</h2>'
		. '<p>For clinical and medically supervised programs we confirm the facility’s license with the local authority and show the date we last checked it on the profile. We ask every sanctuary to explain its emergency protocol and the nearest hospital.</p>'
		. '<h2>What we don’t do</h2>'
		. '<p>We don’t give medical advice, and we never sell your details. If you are in crisis, please contact a local emergency number or a crisis line.</p>';
}

/**
 * Journal posts: title, image, content, category.
 *
 * @return array
 */
function whr_demo_posts() {
	return array(
		array(
			'Retreat or treatment? Knowing what you truly need',
			'boho.jpg',
			'<p>A retreat and a treatment program can look alike online — the same pools, the same yoga decks. They are not the same thing.</p><p>Retreats are for rest and perspective when you are broadly well. If you are struggling to get through the day, using alcohol or other substances to cope, or have thoughts of harming yourself, look for a clinical or medically supervised program, and speak with your doctor before you travel.</p><p><em>Demo article — expand or replace.</em></p>',
			'Beginnings',
		),
		array(
			'Travelling abroad for healing: a practical guide',
			'hacienda.jpg',
			'<p>Going somewhere new can give you the distance you need. A little planning keeps the journey gentle: confirm entry rules for your passport, carry prescriptions with a doctor’s letter, ask the sanctuary about its emergency protocol, and arrange a therapist at home for when you return.</p><p><em>Demo article — expand or replace.</em></p>',
			'Care abroad',
		),
		array(
			'Carrying the stillness home with you',
			'beachview.jpg',
			'<p>The weeks after a stay matter as much as the stay itself. Before you leave, write down the two or three practices that helped most, book your first session with a therapist at home, and tell one person you trust how they can support you.</p><p><em>Demo article — expand or replace.</em></p>',
			'Coming home',
		),
	);
}

/**
 * Remove everything the importer created.
 *
 * @return string Summary.
 */
function whr_demo_remove() {
	$n     = 0;
	$posts = get_posts( array( 'post_type' => array( 'sanctuary', 'page', 'post', 'attachment' ), 'post_status' => 'any', 'numberposts' => -1, 'meta_key' => '_whr_demo', 'fields' => 'ids' ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	foreach ( $posts as $id ) {
		if ( 'attachment' === get_post_type( $id ) ) {
			wp_delete_attachment( $id, true );
		} else {
			wp_delete_post( $id, true );
		}
		++$n;
	}
	foreach ( array( 'destination', 'condition', 'care_level', 'approach', 'setting', 'category' ) as $tax ) {
		$terms = get_terms( array( 'taxonomy' => $tax, 'hide_empty' => false, 'meta_key' => 'whr_demo', 'fields' => 'ids' ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
		foreach ( is_wp_error( $terms ) ? array() : $terms as $term_id ) {
			wp_delete_term( $term_id, $tax );
		}
	}
	delete_option( 'whr_demo_media' );
	delete_option( 'whr_demo_imported' );
	/* translators: %d: items removed */
	return sprintf( __( 'Removed %d demo items.', 'wehaverehabs' ), $n );
}

/** Admin screen: Appearance → Demo content. */
add_action(
	'admin_menu',
	function () {
		add_theme_page(
			__( 'Demo content', 'wehaverehabs' ),
			__( 'Demo content', 'wehaverehabs' ),
			'manage_options',
			'whr-demo',
			function () {
				$message = '';
				if ( isset( $_POST['whr_demo_action'] ) && check_admin_referer( 'whr_demo' ) ) {
					$message = 'remove' === $_POST['whr_demo_action'] ? whr_demo_remove() : whr_demo_import();
				}
				echo '<div class="wrap"><h1>' . esc_html__( 'We Have Rehabs — demo content', 'wehaverehabs' ) . '</h1>';
				if ( $message ) {
					echo '<div class="notice notice-success"><p>' . esc_html( $message ) . '</p></div>';
				}
				echo '<p>' . esc_html__( 'Fill a fresh site with example sanctuaries, destinations, pages and photos matching the design. Everything is tagged and can be removed in one click.', 'wehaverehabs' ) . '</p><form method="post">';
				wp_nonce_field( 'whr_demo' );
				echo '<p><button class="button button-primary" name="whr_demo_action" value="import">' . esc_html__( 'Import demo content', 'wehaverehabs' ) . '</button> ';
				echo '<button class="button" name="whr_demo_action" value="remove" onclick="return confirm(\'' . esc_js( __( 'Delete all demo sanctuaries, pages, posts, terms and photos?', 'wehaverehabs' ) ) . '\')">' . esc_html__( 'Remove demo content', 'wehaverehabs' ) . '</button></p></form></div>';
			}
		);
	}
);

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command(
		'whr-demo',
		new class() {
			/**
			 * Import demo content.
			 */
			public function import() {
				WP_CLI::success( whr_demo_import() );
			}

			/**
			 * Remove demo content.
			 */
			public function remove() {
				WP_CLI::success( whr_demo_remove() );
			}
		}
	);
}
