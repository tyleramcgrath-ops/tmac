<?php
/**
 * Contact section with form.
 *
 * Uses WPCF7 (Contact Form 7) if a form ID is set via theme mod
 * `envuemex_cf7_id`. Otherwise falls back to a native mailto form
 * that still works without any plugin.
 *
 * @package envuemex
 */
$email   = envuemex_get( 'envuemex_email', 'ventas@envuemex.com' );
$phone   = envuemex_get( 'envuemex_phone', '+52 800 123 4567' );
$offices = envuemex_get( 'envuemex_offices', 'Monterrey · Ciudad de México · Guadalajara' );
$tmac    = envuemex_get( 'envuemex_us_url', 'https://tyleramcgrath-ops.github.io/tmac/' );
$cf7_id  = get_theme_mod( 'envuemex_cf7_id', '' );
?>
<section class="section" id="contacto">
	<div class="container contact">
		<div class="contact__copy" data-reveal>
			<span class="eyebrow">
				<span class="dot"></span>
				<span data-es="Contacto" data-en="Contact">Contacto</span>
			</span>
			<h2 data-es="Cuéntanos sobre tu flota." data-en="Tell us about your fleet.">Cuéntanos sobre tu flota.</h2>
			<p data-es="Te respondemos el mismo día hábil con una propuesta a la medida." data-en="We get back to you within one business day with a tailored proposal.">Te respondemos el mismo día hábil con una propuesta a la medida.</p>

			<ul class="contact__info">
				<li>
					<span class="contact__lbl" data-es="Correo" data-en="Email">Correo</span>
					<a href="mailto:<?php echo esc_attr( $email ); ?>"><?php echo esc_html( $email ); ?></a>
				</li>
				<li>
					<span class="contact__lbl" data-es="Teléfono" data-en="Phone">Teléfono</span>
					<a href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', $phone ) ); ?>"><?php echo esc_html( $phone ); ?></a>
				</li>
				<li>
					<span class="contact__lbl" data-es="Oficinas" data-en="Offices">Oficinas</span>
					<span><?php echo esc_html( $offices ); ?></span>
				</li>
				<li>
					<span class="contact__lbl">USA</span>
					<a href="<?php echo esc_url( $tmac ); ?>" target="_blank" rel="noopener">tmac.us</a>
				</li>
			</ul>
		</div>

		<?php if ( $cf7_id && shortcode_exists( 'contact-form-7' ) ) : ?>
			<div class="contact__form contact__form--cf7" data-reveal>
				<?php echo do_shortcode( '[contact-form-7 id="' . esc_attr( $cf7_id ) . '"]' ); ?>
			</div>
		<?php else : ?>
			<form class="contact__form" data-reveal action="mailto:<?php echo esc_attr( $email ); ?>" method="post" enctype="text/plain" novalidate>
				<div class="field">
					<label for="f-name" data-es="Nombre" data-en="Name"><?php esc_html_e( 'Nombre', 'envuemex' ); ?></label>
					<input id="f-name" name="name" type="text" autocomplete="name" required />
				</div>
				<div class="field">
					<label for="f-co" data-es="Empresa" data-en="Company"><?php esc_html_e( 'Empresa', 'envuemex' ); ?></label>
					<input id="f-co" name="company" type="text" autocomplete="organization" required />
				</div>
				<div class="field">
					<label for="f-email" data-es="Correo de trabajo" data-en="Work email"><?php esc_html_e( 'Correo de trabajo', 'envuemex' ); ?></label>
					<input id="f-email" name="email" type="email" autocomplete="email" required />
				</div>
				<div class="field">
					<label for="f-size" data-es="Tamaño de flota" data-en="Fleet size"><?php esc_html_e( 'Tamaño de flota', 'envuemex' ); ?></label>
					<select id="f-size" name="fleet_size">
						<option value="1-10">1 — 10</option>
						<option value="11-50">11 — 50</option>
						<option value="51-200">51 — 200</option>
						<option value="200+">200+</option>
					</select>
				</div>
				<div class="field field--full">
					<label for="f-msg" data-es="¿Cómo podemos ayudarte?" data-en="How can we help?"><?php esc_html_e( '¿Cómo podemos ayudarte?', 'envuemex' ); ?></label>
					<textarea id="f-msg" name="message" rows="4"></textarea>
				</div>
				<button class="btn btn--primary btn--lg" type="submit" data-es="Enviar solicitud" data-en="Send request"><?php esc_html_e( 'Enviar solicitud', 'envuemex' ); ?></button>
				<p class="contact__legal" data-es="Al enviar aceptas nuestra política de privacidad." data-en="By submitting you accept our privacy policy."><?php esc_html_e( 'Al enviar aceptas nuestra política de privacidad.', 'envuemex' ); ?></p>
			</form>
		<?php endif; ?>
	</div>
</section>
