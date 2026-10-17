<?php
/**
 * Fallback template: the blog index and anything without a closer match.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>

<?php
/*
 * The Journal opened on a bare heading over white while About and Experiences
 * both had a proper banner. It sits outside the container because the banner
 * runs the full width of the page.
 */
if ( is_home() && ! is_front_page() ) {
	get_template_part(
		'template-parts/components/page-header',
		null,
		array(
			'title'    => get_the_title( (int) get_option( 'page_for_posts' ) ),
			'script'   => __( 'From the shop', 'palmtreesurf' ),
			'lede'     => __( 'What we have learned running trips off this coast — the surf, the seasons and the wildlife.', 'palmtreesurf' ),
			'slot'     => 'story-banner',
			'modifier' => 'journal',
		)
	);
}
?>

<div class="container layout">
	<div class="layout__content">
		<?php if ( have_posts() ) : ?>

			<div class="post-grid">
				<?php
				while ( have_posts() ) :
					the_post();
					get_template_part( 'template-parts/content', get_post_type() );
				endwhile;
				?>
			</div>

			<?php pt_pagination(); ?>

		<?php else : ?>
			<?php get_template_part( 'template-parts/content', 'none' ); ?>
		<?php endif; ?>
	</div>

	<?php get_sidebar(); ?>
</div>

<?php
get_footer();
