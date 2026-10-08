<?php
/**
 * Instructors (section 6.7).
 *
 * The bio overlay is always visible, not hover-only, so touch users and
 * keyboard users get the same content (section 6.7, section 2).
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_query = new WP_Query(
	array(
		'post_type'      => 'instructor',
		'posts_per_page' => 8,
		'orderby'        => array(
			'menu_order' => 'ASC',
			'title'      => 'ASC',
		),
		'no_found_rows'  => true,
	)
);

if ( ! $pt_query->have_posts() ) {
	wp_reset_postdata();
	return;
}
?>
<section class="section instructors">
	<div class="container">
		<header class="section__header" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Your guides', 'palmtreesurf' ); ?></p>
			<h2 class="section__title"><?php esc_html_e( 'Meet the team', 'palmtreesurf' ); ?></h2>
		</header>

		<ul class="instructors__grid" data-reveal-group>
			<?php
			$pt_index = 0;

			while ( $pt_query->have_posts() ) :
				$pt_query->the_post();
				++$pt_index;
				$pt_role = pt_field( get_the_ID(), 'role' );
				$pt_bio  = pt_field( get_the_ID(), 'bio_short' );
				$pt_cert = pt_field( get_the_ID(), 'certifications' );
				?>
				<li class="instructor" data-reveal>
					<div class="instructor__media">
						<?php if ( has_post_thumbnail() ) : ?>
							<?php the_post_thumbnail( 'pt-portrait', array( 'loading' => 'lazy', 'decoding' => 'async', 'sizes' => '(min-width: 1000px) 320px, (min-width: 700px) 45vw, 92vw' ) ); ?>
						<?php else : ?>
							<?php // Own slot per guide: never repeat one photo down the row. ?>
							<?php pt_image( 'instructor-' . min( 4, $pt_index ), array( 'sizes' => '(min-width: 1000px) 300px, 45vw' ) ); ?>
						<?php endif; ?>
					</div>
					<div class="instructor__body">
						<h3 class="instructor__name"><?php the_title(); ?></h3>
						<?php if ( $pt_role ) : ?>
							<p class="instructor__role"><?php echo esc_html( $pt_role ); ?></p>
						<?php endif; ?>
						<?php if ( $pt_bio ) : ?>
							<p class="instructor__bio"><?php echo esc_html( $pt_bio ); ?></p>
						<?php endif; ?>
						<?php if ( $pt_cert ) : ?>
							<p class="instructor__cert"><?php echo esc_html( $pt_cert ); ?></p>
						<?php endif; ?>
					</div>
				</li>
				<?php
			endwhile;
			wp_reset_postdata();
			?>
		</ul>
	</div>
</section>
