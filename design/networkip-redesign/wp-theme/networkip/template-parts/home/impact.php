<?php
/**
 * "Our impact" figures (inc/content.php, from the public Home and Technology pages).
 *
 * @package NetworkIP
 */

$networkip_content = networkip_home_content();
if ( empty( $networkip_content['impact'] ) ) {
	return;
}
?>
<section class="nip-impact" aria-labelledby="impact-title">
	<div class="nip-wrap nip-impact__inner">
		<h2 class="nip-kicker" id="impact-title"><?php echo esc_html( $networkip_content['impact_title'] ); ?></h2>
		<dl class="nip-impact__list">
			<?php foreach ( $networkip_content['impact'] as $networkip_stat ) : ?>
				<div class="nip-impact__item">
					<dt><?php echo esc_html( $networkip_stat['label'] ); ?></dt>
					<dd><?php echo esc_html( $networkip_stat['value'] ); ?></dd>
				</div>
			<?php endforeach; ?>
		</dl>
	</div>
</section>
