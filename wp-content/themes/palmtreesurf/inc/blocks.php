<?php
/**
 * Block editor integration: palette, font sizes and starter patterns.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Expose the theme's design tokens to the block editor.
 *
 * The values mirror the custom properties in assets/css/main.css, so a colour
 * changed there must be changed here too.
 */
function pt_editor_tokens() {
	add_theme_support(
		'editor-color-palette',
		array(
			array(
				'name'  => __( 'Ocean', 'palmtreesurf' ),
				'slug'  => 'ocean',
				'color' => '#0b4f6c',
			),
			array(
				'name'  => __( 'Lagoon', 'palmtreesurf' ),
				'slug'  => 'lagoon',
				'color' => '#1b9aaa',
			),
			array(
				'name'  => __( 'Sunset', 'palmtreesurf' ),
				'slug'  => 'sunset',
				'color' => '#f4784f',
			),
			array(
				'name'  => __( 'Sand', 'palmtreesurf' ),
				'slug'  => 'sand',
				'color' => '#f6efe6',
			),
			array(
				'name'  => __( 'Ink', 'palmtreesurf' ),
				'slug'  => 'ink',
				'color' => '#14202b',
			),
			array(
				'name'  => __( 'White', 'palmtreesurf' ),
				'slug'  => 'white',
				'color' => '#ffffff',
			),
		)
	);

	add_theme_support(
		'editor-font-sizes',
		array(
			array(
				'name' => __( 'Small', 'palmtreesurf' ),
				'slug' => 'small',
				'size' => 15,
			),
			array(
				'name' => __( 'Normal', 'palmtreesurf' ),
				'slug' => 'normal',
				'size' => 18,
			),
			array(
				'name' => __( 'Large', 'palmtreesurf' ),
				'slug' => 'large',
				'size' => 24,
			),
			array(
				'name' => __( 'Display', 'palmtreesurf' ),
				'slug' => 'display',
				'size' => 44,
			),
		)
	);
}
add_action( 'after_setup_theme', 'pt_editor_tokens' );

/**
 * Register a pattern category and the starter marketing patterns.
 */
function pt_register_patterns() {
	if ( ! function_exists( 'register_block_pattern_category' ) ) {
		return;
	}

	register_block_pattern_category(
		'palmtreesurf',
		array( 'label' => __( 'Palm Tree Surf', 'palmtreesurf' ) )
	);

	register_block_pattern(
		'palmtreesurf/feature-row',
		array(
			'title'      => __( 'Three feature columns', 'palmtreesurf' ),
			'categories' => array( 'palmtreesurf' ),
			'content'    => '<!-- wp:columns {"className":"pts-features"} --><div class="wp-block-columns pts-features">'
				. '<!-- wp:column --><div class="wp-block-column"><!-- wp:heading {"level":3} --><h3>' . esc_html__( 'Small groups', 'palmtreesurf' ) . '</h3><!-- /wp:heading --><!-- wp:paragraph --><p>' . esc_html__( 'Describe the first thing that sets your sessions apart.', 'palmtreesurf' ) . '</p><!-- /wp:paragraph --></div><!-- /wp:column -->'
				. '<!-- wp:column --><div class="wp-block-column"><!-- wp:heading {"level":3} --><h3>' . esc_html__( 'Local guides', 'palmtreesurf' ) . '</h3><!-- /wp:heading --><!-- wp:paragraph --><p>' . esc_html__( 'Describe the second thing that sets your sessions apart.', 'palmtreesurf' ) . '</p><!-- /wp:paragraph --></div><!-- /wp:column -->'
				. '<!-- wp:column --><div class="wp-block-column"><!-- wp:heading {"level":3} --><h3>' . esc_html__( 'All levels', 'palmtreesurf' ) . '</h3><!-- /wp:heading --><!-- wp:paragraph --><p>' . esc_html__( 'Describe the third thing that sets your sessions apart.', 'palmtreesurf' ) . '</p><!-- /wp:paragraph --></div><!-- /wp:column -->'
				. '</div><!-- /wp:columns -->',
		)
	);

	register_block_pattern(
		'palmtreesurf/cta-band',
		array(
			'title'      => __( 'Call to action band', 'palmtreesurf' ),
			'categories' => array( 'palmtreesurf' ),
			'content'    => '<!-- wp:group {"className":"pts-cta","backgroundColor":"ocean","textColor":"white"} --><div class="wp-block-group pts-cta has-white-color has-ocean-background-color has-text-color has-background">'
				. '<!-- wp:heading {"textAlign":"center","level":2} --><h2 class="has-text-align-center">' . esc_html__( 'Ready to get in the water?', 'palmtreesurf' ) . '</h2><!-- /wp:heading -->'
				. '<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons">'
				. '<!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#enquiry">' . esc_html__( 'Book your session', 'palmtreesurf' ) . '</a></div><!-- /wp:button -->'
				. '</div><!-- /wp:buttons --></div><!-- /wp:group -->',
		)
	);

	register_block_pattern(
		'palmtreesurf/enquiry-form',
		array(
			'title'      => __( 'Booking enquiry form', 'palmtreesurf' ),
			'categories' => array( 'palmtreesurf' ),
			'content'    => '<!-- wp:shortcode -->[pt_enquiry_form]<!-- /wp:shortcode -->',
		)
	);
}
add_action( 'init', 'pt_register_patterns' );
