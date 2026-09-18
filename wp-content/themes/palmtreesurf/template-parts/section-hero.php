<?php
/**
 * Front page hero. Every string comes from the Customizer.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pts_heading = pts_mod( 'pts_hero_heading' );
if ( ! $pts_heading ) {
	$pts_heading = get_bloginfo( 'name' );
}

$pts_eyebrow  = pts_mod( 'pts_hero_eyebrow' );
$pts_text     = pts_mod( 'pts_hero_text' );
$pts_cta_text = pts_mod( 'pts_hero_cta_text' );
$pts_cta_url  = pts_mod( 'pts_hero_cta_url' );
$pts_image_id = (int) get_theme_mod( 'pts_hero_image', 0 );

if ( ! $pts_cta_url ) {
	$pts_cta_url = pts_booking_url();
}
?>
<section class="hero<?php echo $pts_image_id ? ' hero--has-image' : ''; ?>">
	<?php if ( $pts_image_id ) : ?>
		<div class="hero__media">
			<?php
			echo wp_get_attachment_image(
				$pts_image_id,
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
		<?php if ( $pts_eyebrow ) : ?>
			<p class="hero__eyebrow"><?php echo esc_html( $pts_eyebrow ); ?></p>
		<?php endif; ?>

		<h1 class="hero__title"><?php echo esc_html( $pts_heading ); ?></h1>

		<?php if ( $pts_text ) : ?>
			<p class="hero__text"><?php echo esc_html( $pts_text ); ?></p>
		<?php endif; ?>

		<?php if ( $pts_cta_text ) : ?>
			<p class="hero__actions">
				<a class="btn btn--primary btn--large" href="<?php echo esc_url( $pts_cta_url ); ?>">
					<?php echo esc_html( $pts_cta_text ); ?>
				</a>
			</p>
		<?php endif; ?>
	</div>
</section>
