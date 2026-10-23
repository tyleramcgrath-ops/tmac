<?php
/**
 * Three-step "how booking works" strip.
 *
 * Shared by the about page and the contact page, because it answers the same
 * question in both places: what actually happens after I send this.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_steps = pt_about_steps();

if ( ! $pt_steps ) {
	return;
}
?>
<section class="section how-it-works">
	<div class="container">
		<header class="section__header">
			<p class="eyebrow"><?php esc_html_e( 'How it works', 'palmtreesurf' ); ?></p>
			<h2 class="section__title"><?php esc_html_e( 'Booking takes three steps', 'palmtreesurf' ); ?></h2>
		</header>

		<ol class="steps" data-reveal-group>
			<?php foreach ( $pt_steps as $pt_index => $pt_step ) : ?>
				<li class="step" data-reveal>
					<span class="step__number"><?php echo esc_html( number_format_i18n( $pt_index + 1 ) ); ?></span>
					<h3 class="step__title"><?php echo esc_html( $pt_step[0] ); ?></h3>
					<p class="step__text"><?php echo esc_html( $pt_step[1] ); ?></p>
				</li>
			<?php endforeach; ?>
		</ol>
	</div>
</section>
