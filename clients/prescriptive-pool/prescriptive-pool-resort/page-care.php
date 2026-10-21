<?php
/* Template Name: Pool Care */
get_header();
pps_hero('Complete care<br>for a healthier,<br>happier pool.', 'Professional weekly service, tailored to your water.', array('eyebrow' => 'Our services', 'image' => 'hero-desert-pool.jpg', 'position' => '90% center'));
pps_inclusions();
pps_services_band('Weekly care, beyond the surface.');
?>
<section class="section split">
	<div class="wrap split-grid">
		<div class="split-copy">
			<p class="eyebrow">Beyond the weekly visit</p>
			<h2>Filter &amp; maintenance services.</h2>
			<span class="rule" aria-hidden="true"></span>
			<p>Filter cleaning and additional maintenance keep your system running clean and lasting longer. These services are quoted separately — tell us about your pool and we’ll recommend what it needs.</p>
			<?php pps_button('Discuss my pool'); ?>
		</div>
		<figure class="split-media"><?php pps_image('service-filter.jpg', 'Pool filter cartridge'); ?></figure>
	</div>
</section>
<?php pps_offer_band(); ?>
<section class="section faq">
	<div class="wrap narrow">
		<div class="section-head">
			<p class="eyebrow">Good questions</p>
			<h2>Clear answers.</h2>
			<span class="rule" aria-hidden="true"></span>
		</div>
		<details><summary>What’s included in weekly service?</summary><p>Digital water testing, prescriptive chemical treatment with standard chemicals included, skimming and brushing, equipment checks and basket cleaning.</p></details>
		<details><summary>How does the new-customer offer work?</summary><p>New customers pay $<?php echo esc_html(pps_intro_price()); ?>/month for the first <?php echo esc_html(pps_intro_months()); ?> months. After that, regular weekly service packages start at $<?php echo esc_html(pps_price()); ?>/month. Additional services are quoted separately.</p></details>
		<details><summary>Do you service my neighborhood?</summary><p>We serve Peoria, Vistancia, Surprise and nearby West Valley communities. Call or text <?php echo esc_html(pps_phone()); ?> to confirm your address.</p></details>
		<details><summary>Do you offer filter and maintenance services?</summary><p>Yes. We’ll look at your system and give you a separate quote.</p></details>
	</div>
</section>
<?php
pps_editor_content();
pps_cta();
get_footer();
