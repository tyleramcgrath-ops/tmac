<?php
/**
 * Homepage hero: white, with the gold globe on the right.
 *
 * @package NetworkIP
 */

$networkip_arrow = '<svg class="nip-btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
?>
<section class="nip-hero" aria-labelledby="hero-title">
	<div class="nip-hero__media" aria-hidden="true">
		<?php networkip_webp( 'hero-globe-gold', array( 960, 1600, 1920 ), 'nip-hero__img', true, 1920, 1080, '(max-width: 1100px) 150vw, 84vw' ); ?>
	</div>
	<div class="nip-wrap nip-hero__content">
		<div class="nip-hero__copy">
			<?php if ( networkip_mod( 'hero_eyebrow' ) ) : ?>
				<p class="nip-kicker"><?php echo esc_html( networkip_mod( 'hero_eyebrow' ) ); ?></p>
			<?php endif; ?>
			<h1 id="hero-title"><?php echo networkip_highlight( networkip_mod( 'hero_title' ), networkip_mod( 'hero_title_highlight' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in networkip_highlight(). ?></h1>
			<p class="nip-hero__text"><?php echo esc_html( networkip_mod( 'hero_text' ) ); ?></p>

			<div class="nip-actions">
				<?php if ( networkip_mod( 'hero_primary_label' ) ) : ?>
					<a class="nip-btn nip-btn--primary" href="<?php echo esc_url( networkip_url( networkip_mod( 'hero_primary_url' ) ) ); ?>"><?php echo esc_html( networkip_mod( 'hero_primary_label' ) ); ?> <?php echo $networkip_arrow; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></a>
				<?php endif; ?>
				<?php if ( networkip_mod( 'hero_secondary_label' ) ) : ?>
					<a class="nip-btn nip-btn--ghost" href="<?php echo esc_url( networkip_url( networkip_mod( 'hero_secondary_url' ) ) ); ?>"><?php echo esc_html( networkip_mod( 'hero_secondary_label' ) ); ?></a>
				<?php endif; ?>
			</div>
		</div>
		<?php networkip_side_words( networkip_mod( 'hero_side_words' ), 'nip-hero__words' ); ?>
	</div>
</section>
