<?php
/**
 * Testimonials (section 6.6). Dark section, pulled from the CPT.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_query = new WP_Query(
	array(
		'post_type'      => 'testimonial',
		'posts_per_page' => 3,
		'orderby'        => array(
			'menu_order' => 'ASC',
			'date'       => 'DESC',
		),
		'no_found_rows'  => true,
	)
);

if ( ! $pt_query->have_posts() ) {
	wp_reset_postdata();
	return;
}
?>
<section class="section section--dark testimonials">
	<div class="container">
		<header class="section__header" data-reveal>
			<p class="eyebrow eyebrow--light"><?php esc_html_e( 'Guest reviews', 'palmtreesurf' ); ?></p>
			<h2 class="section__title"><?php esc_html_e( 'What people say', 'palmtreesurf' ); ?></h2>
		</header>

		<ul class="testimonials__list" data-reveal-group>
			<?php
			while ( $pt_query->have_posts() ) :
				$pt_query->the_post();
				$pt_quote  = pt_field( get_the_ID(), 'quote' );
				$pt_rating = (int) pt_field( get_the_ID(), 'rating' );
				$pt_origin = pt_field( get_the_ID(), 'origin' );

				if ( ! $pt_quote ) {
					continue;
				}
				?>
				<li class="quote" data-reveal>
					<?php if ( $pt_rating > 0 && $pt_rating <= 5 ) : ?>
						<p class="quote__stars">
							<span aria-hidden="true"><?php echo esc_html( str_repeat( '★', $pt_rating ) ); ?></span>
							<span class="screen-reader-text">
								<?php
								printf(
									/* translators: %d: rating out of five. */
									esc_html__( 'Rated %d out of 5', 'palmtreesurf' ),
									(int) $pt_rating
								);
								?>
							</span>
						</p>
					<?php endif; ?>

					<blockquote class="quote__body"><?php echo esc_html( $pt_quote ); ?></blockquote>

					<footer class="quote__footer">
						<?php if ( has_post_thumbnail() ) : ?>
							<span class="quote__avatar"><?php the_post_thumbnail( 'thumbnail', array( 'loading' => 'lazy' ) ); ?></span>
						<?php endif; ?>
						<span class="quote__meta">
							<strong><?php the_title(); ?></strong>
							<?php if ( $pt_origin ) : ?>
								<span><?php echo esc_html( $pt_origin ); ?></span>
							<?php endif; ?>
						</span>
					</footer>
				</li>
				<?php
			endwhile;
			wp_reset_postdata();
			?>
		</ul>
	</div>
</section>
