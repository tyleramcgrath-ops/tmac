<?php
/**
 * Experience card.
 *
 * Structure follows the live site's listing card: image with a corner badge, a
 * rating pill overlapping the image's bottom-right, then title, description and
 * a meta row. The whole card is one link — no nested interactive elements.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_id       = get_the_ID();
$pt_badge    = pt_field( $pt_id, 'badge' );
$pt_rating   = pt_field( $pt_id, 'rating' );
$pt_reviews  = (int) pt_field( $pt_id, 'review_count' );
$pt_price    = pt_field( $pt_id, 'price_from' );
$pt_suffix   = pt_field( $pt_id, 'price_suffix' );
$pt_duration = pt_field( $pt_id, 'duration' );
$pt_level    = get_the_term_list( $pt_id, 'skill_level', '', ', ' );
?>
<article <?php post_class( 'card card--experience' ); ?>>
	<a class="card__link" href="<?php the_permalink(); ?>">
		<div class="card__media">
			<?php if ( has_post_thumbnail() ) : ?>
				<?php the_post_thumbnail( 'pt-card', array( 'loading' => 'lazy', 'decoding' => 'async' ) ); ?>
			<?php else : ?>
				<?php pt_image( 'exp-card-1' ); ?>
			<?php endif; ?>

			<?php if ( $pt_badge ) : ?>
				<span class="card__badge"><?php echo esc_html( $pt_badge ); ?></span>
			<?php endif; ?>

			<?php if ( $pt_rating ) : ?>
				<span class="card__rating">
					<span class="card__star" aria-hidden="true">&#9733;</span>
					<strong><?php echo esc_html( $pt_rating ); ?></strong>
					<?php if ( $pt_reviews ) : ?>
						<span class="card__reviews">(<?php echo esc_html( number_format_i18n( $pt_reviews ) ); ?>)</span>
					<?php endif; ?>
					<span class="screen-reader-text">
						<?php
						printf(
							/* translators: 1: rating out of five, 2: number of reviews. */
							esc_html__( 'Rated %1$s out of 5 from %2$s reviews', 'palmtreesurf' ),
							esc_html( $pt_rating ),
							esc_html( number_format_i18n( $pt_reviews ) )
						);
						?>
					</span>
				</span>
			<?php endif; ?>
		</div>

		<div class="card__body">
			<h3 class="card__title"><?php the_title(); ?></h3>

			<?php if ( has_excerpt() ) : ?>
				<p class="card__text"><?php echo esc_html( get_the_excerpt() ); ?></p>
			<?php endif; ?>

			<p class="card__meta">
				<?php if ( $pt_price ) : ?>
					<span class="card__price">
						<?php
						printf(
							/* translators: %s: formatted price. */
							esc_html__( 'From $%s', 'palmtreesurf' ),
							esc_html( trim( $pt_price . ' ' . $pt_suffix ) )
						);
						?>
					</span>
				<?php endif; ?>

				<?php if ( $pt_duration ) : ?>
					<span class="card__duration"><?php echo esc_html( $pt_duration ); ?></span>
				<?php endif; ?>

				<?php if ( $pt_level && ! is_wp_error( $pt_level ) ) : ?>
					<span class="card__level"><?php echo esc_html( wp_strip_all_tags( $pt_level ) ); ?></span>
				<?php endif; ?>
			</p>
		</div>
	</a>
</article>
