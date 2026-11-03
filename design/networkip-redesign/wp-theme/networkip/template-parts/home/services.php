<?php
/**
 * Homepage service cards.
 *
 * @package NetworkIP
 */

$networkip_content = networkip_home_content();
?>
<section class="nip-section nip-services" id="services" aria-labelledby="services-title">
	<div class="nip-wrap">
		<div class="nip-heading">
			<?php networkip_section_heading( $networkip_content['services_heading'], 'services-title' ); ?>
		</div>

		<ul class="nip-grid nip-grid--3" role="list">
			<?php foreach ( $networkip_content['services'] as $networkip_card ) : ?>
				<li class="nip-card">
					<?php networkip_icon( $networkip_card['icon'] ); ?>
					<h3>
						<?php if ( ! empty( $networkip_card['url'] ) ) : ?>
							<a class="nip-card__link" href="<?php echo esc_url( networkip_url( $networkip_card['url'] ) ); ?>"><?php echo esc_html( $networkip_card['title'] ); ?></a>
						<?php else : ?>
							<?php echo esc_html( $networkip_card['title'] ); ?>
						<?php endif; ?>
					</h3>
					<p><?php echo esc_html( $networkip_card['text'] ); ?></p>
					<?php if ( ! empty( $networkip_card['url'] ) ) : ?>
						<span class="nip-card__more" aria-hidden="true"><?php esc_html_e( 'Learn more', 'networkip' ); ?> →</span>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
</section>
