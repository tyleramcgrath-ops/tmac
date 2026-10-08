<?php
/**
 * Lifestyle close — approved mockup.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_heading = pt_filled( 'pt_lifestyle_heading' );
$pt_text    = pt_filled( 'pt_lifestyle_text' );
$pt_script  = pt_filled( 'pt_lifestyle_script' );
$pt_label   = pt_filled( 'pt_lifestyle_cta_text' );
$pt_url     = pt_filled( 'pt_lifestyle_cta_url' );

if ( ! $pt_heading ) {
	return;
}
?>
<section class="lifestyle">
	<div class="lifestyle__media" aria-hidden="true">
		<?php pt_image( 'cta-bg' ); ?>
	</div>

	<div class="container lifestyle__inner" data-reveal>
		<h2 class="lifestyle__title"><?php echo esc_html( $pt_heading ); ?></h2>

		<?php if ( $pt_text ) : ?>
			<p class="lifestyle__text"><?php echo esc_html( $pt_text ); ?></p>
		<?php endif; ?>

		<?php if ( $pt_label ) : ?>
			<p>
				<a class="btn btn--ghost" href="<?php echo esc_url( $pt_url ? $pt_url : get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>" data-cta-location="lifestyle">
					<?php echo esc_html( $pt_label ); ?>
				</a>
			</p>
		<?php endif; ?>

		<?php if ( $pt_script ) : ?>
			<p class="lifestyle__script"><?php echo esc_html( $pt_script ); ?></p>
		<?php endif; ?>
	</div>
</section>
