<?php
/**
 * Trust bar (section 6.2). Overlaps the hero edge.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_items = array(
	array( 'icon' => 'shield', 'label' => __( 'Certified instructors', 'palmtreesurf' ) ),
	array( 'icon' => 'board', 'label' => __( 'All gear included', 'palmtreesurf' ) ),
	array( 'icon' => 'group', 'label' => __( 'Small group ratio', 'palmtreesurf' ) ),
	array( 'icon' => 'camera', 'label' => __( 'Free photos of your session', 'palmtreesurf' ) ),
);
?>
<section class="trust-bar" aria-label="<?php esc_attr_e( 'Why book with us', 'palmtreesurf' ); ?>">
	<div class="container">
		<ul class="trust-bar__list" data-reveal-group>
			<?php foreach ( $pt_items as $pt_item ) : ?>
				<li class="trust-bar__item" data-reveal>
					<?php pt_icon( $pt_item['icon'], 'trust-bar__icon' ); ?>
					<span class="trust-bar__label"><?php echo esc_html( $pt_item['label'] ); ?></span>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
</section>
