<?php
/**
 * Final call to action (section 6.9).
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;
?>
<section class="cta-band">
	<div class="cta-band__media" aria-hidden="true">
		<?php pt_image( 'cta-bg' ); ?>
	</div>

	<div class="container cta-band__inner" data-reveal>
		<h2 class="cta-band__title"><?php esc_html_e( 'Ready to get in the water?', 'palmtreesurf' ); ?></h2>
		<p class="cta-band__text">
			<?php esc_html_e( 'Tell us your dates and how many are coming. We reply within 24 hours with availability.', 'palmtreesurf' ); ?>
		</p>

		<p class="cta-band__actions">
			<?php
			pt_booking_button(
				array(
					'label'    => __( 'Book Your Session', 'palmtreesurf' ),
					'location' => 'final-cta',
					'class'    => 'btn btn--primary btn--lg',
				)
			);
			?>
		</p>

		<?php
		$pt_wa = pt_whatsapp_url( __( 'Hi! I would like to book an experience.', 'palmtreesurf' ) );
		if ( $pt_wa ) :
			?>
			<p class="cta-band__alt">
				<a href="<?php echo esc_url( $pt_wa ); ?>" rel="noopener" target="_blank" data-cta-location="final-cta-whatsapp">
					<?php esc_html_e( 'Or message us on WhatsApp', 'palmtreesurf' ); ?>
				</a>
			</p>
		<?php endif; ?>
	</div>
</section>
