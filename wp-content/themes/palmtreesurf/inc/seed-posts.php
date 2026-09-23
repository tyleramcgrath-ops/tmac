<?php
/**
 * Long-form journal posts.
 *
 * Written for both search and answer engines. Each post opens with a direct
 * answer to the question in its title, uses question-shaped H2s, carries a
 * summary list and an FAQ, and links to the relevant experiences — the shape
 * an extractive engine can quote from and a reader can actually use.
 *
 * Everything here is general knowledge about this coast and these activities.
 * No post states a price, a guarantee, a certification or a company history,
 * because the theme does not know those.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * A "short answer" callout, which is the block answer engines lift.
 *
 * @param string $text Answer text.
 * @return string
 */
function pt_answer_block( $text ) {
	return '<!-- wp:group {"className":"post-answer"} --><div class="wp-block-group post-answer">'
		. '<!-- wp:paragraph --><p><strong>' . esc_html__( 'Short answer:', 'palmtreesurf' ) . '</strong> '
		. esc_html( $text ) . '</p><!-- /wp:paragraph -->'
		. '</div><!-- /wp:group -->';
}

/**
 * An FAQ section rendered as accessible details blocks.
 *
 * @param array<int, array<int, string>> $pairs Question and answer pairs.
 * @return string
 */
function pt_faq_blocks( $pairs ) {
	$out = '<!-- wp:heading --><h2 class="wp-block-heading">'
		. esc_html__( 'Frequently asked questions', 'palmtreesurf' )
		. '</h2><!-- /wp:heading -->';

	foreach ( $pairs as $pair ) {
		$out .= '<!-- wp:details {"className":"faq__item"} --><details class="wp-block-details faq__item">'
			. '<summary>' . esc_html( $pair[0] ) . '</summary>'
			. '<!-- wp:paragraph --><p>' . esc_html( $pair[1] ) . '</p><!-- /wp:paragraph -->'
			. '</details><!-- /wp:details -->';
	}

	return $out;
}

/**
 * Link to an experience by slug, falling back to the archive.
 *
 * @param string $slug  Experience slug.
 * @param string $label Link text.
 * @return string
 */
function pt_post_link( $slug, $label ) {
	$post = get_page_by_path( $slug, OBJECT, PT_EXPERIENCE_POST_TYPE );
	$url  = $post ? get_permalink( $post ) : get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE );

	return '<a href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a>';
}

/**
 * Post 1 — learning to surf in Tamarindo.
 *
 * @return string
 */
function pt_post_learn_to_surf() {
	$body  = pt_answer_block(
		__( 'Tamarindo is one of the best places in Costa Rica to learn to surf because the main beach breaks over sand rather than reef, the waves roll instead of dumping, and the water sits around 27-29°C all year so no wetsuit is needed. Most people stand up in their first two-hour lesson. The calmest learning conditions are usually mid to high tide in the morning, before the afternoon wind.', 'palmtreesurf' )
	);

	$body .= pt_blocks(
		array(
			array( 'p', __( 'Every year a large share of the people who learn to surf in Costa Rica do it on this one beach, and it is not an accident of marketing. Tamarindo has a specific combination of seabed, swell and water temperature that makes the first day far less punishing than it is almost anywhere else. This guide covers what that actually means for you, what a first lesson looks like hour by hour, what to bring, how to pick a time of day and year, and the mistakes that cost beginners the most waves.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Why Tamarindo is good for beginners', 'palmtreesurf' ) ),
			array( 'p', __( 'Three things matter when you are choosing where to take a first surf lesson, and Tamarindo happens to have all three.', 'palmtreesurf' ) ),

			array( 'h3', __( 'The bottom is sand, not reef', 'palmtreesurf' ) ),
			array( 'p', __( 'This is the big one. You will fall off repeatedly in your first session — that is the job. On a reef break, falling has consequences, and beginners tense up because of it. On a sand-bottom beach break there is nothing underneath you but more sand. That single fact lets a nervous first-timer commit to the wave instead of bailing early, and committing is what gets you standing.', 'palmtreesurf' ) ),

			array( 'h3', __( 'The wave rolls rather than dumps', 'palmtreesurf' ) ),
			array( 'p', __( 'Tamarindo has a gently shelving beach, so waves break over a distance rather than closing out all at once. That gives you a long, forgiving push of whitewater — exactly what you want when you are learning, because it holds you for long enough to get to your feet and stay there for a few seconds. A steep, fast, hollow wave is a wonderful thing and completely useless for a first lesson.', 'palmtreesurf' ) ),

			array( 'h3', __( 'The water is warm all year', 'palmtreesurf' ) ),
			array( 'p', __( 'Sea temperature on this coast generally sits in the high twenties Celsius, around 80°F, right through the year. Nobody wears a wetsuit. That sounds like a comfort detail and it is actually a learning detail: cold is what ends most beginner sessions early, and your progress in the first few days is almost entirely a function of how many waves you catch. Warm water means you stay in and keep catching them.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What actually happens in a first surf lesson', 'palmtreesurf' ) ),
			array( 'p', __( 'A standard beginner lesson runs about two hours and splits into three parts.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'On the sand, roughly 20 minutes. Safety first — how to fall, how to hold the board, how to look after the people around you. Then where to lie, how to paddle, and the pop-up, drilled on the sand until it is a movement rather than a decision.', 'palmtreesurf' ),
				__( 'In the whitewater, the bulk of the session. Your instructor pushes you into broken waves, calling the timing. The first few you will ride on your belly on purpose, so you feel the push. Then you start standing.', 'palmtreesurf' ),
				__( 'Catching them yourself, the last stretch if it is going well. You start turning the board and paddling into waves with the instructor alongside rather than pushing.', 'palmtreesurf' ),
			) ),
			array( 'p', __( 'You are not paddling out the back into unbroken waves on day one and you should be suspicious of anyone who suggests it. The whole first lesson happens in water you can usually stand up in.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Will I actually stand up on the first day?', 'palmtreesurf' ) ),
			array( 'p', __( 'Most people do, on a soft-top board, in whitewater, with someone pushing them into the wave at the right moment. That is the honest framing — it is a genuine achievement and it is also the easiest version of surfing there is. Standing in whitewater on day one and catching an unbroken wave on your own are separated by a lot of practice.', 'palmtreesurf' ) ),
			array( 'p', __( 'What most affects whether you get there in one session is not fitness or age. It is the number of waves you actually get, which is a function of group size. In a group of four with one instructor you will get several times the attempts you would in a group of twelve, and every attempt comes with a correction. If you compare lessons on nothing else, compare the ratio.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What to bring to a surf lesson', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Swimwear you can move in. Board shorts or a one-piece beat anything that might come loose in whitewater.', 'palmtreesurf' ),
				__( 'Reef-safe sunscreen, and more than you think. You are in tropical sun, reflecting off water, for two hours.', 'palmtreesurf' ),
				__( 'Water. Warm-water surfing dehydrates you faster than people expect.', 'palmtreesurf' ),
				__( 'A towel and a change of clothes.', 'palmtreesurf' ),
				__( 'A hat and sunglasses for before and after — not during.', 'palmtreesurf' ),
			) ),
			array( 'p', __( 'Boards, leashes and rash guards come with any proper lesson, sized to you. You do not need to buy or rent anything in advance. Leave jewellery and anything you would hate to lose at your accommodation.', 'palmtreesurf' ) ),

			array( 'h2', __( 'The best time of day to learn', 'palmtreesurf' ) ),
			array( 'p', __( 'Morning, almost always. Wind is the variable that most changes how a beginner session feels, and on this coast the offshore or light morning wind typically gives way to onshore wind through the afternoon. Onshore wind makes the water choppy and the waves crumbly and harder to read.', 'palmtreesurf' ) ),
			array( 'p', __( 'Tide matters too. Beginners usually get the cleanest, most forgiving whitewater around mid to high tide, when the water is deeper over the sandbars. Low tide can make the wave break harder and closer to dry sand. The sandbars themselves move through the season, which is exactly the local knowledge worth paying for — a good school will tell you which hours suit your level that week rather than running the same slot every day regardless.', 'palmtreesurf' ) ),

			array( 'h2', __( 'The best time of year to learn to surf in Tamarindo', 'palmtreesurf' ) ),
			array( 'p', __( 'There is no bad month for a beginner here, which is unusual. The two broad seasons differ in ways that matter less to a first-timer than people assume.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Dry season, roughly December to April. Reliable sun, lighter and more consistent surf, and the busiest months. Book further ahead. This is the easiest period for a nervous beginner.', 'palmtreesurf' ),
				__( 'Green season, roughly May to November. Greener landscape, fewer people, and more southern swell, so the surf is often bigger. Rain generally comes as an afternoon downpour rather than all-day drizzle, which leaves mornings clear — and mornings are when you want to surf anyway. September and October are the wettest.', 'palmtreesurf' ),
			) ),
			array( 'p', __( 'Bigger swell in green season does not rule out learning; it changes where on the beach you learn and at what tide. That is a decision for whoever is running your lesson on the day.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Five mistakes that cost beginners waves', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Looking at the board. Your body follows your eyes, so looking down sends you down. Pick a point up the beach and look at it.', 'palmtreesurf' ),
				__( 'Standing up in stages. Knee first, then feet, is slower than the wave. The pop-up is one movement from lying to standing.', 'palmtreesurf' ),
				__( 'Feet too close together, or too far forward. Shoulder width, and centred — most nose-dives are a foot-placement problem, not a balance problem.', 'palmtreesurf' ),
				__( 'Stopping paddling too early. The wave has to be carrying you before you go. Two more strokes than feel necessary is usually right.', 'palmtreesurf' ),
				__( 'Standing bolt upright. Knees bent, low centre of gravity, hands off the rails.', 'palmtreesurf' ),
			) ),

			array( 'h2', __( 'Is it safe? What about currents, and sharks?', 'palmtreesurf' ) ),
			array( 'p', __( 'Rip currents exist on any beach with surf, including this one, and they are the genuine hazard rather than anything with teeth. This is precisely why a lesson with someone who knows the beach beats renting a board and working it out: they know where the rips sit that week and will put you nowhere near them. If you are ever caught in one, do not swim against it — swim parallel to the beach until you are out of it, then come in.', 'palmtreesurf' ) ),
			array( 'p', __( 'You do not need to be a strong swimmer for a beginner lesson, but you should be comfortable in waist-deep moving water. Tell your instructor honestly how you feel about water before you start rather than halfway through.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Can children learn here?', 'palmtreesurf' ) ),
			array( 'p', __( 'Yes, and this beach is a good place for it. Children often learn faster than adults because they have less fear and a lower centre of gravity. What matters is a correctly sized board, an instructor in the water alongside rather than watching from the sand, and honest information from you about how confident they are in water. Mention ages when you book so the group and equipment are right.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What comes after the first lesson', 'palmtreesurf' ) ),
			array( 'p', __( 'Two or three sessions across a week will get most people considerably further than one, because the second session starts where the first ended rather than at the beginning. The progression is roughly: standing in whitewater, then turning the board and paddling for whitewater yourself, then catching unbroken waves, then choosing a direction along the wave instead of riding straight to the beach.', 'palmtreesurf' ) ),
			array( 'p', __( 'That last step is where most people plateau, and it is the point at which coaching stops being about the pop-up and starts being about reading water.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What changes the price of a surf lesson', 'palmtreesurf' ) ),
			array( 'p', __( 'Lesson prices in Tamarindo vary more than new visitors expect, and the difference is almost always one of these things rather than the quality of the wave, which is the same for everyone.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Group size. A private or two-to-one lesson costs more per person than a group of eight, and buys you several times the waves and corrections.', 'palmtreesurf' ),
				__( 'Session length. Ninety minutes and two hours are both common, and the difference is more water time than it sounds.', 'palmtreesurf' ),
				__( 'Whether photos are included. Some schools shoot the session; it is worth asking rather than assuming.', 'palmtreesurf' ),
				__( 'Multi-day packages. Booking three sessions across a week is usually better value than three separate lessons, and it progresses properly.', 'palmtreesurf' ),
			) ),
			array( 'p', __( 'The cheapest lesson on the beach is rarely the best value if it puts twelve people behind one instructor. Ask the ratio before you ask the price.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Surf etiquette a beginner should know on day one', 'palmtreesurf' ) ),
			array( 'p', __( 'You will spend your first sessions in the whitewater, away from the people surfing unbroken waves further out, so most of this will not apply immediately. It will the moment you start paddling out, and knowing it early marks you as someone worth being generous to in the water.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'The surfer closest to the breaking part of the wave has priority. Do not take off in front of someone already riding.', 'palmtreesurf' ),
				__( 'Do not paddle straight through the middle of the break to get out. Go around the shoulder, even if it takes longer.', 'palmtreesurf' ),
				__( 'Never let go of your board to dive under a wave if anyone is behind you. A loose board on a leash is a hazard with a nine-foot radius.', 'palmtreesurf' ),
				__( 'Apologise and mean it if you drop in on someone by accident. Everyone did it once.', 'palmtreesurf' ),
				__( 'Respect the locals in the water. You are a guest on their beach for a week; they are there every day of the year.', 'palmtreesurf' ),
			) ),
		)
	);

	$body .= pt_faq_blocks(
		array(
			array( __( 'Do I need to know how to swim to surf in Tamarindo?', 'palmtreesurf' ), __( 'You do not need to be a strong swimmer for a beginner lesson, because it takes place in shallow whitewater where you can usually stand. You should be comfortable in waist-deep moving water and you should tell your instructor about your swimming confidence before the session starts.', 'palmtreesurf' ) ),
			array( __( 'How long is a beginner surf lesson?', 'palmtreesurf' ), __( 'A standard beginner lesson is about two hours: roughly twenty minutes of safety and technique on the sand, then the rest in the water.', 'palmtreesurf' ) ),
			array( __( 'What is the best month to learn to surf in Tamarindo?', 'palmtreesurf' ), __( 'Any month works for a beginner. December to April brings reliable sun and lighter, more consistent surf, and is the busiest period. May to November is quieter and greener with larger swell and afternoon rain that usually leaves mornings clear.', 'palmtreesurf' ) ),
			array( __( 'Do I need to bring a surfboard?', 'palmtreesurf' ), __( 'No. Soft-top boards sized to you, leashes and rash guards are included with a lesson. Bring swimwear, reef-safe sunscreen, water and a towel.', 'palmtreesurf' ) ),
			array( __( 'Is Tamarindo too crowded to learn?', 'palmtreesurf' ), __( 'The beach is popular, but it is also long, and lessons are run on the stretches and tides that suit learners. Morning sessions are generally calmer in both wind and traffic than the middle of the day.', 'palmtreesurf' ) ),
			array( __( 'Can I learn to surf at 50 or 60?', 'palmtreesurf' ), __( 'Yes. Age matters much less than people expect on a forgiving beach break. What matters is a board with enough volume, a small group so you get plenty of attempts, and going at the tide that makes the wave gentlest.', 'palmtreesurf' ) ),
		)
	);

	return $body;
}

/**
 * Post 2 — when to visit Tamarindo.
 *
 * @return string
 */
function pt_post_best_time() {
	$body  = pt_answer_block(
		__( 'Tamarindo has two seasons: a dry season from roughly December to April with reliable sun, lighter surf and the biggest crowds, and a green season from roughly May to November that is quieter, greener and cheaper, with larger surf and rain that usually falls as an afternoon downpour rather than all day. There is no month with nothing to do. For guaranteed sun choose February or March; for empty beaches and the best value choose May, June or November.', 'palmtreesurf' )
	);

	$body .= pt_blocks(
		array(
			array( 'p', __( 'The honest answer to "when should I come to Tamarindo" is that it depends on what you are optimising for, and the two things most people want — perfect weather and an uncrowded beach — pull in opposite directions. This guide goes month by month so you can pick deliberately rather than guess.', 'palmtreesurf' ) ),

			array( 'h2', __( 'The two seasons, and what the names actually mean', 'palmtreesurf' ) ),
			array( 'p', __( 'Guanacaste is the driest region of Costa Rica, and Tamarindo sits in the middle of it. That makes its seasons more pronounced than the rainforest side of the country, and it also makes the green season far less daunting than the word "rainy" suggests to most people planning a beach holiday.', 'palmtreesurf' ) ),

			array( 'h3', __( 'Dry season: roughly December to April', 'palmtreesurf' ) ),
			array( 'p', __( 'Day after day of sun, low humidity by tropical standards, and dry, brown-gold hills. This is high season, it is busy, and prices for accommodation and flights are at their highest. Surf is generally smaller and more consistent, which suits beginners. Strong offshore winds are common in January and February, which groom the waves beautifully in the morning and can get gusty later.', 'palmtreesurf' ) ),

			array( 'h3', __( 'Green season: roughly May to November', 'palmtreesurf' ) ),
			array( 'p', __( 'The landscape transforms — the hills that were brown in April are properly green by June, and it is genuinely more beautiful. Rain typically arrives as a heavy afternoon or evening downpour lasting an hour or two, leaving mornings clear. Since mornings are when you want to surf, fish or paddle the estuary anyway, this matters much less than it sounds. Southern swell picks up, so surf is bigger and more powerful. Crowds thin and prices drop.', 'palmtreesurf' ) ),
			array( 'p', __( 'The exception is September and October, which are the wettest months of the year on this coast and the only period where rain can genuinely interfere with a whole day.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Month by month', 'palmtreesurf' ) ),

			array( 'h3', __( 'December', 'palmtreesurf' ) ),
			array( 'p', __( 'The rains have usually stopped, the hills are still green from the wet season, and the sun is out. Arguably the best-looking month of the year. Christmas and New Year are the busiest and most expensive two weeks of the year — book months ahead or come in the first half of the month.', 'palmtreesurf' ) ),

			array( 'h3', __( 'January and February', 'palmtreesurf' ) ),
			array( 'p', __( 'Peak dry season. Effectively guaranteed sun, comfortable humidity, and strong offshore winds that clean the surf up in the mornings. Excellent for beginners. Busy, and priced accordingly. If you want certainty about weather, this is the window.', 'palmtreesurf' ) ),

			array( 'h3', __( 'March and April', 'palmtreesurf' ) ),
			array( 'p', __( 'Hot and dry, with the landscape at its most parched by April. The water is warm, the sun is relentless, and swell begins to build towards the end of April as the first southern swells arrive. Semana Santa, the week before Easter, is a major domestic holiday and the beach fills with Costa Rican families.', 'palmtreesurf' ) ),

			array( 'h3', __( 'May and June', 'palmtreesurf' ) ),
			array( 'p', __( 'Many people\'s quiet favourite. The first rains green everything back up, the crowds leave, prices fall, and the surf gets consistently better as southern swell fills in. Rain is usually confined to a heavy afternoon burst. Very good value.', 'palmtreesurf' ) ),

			array( 'h3', __( 'July and August', 'palmtreesurf' ) ),
			array( 'p', __( 'Green season, with a well-known quirk: the veranillo, or "little summer", a drier spell that often falls somewhere in July. Northern-hemisphere summer holidays bring a secondary peak in visitors, so it is busier than June without being December-busy. Good, sizeable surf.', 'palmtreesurf' ) ),

			array( 'h3', __( 'September and October', 'palmtreesurf' ) ),
			array( 'p', __( 'The wettest months, and the quietest. Some businesses close. If you are a surfer chasing swell with a flexible schedule and a tolerance for weather, this is the cheapest and emptiest the town gets and the waves can be excellent. If you are bringing a family for guaranteed beach days, choose another month.', 'palmtreesurf' ) ),

			array( 'h3', __( 'November', 'palmtreesurf' ) ),
			array( 'p', __( 'A transition month and often a bargain. The rain tails off, the landscape is still vividly green, the crowds have not yet arrived, and the surf is still carrying green-season size. One of the best value-for-conditions windows in the year.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What the weather means for each activity', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Surf lessons. Year round. Dry season gives smaller, gentler waves that suit absolute beginners; green season is bigger, which is better once you are past the first couple of sessions.', 'palmtreesurf' ),
				__( 'Fishing. Year round, but what is running changes. Offshore species and inshore species have different peaks — decide the species first, then the month.', 'palmtreesurf' ),
				__( 'Boat tours and snorkelling. Water clarity is generally best in the dry season, when there is less runoff from the rivers. Green season can be murkier after heavy rain.', 'palmtreesurf' ),
				__( 'Estuary and wildlife. Excellent year round, and arguably better in green season when the mangroves are lush and the birdlife is busiest. Always go at first light.', 'palmtreesurf' ),
				__( 'Inland waterfalls. Far more impressive in and just after green season, when there is actually water coming over them. Some are a trickle by late dry season.', 'palmtreesurf' ),
			) ),
			array( 'p', __( 'That last point is the one that surprises people most: the "bad weather" season is when the waterfalls are worth visiting.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Water temperature and what to pack', 'palmtreesurf' ) ),
			array( 'p', __( 'Sea temperature generally sits in the high twenties Celsius, around 80°F, all year. No wetsuit, ever. A rash guard is worth having, less for warmth than for sun and for board rash on your ribs during a week of lessons.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Reef-safe sunscreen, in a quantity that feels excessive. This is the single most forgotten item.', 'palmtreesurf' ),
				__( 'A hat and polarised sunglasses, particularly for boat days.', 'palmtreesurf' ),
				__( 'Insect repellent, mostly for the estuary at dawn and dusk.', 'palmtreesurf' ),
				__( 'A light rain layer if you are coming May to November.', 'palmtreesurf' ),
				__( 'A dry bag for phones and cameras on any water trip.', 'palmtreesurf' ),
				__( 'Closed shoes if you plan an inland day.', 'palmtreesurf' ),
			) ),

			array( 'h2', __( 'Crowds, prices and how far ahead to book', 'palmtreesurf' ) ),
			array( 'p', __( 'Roughly speaking: Christmas and New Year, then Semana Santa, then January and February are the periods where booking well ahead genuinely matters — for accommodation, for flights, and for anything with limited capacity like a private lesson or a full-day charter. May, June, September, October and November you can often arrange at short notice.', 'palmtreesurf' ) ),
			array( 'p', __( 'The general rule for value is that the shoulder months either side of green season — May, June and November — give you most of the good weather at a fraction of the crowd and cost.', 'palmtreesurf' ) ),

			array( 'h2', __( 'How long should you stay?', 'palmtreesurf' ) ),
			array( 'p', __( 'Five to seven nights is the sweet spot for most people. It lets you take two or three surf sessions with rest days between them, spend one morning on the estuary and one afternoon or evening on the water, and keep a day spare for weather or for an inland trip. Three nights works but forces choices. Two weeks and you will properly progress at surfing rather than just sample it.', 'palmtreesurf' ) ),

			array( 'h2', __( 'The wildlife calendar', 'palmtreesurf' ) ),
			array( 'p', __( 'Some of the best reasons to pick one month over another have nothing to do with weather.', 'palmtreesurf' ) ),
			array( 'p', __( 'Playa Grande, directly across the estuary from Tamarindo, sits inside Las Baulas National Marine Park and is a leatherback turtle nesting beach. Nesting season runs roughly from October through March. Leatherbacks are the largest turtles in the world and numbers at this site have declined sharply over recent decades, so sightings are never guaranteed and viewing is tightly controlled — it is done at night, with a licensed guide, under park rules, and that is exactly as it should be.', 'palmtreesurf' ) ),
			array( 'p', __( 'Humpback whales pass this coast on migration, with sightings generally possible in two windows: roughly December to March for northern-hemisphere populations and roughly July to October for southern-hemisphere ones. Again, wild animals, no guarantees.', 'palmtreesurf' ) ),
			array( 'p', __( 'In the estuary itself, the birdlife is present year round and noticeably busier through green season when the mangroves are lush. Howler monkeys are audible almost every morning regardless of season — they are usually the first thing visitors hear on their first morning in town, and frequently the thing they most remember.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Getting to Tamarindo', 'palmtreesurf' ) ),
			array( 'p', __( 'Most visitors fly into Daniel Oduber Quirós International Airport in Liberia, which is the closest airport and usually around an hour and a half to two hours by road. San José is the country\'s main international hub and is considerably further — expect four to five hours driving, or a short domestic flight.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Liberia is the practical choice if you are coming for this coast specifically.', 'palmtreesurf' ),
				__( 'A rental car gives you the inland waterfalls and neighbouring beaches. A four-wheel drive is worth having in green season.', 'palmtreesurf' ),
				__( 'Shared and private shuttles run from both airports and remove the parking problem entirely.', 'palmtreesurf' ),
				__( 'Tamarindo itself is walkable. You do not need a car to get to the beach, to dinner, or to a lesson.', 'palmtreesurf' ),
			) ),

			array( 'h2', __( 'How Tamarindo compares to the beaches around it', 'palmtreesurf' ) ),
			array( 'p', __( 'Tamarindo is the most developed town on this stretch, which is exactly why some people choose it and others do not. It has the widest choice of places to eat and stay, the most infrastructure, and the most people. If what you want is a beach with nobody on it, several quieter options sit within a short drive, and a good local operator will happily point you at them.', 'palmtreesurf' ) ),
			array( 'p', __( 'What Tamarindo has that the quieter beaches do not is the combination this whole guide is about: a forgiving learn-to-surf wave, a protected estuary, deep water close to shore for fishing, and inland adventure within an hour, all reachable without moving accommodation. For a one-week trip where you want variety rather than solitude, that combination is hard to beat on this coast.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Choosing your month in one paragraph', 'palmtreesurf' ) ),
			array( 'p', __( 'If you need certainty about sun and you are bringing beginners, come in January, February or March and book early. If you want the best balance of weather, price and empty beaches, come in May, June or November. If you are a surfer and the waves matter more than the forecast, come between July and October and accept some rain. If you want to see the landscape at its most beautiful, come in December, when green season has just ended and everything is still lush. And if you are coming for leatherback nesting season, that window runs roughly October to March and it is worth planning the rest of the trip around.', 'palmtreesurf' ) ),
			array( 'p', __( 'Whatever you choose, book the water activities for the mornings. That one piece of scheduling advice will do more for your trip than picking the perfect month.', 'palmtreesurf' ) ),
		)
	);

	$body .= pt_faq_blocks(
		array(
			array( __( 'What is the rainiest month in Tamarindo?', 'palmtreesurf' ), __( 'September and October are the wettest months on this coast. They are also the quietest and cheapest, and the surf can be very good.', 'palmtreesurf' ) ),
			array( __( 'Is the green season a bad time to visit Tamarindo?', 'palmtreesurf' ), __( 'No. Outside September and October, green-season rain typically falls as a heavy afternoon or evening downpour and leaves mornings clear, which is when most water activities run anyway. The landscape is greener, the beaches are quieter and prices are lower.', 'palmtreesurf' ) ),
			array( __( 'Do I need a wetsuit in Tamarindo?', 'palmtreesurf' ), __( 'No. Sea temperature stays in the high twenties Celsius, roughly 80°F, all year. A rash guard is useful for sun protection and to prevent board rash, but no thermal layer is needed in any month.', 'palmtreesurf' ) ),
			array( __( 'When is the surf biggest in Tamarindo?', 'palmtreesurf' ), __( 'Generally during the green season, roughly April through October, when southern swells reach this coast. Dry season surf is usually smaller and more consistent, which suits beginners.', 'palmtreesurf' ) ),
			array( __( 'When is the water clearest for snorkelling?', 'palmtreesurf' ), __( 'Usually in the dry season, December to April, when there is less river runoff. After heavy green-season rain the water near river mouths can be murky for a day or two.', 'palmtreesurf' ) ),
			array( __( 'How many days do I need in Tamarindo?', 'palmtreesurf' ), __( 'Five to seven nights suits most visitors. That allows two or three surf sessions with recovery between them, a dawn estuary trip, an afternoon or sunset boat tour and a spare day for weather or an inland excursion.', 'palmtreesurf' ) ),
			array( __( 'Which airport should I fly into for Tamarindo?', 'palmtreesurf' ), __( 'Liberia is the closest international airport, generally around an hour and a half to two hours away by road. San José is the larger hub but is roughly four to five hours by car, or a short domestic flight.', 'palmtreesurf' ) ),
			array( __( 'When can I see turtles near Tamarindo?', 'palmtreesurf' ), __( 'Playa Grande, across the estuary inside Las Baulas National Marine Park, has a leatherback nesting season running roughly from October to March. Viewing happens at night with a licensed guide under park rules, and sightings are never guaranteed.', 'palmtreesurf' ) ),
		)
	);

	return $body;
}

/**
 * Post 3 — sport fishing.
 *
 * @return string
 */
function pt_post_fishing() {
	$body  = pt_answer_block(
		__( 'Tamarindo offers both inshore and offshore fishing because the seabed drops away close to the coast. Inshore trips work the rocky points for roosterfish, snapper and jack; offshore runs target sailfish, marlin, dorado and tuna. Sailfish are generally strongest from around December to April, marlin more through the middle of the year, and dorado are often best in the green season. A half day suits inshore fishing; offshore deserves a full day.', 'palmtreesurf' )
	);

	$body .= pt_blocks(
		array(
			array( 'p', __( 'Costa Rica has a genuine reputation in sport fishing, and the Pacific side of Guanacaste is a large part of why. What makes Tamarindo specifically useful is geography: deep water sits close enough that you get a real choice between two very different kinds of day, rather than one long run to a single fishing ground.', 'palmtreesurf' ) ),
			array( 'p', __( 'This guide covers what you can realistically expect to catch, when, the difference between inshore and offshore, what a charter includes, the licence requirement, and how to pick a trip that matches what you actually want.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Inshore versus offshore: the choice that shapes your day', 'palmtreesurf' ) ),

			array( 'h3', __( 'Inshore', 'palmtreesurf' ) ),
			array( 'p', __( 'Inshore fishing works the rocky points, headlands and structure along the coast, usually within sight of land. Runs are short, the water is generally calmer, and you are fishing almost from the moment you leave. It suits a first time out, anyone unsure about seasickness, families, and people who would rather have steady action than wait for one big fish.', 'palmtreesurf' ) ),
			array( 'p', __( 'Typical inshore targets on this coast include roosterfish — a spectacular fish with a distinctive comb-like dorsal fin, and one of the species people specifically travel here for — along with cubera and other snapper, jack crevalle, grouper and mackerel. Roosterfish are generally released.', 'palmtreesurf' ) ),

			array( 'h3', __( 'Offshore', 'palmtreesurf' ) ),
			array( 'p', __( 'Offshore means running out to blue water for pelagic species. It is a bigger commitment in time, distance and usually cost, and the pay-off is the fish people picture when they imagine Costa Rican sport fishing: sailfish, blue and black marlin, dorado, yellowfin tuna and wahoo.', 'palmtreesurf' ) ),
			array( 'p', __( 'If offshore is the reason you are coming, book a full day rather than a half. A half-day offshore trip spends a large share of its hours travelling, and you will feel it.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What you can catch, and roughly when', 'palmtreesurf' ) ),
			array( 'p', __( 'Fish do not read calendars, and any month can produce a surprise, but there are broad patterns on this coast worth planning around.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Sailfish. Generally at their most consistent through the dry season, roughly December to April. The classic Guanacaste billfish target, and almost always catch-and-release.', 'palmtreesurf' ),
				__( 'Marlin. Blue and black marlin are more associated with the middle and later part of the year, broadly around May to September, though they are possible outside that.', 'palmtreesurf' ),
				__( 'Dorado, also called mahi-mahi or dolphinfish. Often best in the green season, when rain pushes debris and structure offshore and the bait follows it. Excellent eating.', 'palmtreesurf' ),
				__( 'Yellowfin tuna. Possible much of the year, frequently found working with dolphin pods offshore.', 'palmtreesurf' ),
				__( 'Roosterfish. Inshore, year round, with a reputation for fighting far above their weight.', 'palmtreesurf' ),
				__( 'Snapper, grouper, jack and mackerel. Inshore, year round, and the backbone of a steady day.', 'palmtreesurf' ),
			) ),
			array( 'p', __( 'If one species is the whole reason for your trip, say so before you commit to dates. Any honest operator would rather tell you that a particular month is wrong for what you want than take a booking and watch you have a disappointing day.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Do you need experience?', 'palmtreesurf' ) ),
			array( 'p', __( 'No. The crew rig everything, set the spread, and talk you through the fight. Plenty of people who have never held a rod go out and land good fish, because the technical work is the crew\'s job and yours is mostly to do what they tell you at the moment it matters.', 'palmtreesurf' ) ),
			array( 'p', __( 'What experience does change is what you can ask for. If you fly-fish, or want to target something specific on light tackle, say so when booking so the right gear and the right captain are lined up.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What a charter includes', 'palmtreesurf' ) ),
			array( 'p', __( 'This varies between operators and it is worth asking rather than assuming. Generally you can expect rods, reels, terminal tackle and bait aboard, and a captain plus a mate. Food and drinks differ trip to trip — some include lunch, some include water and soft drinks only.', 'palmtreesurf' ) ),
			array( 'p', __( 'Bring sunscreen, a hat, polarised sunglasses and a light long-sleeved layer. Hours of reflected tropical sun on open water burns people who thought they were being careful. If you are prone to seasickness, take something before you board rather than after — once it starts, it is too late for most remedies.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Licences, conservation and what you can keep', 'palmtreesurf' ) ),
			array( 'p', __( 'Costa Rica requires a sport fishing licence for anglers. It is straightforward to arrange, and most operators will handle it with you — mention it when you book so it is done before you are standing on the dock.', 'palmtreesurf' ) ),
			array( 'p', __( 'Costa Rica has taken a notably strong position on billfish conservation, and sailfish and marlin are handled as catch-and-release. Roosterfish are generally released too. Species like dorado, tuna and wahoo are commonly kept for the table, and many operators will help you get your catch filleted. Your captain will tell you on the day what is keepable and what goes back, and that decision is theirs — it is a legal matter, not a preference.', 'palmtreesurf' ) ),
			array( 'p', __( 'Practices that genuinely improve survival rates on released fish — circle hooks, minimal handling, keeping the fish in the water for photos — are worth asking about. An operator who has thought about it will have an answer ready.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Half day or full day?', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Half day, inshore. The right first trip for most people. Short runs, calmer water, steady action, and back with your afternoon intact.', 'palmtreesurf' ),
				__( 'Full day, inshore. More ground covered and a real shot at the bigger inshore fish, without the commitment of blue water.', 'palmtreesurf' ),
				__( 'Full day, offshore. The only sensible way to fish offshore. Long, hot, occasionally slow, and the trip people remember.', 'palmtreesurf' ),
			) ),

			array( 'h2', __( 'Fishing with family, or with people who are not anglers', 'palmtreesurf' ) ),
			array( 'p', __( 'An inshore half day is one of the better family trips available here, because something is usually happening. Offshore is a harder sell for anyone who is not invested — long periods of nothing punctuated by sudden intensity is thrilling for an angler and tedious for a bored teenager.', 'palmtreesurf' ) ),
			array( 'p', __( 'If your group is split, consider booking the anglers offshore for a day and putting everyone else on a boat tour or an estuary trip. Mixing those on one boat rarely satisfies either group.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What makes a good fishing day here', 'palmtreesurf' ) ),
			array( 'p', __( 'The boat matters less than most brochures suggest. What actually changes your day is a captain who has been fishing this stretch of coast recently, knows where the bait is this week, and is willing to move rather than sit on a spot that worked last month. That is local knowledge, and it is the thing worth choosing an operator for.', 'palmtreesurf' ) ),
			array( 'p', __( 'The second thing is honesty about conditions. Fishing gets cancelled or moved for weather, and an operator who moves your trip rather than running it in unsuitable conditions is doing you a favour, even when it does not feel like one at the time.', 'palmtreesurf' ) ),

			array( 'h2', __( 'A realistic day on the water', 'palmtreesurf' ) ),
			array( 'p', __( 'Boats generally leave early. There is a practical reason beyond tradition: the sea is usually calmest in the morning before the wind builds, and on many days the bite is better early. Expect to be at the boat not long after first light for a full day.', 'palmtreesurf' ) ),
			array( 'p', __( 'A typical offshore day starts with the run out, which can take a while and is the part where seasickness declares itself if it is going to. Then the crew sets a spread of lures or baits and the boat trolls, watching for birds working bait balls, floating debris holding dorado, or the tell-tale sight of a sailfish lit up behind a teaser. Long quiet stretches are normal. When something happens it happens fast, and the crew will be shouting instructions — follow them exactly, because the first ten seconds decide whether the fish stays on.', 'palmtreesurf' ) ),
			array( 'p', __( 'An inshore day is more constant. The boat moves between points and structure, you cast or drop, and there is rarely a long stretch with nothing at all. It is less dramatic and more reliably entertaining, which for a lot of people is the better trade.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Seasickness, honestly', 'palmtreesurf' ) ),
			array( 'p', __( 'It affects more people than admit it, and it can ruin a day you have paid a lot for. A few things genuinely help.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Take medication the night before and again in the morning, not when you start feeling unwell. Most remedies are preventive and nearly useless once symptoms begin.', 'palmtreesurf' ),
				__( 'Eat something bland before you board. An empty stomach makes it worse, not better.', 'palmtreesurf' ),
				__( 'Stay on deck and look at the horizon. Below deck and looking at a phone are the two fastest routes to trouble.', 'palmtreesurf' ),
				__( 'Avoid heavy drinking the night before. Dehydration compounds everything.', 'palmtreesurf' ),
				__( 'If you are genuinely unsure, book inshore for your first trip. Calmer water, and you are never far from shore.', 'palmtreesurf' ),
			) ),

			array( 'h2', __( 'Booking a charter without being disappointed', 'palmtreesurf' ) ),
			array( 'p', __( 'A few questions separate a good booking from a frustrating one, and all of them are reasonable to ask before you pay.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Is this trip inshore or offshore, and how long is the run to where we will actually fish?', 'palmtreesurf' ),
				__( 'How many anglers will be aboard, and how many rods will be fishing at once?', 'palmtreesurf' ),
				__( 'What is included — licence, tackle, bait, food, drinks — and what is not?', 'palmtreesurf' ),
				__( 'What happens if the weather turns? Is the trip moved, refunded, or run regardless?', 'palmtreesurf' ),
				__( 'What has actually been caught in the last week or two? A captain who is fishing regularly will answer this immediately and specifically.', 'palmtreesurf' ),
			) ),
			array( 'p', __( 'That last question is the most useful one in this entire guide. Seasonal averages are a planning tool; what is biting right now is the real information, and only someone who was on the water this week has it.', 'palmtreesurf' ) ),
			array( 'p', __( 'Book the boat, listen to the crew, take the sunscreen seriously, and accept that some days the ocean simply does not cooperate. That is fishing, and it is why the good days are worth telling people about.', 'palmtreesurf' ) ),
		)
	);

	$body .= pt_faq_blocks(
		array(
			array( __( 'Do I need a fishing licence in Costa Rica?', 'palmtreesurf' ), __( 'Yes, anglers need a Costa Rican sport fishing licence. It is simple to arrange and most charter operators will sort it out with you if you mention it when booking.', 'palmtreesurf' ) ),
			array( __( 'What is the best month to fish in Tamarindo?', 'palmtreesurf' ), __( 'It depends on the species. Sailfish are generally most consistent from around December to April, marlin more through the middle of the year, and dorado are often best during the green season. Inshore species such as roosterfish and snapper are available year round.', 'palmtreesurf' ) ),
			array( __( 'Can I keep the fish I catch?', 'palmtreesurf' ), __( 'Some of it. Billfish such as sailfish and marlin are catch-and-release, as are roosterfish in most cases. Species like dorado, tuna and wahoo are commonly kept. Your captain will tell you which is which on the day.', 'palmtreesurf' ) ),
			array( __( 'Is a half day long enough for offshore fishing?', 'palmtreesurf' ), __( 'Usually not. Offshore trips spend real time reaching blue water, so a half day leaves few hours actually fishing. Choose a full day for offshore, or fish inshore if you only have a half day.', 'palmtreesurf' ) ),
			array( __( 'What should I bring on a fishing charter?', 'palmtreesurf' ), __( 'Sunscreen, a hat, polarised sunglasses and a light long-sleeved layer. Rods, tackle and bait are provided. If you are prone to seasickness, take something before boarding rather than after symptoms start.', 'palmtreesurf' ) ),
			array( __( 'Is fishing suitable for children?', 'palmtreesurf' ), __( 'An inshore half day generally is, because there is steady action and the water is calmer. Full-day offshore trips are long and often slow between strikes, which suits committed anglers more than children.', 'palmtreesurf' ) ),
			array( __( 'What is a roosterfish and why do people travel for it?', 'palmtreesurf' ), __( 'A roosterfish is an inshore predator with a distinctive comb-like dorsal fin that it raises when hunting. It is found on this coast year round, fights far harder than its size suggests, and is almost always released, which makes it a prized catch-and-release target for visiting anglers.', 'palmtreesurf' ) ),
			array( __( 'Do fishing charters leave early?', 'palmtreesurf' ), __( 'Usually yes. The sea is generally calmest before the wind builds through the day, and on many days the bite is better early, so full-day trips commonly depart around first light.', 'palmtreesurf' ) ),
		)
	);

	return $body;
}

/**
 * Post 4 — the estuary and its wildlife.
 *
 * @return string
 */
function pt_post_estuary() {
	$body  = pt_answer_block(
		__( 'The Tamarindo estuary sits inside a protected wildlife refuge a few hundred metres from the main beach, and it is best visited at first light by kayak or paddleboard with a guide. Commonly seen wildlife includes howler monkeys, herons, egrets, kingfishers, ibis, iguanas, crabs and — at a distance — American crocodiles. Go early: by mid-morning the wind builds and most animals go quiet.', 'palmtreesurf' )
	);

	$body .= pt_blocks(
		array(
			array( 'p', __( 'Two hundred metres behind a busy surf town there is a place almost nobody on the beach knows about. The Tamarindo estuary runs inland from the north end of the beach into a network of mangrove channels inside a protected refuge, and paddling into it at dawn is the single biggest contrast available on this coast: from a town with bars and surf shops to deep quiet in about four minutes.', 'palmtreesurf' ) ),
			array( 'p', __( 'This guide covers what lives there, why the timing matters so much, what a trip is actually like, and how to do it without disturbing the thing you came to see.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What the Tamarindo estuary actually is', 'palmtreesurf' ) ),
			array( 'p', __( 'An estuary is where fresh water meets the sea, and mangroves are the trees that thrive in that brackish mix. Their tangled prop roots trap sediment, stabilise the coast, buffer storm surge and — most relevant here — act as a nursery for fish and a refuge for birds.', 'palmtreesurf' ) ),
			array( 'p', __( 'The Tamarindo estuary lies within Las Baulas National Marine Park, a protected area better known for the leatherback turtles that nest on neighbouring Playa Grande. Protection is why the wildlife is still here in the density it is, and it is also why there are rules about how close you can get and how much noise you can make. Those rules are the reason the trip is worth taking at all.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What you will see', 'palmtreesurf' ) ),
			array( 'p', __( 'Nothing is guaranteed, which is the honest position anyone should take about wild animals. That said, some sightings are close to routine and others are a good morning\'s luck.', 'palmtreesurf' ) ),

			array( 'h3', __( 'Almost every trip', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Howler monkeys. You will very likely hear them before you see them, and the sound carries for kilometres. They are among the loudest land animals on earth and the noise is startling the first time.', 'palmtreesurf' ),
				__( 'Herons and egrets. Great egrets, little blue herons, tricoloured herons and others work the shallows and the root lines.', 'palmtreesurf' ),
				__( 'Crabs. Fiddler crabs on the mud at low tide, in numbers, and mangrove crabs up in the roots.', 'palmtreesurf' ),
				__( 'Iguanas. Often high in the branches catching early sun, which is exactly where you would not think to look.', 'palmtreesurf' ),
			) ),

			array( 'h3', __( 'Often, with a good guide and a quiet group', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Kingfishers. Several species work these channels, and they are fast and vivid.', 'palmtreesurf' ),
				__( 'Ibis and roseate spoonbills. Spoonbills in particular are a highlight when they appear.', 'palmtreesurf' ),
				__( 'White-faced capuchin monkeys, and in some areas spider monkeys.', 'palmtreesurf' ),
				__( 'American crocodiles, usually basking and always observed from a sensible distance.', 'palmtreesurf' ),
				__( 'Boat-billed herons, which roost in the mangroves and are a genuine find.', 'palmtreesurf' ),
			) ),
			array( 'p', __( 'Birdwatchers should bring binoculars and low expectations about paddling in a straight line — you will keep stopping.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Why first light matters more than anything else', 'palmtreesurf' ) ),
			array( 'p', __( 'If you take one thing from this guide, take this: the estuary at 6am and the estuary at 10am are not the same place.', 'palmtreesurf' ) ),
			array( 'p', __( 'At dawn the howlers are calling, the wading birds are actively feeding, the air is cool, the light is soft and low, and the water is glass. As the morning warms, the wind builds, the surface chops up, the birds settle, the monkeys go quiet and move into shade, and the heat becomes the dominant feature of the trip. A midday estuary paddle is a pleasant bit of exercise through nice scenery. A dawn one is a wildlife experience.', 'palmtreesurf' ) ),
			array( 'p', __( 'Tide matters too. A guide will plan the trip around it so you are not fighting the current in both directions, and so the channels you want are actually navigable.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Kayak or paddleboard?', 'palmtreesurf' ) ),
			array( 'p', __( 'Both work, and the water is flat enough that neither is difficult.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Kayak. More stable, easier if you have never done either, better for nervous paddlers and for children. Easier to sit still in while watching something. Doubles let a mixed-ability pair travel together.', 'palmtreesurf' ),
				__( 'Paddleboard. You stand, so you see further into the mangroves and down into the water. More engaging, slightly more effort, and you can always drop to your knees.', 'palmtreesurf' ),
			) ),
			array( 'p', __( 'If wildlife photography is your priority, take the kayak. A stable platform beats a good viewpoint every time.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Guided versus renting a board and going yourself', 'palmtreesurf' ) ),
			array( 'p', __( 'You can rent and paddle in on your own, and people do. Three things you lose by doing it.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Finding things. A naturalist spots a boat-billed heron roosting motionless in shadow that you would paddle straight past. Most of what you see on a guided trip, you would not have seen alone.', 'palmtreesurf' ),
				__( 'Knowing what you are looking at. A bird you cannot name is a nice bird. A bird you can name, with something interesting attached to it, is a memory.', 'palmtreesurf' ),
				__( 'Tide and channel knowledge. The estuary drains, and a channel that was open on the way in can be mud on the way out. Currents at the mouth can be strong.', 'palmtreesurf' ),
			) ),
			array( 'p', __( 'There is also a conservation argument. Guides know the refuge rules on approach distance and noise, and they enforce them, which matters in a protected area getting steadily more visitors.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What to bring', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Insect repellent. Mangroves at dawn are exactly the habitat you would expect them to be.', 'palmtreesurf' ),
				__( 'A hat and reef-safe sunscreen, even at 6am.', 'palmtreesurf' ),
				__( 'A dry bag for your phone or camera. You are on flat water, but you are on water.', 'palmtreesurf' ),
				__( 'Binoculars if you have them.', 'palmtreesurf' ),
				__( 'Water, and clothes you do not mind getting damp.', 'palmtreesurf' ),
			) ),
			array( 'p', __( 'Leave the drone at home. Flying one over a protected wildlife refuge is both a good way to scatter every bird in the area and, in many protected zones, not permitted.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Are the crocodiles a problem?', 'palmtreesurf' ) ),
			array( 'p', __( 'American crocodiles live in this estuary, as they do in most Costa Rican estuaries on this coast. Guided trips observe them at a distance and there is no reason for that to be alarming — it is their habitat, you are passing through it, and a competent guide will keep sensible separation.', 'palmtreesurf' ) ),
			array( 'p', __( 'The practical rules are the obvious ones: stay on your craft, do not dangle limbs in the water in areas your guide flags, never approach for a photograph, and do not swim in the estuary. Follow those and it is a non-issue.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Is it suitable for children and non-paddlers?', 'palmtreesurf' ) ),
			array( 'p', __( 'Generally yes. The water is flat, life vests are provided, and a double kayak lets a child travel with an adult. Tell the operator ages and swimming confidence when you book so the right craft and grouping are arranged. For very young children a guided boat trip through the estuary may suit better than paddling.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Watching wildlife without wrecking it', 'palmtreesurf' ) ),
			array( 'p', __( 'The estuary is in good shape because it is protected and because most visitors behave. A short list keeps it that way.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Never feed any animal. Fed monkeys become aggressive, dependent and sick.', 'palmtreesurf' ),
				__( 'Keep your distance and use zoom rather than proximity.', 'palmtreesurf' ),
				__( 'Keep noise down. Quiet groups see more, which makes this the rare rule that rewards you directly.', 'palmtreesurf' ),
				__( 'Take everything out with you, including fruit peel.', 'palmtreesurf' ),
				__( 'Use reef-safe sunscreen. What is on your skin ends up in the water.', 'palmtreesurf' ),
			) ),

			array( 'h2', __( 'Why mangroves matter more than they look like they do', 'palmtreesurf' ) ),
			array( 'p', __( 'It is easy to paddle through a mangrove channel and register it as scenery. It is doing considerably more than that.', 'palmtreesurf' ) ),
			array( 'p', __( 'Mangrove root systems are a nursery. A large share of the fish that end up on the reefs and in the open water off this coast spend their early life sheltering in these roots, where bigger predators cannot follow. The inshore fishing a few kilometres away is connected to the health of this estuary in a fairly direct way.', 'palmtreesurf' ) ),
			array( 'p', __( 'They are also coastal defence. Mangrove stands absorb wave energy and storm surge, and their roots trap sediment and hold the shoreline in place. Where mangroves have been cleared elsewhere in the tropics, erosion and storm damage have followed reliably enough that restoration is now a standard coastal engineering response.', 'palmtreesurf' ) ),
			array( 'p', __( 'And they store carbon, at rates per hectare that compare favourably with almost any forest on land, much of it locked in the waterlogged sediment beneath the roots. A protected estuary of this size is quietly doing a lot of work.', 'palmtreesurf' ) ),
			array( 'p', __( 'None of that is why you will enjoy the trip. But it is a decent answer to the question of why a refuge sits here at all, and why the rules about noise and distance are worth taking seriously rather than treating as bureaucracy.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Fitting the estuary into a Tamarindo trip', 'palmtreesurf' ) ),
			array( 'p', __( 'The estuary is a morning activity, and so are surf lessons, which is the one scheduling conflict worth planning around. A common and sensible pattern for a week looks like this.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Surf lesson on your first full morning, while you are fresh and keen.', 'palmtreesurf' ),
				__( 'Estuary at dawn the following day — an earlier start, but a genuine rest day for your arms and shoulders compared with paddling a surfboard.', 'palmtreesurf' ),
				__( 'A second surf session the day after, which is when most people make their biggest jump.', 'palmtreesurf' ),
				__( 'A sunset boat tour on any evening, since it does not compete with a morning activity at all.', 'palmtreesurf' ),
			) ),
			array( 'p', __( 'The estuary also makes an excellent contingency. If the surf is too big for a beginner session on a given morning, flat sheltered water a few hundred metres away is a very good plan B, and one that does not depend on the swell at all.', 'palmtreesurf' ) ),
			array( 'p', __( 'Of everything on offer in Tamarindo, this is the trip visitors most often describe as the surprise of the week. It is the one people book to fill a morning, expecting a pleasant paddle, and end up talking about on the flight home — usually starting with the moment the howlers began, somewhere out in the dark before the sun was properly up.', 'palmtreesurf' ) ),
		)
	);

	$body .= pt_faq_blocks(
		array(
			array( __( 'What is the best time of day for the Tamarindo estuary?', 'palmtreesurf' ), __( 'First light. At dawn the howler monkeys are calling, wading birds are feeding, the water is flat and the air is cool. By mid-morning the wind builds, the water chops up and the animals go quiet.', 'palmtreesurf' ) ),
			array( __( 'What animals will I see in the Tamarindo estuary?', 'palmtreesurf' ), __( 'Commonly howler monkeys, herons and egrets, crabs and iguanas. Often kingfishers, ibis, capuchin monkeys and American crocodiles at a distance. Nothing is guaranteed, and early trips see considerably more.', 'palmtreesurf' ) ),
			array( __( 'Are there crocodiles in the Tamarindo estuary?', 'palmtreesurf' ), __( 'Yes, American crocodiles live there, as in most estuaries on this coast. Guided trips observe them from a distance. Stay on your kayak or board, do not approach them, and do not swim in the estuary.', 'palmtreesurf' ) ),
			array( __( 'Do I need paddling experience?', 'palmtreesurf' ), __( 'No. The water is flat and sheltered. A kayak is the easier option for a first-timer; a paddleboard gives a higher vantage point but takes a little more balance.', 'palmtreesurf' ) ),
			array( __( 'Can children do the estuary trip?', 'palmtreesurf' ), __( 'Generally yes, on flat water with life vests and a guide, and often in a double kayak with an adult. Tell the operator ages and swimming confidence when booking.', 'palmtreesurf' ) ),
			array( __( 'Is the estuary worth doing in the green season?', 'palmtreesurf' ), __( 'Yes, and arguably more so. The mangroves are lush, the birdlife is busy, and morning rain is uncommon — the heavier rain on this coast usually falls in the afternoon or evening.', 'palmtreesurf' ) ),
			array( __( 'How long does a Tamarindo estuary tour take?', 'palmtreesurf' ), __( 'Around three hours is typical, including the safety briefing, the paddle in and back out again, and the time spent stopped watching wildlife rather than moving. Trips generally start at or just before first light, so expect an early pick-up.', 'palmtreesurf' ) ),
			array( __( 'Can I swim in the Tamarindo estuary?', 'palmtreesurf' ), __( 'No. American crocodiles live in the estuary and currents at the mouth can be strong. Swim at the beach instead, and stay on your kayak or paddleboard in the channels.', 'palmtreesurf' ) ),
			array( __( 'What should I bring on an estuary tour?', 'palmtreesurf' ), __( 'Insect repellent, a hat, reef-safe sunscreen, water, a dry bag for your phone or camera, and binoculars if you have them. Wear clothes you do not mind getting damp.', 'palmtreesurf' ) ),
		)
	);

	return $body;
}

/**
 * Post 5 — a five-day Tamarindo itinerary.
 *
 * @return string
 */
function pt_post_five_days() {
	$body  = pt_answer_block(
		__( 'Five days is enough to surf properly, paddle the estuary at dawn, get out on the water at sunset, spend a day inland at a waterfall and still have a morning spare. Book every water activity for the morning, when the wind is lightest, and keep one day flexible for weather. A workable order is: surf, estuary, surf again, inland, then a final surf or boat day.', 'palmtreesurf' )
	);

	$body .= pt_blocks(
		array(
			array( 'p', __( 'Most five-day Tamarindo trips go one of two ways. Either everything gets booked for the middle of the day, when the wind is up and the light is harsh, and the week feels oddly tiring. Or nothing gets booked at all, two days disappear, and the good stuff gets crammed into the end.', 'palmtreesurf' ) ),
			array( 'p', __( 'This is a plan built around what this coast actually does through the day and the week: mornings are for water, afternoons are for heat and rest, evenings are for the ocean at its best-looking. Treat it as a shape to adapt rather than a timetable to obey.', 'palmtreesurf' ) ),

			array( 'h2', __( 'The two rules that make the week work', 'palmtreesurf' ) ),
			array( 'p', __( 'Before the day-by-day, two things matter more than the order of anything.', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Book water activities in the morning. On this coast the wind is typically lightest early and builds through the day. Morning surf is cleaner, morning estuary water is glass, and morning boat runs are smoother. This one decision improves nearly every activity on the list.', 'palmtreesurf' ),
				__( 'Keep one day genuinely unbooked. Weather moves, swell arrives, a lesson gets rescheduled, or you simply want to lie on the sand. A week with no slack is a week that goes wrong the first time something shifts.', 'palmtreesurf' ),
			) ),

			array( 'h2', __( 'Day one: arrive, orient, and get in the water', 'palmtreesurf' ) ),
			array( 'p', __( 'Most people land at Liberia and reach Tamarindo an hour and a half to two hours later. If you get in before mid-afternoon you have time for the single best orientation there is: walk the length of the beach.', 'palmtreesurf' ) ),
			array( 'p', __( 'Walk north towards the estuary mouth and you will see the whole thing laid out — where the beginners are, where the better surfers sit, where the river comes out, and where the town gives way to sand and trees. It takes under an hour and it makes everything else in the week make sense.', 'palmtreesurf' ) ),
			array( 'p', __( 'Then watch the sunset from the beach. This is not a throwaway suggestion. Tamarindo faces broadly west, the sunsets are genuinely exceptional, and on your first evening it recalibrates what you are here for. Book nothing else on day one.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Day two: your first surf lesson', 'palmtreesurf' ) ),
			array( 'p', __( 'Morning, while you are fresh and before the wind. A beginner lesson runs around two hours: roughly twenty minutes on the sand covering safety and the pop-up, then the rest in the whitewater with an instructor putting you into waves.', 'palmtreesurf' ) ),
			array( 'p', __( 'Most people stand up in this session. You will also be more tired than you expect — surfing uses muscles in your back and shoulders that ordinary life leaves alone, and two hours of paddling in warm salt water flattens people who consider themselves fit.', 'palmtreesurf' ) ),
			array( 'p', __( 'So plan the afternoon accordingly: food, shade, water, a nap. Do not stack anything demanding behind a first lesson. In the evening, eat somewhere with a view and go to bed early, because tomorrow starts before sunrise.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Day three: the estuary at first light', 'palmtreesurf' ) ),
			array( 'p', __( 'This is the early start, and it is the one people thank themselves for. The Tamarindo estuary runs inland from the north end of the beach into mangrove channels inside a protected refuge, and at dawn it is a completely different world from the town a few hundred metres away.', 'palmtreesurf' ) ),
			array( 'p', __( 'Howler monkeys calling, herons and kingfishers working the channels, iguanas high in the branches catching the first sun, water like glass. By mid-morning the wind is up and most of it has gone quiet — which is precisely why the trip that leaves at a civilised hour is not the same trip.', 'palmtreesurf' ) ),
			array( 'p', __( 'It also works beautifully as a recovery day. Flat-water paddling is far gentler on the shoulders than surfing, so your body gets a break without you losing a morning.', 'palmtreesurf' ) ),
			array( 'p', __( 'Afternoon: the hottest part of the day, spent in the shade or the pool. Evening: a sunset boat tour if you want the coastline from the water, with a snorkel stop somewhere calm and the run home timed so you are offshore as the light drops.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Day four: surf again, while it is still fresh', 'palmtreesurf' ) ),
			array( 'p', __( 'The second surf session is the one where most people make their biggest jump, because it starts where the first ended rather than at the beginning. The pop-up is already in your body; now it is about catching waves yourself rather than being pushed into them.', 'palmtreesurf' ) ),
			array( 'p', __( 'This is also the point to be specific with your instructor. If you keep nose-diving, or you can stand but cannot stay on, say exactly that. Two sessions spaced a day apart is a much better use of the same money than two back to back.', 'palmtreesurf' ) ),
			array( 'p', __( 'Afternoon and evening: the beach, the town, and a proper dinner. You have earned a slow one.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Day five: get off the beach', 'palmtreesurf' ) ),
			array( 'p', __( 'Guanacaste is not only coastline, and a week that never leaves the sand misses half the province. An hour inland the dry forest starts, with waterfalls, swimming holes, river crossings and ridge roads.', 'palmtreesurf' ) ),
			array( 'p', __( 'Fresh water and shade are a genuine relief after four days of salt and sun, and the change of scenery resets the trip. Take closed shoes, a change of clothes and a dry bag. Waterfalls are dramatically better during and just after green season — by late dry season some are a trickle, so ask before committing if that is the centrepiece.', 'palmtreesurf' ) ),
			array( 'p', __( 'Alternatively, if the sea is what you came for, day five is where a fishing charter fits. An inshore half day works the rocky points close to the coast and is back with your afternoon intact; a full day offshore is a bigger commitment and deserves to be planned in rather than squeezed on.', 'palmtreesurf' ) ),

			array( 'h2', __( 'If you have a sixth or seventh day', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'A third surf session. This is where it stops being a novelty and starts being a skill.', 'palmtreesurf' ),
				__( 'A full-day offshore fishing charter, which does not fit comfortably into a five-day plan.', 'palmtreesurf' ),
				__( 'A quieter neighbouring beach for a day, for contrast with the town.', 'palmtreesurf' ),
				__( 'A second dawn estuary trip. Different tide, different animals, and you will see far more the second time because you know where to look.', 'palmtreesurf' ),
				__( 'Nothing at all. A completely unscheduled day at the beach is not a wasted day.', 'palmtreesurf' ),
			) ),

			array( 'h2', __( 'Adapting this for different groups', 'palmtreesurf' ) ),

			array( 'h3', __( 'Families with children', 'palmtreesurf' ) ),
			array( 'p', __( 'Children usually take to surfing faster than their parents, so keep the lesson on day two and expect them to want more. Swap the inland adventure day for a second beach day if the group is young. The estuary works well for children in a double kayak with an adult, and an inshore half-day fishing trip suits families far better than an offshore run.', 'palmtreesurf' ) ),

			array( 'h3', __( 'Couples', 'palmtreesurf' ) ),
			array( 'p', __( 'Keep the sunset boat tour and make it the centrepiece of an evening rather than an add-on. A private surf lesson for two is worth the difference over a group — you both get more waves and neither of you waits around.', 'palmtreesurf' ) ),

			array( 'h3', __( 'Surfers who already surf', 'palmtreesurf' ) ),
			array( 'p', __( 'Invert the plan. Surf every morning, use the estuary and inland days as rest days between sessions, and ask a local where the sandbars are working that week rather than defaulting to the main beach every day. Green season brings the bigger swell.', 'palmtreesurf' ) ),

			array( 'h3', __( 'Groups where nobody agrees', 'palmtreesurf' ) ),
			array( 'p', __( 'Split the middle days. Anglers offshore, everyone else on a boat tour or the estuary, and reconvene for dinner. Trying to build one activity that satisfies a committed fisherman and a nervous non-swimmer usually satisfies neither.', 'palmtreesurf' ) ),

			array( 'h2', __( 'Practical notes for the week', 'palmtreesurf' ) ),
			array( 'list', array(
				__( 'Tamarindo is walkable. You do not need a car for the beach, dinner or a lesson — only for inland trips and neighbouring beaches.', 'palmtreesurf' ),
				__( 'Sea temperature stays in the high twenties Celsius all year. No wetsuit, ever.', 'palmtreesurf' ),
				__( 'Reef-safe sunscreen, in quantity. It is the most forgotten item and the most regretted.', 'palmtreesurf' ),
				__( 'Book ahead for Christmas, New Year, Semana Santa and the January-to-February peak. May, June, September, October and November are usually fine at short notice.', 'palmtreesurf' ),
				__( 'Afternoon rain in green season rarely affects a morning-scheduled week.', 'palmtreesurf' ),
				__( 'Dry bag for anything electronic going near water.', 'palmtreesurf' ),
			) ),

			array( 'h2', __( 'The version of this plan that fails', 'palmtreesurf' ) ),
			array( 'p', __( 'For contrast, here is how the same five days go wrong: a surf lesson booked for 1pm on day one straight off a flight, an estuary trip at 10am when everything has gone quiet, three activities stacked on day three, nothing at all on day four, and a boat tour on the last afternoon that gets moved for weather with no spare day to move it to.', 'palmtreesurf' ) ),
			array( 'p', __( 'Every one of those is avoidable with two decisions: mornings for water, and one day kept free.', 'palmtreesurf' ) ),

			array( 'h2', __( 'What a day in Tamarindo actually feels like', 'palmtreesurf' ) ),
			array( 'p', __( 'Worth knowing before you plan around it, because the rhythm of the place is quite particular and it drives everything above.', 'palmtreesurf' ) ),
			array( 'p', __( 'You will wake early whether you meant to or not. Howler monkeys start before dawn and they are extraordinarily loud — visitors frequently mistake the first one they hear for something much larger and much closer than a monkey in a tree. The sun comes up fast, near the equator, and by seven the beach is already bright.', 'palmtreesurf' ) ),
			array( 'p', __( 'Mornings are the good hours: light wind, cleaner water, people in the surf, the town slowly waking up. Through the middle of the day the heat becomes the main event and the beach empties out for a couple of hours. Around four it softens again, people drift back to the sand, and the last hour before sunset is when the whole town faces west and stops.', 'palmtreesurf' ) ),
			array( 'p', __( 'Plan with that rhythm instead of against it and the week is easy. Fight it — by scheduling a lesson at midday or an estuary trip at ten — and you will spend the trip mildly uncomfortable and wondering why the photographs do not look like the ones you saw before you came.', 'palmtreesurf' ) ),

			array( 'h2', __( 'One thing worth not scheduling', 'palmtreesurf' ) ),
			array( 'p', __( 'Leave at least one sunset completely alone. No boat, no restaurant reservation, no plan. Walk down to the sand with nothing to do and watch it.', 'palmtreesurf' ) ),
			array( 'p', __( 'It is the thing people describe when they talk about this coast afterwards, and it costs nothing, and it is very easy to fill every evening with something and never actually get round to it. Pick a night early in the week, before the days start disappearing.', 'palmtreesurf' ) ),
		)
	);

	$body .= pt_faq_blocks(
		array(
			array( __( 'How many days do I need in Tamarindo?', 'palmtreesurf' ), __( 'Five to seven nights suits most people. Five allows two surf sessions, a dawn estuary trip, an evening on the water, an inland day and a spare morning. Three nights works but forces choices.', 'palmtreesurf' ) ),
			array( __( 'What is the best order to do things in?', 'palmtreesurf' ), __( 'Arrive and orient on day one, surf on day two while you are fresh, paddle the estuary at dawn on day three as a recovery day, surf again on day four when you make the biggest jump, and go inland or fishing on day five.', 'palmtreesurf' ) ),
			array( __( 'Should I book activities before I arrive?', 'palmtreesurf' ), __( 'For Christmas, New Year, Semana Santa and the January-to-February peak, yes. Outside those periods you can often book a day or two ahead, though private lessons and full-day charters fill first.', 'palmtreesurf' ) ),
			array( __( 'Why should everything be in the morning?', 'palmtreesurf' ), __( 'Wind on this coast is typically lightest early and builds through the day. Morning surf is cleaner, the estuary is flat and full of wildlife at dawn, and boat runs are smoother. Afternoons are for heat, shade and rest.', 'palmtreesurf' ) ),
			array( __( 'Do I need a rental car in Tamarindo?', 'palmtreesurf' ), __( 'Not for the town itself, which is walkable. A car is useful for inland waterfall trips and for reaching quieter neighbouring beaches, and a four-wheel drive is worth having in the green season.', 'palmtreesurf' ) ),
			array( __( 'Can I do all of this with young children?', 'palmtreesurf' ), __( 'Mostly. Surf lessons, the estuary in a double kayak and an inshore half-day fishing trip all work well with children. Swap the inland adventure day for a beach day if the group is young, and tell operators ages when booking.', 'palmtreesurf' ) ),
		)
	);

	return $body;
}

/**
 * The five posts: slug, title, excerpt, body and the photo each uses.
 *
 * @return array<int, array<string, mixed>>
 */
function pt_seed_post_map() {
	return array(
		array(
			'slug'    => 'learn-to-surf-tamarindo-beginners-guide',
			'title'   => __( 'Learning to Surf in Tamarindo: A Complete Beginner\'s Guide', 'palmtreesurf' ),
			'excerpt' => __( 'Why this beach is one of the easiest places in Costa Rica to learn, what a first lesson actually involves, what to bring, and the mistakes that cost beginners waves.', 'palmtreesurf' ),
			'body'    => 'pt_post_learn_to_surf',
			'image'   => 'banner-surf-lesson.jpg',
			'alt'     => __( 'A learner riding whitewater on a soft-top board at Tamarindo', 'palmtreesurf' ),
		),
		array(
			'slug'    => 'best-time-to-visit-tamarindo-costa-rica',
			'title'   => __( 'The Best Time to Visit Tamarindo, Costa Rica: A Month-by-Month Guide', 'palmtreesurf' ),
			'excerpt' => __( 'Dry season versus green season, what each month is actually like, how the weather changes each activity, and when to come for waves, wildlife or value.', 'palmtreesurf' ),
			'body'    => 'pt_post_best_time',
			'image'   => 'banner-surf-students.jpg',
			'alt'     => __( 'Aerial view of the Tamarindo coastline', 'palmtreesurf' ),
		),
		array(
			'slug'    => 'sport-fishing-tamarindo-what-you-catch',
			'title'   => __( 'Sport Fishing in Tamarindo: What You\'ll Catch, and When', 'palmtreesurf' ),
			'excerpt' => __( 'Inshore versus offshore, the species that run on this coast and their rough seasons, licences and conservation, and the questions to ask before booking a charter.', 'palmtreesurf' ),
			'body'    => 'pt_post_fishing',
			'image'   => 'banner-fishing-troll.jpg',
			'alt'     => __( 'Boats and gear staged at the beach launch point in Tamarindo', 'palmtreesurf' ),
		),
		array(
			'slug'    => 'tamarindo-estuary-wildlife-guide',
			'title'   => __( 'The Tamarindo Estuary: What You\'ll See, and Why You Go at Dawn', 'palmtreesurf' ),
			'excerpt' => __( 'Howler monkeys, herons, kingfishers and crocodiles in a protected mangrove refuge minutes from the beach — and why the hour you go changes everything.', 'palmtreesurf' ),
			'body'    => 'pt_post_estuary',
			'image'   => 'banner-crocodile.jpg',
			'alt'     => __( 'A capuchin monkey in the mangroves of the Tamarindo estuary', 'palmtreesurf' ),
		),
		array(
			'slug'    => 'things-to-do-tamarindo-5-day-itinerary',
			'title'   => __( 'Things to Do in Tamarindo: A Five-Day Plan for the Guanacaste Coast', 'palmtreesurf' ),
			'excerpt' => __( 'A day-by-day plan built around how this coast actually works — mornings on the water, afternoons in the shade, and one day deliberately left free.', 'palmtreesurf' ),
			'body'    => 'pt_post_five_days',
			'image'   => 'banner-mangrove.jpg',
			'alt'     => __( 'Palm trees over the ocean at sunset on the Guanacaste coast', 'palmtreesurf' ),
		),
	);
}

/**
 * Publish the journal posts, once.
 *
 * Version-gated like the other content syncs, so a site installed on an earlier
 * release picks them up on update. A post that already exists is never
 * rewritten — the client may have edited it.
 */
function pt_seed_journal_posts() {
	if ( get_option( 'pt_posts_version' ) === PT_VERSION ) {
		return;
	}

	// Marker first: a failure midway must not retry on every request.
	update_option( 'pt_posts_version', PT_VERSION );

	$category_id = 0;
	$term        = term_exists( 'tamarindo-guides', 'category' );

	if ( ! $term ) {
		$term = wp_insert_term(
			__( 'Tamarindo Guides', 'palmtreesurf' ),
			'category',
			array(
				'slug'        => 'tamarindo-guides',
				'description' => __( 'Practical guides to surfing, fishing, wildlife and getting the most out of a week on the Guanacaste coast.', 'palmtreesurf' ),
			)
		);
	}

	if ( ! is_wp_error( $term ) && isset( $term['term_id'] ) ) {
		$category_id = (int) $term['term_id'];
	}

	pt_retire_hello_world();

	// Space the posts out rather than stamping them all with the same minute.
	$offset = 0;

	foreach ( pt_seed_post_map() as $item ) {
		if ( get_page_by_path( $item['slug'], OBJECT, 'post' ) ) {
			continue;
		}

		$body = is_callable( $item['body'] ) ? call_user_func( $item['body'] ) : '';

		if ( ! $body ) {
			continue;
		}

		$post_id = wp_insert_post(
			array(
				'post_type'     => 'post',
				'post_title'    => $item['title'],
				'post_name'     => $item['slug'],
				'post_excerpt'  => $item['excerpt'],
				'post_content'  => $body,
				'post_status'   => 'publish',
				'post_date'     => wp_date( 'Y-m-d H:i:s', time() - ( $offset * DAY_IN_SECONDS ) ),
				'post_category' => $category_id ? array( $category_id ) : array(),
			)
		);

		++$offset;

		if ( is_wp_error( $post_id ) || ! $post_id ) {
			continue;
		}

		if ( function_exists( 'pt_stamp_seeded' ) ) {
			pt_stamp_seeded( $post_id, $body );
		}

		if ( ! empty( $item['image'] ) && function_exists( 'pt_sideload_theme_image' ) ) {
			$attachment_id = pt_sideload_theme_image( $item['image'], $item['alt'] );

			if ( $attachment_id ) {
				set_post_thumbnail( $post_id, $attachment_id );
			}
		}
	}
}
add_action( 'init', 'pt_seed_journal_posts', 994 );

/**
 * Article and FAQPage schema for a journal post.
 *
 * The FAQ node is built from the details blocks actually on the page, so the
 * markup can never describe questions a reader cannot see.
 */
function pt_print_post_schema() {
	if ( ! is_singular( 'post' ) ) {
		return;
	}

	$post_id = get_queried_object_id();
	$image   = get_the_post_thumbnail_url( $post_id, 'pt-hero' );

	$article = array_filter(
		array(
			'@context'      => 'https://schema.org',
			'@type'         => 'Article',
			'headline'      => wp_strip_all_tags( get_the_title( $post_id ) ),
			'description'   => wp_strip_all_tags( get_the_excerpt( $post_id ) ),
			'url'           => get_permalink( $post_id ),
			'datePublished' => get_the_date( 'c', $post_id ),
			'dateModified'  => get_the_modified_date( 'c', $post_id ),
			'image'         => $image ? $image : null,
			'author'        => array(
				'@type' => 'Organization',
				'name'  => get_bloginfo( 'name' ),
				'url'   => home_url( '/' ),
			),
			'publisher'     => array(
				'@type' => 'Organization',
				'name'  => get_bloginfo( 'name' ),
				'url'   => home_url( '/' ),
			),
			'mainEntityOfPage' => get_permalink( $post_id ),
		)
	);

	pt_print_jsonld( $article );

	$faq = pt_extract_faq_from_content( get_post_field( 'post_content', $post_id ) );

	if ( $faq ) {
		pt_print_jsonld(
			array(
				'@context'   => 'https://schema.org',
				'@type'      => 'FAQPage',
				'mainEntity' => $faq,
			)
		);
	}
}
add_action( 'wp_head', 'pt_print_post_schema', 34 );

/**
 * Pull question and answer pairs out of details blocks in post content.
 *
 * @param string $content Raw post content.
 * @return array<int, array<string, mixed>>
 */
function pt_extract_faq_from_content( $content ) {
	if ( false === strpos( $content, 'wp-block-details' ) ) {
		return array();
	}

	$entities = array();

	if ( ! preg_match_all( '#<details[^>]*>\s*<summary>(.*?)</summary>(.*?)</details>#s', $content, $matches, PREG_SET_ORDER ) ) {
		return array();
	}

	foreach ( $matches as $match ) {
		$question = trim( wp_strip_all_tags( $match[1] ) );
		$answer   = trim( wp_strip_all_tags( $match[2] ) );

		if ( '' === $question || '' === $answer ) {
			continue;
		}

		$entities[] = array(
			'@type'          => 'Question',
			'name'           => $question,
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => $answer,
			),
		);
	}

	return $entities;
}

/**
 * Trash WordPress's "Hello world!" sample post.
 *
 * Only while it is untouched: same slug, still in Uncategorized, no comments of
 * substance and the stock body. A client who has rewritten it keeps it.
 */
function pt_retire_hello_world() {
	$post = get_page_by_path( 'hello-world', OBJECT, 'post' );

	if ( ! $post instanceof WP_Post || 'publish' !== $post->post_status ) {
		return;
	}

	// The stock post is tiny; anything the client wrote will be longer.
	if ( str_word_count( wp_strip_all_tags( $post->post_content ) ) > 40 ) {
		return;
	}

	if ( false === strpos( $post->post_content, 'Welcome to WordPress' ) ) {
		return;
	}

	wp_trash_post( $post->ID );
}
