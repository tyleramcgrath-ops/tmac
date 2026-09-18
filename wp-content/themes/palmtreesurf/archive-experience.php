<?php
/**
 * Experiences listing — approved mockup.
 *
 * Photo hero, filter bar overlapping its lower edge, then sidebar facets beside
 * a responsive results grid.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

$pt_is_tax = is_tax();
?>
<section class="page-hero">
	<div class="page-hero__media" aria-hidden="true">
		<?php pt_image( 'story-banner' ); ?>
	</div>

	<div class="page-hero__inner container">
		<?php if ( ! $pt_is_tax ) : ?>
			<p class="page-hero__script"><?php esc_html_e( 'Explore', 'palmtreesurf' ); ?></p>
		<?php endif; ?>

		<?php if ( $pt_is_tax ) : ?>
			<?php the_archive_title( '<h1 class="page-hero__title">', '</h1>' ); ?>
			<?php the_archive_description( '<div class="page-hero__lede">', '</div>' ); ?>
		<?php else : ?>
			<h1 class="page-hero__title"><?php esc_html_e( 'Tamarindo', 'palmtreesurf' ); ?></h1>
			<p class="page-hero__lede">
				<?php esc_html_e( 'Surf lessons, fishing charters, boat tours, wildlife adventures and more.', 'palmtreesurf' ); ?>
			</p>
		<?php endif; ?>
	</div>
</section>

<div class="container">
	<?php get_template_part( 'template-parts/components/filter-panel' ); ?>
</div>

<div class="container">
	<?php get_template_part( 'template-parts/components/breadcrumbs' ); ?>

	<div class="listing">
		<?php get_template_part( 'template-parts/components/facets' ); ?>

		<div class="listing__results">
			<div class="listing__head">
				<p class="listing__count">
					<?php
					global $wp_query;
					$pt_total = (int) $wp_query->found_posts;
					printf(
						/* translators: %s: number of experiences. */
						esc_html( _n( '%s experience', '%s experiences', $pt_total, 'palmtreesurf' ) ),
						esc_html( number_format_i18n( $pt_total ) )
					);
					?>
				</p>
			</div>

			<?php if ( have_posts() ) : ?>
				<div class="card-grid" data-reveal-group>
					<?php
					while ( have_posts() ) :
						the_post();
						get_template_part( 'template-parts/components/card', 'experience' );
					endwhile;
					?>
				</div>

				<?php pt_pagination(); ?>
			<?php else : ?>
				<?php get_template_part( 'template-parts/content', 'none' ); ?>
			<?php endif; ?>
		</div>
	</div>
</div>
<?php
get_footer();
