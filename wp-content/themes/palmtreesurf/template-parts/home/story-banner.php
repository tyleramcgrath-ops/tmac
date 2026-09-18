<?php
/**
 * Tamarindo story banner — approved mockup.
 *
 * The mockup shows platform proof points (200+ experiences, 5,000+ travellers).
 * Those are comp values, and the brief forbids fabricating them, so each stat is
 * a Customizer field and the block hides when they are empty. The "Watch Our
 * Story" control only renders when a real video URL is set.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_script  = pt_filled( 'pt_story_script' );
$pt_heading = pt_filled( 'pt_story_heading' );
$pt_video   = pt_filled( 'pt_story_video' );

$pt_stats = array_filter(
	array(
		array( pt_filled( 'pt_stat_1_value' ), pt_filled( 'pt_stat_1_label' ), 'check' ),
		array( pt_filled( 'pt_stat_2_value' ), pt_filled( 'pt_stat_2_label' ), 'experts' ),
		array( pt_filled( 'pt_stat_3_value' ), pt_filled( 'pt_stat_3_label' ), 'clock' ),
	),
	function ( $stat ) {
		return '' !== $stat[0] && '' !== $stat[1];
	}
);

if ( ! $pt_heading ) {
	return;
}
?>
<section class="story">
	<div class="story__media" aria-hidden="true">
		<?php pt_image( 'story-banner' ); ?>
	</div>

	<div class="container story__inner" data-reveal-group>
		<div class="story__body" data-reveal>
			<?php if ( $pt_script ) : ?>
				<p class="story__script"><?php echo esc_html( $pt_script ); ?></p>
			<?php endif; ?>

			<h2 class="story__title"><?php echo esc_html( $pt_heading ); ?></h2>

			<?php if ( $pt_video ) : ?>
				<a class="story__play" href="<?php echo esc_url( $pt_video ); ?>" target="_blank" rel="noopener" data-cta-location="story-video">
					<?php echo pt_get_icon( 'play', '', 34 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static SVG. ?>
					<span><?php esc_html_e( 'Watch Our Story', 'palmtreesurf' ); ?></span>
				</a>
			<?php else : ?>
				<a class="btn btn--ghost" href="<?php echo esc_url( get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>" data-cta-location="story-cta">
					<?php esc_html_e( 'Explore Tamarindo', 'palmtreesurf' ); ?>
				</a>
			<?php endif; ?>
		</div>

		<?php if ( $pt_stats ) : ?>
			<ul class="story__stats" data-reveal>
				<?php foreach ( $pt_stats as $pt_stat ) : ?>
					<li class="story__stat">
						<?php echo pt_get_icon( $pt_stat[2], 'story__stat-icon', 22 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static SVG. ?>
						<span class="story__stat-value"><?php echo esc_html( $pt_stat[0] ); ?></span>
						<span class="story__stat-label"><?php echo esc_html( $pt_stat[1] ); ?></span>
					</li>
				<?php endforeach; ?>
			</ul>
		<?php endif; ?>
	</div>
</section>
