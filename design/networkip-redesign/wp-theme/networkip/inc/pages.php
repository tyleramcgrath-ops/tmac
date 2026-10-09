<?php
/**
 * Built-in designed layouts for the core interior pages.
 *
 * When a page with one of these slugs is viewed (and the Customizer option
 * "Use the built-in designs…" is on), page.php renders the layout below
 * instead of the page's own editor content. That keeps old page-builder
 * layouts from showing inside the new design.
 *
 * All copy is taken from the public networkip.net pages. Edit it here, or use
 * the `networkip_page_layouts` filter from a child theme or plugin.
 *
 * Section types: split, cards, list, stats, people, chips, contact.
 *
 * @package NetworkIP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * All designed page layouts, keyed by page slug.
 *
 * @return array<string,array>
 */
function networkip_page_layouts() {
	$home  = networkip_home_content();
	$video = 'https://www.youtube.com/watch?v=YMyUlymjGdM';

	$layouts = array(
		'about-us'              => array(
			'title'    => __( 'About Us', 'networkip' ),
			'text'     => __( 'NetworkIP continuously innovates to provide smart technology, tools and exceptional service to make our clients’ services more reliable, their brands more marketable and their business more profitable.', 'networkip' ),
			'sections' => array(
				array(
					'type'       => 'split',
					'eyebrow'    => __( 'About NetworkIP', 'networkip' ),
					'title'      => __( 'An international voice Service Provider with over 25 years of experience.', 'networkip' ),
					'paragraphs' => array(
						__( 'NetworkIP is an international voice “Service Provider” with over 25 years of experience, specializing in high-quality international calling services. We enable MNOs and Mobile Virtual Network Operators (MVNOs) to outsource international calling offerings with minimal risk and significant regulatory savings.', 'networkip' ),
						__( 'NetworkIP supports direct dialing through its exclusive connections with the major US MNOs, including AT&T, Verizon, T-Mobile and Boost Mobile. We transform International Calling into an acquisition and retention tool by eliminating consumer barriers.', 'networkip' ),
					),
					'button'     => array( 'label' => __( 'Watch: see how it works', 'networkip' ), 'url' => $video ),
					'panel'      => array(
						'icon'  => 'service-platform',
						'title' => __( 'NetworkIP facts', 'networkip' ),
						'items' => array(
							__( 'Privately-held Texas technology company founded in 1998', 'networkip' ),
							__( '25+ employees', 'networkip' ),
							__( '$80M investment in R&D', 'networkip' ),
							__( 'Exclusive direct connections supporting MVNOs on AT&T, T-Mobile, Verizon and Boost Mobile', 'networkip' ),
							__( 'Systems built on a proven, infinitely scalable N+x load-sharing server topology on all critical systems', 'networkip' ),
							__( 'Expertise with Federal and State regulatory requirements', 'networkip' ),
						),
					),
				),
				array(
					'type'  => 'stats',
					'alt'   => true,
					'items' => array(
						array( 'value' => '1998', 'label' => __( 'founded in Texas', 'networkip' ) ),
						array( 'value' => '25+', 'label' => __( 'years of experience', 'networkip' ) ),
						array( 'value' => '$80M', 'label' => __( 'invested in R&D', 'networkip' ) ),
						array( 'value' => '4', 'label' => __( 'major US MNOs with direct connections', 'networkip' ) ),
					),
				),
				array(
					'type'    => 'cards',
					'eyebrow' => __( 'Explore', 'networkip' ),
					'title'   => __( 'Get to know NetworkIP.', 'networkip' ),
					'cards'   => array(
						array( 'icon' => 'carriers-users', 'title' => __( 'Management', 'networkip' ), 'text' => __( 'Meet the NetworkIP management team.', 'networkip' ), 'url' => '/management/' ),
						array( 'icon' => 'international-calling', 'title' => __( 'International Calling', 'networkip' ), 'text' => __( 'Bundled and add-on international calling for MNOs and MVNOs.', 'networkip' ), 'url' => '/international-calling/' ),
						array( 'icon' => 'service-platform', 'title' => __( 'Technology', 'networkip' ), 'text' => __( 'The Hosted Services Platform behind our services.', 'networkip' ), 'url' => '/technology/' ),
					),
				),
			),
		),

		'management'            => array(
			'title'    => __( 'Management', 'networkip' ),
			'text'     => __( 'Meet the NetworkIP management team! We have the experience and talent you and your clients deserve.', 'networkip' ),
			'sections' => array(
				array(
					'type'   => 'people',
					'people' => array(
						array(
							'name' => 'Peter R. Pattullo',
							'role' => __( 'Chief Executive Officer', 'networkip' ),
							'bio'  => array(
								__( 'Pete Pattullo is a co-founder and has been the Chief Executive Officer for NetworkIP for the past 25+ years, where he and his team have provided and adapted international calling solutions for multiple markets, including the MNO/MVNO industry. He brings over forty-five years of experience in telecommunications technology, customer service, product management, marketing, maintenance, operations and support.', 'networkip' ),
								__( 'He has been the Chairman of the Industry Association, American Prepaid Phonecall Association (APPPA). He previously served as Chief Technology Officer for Network Operator Services, Inc., and its subsidiaries, and spent almost fourteen years at Nortel in a full range of positions.', 'networkip' ),
							),
						),
						array(
							'name' => 'Mike Truemner',
							'role' => __( 'Vice President, Engineering / Operations', 'networkip' ),
							'bio'  => array(
								__( 'Joining NetworkIP in 2002, Mr. Truemner has more than forty-five years within the telecommunications industry, providing him a broad range of experience in all areas including local, long distance, mobile and international operations and engineering. He is responsible for all operations and engineering of the NetworkIP network.', 'networkip' ),
								__( 'Mike previously served as Executive Director – Voice Network Services for Williams Communications. Prior to his employment with Williams, he worked for Sprint PCS, Sprint and GTE. Mr. Truemner is a graduate of Ohio Institute of Technology in Columbus, Ohio.', 'networkip' ),
							),
						),
						array(
							'name' => 'Brian Kirk',
							'role' => __( 'Vice President, Business Development', 'networkip' ),
							'bio'  => array(
								__( 'As Vice President of Business Development, Brian is responsible for establishing strategic new business initiatives and partnerships. Brian brings over two decades of experience in client relations, BPO, software development and project management in the enterprise software and telecommunications industries.', 'networkip' ),
								__( 'Prior to NetworkIP, Brian was with Simplified Development for 4 years. While serving in the United States Marine Corps, Brian earned his degree in Management from Hawaii Pacific University.', 'networkip' ),
							),
						),
						array(
							'name' => 'Kristin Jones',
							'role' => __( 'Director, Client Services', 'networkip' ),
							'bio'  => array(
								__( 'With 19 years of experience at NetworkIP, Kristin has dedicated her career to delivering exceptional client service in the telecommunications industry. Her team leads all client implementations, manages our product offerings, and collaborates with clients to provide critical subscriber data and analytics to optimize their international calling strategies.', 'networkip' ),
								__( 'Kristin earned her degree in Business Administration from The University of Texas at Tyler.', 'networkip' ),
							),
						),
					),
				),
			),
		),

		'service'               => array(
			'title'    => __( 'Service', 'networkip' ),
			'text'     => __( 'NetworkIP offers a range of calling solutions on our Hosted Services Platform. Offering international long distance (ILD) for your customers is an easy way to increase revenue and improve loyalty.', 'networkip' ),
			'sections' => array(
				array(
					'type'       => 'split',
					'eyebrow'    => __( 'Since 1998', 'networkip' ),
					'title'      => __( 'Cloud-based turnkey products and services with a difference.', 'networkip' ),
					'paragraphs' => array(
						__( 'With NetworkIP you get the best combination of pricing, call quality, and innovative technologies. But you also get customer service before, during and after the sale, business management and reporting tools and marketing intelligence that tracks the way in which your customers are using the products.', 'networkip' ),
						__( 'Our Hosted Services Platform is smartly processing over 6 million calls per day and can empower you to successfully and profitably run an entire business, from facilities, to billing, to back-office, with no capital or back-office investment.', 'networkip' ),
					),
					'panel'      => array(
						'icon'  => 'carriers-users',
						'title' => __( 'Experience you can use', 'networkip' ),
						'items' => array(
							__( 'Sales training and incentive programs for your sales associates', 'networkip' ),
							__( 'Referral and loyalty incentive programs', 'networkip' ),
							__( 'Multicultural marketing', 'networkip' ),
							__( 'Spanish language-capable call center support, if desired', 'networkip' ),
						),
					),
				),
				array(
					'type'    => 'cards',
					'alt'     => true,
					'eyebrow' => __( 'Solutions', 'networkip' ),
					'title'   => __( 'Calling solutions on one platform.', 'networkip' ),
					'text'    => __( 'The best combination of usage-based pricing, call quality, and innovative technologies that help maximize usage.', 'networkip' ),
					'cards'   => array(
						array( 'icon' => 'international-calling', 'title' => __( 'International Calling', 'networkip' ), 'text' => __( 'Bundled and add-on international calling (voice) offerings for MNOs and MVNOs.', 'networkip' ), 'url' => '/international-calling/' ),
						array( 'icon' => 'globe-coverage', 'title' => __( 'Carrier Services', 'networkip' ), 'text' => __( 'Usage-based pricing and call quality with connections to over 100 international carriers.', 'networkip' ) ),
						array( 'icon' => 'phone-calls', 'title' => __( 'Voice Conferencing', 'networkip' ), 'text' => __( 'Voice conferencing delivered on the same Hosted Services Platform.', 'networkip' ) ),
					),
				),
			),
		),

		'international-calling' => array(
			'title'    => __( 'International Calling', 'networkip' ),
			'text'     => __( 'NetworkIP enables MNOs and Mobile Virtual Network Operators (MVNOs) to outsource international calling offerings with minimal risk and significant regulatory savings.', 'networkip' ),
			'sections' => array(
				array(
					'type'       => 'split',
					'eyebrow'    => __( 'Global calling', 'networkip' ),
					'title'      => __( 'Call anyone, anywhere with no worries.', 'networkip' ),
					'paragraphs' => array(
						__( 'Utilizing its highly evolved platform, NetworkIP delivers a range of bundled and add-on international calling (voice) offerings, eliminating the traditional barrier and consumer confusion in the marketplace today.', 'networkip' ),
						__( 'With a long-standing reputation in the telecom industry, NetworkIP continues to innovate, disrupt and support the global voice communications needs of its clients and subscribers.', 'networkip' ),
					),
					'button'     => array( 'label' => __( 'Watch the video', 'networkip' ), 'url' => $video ),
					'panel'      => array(
						'icon'  => 'globe-coverage',
						'title' => __( 'Bundled / Add-on Worldwide Calling', 'networkip' ),
						'items' => array(
							__( 'Market disrupter: provides the least path of resistance for consumers to call anywhere in the world', 'networkip' ),
							__( 'Eliminates or minimizes the need to use calling apps to call family and friends', 'networkip' ),
							__( 'Increases the addressable market to 80M+ in the USA (25% of US consumers)', 'networkip' ),
							__( 'NetworkIP’s automated Fraud and Abuse measures are proven, flipping the current model of focusing on heavy users to enabling casual consumers', 'networkip' ),
						),
					),
				),
				array(
					'type'     => 'stats',
					'alt'      => true,
					'items'    => $home['network_stats'],
					'footnote' => $home['network_footnote'],
				),
				array(
					'type'    => 'cards',
					'eyebrow' => __( 'International Calling solutions from Stateside', 'networkip' ),
					'title'   => __( 'What NetworkIP’s “Global Calling” offering gives consumers.', 'networkip' ),
					'cards'   => array(
						array( 'icon' => 'calendar-experience', 'title' => __( 'Affordability', 'networkip' ), 'text' => __( 'Included at no additional cost.', 'networkip' ) ),
						array( 'icon' => 'phone-calls', 'title' => __( 'Convenience', 'networkip' ), 'text' => __( 'Calling from and to any phone.', 'networkip' ) ),
						array( 'icon' => 'globe-coverage', 'title' => __( 'Global connectivity', 'networkip' ), 'text' => __( 'Connecting people worldwide.', 'networkip' ) ),
						array( 'icon' => 'international-calling', 'title' => __( 'Easy as calling stateside', 'networkip' ), 'text' => __( 'No apps, no extra steps for the subscriber.', 'networkip' ) ),
						array( 'icon' => 'customer-intelligence', 'title' => __( 'Easy to understand', 'networkip' ), 'text' => __( 'A clear, simple offering for the mass market.', 'networkip' ) ),
						array( 'icon' => 'call-quality-shield', 'title' => __( 'Fraud and abuse controls', 'networkip' ), 'text' => __( 'Automated, proven measures built into the platform.', 'networkip' ) ),
					),
				),
			),
		),

		'customer-intelligence' => array(
			'title'    => __( 'Customer Intelligence', 'networkip' ),
			'text'     => __( 'Understanding a customer’s relationship with international calling services is imperative when strategically planning distribution, marketing and future product offerings.', 'networkip' ),
			'sections' => array(
				array(
					'type'       => 'split',
					'eyebrow'    => __( 'Rich data mining', 'networkip' ),
					'title'      => __( 'The most relevant, effective data to run your business.', 'networkip' ),
					'paragraphs' => array(
						__( 'Nobody makes it easier, faster, more flexible and efficient to process reports than NetworkIP. You can customize reports and gain a unique competitive advantage with the most relevant, effective data to run your business.', 'networkip' ),
						__( 'Additionally, Odessi utilizes an advanced vertical database technology which provides industry leading, flexible data mining capabilities.', 'networkip' ),
					),
					'panel'      => array(
						'icon'  => 'customer-intelligence',
						'title' => __( 'Odessi 3 back-office tools', 'networkip' ),
						'items' => array(
							__( 'Advanced inventory, billing and reporting functionality', 'networkip' ),
							__( 'Consumer behavior analytics', 'networkip' ),
							__( 'Customizable reports', 'networkip' ),
							__( 'A customizable web-based environment', 'networkip' ),
						),
					),
				),
			),
		),

		'technology'            => array(
			'title'    => __( 'Technology', 'networkip' ),
			'text'     => __( 'NetworkIP delivers best-in-class performance with a well-rounded platform enabling customers to combine any of services from NetworkIP.', 'networkip' ),
			'sections' => array(
				array(
					'type'  => 'cards',
					'title' => __( 'There is no need for infrastructure, switches or additional technical staff.', 'networkip' ),
					'text'  => __( 'We take care of all these business components so you can focus on your relationship with your customers.', 'networkip' ),
					'cards' => array_merge(
						$home['tech_cards'],
						array(
							array( 'title' => __( '8th Generation Software (ICS8)', 'networkip' ), 'text' => __( 'Continuously evolving, customizable and proven prepaid services platform.', 'networkip' ) ),
							array( 'title' => __( 'Capacity', 'networkip' ), 'text' => __( 'NetworkIP has the power to support your business with capacity for over 6 million calls a day, over a billion end-user accounts and over 100,000 telephony ports.', 'networkip' ) ),
							array( 'title' => __( 'Direct Integration', 'networkip' ), 'text' => __( 'Straightforward APIs from NetworkIP let customers integrate seamlessly.', 'networkip' ), 'url' => '/integration/' ),
						)
					),
					'numbered' => true,
				),
				array(
					'type'     => 'stats',
					'alt'      => true,
					'items'    => $home['tech_stats'],
					'footnote' => $home['tech_footnote'],
				),
			),
		),

		'integration'           => array(
			'title'    => __( 'Integration', 'networkip' ),
			'text'     => __( 'Whether you are looking for a turnkey solution or prefer to integrate with your existing infrastructure, NetworkIP can get you up and running quickly.', 'networkip' ),
			'sections' => array(
				array(
					'type'    => 'chips',
					'eyebrow' => __( 'MVNA and MVNE', 'networkip' ),
					'title'   => __( 'API integration partners.', 'networkip' ),
					'text'    => __( 'NetworkIP integrates with these MVNA and MVNE platforms.', 'networkip' ),
					'items'   => array( 'AireSpring', 'Pavocom', 'Plintron', 'Reach Mobile', 'PWG', 'MVNOC', 'LotusFlare', 'Telispire', 'Helix Wireless', 'Amdocs ConnectX', 'Telgoo5', 'Telness Tech', 'BeQuick', 'Gigs' ),
				),
				array(
					'type'    => 'cards',
					'alt'     => true,
					'cards'   => array(
						array( 'icon' => 'integration-flexibility', 'title' => __( 'Turnkey or integrated', 'networkip' ), 'text' => __( 'Launch on NetworkIP’s turnkey platform or connect it to your existing infrastructure.', 'networkip' ) ),
						array( 'icon' => 'service-platform', 'title' => __( 'API access', 'networkip' ), 'text' => __( 'An open interface for creating and customizing internet-based products.', 'networkip' ), 'url' => '/technology/' ),
						array( 'icon' => 'carriers-users', 'title' => __( 'Client implementations', 'networkip' ), 'text' => __( 'Our Client Services team leads every client implementation.', 'networkip' ), 'url' => '/management/' ),
					),
				),
			),
		),

		'call-quality'          => array(
			'title'    => __( 'Call Quality', 'networkip' ),
			'text'     => __( 'iQTechnology® (iQT) is an industry-first method of managing call quality from an end-user’s perspective.', 'networkip' ),
			'sections' => array(
				array(
					'type'       => 'split',
					'eyebrow'    => __( 'iQTechnology® (iQT)', 'networkip' ),
					'title'      => __( 'Higher percentages of successful calls, fewer trouble tickets.', 'networkip' ),
					'paragraphs' => array(
						__( 'iQT continually monitors, in real-time, consumer behavior to call quality they experience, and instantaneously adjusts call routing to optimize performance. The results are higher percentages of successful calls, optimal call quality, fewer trouble tickets and a predictable end-user experience.', 'networkip' ),
						__( 'iQT uses advanced analytics to monitor and analyze end-user call attempts, patterns and other behavior in real-time and automatically removes carrier routes that do not meet the minimum quality standards. iQT is agnostic to the underlying technologies and focuses on the end-to-end consumer experience regardless of how the call is connected.', 'networkip' ),
					),
					'panel'      => array(
						'icon'  => 'call-quality-shield',
						'title' => __( 'What iQT detects, down to a specific geographical area', 'networkip' ),
						'items' => array(
							__( 'Fast-busy signals', 'networkip' ),
							__( 'Dead air', 'networkip' ),
							__( 'Poor audio quality', 'networkip' ),
							__( 'Cut-offs', 'networkip' ),
						),
						'note'  => __( 'Protected by US patent #6,914,967.', 'networkip' ),
					),
				),
				array(
					'type'    => 'list',
					'alt'     => true,
					'eyebrow' => __( 'Why it matters', 'networkip' ),
					'title'   => __( 'Traditional measures react too late.', 'networkip' ),
					'text'    => __( 'Traditional telecom voice quality measurement involves tracking customer complaints and limited, antiquated call trending methods like ASR (answer seizure ratio) and ACD (average call duration), all of which require very large volumes of calls and human resources to pinpoint negative call quality problems. It can literally take thousands of calls to know that a specific carrier is delivering poor call quality. By then, the damage to the consumer perception has already been done.', 'networkip' ),
				),
			),
		),

		'contact-us'            => array(
			'title'    => __( 'Contact Us', 'networkip' ),
			'text'     => __( 'Get in touch with us with any questions or concerns at any time.', 'networkip' ),
			'sections' => array(
				array(
					'type'  => 'contact',
					'extra' => array(
						array(
							'label' => __( 'Sales', 'networkip' ),
							'text'  => __( 'Brian Kirk, Vice President, Business Development', 'networkip' ),
							'email' => 'bkirk@networkip.net',
						),
					),
				),
			),
		),
	);

	/**
	 * Filter the designed page layouts.
	 *
	 * @param array $layouts Layouts keyed by page slug.
	 */
	return apply_filters( 'networkip_page_layouts', $layouts );
}

/**
 * The designed layout for the current page, or null.
 *
 * @return array|null
 */
function networkip_current_page_layout() {
	if ( '1' !== networkip_mod( 'designed_pages' ) || ! is_page() ) {
		return null;
	}
	$post = get_queried_object();
	if ( ! $post instanceof WP_Post ) {
		return null;
	}
	$layouts = networkip_page_layouts();
	return isset( $layouts[ $post->post_name ] ) ? $layouts[ $post->post_name ] : null;
}
