<?php
/**
 * Gallery strip (section 6.5). Full-bleed, snap-scrolls on mobile.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_slots = array();

for ( $pt_i = 1; $pt_i <= 6; $pt_i++ ) {
	$pt_slot = 'gallery-' . $pt_i;
	if ( pt_image_exists( $pt_slot ) ) {
		$pt_slots[] = $pt_slot;
	}
}

// Nothing real to show, so nothing renders (section 7.10).
if ( count( $pt_slots ) < 2 ) {
	return;
}
?>
<section class="section section--flush gallery" aria-label="<?php esc_attr_e( 'Photo gallery', 'palmtreesurf' ); ?>">
	<div class="container">
		<header class="section__header" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'On the water', 'palmtreesurf' ); ?></p>
			<h2 class="section__title"><?php esc_html_e( 'Real days, real guests', 'palmtreesurf' ); ?></h2>
		</header>
	</div>

	<ul class="gallery__grid" data-pt-gallery>
		<?php foreach ( $pt_slots as $pt_index => $pt_slot ) : ?>
			<li class="gallery__item">
				<button
					class="gallery__trigger"
					type="button"
					data-pt-lightbox="<?php echo esc_attr( $pt_index ); ?>"
					aria-label="<?php esc_attr_e( 'Open image', 'palmtreesurf' ); ?>"
				>
					<?php pt_image( $pt_slot, array( 'priority' => 0 === $pt_index ) ); ?>
				</button>
			</li>
		<?php endforeach; ?>
	</ul>
</section>
