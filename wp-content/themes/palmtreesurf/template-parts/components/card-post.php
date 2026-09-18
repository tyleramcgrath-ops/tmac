<?php
/**
 * Journal post card.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_minutes = pt_reading_time( get_post_field( 'post_content', get_the_ID() ) );
$pt_cats    = get_the_category();
?>
<article <?php post_class( 'card card--post' ); ?>>
	<a class="card__link" href="<?php the_permalink(); ?>">
		<div class="card__media">
			<?php if ( has_post_thumbnail() ) : ?>
				<?php the_post_thumbnail( 'pt-card', array( 'loading' => 'lazy', 'decoding' => 'async' ) ); ?>
			<?php else : ?>
				<?php pt_image( 'story-banner' ); ?>
			<?php endif; ?>

			<?php if ( $pt_cats ) : ?>
				<span class="card__badge"><?php echo esc_html( $pt_cats[0]->name ); ?></span>
			<?php endif; ?>
		</div>

		<div class="card__body">
			<h2 class="card__title"><?php the_title(); ?></h2>

			<?php if ( has_excerpt() ) : ?>
				<p class="card__text"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 26 ) ); ?></p>
			<?php endif; ?>

			<p class="card__meta">
				<span class="card__duration">
					<time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
				</span>
				<?php if ( $pt_minutes ) : ?>
					<span class="card__level">
						<?php
						printf(
							/* translators: %s: number of minutes. */
							esc_html( _n( '%s min read', '%s min read', $pt_minutes, 'palmtreesurf' ) ),
							esc_html( number_format_i18n( $pt_minutes ) )
						);
						?>
					</span>
				<?php endif; ?>
			</p>
		</div>
	</a>
</article>
