<?php
/**
 * Front page. Sections render in the order VISUAL-SPEC.md section 6 defines.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

get_template_part( 'template-parts/home/hero' );
get_template_part( 'template-parts/home/trust-bar' );

// Editor content from the assigned front page sits between the hero and the grid.
if ( is_page() && have_posts() ) {
	while ( have_posts() ) :
		the_post();
		$pt_content = get_the_content();

		if ( trim( wp_strip_all_tags( $pt_content ) ) ) {
			echo '<section class="section"><div class="container container--narrow entry__content">';
			the_content();
			echo '</div></section>';
		}
	endwhile;
	wp_reset_postdata();
}

get_template_part( 'template-parts/home/experiences' );

get_template_part(
	'template-parts/home/split-feature',
	null,
	array(
		'eyebrow'    => __( 'Why us', 'palmtreesurf' ),
		'title'      => __( 'Small groups, patient coaching, real local knowledge', 'palmtreesurf' ),
		'paragraphs' => array(
			__( 'Every session runs with a low guest-to-guide ratio, so you get corrections in the water rather than a lecture on the sand.', 'palmtreesurf' ),
			__( 'Our guides grew up on this coast. They read the tide and move the group to whichever peak is working that morning.', 'palmtreesurf' ),
		),
		'checklist'  => array(
			__( 'Boards, rash guards and reef-safe sunscreen included', 'palmtreesurf' ),
			__( 'Beginner-friendly sandbar break, no reef', 'palmtreesurf' ),
			__( 'Photos of your session at no extra cost', 'palmtreesurf' ),
			__( 'Hotel pickup available across Tamarindo', 'palmtreesurf' ),
		),
		'cta_label'  => __( 'See all experiences', 'palmtreesurf' ),
		'cta_url'    => get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ),
	)
);

get_template_part( 'template-parts/home/gallery' );
get_template_part( 'template-parts/home/testimonials' );

get_template_part(
	'template-parts/home/split-feature',
	null,
	array(
		'reverse'      => true,
		'eyebrow'      => __( 'Beyond surfing', 'palmtreesurf' ),
		'title'        => __( 'Fishing charters, boat tours and wildlife trips', 'palmtreesurf' ),
		'paragraphs'   => array(
			__( 'The same crew runs half-day fishing charters, sunset boat tours and estuary wildlife trips, so you can build a whole week around one booking.', 'palmtreesurf' ),
			__( 'Tell us what you are hoping to see and we will put the right boat and guide on it.', 'palmtreesurf' ),
		),
		'checklist'    => array(
			__( 'Half and full-day fishing charters', 'palmtreesurf' ),
			__( 'Sunset and snorkel boat tours', 'palmtreesurf' ),
			__( 'Estuary and mangrove wildlife trips', 'palmtreesurf' ),
			__( 'Private and custom itineraries', 'palmtreesurf' ),
		),
		'cta_label'    => __( 'Plan a custom trip', 'palmtreesurf' ),
		'slot_primary' => 'split-2-primary',
		'slot_offset'  => 'split-2-offset',
	)
);

get_template_part( 'template-parts/home/instructors' );
get_template_part( 'template-parts/home/location' );
get_template_part( 'template-parts/home/cta' );

get_footer();
