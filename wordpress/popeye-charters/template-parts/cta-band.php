<?php
/**
 * Closing call-to-action band over a sunset photo.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

$a = wp_parse_args(
	$args,
	array(
		'title'    => __( 'Your Day on the Water', 'popeye-charters' ),
		'title_em' => __( 'Awaits', 'popeye-charters' ),
		'text'     => __( 'Charleston Harbor is calling. Whatever you have in mind — make it unforgettable aboard a boat that may have shared the screen with Robin Williams.', 'popeye-charters' ),
		'image'    => popeye_img( 'public_4114_7215344bbf124e30a59b01153b1bd2d3' ),
	)
);
?>
<section class="cta-band">
	<img class="cta-band__bg" src="<?php echo esc_url( $a['image'] ); ?>" alt="" loading="lazy">
	<div class="cta-band__shade" aria-hidden="true"></div>
	<div class="container container--narrow cta-band__content">
		<span class="rule" aria-hidden="true"></span>
		<h2><?php echo esc_html( $a['title'] ); ?><br><em><?php echo esc_html( $a['title_em'] ); ?></em></h2>
		<p><?php echo esc_html( $a['text'] ); ?></p>
		<div class="btn-row btn-row--center">
			<a class="btn btn--gold" href="<?php echo esc_url( popeye_book_url() ); ?>"><?php esc_html_e( 'Book Your Charter', 'popeye-charters' ); ?></a>
			<a class="btn btn--ghost" href="<?php echo esc_url( popeye_experiences_url() ); ?>"><?php esc_html_e( 'Browse Experiences', 'popeye-charters' ); ?></a>
		</div>
		<span class="rule" aria-hidden="true"></span>
	</div>
</section>
