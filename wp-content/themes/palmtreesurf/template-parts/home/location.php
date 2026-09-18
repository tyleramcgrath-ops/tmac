<?php
/**
 * Location and conditions (section 6.8).
 *
 * The map uses a facade: a static panel with a button, and the iframe is only
 * injected on click. That keeps a third-party script off the initial load,
 * which protects LCP and avoids setting cookies before consent.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_address = pt_filled( 'pt_address' );
$pt_map     = pt_filled( 'pt_map_embed' );

$pt_conditions = array_filter(
	array(
		__( 'Best season', 'palmtreesurf' )   => pt_filled( 'pt_best_season' ),
		__( 'Wave size', 'palmtreesurf' )     => pt_filled( 'pt_wave_size' ),
		__( 'Water temp', 'palmtreesurf' )    => pt_filled( 'pt_water_temp' ),
	)
);
?>
<section class="section section--alt location" id="location">
	<div class="container location__inner" data-reveal-group>
		<div class="location__body" data-reveal>
			<p class="eyebrow"><?php esc_html_e( 'Where we surf', 'palmtreesurf' ); ?></p>
			<h2 class="section__title"><?php esc_html_e( 'Tamarindo, Guanacaste', 'palmtreesurf' ); ?></h2>
			<p>
				<?php esc_html_e( 'Tamarindo has a long, forgiving sandbar break with a gentle shoulder, which is why it is one of the best places in Costa Rica to stand up for the first time. Warm water year round means no wetsuit and longer sessions.', 'palmtreesurf' ); ?>
			</p>

			<?php if ( $pt_conditions ) : ?>
				<dl class="conditions">
					<?php foreach ( $pt_conditions as $pt_label => $pt_value ) : ?>
						<div class="conditions__row">
							<dt><?php echo esc_html( $pt_label ); ?></dt>
							<dd><?php echo esc_html( $pt_value ); ?></dd>
						</div>
					<?php endforeach; ?>
				</dl>
			<?php endif; ?>

			<?php if ( $pt_address ) : ?>
				<address class="location__address"><?php echo nl2br( esc_html( $pt_address ) ); ?></address>
			<?php endif; ?>
		</div>

		<div class="location__map" data-reveal>
			<?php if ( $pt_map ) : ?>
				<div class="map-facade" data-pt-map-src="<?php echo esc_url( $pt_map ); ?>">
					<div class="map-facade__body">
						<p class="map-facade__title"><?php esc_html_e( 'View the map', 'palmtreesurf' ); ?></p>
						<p class="map-facade__note"><?php esc_html_e( 'Loads Google Maps, which sets its own cookies.', 'palmtreesurf' ); ?></p>
						<button class="btn btn--secondary" type="button" data-pt-map-load>
							<?php esc_html_e( 'Load map', 'palmtreesurf' ); ?>
						</button>
					</div>
				</div>
			<?php else : ?>
				<div class="map-facade map-facade--empty">
					<p class="map-facade__note"><?php esc_html_e( 'Add a map embed URL in Customize → Palm Tree Surf → Contact Details.', 'palmtreesurf' ); ?></p>
				</div>
			<?php endif; ?>
		</div>
	</div>
</section>
