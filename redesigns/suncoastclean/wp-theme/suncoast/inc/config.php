<?php
/**
 * Site facts and page groupings. Every value here comes from suncoastclean.com itself.
 */

defined( 'ABSPATH' ) || exit;

/** Contact details, overridable in the Customizer (Appearance → Customize → Sun Coast details). */
function suncoast_option( $key ) {
	$defaults = array(
		'phone'         => '(561) 747-8787',
		'phone_tel'     => '+15617478787',
		'email'         => 'brad@suncoastclean.com',
		'address'       => 'Jupiter, FL 33478',
		'facebook'      => 'https://www.facebook.com/suncoastcleaningandrestoration/',
		'twitter'       => 'https://twitter.com/SunCoastClean',
		'estimate_to'   => get_option( 'admin_email' ),
	);
	$value = get_theme_mod( 'suncoast_' . $key, '' );
	return $value !== '' ? $value : ( $defaults[ $key ] ?? '' );
}

/** The live site's main menu, in order (used when no menu is assigned). */
function suncoast_nav_services() {
	return array(
		'carpet-cleaning'                                     => 'Carpet Cleaning',
		'tile-and-grout-cleaning'                             => 'Tile and Grout Cleaning',
		'furniture-cleaning-that-gets-out-stains'             => 'Furniture Cleaning',
		'area-rug-cleaning'                                   => 'Area Rug Cleaning',
		'water-damage-cleaning'                               => 'Water Damage',
		'air-duct-cleaning'                                   => 'Air Duct Cleaning in Jupiter & Sanitizing',
		'commercial-cleaning-for-southern-florida-businesses' => 'Commercial Cleaning',
		'green-carpet-cleaning'                               => 'Green Carpet Cleaning',
	);
}

/** Every service page, with a short label for lists. */
function suncoast_services() {
	return array(
		'carpet-cleaning'                                     => 'Carpet cleaning',
		'green-carpet-cleaning'                               => 'Green carpet cleaning',
		'tile-and-grout-cleaning'                             => 'Tile and grout cleaning',
		'natural-stone-restoration-and-polishing'             => 'Natural stone restoration',
		'shower-stall-cleaning'                               => 'Shower stall cleaning',
		'furniture-cleaning-that-gets-out-stains'             => 'Furniture cleaning',
		'leather-cleaning-and-conditioning'                   => 'Leather cleaning',
		'area-rug-cleaning'                                   => 'Area rug cleaning',
		'drapery-and-curtain-cleaning'                        => 'Drapery and curtain cleaning',
		'water-damage-cleaning'                               => 'Water damage',
		'hurricane-clean-up'                                  => 'Hurricane clean up',
		'air-duct-cleaning'                                   => 'Air duct cleaning',
		'commercial-cleaning-for-southern-florida-businesses' => 'Commercial cleaning',
		'full-home-cleaning'                                  => 'Full home cleaning',
		'move-in-cleaning'                                    => 'Move in cleaning',
	);
}

/** Town pages. */
function suncoast_locations() {
	return array(
		'jupiter-carpet-cleaning' => 'Jupiter',
		'palm-beach'              => 'Palm Beach Gardens',
		'port-st-lucie'           => 'Port St. Lucie',
		'stuart'                  => 'Stuart',
		'indiantown'              => 'Indiantown',
		'lake-worth'              => 'Lake Worth',
		'boca-raton'              => 'Boca Raton',
		'boynton-beach'           => 'Boynton Beach',
		'wellington'              => 'Wellington',
		'west-palm-beach'         => 'West Palm Beach',
		'royal-palm-beach'        => 'Royal Palm Beach',
	);
}

/** The 29 stain guides under "Get That Stain Out!". */
function suncoast_stains() {
	return array(
		'acid', 'alcohol', 'blood', 'candle-wax', 'candy', 'chocolate', 'cigarette-burns', 'crayon', 'coffee',
		'greasy-food-stains', 'grass', 'gum', 'ice-cream', 'ink', 'jamjelly', 'lipstick', 'mildew', 'mud',
		'mustardketchup', 'nail-polish', 'oil', 'paintvarnish', 'pet-stains', 'rust', 'shoe-polish', 'soda', 'tar', 'vomit',
	);
}

/** Towns listed on the home page; those with a page link to it. */
function suncoast_home_towns() {
	return array(
		'Jupiter' => 'jupiter-carpet-cleaning', 'Palm Beach Gardens' => 'palm-beach', 'West Palm Beach' => 'west-palm-beach',
		'Palm Beach' => '', 'Lake Worth' => 'lake-worth', 'Wellington' => 'wellington', 'Boynton Beach' => 'boynton-beach',
		'Delray Beach' => '', 'Boca Raton' => 'boca-raton', 'Stuart' => 'stuart', 'Jensen Beach' => '',
		'Port St. Lucie' => 'port-st-lucie', 'Indiantown' => 'indiantown',
	);
}

/** Old .aspx addresses that still appear in the copy and in old links, and the page they go to now. */
function suncoast_aspx_map() {
	return array(
		'carpet-cleaning-in-florida'                 => 'carpet-cleaning',
		'careers'                                    => 'now-hiring',
		'spring-cleaning'                            => 'spring-cleaning-tips',
		'cleaning-services-testimonials'             => '/#reviews',
		'admin/pages/leave-a-testimonial-for-suncoast' => 'contact-us',
		'contact-us'                                 => 'contact-us',
	);
}

/** Facts for the "at a glance" block; each one is on the About or home page. */
function suncoast_facts() {
	return array(
		'Established in 1988',
		'Owner Bradley Broderick, 30 years of cleaning and restoration experience',
		'Nationally certified by the IICRC; an IICRC certified firm since 1998',
		'Better Business Bureau member since 1993',
		'Licensed, bonded and insured (license #1988-09231)',
		'Master Technicians on every truck with at least 12 years of experience with Sun Coast',
		'Authorized 3M Scotchgard provider',
		'Based in Jupiter, FL 33478; serving southeastern Florida from Port St. Lucie to Boca Raton',
	);
}

/** Words that tie a news post to a service (matched against post titles). */
function suncoast_service_words() {
	return array(
		'carpet-cleaning'                                     => array( 'carpet' ),
		'green-carpet-cleaning'                               => array( 'green', 'eco', 'natural', 'non-toxic' ),
		'tile-and-grout-cleaning'                             => array( 'tile', 'grout' ),
		'natural-stone-restoration-and-polishing'             => array( 'stone', 'marble', 'hardwood' ),
		'shower-stall-cleaning'                               => array( 'shower' ),
		'furniture-cleaning-that-gets-out-stains'             => array( 'upholstery', 'furniture', 'couch', 'sofa' ),
		'leather-cleaning-and-conditioning'                   => array( 'leather' ),
		'area-rug-cleaning'                                   => array( 'rug' ),
		'drapery-and-curtain-cleaning'                        => array( 'drap', 'curtain' ),
		'water-damage-cleaning'                               => array( 'water damage', 'flood', 'water restoration' ),
		'hurricane-clean-up'                                  => array( 'hurricane', 'flood', 'water damage' ),
		'air-duct-cleaning'                                   => array( 'duct', 'allerg' ),
		'commercial-cleaning-for-southern-florida-businesses' => array( 'commercial' ),
		'full-home-cleaning'                                  => array( 'home cleaning', 'spring cleaning', 'holiday', 'guests' ),
		'move-in-cleaning'                                    => array( 'move in', 'move-in' ),
	);
}

/** Search snippets for the main pages, written from each page's own content. */
function suncoast_descriptions() {
	return array(
		'home'                              => 'Carpet, upholstery, tile and grout, area rug and water damage cleaning in Jupiter and the Palm Beaches since 1988. Free estimates: (561) 747-8787.',
		'about-suncoast-carpet-cleaning'    => 'Sun Coast Cleaning and Restoration: established 1988, owner Bradley Broderick, IICRC certified, licensed, bonded and insured, Master Technicians on every truck.',
		'best-cleaning-services-in-florida' => 'Carpet, tile and grout, area rug, drapery, furniture, leather, shower, air duct, water damage and commercial cleaning from Sun Coast in Jupiter and the Palm Beaches.',
		'locations'                         => 'Sun Coast comes to you across southeastern Florida: Jupiter, Palm Beach Gardens, West Palm Beach, Wellington, Boca Raton, Stuart, Port St. Lucie and 40 more towns.',
		'contact-us'                        => 'Contact Sun Coast Cleaning and Restoration in Jupiter, FL 33478. Call or text (561) 747-8787 for a free estimate, leave a testimonial, or ask about open jobs.',
		'get-that-stain-out'                => 'Sun Coast\'s step-by-step guides to removing 29 common carpet stains, from blood and coffee to pet stains, ink, wax and gum. If it won\'t lift, call (561) 747-8787.',
		'news'                              => 'Cleaning tips and news from Sun Coast in Jupiter: carpet, tile, upholstery, drapery, leather and water damage advice for Palm Beach and Martin County homes.',
		'privacy'                           => 'How Sun Coast Cleaning and Restoration collects, uses and protects personal information on suncoastclean.com.',
		'carpet-cleaning'                   => 'Carpet cleaning in Jupiter from Sun Coast: certified technicians, truck-mounted deep steam and dry cleaning that keeps your carpet looking new and your warranty intact.',
		'green-carpet-cleaning'             => 'Green carpet cleaning in Jupiter and the Palm Beaches: eco-friendly, all natural, biodegradable and allergy free alternatives from Sun Coast.',
		'tile-and-grout-cleaning'           => 'Tile and grout cleaning in Jupiter and the Palm Beaches from Sun Coast: dirty grout lines and dull tile restored by certified technicians.',
		'natural-stone-restoration-and-polishing' => 'Natural stone restoration and polishing in Jupiter and the Palm Beaches: marble, travertine and other stone floors cleaned and restored by Sun Coast.',
		'shower-stall-cleaning'             => 'Shower stall cleaning in Jupiter from Sun Coast Cleaning and Restoration: tile, grout, glass and fixtures cleaned professionally.',
		'furniture-cleaning-that-gets-out-stains' => 'Furniture and upholstery cleaning in Jupiter and the Palm Beaches that gets out stains, from sofas and sleepers to dining chairs. Sun Coast, since 1988.',
		'leather-cleaning-and-conditioning' => 'Leather cleaning and conditioning in Jupiter and West Palm Beach from Sun Coast: sofas, chairs and more cleaned, conditioned and protected.',
		'area-rug-cleaning'                 => 'Fine area rug cleaning in Jupiter and the Palm Beaches: Oriental and specialty rugs cleaned by IICRC Master Rug Cleaners at Sun Coast Cleaning and Restoration.',
		'drapery-and-curtain-cleaning'      => 'Drapery and curtain cleaning in Jupiter and Palm Beach from Sun Coast, often without taking them down.',
		'water-damage-cleaning'             => 'Water damage restoration in Jupiter and the Palm Beaches: extraction, drying and disinfecting by Sun Coast\'s certified water removal technicians.',
		'hurricane-clean-up'                => 'Hurricane clean up in Jupiter and the Palm Beaches, 24 hours a day, 7 days a week: water extraction, debris removal, disinfecting and drying by Sun Coast\'s own technicians.',
		'air-duct-cleaning'                 => 'Air duct cleaning and sanitizing in Jupiter from Sun Coast Cleaning and Restoration, for cleaner air and fewer allergens at home.',
		'commercial-cleaning-for-southern-florida-businesses' => 'Commercial cleaning for southern Florida businesses: carpet, tile, upholstery and water damage work for offices and shops from Sun Coast in Jupiter.',
		'full-home-cleaning'                => 'Full home cleaning in Jupiter: air ducts, carpet, tile and grout and furniture cleaned in one visit by Sun Coast Cleaning and Restoration.',
		'move-in-cleaning'                  => 'Move in cleaning in Jupiter and Palm Beach from Sun Coast: carpet, tile, upholstery and ducts cleaned before you unpack.',
	);
}

/** Service choices on the estimate form. */
function suncoast_service_options() {
	return array( 'Carpet cleaning', 'Tile and grout', 'Natural stone and polishing', 'Upholstery / furniture', 'Leather cleaning',
		'Area rug', 'Drapery', 'Water damage', 'Air duct cleaning', 'Shower stall', 'Full home cleaning', 'Move in cleaning', 'Commercial' );
}
