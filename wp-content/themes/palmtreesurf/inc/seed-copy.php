<?php
/**
 * Starter page and experience copy.
 *
 * Written to be genuinely useful to a reader and substantial enough to rank,
 * rather than keyword filler. Everything here is either general, verifiable
 * information about surfing in Tamarindo, or a description of how a session
 * of this kind normally runs.
 *
 * No business-specific claim is invented: no prices, no guide names, no
 * certifications, no review figures. Anything that needs the operator's own
 * knowledge is flagged in TODO-CONTENT.md.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Wrap paragraphs and headings as block markup.
 *
 * @param array $blocks Ordered list of [type, text] pairs.
 * @return string
 */
function pt_blocks( $blocks ) {
	$out = '';

	foreach ( $blocks as $block ) {
		list( $type, $text ) = $block;

		if ( 'h2' === $type ) {
			$out .= '<!-- wp:heading --><h2 class="wp-block-heading">' . esc_html( $text ) . '</h2><!-- /wp:heading -->';
		} elseif ( 'h3' === $type ) {
			$out .= '<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">' . esc_html( $text ) . '</h3><!-- /wp:heading -->';
		} elseif ( 'list' === $type ) {
			$items = '';
			foreach ( (array) $text as $item ) {
				$items .= '<!-- wp:list-item --><li>' . esc_html( $item ) . '</li><!-- /wp:list-item -->';
			}
			$out .= '<!-- wp:list --><ul class="wp-block-list">' . $items . '</ul><!-- /wp:list -->';
		} else {
			$out .= '<!-- wp:paragraph --><p>' . esc_html( $text ) . '</p><!-- /wp:paragraph -->';
		}
	}

	return $out;
}

/**
 * Long-form body copy for each seeded experience, keyed by slug.
 *
 * @return array<string, string>
 */
function pt_seed_bodies() {
	$bodies = array();

	$bodies['surf-lesson-beginner'] = pt_blocks(
		array(
			array( 'p', __( 'If you have never stood on a surfboard, Tamarindo is one of the kinder places in the world to try. The main beach breaks over sand rather than reef, the waves roll in long and slow, and the water sits warm enough all year that nobody needs a wetsuit. A beginner lesson here is about catching real waves on day one, not spending an hour being lectured on the sand.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Who this lesson is for', 'palmtreesurf' ) ),
			array( 'p', __( 'This is the right session if you have never surfed, or tried once years ago and want to start again properly. You do not need to be an athlete. You do need to be comfortable in water around waist to chest deep, and happy to fall in a few times — everyone does, and the water is warm.', 'palmtreesurf' ) ),
			array( 'p', __( 'Children can join with a parent. If anyone in your group is a nervous swimmer, tell us when you book and we will pair them with a guide who stays alongside them the whole session.', 'palmtreesurf' ) ),

			array( 'h2', __( 'How the session runs', 'palmtreesurf' ) ),
			array( 'p', __( 'You meet your guide on the beach and get sized for a board. Beginners ride soft-top longboards — they are stable, they float, and they do not hurt when they bump you. Your guide checks the tide and picks the stretch of beach that is working best that morning.', 'palmtreesurf' ) ),
			array( 'p', __( 'On the sand you cover the essentials: how to lie on the board, where to put your hands, how to pop up, and the safety rules that matter — how to fall flat, how to protect your head, and how to spot other surfers. That part is short on purpose.', 'palmtreesurf' ) ),
			array( 'p', __( 'Then you are in the water. Your guide pushes you into whitewater waves first, calling when to paddle, and corrects your stance between waves rather than afterwards. Most people stand up in their first session. Plenty ride a wave all the way in.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What to expect from the ocean', 'palmtreesurf' ) ),
			array( 'p', __( 'Conditions change with the tide and swell, so no two mornings are identical. Smaller, cleaner conditions are usually better for learning, and your guide will move the group or adjust the plan to find them. Surf is weather — if a day is genuinely unsafe for beginners, we would rather reschedule you than put you in it.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Questions people ask before booking', 'palmtreesurf' ) ),
			array( 'h3', __( 'Do I need to bring a board?', 'palmtreesurf' ) ),
			array( 'p', __( 'No. Boards are included and matched to your height and weight, which is why we ask for those when you book.', 'palmtreesurf' ) ),
			array( 'h3', __( 'What should I wear?', 'palmtreesurf' ) ),
			array( 'p', __( 'Swimwear you can move in, and something that will not come off in the water. A rash guard is provided — the sun here is stronger than most visitors expect, and you will be in it for a while.', 'palmtreesurf' ) ),
			array( 'h3', __( 'Will I actually stand up?', 'palmtreesurf' ) ),
			array( 'p', __( 'Most first-timers do, at least briefly. Standing is the easy part — staying up takes a few sessions. Nobody should promise you a specific outcome on a moving ocean.', 'palmtreesurf' ) ),
		)
	);

	$bodies['surf-lesson-intermediate'] = pt_blocks(
		array(
			array( 'p', __( 'You can stand up and ride whitewater, and now you want to get out past the break, read what the ocean is doing, and ride an unbroken wave. That gap is where most surfers stall for years on their own. A focused session closes it much faster.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What you work on', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Paddling technique and getting out through the break efficiently', 'palmtreesurf' ),
				__( 'Reading a set and choosing which wave to go for', 'palmtreesurf' ),
				__( 'Timing the take-off so you are not too early or too late', 'palmtreesurf' ),
				__( 'Angling along the face instead of straight to the beach', 'palmtreesurf' ),
				__( 'Line-up etiquette, priority and how not to drop in on someone', 'palmtreesurf' ),
			) ),

			array( 'h2', __( 'Why the coaching matters more than the hours', 'palmtreesurf' ) ),
			array( 'p', __( 'Most intermediate surfers repeat the same handful of mistakes because nobody is watching from the outside. A guide in the water with you sees that you are paddling with your head down, or popping up on your knees first, and tells you between waves while it is still fresh. One session of that is worth a lot of unsupervised ones.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Boards', 'palmtreesurf' ) ),
			array( 'p', __( 'You move to a board matched to your level rather than a beginner soft-top — usually something with less volume that turns more easily. If you are between sizes, your guide will have you try two and feel the difference.', 'palmtreesurf' ) ),
		)
	);

	$bodies['private-surf-coaching'] = pt_blocks(
		array(
			array( 'p', __( 'One guide, one surfer, and a session built entirely around what you want to fix. Private coaching suits people who learn faster without an audience, surfers working on something specific, and anyone who simply wants the ocean time to be theirs.', 'palmtreesurf' ) ),

			array( 'h2', __( 'How it differs from a group lesson', 'palmtreesurf' ) ),
			array( 'p', __( 'In a group, a guide splits attention across several people and the session runs at the pace of the group. Privately, every wave is yours and the feedback is continuous. Sessions tend to cover far more ground in the same time.', 'palmtreesurf' ) ),
			array( 'p', __( 'It also means the plan can change mid-session. If the thing holding you back turns out to be your paddling rather than your pop-up, the whole session can pivot to that.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Good reasons to book privately', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'You are nervous in the ocean and want someone beside you the whole time', 'palmtreesurf' ),
				__( 'You are returning to surfing after an injury or a long gap', 'palmtreesurf' ),
				__( 'You have plateaued and cannot tell what you are doing wrong', 'palmtreesurf' ),
				__( 'You want video or photo feedback of your own surfing', 'palmtreesurf' ),
				__( 'You would rather not learn in front of a group', 'palmtreesurf' ),
			) ),
		)
	);

	$bodies['fishing-charter'] = pt_blocks(
		array(
			array( 'p', __( 'The water off Guanacaste drops away quickly, which means productive fishing grounds are a short run from the beach rather than a long offshore slog. Half-day trips leave early and are back before the afternoon heat; full days push further out.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What the day looks like', 'palmtreesurf' ) ),
			array( 'p', __( 'You leave from the beach in the morning, when the water is usually calmest. The crew sets lines once you reach the grounds and handles the technical work — rigging, bait, and getting a fish to the boat if you hook something large. You do as much or as little of the work as you want.', 'palmtreesurf' ) ),

			array( 'h2', __( 'For first-timers', 'palmtreesurf' ) ),
			array( 'p', __( 'You do not need experience or your own gear. Tell the crew it is your first trip and they will walk you through how to hold the rod, when to let line run, and how to bring a fish in without losing it. It is a normal thing to book with no background at all.', 'palmtreesurf' ) ),
			array( 'p', __( 'If you are prone to seasickness, take something before you leave rather than once you are out — it works far better that way. Mornings are generally the flattest water of the day.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Catch and release', 'palmtreesurf' ) ),
			array( 'p', __( 'Billfish are released as a matter of course. Talk to the crew about what is in season and what is reasonable to keep — they know the local rules and will tell you straight.', 'palmtreesurf' ) ),
		)
	);

	$bodies['sunset-boat-tour'] = pt_blocks(
		array(
			array( 'p', __( 'The coastline north and south of Tamarindo is mostly undeveloped, and the easiest way to see it is from the water in the last two hours of light. The boat runs along the shore, stops somewhere sheltered for a swim and a snorkel, and turns for home as the sun drops.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What you see', 'palmtreesurf' ) ),
			array( 'p', __( 'Rocky headlands, empty beaches you cannot reach by road, and — depending on the season and plain luck — turtles, rays and dolphins. Nobody can promise wildlife on a given evening, and anyone who does is selling you something.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Who it suits', 'palmtreesurf' ) ),
			array( 'p', __( 'This is the low-effort option: good for families, for mixed groups where not everyone wants to surf, and for a first evening when you have just arrived and want to get your bearings. Snorkelling is optional — plenty of people stay on the boat.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Practical notes', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Bring a layer — it cools off on the water once the sun is down', 'palmtreesurf' ),
				__( 'Reef-safe sunscreen only, applied before you board', 'palmtreesurf' ),
				__( 'Sunset times shift through the year, so departure moves with them', 'palmtreesurf' ),
			) ),
		)
	);

	$bodies['estuary-wildlife-trip'] = pt_blocks(
		array(
			array( 'p', __( 'The estuary behind Tamarindo is a mangrove system and a protected habitat, and it is a completely different environment from the open beach a few hundred metres away. Going in early, quietly, and under paddle power is how you actually see anything.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Why first light', 'palmtreesurf' ) ),
			array( 'p', __( 'Wildlife is active at dawn and settles as the day heats up. The water is also flattest early, which makes paddling easy for people who have never done it. By mid-morning the same channel can look empty.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What lives there', 'palmtreesurf' ) ),
			array( 'p', __( 'Mangrove systems like this one support wading birds, kingfishers, crabs, and howler monkeys in the canopy along the banks. Crocodiles live in these waters too, which is exactly why you go with a guide who knows the channel and keeps the group in the right places.', 'palmtreesurf' ) ),
			array( 'p', __( 'Your guide will point out things you would paddle straight past. Bring binoculars if you have them, and a dry bag for anything that must not get wet.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Effort level', 'palmtreesurf' ) ),
			array( 'p', __( 'Low. The water is sheltered and flat, and you set the pace. If you can sit upright and move your arms, you can do this trip. Children do it regularly.', 'palmtreesurf' ) ),
		)
	);

	return $bodies;
}

/**
 * Body copy for the seeded About page.
 *
 * @return string
 */
function pt_seed_about_body() {
	return pt_blocks(
		array(
			array( 'p', __( 'Palm Tree Surf runs surf lessons, fishing charters, boat tours and wildlife trips out of Tamarindo on the Guanacaste coast of Costa Rica.', 'palmtreesurf' ) ),
			array( 'h2', __( 'Replace this section with your story', 'palmtreesurf' ) ),
			array( 'p', __( 'This page is a placeholder and should be rewritten by whoever runs the business. The things that convert on an about page are specific: who you are, how long you have been on this beach, why you started, and what a guest can expect from you that they would not get elsewhere.', 'palmtreesurf' ) ),
			array( 'p', __( 'Search engines reward this page too. A real, detailed about page with your actual history is one of the stronger trust signals a small local operator has.', 'palmtreesurf' ) ),
			array( 'h2', __( 'Why Tamarindo', 'palmtreesurf' ) ),
			array( 'p', __( 'Tamarindo works for visitors because so much sits close together: a forgiving beach break for learners, deeper water for fishing within a short run, and a protected mangrove estuary a few minutes away. Warm water year round means no wetsuits and longer time in the water.', 'palmtreesurf' ) ),
		)
	);
}
