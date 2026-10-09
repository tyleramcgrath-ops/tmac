<?php
/**
 * Homepage technology cards and capacity figures.
 *
 * @package NetworkIP
 */

$networkip_content = networkip_home_content();
?>
<section class="nip-section nip-section--alt nip-tech" id="technology" aria-labelledby="tech-title">
	<div class="nip-wrap">
		<div class="nip-heading nip-heading--row">
			<div>
				<?php networkip_section_heading( $networkip_content['tech_heading'], 'tech-title' ); ?>
			</div>
			<a class="nip-link" href="<?php echo esc_url( networkip_url( '/technology/' ) ); ?>"><?php esc_html_e( 'View technology', 'networkip' ); ?> <span aria-hidden="true">→</span></a>
		</div>

		<ol class="nip-grid nip-grid--3" role="list">
			<?php foreach ( $networkip_content['tech_cards'] as $networkip_i => $networkip_card ) : ?>
				<li class="nip-card nip-card--tech">
					<span class="nip-card__index" aria-hidden="true"><?php echo esc_html( str_pad( (string) ( $networkip_i + 1 ), 2, '0', STR_PAD_LEFT ) ); ?></span>
					<h3><?php echo esc_html( $networkip_card['title'] ); ?></h3>
					<p><?php echo esc_html( $networkip_card['text'] ); ?></p>
				</li>
			<?php endforeach; ?>
		</ol>

		<?php if ( ! empty( $networkip_content['tech_stats'] ) ) : ?>
			<dl class="nip-stats nip-stats--boxed">
				<?php foreach ( $networkip_content['tech_stats'] as $networkip_stat ) : ?>
					<div class="nip-stat">
						<dt><?php echo esc_html( $networkip_stat['label'] ); ?></dt>
						<dd><?php echo esc_html( $networkip_stat['value'] ); ?></dd>
					</div>
				<?php endforeach; ?>
			</dl>
			<?php if ( ! empty( $networkip_content['tech_footnote'] ) ) : ?>
				<p class="nip-footnote"><?php echo esc_html( $networkip_content['tech_footnote'] ); ?></p>
			<?php endif; ?>
		<?php endif; ?>
	</div>
</section>
