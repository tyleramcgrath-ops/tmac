<?php
/**
 * Appearance → Customize → Sun Coast details: phone, email, address, social links,
 * and where estimate requests are emailed.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'customize_register', function ( WP_Customize_Manager $wp ) {
	$wp->add_section( 'suncoast_details', array( 'title' => 'Sun Coast details', 'priority' => 30 ) );
	$fields = array(
		'phone'       => array( 'Phone, as shown', 'text' ),
		'phone_tel'   => array( 'Phone, for tap-to-call (digits with country code, e.g. +15617478787)', 'text' ),
		'email'       => array( 'Email address', 'email' ),
		'address'     => array( 'Address line', 'text' ),
		'facebook'    => array( 'Facebook page', 'url' ),
		'twitter'     => array( 'Twitter / X profile', 'url' ),
		'estimate_to' => array( 'Send estimate requests to (one or more addresses, separated by commas)', 'text' ),
	);
	foreach ( $fields as $key => $field ) {
		$sanitize = $field[1] === 'url' ? 'esc_url_raw' : ( $field[1] === 'email' ? 'sanitize_email' : 'sanitize_text_field' );
		if ( $key === 'estimate_to' ) {
			$sanitize = 'suncoast_sanitize_email_list';
		}
		$wp->add_setting( 'suncoast_' . $key, array( 'default' => '', 'sanitize_callback' => $sanitize ) );
		$wp->add_control( 'suncoast_' . $key, array( 'label' => $field[0], 'section' => 'suncoast_details', 'type' => $field[1], 'description' => 'Leave blank for the default from suncoastclean.com.' ) );
	}
} );

/** "a@x.com, b@y.com" -> the valid addresses, comma separated. */
function suncoast_sanitize_email_list( $value ) {
	$out = array();
	foreach ( explode( ',', (string) $value ) as $addr ) {
		$addr = sanitize_email( trim( $addr ) );
		if ( $addr && is_email( $addr ) ) {
			$out[] = $addr;
		}
	}
	return implode( ', ', $out );
}
