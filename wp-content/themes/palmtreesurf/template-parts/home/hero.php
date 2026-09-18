<?php
/**
 * Homepage hero (section 6.1).
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_eyebrow = pt_filled( 'pt_hero_eyebrow' );
$pt_heading = pt_filled( 'pt_hero_heading' );
$pt_accent  = pt_filled( 'pt_hero_heading_accent' );
$pt_text    = pt_filled( 'pt_hero_text' );
$pt_video   = pt_filled( 'pt_hero_video_url' );
?>
<section class="hero" data-reveal-group>
	<div class="hero__media">
		<?php if ( $pt_video ) : ?>
			<?php // Poster carries the LCP; the video only loads above 768px via CSS. ?>
			<video class="hero__video" autoplay muted loop playsinline preload="metadata" poster="<?php echo esc_url( pt_hero_poster_url() ); ?>">
				<source src="<?php echo esc_url( $pt_video ); ?>" type="video/mp4" />
			</video>
		<?php else : ?>
			<?php pt_image( 'hero-home', array( 'priority' => true, 'class' => 'hero__image' ) ); ?>
		<?php endif; ?>
	</div>

	<div class="hero__inner container">
		<?php if ( $pt_eyebrow ) : ?>
			<p class="hero__eyebrow" data-reveal><?php echo esc_html( $pt_eyebrow ); ?></p>
		<?php endif; ?>

		<h1 class="hero__title" data-reveal>
			<?php echo esc_html( $pt_heading ? $pt_heading : get_bloginfo( 'name' ) ); ?>
			<?php if ( $pt_accent ) : ?>
				<span class="hero__accent"><?php echo esc_html( $pt_accent ); ?></span>
			<?php endif; ?>
		</h1>

		<?php if ( $pt_text ) : ?>
			<p class="hero__text" data-reveal><?php echo esc_html( $pt_text ); ?></p>
		<?php endif; ?>

		<p class="hero__actions" data-reveal>
			<?php
			pt_booking_button(
				array(
					'label'    => pt_filled( 'pt_hero_cta_text' ) ? pt_filled( 'pt_hero_cta_text' ) : __( 'Book Your Session', 'palmtreesurf' ),
					'location' => 'hero',
					'class'    => 'btn btn--primary btn--lg',
				)
			);
			?>
			<a class="btn btn--ghost btn--lg" href="<?php echo esc_url( get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>">
				<?php esc_html_e( 'View Experiences', 'palmtreesurf' ); ?>
			</a>
		</p>

		<?php
		$pt_trust = array_filter(
			array(
				pt_filled( 'pt_years' ) ? sprintf( /* translators: %s: number of years. */ __( '%s years in Tamarindo', 'palmtreesurf' ), pt_filled( 'pt_years' ) ) : '',
				pt_filled( 'pt_cert_body' ) ? pt_filled( 'pt_cert_body' ) : '',
				pt_filled( 'pt_rating' ) && pt_filled( 'pt_review_count' )
					? sprintf(
						/* translators: 1: rating, 2: review count. */
						__( '%1$s stars from %2$s reviews', 'palmtreesurf' ),
						pt_filled( 'pt_rating' ),
						pt_filled( 'pt_review_count' )
					)
					: '',
			)
		);
		?>
		<?php if ( $pt_trust ) : ?>
			<ul class="hero__trust" data-reveal>
				<?php foreach ( $pt_trust as $pt_item ) : ?>
					<li><?php echo esc_html( $pt_item ); ?></li>
				<?php endforeach; ?>
			</ul>
		<?php endif; ?>
	</div>
</section>
