<?php
/**
 * Guest reviews.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;
?>
<section class="section section--navy">
	<div class="container">
		<header class="section-head">
			<p class="pill pill--dark"><?php popeye_the_icon( 'star' ); ?> <?php esc_html_e( 'Guest Stories', 'popeye-charters' ); ?></p>
			<h2><?php esc_html_e( 'What Folks Are Saying', 'popeye-charters' ); ?></h2>
			<p class="lead"><?php esc_html_e( 'Real reviews from real guests aboard Popeye', 'popeye-charters' ); ?></p>
		</header>
		<div class="grid grid--2">
			<?php foreach ( popeye_content( 'testimonials' ) as $t ) : ?>
				<figure class="review">
					<div class="review__top">
						<span class="stars" aria-label="<?php esc_attr_e( '5 out of 5 stars', 'popeye-charters' ); ?>"><?php echo str_repeat( popeye_icon( 'star' ), 5 ); // phpcs:ignore ?></span>
						<span class="eyebrow"><?php echo esc_html( $t['occasion'] ); ?></span>
					</div>
					<blockquote>
						<p class="review__lead"><?php echo esc_html( $t['lead'] ); ?></p>
						<?php foreach ( $t['body'] as $para ) : ?>
							<p><?php echo esc_html( $para ); ?></p>
						<?php endforeach; ?>
						<p class="review__close"><?php echo esc_html( $t['close'] ); ?></p>
					</blockquote>
					<figcaption>
						<span class="avatar" aria-hidden="true"><?php echo esc_html( mb_substr( $t['name'], 0, 1 ) ); ?></span>
						<span><strong>~ <?php echo esc_html( $t['name'] ); ?></strong><br><small><?php esc_html_e( 'Verified Charter Guest · Charleston Harbor', 'popeye-charters' ); ?></small></span>
					</figcaption>
				</figure>
			<?php endforeach; ?>
		</div>
		<p class="center review-score"><?php popeye_the_icon( 'star' ); ?> <?php esc_html_e( '5.0 — Every charter guest, every time', 'popeye-charters' ); ?></p>
	</div>
</section>
