<?php
/**
 * More guides, at the foot of a post.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_query = new WP_Query(
	array(
		'post_type'           => 'post',
		'posts_per_page'      => 3,
		'post__not_in'        => array( get_the_ID() ),
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	)
);

if ( ! $pt_query->have_posts() ) {
	wp_reset_postdata();
	return;
}
?>
<section class="section section--sand related-posts">
	<div class="container">
		<header class="section__header">
			<p class="eyebrow"><?php esc_html_e( 'Keep reading', 'palmtreesurf' ); ?></p>
			<h2 class="section__title"><?php esc_html_e( 'More Tamarindo guides', 'palmtreesurf' ); ?></h2>
		</header>

		<div class="card-grid card-grid--3" data-reveal-group>
			<?php
			while ( $pt_query->have_posts() ) :
				$pt_query->the_post();
				?>
				<article class="card card--post">
					<a class="card__link" href="<?php the_permalink(); ?>">
						<div class="card__media">
							<?php if ( has_post_thumbnail() ) : ?>
								<?php the_post_thumbnail( 'pt-card', array( 'loading' => 'lazy', 'decoding' => 'async' ) ); ?>
							<?php else : ?>
								<?php pt_image( 'story-banner' ); ?>
							<?php endif; ?>
						</div>

						<div class="card__body">
							<h3 class="card__title"><?php the_title(); ?></h3>
							<?php if ( has_excerpt() ) : ?>
								<p class="card__text"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 22 ) ); ?></p>
							<?php endif; ?>
							<p class="card__meta">
								<span class="card__duration">
									<?php
									$pt_minutes = pt_reading_time( get_post_field( 'post_content', get_the_ID() ) );
									printf(
										/* translators: %s: number of minutes. */
										esc_html( _n( '%s minute read', '%s minute read', $pt_minutes, 'palmtreesurf' ) ),
										esc_html( number_format_i18n( $pt_minutes ) )
									);
									?>
								</span>
							</p>
						</div>
					</a>
				</article>
			<?php endwhile; ?>
		</div>
	</div>
</section>
<?php
wp_reset_postdata();
