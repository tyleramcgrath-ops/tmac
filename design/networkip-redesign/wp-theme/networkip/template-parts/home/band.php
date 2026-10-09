<?php
/**
 * Gold band: positioning headline and three features.
 * Text: Customize -> NetworkIP Homepage -> Gold band. Features: inc/content.php.
 *
 * @package NetworkIP
 */

$networkip_content = networkip_home_content();
?>
<section class="nip-band" id="about" aria-labelledby="band-title">
	<div class="nip-band__media" aria-hidden="true">
		<?php networkip_webp( 'band-map', array( 960, 1600 ), 'nip-band__img', false, 1600, 640, '(max-width: 1100px) 100vw, 62vw' ); ?>
	</div>
	<div class="nip-wrap">
		<div class="nip-band__head">
			<div>
				<?php if ( networkip_mod( 'band_eyebrow' ) ) : ?>
					<p class="nip-kicker nip-kicker--red"><?php echo esc_html( networkip_mod( 'band_eyebrow' ) ); ?></p>
				<?php endif; ?>
				<h2 id="band-title"><?php echo networkip_highlight( networkip_mod( 'band_title' ), networkip_mod( 'band_title_highlight' ), 'nip-red' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in networkip_highlight(). ?></h2>
				<?php if ( networkip_mod( 'band_text' ) ) : ?>
					<p class="nip-band__lead"><?php echo esc_html( networkip_mod( 'band_text' ) ); ?></p>
				<?php endif; ?>
			</div>
			<?php networkip_side_words( networkip_mod( 'band_side_words' ), 'nip-side-words--red' ); ?>
		</div>

		<?php if ( ! empty( $networkip_content['band_features'] ) ) : ?>
			<ul class="nip-feats" role="list">
				<?php foreach ( $networkip_content['band_features'] as $networkip_feat ) : ?>
					<li class="nip-feat">
						<?php networkip_icon( $networkip_feat['icon'], 62, 'nip-feat__icon' ); ?>
						<h3><?php echo esc_html( $networkip_feat['title'] ); ?></h3>
						<p><?php echo esc_html( $networkip_feat['text'] ); ?></p>
					</li>
				<?php endforeach; ?>
			</ul>
		<?php endif; ?>
	</div>
</section>
