<?php
/**
 * Customizer: Appearance → Customize → Teddy.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'customize_register', function ( $wp ) {
	$wp->add_section( 'teddy', array( 'title' => __( 'Teddy storefront', 'teddy' ), 'priority' => 30 ) );

	$fields = array(
		'teddy_intro'          => array( 'label' => __( 'Show the bear intro on the home page (once per visit)', 'teddy' ), 'type' => 'checkbox', 'default' => true, 'sanitize' => 'rest_sanitize_boolean' ),
		'teddy_hero_eyebrow'   => array( 'label' => __( 'Hero eyebrow', 'teddy' ), 'type' => 'text', 'default' => 'Campaign 01 / Four cities, one frontier', 'sanitize' => 'sanitize_text_field' ),
		'teddy_hero_sub'       => array( 'label' => __( 'Hero text', 'teddy' ), 'type' => 'textarea', 'default' => 'Western silhouettes, contemporary monograms. 100% wool cowboy hats and fedoras, lined in gold silk, with your own letters on the crown.', 'sanitize' => 'sanitize_textarea_field' ),
		'teddy_monogram_fee'   => array( 'label' => __( 'Custom monogram fee ($)', 'teddy' ), 'type' => 'number', 'default' => 25, 'sanitize' => 'teddy_sanitize_money' ),
		'teddy_instagram_url'  => array( 'label' => __( 'Instagram URL', 'teddy' ), 'type' => 'url', 'default' => 'https://www.instagram.com/teddyheadwear/', 'sanitize' => 'esc_url_raw' ),
		'teddy_faq_url'        => array( 'label' => __( 'FAQ URL', 'teddy' ), 'type' => 'url', 'default' => 'https://teddyheadwear.com/pages/faq', 'sanitize' => 'esc_url_raw' ),
	);
	foreach ( $fields as $id => $f ) {
		$wp->add_setting( $id, array( 'default' => $f['default'], 'sanitize_callback' => $f['sanitize'] ) );
		$wp->add_control( $id, array( 'label' => $f['label'], 'section' => 'teddy', 'type' => $f['type'] ) );
	}
	$wp->add_setting( 'teddy_hero_image', array( 'default' => 0, 'sanitize_callback' => 'absint' ) );
	$wp->add_control( new WP_Customize_Media_Control( $wp, 'teddy_hero_image', array( 'label' => __( 'Hero image', 'teddy' ), 'section' => 'teddy', 'mime_type' => 'image' ) ) );
} );

function teddy_sanitize_money( $v ) {
	return max( 0, round( (float) $v, 2 ) );
}
