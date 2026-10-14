<?php
/**
 * Site-wide settings in Appearance → Customize → We Have Rehabs.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

/**
 * Text settings: key => [label, default, type].
 *
 * @return array
 */
function whr_customizer_settings() {
	return array(
		'hero_eyebrow'  => array( __( 'Homepage hero: small line', 'wehaverehabs' ), __( 'Costa Rica · Mexico · Bali · Portugal & beyond', 'wehaverehabs' ), 'text' ),
		'hero_title'    => array( __( 'Homepage hero: headline', 'wehaverehabs' ), __( 'A sanctuary for <em>every kind</em> of healing', 'wehaverehabs' ), 'text' ),
		'hero_text'     => array( __( 'Homepage hero: text', 'wehaverehabs' ), __( 'Hand-selected retreats and treatment programs for the mind, body and spirit — in places that feel like they were made for you.', 'wehaverehabs' ), 'textarea' ),
		'welcome'       => array( __( 'Homepage welcome', 'wehaverehabs' ), __( 'Healing rarely happens in a hurry. It happens <em>slowly</em>, in good company, somewhere that lets you breathe again. We travel the world to find those places — and the people inside them who know how to help.', 'wehaverehabs' ), 'textarea' ),
		'quote'         => array( __( 'Homepage quote', 'wehaverehabs' ), __( 'Rest is not the reward for healing. It’s where healing begins.', 'wehaverehabs' ), 'text' ),
		'whatsapp'      => array( __( 'Care team WhatsApp (digits, international)', 'wehaverehabs' ), '', 'text' ),
		'advisor_url'   => array( __( 'Book-a-call link (Calendly etc.)', 'wehaverehabs' ), '', 'url' ),
		'contact_email' => array( __( 'Public contact email', 'wehaverehabs' ), '', 'email' ),
		'crisis_text'   => array( __( 'Crisis line text (top bar)', 'wehaverehabs' ), __( 'Need help right now? US: call or text 988', 'wehaverehabs' ), 'text' ),
		'helplines_url' => array( __( 'Worldwide helplines link', 'wehaverehabs' ), 'https://findahelpline.com', 'url' ),
		'price_signature' => array( __( 'For sanctuaries: Signature plan price', 'wehaverehabs' ), '', 'text' ),
		'price_featured'  => array( __( 'For sanctuaries: Featured plan price', 'wehaverehabs' ), '', 'text' ),
	);
}

add_action(
	'customize_register',
	function ( $wp_customize ) {
		$wp_customize->add_section( 'whr', array( 'title' => __( 'We Have Rehabs', 'wehaverehabs' ), 'priority' => 30 ) );
		foreach ( whr_customizer_settings() as $key => $s ) {
			$sanitize = array(
				'url'      => 'esc_url_raw',
				'email'    => 'sanitize_email',
				'textarea' => 'wp_kses_post',
				'text'     => 'wp_kses_post',
			);
			$wp_customize->add_setting( 'whr_' . $key, array( 'default' => $s[1], 'sanitize_callback' => $sanitize[ $s[2] ] ) );
			$wp_customize->add_control( 'whr_' . $key, array( 'label' => $s[0], 'section' => 'whr', 'type' => 'url' === $s[2] ? 'url' : ( 'email' === $s[2] ? 'email' : $s[2] ) ) );
		}
		foreach ( array( 'hero_image' => __( 'Homepage hero photo', 'wehaverehabs' ), 'split_image' => __( 'Homepage "what brings you here" photo', 'wehaverehabs' ), 'quote_image' => __( 'Homepage quote photo', 'wehaverehabs' ), 'cta_image' => __( 'Homepage guide photo', 'wehaverehabs' ) ) as $key => $label ) {
			$wp_customize->add_setting( 'whr_' . $key, array( 'sanitize_callback' => 'absint' ) );
			$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'whr_' . $key, array( 'label' => $label, 'section' => 'whr', 'mime_type' => 'image' ) ) );
		}
	}
);

/**
 * Customizer text with its default.
 *
 * @param string $key Key.
 * @return string
 */
function whr_text( $key ) {
	$settings = whr_customizer_settings();
	return whr_option( $key, isset( $settings[ $key ] ) ? $settings[ $key ][1] : '' );
}
