<?php
/**
 * Default homepage content.
 *
 * All copy below is taken or lightly edited from the public networkip.net pages
 * (Home, Service, International Calling, Customer Intelligence, Integration,
 * Call Quality, Technology). Do not add claims that are not on the public site.
 *
 * Short single-value fields (headlines, contact details, CTAs) can be edited in
 * Appearance → Customize → NetworkIP Homepage. Repeating card content lives in
 * the arrays below. Edit them here, or change them from a child theme or plugin
 * with the `networkip_home_content` filter:
 *
 *     add_filter( 'networkip_home_content', function ( $content ) {
 *         $content['services'][0]['text'] = 'New text';
 *         return $content;
 *     } );
 *
 * @package NetworkIP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Defaults for the Customizer-editable fields.
 *
 * @return array<string,string>
 */
function networkip_defaults() {
	return array(
		// Header.
		'header_cta_label'     => __( 'Talk to Our Team', 'networkip' ),

		// Hero.
		'hero_eyebrow'         => __( 'Global reach. Real opportunity.', 'networkip' ),
		'hero_title'           => __( 'People Connect Possibilities.', 'networkip' ),
		'hero_title_highlight' => __( 'Possibilities', 'networkip' ),
		'hero_text'            => __( 'For more than 25 years, NetworkIP has enabled MNOs and MVNOs to outsource international calling with minimal risk and significant regulatory savings, helping them grow, compete and deliver more value to their customers.', 'networkip' ),
		'hero_primary_label'   => __( 'Talk to Our Team', 'networkip' ),
		'hero_primary_url'     => '/contact-us/',
		'hero_secondary_label' => '',
		'hero_secondary_url'   => '/international-calling/',
		'hero_side_words'      => __( 'People, Connect, Opportunities, Grow', 'networkip' ),

		// Gold band under the carrier strip.
		'band_eyebrow'         => __( 'Built on experience. Designed for growth.', 'networkip' ),
		'band_title'           => __( 'Global Calling Solutions for Mobile Operators.', 'networkip' ),
		'band_title_highlight' => __( 'Mobile Operators', 'networkip' ),
		'band_text'            => __( 'Bundled and add-on international calling that helps MNOs and MVNOs remove consumer barriers, increase revenue and improve loyalty.', 'networkip' ),
		'band_side_words'      => __( 'People, Ideas, Cultures, Opportunities', 'networkip' ),

		// Photo section.
		'bridge_eyebrow'         => __( 'A more connected world', 'networkip' ),
		'bridge_title'           => __( 'Bridging People. Strengthening Communities.', 'networkip' ),
		'bridge_title_highlight' => __( 'Strengthening', 'networkip' ),
		'bridge_text'            => __( 'International calling is more than a service. It keeps families and friends together, without the need for calling apps, and helps mobile operators deliver greater value.', 'networkip' ),
		'bridge_button_label'    => __( 'Our Services', 'networkip' ),
		'bridge_button_url'      => '/service/',
		'bridge_side_words'      => __( 'People, Ideas, Cultures, Opportunities', 'networkip' ),
		'bridge_image'           => '',

		// Carrier strip under the hero.
		'about_carriers'       => 'AT&T, Verizon, T-Mobile, Boost Mobile',

		// Contact.
		'contact_title'        => __( 'Still have questions? Let’s chat!', 'networkip' ),
		'contact_text'         => __( 'Get in touch with us via phone or email. Or, leave us a message with your contact information and we’ll get back to you as soon as possible.', 'networkip' ),
		'contact_address'      => "119 West Tyler Street, Suite 100\nLongview, Texas 75601, United States",
		'contact_phone'        => '512-423-0748',
		'contact_email'        => 'marketing@networkip.net',
		'contact_recipient'    => '',
		'contact_form_enabled' => '1',

		// Logo shown in the dark footer (blank = bundled white logo).
		'logo_light'           => '',

		// Layout options.
		'home_show_content'    => '',
		'designed_pages'       => '1',
		'neutralize_builders'  => '1',
	);
}

/**
 * Repeating homepage content (cards, panels, stats).
 *
 * `url` values starting with "/" are resolved against home_url().
 *
 * @return array<string,mixed>
 */
function networkip_home_content() {
	$content = array(
		'band_features'    => array(
			array(
				'icon'  => 'international-calling',
				'title' => __( 'Grow Revenue', 'networkip' ),
				'text'  => __( 'Offering international long distance is an easy way to increase revenue and improve loyalty.', 'networkip' ),
			),
			array(
				'icon'  => 'growth-bars',
				'title' => __( 'Move Faster', 'networkip' ),
				'text'  => __( 'Turnkey, or integrated with your existing infrastructure. NetworkIP gets you up and running quickly.', 'networkip' ),
			),
			array(
				'icon'  => 'partners',
				'title' => __( 'A Partner You Can Trust', 'networkip' ),
				'text'  => __( '25+ years of experience and exclusive direct connections with the major US MNOs.', 'networkip' ),
			),
		),

		'impact_title'     => __( 'Our impact', 'networkip' ),
		'impact'           => array(
			array(
				'value' => '25+',
				'label' => __( 'Years of experience', 'networkip' ),
			),
			array(
				'value' => '100+',
				'label' => __( 'International carriers', 'networkip' ),
			),
			array(
				'value' => '6M+',
				'label' => __( 'Calls a day capacity', 'networkip' ),
			),
			array(
				'value' => '1B+',
				'label' => __( 'End-user accounts supported', 'networkip' ),
			),
		),

		'services_heading' => array(
			'eyebrow' => __( 'Services', 'networkip' ),
			'title'   => __( 'Turnkey international calling, technology and intelligence.', 'networkip' ),
			'text'    => __( 'NetworkIP offers a range of calling solutions on our Hosted Services Platform. Offering international long distance (ILD) for your customers is an easy way to increase revenue and improve loyalty.', 'networkip' ),
		),
		'services'         => array(
			array(
				'icon'  => 'international-calling',
				'title' => __( 'International Calling', 'networkip' ),
				'text'  => __( 'Bundled and add-on international calling (voice) offerings that eliminate the traditional barrier and consumer confusion in the marketplace.', 'networkip' ),
				'url'   => '/international-calling/',
			),
			array(
				'icon'  => 'customer-intelligence',
				'title' => __( 'Customer Intelligence', 'networkip' ),
				'text'  => __( 'Customizable reports and flexible data mining with Odessi, for planning distribution, marketing and future product offerings.', 'networkip' ),
				'url'   => '/customer-intelligence/',
			),
			array(
				'icon'  => 'integration-flexibility',
				'title' => __( 'Integration & Flexibility', 'networkip' ),
				'text'  => __( 'Whether you want a turnkey solution or prefer to integrate with your existing infrastructure, NetworkIP can get you up and running quickly.', 'networkip' ),
				'url'   => '/integration/',
			),
			array(
				'icon'  => 'call-quality-shield',
				'title' => __( 'Call Quality', 'networkip' ),
				'text'  => __( 'iQTechnology® (iQT) delivers higher percentages of successful calls, optimal call quality, fewer trouble tickets and a predictable end-user experience.', 'networkip' ),
				'url'   => '/call-quality/',
			),
			array(
				'icon'  => 'service-platform',
				'title' => __( 'Hosted Services Platform', 'networkip' ),
				'text'  => __( 'Cloud-based turnkey products and services, with no need for infrastructure, switches or additional technical staff.', 'networkip' ),
				'url'   => '/technology/',
			),
			array(
				'icon'  => 'carriers-users',
				'title' => __( 'Carrier & Customer Support', 'networkip' ),
				'text'  => __( 'Carrier services backed by customer service before, during and after the sale, with Spanish-language call center support available.', 'networkip' ),
				'url'   => '/service/',
			),
		),

		'network_heading'  => array(
			'eyebrow' => __( 'Global calling', 'networkip' ),
			'title'   => __( 'Call anyone, anywhere. As easy as calling stateside.', 'networkip' ),
			'text'    => __( 'Utilizing its highly evolved platform, NetworkIP delivers a range of bundled and add-on international calling (voice) offerings. With a long-standing reputation in the telecom industry, NetworkIP continues to innovate, disrupt and support the global voice communications needs of its clients and subscribers.', 'networkip' ),
		),
		'network_panels'   => array(
			array(
				'icon'  => 'globe-coverage',
				'title' => __( 'Bundled / Add-on Worldwide Calling', 'networkip' ),
				'text'  => __( 'Provides the least path of resistance for consumers to call anywhere in the world, and eliminates or minimizes the need to use calling apps to call family and friends.', 'networkip' ),
			),
			array(
				'icon'  => 'phone-calls',
				'title' => __( 'Direct dialing support', 'networkip' ),
				'text'  => __( 'Direct dialing through exclusive connections with the major US MNOs, including AT&T, Verizon, T-Mobile and Boost Mobile.', 'networkip' ),
			),
			array(
				'icon'  => 'call-quality-shield',
				'title' => __( 'Fraud and abuse controls', 'networkip' ),
				'text'  => __( 'NetworkIP’s automated Fraud and Abuse measures are proven, flipping the current model of focusing on the heavy users to enabling casual consumers.', 'networkip' ),
			),
		),
		'network_stats'    => array(
			array(
				'value' => '51.6M',
				'label' => __( 'foreign-born U.S. residents, 15.6% of the population*', 'networkip' ),
			),
			array(
				'value' => '80M+',
				'label' => __( 'addressable market in the USA (25% of US consumers)', 'networkip' ),
			),
			array(
				'value' => '25+%',
				'label' => __( 'of mobile subscribers have the need', 'networkip' ),
			),
			array(
				'value' => 'Under 2%',
				'label' => __( 'value of roaming compared with the need of the US population', 'networkip' ),
			),
		),
		'network_footnote' => __( '*In 2024, the highest share of foreign-born people in U.S. history. Based on 2024 results.', 'networkip' ),

		'tech_heading'     => array(
			'eyebrow' => __( 'Technology', 'networkip' ),
			'title'   => __( 'One platform, so you can focus on your customers.', 'networkip' ),
			'text'    => __( 'There is no need for infrastructure, switches or additional technical staff — we take care of all these business components so you can focus on your relationship with your customers.', 'networkip' ),
		),
		'tech_cards'       => array(
			array(
				'title' => __( 'Hosted Services Platform', 'networkip' ),
				'text'  => __( 'NetworkIP delivers best-in-class performance with a well-rounded platform enabling customers to combine any of our services.', 'networkip' ),
			),
			array(
				'title' => __( 'Innovation & API access', 'networkip' ),
				'text'  => __( 'Offer prepaid, unlimited and VoIP long distance calling products, or build your own with API access to an open interface for creating and customizing internet-based products.', 'networkip' ),
			),
			array(
				'title' => __( 'Odessi 3', 'networkip' ),
				'text'  => __( 'Back-office tools with advanced inventory, billing and reporting functionality and consumer behavior analytics through a customizable web-based environment.', 'networkip' ),
			),
			array(
				'title' => __( 'iQT', 'networkip' ),
				'text'  => __( 'Through our patented technology, we ensure optimal call quality and a better end-user experience with a higher percentage of successful calls and fewer trouble tickets.', 'networkip' ),
			),
			array(
				'title' => __( 'Call Center', 'networkip' ),
				'text'  => __( 'One of the most experienced customer support teams in the industry enabling a positive relationship for you with your users. Bilingual in English and Spanish.', 'networkip' ),
			),
			array(
				'title' => __( 'Reliability', 'networkip' ),
				'text'  => __( 'Switching facilities dispersed over two geographical regions, enterprise-grade data storage with sophisticated backup solutions and connections to over 100 international carriers.', 'networkip' ),
			),
		),
		'tech_stats'       => array(
			array(
				'value' => '6M+',
				'label' => __( 'calls a day of capacity', 'networkip' ),
			),
			array(
				'value' => '1B+',
				'label' => __( 'end-user accounts supported', 'networkip' ),
			),
			array(
				'value' => '100,000+',
				'label' => __( 'telephony ports', 'networkip' ),
			),
			array(
				'value' => '100+',
				'label' => __( 'international carrier connections', 'networkip' ),
			),
		),
		'tech_footnote'    => __( 'Capacity and reliability figures as published on the NetworkIP Technology page.', 'networkip' ),
	);

	/**
	 * Filter the homepage repeating content.
	 *
	 * @param array $content Homepage content arrays.
	 */
	return apply_filters( 'networkip_home_content', $content );
}

/**
 * Fallback links used when no menu is assigned to a location.
 * These mirror the public networkip.net site structure.
 *
 * @param string $location Menu location.
 * @return array<int,array{label:string,url:string}>
 */
function networkip_fallback_links( $location ) {
	$links = array(
		'primary'           => array(
			array( 'label' => __( 'Home', 'networkip' ), 'url' => '/' ),
			array( 'label' => __( 'About Us', 'networkip' ), 'url' => '/about-us/' ),
			array( 'label' => __( 'Services', 'networkip' ), 'url' => '/service/' ),
			array( 'label' => __( 'International Calling', 'networkip' ), 'url' => '/international-calling/' ),
			array( 'label' => __( 'Customer Intelligence', 'networkip' ), 'url' => '/customer-intelligence/' ),
			array( 'label' => __( 'Technology', 'networkip' ), 'url' => '/technology/' ),
			array( 'label' => __( 'Contact Us', 'networkip' ), 'url' => '/contact-us/' ),
		),
		'footer-company'    => array(
			array( 'label' => __( 'About Us', 'networkip' ), 'url' => '/about-us/' ),
			array( 'label' => __( 'Management', 'networkip' ), 'url' => '/management/' ),
			array( 'label' => __( 'Contact Us', 'networkip' ), 'url' => '/contact-us/' ),
		),
		'footer-service'    => array(
			array( 'label' => __( 'International Calling', 'networkip' ), 'url' => '/international-calling/' ),
			array( 'label' => __( 'Customer Intelligence', 'networkip' ), 'url' => '/customer-intelligence/' ),
		),
		'footer-technology' => array(
			array( 'label' => __( 'Integration', 'networkip' ), 'url' => '/integration/' ),
			array( 'label' => __( 'Call Quality', 'networkip' ), 'url' => '/call-quality/' ),
		),
	);

	return isset( $links[ $location ] ) ? $links[ $location ] : array();
}
