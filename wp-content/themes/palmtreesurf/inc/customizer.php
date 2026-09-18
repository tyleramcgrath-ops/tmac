<?php
/**
 * Customizer: contact details, social links, hero defaults, tracking.
 *
 * These replace the "site settings" record the current site reads at runtime,
 * so the same values stay editable without touching code.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Default values for every theme mod the templates read.
 *
 * @return array<string, string>
 */
function pt_defaults() {
	return array(
		'pt_phone'                => '{{PT_PHONE}}',
		'pt_whatsapp'             => '{{PT_WHATSAPP}}',
		'pt_email'                => '{{PT_EMAIL}}',
		'pt_address'              => "Tamarindo, Guanacaste\nCosta Rica",
		'pt_hours'                => '{{PT_HOURS}}',
		'pt_map_url'              => '',
		'pt_map_embed'            => '',
		'pt_instagram'            => '{{PT_IG}}',
		'pt_facebook'             => '{{PT_FB}}',
		'pt_tripadvisor'          => '{{PT_TRIPADVISOR}}',
		'pt_youtube'              => '',
		'pt_booking_url'          => '',
		'pt_header_cta_text'      => __( 'Book Now', 'palmtreesurf' ),

		// Hero.
		'pt_hero_script'          => __( 'Tamarindo', 'palmtreesurf' ),
		'pt_hero_heading'         => __( 'Live Different.', 'palmtreesurf' ),
		'pt_hero_tagline'         => __( 'Surf. Eat. Explore. Discover.', 'palmtreesurf' ),
		'pt_hero_text'            => __( 'Book local experiences, find your wave and get out on the water. Your Tamarindo adventure starts here.', 'palmtreesurf' ),
		'pt_hero_corner'          => __( 'Pura Vida Every Day', 'palmtreesurf' ),

		/*
		 * Trust row. Each of these is a claim about how the business operates,
		 * so they are editable and start modest. Do not state a price guarantee
		 * or bilingual support here unless it is actually true.
		 */
		'pt_trust_1'              => __( 'Book online in minutes', 'palmtreesurf' ),
		'pt_trust_2'              => __( 'Local guides', 'palmtreesurf' ),
		'pt_trust_3'              => __( 'Small groups', 'palmtreesurf' ),
		'pt_trust_4'              => '',

		// Story banner. Stats are empty on purpose - see TODO-CONTENT.md.
		'pt_story_script'         => __( 'Good Times', 'palmtreesurf' ),
		'pt_story_heading'        => __( 'Are Closer Than You Think.', 'palmtreesurf' ),
		'pt_story_video'          => '',
		'pt_stat_1_value'         => '',
		'pt_stat_1_label'         => '',
		'pt_stat_2_value'         => '',
		'pt_stat_2_label'         => '',
		'pt_stat_3_value'         => '',
		'pt_stat_3_label'         => '',

		// Lifestyle close.
		'pt_lifestyle_heading'    => __( 'More Than a Destination. A Way of Life.', 'palmtreesurf' ),
		'pt_lifestyle_text'       => __( 'Palm Tree Surf connects you with the real Tamarindo — the people, the water and the pura vida pace of it.', 'palmtreesurf' ),
		'pt_lifestyle_script'     => __( 'Pura Vida Always', 'palmtreesurf' ),
		'pt_lifestyle_cta_text'   => __( 'Explore Tamarindo', 'palmtreesurf' ),
		'pt_lifestyle_cta_url'    => '',

		'pt_best_season'          => __( 'December to April', 'palmtreesurf' ),
		'pt_wave_size'            => '{{PT_WAVE_SIZE}}',
		'pt_water_temp'           => __( '26-29°C year round', 'palmtreesurf' ),
		'pt_footer_text'          => '',
		'pt_ga_id'                => '',
		'pt_pixel_id'             => '',
		'pt_head_scripts'         => '',
		'pt_footer_scripts'       => '',
	);
}

/**
 * Read a theme mod, falling back to the registered default.
 *
 * @param string $key Theme mod name.
 * @return string
 */
function pt_mod( $key ) {
	$defaults = pt_defaults();
	$default  = isset( $defaults[ $key ] ) ? $defaults[ $key ] : '';

	return (string) get_theme_mod( $key, $default );
}

/**
 * Only administrators who may post raw HTML can edit the script fields.
 *
 * @return bool
 */
function pt_can_edit_scripts() {
	return current_user_can( 'unfiltered_html' );
}

/**
 * Register Customizer panels, sections, settings and controls.
 *
 * @param WP_Customize_Manager $wp_customize Customizer instance.
 */
function pt_customize_register( $wp_customize ) {
	$wp_customize->get_setting( 'blogname' )->transport        = 'postMessage';
	$wp_customize->get_setting( 'blogdescription' )->transport = 'postMessage';

	$wp_customize->add_panel(
		'pt_panel',
		array(
			'title'    => __( 'Palm Tree Surf', 'palmtreesurf' ),
			'priority' => 30,
		)
	);

	/*
	 * Text and URL settings, declared as data so each one does not need its own
	 * dozen lines of add_setting/add_control boilerplate.
	 */
	$sections = array(
		'pt_contact'  => array(
			'title'    => __( 'Contact Details', 'palmtreesurf' ),
			'controls' => array(
				'pt_phone'    => array( __( 'Phone number', 'palmtreesurf' ), 'text' ),
				'pt_whatsapp' => array( __( 'WhatsApp number', 'palmtreesurf' ), 'text', __( 'Digits and country code only, e.g. 50688887777.', 'palmtreesurf' ) ),
				'pt_email'    => array( __( 'Email address', 'palmtreesurf' ), 'email' ),
				'pt_address'  => array( __( 'Address', 'palmtreesurf' ), 'textarea' ),
				'pt_hours'    => array( __( 'Opening hours', 'palmtreesurf' ), 'textarea' ),
				'pt_map_url'   => array( __( 'Map link', 'palmtreesurf' ), 'url' ),
				'pt_map_embed' => array( __( 'Map embed URL', 'palmtreesurf' ), 'url', __( 'Google Maps embed URL. Only loaded after a visitor clicks, to keep it off the initial page load.', 'palmtreesurf' ) ),
			),
		),
		'pt_social'   => array(
			'title'    => __( 'Social Links', 'palmtreesurf' ),
			'controls' => array(
				'pt_instagram'   => array( __( 'Instagram URL', 'palmtreesurf' ), 'url' ),
				'pt_facebook'    => array( __( 'Facebook URL', 'palmtreesurf' ), 'url' ),
				'pt_tripadvisor' => array( __( 'Tripadvisor URL', 'palmtreesurf' ), 'url' ),
				'pt_youtube'     => array( __( 'YouTube URL', 'palmtreesurf' ), 'url' ),
			),
		),
		'pt_booking'  => array(
			'title'    => __( 'Booking', 'palmtreesurf' ),
			'controls' => array(
				'pt_booking_url'     => array( __( 'Booking system URL', 'palmtreesurf' ), 'url', __( 'Where the Book Now buttons point. Leave empty to use the enquiry form.', 'palmtreesurf' ) ),
				'pt_header_cta_text' => array( __( 'Header button label', 'palmtreesurf' ), 'text' ),
			),
		),
		'pt_hero'     => array(
			'title'    => __( 'Front Page Hero', 'palmtreesurf' ),
			'controls' => array(
				'pt_hero_script'  => array( __( 'Script accent', 'palmtreesurf' ), 'text', __( 'Short handwritten line above the headline.', 'palmtreesurf' ) ),
				'pt_hero_heading' => array( __( 'Headline', 'palmtreesurf' ), 'text' ),
				'pt_hero_tagline' => array( __( 'Tagline', 'palmtreesurf' ), 'text' ),
				'pt_hero_text'    => array( __( 'Supporting copy', 'palmtreesurf' ), 'textarea' ),
				'pt_hero_corner'  => array( __( 'Corner script accent', 'palmtreesurf' ), 'text' ),
			),
		),
		'pt_trust'    => array(
			'title'       => __( 'Trust Row', 'palmtreesurf' ),
			'description' => __( 'Four short claims under the hero. Only state something here if it is actually true of how you operate — a price guarantee or bilingual support in particular. Leave a field empty to hide it.', 'palmtreesurf' ),
			'controls'    => array(
				'pt_trust_1' => array( __( 'Item one', 'palmtreesurf' ), 'text' ),
				'pt_trust_2' => array( __( 'Item two', 'palmtreesurf' ), 'text' ),
				'pt_trust_3' => array( __( 'Item three', 'palmtreesurf' ), 'text' ),
				'pt_trust_4' => array( __( 'Item four', 'palmtreesurf' ), 'text' ),
			),
		),
		'pt_story'    => array(
			'title'       => __( 'Story Banner', 'palmtreesurf' ),
			'description' => __( 'Stats are empty until you supply real numbers. Do not publish counts you cannot back up.', 'palmtreesurf' ),
			'controls'    => array(
				'pt_story_script'  => array( __( 'Script accent', 'palmtreesurf' ), 'text' ),
				'pt_story_heading' => array( __( 'Heading', 'palmtreesurf' ), 'text' ),
				'pt_story_video'   => array( __( 'Story video URL', 'palmtreesurf' ), 'url', __( 'Leave empty and the button becomes a normal link instead.', 'palmtreesurf' ) ),
				'pt_stat_1_value'  => array( __( 'Stat 1 value', 'palmtreesurf' ), 'text' ),
				'pt_stat_1_label'  => array( __( 'Stat 1 label', 'palmtreesurf' ), 'text' ),
				'pt_stat_2_value'  => array( __( 'Stat 2 value', 'palmtreesurf' ), 'text' ),
				'pt_stat_2_label'  => array( __( 'Stat 2 label', 'palmtreesurf' ), 'text' ),
				'pt_stat_3_value'  => array( __( 'Stat 3 value', 'palmtreesurf' ), 'text' ),
				'pt_stat_3_label'  => array( __( 'Stat 3 label', 'palmtreesurf' ), 'text' ),
			),
		),
		'pt_lifestyle' => array(
			'title'    => __( 'Lifestyle Close', 'palmtreesurf' ),
			'controls' => array(
				'pt_lifestyle_heading'  => array( __( 'Heading', 'palmtreesurf' ), 'text' ),
				'pt_lifestyle_text'     => array( __( 'Copy', 'palmtreesurf' ), 'textarea' ),
				'pt_lifestyle_script'   => array( __( 'Script accent', 'palmtreesurf' ), 'text' ),
				'pt_lifestyle_cta_text' => array( __( 'Button label', 'palmtreesurf' ), 'text' ),
				'pt_lifestyle_cta_url'  => array( __( 'Button link', 'palmtreesurf' ), 'url' ),
			),
		),
		'pt_footer'   => array(
			'title'    => __( 'Footer', 'palmtreesurf' ),
			'controls' => array(
				'pt_footer_text' => array( __( 'Footer text', 'palmtreesurf' ), 'textarea' ),
			),
		),
		'pt_conditions' => array(
			'title'    => __( 'Surf Conditions', 'palmtreesurf' ),
			'controls' => array(
				'pt_best_season' => array( __( 'Best season', 'palmtreesurf' ), 'text' ),
				'pt_wave_size'   => array( __( 'Wave size range', 'palmtreesurf' ), 'text' ),
				'pt_water_temp'  => array( __( 'Water temperature', 'palmtreesurf' ), 'text' ),
			),
		),
		'pt_tracking' => array(
			'title'       => __( 'Analytics & Tracking', 'palmtreesurf' ),
			'description' => __( 'Enter IDs rather than script tags where possible. The theme builds the tags for you.', 'palmtreesurf' ),
			'controls'    => array(
				'pt_ga_id'    => array( __( 'Google Analytics measurement ID', 'palmtreesurf' ), 'text', __( 'Example: G-XXXXXXXXXX', 'palmtreesurf' ) ),
				'pt_pixel_id' => array( __( 'Meta Pixel ID', 'palmtreesurf' ), 'text', __( 'Digits only.', 'palmtreesurf' ) ),
			),
		),
	);

	foreach ( $sections as $section_id => $section ) {
		$wp_customize->add_section(
			$section_id,
			array(
				'title'       => $section['title'],
				'panel'       => 'pt_panel',
				'description' => isset( $section['description'] ) ? $section['description'] : '',
			)
		);

		foreach ( $section['controls'] as $key => $control ) {
			list( $label, $type ) = $control;
			$description          = isset( $control[2] ) ? $control[2] : '';

			switch ( $type ) {
				case 'url':
					$sanitize = 'esc_url_raw';
					break;
				case 'email':
					$sanitize = 'sanitize_email';
					break;
				case 'textarea':
					$sanitize = 'sanitize_textarea_field';
					break;
				default:
					$sanitize = 'sanitize_text_field';
			}

			$defaults = pt_defaults();

			$wp_customize->add_setting(
				$key,
				array(
					'default'           => isset( $defaults[ $key ] ) ? $defaults[ $key ] : '',
					'sanitize_callback' => $sanitize,
					'transport'         => 'refresh',
				)
			);

			$wp_customize->add_control(
				$key,
				array(
					'label'       => $label,
					'section'     => $section_id,
					'type'        => 'textarea' === $type ? 'textarea' : ( 'url' === $type ? 'url' : ( 'email' === $type ? 'email' : 'text' ) ),
					'description' => $description,
				)
			);
		}
	}

	$wp_customize->add_setting(
		'pt_hero_image',
		array(
			'default'           => '',
			'sanitize_callback' => 'absint',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Media_Control(
			$wp_customize,
			'pt_hero_image',
			array(
				'label'     => __( 'Hero image', 'palmtreesurf' ),
				'section'   => 'pt_hero',
				'mime_type' => 'image',
			)
		)
	);

	/*
	 * Raw script fields are the one place a Customizer value reaches the page
	 * unescaped, so they are only registered for users who may post raw HTML.
	 */
	if ( pt_can_edit_scripts() ) {
		$wp_customize->add_section(
			'pt_scripts',
			array(
				'title'       => __( 'Custom Scripts', 'palmtreesurf' ),
				'panel'       => 'pt_panel',
				'description' => __( 'Pasted markup is printed as-is. Only add code you trust.', 'palmtreesurf' ),
			)
		);

		$script_fields = array(
			'pt_head_scripts'   => __( 'Header scripts (before </head>)', 'palmtreesurf' ),
			'pt_footer_scripts' => __( 'Footer scripts (before </body>)', 'palmtreesurf' ),
		);

		foreach ( $script_fields as $key => $label ) {
			$wp_customize->add_setting(
				$key,
				array(
					'default'           => '',
					'sanitize_callback' => 'pt_sanitize_scripts',
				)
			);

			$wp_customize->add_control(
				$key,
				array(
					'label'   => $label,
					'section' => 'pt_scripts',
					'type'    => 'textarea',
				)
			);
		}
	}
}
add_action( 'customize_register', 'pt_customize_register' );

/**
 * Keep raw script markup, but only from users allowed to save it.
 *
 * Anyone else has their input discarded rather than silently stored.
 *
 * @param string $value Submitted markup.
 * @return string
 */
function pt_sanitize_scripts( $value ) {
	if ( ! pt_can_edit_scripts() ) {
		return '';
	}

	return trim( (string) $value );
}
