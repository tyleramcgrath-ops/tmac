<?php
/**
 * "Unforgettable Experiences" — approved mockup.
 *
 * Editorial text block on the left, tall photo cards on the right. Price and
 * rating render only where the experience actually carries them.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_query = new WP_Query(
	array(
		'post_type'           => PT_EXPERIENCE_POST_TYPE,
		'posts_per_page'      => 3,
		'orderby'             => array( 'menu_order' => 'ASC', 'date' => 'DESC' ),
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	)
);

if ( ! $pt_query->have_posts() ) {
	wp_reset_postdata();
	return;
}
?>
<section class="section feature" id="experiences">
	<div class="container feature__inner">
		<div class="feature__intro" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Explore Tamarindo', 'palmtreesurf' ); ?></p>
			<h2 class="feature__title"><?php esc_html_e( 'Unforgettable Experiences', 'palmtreesurf' ); ?></h2>
			<p class="feature__lede">
				<?php esc_html_e( 'From world-class waves to wildlife and open water — discover the best of Tamarindo with locals who know it.', 'palmtreesurf' ); ?>
			</p>
			<a class="btn btn--dark" href="<?php echo esc_url( get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>">
				<?php esc_html_e( 'Browse All Experiences', 'palmtreesurf' ); ?>
				<span aria-hidden="true">&rarr;</span>
			</a>
		</div>

		<ul class="feature__cards" data-reveal-group>
			<?php
			while ( $pt_query->have_posts() ) :
				$pt_query->the_post();
				$pt_id     = get_the_ID();
				$pt_price  = pt_field( $pt_id, 'price_from' );
				$pt_rating = pt_field( $pt_id, 'rating' );
				$pt_count  = (int) pt_field( $pt_id, 'review_count' );
				?>
				<li class="tall-card" data-reveal>
					<a class="tall-card__link" href="<?php the_permalink(); ?>">
						<span class="tall-card__media">
							<?php if ( has_post_thumbnail() ) : ?>
								<?php the_post_thumbnail( 'pt-portrait', array( 'loading' => 'lazy' ) ); ?>
							<?php else : ?>
								<?php pt_image( 'split-1-primary' ); ?>
							<?php endif; ?>
						</span>

						<span class="tall-card__body">
							<span class="tall-card__title"><?php the_title(); ?></span>
							<span class="tall-card__meta">
								<?php if ( $pt_price ) : ?>
									<span class="tall-card__price">
										<?php
										printf(
											/* translators: %s: price. */
											esc_html__( 'From $%s', 'palmtreesurf' ),
											esc_html( $pt_price )
										);
										?>
									</span>
								<?php endif; ?>

								<?php if ( $pt_rating ) : ?>
									<span class="tall-card__rating">
										<?php echo pt_get_icon( 'star', 'tall-card__star', 14 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static SVG. ?>
										<?php echo esc_html( $pt_rating ); ?>
										<?php if ( $pt_count ) : ?>
											<span class="tall-card__count">(<?php echo esc_html( number_format_i18n( $pt_count ) ); ?>)</span>
										<?php endif; ?>
									</span>
								<?php endif; ?>
							</span>
						</span>
					</a>
				</li>
				<?php
			endwhile;
			wp_reset_postdata();
			?>
		</ul>
	</div>
</section>
