<?php
/**
 * Template Name: RMA — Contact
 *
 * @package rma
 */

get_header();
?>

<section class="page-hero">
	<div class="container">
		<div class="breadcrumb"><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'rma' ); ?></a> / <?php esc_html_e( 'Contact', 'rma' ); ?></div>
	</div>
</section>

<section class="section--tight">
	<div class="container contact-grid">
		<div>
			<h1><?php echo wp_kses_post( __( "Let's build<br>something great<br>together.", 'rma' ) ); ?></h1>
			<p class="lead"><?php esc_html_e( "Tell us about your goals and we'll create a custom plan to help you grow.", 'rma' ); ?></p>

			<div style="margin-top:34px">
				<div class="contact-info-item"><span class="ci-ic"><?php echo rma_icon( 'phone', 20 ); ?></span><div><strong><?php esc_html_e( '(813) 123-4567', 'rma' ); ?></strong></div></div>
				<div class="contact-info-item"><span class="ci-ic"><?php echo rma_icon( 'mail', 20 ); ?></span><div><strong><?php esc_html_e( 'hello@relativemarketing.agency', 'rma' ); ?></strong></div></div>
				<div class="contact-info-item"><span class="ci-ic"><?php echo rma_icon( 'pin', 20 ); ?></span><div><strong><?php esc_html_e( 'Tampa, FL', 'rma' ); ?></strong></div></div>
			</div>

			<div class="social" style="--c:var(--blue)">
				<a href="#" aria-label="LinkedIn" style="background:var(--blue-soft);color:var(--blue)"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 102.5 6a2.5 2.5 0 002.48-2.5zM3 8.5h4V21H3zM9 8.5h3.8v1.7h.05a4.2 4.2 0 013.78-2.07C20.4 8.13 22 10 22 13.5V21h-4v-6.6c0-1.57-.03-3.6-2.2-3.6s-2.5 1.7-2.5 3.48V21H9z"/></svg></a>
				<a href="#" aria-label="Twitter" style="background:var(--blue-soft);color:var(--blue)"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.6-2.3.7a4 4 0 001.7-2.2c-.8.5-1.6.8-2.5 1a4 4 0 00-6.9 3.6A11.3 11.3 0 013.1 4.8a4 4 0 001.2 5.3c-.6 0-1.2-.2-1.8-.5a4 4 0 003.2 3.9c-.6.2-1.2.2-1.8.1a4 4 0 003.7 2.8A8 8 0 012 18.1a11.3 11.3 0 006.1 1.8c7.3 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg></a>
				<a href="#" aria-label="Instagram" style="background:var(--blue-soft);color:var(--blue)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg></a>
			</div>
		</div>

		<div>
			<form class="contact-form" method="post" action="#" novalidate>
				<div class="form-row">
					<div class="field"><label><?php esc_html_e( 'Full Name', 'rma' ); ?></label><input type="text" name="full_name" placeholder="<?php esc_attr_e( 'Jane Doe', 'rma' ); ?>"></div>
					<div class="field"><label><?php esc_html_e( 'Email Address', 'rma' ); ?></label><input type="email" name="email" placeholder="<?php esc_attr_e( 'jane@company.com', 'rma' ); ?>"></div>
				</div>
				<div class="form-row">
					<div class="field"><label><?php esc_html_e( 'Company', 'rma' ); ?></label><input type="text" name="company" placeholder="<?php esc_attr_e( 'Company Inc.', 'rma' ); ?>"></div>
					<div class="field"><label><?php esc_html_e( 'Website', 'rma' ); ?></label><input type="text" name="website" placeholder="<?php esc_attr_e( 'company.com', 'rma' ); ?>"></div>
				</div>
				<div class="field"><label><?php esc_html_e( 'Services Interested In', 'rma' ); ?></label>
					<select name="service">
						<option><?php esc_html_e( 'Select a service', 'rma' ); ?></option>
						<option><?php esc_html_e( 'AI Search Optimization', 'rma' ); ?></option>
						<option><?php esc_html_e( 'SEO', 'rma' ); ?></option>
						<option><?php esc_html_e( 'Paid Media', 'rma' ); ?></option>
						<option><?php esc_html_e( 'Web Design', 'rma' ); ?></option>
						<option><?php esc_html_e( 'Branding', 'rma' ); ?></option>
						<option><?php esc_html_e( 'Automation & Analytics', 'rma' ); ?></option>
					</select>
				</div>
				<div class="field"><label><?php esc_html_e( 'Budget', 'rma' ); ?></label>
					<select name="budget">
						<option><?php esc_html_e( 'Select budget', 'rma' ); ?></option>
						<option><?php esc_html_e( '$1k – $5k / month', 'rma' ); ?></option>
						<option><?php esc_html_e( '$5k – $10k / month', 'rma' ); ?></option>
						<option><?php esc_html_e( '$10k – $25k / month', 'rma' ); ?></option>
						<option><?php esc_html_e( '$25k+ / month', 'rma' ); ?></option>
					</select>
				</div>
				<div class="field"><label><?php esc_html_e( 'Message', 'rma' ); ?></label><textarea name="message" rows="5" placeholder="<?php esc_attr_e( 'Tell us about your project...', 'rma' ); ?>"></textarea></div>
				<button type="submit" class="btn btn--primary btn--block"><?php esc_html_e( 'Send Message', 'rma' ); ?></button>
			</form>

			<div class="book-call">
				<h4><?php esc_html_e( 'Book a call with our team', 'rma' ); ?></h4>
				<p style="color:rgba(255,255,255,.75)"><?php esc_html_e( 'Pick a time that works best for you.', 'rma' ); ?></p>
				<a class="btn btn--primary" href="#"><?php esc_html_e( 'Schedule a Call', 'rma' ); ?></a>
			</div>
		</div>
	</div>
</section>

<?php
get_footer();
