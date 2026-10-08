<?php
/**
 * Homepage global network section on the map background.
 *
 * @package NetworkIP
 */

$networkip_content = networkip_home_content();
?>
<section class="nip-section nip-network" id="global-calling" aria-labelledby="network-title">
	<div class="nip-network__media" aria-hidden="true">
		<?php networkip_picture( 'network-map', 'nip-network__img', false, 2560, 1024 ); ?>
	</div>
	<div class="nip-wrap nip-network__inner">
		<div class="nip-split">
			<div class="nip-split__main">
				<?php networkip_section_heading( $networkip_content['network_heading'], 'network-title' ); ?>
				<a class="nip-btn nip-btn--ghost" href="<?php echo esc_url( networkip_url( '/international-calling/' ) ); ?>"><?php esc_html_e( 'Explore International Calling', 'networkip' ); ?></a>
			</div>
			<ul class="nip-stack nip-split__aside" role="list">
				<?php foreach ( $networkip_content['network_panels'] as $networkip_panel ) : ?>
					<li class="nip-panel nip-panel--row">
						<?php networkip_icon( $networkip_panel['icon'], 48 ); ?>
						<div>
							<h3><?php echo esc_html( $networkip_panel['title'] ); ?></h3>
							<p><?php echo esc_html( $networkip_panel['text'] ); ?></p>
						</div>
					</li>
				<?php endforeach; ?>
			</ul>
		</div>

		<?php if ( ! empty( $networkip_content['network_stats'] ) ) : ?>
			<dl class="nip-stats">
				<?php foreach ( $networkip_content['network_stats'] as $networkip_stat ) : ?>
					<div class="nip-stat">
						<dt><?php echo esc_html( $networkip_stat['label'] ); ?></dt>
						<dd><?php echo esc_html( $networkip_stat['value'] ); ?></dd>
					</div>
				<?php endforeach; ?>
			</dl>
			<?php if ( ! empty( $networkip_content['network_footnote'] ) ) : ?>
				<p class="nip-footnote"><?php echo esc_html( $networkip_content['network_footnote'] ); ?></p>
			<?php endif; ?>
		<?php endif; ?>
	</div>
</section>
