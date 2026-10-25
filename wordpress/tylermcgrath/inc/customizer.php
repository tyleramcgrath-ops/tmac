<?php
/**
 * Customizer: every word on the home page is editable under
 * Appearance → Customize → Tyler McGrath Studio.
 *
 * @package tylermcgrath
 */

defined( 'ABSPATH' ) || exit;

/**
 * Default copy, taken from the original Studio site.
 *
 * @return array
 */
function tm_defaults() {
	return array(
		// Entrance.
		'entrance_on'       => 1,
		'entrance_title'    => 'McGrath Private Studio',
		'entrance_text'     => 'Welcome to the studio.',
		'entrance_button'   => 'Enter the studio',
		'entrance_footer'   => 'The next great idea starts here',
		// Header.
		'brand_sub'         => 'The Studio',
		'location_label'    => 'Independent creative',
		'location_sub'      => 'Web design · Marketing · SEO',
		'connect_label'     => 'Connect',
		'connect_url'       => 'https://mcgrathmarketinggroup.com',
		// Hero.
		'eyebrow'           => 'SEO & digital growth leader',
		'headline'          => "Visibility.\nStrategy.\nDigital growth.",
		'intro'             => 'I’m Tyler McGrath. 14+ years turning digital presence into opportunities for growth.',
		'cta_primary'       => 'Meet Tyler',
		'cta_secondary'     => 'What I do',
		'awaken_label'      => 'Awaken the compass',
		'awaken_sub'        => 'Open a world of work',
		'inscription'       => 'Creative direction',
		'footer_note'       => 'The room is yours',
		'room_image'        => '',
		// About.
		'about_eyebrow'     => 'Meet Tyler',
		'about_title'       => 'Fourteen years of getting brands found, chosen and grown.',
		'about_text'        => "I’m an independent creative working where web design, marketing and search meet.\n\nFor more than 14 years I’ve helped businesses turn their digital presence into real opportunities: websites that load fast and rank, campaigns with a point of view, and search strategies built for Google and for the AI answer engines people now ask first.\n\nEvery engagement starts the same way: find the signal, set the course, then build the thing that gets you there.",
		'portrait'          => '',
		'stat1_value'       => '14+',
		'stat1_label'       => 'Years in digital growth',
		'stat2_value'       => '{projects}',
		'stat2_label'       => 'Projects in the portfolio',
		'stat3_value'       => '3',
		'stat3_label'       => 'Disciplines, one strategy',
		// Services.
		'services_eyebrow'  => 'What I do',
		'services_title'    => 'Three disciplines. One heading.',
		'seo_title'         => 'SEO & AI Search',
		'seo_lead'          => 'Be the answer on Google and inside AI.',
		'seo_text'          => 'Search has split in two: the ten blue links and the AI answer above them. I build visibility for both, from technical foundations to content that AI Overviews, ChatGPT and Perplexity cite by name.',
		'seo_points'        => "Technical SEO & site architecture\nAI Overview & answer-engine visibility\nLocal SEO & Google Business Profile\nContent strategy that earns citations",
		'marketing_title'   => 'Marketing',
		'marketing_lead'    => 'Campaigns with a point of view.',
		'marketing_text'    => 'Strategy before tactics. Positioning, messaging and campaigns that give people a reason to choose you, measured honestly against the numbers that matter to the business.',
		'marketing_points'  => "Brand positioning & messaging\nPaid search & social campaigns\nEmail & lifecycle marketing\nAnalytics, attribution & reporting",
		'web_title'         => 'Web Design',
		'web_lead'          => 'Sites that look the part and do the work.',
		'web_text'          => 'Fast, considered websites built to convert and to rank, in WordPress or modern frameworks, with structured data and Core Web Vitals handled from day one.',
		'web_points'        => "Custom WordPress & Next.js builds\nConversion-focused UX & copy\nSpeed & Core Web Vitals\nSchema & structured data",
		// Portfolio.
		'work_eyebrow'      => 'The portfolio',
		'work_title'        => 'A world of work.',
		'work_text'         => 'Every project is a star on the map. Hover one to light it up; filter by discipline to trace a constellation.',
		// Process.
		'process_eyebrow'   => 'How we work',
		'process_title'     => 'Four bearings.',
		'process_n'         => "Find the signal|Audit the site, the market and the search results to see where attention really goes.",
		'process_e'         => "Set the course|A plan with priorities and numbers attached, not a forty-page deck.",
		'process_s'         => "Build the instrument|Design, content, campaigns and code, made to the same standard.",
		'process_w'         => "Ship and verify|Launch, measure, and keep tuning until the needle moves.",
		// Contact.
		'contact_eyebrow'   => 'Connect',
		'contact_title'     => 'Set the next course.',
		'contact_text'      => 'Have a project, a question or a big idea? Send a note here, or connect through McGrath Marketing Group.',
		'contact_email'     => get_option( 'admin_email' ),
		'social_linkedin'   => '',
		'social_github'     => '',
		'social_x'          => '',
		'social_instagram'  => '',
	);
}

/**
 * Register the panel, sections and controls.
 *
 * @param WP_Customize_Manager $wp_customize Customizer.
 */
function tm_customize_register( $wp_customize ) {
	$wp_customize->add_panel(
		'tm_panel',
		array(
			'title'    => __( 'Tyler McGrath Studio', 'tylermcgrath' ),
			'priority' => 20,
		)
	);

	$t = 'text';
	$a = 'textarea';
	$u = 'url';

	$sections = array(
		'entrance' => array(
			__( 'Entrance doors', 'tylermcgrath' ),
			array(
				'entrance_on'     => array( 'checkbox', __( 'Show the entrance doors on the first visit', 'tylermcgrath' ) ),
				'entrance_title'  => array( $t, __( 'Nameplate title', 'tylermcgrath' ) ),
				'entrance_text'   => array( $t, __( 'Nameplate line', 'tylermcgrath' ) ),
				'entrance_button' => array( $t, __( 'Button', 'tylermcgrath' ) ),
				'entrance_footer' => array( $t, __( 'Footer line', 'tylermcgrath' ) ),
			),
		),
		'room'     => array(
			__( 'Studio room (hero)', 'tylermcgrath' ),
			array(
				'brand_sub'      => array( $t, __( 'Under the name', 'tylermcgrath' ) ),
				'location_label' => array( $t, __( 'Top-left label', 'tylermcgrath' ) ),
				'location_sub'   => array( $t, __( 'Top-left sub-label', 'tylermcgrath' ) ),
				'connect_label'  => array( $t, __( 'Connect button label', 'tylermcgrath' ) ),
				'connect_url'    => array( $u, __( 'Connect button URL (blank = contact section)', 'tylermcgrath' ) ),
				'eyebrow'        => array( $t, __( 'Eyebrow', 'tylermcgrath' ) ),
				'headline'       => array( $a, __( 'Headline (one line per row; the last row is set in italics)', 'tylermcgrath' ) ),
				'intro'          => array( $a, __( 'Intro', 'tylermcgrath' ) ),
				'cta_primary'    => array( $t, __( 'First button', 'tylermcgrath' ) ),
				'cta_secondary'  => array( $t, __( 'Second button', 'tylermcgrath' ) ),
				'awaken_label'   => array( $t, __( 'Compass button', 'tylermcgrath' ) ),
				'awaken_sub'     => array( $t, __( 'Compass button sub-line', 'tylermcgrath' ) ),
				'inscription'    => array( $t, __( 'Desk inscription', 'tylermcgrath' ) ),
				'footer_note'    => array( $t, __( 'Room footer note', 'tylermcgrath' ) ),
				'room_image'     => array( 'image', __( 'Room image (blank = the black marble studio)', 'tylermcgrath' ) ),
			),
		),
		'about'    => array(
			__( 'About', 'tylermcgrath' ),
			array(
				'about_eyebrow' => array( $t, __( 'Eyebrow', 'tylermcgrath' ) ),
				'about_title'   => array( $t, __( 'Title', 'tylermcgrath' ) ),
				'about_text'    => array( $a, __( 'Text (blank line between paragraphs)', 'tylermcgrath' ) ),
				'portrait'      => array( 'image', __( 'Portrait', 'tylermcgrath' ) ),
				'stat1_value'   => array( $t, __( 'Stat 1 value', 'tylermcgrath' ) ),
				'stat1_label'   => array( $t, __( 'Stat 1 label', 'tylermcgrath' ) ),
				'stat2_value'   => array( $t, __( 'Stat 2 value ({projects} = live project count)', 'tylermcgrath' ) ),
				'stat2_label'   => array( $t, __( 'Stat 2 label', 'tylermcgrath' ) ),
				'stat3_value'   => array( $t, __( 'Stat 3 value', 'tylermcgrath' ) ),
				'stat3_label'   => array( $t, __( 'Stat 3 label', 'tylermcgrath' ) ),
			),
		),
		'services' => array(
			__( 'What I do', 'tylermcgrath' ),
			array(
				'services_eyebrow' => array( $t, __( 'Eyebrow', 'tylermcgrath' ) ),
				'services_title'   => array( $t, __( 'Title', 'tylermcgrath' ) ),
				'seo_title'        => array( $t, __( 'SEO: title', 'tylermcgrath' ) ),
				'seo_lead'         => array( $t, __( 'SEO: lead', 'tylermcgrath' ) ),
				'seo_text'         => array( $a, __( 'SEO: text', 'tylermcgrath' ) ),
				'seo_points'       => array( $a, __( 'SEO: points (one per line)', 'tylermcgrath' ) ),
				'marketing_title'  => array( $t, __( 'Marketing: title', 'tylermcgrath' ) ),
				'marketing_lead'   => array( $t, __( 'Marketing: lead', 'tylermcgrath' ) ),
				'marketing_text'   => array( $a, __( 'Marketing: text', 'tylermcgrath' ) ),
				'marketing_points' => array( $a, __( 'Marketing: points (one per line)', 'tylermcgrath' ) ),
				'web_title'        => array( $t, __( 'Web design: title', 'tylermcgrath' ) ),
				'web_lead'         => array( $t, __( 'Web design: lead', 'tylermcgrath' ) ),
				'web_text'         => array( $a, __( 'Web design: text', 'tylermcgrath' ) ),
				'web_points'       => array( $a, __( 'Web design: points (one per line)', 'tylermcgrath' ) ),
			),
		),
		'work'     => array(
			__( 'Portfolio', 'tylermcgrath' ),
			array(
				'work_eyebrow' => array( $t, __( 'Eyebrow', 'tylermcgrath' ) ),
				'work_title'   => array( $t, __( 'Title', 'tylermcgrath' ) ),
				'work_text'    => array( $a, __( 'Text', 'tylermcgrath' ) ),
			),
		),
		'process'  => array(
			__( 'Process', 'tylermcgrath' ),
			array(
				'process_eyebrow' => array( $t, __( 'Eyebrow', 'tylermcgrath' ) ),
				'process_title'   => array( $t, __( 'Title', 'tylermcgrath' ) ),
				'process_n'       => array( $a, __( 'North step (Title|Text)', 'tylermcgrath' ) ),
				'process_e'       => array( $a, __( 'East step (Title|Text)', 'tylermcgrath' ) ),
				'process_s'       => array( $a, __( 'South step (Title|Text)', 'tylermcgrath' ) ),
				'process_w'       => array( $a, __( 'West step (Title|Text)', 'tylermcgrath' ) ),
			),
		),
		'contact'  => array(
			__( 'Contact & social', 'tylermcgrath' ),
			array(
				'contact_eyebrow'  => array( $t, __( 'Eyebrow', 'tylermcgrath' ) ),
				'contact_title'    => array( $t, __( 'Title', 'tylermcgrath' ) ),
				'contact_text'     => array( $a, __( 'Text', 'tylermcgrath' ) ),
				'contact_email'    => array( 'email', __( 'Send form messages to', 'tylermcgrath' ) ),
				'social_linkedin'  => array( $u, 'LinkedIn URL' ),
				'social_github'    => array( $u, 'GitHub URL' ),
				'social_x'         => array( $u, 'X URL' ),
				'social_instagram' => array( $u, 'Instagram URL' ),
			),
		),
	);

	$defaults = tm_defaults();
	$priority = 10;
	foreach ( $sections as $id => $section ) {
		$wp_customize->add_section(
			'tm_' . $id,
			array(
				'title'    => $section[0],
				'panel'    => 'tm_panel',
				'priority' => $priority++,
			)
		);
		foreach ( $section[1] as $key => $control ) {
			list( $type, $label ) = $control;
			$sanitize             = array(
				'text'     => 'sanitize_text_field',
				'textarea' => 'sanitize_textarea_field',
				'url'      => 'esc_url_raw',
				'email'    => 'sanitize_email',
				'checkbox' => 'absint',
				'image'    => 'esc_url_raw',
			);
			$wp_customize->add_setting(
				'tm_' . $key,
				array(
					'default'           => $defaults[ $key ],
					'sanitize_callback' => $sanitize[ $type ],
				)
			);
			if ( 'image' === $type ) {
				$wp_customize->add_control(
					new WP_Customize_Image_Control(
						$wp_customize,
						'tm_' . $key,
						array(
							'label'   => $label,
							'section' => 'tm_' . $id,
						)
					)
				);
			} else {
				$wp_customize->add_control(
					'tm_' . $key,
					array(
						'type'    => $type,
						'label'   => $label,
						'section' => 'tm_' . $id,
					)
				);
			}
		}
	}
}
add_action( 'customize_register', 'tm_customize_register' );
