<?php
/**
 * Customizer: Appearance → Customize → NetworkIP Homepage.
 *
 * @package NetworkIP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Sanitize a checkbox value to '1' or ''.
 *
 * @param mixed $value Raw value.
 * @return string
 */
function networkip_sanitize_checkbox( $value ) {
	return ( ! empty( $value ) && '0' !== $value ) ? '1' : '';
}

/**
 * Sanitize a URL or site-relative path.
 *
 * @param string $value Raw value.
 * @return string
 */
function networkip_sanitize_link( $value ) {
	$value = trim( (string) $value );
	if ( '' !== $value && ( '/' === $value[0] || '#' === $value[0] ) ) {
		return sanitize_text_field( $value );
	}
	return esc_url_raw( $value );
}

/**
 * Register Customizer settings.
 *
 * @param WP_Customize_Manager $wp_customize Customizer manager.
 */
function networkip_customize_register( $wp_customize ) {
	$wp_customize->add_panel(
		'networkip_home',
		array(
			'title'       => __( 'NetworkIP Homepage', 'networkip' ),
			'description' => __( 'Short homepage text and contact details. The gold band features, impact numbers, service and technology cards are in inc/content.php (or the networkip_home_content filter).', 'networkip' ),
			'priority'    => 30,
		)
	);

	$sections = array(
		'networkip_hero'    => __( 'Header & hero', 'networkip' ),
		'networkip_band'    => __( 'Gold band', 'networkip' ),
		'networkip_bridge'  => __( 'Photo section', 'networkip' ),
		'networkip_about'   => __( 'Carriers', 'networkip' ),
		'networkip_contact' => __( 'Contact & form', 'networkip' ),
		'networkip_layout'  => __( 'Layout & compatibility', 'networkip' ),
	);
	foreach ( $sections as $id => $title ) {
		$wp_customize->add_section( $id, array( 'title' => $title, 'panel' => 'networkip_home' ) );
	}

	// key => [section, label, control type, sanitize callback].
	$fields = array(
		'header_cta_label'     => array( 'networkip_hero', __( 'Header button label', 'networkip' ), 'text', 'sanitize_text_field' ),
		'hero_eyebrow'         => array( 'networkip_hero', __( 'Eyebrow', 'networkip' ), 'text', 'sanitize_text_field' ),
		'hero_title'           => array( 'networkip_hero', __( 'Headline', 'networkip' ), 'text', 'sanitize_text_field' ),
		'hero_title_highlight' => array( 'networkip_hero', __( 'Gold words in the headline (must match part of the headline)', 'networkip' ), 'text', 'sanitize_text_field' ),
		'hero_text'            => array( 'networkip_hero', __( 'Intro text', 'networkip' ), 'textarea', 'sanitize_textarea_field' ),
		'hero_primary_label'   => array( 'networkip_hero', __( 'Button label', 'networkip' ), 'text', 'sanitize_text_field' ),
		'hero_primary_url'     => array( 'networkip_hero', __( 'Button link', 'networkip' ), 'text', 'networkip_sanitize_link' ),
		'hero_secondary_label' => array( 'networkip_hero', __( 'Second button label (optional)', 'networkip' ), 'text', 'sanitize_text_field' ),
		'hero_secondary_url'   => array( 'networkip_hero', __( 'Second button link', 'networkip' ), 'text', 'networkip_sanitize_link' ),
		'hero_side_words'      => array( 'networkip_hero', __( 'Side words (comma-separated, blank to hide)', 'networkip' ), 'text', 'sanitize_text_field' ),

		'band_eyebrow'         => array( 'networkip_band', __( 'Eyebrow', 'networkip' ), 'text', 'sanitize_text_field' ),
		'band_title'           => array( 'networkip_band', __( 'Headline', 'networkip' ), 'text', 'sanitize_text_field' ),
		'band_title_highlight' => array( 'networkip_band', __( 'Red words in the headline (must match part of the headline)', 'networkip' ), 'text', 'sanitize_text_field' ),
		'band_text'            => array( 'networkip_band', __( 'Intro text', 'networkip' ), 'textarea', 'sanitize_textarea_field' ),
		'band_side_words'      => array( 'networkip_band', __( 'Side words (comma-separated, blank to hide)', 'networkip' ), 'text', 'sanitize_text_field' ),

		'bridge_eyebrow'         => array( 'networkip_bridge', __( 'Eyebrow', 'networkip' ), 'text', 'sanitize_text_field' ),
		'bridge_title'           => array( 'networkip_bridge', __( 'Headline', 'networkip' ), 'text', 'sanitize_text_field' ),
		'bridge_title_highlight' => array( 'networkip_bridge', __( 'Gold words in the headline (must match part of the headline)', 'networkip' ), 'text', 'sanitize_text_field' ),
		'bridge_text'            => array( 'networkip_bridge', __( 'Text', 'networkip' ), 'textarea', 'sanitize_textarea_field' ),
		'bridge_button_label'    => array( 'networkip_bridge', __( 'Button label', 'networkip' ), 'text', 'sanitize_text_field' ),
		'bridge_button_url'      => array( 'networkip_bridge', __( 'Button link', 'networkip' ), 'text', 'networkip_sanitize_link' ),
		'bridge_side_words'      => array( 'networkip_bridge', __( 'Words over the photo (comma-separated, blank to hide)', 'networkip' ), 'text', 'sanitize_text_field' ),

		'about_carriers'       => array( 'networkip_about', __( 'Carrier names (comma-separated)', 'networkip' ), 'text', 'sanitize_text_field' ),

		'contact_title'        => array( 'networkip_contact', __( 'Headline', 'networkip' ), 'text', 'sanitize_text_field' ),
		'contact_text'         => array( 'networkip_contact', __( 'Intro text', 'networkip' ), 'textarea', 'sanitize_textarea_field' ),
		'contact_address'      => array( 'networkip_contact', __( 'Address (one line per row)', 'networkip' ), 'textarea', 'sanitize_textarea_field' ),
		'contact_phone'        => array( 'networkip_contact', __( 'Phone', 'networkip' ), 'text', 'sanitize_text_field' ),
		'contact_email'        => array( 'networkip_contact', __( 'Public email', 'networkip' ), 'email', 'sanitize_email' ),
		'contact_form_enabled' => array( 'networkip_contact', __( 'Show the contact form', 'networkip' ), 'checkbox', 'networkip_sanitize_checkbox' ),
		'contact_recipient'    => array( 'networkip_contact', __( 'Send form messages to (blank = site admin email)', 'networkip' ), 'email', 'sanitize_email' ),

		'designed_pages'       => array( 'networkip_layout', __( 'Use the built-in designs for About Us, Management, Service, International Calling, Customer Intelligence, Technology, Integration, Call Quality and Contact Us (ignores those pages’ old editor content)', 'networkip' ), 'checkbox', 'networkip_sanitize_checkbox' ),
		'home_show_content'    => array( 'networkip_layout', __( 'Show the front page’s own editor content on the homepage (off by default: on migrated sites it holds the old design)', 'networkip' ), 'checkbox', 'networkip_sanitize_checkbox' ),
		'neutralize_builders'  => array( 'networkip_layout', __( 'Stop Elementor’s global kit colors and fonts from overriding the theme', 'networkip' ), 'checkbox', 'networkip_sanitize_checkbox' ),
	);

	// Photo in the "Bridging People" section.
	$wp_customize->add_setting(
		'networkip_bridge_image',
		array(
			'default'           => '',
			'sanitize_callback' => 'esc_url_raw',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Image_Control(
			$wp_customize,
			'networkip_bridge_image',
			array(
				'label'       => __( 'Photo', 'networkip' ),
				'description' => __( 'A landscape photo, at least 1600 px wide. Leave empty to use the bundled photo of a woman on a call.', 'networkip' ),
				'section'     => 'networkip_bridge',
			)
		)
	);

	// Logo for the dark footer. Goes in Site Identity, under the regular logo.
	$wp_customize->add_setting(
		'networkip_logo_light',
		array(
			'default'           => '',
			'sanitize_callback' => 'esc_url_raw',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Image_Control(
			$wp_customize,
			'networkip_logo_light',
			array(
				'label'       => __( 'Logo for dark backgrounds (footer)', 'networkip' ),
				'description' => __( 'Use a version with white lettering. Leave empty to use the white NetworkIP logo bundled with the theme. The header uses the regular Logo above, or the bundled color logo.', 'networkip' ),
				'section'     => 'title_tagline',
				'priority'    => 9,
			)
		)
	);

	$defaults = networkip_defaults();
	foreach ( $fields as $key => $field ) {
		$setting = 'networkip_' . $key;
		$wp_customize->add_setting(
			$setting,
			array(
				'default'           => isset( $defaults[ $key ] ) ? $defaults[ $key ] : '',
				'sanitize_callback' => $field[3],
				'transport'         => 'refresh',
			)
		);
		$wp_customize->add_control(
			$setting,
			array(
				'section' => $field[0],
				'label'   => $field[1],
				'type'    => $field[2],
			)
		);
	}
}
add_action( 'customize_register', 'networkip_customize_register' );
