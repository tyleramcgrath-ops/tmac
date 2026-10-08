<?php
/**
 * Next open dates for an experience.
 *
 * Reads live availability from the booking plugin, so it can never advertise a
 * date that is full or outside the season. Renders nothing at all if the plugin
 * is inactive or the experience has no open dates — better silence than a
 * promise the calendar cannot keep.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'ptb_open_dates' ) ) {
	return;
}

$pt_exp_id = isset( $args['post_id'] ) ? (int) $args['post_id'] : get_the_ID();
$pt_dates  = ptb_open_dates( $pt_exp_id, '', 21 );

if ( ! $pt_dates ) {
	return;
}

$pt_dates = array_slice( $pt_dates, 0, 5 );
?>
<div class="availability">
	<p class="availability__label">
		<span class="availability__dot" aria-hidden="true"></span>
		<?php esc_html_e( 'Next available', 'palmtreesurf' ); ?>
	</p>

	<ul class="availability__dates">
		<?php foreach ( $pt_dates as $pt_date ) : ?>
			<?php
			$pt_ts    = strtotime( $pt_date );
			$pt_slots = ptb_slots_for_date( $pt_exp_id, $pt_date );
			$pt_left  = 0;

			foreach ( $pt_slots as $pt_slot ) {
				$pt_left += (int) $pt_slot['remaining'];
			}
			?>
			<li class="availability__date">
				<a href="#booking" data-cta-location="availability-chip">
					<span class="availability__day"><?php echo esc_html( date_i18n( 'D', $pt_ts ) ); ?></span>
					<span class="availability__num"><?php echo esc_html( date_i18n( 'j', $pt_ts ) ); ?></span>
					<span class="availability__mon"><?php echo esc_html( date_i18n( 'M', $pt_ts ) ); ?></span>
					<?php // Only ever shown when the number is real and genuinely low. ?>
					<?php if ( $pt_left > 0 && $pt_left <= 3 ) : ?>
						<span class="availability__left">
							<?php
							printf(
								/* translators: %d: number of remaining places. */
								esc_html( _n( '%d left', '%d left', $pt_left, 'palmtreesurf' ) ),
								(int) $pt_left
							);
							?>
						</span>
					<?php endif; ?>
				</a>
			</li>
		<?php endforeach; ?>
	</ul>

	<p class="availability__note"><?php esc_html_e( 'Pick any date in the form below — these are just the soonest.', 'palmtreesurf' ); ?></p>
</div>
