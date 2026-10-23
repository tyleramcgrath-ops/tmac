<?php
/**
 * Renders the sections of a designed page layout (see inc/pages.php).
 *
 * @package NetworkIP
 *
 * @var array $args { sections: array }
 */

$networkip_sections = isset( $args['sections'] ) ? (array) $args['sections'] : array();

foreach ( $networkip_sections as $networkip_i => $networkip_s ) :
	$networkip_type  = isset( $networkip_s['type'] ) ? $networkip_s['type'] : '';
	$networkip_id    = 'section-' . ( $networkip_i + 1 );
	$networkip_class = 'nip-section ' . ( ! empty( $networkip_s['alt'] ) ? 'nip-section--alt' : 'nip-section--plain' ) . ' nip-psec nip-psec--' . sanitize_html_class( $networkip_type );

	if ( 'contact' === $networkip_type ) {
		get_template_part( 'template-parts/home/contact', null, array( 'extra' => isset( $networkip_s['extra'] ) ? $networkip_s['extra'] : array() ) );
		continue;
	}

	$networkip_heading = array(
		'eyebrow' => isset( $networkip_s['eyebrow'] ) ? $networkip_s['eyebrow'] : '',
		'title'   => isset( $networkip_s['title'] ) ? $networkip_s['title'] : '',
		'text'    => isset( $networkip_s['text'] ) ? $networkip_s['text'] : '',
	);
	$networkip_has_heading = $networkip_heading['eyebrow'] || $networkip_heading['title'] || $networkip_heading['text'];
	?>
	<section class="<?php echo esc_attr( $networkip_class ); ?>"<?php echo $networkip_heading['title'] ? ' aria-labelledby="' . esc_attr( $networkip_id ) . '"' : ''; ?>>
		<div class="nip-wrap">
			<?php if ( 'split' === $networkip_type ) : ?>
				<div class="nip-split nip-split--top">
					<div class="nip-split__main">
						<?php networkip_section_heading( array( 'eyebrow' => $networkip_heading['eyebrow'], 'title' => $networkip_heading['title'] ), $networkip_id ); ?>
						<?php foreach ( (array) ( isset( $networkip_s['paragraphs'] ) ? $networkip_s['paragraphs'] : array() ) as $networkip_p ) : ?>
							<p class="nip-lead"><?php echo esc_html( $networkip_p ); ?></p>
						<?php endforeach; ?>
						<?php if ( ! empty( $networkip_s['button'] ) ) : ?>
							<p><a class="nip-btn nip-btn--ghost" href="<?php echo esc_url( networkip_url( $networkip_s['button']['url'] ) ); ?>"><?php echo esc_html( $networkip_s['button']['label'] ); ?></a></p>
						<?php endif; ?>
					</div>
					<?php if ( ! empty( $networkip_s['panel'] ) ) : $networkip_panel = $networkip_s['panel']; ?>
						<aside class="nip-panel nip-split__aside">
							<?php if ( ! empty( $networkip_panel['icon'] ) ) { networkip_icon( $networkip_panel['icon'], 48 ); } ?>
							<h3><?php echo esc_html( $networkip_panel['title'] ); ?></h3>
							<ul class="nip-checks">
								<?php foreach ( (array) $networkip_panel['items'] as $networkip_item ) : ?>
									<li><?php echo esc_html( $networkip_item ); ?></li>
								<?php endforeach; ?>
							</ul>
							<?php if ( ! empty( $networkip_panel['note'] ) ) : ?>
								<p class="nip-footnote"><?php echo esc_html( $networkip_panel['note'] ); ?></p>
							<?php endif; ?>
						</aside>
					<?php endif; ?>
				</div>

			<?php elseif ( 'cards' === $networkip_type ) : ?>
				<?php if ( $networkip_has_heading ) : ?>
					<div class="nip-heading"><?php networkip_section_heading( $networkip_heading, $networkip_id ); ?></div>
				<?php endif; ?>
				<ul class="nip-grid nip-grid--3" role="list">
					<?php foreach ( (array) $networkip_s['cards'] as $networkip_ci => $networkip_card ) : ?>
						<li class="nip-card<?php echo empty( $networkip_card['icon'] ) ? ' nip-card--tech' : ''; ?>">
							<?php if ( ! empty( $networkip_card['icon'] ) ) : ?>
								<?php networkip_icon( $networkip_card['icon'] ); ?>
							<?php elseif ( ! empty( $networkip_s['numbered'] ) ) : ?>
								<span class="nip-card__index" aria-hidden="true"><?php echo esc_html( str_pad( (string) ( $networkip_ci + 1 ), 2, '0', STR_PAD_LEFT ) ); ?></span>
							<?php endif; ?>
							<h3>
								<?php if ( ! empty( $networkip_card['url'] ) ) : ?>
									<a class="nip-card__link" href="<?php echo esc_url( networkip_url( $networkip_card['url'] ) ); ?>"><?php echo esc_html( $networkip_card['title'] ); ?></a>
								<?php else : ?>
									<?php echo esc_html( $networkip_card['title'] ); ?>
								<?php endif; ?>
							</h3>
							<?php if ( ! empty( $networkip_card['text'] ) ) : ?>
								<p><?php echo esc_html( $networkip_card['text'] ); ?></p>
							<?php endif; ?>
							<?php if ( ! empty( $networkip_card['url'] ) ) : ?>
								<span class="nip-card__more" aria-hidden="true"><?php esc_html_e( 'Learn more', 'networkip' ); ?> →</span>
							<?php endif; ?>
						</li>
					<?php endforeach; ?>
				</ul>

			<?php elseif ( 'stats' === $networkip_type ) : ?>
				<?php if ( $networkip_has_heading ) : ?>
					<div class="nip-heading"><?php networkip_section_heading( $networkip_heading, $networkip_id ); ?></div>
				<?php endif; ?>
				<dl class="nip-stats nip-stats--boxed nip-stats--flush">
					<?php foreach ( (array) $networkip_s['items'] as $networkip_stat ) : ?>
						<div class="nip-stat">
							<dt><?php echo esc_html( $networkip_stat['label'] ); ?></dt>
							<dd><?php echo esc_html( $networkip_stat['value'] ); ?></dd>
						</div>
					<?php endforeach; ?>
				</dl>
				<?php if ( ! empty( $networkip_s['footnote'] ) ) : ?>
					<p class="nip-footnote"><?php echo esc_html( $networkip_s['footnote'] ); ?></p>
				<?php endif; ?>

			<?php elseif ( 'list' === $networkip_type ) : ?>
				<div class="nip-narrow-block">
					<?php networkip_section_heading( $networkip_heading, $networkip_id ); ?>
					<?php if ( ! empty( $networkip_s['items'] ) ) : ?>
						<ul class="nip-checks">
							<?php foreach ( (array) $networkip_s['items'] as $networkip_item ) : ?>
								<li><?php echo esc_html( $networkip_item ); ?></li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>
				</div>

			<?php elseif ( 'chips' === $networkip_type ) : ?>
				<?php if ( $networkip_has_heading ) : ?>
					<div class="nip-heading"><?php networkip_section_heading( $networkip_heading, $networkip_id ); ?></div>
				<?php endif; ?>
				<ul class="nip-partners" role="list">
					<?php foreach ( (array) $networkip_s['items'] as $networkip_item ) : ?>
						<li><?php echo esc_html( $networkip_item ); ?></li>
					<?php endforeach; ?>
				</ul>

			<?php elseif ( 'people' === $networkip_type ) : ?>
				<ul class="nip-people" role="list">
					<?php foreach ( (array) $networkip_s['people'] as $networkip_person ) : ?>
						<?php
						$networkip_initials = '';
						foreach ( preg_split( '/\s+/', preg_replace( '/\b[A-Z]\.\s*/', '', $networkip_person['name'] ) ) as $networkip_part ) {
							$networkip_initials .= mb_substr( $networkip_part, 0, 1 );
						}
						?>
						<li class="nip-panel nip-person">
							<div class="nip-person__head">
								<?php if ( ! empty( $networkip_person['photo'] ) ) : ?>
									<img class="nip-person__photo" src="<?php echo esc_url( $networkip_person['photo'] ); ?>" alt="<?php echo esc_attr( $networkip_person['name'] ); ?>" width="72" height="72" loading="lazy">
								<?php else : ?>
									<span class="nip-person__avatar" aria-hidden="true"><?php echo esc_html( $networkip_initials ); ?></span>
								<?php endif; ?>
								<div>
									<h2 class="nip-person__name"><?php echo esc_html( $networkip_person['name'] ); ?></h2>
									<p class="nip-person__role"><?php echo esc_html( $networkip_person['role'] ); ?></p>
								</div>
							</div>
							<?php foreach ( (array) $networkip_person['bio'] as $networkip_p ) : ?>
								<p><?php echo esc_html( $networkip_p ); ?></p>
							<?php endforeach; ?>
						</li>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>
		</div>
	</section>
	<?php
endforeach;
