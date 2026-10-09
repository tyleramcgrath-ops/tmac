<?php
/**
 * Strip under the hero naming the US MNOs NetworkIP connects to directly.
 * Uses the carrier names from Customize -> NetworkIP Homepage -> About.
 *
 * @package NetworkIP
 */

$networkip_carriers = networkip_split_list( networkip_mod( 'about_carriers' ) );
if ( ! $networkip_carriers ) {
	return;
}
?>
<section class="nip-carrier-strip" aria-label="<?php esc_attr_e( 'Direct connections', 'networkip' ); ?>">
	<div class="nip-wrap nip-carrier-strip__inner">
		<p class="nip-carrier-strip__label"><?php esc_html_e( 'Direct connections with the major US MNOs', 'networkip' ); ?></p>
		<ul class="nip-carrier-strip__list" role="list">
			<?php foreach ( $networkip_carriers as $networkip_carrier ) : ?>
				<li><?php echo esc_html( $networkip_carrier ); ?></li>
			<?php endforeach; ?>
		</ul>
	</div>
</section>
