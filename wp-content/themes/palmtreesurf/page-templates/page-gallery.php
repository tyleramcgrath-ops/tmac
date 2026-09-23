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
		<?php
		get_template_part(
			'template-parts/components/page-header',
			null,
			array(
				'script'   => __( 'On the water', 'palmtreesurf' ),
				'lede'     => __( 'Photographs from our own trips — every one of them taken on the water off Tamarindo.', 'palmtreesurf' ),
				// Used nowhere else, so the banner cannot repeat a tile below it.
				'file'     => 'banner-fishing-boat.jpg',
				'modifier' => 'gallery',
			)
		);
		?>

		<div class="container container--narrow entry__content" style="padding-top:var(--pt-space-md)">
			<?php if ( trim( wp_strip_all_tags( get_the_content() ) ) ) : ?>
				<?php the_content(); ?>
			<?php else : ?>
				<p>
					<?php esc_html_e( 'Photographs from real sessions on this beach — first lessons, charters, estuary mornings and the sunsets people come back for. No stock photography and nothing staged.', 'palmtreesurf' ); ?>
				</p>
				<p>
					<?php esc_html_e( 'If you have been out with us and want your photos taken down, or you would like the full-resolution files from your session, just message us and we will sort it.', 'palmtreesurf' ); ?>
				</p>
			<?php endif; ?>
		</div>

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
