<?php
/**
 * Template Name: Elementor (Header + Footer)
 *
 * Loads the theme header and footer but gives Elementor full control of the
 * content area — no section wrapper, no container, so backgrounds can go
 * edge-to-edge.
 *
 * @package envuemex
 */

get_header();

while ( have_posts() ) :
	the_post();
	the_content();
endwhile;

get_footer();
