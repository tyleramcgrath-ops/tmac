<?php
/* Template Name: Request a Quote */
get_header();
pps_hero('Let’s find your<br>pool’s prescription.', 'Tell us about your pool. We’ll follow up with a personalized quote.', array('eyebrow' => 'Free quote', 'image' => 'lounge-sunset.jpg', 'position' => 'center 60%', 'button' => false));
$status   = isset($_GET['quote']) && is_string($_GET['quote']) ? sanitize_key(wp_unslash($_GET['quote'])) : '';
$messages = array(
	'sent'    => array('ok', 'Thank you! Your request is on its way. We’ll be in touch soon.'),
	'failed'  => array('error', 'We couldn’t send your request. Please call or text us directly.'),
	'invalid' => array('error', 'Please enter your name, a valid phone and email, your service address and city.'),
	'expired' => array('error', 'This form expired. Please refresh the page and try again.'),
	'wait'    => array('error', 'Please wait a minute before sending another request.'),
);
?>
<section class="section quote">
	<div class="wrap quote-grid">
		<aside class="quote-info">
			<p class="eyebrow">Request a quote</p>
			<h2>Healthy, balanced, clear — starting this week.</h2>
			<span class="rule" aria-hidden="true"></span>
			<div class="info-row"><?php pps_icon('phone'); ?><div><small>Call or text</small><a href="<?php echo esc_url(pps_tel()); ?>"><?php echo esc_html(pps_phone()); ?></a></div></div>
			<div class="info-row"><?php pps_icon('pin'); ?><div><small>Service area</small><span>Peoria • Vistancia • Surprise</span></div></div>
			<div class="offer-card">
				<p class="eyebrow eyebrow-light">New customer offer</p>
				<p class="offer-big">$<?php echo esc_html(pps_intro_price()); ?><span>/month</span></p>
				<p>For your first <?php echo esc_html(pps_intro_months()); ?> months. Standard chemicals included.</p>
				<p class="offer-terms">New customers only. Regular weekly packages start at $<?php echo esc_html(pps_price()); ?>/month. Additional services quoted separately.</p>
			</div>
		</aside>
		<div id="quote-form" class="quote-form">
			<h2>Request your free quote</h2>
			<?php if (isset($messages[$status])) : ?>
				<p class="form-message is-<?php echo esc_attr($messages[$status][0]); ?>" role="status"><?php echo esc_html($messages[$status][1]); ?></p>
			<?php endif; ?>
			<form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
				<input type="hidden" name="action" value="pps_quote">
				<?php wp_nonce_field('pps_quote', 'pps_nonce'); ?>
				<div class="honeypot" aria-hidden="true"><label>Leave this blank <input name="website" tabindex="-1" autocomplete="off"></label></div>
				<div class="field-grid">
					<?php
					$fields = array(
						'name'    => array('Full name', 'text', 'name', ''),
						'phone'   => array('Phone', 'tel', 'tel', ''),
						'email'   => array('Email', 'email', 'email', 'full'),
						'address' => array('Service address', 'text', 'street-address', ''),
						'city'    => array('City', 'text', 'address-level2', ''),
					);
					foreach ($fields as $key => $field) :
						?>
						<p class="field <?php echo esc_attr($field[3]); ?>">
							<label for="pps-<?php echo esc_attr($key); ?>"><?php echo esc_html($field[0]); ?> <span aria-hidden="true">*</span></label>
							<input id="pps-<?php echo esc_attr($key); ?>" name="<?php echo esc_attr($key); ?>" type="<?php echo esc_attr($field[1]); ?>" autocomplete="<?php echo esc_attr($field[2]); ?>" required maxlength="200">
						</p>
					<?php endforeach; ?>
					<p class="field full">
						<label for="pps-service">How can we help?</label>
						<select id="pps-service" name="service"><?php foreach (pps_services_list() as $service) { echo '<option>' . esc_html($service) . '</option>'; } ?></select>
					</p>
					<p class="field full">
						<label for="pps-message">Tell us about your pool</label>
						<textarea id="pps-message" name="message" rows="4" maxlength="5000" placeholder="Size, equipment, anything you’ve noticed…"></textarea>
					</p>
				</div>
				<button class="button" type="submit">Request my free quote <?php echo pps_arrow(); ?></button>
				<p class="form-note">* Required. We only use your details to respond to this request.</p>
			</form>
		</div>
	</div>
</section>
<?php
pps_process();
pps_editor_content();
get_footer();
