<?php
/**
 * Split feature (section 6.4). Reusable; pass reverse to flip the sides.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_args = wp_parse_args(
	isset( $args ) ? $args : array(),
	array(
		'reverse'      => false,
		'eyebrow'      => '',
		'title'        => '',
		'paragraphs'   => array(),
		'checklist'    => array(),
		'cta_label'    => '',
		'cta_url'      => '',
		'slot_primary' => 'split-1-primary',
		'slot_offset'  => 'split-1-offset',
	)
);

if ( ! $pt_args['title'] ) {
	return;
}
?>
<section class="section split<?php echo $pt_args['reverse'] ? ' split--reverse' : ''; ?>">
	<div class="container split__inner" data-reveal-group>
		<div class="split__media" data-reveal>
			<div class="split__primary">
				<?php pt_image( $pt_args['slot_primary'] ); ?>
			</div>
			<?php if ( pt_image_exists( $pt_args['slot_offset'] ) ) : ?>
				<div class="split__offset">
					<?php pt_image( $pt_args['slot_offset'] ); ?>
				</div>
			<?php endif; ?>
		</div>

		<div class="split__body" data-reveal>
			<?php if ( $pt_args['eyebrow'] ) : ?>
				<p class="eyebrow"><?php echo esc_html( $pt_args['eyebrow'] ); ?></p>
			<?php endif; ?>

			<h2 class="split__title"><?php echo esc_html( $pt_args['title'] ); ?></h2>

			<?php foreach ( $pt_args['paragraphs'] as $pt_paragraph ) : ?>
				<p><?php echo esc_html( $pt_paragraph ); ?></p>
			<?php endforeach; ?>

			<?php if ( $pt_args['checklist'] ) : ?>
				<ul class="checklist">
					<?php foreach ( $pt_args['checklist'] as $pt_item ) : ?>
						<li><?php echo esc_html( $pt_item ); ?></li>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>

			<?php if ( $pt_args['cta_label'] ) : ?>
				<p>
					<a class="btn btn--secondary" href="<?php echo esc_url( $pt_args['cta_url'] ? $pt_args['cta_url'] : pt_booking_url() ); ?>" data-cta-location="split-feature">
						<?php echo esc_html( $pt_args['cta_label'] ); ?>
					</a>
				</p>
			<?php endif; ?>
		</div>
	</div>
</section>
