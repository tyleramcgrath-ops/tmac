<?php
/**
 * Customizer settings: contact details, hero copy and booking rules.
 *
 * @package Wayra
 */

defined( 'ABSPATH' ) || exit;

/**
 * Default values for every theme option.
 *
 * @return array
 */
function wayra_defaults() {
	return array(
		'announcement'   => __( 'Instituto Cervantes accredited center · New groups start every Monday', 'wayra' ),
		'phone'          => '+506 2653 0359',
		'tollfree'       => '1 (800) 670-9864',
		'whatsapp'       => '50688434344',
		'email'          => 'info@wayra.cr',
		'address'        => 'East Road, 50309 Playa Tamarindo, Guanacaste, Costa Rica',
		'hours'          => __( 'Mon–Fri 7:00 am – 5:30 pm', 'wayra' ),
		'hero_eyebrow'   => __( 'Spanish school · Playa Tamarindo, Costa Rica', 'wayra' ),
		'hero_title'     => __( 'Learn Spanish where the jungle meets the sea.', 'wayra' ),
		'hero_text'      => __( 'Small classes of 3–4 students, native teachers and a tropical campus 150 meters from Tamarindo Beach. Pick a program, choose your Monday, and book in minutes.', 'wayra' ),
		'hero_image'     => '',
		'hero_image_2'   => '',
		'youtube_id'     => 'FD4_0zEkcQo',
		'closed_ranges'  => "2026-03-30 2026-04-03\n2026-08-16 2026-09-13\n2026-12-20 2026-12-27",
		'max_weeks'      => 40,
		'facebook'       => 'https://www.facebook.com/wayra.tamarindo/',
		'instagram'      => 'https://www.instagram.com/wayraspanishschool/',
		'youtube'        => 'https://www.youtube.com/@wayraschool',
	);
}

/**
 * Read a theme option with its default.
 *
 * @param string $key Option key.
 * @return mixed
 */
function wayra_opt( $key ) {
	$defaults = wayra_defaults();
	return get_theme_mod( 'wayra_' . $key, isset( $defaults[ $key ] ) ? $defaults[ $key ] : '' );
}

/**
 * Register Customizer panels.
 *
 * @param WP_Customize_Manager $wp_customize Customizer.
 */
function wayra_customize_register( $wp_customize ) {
	$defaults = wayra_defaults();

	$wp_customize->add_panel(
		'wayra',
		array(
			'title'    => __( 'Wayra theme', 'wayra' ),
			'priority' => 30,
		)
	);

	$sections = array(
		'wayra_contact' => array(
			'title'  => __( 'Contact details', 'wayra' ),
			'fields' => array(
				'announcement' => array( __( 'Announcement bar', 'wayra' ), 'text' ),
				'phone'        => array( __( 'Phone', 'wayra' ), 'text' ),
				'tollfree'     => array( __( 'USA/Canada toll-free', 'wayra' ), 'text' ),
				'whatsapp'     => array( __( 'WhatsApp number (digits only)', 'wayra' ), 'text' ),
				'email'        => array( __( 'Email', 'wayra' ), 'email' ),
				'address'      => array( __( 'Address', 'wayra' ), 'textarea' ),
				'hours'        => array( __( 'Office hours', 'wayra' ), 'text' ),
				'facebook'     => array( __( 'Facebook URL', 'wayra' ), 'url' ),
				'instagram'    => array( __( 'Instagram URL', 'wayra' ), 'url' ),
				'youtube'      => array( __( 'YouTube URL', 'wayra' ), 'url' ),
			),
		),
		'wayra_hero'    => array(
			'title'  => __( 'Home page', 'wayra' ),
			'fields' => array(
				'hero_eyebrow' => array( __( 'Hero eyebrow', 'wayra' ), 'text' ),
				'hero_title'   => array( __( 'Hero headline', 'wayra' ), 'textarea' ),
				'hero_text'    => array( __( 'Hero text', 'wayra' ), 'textarea' ),
				'hero_image'   => array( __( 'Hero photo (large)', 'wayra' ), 'image' ),
				'hero_image_2' => array( __( 'Hero photo (small)', 'wayra' ), 'image' ),
				'youtube_id'   => array( __( 'YouTube video ID', 'wayra' ), 'text' ),
			),
		),
		'wayra_booking' => array(
			'title'       => __( 'Booking rules', 'wayra' ),
			'description' => __( 'Weeks when the school is closed. One range per line: start date, a space, end date (YYYY-MM-DD). Students cannot pick a start date inside these ranges.', 'wayra' ),
			'fields'      => array(
				'closed_ranges' => array( __( 'Closed weeks', 'wayra' ), 'textarea' ),
				'max_weeks'     => array( __( 'Maximum weeks per booking', 'wayra' ), 'number' ),
			),
		),
	);

	foreach ( $sections as $section_id => $section ) {
		$wp_customize->add_section(
			$section_id,
			array(
				'title'       => $section['title'],
				'panel'       => 'wayra',
				'description' => isset( $section['description'] ) ? $section['description'] : '',
			)
		);
		foreach ( $section['fields'] as $key => $field ) {
			list( $label, $type ) = $field;
			$sanitize             = 'sanitize_text_field';
			if ( 'url' === $type ) {
				$sanitize = 'esc_url_raw';
			} elseif ( 'email' === $type ) {
				$sanitize = 'sanitize_email';
			} elseif ( 'textarea' === $type ) {
				$sanitize = 'sanitize_textarea_field';
			} elseif ( 'number' === $type ) {
				$sanitize = 'absint';
			} elseif ( 'image' === $type ) {
				$sanitize = 'esc_url_raw';
			}

			$wp_customize->add_setting(
				'wayra_' . $key,
				array(
					'default'           => $defaults[ $key ],
					'sanitize_callback' => $sanitize,
				)
			);

			if ( 'image' === $type ) {
				$wp_customize->add_control(
					new WP_Customize_Image_Control(
						$wp_customize,
						'wayra_' . $key,
						array(
							'label'   => $label,
							'section' => $section_id,
						)
					)
				);
			} else {
				$wp_customize->add_control(
					'wayra_' . $key,
					array(
						'label'   => $label,
						'section' => $section_id,
						'type'    => $type,
					)
				);
			}
		}
	}
}
add_action( 'customize_register', 'wayra_customize_register' );
