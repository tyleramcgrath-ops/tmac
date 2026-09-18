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
function pts_defaults() {
	return array(
		'pts_phone'           => '',
		'pts_whatsapp'        => '',
		'pts_email'           => '',
		'pts_address'         => __( 'Tamarindo, Guanacaste, Costa Rica', 'palmtreesurf' ),
		'pts_hours'           => '',
		'pts_map_url'         => '',
		'pts_instagram'       => '',
		'pts_facebook'        => '',
		'pts_tripadvisor'     => '',
		'pts_youtube'         => '',
		'pts_booking_url'     => '',
		'pts_header_cta_text' => __( 'Book Now', 'palmtreesurf' ),
		'pts_hero_eyebrow'    => '',
		'pts_hero_heading'    => '',
		'pts_hero_text'       => '',
		'pts_hero_cta_text'   => __( 'Book Your Adventure', 'palmtreesurf' ),
		'pts_hero_cta_url'    => '',
		'pts_footer_text'     => '',
		'pts_ga_id'           => '',
		'pts_pixel_id'        => '',
		'pts_head_scripts'    => '',
		'pts_footer_scripts'  => '',
	);
}

/**
 * Read a theme mod, falling back to the registered default.
 *
 * @param string $key Theme mod name.
 * @return string
 */
function pts_mod( $key ) {
	$defaults = pts_defaults();
	$default  = isset( $defaults[ $key ] ) ? $defaults[ $key ] : '';

	return (string) get_theme_mod( $key, $default );
}

/**
 * Only administrators who may post raw HTML can edit the script fields.
 *
 * @return bool
 */
function pts_can_edit_scripts() {
	return current_user_can( 'unfiltered_html' );
}

/**
 * Register Customizer panels, sections, settings and controls.
 *
 * @param WP_Customize_Manager $wp_customize Customizer instance.
 */
function pts_customize_register( $wp_customize ) {
	$wp_customize->get_setting( 'blogname' )->transport        = 'postMessage';
	$wp_customize->get_setting( 'blogdescription' )->transport = 'postMessage';

	$wp_customize->add_panel(
		'pts_panel',
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
		'pts_contact'  => array(
			'title'    => __( 'Contact Details', 'palmtreesurf' ),
			'controls' => array(
				'pts_phone'    => array( __( 'Phone number', 'palmtreesurf' ), 'text' ),
				'pts_whatsapp' => array( __( 'WhatsApp number', 'palmtreesurf' ), 'text', __( 'Digits and country code only, e.g. 50688887777.', 'palmtreesurf' ) ),
				'pts_email'    => array( __( 'Email address', 'palmtreesurf' ), 'email' ),
				'pts_address'  => array( __( 'Address', 'palmtreesurf' ), 'textarea' ),
				'pts_hours'    => array( __( 'Opening hours', 'palmtreesurf' ), 'textarea' ),
				'pts_map_url'  => array( __( 'Map link', 'palmtreesurf' ), 'url' ),
			),
		),
		'pts_social'   => array(
			'title'    => __( 'Social Links', 'palmtreesurf' ),
			'controls' => array(
				'pts_instagram'   => array( __( 'Instagram URL', 'palmtreesurf' ), 'url' ),
				'pts_facebook'    => array( __( 'Facebook URL', 'palmtreesurf' ), 'url' ),
				'pts_tripadvisor' => array( __( 'Tripadvisor URL', 'palmtreesurf' ), 'url' ),
				'pts_youtube'     => array( __( 'YouTube URL', 'palmtreesurf' ), 'url' ),
			),
		),
		'pts_booking'  => array(
			'title'    => __( 'Booking', 'palmtreesurf' ),
			'controls' => array(
				'pts_booking_url'     => array( __( 'Booking system URL', 'palmtreesurf' ), 'url', __( 'Where the Book Now buttons point. Leave empty to use the enquiry form.', 'palmtreesurf' ) ),
				'pts_header_cta_text' => array( __( 'Header button label', 'palmtreesurf' ), 'text' ),
			),
		),
		'pts_hero'     => array(
			'title'    => __( 'Front Page Hero', 'palmtreesurf' ),
			'controls' => array(
				'pts_hero_eyebrow'  => array( __( 'Eyebrow text', 'palmtreesurf' ), 'text' ),
				'pts_hero_heading'  => array( __( 'Heading', 'palmtreesurf' ), 'text' ),
				'pts_hero_text'     => array( __( 'Supporting text', 'palmtreesurf' ), 'textarea' ),
				'pts_hero_cta_text' => array( __( 'Button label', 'palmtreesurf' ), 'text' ),
				'pts_hero_cta_url'  => array( __( 'Button link', 'palmtreesurf' ), 'url' ),
			),
		),
		'pts_footer'   => array(
			'title'    => __( 'Footer', 'palmtreesurf' ),
			'controls' => array(
				'pts_footer_text' => array( __( 'Footer text', 'palmtreesurf' ), 'textarea' ),
			),
		),
		'pts_tracking' => array(
			'title'       => __( 'Analytics & Tracking', 'palmtreesurf' ),
			'description' => __( 'Enter IDs rather than script tags where possible. The theme builds the tags for you.', 'palmtreesurf' ),
			'controls'    => array(
				'pts_ga_id'    => array( __( 'Google Analytics measurement ID', 'palmtreesurf' ), 'text', __( 'Example: G-XXXXXXXXXX', 'palmtreesurf' ) ),
				'pts_pixel_id' => array( __( 'Meta Pixel ID', 'palmtreesurf' ), 'text', __( 'Digits only.', 'palmtreesurf' ) ),
			),
		),
	);

	foreach ( $sections as $section_id => $section ) {
		$wp_customize->add_section(
			$section_id,
			array(
				'title'       => $section['title'],
				'panel'       => 'pts_panel',
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

			$defaults = pts_defaults();

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
		'pts_hero_image',
		array(
			'default'           => '',
			'sanitize_callback' => 'absint',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Media_Control(
			$wp_customize,
			'pts_hero_image',
			array(
				'label'     => __( 'Hero image', 'palmtreesurf' ),
				'section'   => 'pts_hero',
				'mime_type' => 'image',
			)
		)
	);

	/*
	 * Raw script fields are the one place a Customizer value reaches the page
	 * unescaped, so they are only registered for users who may post raw HTML.
	 */
	if ( pts_can_edit_scripts() ) {
		$wp_customize->add_section(
			'pts_scripts',
			array(
				'title'       => __( 'Custom Scripts', 'palmtreesurf' ),
				'panel'       => 'pts_panel',
				'description' => __( 'Pasted markup is printed as-is. Only add code you trust.', 'palmtreesurf' ),
			)
		);

		$script_fields = array(
			'pts_head_scripts'   => __( 'Header scripts (before </head>)', 'palmtreesurf' ),
			'pts_footer_scripts' => __( 'Footer scripts (before </body>)', 'palmtreesurf' ),
		);

		foreach ( $script_fields as $key => $label ) {
			$wp_customize->add_setting(
				$key,
				array(
					'default'           => '',
					'sanitize_callback' => 'pts_sanitize_scripts',
				)
			);

			$wp_customize->add_control(
				$key,
				array(
					'label'   => $label,
					'section' => 'pts_scripts',
					'type'    => 'textarea',
				)
			);
		}
	}
}
add_action( 'customize_register', 'pts_customize_register' );

/**
 * Keep raw script markup, but only from users allowed to save it.
 *
 * Anyone else has their input discarded rather than silently stored.
 *
 * @param string $value Submitted markup.
 * @return string
 */
function pts_sanitize_scripts( $value ) {
	if ( ! pts_can_edit_scripts() ) {
		return '';
	}

	return trim( (string) $value );
}
