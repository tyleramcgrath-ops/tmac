<?php
/**
 * "Bridging People" section: text on the left, a photo of someone on a call on the right.
 * Text and photo: Customize -> NetworkIP Homepage -> Photo section.
 *
 * @package NetworkIP
 */

$networkip_photo = networkip_mod( 'bridge_image' );
?>
<section class="nip-bridge" aria-labelledby="bridge-title">
	<div class="nip-bridge__inner">
		<div class="nip-bridge__copy">
			<?php if ( networkip_mod( 'bridge_eyebrow' ) ) : ?>
				<p class="nip-kicker nip-kicker--red"><?php echo esc_html( networkip_mod( 'bridge_eyebrow' ) ); ?></p>
			<?php endif; ?>
			<h2 id="bridge-title"><?php echo networkip_highlight( networkip_mod( 'bridge_title' ), networkip_mod( 'bridge_title_highlight' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in networkip_highlight(). ?></h2>
			<?php if ( networkip_mod( 'bridge_text' ) ) : ?>
				<p><?php echo esc_html( networkip_mod( 'bridge_text' ) ); ?></p>
			<?php endif; ?>
			<?php if ( networkip_mod( 'bridge_button_label' ) ) : ?>
				<a class="nip-btn nip-btn--primary" href="<?php echo esc_url( networkip_url( networkip_mod( 'bridge_button_url' ) ) ); ?>"><?php echo esc_html( networkip_mod( 'bridge_button_label' ) ); ?> <svg class="nip-btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
			<?php endif; ?>
		</div>
		<div class="nip-bridge__photo">
			<?php
			if ( $networkip_photo ) {
				printf( '<img class="nip-bridge__img" src="%s" alt="" loading="lazy" decoding="async">', esc_url( $networkip_photo ) );
			} else {
				networkip_webp( 'bridge-call', array( 960, 1600 ), 'nip-bridge__img', false, 1600, 900, '(max-width: 1100px) 100vw, 58vw' );
			}
			networkip_side_words( networkip_mod( 'bridge_side_words' ), 'nip-side-words--light' );
			?>
		</div>
	</div>
</section>
