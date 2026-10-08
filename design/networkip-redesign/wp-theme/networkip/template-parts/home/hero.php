<?php
/**
 * Homepage hero.
 *
 * @package NetworkIP
 */

$networkip_chips = networkip_split_list( networkip_mod( 'hero_chips' ) );
?>
<section class="nip-hero" aria-labelledby="hero-title">
	<div class="nip-hero__media" aria-hidden="true">
		<?php networkip_picture( 'hero-globe', 'nip-hero__img', true, 2560, 1440 ); ?>
	</div>
	<div class="nip-wrap nip-hero__content">
		<?php if ( networkip_mod( 'hero_eyebrow' ) ) : ?>
			<p class="nip-eyebrow"><?php echo esc_html( networkip_mod( 'hero_eyebrow' ) ); ?></p>
		<?php endif; ?>
		<h1 id="hero-title"><?php echo esc_html( networkip_mod( 'hero_title' ) ); ?></h1>
		<p class="nip-hero__text"><?php echo esc_html( networkip_mod( 'hero_text' ) ); ?></p>

		<div class="nip-actions">
			<?php if ( networkip_mod( 'hero_primary_label' ) ) : ?>
				<a class="nip-btn nip-btn--primary" href="<?php echo esc_url( networkip_url( networkip_mod( 'hero_primary_url' ) ) ); ?>"><?php echo esc_html( networkip_mod( 'hero_primary_label' ) ); ?></a>
			<?php endif; ?>
			<?php if ( networkip_mod( 'hero_secondary_label' ) ) : ?>
				<a class="nip-btn nip-btn--ghost" href="<?php echo esc_url( networkip_url( networkip_mod( 'hero_secondary_url' ) ) ); ?>"><?php echo esc_html( networkip_mod( 'hero_secondary_label' ) ); ?></a>
			<?php endif; ?>
		</div>

		<?php if ( $networkip_chips ) : ?>
			<ul class="nip-chips" aria-label="<?php esc_attr_e( 'At a glance', 'networkip' ); ?>">
				<?php foreach ( $networkip_chips as $networkip_chip ) : ?>
					<li><?php echo esc_html( $networkip_chip ); ?></li>
				<?php endforeach; ?>
			</ul>
		<?php endif; ?>
	</div>
</section>
