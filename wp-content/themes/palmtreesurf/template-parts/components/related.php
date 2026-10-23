<?php
/**
 * Related experiences.
 *
 * Same category first, topped up from anything else. Internal linking like this
 * is how a category page and its siblings pass authority to each other.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_current = get_the_ID();
$pt_terms   = wp_get_object_terms( $pt_current, 'experience_type', array( 'fields' => 'ids' ) );

$pt_args = array(
	'post_type'           => PT_EXPERIENCE_POST_TYPE,
	'posts_per_page'      => 3,
	'post__not_in'        => array( $pt_current ),
	'ignore_sticky_posts' => true,
	'no_found_rows'       => true,
	'orderby'             => 'rand',
);

if ( $pt_terms && ! is_wp_error( $pt_terms ) ) {
	$pt_args['tax_query'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
		array(
			'taxonomy' => 'experience_type',
			'field'    => 'term_id',
			'terms'    => $pt_terms,
		),
	);
}

$pt_related = new WP_Query( $pt_args );

// Not enough siblings in this category, so widen rather than show a thin row.
if ( $pt_related->post_count < 3 ) {
	unset( $pt_args['tax_query'] );
	$pt_related = new WP_Query( $pt_args );
}

if ( ! $pt_related->have_posts() ) {
	wp_reset_postdata();
	return;
}
?>
<section class="section section--alt">
	<div class="container">
		<header class="section__header" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'You might also like', 'palmtreesurf' ); ?></p>
			<h2 class="section__title"><?php esc_html_e( 'Other experiences', 'palmtreesurf' ); ?></h2>
		</header>

		<div class="card-grid" data-reveal-group>
			<?php
			while ( $pt_related->have_posts() ) :
				$pt_related->the_post();
				get_template_part( 'template-parts/components/card', 'experience' );
			endwhile;
			wp_reset_postdata();
			?>
		</div>
	</div>
</section>
