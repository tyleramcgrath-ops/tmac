<?php
/**
 * Experience card (image tile). Use inside the loop or pass args['post'].
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

$p        = isset( $args['post'] ) ? get_post( $args['post'] ) : get_post();
$duration = popeye_exp( 'duration_short', $p->ID );
?>
<a class="exp-tile" href="<?php echo esc_url( get_permalink( $p ) ); ?>">
	<img src="<?php echo esc_url( popeye_exp_image( $p->ID, 'popeye-card' ) ); ?>" alt="<?php echo esc_attr( get_the_title( $p ) ); ?>" loading="lazy">
	<?php if ( $duration ) : ?>
		<span class="exp-tile__badge"><?php popeye_the_icon( 'clock' ); ?> <?php echo esc_html( $duration ); ?></span>
	<?php endif; ?>
	<span class="exp-tile__body">
		<span class="exp-tile__tag"><?php echo esc_html( popeye_exp( 'tagline', $p->ID ) ); ?></span>
		<span class="exp-tile__title"><?php echo esc_html( get_the_title( $p ) ); ?></span>
		<span class="exp-tile__more"><?php esc_html_e( 'Explore', 'popeye-charters' ); ?> &rarr;</span>
	</span>
</a>
