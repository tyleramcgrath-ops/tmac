<?php
/**
 * Contact section with details and form.
 *
 * @package NetworkIP
 */

$networkip_address = networkip_mod( 'contact_address' );
$networkip_phone   = networkip_mod( 'contact_phone' );
$networkip_email   = networkip_mod( 'contact_email' );
$networkip_status  = networkip_contact_status();
$networkip_form_on = '1' === networkip_mod( 'contact_form_enabled' );
?>
<section class="nip-section nip-contact" id="contact" aria-labelledby="contact-title">
	<div class="nip-wrap nip-contact__grid<?php echo $networkip_form_on ? '' : ' nip-contact__grid--solo'; ?>">
		<div class="nip-contact__intro">
			<h2 id="contact-title"><?php echo esc_html( networkip_mod( 'contact_title' ) ); ?></h2>
			<p class="nip-lead"><?php echo esc_html( networkip_mod( 'contact_text' ) ); ?></p>

			<ul class="nip-contact__list" role="list">
				<?php if ( $networkip_address ) : ?>
					<li>
						<span class="nip-contact__label"><?php esc_html_e( 'Address', 'networkip' ); ?></span>
						<span><?php echo nl2br( esc_html( $networkip_address ) ); ?></span>
					</li>
				<?php endif; ?>
				<?php if ( $networkip_phone ) : ?>
					<li>
						<span class="nip-contact__label"><?php esc_html_e( 'Phone', 'networkip' ); ?></span>
						<a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $networkip_phone ) ); ?>"><?php echo esc_html( $networkip_phone ); ?></a>
					</li>
				<?php endif; ?>
				<?php if ( $networkip_email ) : ?>
					<li>
						<span class="nip-contact__label"><?php esc_html_e( 'Email', 'networkip' ); ?></span>
						<a href="mailto:<?php echo esc_attr( antispambot( $networkip_email ) ); ?>"><?php echo esc_html( antispambot( $networkip_email ) ); ?></a>
					</li>
				<?php endif; ?>
			</ul>
		</div>

		<?php if ( $networkip_form_on ) : ?>
			<form class="nip-form nip-panel" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
				<h3 class="nip-form__title"><?php esc_html_e( 'Send us a message', 'networkip' ); ?></h3>

				<?php if ( $networkip_status ) : ?>
					<p class="nip-notice nip-notice--<?php echo esc_attr( $networkip_status['type'] ); ?>" role="<?php echo 'error' === $networkip_status['type'] ? 'alert' : 'status'; ?>"><?php echo esc_html( $networkip_status['text'] ); ?></p>
				<?php endif; ?>

				<input type="hidden" name="action" value="networkip_contact">
				<input type="hidden" name="nip_started" value="<?php echo esc_attr( (string) time() ); ?>">
				<?php wp_nonce_field( 'networkip_contact', 'networkip_contact_nonce' ); ?>

				<div class="nip-form__hp" aria-hidden="true">
					<label for="nip_website"><?php esc_html_e( 'Leave this field empty', 'networkip' ); ?></label>
					<input type="text" id="nip_website" name="nip_website" tabindex="-1" autocomplete="off">
				</div>

				<div class="nip-form__row">
					<p class="nip-field">
						<label for="nip_name"><?php esc_html_e( 'Name', 'networkip' ); ?> <span aria-hidden="true">*</span></label>
						<input type="text" id="nip_name" name="nip_name" autocomplete="name" maxlength="120" required>
					</p>
					<p class="nip-field">
						<label for="nip_company"><?php esc_html_e( 'Company', 'networkip' ); ?></label>
						<input type="text" id="nip_company" name="nip_company" autocomplete="organization" maxlength="160">
					</p>
				</div>
				<div class="nip-form__row">
					<p class="nip-field">
						<label for="nip_email"><?php esc_html_e( 'Email', 'networkip' ); ?> <span aria-hidden="true">*</span></label>
						<input type="email" id="nip_email" name="nip_email" autocomplete="email" maxlength="160" required>
					</p>
					<p class="nip-field">
						<label for="nip_phone"><?php esc_html_e( 'Phone', 'networkip' ); ?></label>
						<input type="tel" id="nip_phone" name="nip_phone" autocomplete="tel" maxlength="40">
					</p>
				</div>
				<p class="nip-field">
					<label for="nip_message"><?php esc_html_e( 'Message', 'networkip' ); ?> <span aria-hidden="true">*</span></label>
					<textarea id="nip_message" name="nip_message" rows="5" maxlength="5000" required></textarea>
				</p>
				<p class="nip-form__foot">
					<button class="nip-btn nip-btn--primary" type="submit"><?php esc_html_e( 'Send message', 'networkip' ); ?></button>
					<span class="nip-form__req"><?php esc_html_e( '* Required', 'networkip' ); ?></span>
				</p>
			</form>
		<?php endif; ?>
	</div>
</section>
