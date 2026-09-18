<?php
/**
 * Copy for the About page.
 *
 * Kept in one place so it is easy to find and rewrite. Everything here is
 * either a fact about Tamarindo and the activities, or a statement about how
 * this business intends to operate. It states no founding year, no staff count,
 * no certification and no award, because the theme does not know those — those
 * belong in the page body, which the client edits.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * The "short version" panel beside the story.
 *
 * @return array<int, array<int, string>>
 */
function pt_about_facts() {
	$facts = array(
		array( __( 'Where', 'palmtreesurf' ), __( 'Tamarindo, Guanacaste, Costa Rica', 'palmtreesurf' ) ),
		array( __( 'What', 'palmtreesurf' ), __( 'Surf lessons, fishing charters, boat tours, wildlife trips and private days', 'palmtreesurf' ) ),
		array( __( 'Who it suits', 'palmtreesurf' ), __( 'First timers through to experienced surfers, families and mixed-ability groups', 'palmtreesurf' ) ),
		array( __( 'Season', 'palmtreesurf' ), __( 'Year round. Warm water, no wetsuits', 'palmtreesurf' ) ),
		array( __( 'Languages', 'palmtreesurf' ), __( 'English and Spanish', 'palmtreesurf' ) ),
	);

	$phone = pt_filled( 'pt_phone' );

	if ( $phone ) {
		$facts[] = array( __( 'Talk to us', 'palmtreesurf' ), $phone );
	}

	return apply_filters( 'pt_about_facts', $facts );
}

/**
 * The three steps in a booking.
 *
 * @return array<int, array<int, string>>
 */
function pt_about_steps() {
	return apply_filters(
		'pt_about_steps',
		array(
			array(
				__( 'Tell us what you want', 'palmtreesurf' ),
				__( 'Pick an experience and send the form, or message us with your dates and who is coming. If you are not sure what suits your group, say so — that is a normal question and we will answer it straight.', 'palmtreesurf' ),
			),
			array(
				__( 'We confirm the details', 'palmtreesurf' ),
				__( 'We come back with a time that works for the tide and the conditions that week, what to bring, and where to meet. Nothing is charged until the details are settled.', 'palmtreesurf' ),
			),
			array(
				__( 'You turn up and go', 'palmtreesurf' ),
				__( 'Gear is ready when you arrive. Your guide runs the safety briefing, and the rest of the day is the part you came for.', 'palmtreesurf' ),
			),
		)
	);
}

/**
 * How the business runs a day safely.
 *
 * @return array<int, array<int, string>>
 */
function pt_about_safety() {
	return apply_filters(
		'pt_about_safety',
		array(
			array(
				__( 'Conditions decide, not the calendar', 'palmtreesurf' ),
				__( 'If the surf, the swell or the weather is wrong for your group on the day, we move you rather than push you out in it. Nobody is put in water that does not suit their level.', 'palmtreesurf' ),
			),
			array(
				__( 'Small groups', 'palmtreesurf' ),
				__( 'Fewer people per guide is the single thing that most changes how a session goes — more attention, more waves, and someone who can actually see everyone.', 'palmtreesurf' ),
			),
			array(
				__( 'Gear that is checked', 'palmtreesurf' ),
				__( 'Boards, leashes, vests and tackle get looked at between sessions, not once a season. Tell us about sizes and any medical issue when you book so the right kit is waiting.', 'palmtreesurf' ),
			),
			array(
				__( 'Guides who know this coast', 'palmtreesurf' ),
				__( 'Sandbars move, tides shift and the estuary changes through the year. Local guides are worth more here than any equipment list.', 'palmtreesurf' ),
			),
		)
	);
}

/**
 * FAQ for the about page.
 *
 * Deliberately about how the business works, not about any one experience —
 * those FAQs live on the experience and category pages.
 *
 * @return array<int, array<int, string>>
 */
function pt_about_faq() {
	return apply_filters(
		'pt_about_faq',
		array(
			array(
				__( 'Do I need any experience?', 'palmtreesurf' ),
				__( 'For most of what we run, no. Surf lessons start from never having stood on a board, boat tours and estuary trips need nothing at all, and fishing charters are rigged and run by the crew. Where something does need experience, the experience page says so.', 'palmtreesurf' ),
			),
			array(
				__( 'When is the best time of year to come?', 'palmtreesurf' ),
				__( 'There is no bad time. The dry months are sunnier and busier; the green season is quieter, greener and has bigger swell, with rain that usually comes in the afternoon. Tell us when you can travel and we will tell you honestly what that period is like.', 'palmtreesurf' ),
			),
			array(
				__( 'How far ahead should I book?', 'palmtreesurf' ),
				__( 'Sooner is better in the busy months, especially for private days and full-day charters. Short notice is often still fine — message us and we will tell you what is open.', 'palmtreesurf' ),
			),
			array(
				__( 'How do I pay?', 'palmtreesurf' ),
				__( 'Send the booking form first. We confirm the details with you, and payment is arranged once that is settled — nothing is taken before you know the time, the meeting point and what is included.', 'palmtreesurf' ),
			),
			array(
				__( 'What happens if the weather is bad?', 'palmtreesurf' ),
				__( 'We move you to a better tide or another day. We would rather reschedule than run a session that is not worth your time.', 'palmtreesurf' ),
			),
			array(
				__( 'Can you take families and mixed groups?', 'palmtreesurf' ),
				__( 'Yes, and it is one of the most common things we are asked for. Tell us the ages, who has done what before and how confident everyone is in water, and we will build the day around that rather than splitting the group up.', 'palmtreesurf' ),
			),
			array(
				__( 'Do you speak English?', 'palmtreesurf' ),
				__( 'Yes. English and Spanish, both.', 'palmtreesurf' ),
			),
			array(
				__( 'What should I bring?', 'palmtreesurf' ),
				__( 'Swimwear, reef-safe sunscreen, a hat, water and a towel will cover nearly everything. Anything specific to your trip is listed on its own page, and we send it again when we confirm.', 'palmtreesurf' ),
			),
		)
	);
}

/**
 * FAQPage schema for the about page.
 */
function pt_print_about_schema() {
	if ( ! is_page_template( 'page-templates/page-about.php' ) ) {
		return;
	}

	$entities = array();

	foreach ( pt_about_faq() as $pair ) {
		$entities[] = array(
			'@type'          => 'Question',
			'name'           => $pair[0],
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => $pair[1],
			),
		);
	}

	if ( ! $entities ) {
		return;
	}

	pt_print_jsonld(
		array(
			'@context'   => 'https://schema.org',
			'@type'      => 'FAQPage',
			'mainEntity' => $entities,
		)
	);
}
add_action( 'wp_head', 'pt_print_about_schema', 32 );
