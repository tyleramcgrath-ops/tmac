<?php
/**
 * Experience category and skill-level archives.
 *
 * Two separate jobs live here:
 *
 * 1. Routing. `archive-{post_type}.php` is only ever consulted for
 *    `is_post_type_archive()`. A taxonomy archive walks a different branch of
 *    the hierarchy — taxonomy-{tax}-{term} → taxonomy-{tax} → taxonomy →
 *    archive → index — so without the filter below, /experiences/category/x/
 *    resolved fine but rendered through archive.php, i.e. the blog layout with
 *    the default sidebar, a "Category:" title prefix and dated post cards.
 *
 * 2. Content. Every category page needs real copy to stand on its own in
 *    search. The term description is the editable surface (Experiences →
 *    Categories in wp-admin); the supporting sections are theme copy keyed by
 *    the term slug, so renaming a term in the admin keeps them attached.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * The taxonomies that belong to the experiences listing.
 *
 * @return array<int, string>
 */
function pt_experience_taxonomies() {
	return array( 'experience_type', 'skill_level' );
}

/**
 * Render experience taxonomy archives through the experiences listing template.
 *
 * @param string $template Template WordPress resolved.
 * @return string
 */
function pt_taxonomy_template( $template ) {
	if ( ! is_tax( pt_experience_taxonomies() ) ) {
		return $template;
	}

	$listing = locate_template( 'archive-experience.php' );

	return $listing ? $listing : $template;
}
add_filter( 'taxonomy_template', 'pt_taxonomy_template' );

/**
 * Drop the "Category:" / "Skill level:" prefix from the archive title.
 *
 * The hero already says what the page is; the term name alone is also the
 * better H1 for search.
 *
 * @param string $prefix Default prefix.
 * @return string
 */
function pt_archive_title_prefix( $prefix ) {
	return is_tax( pt_experience_taxonomies() ) ? '' : $prefix;
}
add_filter( 'get_the_archive_title_prefix', 'pt_archive_title_prefix' );

/**
 * Editorial copy for each seeded term, keyed by slug.
 *
 * `description` seeds the term description once and is editable thereafter.
 * `intro`, `highlights`, `know` and `faq` are theme copy — they describe the
 * activity and the place, and deliberately state no price, duration,
 * availability or rating, because those belong to the individual experience.
 *
 * @return array<string, array<string, mixed>>
 */
function pt_term_copy_map() {
	return array(
		'surf-lessons'     => array(
			'description' => __( 'Learn to surf in Tamarindo, on a long sand-bottom beach break that forgives mistakes. Lessons run with local instructors, soft-top boards and small groups, from a first-ever pop-up through to sharpening a turn.', 'palmtreesurf' ),
			'intro'       => array(
				__( 'Tamarindo is one of the easiest places in Costa Rica to start surfing. The break is sand-bottom rather than reef, the wave rolls rather than dumps, and the water is warm enough year-round that nobody needs a wetsuit. That combination is why the town became a teaching beach in the first place.', 'palmtreesurf' ),
				__( 'A lesson starts on the sand with safety, positioning and the pop-up, then moves into the whitewater where the instructor pushes you into waves until you are catching them yourself. Most people stand up in their first session. From there, the progression is about reading the wave rather than balancing on the board.', 'palmtreesurf' ),
			),
			'highlights'  => array(
				array( __( 'Sand-bottom beach break', 'palmtreesurf' ), __( 'No reef, no rocks. Falling off is part of learning here, and the bottom forgives it.', 'palmtreesurf' ) ),
				array( __( 'Boards and safety gear included', 'palmtreesurf' ), __( 'Soft-top boards sized to you, leash and rash guard. Bring sunscreen and water.', 'palmtreesurf' ) ),
				array( __( 'Small groups', 'palmtreesurf' ), __( 'Fewer people per instructor means more waves and more corrections that actually land.', 'palmtreesurf' ) ),
				array( __( 'Local instructors', 'palmtreesurf' ), __( 'People who surf this beach daily and know where the sandbars sit this month.', 'palmtreesurf' ) ),
			),
			'know'        => array(
				__( 'You do not need to be a strong swimmer to start, but you should be comfortable in waist-deep moving water.', 'palmtreesurf' ),
				__( 'Reef-safe sunscreen, a hat and water are the three things people most often forget.', 'palmtreesurf' ),
				__( 'Tides shape the session. Message us and we will point you at the hours that suit your level that week.', 'palmtreesurf' ),
			),
			'faq'         => array(
				array( __( 'Have never surfed. Is that a problem?', 'palmtreesurf' ), __( 'No. Most first lessons here are with people who have never touched a board. The session is built around that.', 'palmtreesurf' ) ),
				array( __( 'What should I bring?', 'palmtreesurf' ), __( 'Swimwear, reef-safe sunscreen, water and a towel. Boards, leashes and rash guards come with the lesson.', 'palmtreesurf' ) ),
				array( __( 'Can children take a lesson?', 'palmtreesurf' ), __( 'Yes, with an instructor in the water alongside them. Tell us their age and swimming confidence when you book so we size the board and the group correctly.', 'palmtreesurf' ) ),
				array( __( 'What if the surf is flat or too big?', 'palmtreesurf' ), __( 'We move the session to a better tide or another day. Nobody is put in water that does not suit their level.', 'palmtreesurf' ) ),
			),
		),
		'fishing-charters' => array(
			'description' => __( 'Fish the Guanacaste coast with captains who work these waters every week. Inshore runs along the rocky points and headlands, or offshore into blue water — tackle, bait and crew aboard.', 'palmtreesurf' ),
			'intro'       => array(
				__( 'The water off Tamarindo drops away quickly, so both inshore and offshore fishing are within reach of the same launch. Inshore runs work the rocky points and headlands close to the coast. Offshore trips push out to blue water, where the pelagic species are.', 'palmtreesurf' ),
				__( 'Charters go out with a captain and mate who fish this stretch of coast year-round. Rods, tackle and bait are aboard, so you can turn up with sunscreen and a hat and nothing else.', 'palmtreesurf' ),
			),
			'highlights'  => array(
				array( __( 'Inshore and offshore', 'palmtreesurf' ), __( 'Work the points close in, or run out to blue water. Tell us which you want.', 'palmtreesurf' ) ),
				array( __( 'Tackle and bait aboard', 'palmtreesurf' ), __( 'Rods, terminal tackle and bait are provided. Bring your own gear if you prefer it.', 'palmtreesurf' ) ),
				array( __( 'Captain and mate', 'palmtreesurf' ), __( 'Crew who read this coast daily and will put you where the fish are that week.', 'palmtreesurf' ) ),
				array( __( 'Half or full day', 'palmtreesurf' ), __( 'A half day suits a first trip. A full day is what offshore really needs.', 'palmtreesurf' ) ),
			),
			'know'        => array(
				__( 'Seasons move. What is running offshore in one month is not what is running in another — ask us before you pick a date if a particular species matters to you.', 'palmtreesurf' ),
				__( 'If you are prone to seasickness, take something before you board rather than after.', 'palmtreesurf' ),
				__( 'Costa Rica requires a sport fishing licence. Tell us when you book and we will sort it out with you.', 'palmtreesurf' ),
			),
			'faq'         => array(
				array( __( 'Do I need experience?', 'palmtreesurf' ), __( 'No. The crew rig everything and will walk you through the fight. Plenty of first-time anglers go out.', 'palmtreesurf' ) ),
				array( __( 'Can we keep what we catch?', 'palmtreesurf' ), __( 'Some species yes, some are catch-and-release under Costa Rican rules. The captain will tell you which is which on the day.', 'palmtreesurf' ) ),
				array( __( 'What should I bring?', 'palmtreesurf' ), __( 'Sunscreen, a hat, sunglasses and a light long-sleeve layer. Food and drinks depend on the charter — check the trip you are booking.', 'palmtreesurf' ) ),
			),
		),
		'boat-tours'       => array(
			'description' => __( 'See the Guanacaste coastline from the water. Sunset cruises, snorkel stops and coastal runs to beaches you cannot reach on foot.', 'palmtreesurf' ),
			'intro'       => array(
				__( 'The coast north and south of Tamarindo is mostly headland and small bay, and a lot of it has no road to it. From the water you get the whole line of it — the cliffs, the empty sand, the places the estuary opens out.', 'palmtreesurf' ),
				__( 'Most tours build in a swim and snorkel stop in calmer water, then time the return so you are offshore as the light drops. That last hour is the reason people book these.', 'palmtreesurf' ),
			),
			'highlights'  => array(
				array( __( 'Swim and snorkel stop', 'palmtreesurf' ), __( 'Anchored in calm water, with gear aboard.', 'palmtreesurf' ) ),
				array( __( 'Sunset timing', 'palmtreesurf' ), __( 'The route is planned so the light is behind you on the way back in.', 'palmtreesurf' ) ),
				array( __( 'Beaches with no road', 'palmtreesurf' ), __( 'Coves along this coast are reachable only from the water.', 'palmtreesurf' ) ),
				array( __( 'Easy for all ages', 'palmtreesurf' ), __( 'No skill needed. Snorkelling is optional — plenty of people stay aboard.', 'palmtreesurf' ) ),
			),
			'know'        => array(
				__( 'Bring a layer. It cools off quickly once the sun is down and you are moving on the water.', 'palmtreesurf' ),
				__( 'Reef-safe sunscreen only if you plan to get in the water.', 'palmtreesurf' ),
				__( 'Tell us in advance if anyone in the group cannot swim, so the crew can plan the stop around it.', 'palmtreesurf' ),
			),
			'faq'         => array(
				array( __( 'Do I have to snorkel?', 'palmtreesurf' ), __( 'No. The stop is optional and the boat is comfortable to stay on.', 'palmtreesurf' ) ),
				array( __( 'Is it suitable for young children?', 'palmtreesurf' ), __( 'Generally yes. Tell us their ages when you book so the crew has the right life vests aboard.', 'palmtreesurf' ) ),
				array( __( 'What happens if the weather turns?', 'palmtreesurf' ), __( 'The captain calls it. If a trip cannot run safely we move it rather than push it.', 'palmtreesurf' ) ),
			),
		),
		'wildlife-nature'  => array(
			'description' => __( 'The estuary, the mangroves and the dry forest behind Tamarindo. Early-morning paddles and guided trips, when the birds and howler monkeys are loudest and the heat has not arrived.', 'palmtreesurf' ),
			'intro'       => array(
				__( 'Behind the beach, the Tamarindo estuary runs back into mangrove channels that sit inside a protected wildlife refuge. It is a different place from the surf town two hundred metres away — quiet, shaded, and busy with birds.', 'palmtreesurf' ),
				__( 'Go at first light. The howler monkeys are calling, the herons and kingfishers are working the channels, and the water is glass. By mid-morning the wind comes up and most of it has gone quiet again.', 'palmtreesurf' ),
			),
			'highlights'  => array(
				array( __( 'Protected mangrove channels', 'palmtreesurf' ), __( 'Narrow, shaded water inside the refuge behind the beach.', 'palmtreesurf' ) ),
				array( __( 'First-light departures', 'palmtreesurf' ), __( 'The hour that actually has the wildlife in it.', 'palmtreesurf' ) ),
				array( __( 'Guided, not just rented', 'palmtreesurf' ), __( 'A naturalist who can find and name what you are looking at.', 'palmtreesurf' ) ),
				array( __( 'No experience needed', 'palmtreesurf' ), __( 'Flat water. If you can sit in a kayak you can do this.', 'palmtreesurf' ) ),
			),
			'know'        => array(
				__( 'Bring insect repellent, a hat and a dry bag for a phone or camera.', 'palmtreesurf' ),
				__( 'Wildlife is wild. Guides know where animals usually are, and no trip can promise a particular species.', 'palmtreesurf' ),
				__( 'The refuge has rules about distance and noise. Your guide will explain them before you set off.', 'palmtreesurf' ),
			),
			'faq'         => array(
				array( __( 'What will we see?', 'palmtreesurf' ), __( 'Commonly howler monkeys, herons, kingfishers, crabs and iguanas, and sometimes crocodiles at a distance. Nothing is guaranteed — that is what makes it worth going early.', 'palmtreesurf' ) ),
				array( __( 'Is it safe for kids?', 'palmtreesurf' ), __( 'Yes, on flat water with a guide and life vests. Tell us ages when you book.', 'palmtreesurf' ) ),
				array( __( 'Kayak or paddleboard?', 'palmtreesurf' ), __( 'Either. Kayaks are steadier and easier for a first time; paddleboards give you a higher view into the channels.', 'palmtreesurf' ) ),
			),
		),
		'adventure'        => array(
			'description' => __( 'Inland Guanacaste — waterfalls, backroads and dry forest. The trips that get you off the beach for a day.', 'palmtreesurf' ),
			'intro'       => array(
				__( 'Guanacaste is not only coastline. An hour inland the dry forest starts, and with it the waterfalls, river crossings and ridge roads that most visitors never see because they stay on the sand.', 'palmtreesurf' ),
				__( 'These are the half and full-day trips to fill a flat surf day, or to break up a week on the beach with something that involves a bit more dirt.', 'palmtreesurf' ),
			),
			'highlights'  => array(
				array( __( 'Waterfalls and swimming holes', 'palmtreesurf' ), __( 'Fresh water, shade and a break from the heat.', 'palmtreesurf' ) ),
				array( __( 'Backroads and dry forest', 'palmtreesurf' ), __( 'The inland side of Guanacaste, away from the coast road.', 'palmtreesurf' ) ),
				array( __( 'Good on a flat day', 'palmtreesurf' ), __( 'When the surf is not working, this is where the day goes.', 'palmtreesurf' ) ),
				array( __( 'Guided throughout', 'palmtreesurf' ), __( 'Someone who knows which crossings are passable this week.', 'palmtreesurf' ) ),
			),
			'know'        => array(
				__( 'Closed shoes, not flip-flops. Bring a change of clothes and a dry bag.', 'palmtreesurf' ),
				__( 'Green-season rain changes what is passable. Routes get adjusted on the day rather than cancelled.', 'palmtreesurf' ),
				__( 'Tell us about any back or neck problems before you book a rough-road trip.', 'palmtreesurf' ),
			),
			'faq'         => array(
				array( __( 'How rough is it?', 'palmtreesurf' ), __( 'It varies by trip. Ask us and we will match one to what your group is up for.', 'palmtreesurf' ) ),
				array( __( 'Do I need a licence?', 'palmtreesurf' ), __( 'For anything you drive yourself, yes — bring it with you. Guided trips where you are a passenger do not need one.', 'palmtreesurf' ) ),
				array( __( 'Can we combine it with a surf lesson?', 'palmtreesurf' ), __( 'Yes, on separate days or split across one. Message us and we will lay the week out.', 'palmtreesurf' ) ),
			),
		),
		'private-custom'   => array(
			'description' => __( 'One instructor, one guide, your schedule. Private coaching and custom-built days for couples, families and groups who want the trip shaped around them.', 'palmtreesurf' ),
			'intro'       => array(
				__( 'Some people learn faster one-to-one. Some groups want a day built around a birthday, an anniversary or a family that ranges from eight to sixty-eight. That is what this is for.', 'palmtreesurf' ),
				__( 'Tell us who is coming, what they can already do and how much time you have, and we will put the days together — surf, water, inland, or a mix — and keep the same guide with you through it.', 'palmtreesurf' ),
			),
			'highlights'  => array(
				array( __( 'One-to-one coaching', 'palmtreesurf' ), __( 'Every correction is yours. The fastest way to move past a plateau.', 'palmtreesurf' ) ),
				array( __( 'Built around your dates', 'palmtreesurf' ), __( 'We work back from when you are here and what the tides are doing.', 'palmtreesurf' ) ),
				array( __( 'Mixed-ability groups', 'palmtreesurf' ), __( 'Families and friends who are not all at the same level, kept together.', 'palmtreesurf' ) ),
				array( __( 'Multi-day plans', 'palmtreesurf' ), __( 'A week that actually progresses, instead of five separate first lessons.', 'palmtreesurf' ) ),
			),
			'know'        => array(
				__( 'The more you tell us up front — ages, swimming confidence, what people have done before — the better the plan comes back.', 'palmtreesurf' ),
				__( 'Private days book out first in the busy months. Ask early if your dates are fixed.', 'palmtreesurf' ),
				__( 'Anything you want in the day that is not listed here, ask. If we cannot run it, we know who does.', 'palmtreesurf' ),
			),
			'faq'         => array(
				array( __( 'How far ahead should I ask?', 'palmtreesurf' ), __( 'As soon as your dates are set. We can usually still put something together at short notice, but the choice is wider earlier.', 'palmtreesurf' ) ),
				array( __( 'Can you handle a group where nobody has surfed?', 'palmtreesurf' ), __( 'Yes. That is one of the most common private bookings.', 'palmtreesurf' ) ),
				array( __( 'Can you combine activities in one day?', 'palmtreesurf' ), __( 'Usually, depending on tides and travel time. Send us the day you have in mind and we will tell you honestly whether it fits.', 'palmtreesurf' ) ),
			),
		),
		'first-timer'      => array(
			'description' => __( 'Never done it before. Experiences built for a first session, where the instructor assumes nothing and the water is chosen to suit.', 'palmtreesurf' ),
		),
		'beginner'         => array(
			'description' => __( 'You have had a go, you can stand up some of the time, and you want the next piece. Sessions that build on a first lesson instead of repeating it.', 'palmtreesurf' ),
		),
		'intermediate'     => array(
			'description' => __( 'Catching unbroken waves and looking for direction, timing and turns. Coaching that works on what you are already doing rather than on the basics.', 'palmtreesurf' ),
		),
		'advanced'         => array(
			'description' => __( 'You surf. You want the right sandbar, the right tide and someone who knows this coast well enough to save you the guesswork.', 'palmtreesurf' ),
		),
		'all-levels'       => array(
			'description' => __( 'Nothing here needs prior experience, and nothing here is dull if you have some. Bring a mixed group without splitting it up.', 'palmtreesurf' ),
		),
	);
}

/**
 * The editorial copy for a term, if the theme ships any for its slug.
 *
 * @param WP_Term|null $term Term object.
 * @return array<string, mixed>
 */
function pt_term_copy( $term = null ) {
	if ( ! $term instanceof WP_Term ) {
		$term = get_queried_object();
	}

	if ( ! $term instanceof WP_Term ) {
		return array();
	}

	$map = pt_term_copy_map();

	return isset( $map[ $term->slug ] ) ? $map[ $term->slug ] : array();
}

/**
 * Write the starter term descriptions, without ever overwriting an edit.
 *
 * Runs on a version gate rather than on activation, so uploading a new theme
 * zip picks up copy added since the client installed the last one. A term whose
 * description already has anything in it is left completely alone.
 */
function pt_sync_term_copy() {
	if ( get_option( 'pt_term_copy_version' ) === PT_VERSION ) {
		return;
	}

	// Write the marker first: a failure midway must not loop on every request.
	update_option( 'pt_term_copy_version', PT_VERSION );

	foreach ( pt_term_copy_map() as $slug => $copy ) {
		if ( empty( $copy['description'] ) ) {
			continue;
		}

		foreach ( pt_experience_taxonomies() as $taxonomy ) {
			$term = get_term_by( 'slug', $slug, $taxonomy );

			if ( ! $term instanceof WP_Term || '' !== trim( $term->description ) ) {
				continue;
			}

			wp_update_term( $term->term_id, $taxonomy, array( 'description' => $copy['description'] ) );
		}
	}
}
add_action( 'init', 'pt_sync_term_copy', 996 );

/**
 * The image slot backing a term's hero, when the manifest defines one.
 *
 * @param WP_Term $term Term object.
 * @return string Slot key, or an empty string.
 */
function pt_term_image_slot( $term ) {
	if ( ! $term instanceof WP_Term ) {
		return '';
	}

	$slot = 'tax-' . $term->slug;

	return pt_image_slot( $slot ) ? $slot : '';
}

/**
 * Render a term's hero photo.
 *
 * Resolution order matches the rest of the theme: an attachment the client
 * picked on the term edit screen, then the manifest slot for that term, then
 * the shared coastal banner.
 *
 * @param WP_Term $term Term object.
 */
function pt_term_image( $term ) {
	$attachment_id = $term instanceof WP_Term ? (int) get_term_meta( $term->term_id, 'pt_term_image', true ) : 0;

	if ( $attachment_id ) {
		echo wp_get_attachment_image(
			$attachment_id,
			'full',
			false,
			array(
				'class'         => 'pt-image pt-image--term',
				'alt'           => '',
				'decoding'      => 'async',
				'fetchpriority' => 'high',
			)
		);
		return;
	}

	$slot = pt_term_image_slot( $term );

	pt_image( $slot ? $slot : 'story-banner', array( 'priority' => true ) );
}

/**
 * Register the term image so it is available to the REST API and to blocks.
 */
function pt_register_term_meta() {
	foreach ( pt_experience_taxonomies() as $taxonomy ) {
		register_term_meta(
			$taxonomy,
			'pt_term_image',
			array(
				'type'              => 'integer',
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => 'absint',
				'auth_callback'     => function () {
					return current_user_can( 'manage_categories' );
				},
			)
		);
	}
}
add_action( 'init', 'pt_register_term_meta', 12 );

/**
 * The image field on the term add and edit screens.
 *
 * @param WP_Term|string $term Term being edited, or the taxonomy slug on the add form.
 */
function pt_term_image_field( $term ) {
	$is_edit       = $term instanceof WP_Term;
	$attachment_id = $is_edit ? (int) get_term_meta( $term->term_id, 'pt_term_image', true ) : 0;
	$preview       = $attachment_id ? wp_get_attachment_image_url( $attachment_id, 'medium' ) : '';

	wp_enqueue_media();

	$label = esc_html__( 'Header photo', 'palmtreesurf' );
	$help  = esc_html__( 'Shown behind the title at the top of this category page. Leave empty to use the photo the theme ships for it.', 'palmtreesurf' );
	$pick  = esc_html__( 'Choose photo', 'palmtreesurf' );
	$clear = esc_html__( 'Remove', 'palmtreesurf' );

	$field = '<div class="pt-term-image">'
		. '<input type="hidden" name="pt_term_image" id="pt-term-image" value="' . esc_attr( (string) $attachment_id ) . '" />'
		. '<p><img id="pt-term-image-preview" src="' . esc_url( $preview ) . '" alt="" style="max-width:240px;height:auto;display:' . ( $preview ? 'block' : 'none' ) . ';" /></p>'
		. '<p><button type="button" class="button" id="pt-term-image-pick">' . $pick . '</button> '
		. '<button type="button" class="button-link" id="pt-term-image-clear">' . $clear . '</button></p>'
		. '<p class="description">' . $help . '</p>'
		. '</div>';

	if ( $is_edit ) {
		echo '<tr class="form-field"><th scope="row"><label for="pt-term-image">' . $label . '</label></th><td>' . $field . '</td></tr>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built from escaped parts above.
	} else {
		echo '<div class="form-field"><label for="pt-term-image">' . $label . '</label>' . $field . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built from escaped parts above.
	}

	wp_add_inline_script(
		'media-editor',
		'(function($){$(function(){var f=$("#pt-term-image"),p=$("#pt-term-image-preview"),m;' .
		'$("#pt-term-image-pick").on("click",function(e){e.preventDefault();' .
		'if(!m){m=wp.media({title:' . wp_json_encode( __( 'Header photo', 'palmtreesurf' ) ) . ',multiple:false});' .
		'm.on("select",function(){var a=m.state().get("selection").first().toJSON();f.val(a.id);' .
		'p.attr("src",(a.sizes&&a.sizes.medium?a.sizes.medium.url:a.url)).show();});}m.open();});' .
		'$("#pt-term-image-clear").on("click",function(e){e.preventDefault();f.val("");p.hide();});});})(jQuery);'
	);
}

/**
 * Save the term image.
 *
 * @param int $term_id Term being saved.
 */
function pt_save_term_image( $term_id ) {
	if ( ! current_user_can( 'manage_categories' ) ) {
		return;
	}

	// Nonce is verified by WordPress before `edited_{taxonomy}` fires.
	if ( ! isset( $_POST['pt_term_image'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
		return;
	}

	$attachment_id = absint( wp_unslash( $_POST['pt_term_image'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

	if ( $attachment_id ) {
		update_term_meta( $term_id, 'pt_term_image', $attachment_id );
	} else {
		delete_term_meta( $term_id, 'pt_term_image' );
	}
}

/**
 * Hook the field onto both experience taxonomies.
 */
function pt_term_image_admin() {
	foreach ( pt_experience_taxonomies() as $taxonomy ) {
		add_action( $taxonomy . '_add_form_fields', 'pt_term_image_field' );
		add_action( $taxonomy . '_edit_form_fields', 'pt_term_image_field' );
		add_action( 'created_' . $taxonomy, 'pt_save_term_image' );
		add_action( 'edited_' . $taxonomy, 'pt_save_term_image' );
	}
}
add_action( 'admin_init', 'pt_term_image_admin' );

/**
 * FAQPage markup for a category archive that carries FAQ copy.
 *
 * Mirrors the visible accordion exactly, which is the only way Google accepts
 * it.
 *
 * @return array<string, mixed>
 */
function pt_term_faq_schema() {
	$copy = pt_term_copy();

	if ( empty( $copy['faq'] ) ) {
		return array();
	}

	$entities = array();

	foreach ( $copy['faq'] as $pair ) {
		$entities[] = array(
			'@type'          => 'Question',
			'name'           => $pair[0],
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => $pair[1],
			),
		);
	}

	return array(
		'@context'   => 'https://schema.org',
		'@type'      => 'FAQPage',
		'mainEntity' => $entities,
	);
}

/**
 * Emit the category FAQ schema.
 */
function pt_print_term_schema() {
	if ( ! is_tax( pt_experience_taxonomies() ) ) {
		return;
	}

	pt_print_jsonld( pt_term_faq_schema() );
}
add_action( 'wp_head', 'pt_print_term_schema', 31 );
