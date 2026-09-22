<?php
/**
 * The ways one tour can be booked.
 *
 * A charter sold as a full, three-quarter or half day is three prices and
 * three sets of inclusions, and a customer deciding between them needs to see
 * what actually differs — otherwise the only way to find out that the half day
 * is a sandwich rather than lunch is to ask.
 *
 * Renders nothing for a tour sold one way, which is most of them.
 *
 * @package PalmTreeSurf
 */

$pt_id      = isset( $args['id'] ) ? (int) $args['id'] : get_the_ID();
$pt_options = function_exists( 'ptb_options' ) ? ptb_options( $pt_id ) : array();

if ( ! $pt_options ) {
	return;
}
?>

<section class="trip-options">
	<h2><?php esc_html_e( 'Ways to book this', 'palmtreesurf' ); ?></h2>

	<div class="trip-options__grid">
		<?php foreach ( $pt_options as $pt_option ) : ?>
			<?php
			$pt_price_minor = (int) round( (float) $pt_option['price'] * 100 );
			$pt_money       = function_exists( 'ptb_format_money' )
				? ptb_format_money( $pt_price_minor )
				: '$' . number_format_i18n( $pt_price_minor / 100, 2 );
			$pt_includes    = ptb_option_includes( $pt_option );
			?>
			<article class="trip-option">
				<h3 class="trip-option__name">
					<?php echo esc_html( pt_translate_seeded( $pt_option['label'] ) ); ?>
				</h3>

				<p class="trip-option__price">
					<?php echo esc_html( $pt_money ); ?>
					<span>
						<?php
						echo esc_html(
							'flat' === $pt_option['mode']
								? __( 'for the trip', 'palmtreesurf' )
								: __( 'per person', 'palmtreesurf' )
						);
						?>
					</span>
				</p>

				<?php if ( '' !== $pt_option['duration'] || '' !== $pt_option['max'] ) : ?>
					<p class="trip-option__meta">
						<?php
						$pt_meta = array();

						/*
						 * "Full day · Up to 5 guests" under a card already
						 * titled Full day says nothing, so a duration that
						 * repeats the option name is left out.
						 */
						if ( '' !== $pt_option['duration'] && $pt_option['duration'] !== $pt_option['label'] ) {
							$pt_meta[] = pt_translate_seeded( $pt_option['duration'] );
						}

						if ( '' !== $pt_option['max'] ) {
							$pt_meta[] = sprintf(
								/* translators: %d: maximum number of guests. */
								_n( 'Up to %d guest', 'Up to %d guests', (int) $pt_option['max'], 'palmtreesurf' ),
								(int) $pt_option['max']
							);
						}

						echo esc_html( implode( ' · ', $pt_meta ) );
						?>
					</p>
				<?php endif; ?>

				<?php if ( $pt_includes ) : ?>
					<ul class="trip-option__includes">
						<?php foreach ( $pt_includes as $pt_line ) : ?>
							<li><?php echo esc_html( pt_translate_seeded( $pt_line ) ); ?></li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
			</article>
		<?php endforeach; ?>
	</div>

	<p class="trip-options__note">
		<?php esc_html_e( 'Choose your option on the booking form below and the price updates as you go.', 'palmtreesurf' ); ?>
	</p>
</section>
