<?php
/**
 * Featured experiences (section 6.3). The commercial core of the page.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_query = new WP_Query(
	array(
		'post_type'           => PT_EXPERIENCE_POST_TYPE,
		'posts_per_page'      => 3,
		'orderby'             => array(
			'menu_order' => 'ASC',
			'date'       => 'DESC',
		),
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	)
);

// Section 7.10: no content means no section, not an empty shell.
if ( ! $pt_query->have_posts() ) {
	wp_reset_postdata();
	return;
}
?>
<section class="section section--alt" id="experiences">
	<div class="container">
		<header class="section__header" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Experiences & Adventures', 'palmtreesurf' ); ?></p>
			<h2 class="section__title"><?php esc_html_e( 'Explore Tamarindo Activities', 'palmtreesurf' ); ?></h2>
			<p class="section__lede">
				<?php esc_html_e( 'Surf lessons, fishing charters, boat tours and wildlife adventures — led by local certified guides.', 'palmtreesurf' ); ?>
			</p>
		</header>

		<div class="section__panel" data-reveal>
			<?php get_template_part( 'template-parts/components/filter-panel' ); ?>
		</div>

		<div class="card-grid" data-reveal-group>
			<?php
			while ( $pt_query->have_posts() ) :
				$pt_query->the_post();
				get_template_part( 'template-parts/components/card', 'experience' );
			endwhile;
			wp_reset_postdata();
			?>
		</div>

		<p class="section__more" data-reveal>
			<a class="btn btn--secondary" href="<?php echo esc_url( get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>">
				<?php esc_html_e( 'See All Experiences', 'palmtreesurf' ); ?>
			</a>
		</p>
	</div>
</section>
