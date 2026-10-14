<?php
/**
 * Sanctuary card used in grids. Expects to run inside The Loop.
 *
 * @package WeHaveRehabs
 */

$stay    = whr_stay_text();
$claimed = whr_is_claimed();
?>
<a class="card<?php echo $claimed ? '' : ' card--public'; ?>" href="<?php the_permalink(); ?>">
	<span class="card__media">
		<?php echo whr_post_image( null, 'whr-card', array( 'alt' => '' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by core image functions. ?>
		<?php echo whr_care_badge(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helper. ?>
		<?php if ( whr_meta( 'sponsored' ) ) : ?>
			<span class="badge badge--sponsored"><?php esc_html_e( 'Sponsored', 'wehaverehabs' ); ?></span>
		<?php endif; ?>
	</span>
	<span class="card__kicker"><?php echo esc_html( whr_location() ); ?></span>
	<span class="card__title"><?php the_title(); ?></span>
	<?php if ( has_excerpt() ) : ?>
		<span class="card__text"><?php echo esc_html( get_the_excerpt() ); ?></span>
	<?php endif; ?>
	<span class="card__meta">
		<?php
		if ( ! $claimed ) {
			esc_html_e( 'Public listing · Unclaimed', 'wehaverehabs' );
		} else {
			if ( $stay ) {
				echo esc_html( $stay ) . ' · ';
			}
			echo whr_price_html(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helper.
		}
		?>
	</span>
</a>
