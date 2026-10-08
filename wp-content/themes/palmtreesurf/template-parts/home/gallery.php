<?php
/**
 * Photo gallery.
 *
 * Uniform tiles with a lightbox. The tile loads a card-sized crop and carries
 * the full-size URL on the trigger, so the grid stays light and the enlarged
 * view is still sharp.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_images = isset( $args['images'] ) ? $args['images'] : pt_gallery_images();

// Nothing real to show, so nothing renders (section 7.10).
if ( count( $pt_images ) < 2 ) {
	return;
}

$pt_heading = isset( $args['heading'] ) ? $args['heading'] : __( 'Real days, real guests', 'palmtreesurf' );
$pt_eyebrow = isset( $args['eyebrow'] ) ? $args['eyebrow'] : __( 'On the water', 'palmtreesurf' );
?>
<section class="section gallery" aria-label="<?php esc_attr_e( 'Photo gallery', 'palmtreesurf' ); ?>">
	<div class="container">
		<header class="section__header" data-reveal>
			<p class="eyebrow"><?php echo esc_html( $pt_eyebrow ); ?></p>
			<h2 class="section__title"><?php echo esc_html( $pt_heading ); ?></h2>
		</header>

		<ul class="gallery__grid" data-pt-gallery>
			<?php foreach ( $pt_images as $pt_index => $pt_image ) : ?>
				<li class="gallery__item">
					<button
						class="gallery__trigger"
						type="button"
						data-pt-lightbox="<?php echo esc_attr( $pt_index ); ?>"
						data-pt-full="<?php echo esc_url( $pt_image['full'] ); ?>"
						data-pt-alt="<?php echo esc_attr( $pt_image['alt'] ); ?>"
						aria-label="<?php
							echo esc_attr(
								$pt_image['alt']
									? sprintf(
										/* translators: %s: image description. */
										__( 'Enlarge: %s', 'palmtreesurf' ),
										$pt_image['alt']
									)
									: __( 'Enlarge image', 'palmtreesurf' )
							);
						?>"
					>
						<?php pt_gallery_thumb( $pt_image, 0 === $pt_index ); ?>
					</button>
				</li>
			<?php endforeach; ?>
		</ul>

		<p class="gallery__note"><?php esc_html_e( 'Select any photo to view it full size.', 'palmtreesurf' ); ?></p>
	</div>
</section>
