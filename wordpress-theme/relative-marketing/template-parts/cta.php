<?php
/**
 * Reusable closing CTA band.
 *
 * @package rma
 */
?>
<section class="section section--tight">
	<div class="container">
		<div class="cta-band">
			<div class="cta-left">
				<h2><?php esc_html_e( "Let's build what's next.", 'rma' ); ?></h2>
				<p><?php esc_html_e( 'The future belongs to brands that grow. Start your growth plan today.', 'rma' ); ?></p>
				<div><a class="btn btn--light" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Start Your Growth Plan', 'rma' ); ?></a></div>
			</div>
			<div class="cta-right"><?php echo rma_brand_mark( true ); // phpcs:ignore ?></div>
		</div>
	</div>
</section>
