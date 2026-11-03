<?php
/**
 * Contact call-to-action band shown at the end of interior pages.
 * The Contact Us page shows the full contact section with the form instead.
 *
 * @package NetworkIP
 */

if ( is_page( 'contact-us' ) ) {
	get_template_part( 'template-parts/home/contact' );
	return;
}
?>
<section class="nip-section nip-cta" aria-labelledby="cta-title">
	<div class="nip-wrap nip-cta__inner">
		<div>
			<h2 id="cta-title"><?php echo esc_html( networkip_mod( 'contact_title' ) ); ?></h2>
			<p class="nip-lead"><?php echo esc_html( networkip_mod( 'contact_text' ) ); ?></p>
		</div>
		<a class="nip-btn nip-btn--primary" href="<?php echo esc_url( networkip_url( '/contact-us/' ) ); ?>"><?php esc_html_e( 'Contact Us', 'networkip' ); ?></a>
	</div>
</section>
