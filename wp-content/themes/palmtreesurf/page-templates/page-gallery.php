<?php
/**
 * Template Name: Gallery
 * Template Post Type: page
 *
 * Page content, then every gallery slot that has a real photo behind it.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<article <?php post_class( 'entry entry--gallery' ); ?>>
		<header class="page-header">
			<div class="container">
				<p class="eyebrow"><?php esc_html_e( 'On the water', 'palmtreesurf' ); ?></p>
				<?php the_title( '<h1 class="page-title">', '</h1>' ); ?>
			</div>
		</header>

		<?php if ( trim( wp_strip_all_tags( get_the_content() ) ) ) : ?>
			<div class="container container--narrow entry__content"><?php the_content(); ?></div>
		<?php endif; ?>

		<?php get_template_part( 'template-parts/home/gallery' ); ?>

		<div class="container container--narrow" style="padding-block:var(--pt-section-y)">
			<?php
			pt_booking_form(
				array(
					'title'    => __( 'Want photos like these of your own session?', 'palmtreesurf' ),
					'location' => 'gallery-page',
				)
			);
			?>
		</div>
	</article>
	<?php
endwhile;

get_footer();
