<?php
/**
 * Front page — section order follows the approved mockup.
 *
 * Every section returns early when it has no real content, so the page never
 * renders an empty shell.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

get_template_part( 'template-parts/home/hero' );
get_template_part( 'template-parts/home/category-rail' );
get_template_part( 'template-parts/home/experiences' );
get_template_part( 'template-parts/home/intro' );
get_template_part( 'template-parts/home/story-banner' );
get_template_part( 'template-parts/home/favorites' );

// Editor content from the assigned front page, when there is any.
if ( is_page() && have_posts() ) {
	while ( have_posts() ) :
		the_post();

		if ( trim( wp_strip_all_tags( get_the_content() ) ) ) {
			echo '<section class="section"><div class="container container--narrow entry__content">';
			the_content();
			echo '</div></section>';
		}
	endwhile;
	wp_reset_postdata();
}

get_template_part( 'template-parts/home/testimonials' );
get_template_part( 'template-parts/home/instructors' );
get_template_part( 'template-parts/home/lifestyle' );
get_template_part( 'template-parts/home/faq' );

get_footer();
