<?php
/**
 * Not found.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

get_header();

get_template_part(
	'template-parts/page-hero',
	null,
	array(
		'image'   => popeye_img( 'public_583e_c4c50122f0be43ec90b249a5001ec9c7' ),
		'eyebrow' => '404',
		'title'   => __( 'Lost at Sea', 'popeye-charters' ),
		'text'    => __( "That page drifted off course. Let's get you back to the harbor.", 'popeye-charters' ),
		'size'    => 'md',
		'buttons' => array(
			array( __( 'Back to Home', 'popeye-charters' ), home_url( '/' ), 'gold' ),
			array( __( 'See Experiences', 'popeye-charters' ), popeye_experiences_url(), 'ghost' ),
		),
	)
);

get_footer();
