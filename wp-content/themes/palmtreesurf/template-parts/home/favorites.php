<?php
/**
 * "Tamarindo Favorites" — approved mockup.
 *
 * Mixed-category cards. The mockup mixes restaurants and wellness into this row;
 * this install only holds experiences, so it draws from those rather than
 * inventing businesses that do not exist in the database.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_query = new WP_Query(
	array(
		'post_type'           => PT_EXPERIENCE_POST_TYPE,
		'posts_per_page'      => 4,
		'offset'              => 3,
		'orderby'             => array( 'menu_order' => 'ASC', 'date' => 'DESC' ),
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	)
);

// Fewer than four left after the featured three: show what there is, or nothing.
if ( ! $pt_query->have_posts() ) {
	wp_reset_postdata();
	return;
}
?>
<section class="section section--sand">
	<div class="container">
		<header class="row-head" data-reveal>
			<div>
				<h2 class="section__title"><?php esc_html_e( 'Tamarindo Favorites', 'palmtreesurf' ); ?></h2>
				<p class="section__lede"><?php esc_html_e( 'Handpicked by locals. Loved by travellers.', 'palmtreesurf' ); ?></p>
			</div>
			<a class="row-head__link" href="<?php echo esc_url( get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>">
				<?php esc_html_e( 'View All', 'palmtreesurf' ); ?> <span aria-hidden="true">&rarr;</span>
			</a>
		</header>

		<div class="card-grid card-grid--4" data-reveal-group>
			<?php
			while ( $pt_query->have_posts() ) :
				$pt_query->the_post();
				get_template_part( 'template-parts/components/card', 'experience' );
			endwhile;
			wp_reset_postdata();
			?>
		</div>
	</div>
</section>
