<?php
/**
 * Template Name: EnVueMex - Elementor Full Canvas
 * Template Post Type: page
 *
 * @package EnVueMex_Premium
 */
get_header();
while ( have_posts() ) :
	the_post();
	?>
	<main id="main" class="elementor-canvas">
		<?php the_content(); ?>
	</main>
	<?php
endwhile;
get_footer();
