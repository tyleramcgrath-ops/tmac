<?php
/**
 * Used by WordPress when "Latest posts" is the static front page.
 * Mirrors page-templates/front.php so the home view is consistent.
 */
get_header();
include locate_template( 'template-parts/home-content.php' );
get_footer();
