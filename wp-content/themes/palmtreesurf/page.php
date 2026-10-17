<?php
/**
 * Single page.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	get_template_part( 'template-parts/content', 'page' );

	if ( comments_open() || get_comments_number() ) {
		echo '<div class="container">';
		comments_template();
		echo '</div>';
	}
endwhile;

get_footer();
