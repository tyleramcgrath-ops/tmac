<?php
/**
 * Prescriptive Pool — Resort Living theme functions.
 */
if (!defined('ABSPATH')) { exit; }

define('PPS_VERSION', '3.0.0');

function pps_setup() {
	add_theme_support('title-tag');
	add_theme_support('post-thumbnails');
	add_theme_support('custom-logo', array('height' => 220, 'width' => 456, 'flex-height' => true, 'flex-width' => true));
	add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script'));
	register_nav_menus(array('primary' => 'Primary navigation'));
}
add_action('after_setup_theme', 'pps_setup');

function pps_assets() {
	wp_enqueue_style('pps-site', get_template_directory_uri() . '/assets/site.css', array(), PPS_VERSION);
	wp_enqueue_script('pps-site', get_template_directory_uri() . '/assets/site.js', array(), PPS_VERSION, true);
}
add_action('wp_enqueue_scripts', 'pps_assets');

function pps_preload_fonts() {
	foreach (array('DMSerifDisplay-Regular.ttf', 'manrope.ttf') as $font) {
		echo '<link rel="preload" href="' . esc_url(get_template_directory_uri() . '/assets/fonts/' . $font) . '" as="font" type="font/ttf" crossorigin>' . "\n";
	}
}
add_action('wp_head', 'pps_preload_fonts', 1);

/* ---------- Customizer ---------- */
function pps_customize($c) {
	$c->add_section('pps_contact', array('title' => 'Pool service settings', 'priority' => 30));
	$fields = array(
		'phone'        => array('Phone number', '(623) 252-9889'),
		'intro_price'  => array('New-customer monthly price', '99'),
		'intro_months' => array('New-customer offer length (months)', '3'),
		'price'        => array('Regular weekly service starts at (monthly)', '150'),
		'recipient'    => array('Quote request email', get_option('admin_email')),
	);
	foreach ($fields as $key => $data) {
		$c->add_setting('pps_' . $key, array('default' => $data[1], 'sanitize_callback' => $key === 'recipient' ? 'sanitize_email' : 'sanitize_text_field'));
		$c->add_control('pps_' . $key, array('label' => $data[0], 'section' => 'pps_contact', 'type' => $key === 'recipient' ? 'email' : 'text'));
	}
	foreach (array('hero_image' => 'Homepage hero photo', 'owner_photo' => 'Owner photo') as $key => $label) {
		$c->add_setting('pps_' . $key, array('default' => '', 'sanitize_callback' => 'esc_url_raw'));
		$c->add_control(new WP_Customize_Image_Control($c, 'pps_' . $key, array('label' => $label, 'section' => 'pps_contact')));
	}
}
add_action('customize_register', 'pps_customize');

/* ---------- Helpers ---------- */
function pps_phone() { return get_theme_mod('pps_phone', '(623) 252-9889'); }
function pps_tel() { return 'tel:' . preg_replace('/[^+0-9]/', '', pps_phone()); }
function pps_sms() { return 'sms:' . preg_replace('/[^+0-9]/', '', pps_phone()); }
function pps_intro_price() { return get_theme_mod('pps_intro_price', '99'); }
function pps_intro_months() { return get_theme_mod('pps_intro_months', '3'); }
function pps_price() { return get_theme_mod('pps_price', '150'); }
function pps_asset($file) { return get_template_directory_uri() . '/assets/' . $file; }

function pps_url($slug = '') {
	$page = $slug ? get_page_by_path($slug) : null;
	return $page ? get_permalink($page) : home_url('/' . ($slug ? $slug . '/' : ''));
}

function pps_image($file, $alt, $class = '', $eager = false) {
	$url = pps_asset('img/' . $file);
	if ($file === 'trig-bennett.jpg' && get_theme_mod('pps_owner_photo', '')) {
		$url = get_theme_mod('pps_owner_photo');
	}
	printf(
		'<img class="%s" src="%s" alt="%s" %s decoding="async">',
		esc_attr($class),
		esc_url($url),
		esc_attr($alt),
		$eager ? 'fetchpriority="high"' : 'loading="lazy"'
	);
}

/** Round logo badge used in the header and footer (matches the mockup). */
function pps_badge($class = '') {
	$src = has_custom_logo() ? wp_get_attachment_image_url(get_theme_mod('custom_logo'), 'full') : pps_asset('img/logo-light.png');
	printf(
		'<a class="badge %s" href="%s" aria-label="Prescriptive Pool Service home"><img src="%s" alt="Prescriptive Pool Service — Healthy, balanced, clear" width="456" height="220"></a>',
		esc_attr($class),
		esc_url(home_url('/')),
		esc_url($src)
	);
}

function pps_arrow() { return '<span class="arrow" aria-hidden="true">→</span>'; }

function pps_button($label = 'Get a free quote', $class = '') {
	echo '<a class="button ' . esc_attr($class) . '" href="' . esc_url(pps_url('request-a-quote')) . '">' . esc_html($label) . ' ' . pps_arrow() . '</a>';
}

function pps_nav_items() {
	return array('the-difference' => 'Our approach', 'pool-care' => 'Services', 'service-area' => 'Service area');
}

function pps_navigation($class = 'nav-links') {
	if (has_nav_menu('primary')) {
		wp_nav_menu(array('theme_location' => 'primary', 'container' => false, 'menu_class' => $class, 'depth' => 1));
		return;
	}
	echo '<ul class="' . esc_attr($class) . '">';
	foreach (pps_nav_items() as $slug => $label) {
		echo '<li><a ' . (is_page($slug) ? 'aria-current="page" ' : '') . 'href="' . esc_url(pps_url($slug)) . '">' . esc_html($label) . '</a></li>';
	}
	echo '</ul>';
}

function pps_icon($name) {
	$paths = array(
		'drop'      => 'M12 3C9 7.5 5.5 11 5.5 15a6.5 6.5 0 0013 0C18.5 11 15 7.5 12 3z',
		'flask'     => 'M9 3h6M10 3v6l-5 9a2 2 0 001.8 3h10.4A2 2 0 0019 18l-5-9V3M7.5 15h9',
		'brush'     => 'M4 20L17 7M14 4l6 6M3 17l4 4',
		'gear'      => 'M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
		'sparkle'   => 'M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z',
		'pin'       => 'M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
		'phone'     => 'M5 3h4l2 5-2.5 1.5a11 11 0 005 5L15 12l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z',
	);
	$d = isset($paths[$name]) ? $paths[$name] : $paths['drop'];
	echo '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="' . esc_attr($d) . '"/></svg>';
}

/** Gold line-art of West Valley mountains and saguaros (footer + area page). */
function pps_skyline() {
	echo '<svg class="skyline" aria-hidden="true" viewBox="0 0 260 70" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 62h256"/><path d="M8 62l30-30 14 12 22-26 26 28 12-10 30 26"/><path d="M118 62l26-22 16 10 20-18 24 30"/><path d="M180 30a8 8 0 1016 0"/><path d="M226 62V24a4 4 0 018 0v38M226 44h-6a3 3 0 01-3-3v-9M234 38h6a3 3 0 003-3v-7"/><path d="M246 62V44a3 3 0 016 0v18M246 54h-3a2 2 0 01-2-2v-4"/></svg>';
}

/* ---------- Shared sections ---------- */
function pps_hero($title, $subtitle, $args = array()) {
	$args = wp_parse_args($args, array('eyebrow' => '', 'image' => 'hero-desert-pool.jpg', 'class' => 'hero-inner', 'position' => 'center', 'button' => true));
	$image = pps_asset('img/' . $args['image']);
	if ($args['class'] === 'hero-home' && get_theme_mod('pps_hero_image', '')) {
		$image = get_theme_mod('pps_hero_image');
	}
	?>
	<section class="hero <?php echo esc_attr($args['class']); ?>">
		<div class="hero-media" style="background-image:url('<?php echo esc_url($image); ?>');background-position:<?php echo esc_attr($args['position']); ?>"></div>
		<div class="hero-content wrap">
			<?php if ($args['eyebrow']) : ?><p class="eyebrow eyebrow-light"><?php echo esc_html($args['eyebrow']); ?></p><?php endif; ?>
			<h1><?php echo wp_kses($title, array('br' => array(), 'em' => array())); ?></h1>
			<p class="hero-subtitle"><?php echo esc_html($subtitle); ?></p>
			<?php if ($args['button']) : ?><div class="hero-actions"><?php pps_button(); ?></div><?php endif; ?>
		</div>
	</section>
	<?php
}

function pps_owner() {
	?>
	<section class="owner">
		<div class="owner-copy">
			<p class="eyebrow">Meet the owner</p>
			<h2>Better pool care starts with knowing the water.</h2>
			<span class="rule" aria-hidden="true"></span>
			<p class="kicker">Built on precision.<br>Delivered with personal service.</p>
			<blockquote>
				<span class="quote-mark" aria-hidden="true">“</span>Every pool is different. I build Prescriptive Pool Service around understanding the water first — then <em>giving your pool the prescription it needs.</em><span class="quote-mark close" aria-hidden="true">”</span>
			</blockquote>
			<p class="signature">Trig Bennett <span aria-hidden="true">·</span> Owner</p>
			<div class="owner-actions">
				<?php pps_button(); ?>
				<a class="call" href="<?php echo esc_url(pps_tel()); ?>"><small>Call or text</small><?php echo esc_html(pps_phone()); ?></a>
			</div>
		</div>
		<div class="owner-photo"><?php pps_image('trig-bennett.jpg', 'Trig Bennett, owner of Prescriptive Pool Service, poolside in Arizona'); ?></div>
	</section>
	<?php
}

function pps_services_band($heading = 'Complete care for a healthier, happier pool.') {
	$cards = array(
		array('service-weekly.jpg', 'Weekly pool service', 'Skimming, brushing and basket cleaning every visit.'),
		array('service-chemistry.jpg', 'Precision water chemistry', 'Digital testing and a treatment made for your water.'),
		array('service-equipment.jpg', 'Equipment monitoring', 'Routine checks so small issues stay small.'),
		array('service-filter.jpg', 'Filter & maintenance', 'Cleaning and care for a well-running system.'),
	);
	?>
	<section class="services-band">
		<div class="wrap services-grid">
			<div class="services-intro">
				<p class="eyebrow eyebrow-light">Our services</p>
				<h2><?php echo esc_html($heading); ?></h2>
			</div>
			<?php foreach ($cards as $card) : ?>
				<a class="service-card" href="<?php echo esc_url(pps_url('pool-care')); ?>">
					<span class="service-image"><?php pps_image($card[0], ''); ?></span>
					<h3><?php echo esc_html($card[1]); ?></h3>
					<p><?php echo esc_html($card[2]); ?></p>
					<span class="rule" aria-hidden="true"></span>
				</a>
			<?php endforeach; ?>
		</div>
	</section>
	<?php
}

function pps_offer_band() {
	?>
	<section class="offer-band">
		<div class="offer-photo"><?php pps_image('lounge-sunset.jpg', 'Poolside loungers at sunset with desert mountains beyond'); ?></div>
		<div class="offer-panel">
			<div class="offer-price">
				<p class="eyebrow eyebrow-light">Weekly pool service</p>
				<p class="price-line">Starting at<br><strong>$<?php echo esc_html(pps_intro_price()); ?>/month</strong></p>
				<p class="price-note">For your first <?php echo esc_html(pps_intro_months()); ?> months. Standard chemicals included.</p>
			</div>
			<div class="offer-area">
				<?php pps_icon('pin'); ?>
				<div>
					<p class="eyebrow eyebrow-light">Service area</p>
					<p class="cities">Peoria <span>•</span> Vistancia <span>•</span> Surprise</p>
					<p class="region">Arizona West Valley</p>
				</div>
			</div>
			<p class="offer-terms">New customers only. Regular weekly service packages start at $<?php echo esc_html(pps_price()); ?>/month. Additional services quoted separately.</p>
		</div>
	</section>
	<?php
}

function pps_cta($heading = 'Ready for healthy, balanced, clear water?') {
	?>
	<section class="cta-band">
		<div class="wrap">
			<h2><?php echo esc_html($heading); ?></h2>
			<?php pps_button(); ?>
		</div>
	</section>
	<?php
}

function pps_inclusions() {
	$items = array(
		array('drop', 'Digital water testing', 'Professional analysis with the LaMotte WaterLink Spin Touch for accurate, real-time results.'),
		array('flask', 'Prescriptive chemical treatment', 'Targeted treatment based on your pool’s exact needs. Standard chemicals included.'),
		array('brush', 'Skimming & brushing', 'Surface debris removed. Walls, steps and tile brushed for a beautiful, well-kept pool.'),
		array('gear', 'Equipment check', 'Routine equipment inspections, basket cleaning and monitoring of filters and system performance.'),
		array('sparkle', 'Healthy • Balanced • Clear', 'The result of Prescriptive pool care, week after week.'),
	);
	?>
	<section class="section inclusions">
		<div class="wrap">
			<div class="section-head">
				<p class="eyebrow">The Prescriptive difference</p>
				<h2>What’s included in our weekly pool care.</h2>
				<span class="rule" aria-hidden="true"></span>
			</div>
			<div class="inclusion-grid">
				<?php foreach ($items as $item) : ?>
					<article>
						<span class="icon-ring"><?php pps_icon($item[0]); ?></span>
						<h3><?php echo esc_html($item[1]); ?></h3>
						<p><?php echo esc_html($item[2]); ?></p>
					</article>
				<?php endforeach; ?>
			</div>
		</div>
	</section>
	<?php
}

function pps_process() {
	$steps = array(
		array('Analyze', 'Know the water.', 'Digital analysis measures your pool’s key water chemistry in about 60 seconds.'),
		array('Prescribe', 'Treat with purpose.', 'We add what your water needs — without unnecessary chemicals.'),
		array('Maintain', 'Keep it clear.', 'Consistent weekly care keeps your pool clean, balanced and ready to enjoy.'),
	);
	?>
	<section class="section process">
		<div class="wrap">
			<div class="section-head">
				<p class="eyebrow">A clear approach</p>
				<h2>Test. Prescribe. Maintain.</h2>
				<span class="rule" aria-hidden="true"></span>
			</div>
			<ol class="steps">
				<?php foreach ($steps as $i => $step) : ?>
					<li><span class="step-number"><?php echo esc_html(sprintf('%02d', $i + 1)); ?> <em><?php echo esc_html($step[0]); ?></em></span><h3><?php echo esc_html($step[1]); ?></h3><p><?php echo esc_html($step[2]); ?></p></li>
				<?php endforeach; ?>
			</ol>
		</div>
	</section>
	<?php
}

function pps_editor_content() {
	if (!is_singular()) { return; }
	while (have_posts()) {
		the_post();
		if (trim(get_the_content())) {
			echo '<section class="section editor-content"><div class="wrap narrow">';
			the_content();
			echo '</div></section>';
		}
	}
}

/* ---------- One-click page setup ---------- */
function pps_setup_menu() {
	add_theme_page('Set up Prescriptive Pool', 'Set up pages', 'edit_theme_options', 'pps-setup', 'pps_setup_screen');
}
add_action('admin_menu', 'pps_setup_menu');

function pps_setup_screen() {
	?>
	<div class="wrap">
		<h1>Set up Prescriptive Pool</h1>
		<?php if (isset($_GET['complete'])) : ?><div class="notice notice-success"><p>Pages are ready and Home is set as the front page.</p></div><?php endif; ?>
		<p>Creates Home, The Difference, Pool Care, Service Area and Request a Quote, assigns their templates, and sets Home as the front page. Pages that already exist are kept.</p>
		<form action="<?php echo esc_url(admin_url('admin-post.php')); ?>" method="post">
			<input type="hidden" name="action" value="pps_setup_pages">
			<?php wp_nonce_field('pps_setup_pages'); submit_button('Create pages and set homepage'); ?>
		</form>
		<p>Phone, prices, quote email and photos: Appearance → Customize → Pool service settings.</p>
	</div>
	<?php
}

function pps_create_pages() {
	if (!current_user_can('edit_theme_options')) { wp_die('Not allowed.', 403); }
	check_admin_referer('pps_setup_pages');
	$pages = array(
		'home'            => array('Home', ''),
		'the-difference'  => array('The Difference', 'page-difference.php'),
		'pool-care'       => array('Pool Care', 'page-care.php'),
		'service-area'    => array('Service Area', 'page-area.php'),
		'request-a-quote' => array('Request a Quote', 'page-quote.php'),
	);
	$home_id = 0;
	foreach ($pages as $slug => $data) {
		$existing = get_page_by_path($slug);
		if ($existing) {
			$id = $existing->ID;
			if ($data[1] && !get_page_template_slug($id)) { update_post_meta($id, '_wp_page_template', $data[1]); }
		} else {
			$id = wp_insert_post(array('post_type' => 'page', 'post_status' => 'publish', 'post_title' => $data[0], 'post_name' => $slug), true);
			if (is_wp_error($id)) { wp_die(esc_html($id->get_error_message())); }
			if ($data[1]) { update_post_meta($id, '_wp_page_template', $data[1]); }
		}
		if ($slug === 'home') { $home_id = $id; }
	}
	update_option('show_on_front', 'page');
	update_option('page_on_front', $home_id);
	flush_rewrite_rules();
	wp_safe_redirect(admin_url('themes.php?page=pps-setup&complete=1'));
	exit;
}
add_action('admin_post_pps_setup_pages', 'pps_create_pages');

/* ---------- Quote form ---------- */
function pps_services_list() {
	return array('Weekly pool service', 'Water chemistry', 'Equipment monitoring', 'Filter & maintenance', 'Other');
}

function pps_form_redirect($status) {
	wp_safe_redirect(add_query_arg('quote', $status, pps_url('request-a-quote')) . '#quote-form');
	exit;
}

function pps_quote_submit() {
	if (!isset($_POST['pps_nonce']) || !is_string($_POST['pps_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['pps_nonce'])), 'pps_quote')) { pps_form_redirect('expired'); }
	if (!empty($_POST['website'])) { pps_form_redirect('invalid'); }
	$values = array();
	foreach (array('name', 'phone', 'email', 'address', 'city', 'service', 'message') as $key) {
		$raw = isset($_POST[$key]) && is_string($_POST[$key]) ? wp_unslash($_POST[$key]) : '';
		$values[$key] = $key === 'message' ? sanitize_textarea_field($raw) : sanitize_text_field($raw);
	}
	if (!$values['name'] || !is_email($values['email']) || strlen(preg_replace('/\D/', '', $values['phone'])) < 10 || !$values['address'] || !$values['city']) { pps_form_redirect('invalid'); }
	if (!in_array($values['service'], pps_services_list(), true)) { pps_form_redirect('invalid'); }
	$remote = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : '';
	$key = 'pps_quote_' . hash_hmac('sha256', $remote, wp_salt('nonce'));
	if (get_transient($key)) { pps_form_redirect('wait'); }
	$recipient = sanitize_email(get_theme_mod('pps_recipient', get_option('admin_email')));
	if (!is_email($recipient)) { pps_form_redirect('failed'); }
	set_transient($key, 1, MINUTE_IN_SECONDS);
	$body = "New pool service quote request\n\n";
	foreach ($values as $label => $value) { $body .= ucfirst($label) . ': ' . $value . "\n"; }
	$sent = wp_mail($recipient, 'Pool service quote request — ' . $values['name'], $body, array('Reply-To: ' . sanitize_email($values['email'])));
	pps_form_redirect($sent ? 'sent' : 'failed');
}
add_action('admin_post_pps_quote', 'pps_quote_submit');
add_action('admin_post_nopriv_pps_quote', 'pps_quote_submit');
