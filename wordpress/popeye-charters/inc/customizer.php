<?php
/**
 * Customizer settings: contact details, hero, footer, analytics.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

add_action( 'customize_register', 'popeye_customize_register' );
/**
 * Register Customizer panels.
 *
 * @param WP_Customize_Manager $wp_customize Manager.
 */
function popeye_customize_register( $wp_customize ) {
	$d = popeye_defaults();

	$wp_customize->add_panel(
		'popeye',
		array(
			'title'    => __( 'Popeye Charters', 'popeye-charters' ),
			'priority' => 30,
		)
	);

	$sections = array(
		'popeye_contact' => array(
			'title'  => __( 'Contact Details', 'popeye-charters' ),
			'fields' => array(
				'phone'         => array( __( 'Phone (display)', 'popeye-charters' ), 'text' ),
				'phone_raw'     => array( __( 'Phone (dial, e.g. +19035396840)', 'popeye-charters' ), 'text' ),
				'email'         => array( __( 'Public email', 'popeye-charters' ), 'email' ),
				'inquiry_email' => array( __( 'Send form inquiries to (defaults to public email)', 'popeye-charters' ), 'email' ),
				'location'      => array( __( 'Location line', 'popeye-charters' ), 'text' ),
			),
		),
		'popeye_hero'    => array(
			'title'  => __( 'Homepage Hero', 'popeye-charters' ),
			'fields' => array(
				'hero_eyebrow'  => array( __( 'Eyebrow', 'popeye-charters' ), 'text' ),
				'hero_title'    => array( __( 'Title', 'popeye-charters' ), 'text' ),
				'hero_title_em' => array( __( 'Title (gold italic line)', 'popeye-charters' ), 'text' ),
				'hero_text'     => array( __( 'Intro text', 'popeye-charters' ), 'textarea' ),
				'hero_note'     => array( __( 'Small italic note', 'popeye-charters' ), 'text' ),
			),
		),
		'popeye_footer'  => array(
			'title'  => __( 'Footer & Booking Bar', 'popeye-charters' ),
			'fields' => array(
				'footer_about' => array( __( 'Footer about text', 'popeye-charters' ), 'textarea' ),
				'footer_quote' => array( __( 'Footer quote badge', 'popeye-charters' ), 'text' ),
				'sticky_bar'   => array( __( 'Show sticky "Book a Charter" bar', 'popeye-charters' ), 'checkbox' ),
				'sticky_text'  => array( __( 'Sticky bar text', 'popeye-charters' ), 'text' ),
			),
		),
		'popeye_tracking' => array(
			'title'  => __( 'Analytics', 'popeye-charters' ),
			'fields' => array(
				'ga_id' => array( __( 'Google Analytics 4 Measurement ID (G-XXXXXXX). Leave empty if a plugin handles analytics.', 'popeye-charters' ), 'text' ),
			),
		),
	);

	foreach ( $sections as $section_id => $section ) {
		$wp_customize->add_section(
			$section_id,
			array(
				'title' => $section['title'],
				'panel' => 'popeye',
			)
		);
		foreach ( $section['fields'] as $key => $field ) {
			list( $label, $type ) = $field;
			$sanitize = array(
				'email'    => 'sanitize_email',
				'textarea' => 'sanitize_textarea_field',
				'checkbox' => 'absint',
			);
			$wp_customize->add_setting(
				'popeye_' . $key,
				array(
					'default'           => $d[ $key ],
					'sanitize_callback' => isset( $sanitize[ $type ] ) ? $sanitize[ $type ] : 'sanitize_text_field',
				)
			);
			$wp_customize->add_control(
				'popeye_' . $key,
				array(
					'label'   => $label,
					'section' => $section_id,
					'type'    => $type,
				)
			);
		}
	}

	$wp_customize->add_setting(
		'popeye_hero_image',
		array(
			'default'           => '',
			'sanitize_callback' => 'esc_url_raw',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Image_Control(
			$wp_customize,
			'popeye_hero_image',
			array(
				'label'   => __( 'Hero background image', 'popeye-charters' ),
				'section' => 'popeye_hero',
			)
		)
	);
}
