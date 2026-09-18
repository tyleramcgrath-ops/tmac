<?php
/**
 * Front page hero. Every string comes from the Customizer.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_heading = pt_mod( 'pt_hero_heading' );
if ( ! $pt_heading ) {
	$pt_heading = get_bloginfo( 'name' );
}

$pt_eyebrow  = pt_mod( 'pt_hero_eyebrow' );
$pt_text     = pt_mod( 'pt_hero_text' );
$pt_cta_text = pt_mod( 'pt_hero_cta_text' );
$pt_cta_url  = pt_mod( 'pt_hero_cta_url' );
$pt_image_id = (int) get_theme_mod( 'pt_hero_image', 0 );

if ( ! $pt_cta_url ) {
	$pt_cta_url = pt_booking_url();
}
?>
<section class="hero<?php echo $pt_image_id ? ' hero--has-image' : ''; ?>">
	<?php if ( $pt_image_id ) : ?>
		<div class="hero__media">
			<?php
			echo wp_get_attachment_image(
				$pt_image_id,
				'pts-hero',
				false,
				array(
					'class'    => 'hero__image',
					'loading'  => 'eager',
					'decoding' => 'async',
					'alt'      => '',
				)
			);
			?>
		</div>
	<?php endif; ?>

	<div class="hero__inner container">
		<?php if ( $pt_eyebrow ) : ?>
			<p class="hero__eyebrow"><?php echo esc_html( $pt_eyebrow ); ?></p>
		<?php endif; ?>

		<h1 class="hero__title"><?php echo esc_html( $pt_heading ); ?></h1>

		<?php if ( $pt_text ) : ?>
			<p class="hero__text"><?php echo esc_html( $pt_text ); ?></p>
		<?php endif; ?>

		<?php if ( $pt_cta_text ) : ?>
			<p class="hero__actions">
				<a class="btn btn--primary btn--large" href="<?php echo esc_url( $pt_cta_url ); ?>">
					<?php echo esc_html( $pt_cta_text ); ?>
				</a>
			</p>
		<?php endif; ?>
	</div>
</section>
