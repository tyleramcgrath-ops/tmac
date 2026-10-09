<?php
/**
 * Strip under the hero naming the US MNOs NetworkIP connects to directly.
 * Uses the carrier names from Customize -> NetworkIP Homepage -> Carriers.
 *
 * @package NetworkIP
 */

$networkip_carriers = networkip_split_list( networkip_mod( 'about_carriers' ) );
if ( ! $networkip_carriers ) {
	return;
}
?>
<section class="nip-carrier-strip" aria-labelledby="carrier-strip-title">
	<div class="nip-wrap">
		<h2 class="nip-carrier-strip__label" id="carrier-strip-title"><?php esc_html_e( 'Direct connections with the major US mobile operators', 'networkip' ); ?></h2>
		<ul class="nip-carrier-strip__list" role="list">
			<?php foreach ( $networkip_carriers as $networkip_carrier ) : ?>
				<li><?php echo esc_html( $networkip_carrier ); ?></li>
			<?php endforeach; ?>
		</ul>
	</div>
</section>
