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
			array( 'p', __( 'Palm Tree Surf is a surf and tour school in Tamarindo, on the Guanacaste coast of Costa Rica. We run surf lessons, fishing charters, boat tours, estuary and wildlife trips, inland adventure days, and private days built around whoever is coming. Everything starts within a few minutes of this beach, and everything is run by people who are in this water every week.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Why Tamarindo is the right place to do all of this', 'palmtreesurf' ) ),
			array( 'p', __( 'Most beach towns are good at one thing. Tamarindo is unusual because several very different days out sit inside a few kilometres of each other, and that is the whole reason this school exists in the shape it does.', 'palmtreesurf' ) ),
			array( 'p', __( 'The main break is sand-bottom rather than reef. That single fact is why Tamarindo became a teaching beach: the wave rolls instead of dumping, the bottom forgives the falls every learner takes, and there is nothing under you to be afraid of. The water sits warm all year, so nobody owns a wetsuit here and nobody cuts a session short because they got cold.', 'palmtreesurf' ) ),
			array( 'p', __( 'A few hundred metres north, the Tamarindo estuary opens into mangrove channels inside a protected wildlife refuge — flat water, deep shade, and the loudest howler monkeys you will hear on the trip. Offshore, the seabed drops away quickly, so a fishing boat can work the rocky points inshore or run out to blue water without burning half the day getting there. And an hour inland the dry forest starts, with waterfalls and river crossings that most visitors never see because they never leave the sand.', 'palmtreesurf' ) ),
			array( 'p', __( 'One town, four completely different days. That is rare, and it is what lets us build a week that does not repeat itself.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Surf lessons', 'palmtreesurf' ) ),
			array( 'p', __( 'This is what we are best known for. A first lesson starts on the sand — safety, where to lie on the board, how to read what the water in front of you is doing, and the pop-up drilled until it stops being a thought and becomes a movement. Then we go into the whitewater, where your instructor puts you into waves until you are catching them on your own.', 'palmtreesurf' ) ),
			array( 'p', __( 'Most people stand up in their first session. That is not a sales line, it is what a forgiving sand-bottom beach break with a small group and warm water produces. What separates a good first lesson from a bad one is not the wave — it is how many waves you actually get, and whether anyone is close enough to correct you on each of them. That is why we keep groups small.', 'palmtreesurf' ) ),
			array( 'p', __( 'Past the first session, the work changes. It stops being about balance and starts being about reading: where the wave is going to break, which way to angle, when to commit. Intermediate coaching is mostly video-free, in-water, one correction at a time. If you have plateaued somewhere — you can stand but you cannot turn, or you keep getting caught behind the peak — say so when you book and we will put you with someone who will fix exactly that.', 'palmtreesurf' ) ),
			array( 'p', __( 'Boards, leashes and rash guards come with every lesson, sized to you rather than handed out at random. Bring swimwear, reef-safe sunscreen, water and a towel.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Fishing charters', 'palmtreesurf' ) ),
			array( 'p', __( 'Because deep water is close, you get a genuine choice rather than one default trip. Inshore runs work the rocky points and headlands along the coast — shorter, calmer, good for a first time out or for anyone unsure about their sea legs. Offshore pushes into blue water for the pelagic species, and that is a full day if you want to do it properly rather than spend the trip travelling.', 'palmtreesurf' ) ),
			array( 'p', __( 'Rods, terminal tackle and bait are aboard, and every charter goes out with a captain and a mate who fish this coast year-round. You can turn up with sunscreen and a hat and nothing else. Bring your own gear if you would rather.', 'palmtreesurf' ) ),
			array( 'p', __( 'What is running changes through the year. If a particular species is the reason you are coming, ask us before you lock the date in — we would rather tell you honestly that a month is wrong for it than take the booking and watch you have a flat day. Costa Rica requires a sport fishing licence; tell us when you book and we will sort it with you.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Boat tours', 'palmtreesurf' ) ),
			array( 'p', __( 'The coastline here is mostly headland and small bay, and a good deal of it has no road to it at all. From the water you get the whole line of it — the cliffs, the empty sand, the point where the estuary opens out — and coves you simply cannot reach on foot.', 'palmtreesurf' ) ),
			array( 'p', __( 'Most tours build in a swim and snorkel stop somewhere calm, with gear aboard, then time the run home so you are offshore as the light goes. That last hour is the reason people book these, and it is the thing everyone photographs. Snorkelling is optional and plenty of people stay on the boat; no skill is needed for any of it.', 'palmtreesurf' ) ),
			array( 'p', __( 'Bring a layer. It cools off quickly once the sun is down and the boat is moving.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Estuary and wildlife trips', 'palmtreesurf' ) ),
			array( 'p', __( 'Two hundred metres behind a busy surf town, the estuary runs back into mangrove channels inside a protected refuge, and it is a completely different place — quiet, shaded, and full of birds.', 'palmtreesurf' ) ),
			array( 'p', __( 'Go at first light. The howler monkeys are calling, the herons and kingfishers are working the channels, the water is glass, and the heat has not arrived. By mid-morning the wind comes up and most of it has gone quiet again, which is why a trip that leaves at a civilised hour is not the same trip at all.', 'palmtreesurf' ) ),
			array( 'p', __( 'Guided rather than rented, and the difference matters: a naturalist can find and name what you are looking at, and knows the refuge rules on distance and noise. Commonly you will see howler monkeys, herons, kingfishers, crabs and iguanas, and sometimes crocodiles at a distance. Nothing is guaranteed — it is wild, which is the point. Kayak or paddleboard, both on flat water; if you can sit in a kayak you can do this.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Inland adventure days', 'palmtreesurf' ) ),
			array( 'p', __( 'Guanacaste is not only coastline. An hour inland the dry forest starts, and with it waterfalls, swimming holes, river crossings and ridge roads. These are the half and full days that fill a flat surf day, or break up a week on the beach with something that involves a bit more dirt.', 'palmtreesurf' ) ),
			array( 'p', __( 'Green-season rain changes what is passable from week to week, so routes get adjusted on the day by someone who knows which crossings are up rather than cancelled by someone reading a schedule. Closed shoes, a change of clothes and a dry bag.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Private and custom days', 'palmtreesurf' ) ),
			array( 'p', __( 'Some people learn faster one-to-one. Some groups want a day built around a birthday, an anniversary, or a family where the ages run from eight to sixty-eight and nobody wants to be split up. That is what this is for.', 'palmtreesurf' ) ),
			array( 'p', __( 'Tell us who is coming, what they can already do, and how long you are here. We will come back with a plan — surf, water, inland, or a mix — and keep the same guide with you through it, which is the part that makes a multi-day booking actually progress instead of turning into five separate first lessons.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What we think makes a day good', 'palmtreesurf' ) ),
			array( 'p', __( 'Every operator in this town will tell you they are the best. Rather than claim it, here is what we actually optimise for, so you can judge whether it matches what you want out of a day.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Small groups. More waves each, and a guide who can see everyone. This is the single biggest difference between a good session and a forgettable one.', 'palmtreesurf' ),
				__( 'Local guides. Sandbars move, tides shift, the estuary changes through the year. Someone who is in this water weekly is worth more than any equipment list.', 'palmtreesurf' ),
				__( 'Conditions decide, not the calendar. If the water is wrong for your group that morning, we move you. Nobody is put in conditions that do not suit their level.', 'palmtreesurf' ),
				__( 'Gear that gets checked between sessions, not once a season, and sized to the person using it.', 'palmtreesurf' ),
				__( 'Straight answers. If a month is wrong for the fish you want, or a trip is not right for your group, we will say so before you book rather than after.', 'palmtreesurf' ),
				__( 'English and Spanish, both, from the office through to the water.', 'palmtreesurf' ),
			) ),

			array( 'h2', __( 'Booking, and what happens next', 'palmtreesurf' ) ),
			array( 'p', __( 'Send the form on any experience, or message us with your dates and who is coming. We come back with a time that suits the tide and the conditions that week, what to bring and where to meet. Payment is arranged once those details are settled — nothing is taken before you know what you are actually getting.', 'palmtreesurf' ) ),
			array( 'p', __( 'If the weather turns, we move you rather than run something that is not worth your time.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Add your own story here', 'palmtreesurf' ) ),
			array( 'p', __( 'Everything above is true of the place and of how this school is meant to run, but it is not yet personal. The part no competitor can copy is yours: who started it, what year you arrived, what you did before, why you stayed, the guests you still hear from. Edit this page under Pages → About and replace this last section with it. It is the strongest trust signal a small local operator has, for visitors and for search engines alike.', 'palmtreesurf' ) ),
		)
	);
}

/**
 * Intro copy for the operator sign-up page.
 *
 * @return string
 */
function pt_seed_operators_body() {
	return pt_blocks(
		array(
			array( 'p', __( 'We work with a small number of local operators on the Guanacaste coast — surf schools, captains, naturalist guides and drivers — and list their tours here for visitors who are already looking for exactly what they run.', 'palmtreesurf' ) ),
			array( 'p', __( 'If you run tours in or around Tamarindo and you do it properly, we would like to hear from you. Applying takes about five minutes, costs nothing and commits you to nothing.', 'palmtreesurf' ) ),
		)
	);
}

/**
 * Body copy for the contact page.
 *
 * @return string
 */
function pt_seed_contact_body() {
	return pt_blocks(
		array(
			array( 'p', __( 'Questions before you book? Send the form and a real person will answer it. We reply to everything, usually the same day.', 'palmtreesurf' ) ),
			array( 'p', __( 'The more you tell us, the more useful the reply. Dates, how many people, what everyone has done before, and anything we should know about swimming confidence or mobility all help us put you on the right trip at the right tide rather than just the next available slot.', 'palmtreesurf' ) ),
			array( 'h2', __( 'What to tell us', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'The dates you are in Tamarindo, even if they are not fixed yet.', 'palmtreesurf' ),
				__( 'How many people are coming, and their rough ages.', 'palmtreesurf' ),
				__( 'What you are hoping to do — or that you are not sure, which is a perfectly good answer.', 'palmtreesurf' ),
				__( 'Anything relevant about swimming confidence, seasickness, injuries or mobility.', 'palmtreesurf' ),
			) ),
			array( 'h2', __( 'Where we are', 'palmtreesurf' ) ),
			array( 'p', __( 'Tamarindo, in the province of Guanacaste on the Pacific coast of Costa Rica. The nearest international airport is Liberia, generally an hour and a half to two hours away by road. San José is around four to five hours by car, or a short domestic flight.', 'palmtreesurf' ) ),
			array( 'p', __( 'The town itself is walkable — you do not need a car to reach the beach, dinner or a lesson. A car is useful only for inland trips and neighbouring beaches.', 'palmtreesurf' ) ),
		)
	);
}
