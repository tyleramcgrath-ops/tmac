<?php
/**
 * Pages. The theme's own pages (services and company pages) get the RMA
 * layout; Elementor pages get out of Elementor's way; anything else gets
 * a clean editorial page.
 *
 * @package rma
 */

get_header();

while ( have_posts() ) :
	the_post();
	$rma_slug = get_post_field( 'post_name' );

	if ( rma_is_elementor_page() ) {
		echo '<main id="main" class="elementor-main">';
		the_content();
		echo '</main>';
	} elseif ( array_key_exists( $rma_slug, rma_services() ) || array_key_exists( $rma_slug, rma_company_pages() ) ) {
		get_template_part( 'template-parts/page-rma', null, array( 'slug' => $rma_slug ) );
	} else {
		get_template_part( 'template-parts/page-plain' );
	}
endwhile;

get_footer();
