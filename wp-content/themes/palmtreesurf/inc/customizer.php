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
		'pt_hero_eyebrow'         => __( 'Tamarindo · Guanacaste · Costa Rica', 'palmtreesurf' ),
		'pt_hero_heading'         => __( 'Book Experiences.', 'palmtreesurf' ),
		'pt_hero_heading_accent'  => __( 'Live Pura Vida.', 'palmtreesurf' ),
		'pt_hero_text'            => __( 'Surf lessons, fishing charters, boat tours and wildlife adventures in Tamarindo — led by local certified guides.', 'palmtreesurf' ),
		'pt_hero_cta_text'        => __( 'Book Your Session', 'palmtreesurf' ),
		'pt_hero_cta_url'         => '',
		'pt_hero_video_url'       => '',
		'pt_years'                => '{{PT_YEARS}}',
		'pt_cert_body'            => '{{PT_CERT_BODY}}',
		'pt_rating'               => '{{PT_RATING}}',
		'pt_review_count'         => '{{PT_REVIEW_COUNT}}',
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
				'pt_hero_eyebrow'  => array( __( 'Eyebrow text', 'palmtreesurf' ), 'text' ),
				'pt_hero_heading'  => array( __( 'Heading', 'palmtreesurf' ), 'text' ),
				'pt_hero_text'     => array( __( 'Supporting text', 'palmtreesurf' ), 'textarea' ),
				'pt_hero_cta_text' => array( __( 'Button label', 'palmtreesurf' ), 'text' ),
				'pt_hero_cta_url'        => array( __( 'Button link', 'palmtreesurf' ), 'url' ),
				'pt_hero_heading_accent' => array( __( 'Heading accent line', 'palmtreesurf' ), 'text', __( 'Rendered in the brand gradient beneath the heading.', 'palmtreesurf' ) ),
				'pt_hero_video_url'      => array( __( 'Hero video URL', 'palmtreesurf' ), 'url', __( 'Optional MP4. Desktop only; mobile gets the image.', 'palmtreesurf' ) ),
				'pt_years'               => array( __( 'Years operating', 'palmtreesurf' ), 'text' ),
				'pt_cert_body'           => array( __( 'Certification body', 'palmtreesurf' ), 'text' ),
				'pt_rating'              => array( __( 'Average rating', 'palmtreesurf' ), 'text', __( 'Only shown with a review count. Leave as the placeholder until you have real numbers.', 'palmtreesurf' ) ),
				'pt_review_count'        => array( __( 'Review count', 'palmtreesurf' ), 'text' ),
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
