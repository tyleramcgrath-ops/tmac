<?php
/**
 * FAQ accordion section.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;
?>
<section class="section section--ivory" id="faq">
	<div class="container container--narrow">
		<header class="section-head">
			<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Frequently Asked Questions', 'popeye-charters' ); ?></p>
			<h2><?php esc_html_e( 'Everything You Need to Know', 'popeye-charters' ); ?></h2>
			<p class="lead"><?php esc_html_e( 'Planning your first charter? Here are the answers to the questions we hear most often.', 'popeye-charters' ); ?></p>
		</header>
		<div class="faq">
			<?php foreach ( popeye_content( 'faqs' ) as $q ) : ?>
				<details class="faq__item">
					<summary><h3><?php echo esc_html( $q[0] ); ?></h3><span class="faq__icon" aria-hidden="true"></span></summary>
					<div class="faq__answer"><p><?php echo esc_html( $q[1] ); ?></p></div>
				</details>
			<?php endforeach; ?>
		</div>
		<p class="center muted-brown"><?php esc_html_e( "Still have questions? We'd love to hear from you.", 'popeye-charters' ); ?></p>
		<div class="btn-row btn-row--center">
			<a class="btn btn--gold" href="<?php echo esc_url( popeye_book_url() ); ?>"><?php esc_html_e( 'Book a Charter', 'popeye-charters' ); ?></a>
			<a class="btn btn--outline-dark" href="<?php echo esc_url( popeye_contact_url() ); ?>"><?php esc_html_e( 'Contact Us', 'popeye-charters' ); ?></a>
		</div>
	</div>
</section>
