<?php
/* Template Name: The Difference */
get_header();
pps_hero('A personal<br>prescription<br>for your pool.', 'Your pool is unique. Its care should be, too.', array('eyebrow' => 'Our approach', 'image' => 'lounge-sunset.jpg', 'position' => 'center 60%'));
?>
<section class="section split">
	<div class="wrap split-grid">
		<div class="split-copy">
			<p class="eyebrow">Water care with intention</p>
			<h2>Precision testing.<br>Personalized treatment.</h2>
			<span class="rule" aria-hidden="true"></span>
			<p>At Prescriptive Pool Service, we take the guesswork out of pool care. Instead of a one-size-fits-all routine, every visit starts with <em>LaMotte WaterLink Spin Touch</em> digital water analysis.</p>
			<p>In about 60 seconds it measures your pool’s key chemistry. Those readings guide a prescriptive treatment — adding what your water needs, without unnecessary chemicals.</p>
			<?php pps_button('Experience the difference'); ?>
		</div>
		<figure class="split-media kit">
			<?php pps_image('spin-touch.jpg', 'LaMotte WaterLink Spin Touch digital water testing kit'); ?>
			<figcaption>Advanced digital water testing, poolside.</figcaption>
		</figure>
	</div>
</section>
<?php
pps_process();
pps_inclusions();
pps_owner();
pps_editor_content();
pps_cta('Ready to take the guesswork out of pool care?');
get_footer();
