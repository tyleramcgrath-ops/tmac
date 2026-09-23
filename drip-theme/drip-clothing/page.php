<?php
/**
 * Pages. About and Contact get the DRIP layout; other Elementor pages get out
 * of Elementor's way; WooCommerce pages (cart, checkout, account) and anything
 * else get a clean page around their content.
 *
 * @package drip
 */

get_header();

while ( have_posts() ) :
	the_post();
	$drip_slug = get_post_field( 'post_name' );

	// About and Contact get the redesigned layout even if they were built in
	// Elementor before; the 'drip_builtin_page' filter turns that off.
	if ( in_array( $drip_slug, drip_builtin_pages(), true ) && apply_filters( 'drip_builtin_page', true, $drip_slug ) ) {
		get_template_part( 'template-parts/page', $drip_slug );
	} elseif ( drip_is_elementor_page() ) {
		echo '<main id="main" class="elementor-main">';
		the_content();
		echo '</main>';
	} else {
		get_template_part( 'template-parts/page-plain' );
	}
endwhile;

get_footer();
