<?php
/**
 * Static site content (FAQs, testimonials, gallery, booking tips).
 * Filter with `popeye_content_{key}` from a child theme or plugin to change it.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

return array(
	'faqs'         => array(
		array( 'How many people can charter the Popeye boat?', 'Popeye Charters accommodates up to 10 guests per private charter. Every booking is fully private — no strangers, just your group and Captain Jeff Jacobs. The whole boat is yours for the duration of your trip.' ),
		array( 'Is a captain included with the charter?', "Yes. Every Popeye charter includes USCG 100-Ton Master licensed Captain Jeff Jacobs, who has over 35 years of experience navigating Charleston's waterways. You simply enjoy the ride — navigation, safety, and local knowledge are all taken care of." ),
		array( 'How long are Popeye Charters trips?', "Most charters run 2 to 4 hours, though custom durations are available depending on your group's preferences. Whether you want a quick sunset cruise or a full afternoon on the water exploring the harbor and marshes, we can accommodate you." ),
		array( 'What areas does Popeye Charters cruise?', 'We explore Charleston Harbor and the surrounding Lowcountry waterways — including iconic views of the Arthur Ravenel Jr. Bridge, Fort Sumter, the USS Yorktown, Rainbow Row, and the historic Charleston peninsula. Dolphin watching routes venture into the coastal marshes and tidal estuaries.' ),
		array( 'Can we bring food and drinks on the charter?', 'Absolutely. Guests are welcome to bring their own food, beverages, and coolers aboard. Popeye Charters is BYOB-friendly — come ready to relax, eat, and enjoy the ride across Charleston Harbor.' ),
		array( 'Is Popeye the boat from the Robin Williams movie?', 'The Popeye boat is widely believed to have appeared in the 1980 Robert Altman film Popeye, starring Robin Williams and Shelley Duvall. The historic 1979 Young Brothers lobster boat carries that legendary connection as part of its rich and storied history.' ),
		array( 'What is the best time of year to book a charter in Charleston?', 'Charleston is a year-round boating destination with mild winters. The most popular months are March through October. Spring and fall offer ideal weather for dolphin watching and harbor tours, while summer sunsets from the water are absolutely spectacular. Book early as dates fill quickly.' ),
		array( 'Are Popeye Charters good for special occasions?', 'Absolutely. Popeye Charters are perfect for birthdays, anniversaries, bachelorette parties, proposals, corporate outings, and family celebrations. Our Elite Special Cruises are tailored specifically for memorable events on the water — the entire boat is yours, so you set the tone.' ),
		array( 'Do you offer dolphin watching tours in Charleston?', "Yes — dolphin watching is one of the most popular Popeye Charter experiences. Charleston's coastal waterways are home to Atlantic bottlenose dolphins year-round, and Captain Jeff knows exactly where to find them. Sightings are extremely common on our harbor and marsh excursions." ),
		array( 'How do I book a Popeye Charter?', 'Simply visit our Book a Charter page, fill in your details — date, group size, and preferred experience — and Stepp & Rocio will follow up to confirm your reservation. We recommend booking as early as possible, especially for weekends and summer dates.' ),
	),

	'testimonials' => array(
		array(
			'occasion' => '80th Birthday Celebration',
			'name'     => 'Alyson Tracy',
			'lead'     => 'We celebrated my mother’s 80th birthday aboard ‘Popeye’ in Charleston Harbor, and it was truly an unforgettable experience from start to finish. Finding the marina was easy, parking was plentiful, and spotting this beautifully restored wooden boat was effortless — it immediately stood out from every other vessel with its charm and character.',
			'body'     => array(
				'The boat is incredibly comfortable and thoughtfully laid out, with seating at the bow and aft, a cozy cabin interior where you can watch the captain at work, and a fully equipped galley kitchen. We enjoyed wine and light hors d’oeuvres while taking in some of the most breathtaking views Charleston has to offer.',
				'Seeing Charleston from the water was absolutely spectacular — The Battery, Waterfront Park, sailing beneath the Arthur Ravenel Jr. Bridge, passing the USS Yorktown and Shutes Folly Island. Every moment felt special.',
				'What makes ‘Popeye’ so unique is its remarkable character and sense of nostalgia. It transports you to another era in the best possible way while still having every modern comfort you need. The captain and crew were knowledgeable, welcoming, and genuinely accommodating — they helped turn an already beautiful evening into a truly meaningful family memory.',
			),
			'close'    => 'It’s far more than just a boat ride. It’s a memorable experience filled with beauty, history, comfort, and charm!',
		),
		array(
			'occasion' => 'Birthday Celebration',
			'name'     => 'Marcia Litchfield',
			'lead'     => 'What an unforgettable birthday celebration aboard ‘Popeye’ in beautiful Charleston Harbor! We sailed along the Ashley River and Cooper River, taking in iconic sights like The Battery, Fort Sumter, the USS Yorktown, and the stunning Arthur Ravenel Jr. Bridge — all with the charming skyline of Charleston as our backdrop.',
			'body'     => array(
				'The weather was absolutely perfect, and sailing on this beautifully restored classic wooden boat made the day even more special. Knowing that ‘Popeye’ was actually featured in the Popeye movie added such a fun and nostalgic touch — it truly stands out among the other boats and yachts in the harbor.',
			),
			'close'    => "If you're looking for a unique experience and a little trip down memory lane, this is it. The boat is comfortable, gorgeous, and full of character. And the captain and crew? Simply outstanding — friendly, attentive, and incredibly accommodating from start to finish. Highly recommend!",
		),
	),

	// image stem => [caption, category].
	'gallery'      => array(
		array( 'public_600c_7931e26f68234b658117323d9d71cd94', 'Popeye docked at the marina on a clear day', 'vessel' ),
		array( 'public_6df4_fb82495efd9f484c9512765f3476f647', 'Popeye docked at the marina — classic Young Brothers lobster boat', 'vessel' ),
		array( 'public_46fc_9c29c3b9f3064f5699d8db58f9dd6cc8', "Popeye's warm wood wheelhouse with classic helm", 'vessel' ),
		array( 'public_a4e9_a3689355982b47ee89e0e93ec413208b', "Popeye's mahogany head with granite counter", 'vessel' ),
		array( 'public_583e_c4c50122f0be43ec90b249a5001ec9c7', 'View from the stern — pilothouse at golden hour', 'vessel' ),
		array( 'public_4114_7215344bbf124e30a59b01153b1bd2d3', "Golden sunset over the water from Popeye's deck", 'water' ),
		array( 'public_fbab_6229d9679bfe4e8c8741d48790e51b52', "The Arthur Ravenel Jr. Bridge from Popeye's bow — Charleston Harbor", 'water' ),
		array( 'public_7877_a8027569eea74c0aab509e673c30377e', "Passing under the Ravenel Bridge — Popeye's deck in the foreground", 'water' ),
		array( 'public_7970_769ca322dcc04625abc94f30ba3076e6', 'USS Yorktown aircraft carrier at Patriots Point, seen from Popeye', 'water' ),
		array( 'public_f80b_c7da2d8f823046beb09606004d35603e', "Taking in the view of the bridge from Popeye's deck", 'water' ),
		array( 'public_add2_c8ea59b30fc744859e33c2858481a9c8', 'Living the dream — arms wide open on Popeye at sunset', 'water' ),
		array( 'public_2bc3_b468179afe45400786a1199c93721adf', 'Stepp and Rocio — owners of Popeye Charters', 'crew' ),
		array( 'public_fc65_731ac94f857b4a678172cf1ddf5d7c20', 'Stepp and Rocio enjoying time on the water', 'crew' ),
		array( 'public_94dc_0601782452514a6b819b72d48b349bac', 'Guests enjoying the aft deck at sunset', 'crew' ),
		array( 'public_8555_1417e3bb588a49a0aa0e9522fddd7af9', 'Guests relaxing on the aft deck with the Ravenel Bridge behind them', 'crew' ),
		array( 'public_75b7_faacff82b3bd4190b4a3a90ddfc81aac', "A guest relaxing with snacks on Popeye's deck — the good life", 'crew' ),
		array( 'public_4e07_f0dc87067aa84b458344e7b5e9af78db', 'Soaking it all in — the open water and Charleston skyline', 'crew' ),
		array( 'public_5523_e6389845fd664a0e99656a50583576c8', 'Happy guests enjoying a charter on Popeye', 'crew' ),
		array( 'public_91b9_05bce79f7b964b7fb6039ca5c2e7cc39', 'Good times aboard Popeye — friends, food, and open water', 'crew' ),
		array( 'public_1fb4_0d1fa8b595034410b666708f21835d87', '1980 Popeye movie poster starring Robin Williams and Shelley Duvall', 'film' ),
		array( 'public_8850_58d93c2e033541038246839ebaba25c5', 'Brutus (played by Paul L. Smith) on set of the 1980 Popeye movie', 'film' ),
		array( 'public_d339_ee732259813844259aed51d985daebbe', 'Robin Williams as Popeye the Sailor Man in the 1980 film', 'film' ),
		array( 'public_a861_cf8d7e47078a4d5bb7aae1d621420b70', 'Cast aboard boats during filming of the 1980 Popeye movie', 'film' ),
		array( '95db6b4e53c847a9844482058ca95cac', 'The Popeye boat at Sweethaven Village in Malta', 'film' ),
	),

	'gallery_cats' => array(
		'vessel' => 'The Vessel',
		'water'  => 'On the Water',
		'crew'   => 'Crew & Guests',
		'film'   => 'From the Film',
	),

	'expect'       => array(
		array( 'BYO Food & Drinks', 'Bring your own snacks and non-alcoholic beverages. Stepp will point you to great local spots to stock up.' ),
		array( 'Wildlife Sightings', 'Dolphins, pelicans, and the occasional manatee are regular visitors in Charleston Harbor.' ),
		array( 'Iconic Landmarks', 'Cruise past the Ravenel Bridge, USS Yorktown at Patriots Point, and Fort Sumter.' ),
		array( 'Movie History', "Ask Stepp about Popeye's Hollywood past — there's a story worth telling." ),
		array( 'All Ages Welcome', 'Popeye is great for families, couples, friend groups, and corporate outings alike.' ),
		array( 'Photo Opportunities', 'Every angle on this boat is a postcard. Bring your camera — you\'ll use it.' ),
	),
);
