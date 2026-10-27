<?php
/* Template Name: Service Area */
get_header();
pps_hero('Close to home<br>in the West Valley.', 'Peoria • Vistancia • Surprise', array('eyebrow' => 'Service area', 'image' => 'hero-desert-pool.jpg', 'position' => '75% center'));
$cities = array(
	'Peoria'    => 'Weekly care for backyard retreats across Peoria.',
	'Vistancia' => 'Personalized service for Vistancia’s resort-style pools.',
	'Surprise'  => 'Clear water and consistent care throughout Surprise.',
);
?>
<section class="section areas">
	<div class="wrap">
		<div class="section-head">
			<p class="eyebrow">Your local pool service</p>
			<h2>Proudly serving your neighborhood.</h2>
			<span class="rule" aria-hidden="true"></span>
		</div>
		<div class="area-grid">
			<?php foreach ($cities as $city => $line) : ?>
				<article>
					<?php pps_icon('pin'); ?>
					<h3><?php echo esc_html($city); ?></h3>
					<p><?php echo esc_html($line); ?></p>
					<a class="text-link" href="<?php echo esc_url(pps_url('request-a-quote')); ?>">Request service <?php echo pps_arrow(); ?></a>
				</article>
			<?php endforeach; ?>
		</div>
	</div>
</section>
<section class="section nearby">
	<div class="wrap nearby-grid">
		<div>
			<p class="eyebrow eyebrow-light">Surrounding communities</p>
			<h2>Nearby? Let’s talk.</h2>
			<p>Call or text to confirm service availability for your address.</p>
		</div>
		<div class="nearby-actions">
			<a class="big-phone" href="<?php echo esc_url(pps_tel()); ?>"><?php pps_icon('phone'); ?><?php echo esc_html(pps_phone()); ?></a>
			<?php pps_button('Check my address'); ?>
		</div>
		<?php pps_skyline(); ?>
	</div>
</section>
<?php
pps_editor_content();
pps_cta();
get_footer();
