<?php
/**
 * Package card used by the front page and the packages archive.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pts_price    = get_post_meta( get_the_ID(), '_pts_price', true );
$pts_suffix   = get_post_meta( get_the_ID(), '_pts_price_suffix', true );
$pts_duration = get_post_meta( get_the_ID(), '_pts_duration', true );
?>
<article <?php post_class( 'package-card' ); ?>>
	<a class="package-card__link" href="<?php the_permalink(); ?>">
		<?php if ( has_post_thumbnail() ) : ?>
			<figure class="package-card__media">
				<?php the_post_thumbnail( 'pts-card', array( 'loading' => 'lazy' ) ); ?>
			</figure>
		<?php endif; ?>

		<div class="package-card__body">
			<h3 class="package-card__title"><?php the_title(); ?></h3>

			<?php if ( has_excerpt() ) : ?>
				<p class="package-card__text"><?php echo esc_html( get_the_excerpt() ); ?></p>
			<?php endif; ?>

			<p class="package-card__meta">
				<?php if ( $pts_price ) : ?>
					<span class="package-card__price">
						<?php
						printf(
							/* translators: %s: formatted price, e.g. $85 per person. */
							esc_html__( 'From %s', 'palmtreesurf' ),
							esc_html( trim( '$' . $pts_price . ' ' . $pts_suffix ) )
						);
						?>
					</span>
				<?php endif; ?>

				<?php if ( $pts_duration ) : ?>
					<span class="package-card__duration"><?php echo esc_html( $pts_duration ); ?></span>
				<?php endif; ?>
			</p>
		</div>
	</a>
</article>
