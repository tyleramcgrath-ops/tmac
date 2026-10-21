<?php
/**
 * Customizer: everything on the homepage is editable under "DRIP Homepage".
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;

/**
 * Default text values, shared by the Customizer and the templates.
 *
 * @param string $key Setting key.
 * @return string
 */
function drip_current_default( $key ) {
	$defaults = array(
		'drip_wordmark'         => 'DRIP',
		'drip_hero_title'       => 'The Daily Current',
		'drip_hero_button'      => 'Shop the tee edit',
		'drip_hero_alt'         => 'Three friends in DRIP graphic tees looking out over the coast',
		'drip_edit_title'       => 'The Graphic Tee Edit',
		'drip_edit_category'    => 'tees',
		'drip_edit_products'    => '6977,6976,7141', // Silver Ribbon, Shoreline Minimal, Tide Lines on dripclothingcompany.com.
		'drip_story_title'      => 'Between Tides and Traffic',
		'drip_story_text'       => "Coast and concrete. A state of mind\nwhere salt air meets city streets.\nMade for wherever the day takes you.",
		'drip_story_link_label' => '',
		'drip_line_title'       => 'Find Your Line',
		'drip_line_button'      => 'Shop the tee edit',
		'drip_footer_region'    => '',
	);
	return isset( $defaults[ $key ] ) ? $defaults[ $key ] : '';
}

/**
 * Read a theme mod with the shared default.
 *
 * @param string $key Setting key.
 * @return string
 */
function drip_current_mod( $key ) {
	return get_theme_mod( $key, drip_current_default( $key ) );
}

/**
 * Register Customizer settings.
 *
 * @param WP_Customize_Manager $wp_customize Manager.
 */
function drip_current_customize_register( $wp_customize ) {
	$wp_customize->add_panel(
		'drip_home',
		array(
			'title'    => __( 'DRIP Homepage', 'drip-current' ),
			'priority' => 30,
		)
	);

	$text = function ( $id, $label, $section, $type = 'text', $sanitize = 'sanitize_text_field' ) use ( $wp_customize ) {
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => drip_current_default( $id ),
				'sanitize_callback' => $sanitize,
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'label'   => $label,
				'section' => $section,
				'type'    => $type,
			)
		);
	};

	$image = function ( $id, $label, $section, $description = '' ) use ( $wp_customize ) {
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => '',
				'sanitize_callback' => 'esc_url_raw',
			)
		);
		$wp_customize->add_control(
			new WP_Customize_Image_Control(
				$wp_customize,
				$id,
				array(
					'label'       => $label,
					'section'     => $section,
					'description' => $description,
				)
			)
		);
	};

	$url = function ( $id, $label, $section, $description = '' ) use ( $wp_customize ) {
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => '',
				'sanitize_callback' => 'esc_url_raw',
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'label'       => $label,
				'section'     => $section,
				'type'        => 'url',
				'description' => $description,
			)
		);
	};

	// Brand.
	$wp_customize->add_setting(
		'drip_use_custom_logo',
		array(
			'default'           => false,
			'sanitize_callback' => 'wp_validate_boolean',
		)
	);
	$wp_customize->add_control(
		'drip_use_custom_logo',
		array(
			'label'       => __( 'Use the uploaded logo instead of the drop + DRIP wordmark', 'drip-current' ),
			'section'     => 'title_tagline',
			'type'        => 'checkbox',
			'description' => __( 'Leave unticked to match the homepage design (blue drop beside a spaced-out wordmark).', 'drip-current' ),
		)
	);
	$text( 'drip_wordmark', __( 'Wordmark text', 'drip-current' ), 'title_tagline' );

	// Hero.
	$wp_customize->add_section( 'drip_hero', array( 'title' => __( 'Hero — The Daily Current', 'drip-current' ), 'panel' => 'drip_home' ) );
	$wp_customize->add_setting(
		'drip_hero_show',
		array(
			'default'           => true,
			'sanitize_callback' => 'wp_validate_boolean',
		)
	);
	$wp_customize->add_control( 'drip_hero_show', array( 'label' => __( 'Show hero', 'drip-current' ), 'section' => 'drip_hero', 'type' => 'checkbox' ) );
	$image( 'drip_hero_image', __( 'Hero photo', 'drip-current' ), 'drip_hero', __( 'Wide landscape photo; the top third sits behind the title.', 'drip-current' ) );
	$text( 'drip_hero_alt', __( 'Hero photo description (alt text)', 'drip-current' ), 'drip_hero' );
	$text( 'drip_hero_title', __( 'Title', 'drip-current' ), 'drip_hero' );
	$text( 'drip_hero_button', __( 'Button text', 'drip-current' ), 'drip_hero' );
	$url( 'drip_hero_link', __( 'Button link', 'drip-current' ), 'drip_hero', __( 'Empty = scroll to the tee edit below.', 'drip-current' ) );

	// Tee edit.
	$wp_customize->add_section(
		'drip_edit',
		array(
			'title'       => __( 'The Graphic Tee Edit', 'drip-current' ),
			'panel'       => 'drip_home',
			'description' => __( 'Three products from your WooCommerce store. Enter product IDs to hand-pick them, or leave empty to show the newest products in the chosen category.', 'drip-current' ),
		)
	);
	$text( 'drip_edit_title', __( 'Section title', 'drip-current' ), 'drip_edit' );
	$text( 'drip_edit_products', __( 'Product IDs (comma separated, e.g. 6977,6976,7141)', 'drip-current' ), 'drip_edit' );
	$text( 'drip_edit_category', __( 'Category slug when no IDs are set', 'drip-current' ), 'drip_edit', 'text', 'sanitize_title' );
	for ( $i = 1; $i <= 3; $i++ ) {
		/* translators: %d card number */
		$image( 'drip_edit_image_' . $i, sprintf( __( 'Card %d image override (optional)', 'drip-current' ), $i ), 'drip_edit', __( 'Use a flat-lay shot on a light background to match the design. Empty = the product photo.', 'drip-current' ) );
	}

	// Between tides.
	$wp_customize->add_section( 'drip_story', array( 'title' => __( 'Between Tides and Traffic', 'drip-current' ), 'panel' => 'drip_home' ) );
	$image( 'drip_story_image', __( 'Background photo', 'drip-current' ), 'drip_story', __( 'Subject on the left, open wall on the right for the text.', 'drip-current' ) );
	$text( 'drip_story_title', __( 'Title', 'drip-current' ), 'drip_story' );
	$text( 'drip_story_text', __( 'Text', 'drip-current' ), 'drip_story', 'textarea', 'sanitize_textarea_field' );
	$text( 'drip_story_link_label', __( 'Optional link text (e.g. Read our story)', 'drip-current' ), 'drip_story' );
	$url( 'drip_story_link', __( 'Optional link URL', 'drip-current' ), 'drip_story' );

	// Find your line.
	$wp_customize->add_section( 'drip_line', array( 'title' => __( 'Find Your Line', 'drip-current' ), 'panel' => 'drip_home' ) );
	$image( 'drip_line_image', __( 'Background photo', 'drip-current' ), 'drip_line' );
	$text( 'drip_line_title', __( 'Title', 'drip-current' ), 'drip_line' );
	$text( 'drip_line_button', __( 'Button text', 'drip-current' ), 'drip_line' );
	$url( 'drip_line_link', __( 'Button link', 'drip-current' ), 'drip_line', __( 'Empty = the Tees category.', 'drip-current' ) );

	// Footer.
	$wp_customize->add_section( 'drip_footer', array( 'title' => __( 'Footer & social', 'drip-current' ), 'panel' => 'drip_home' ) );
	$url( 'drip_social_instagram', __( 'Instagram URL', 'drip-current' ), 'drip_footer' );
	$url( 'drip_social_tiktok', __( 'TikTok URL', 'drip-current' ), 'drip_footer' );
	$url( 'drip_social_youtube', __( 'YouTube URL', 'drip-current' ), 'drip_footer' );
	$url( 'drip_social_facebook', __( 'Facebook URL', 'drip-current' ), 'drip_footer' );
	$text( 'drip_footer_region', __( 'Region label (empty = store country / currency, e.g. US / USD)', 'drip-current' ), 'drip_footer' );
}
add_action( 'customize_register', 'drip_current_customize_register' );
