<?php if (!defined('ABSPATH')) { exit; } ?>
</main>
<footer class="site-footer">
	<div class="wrap footer-main">
		<div class="footer-brand">
			<?php pps_badge('badge-footer'); ?>
			<p class="wordmark">Prescriptive<span>Pool Service</span><small>Healthy <i>•</i> Balanced <i>•</i> Clear</small></p>
		</div>
		<nav class="footer-nav" aria-label="Footer">
			<?php foreach (pps_nav_items() as $slug => $label) : ?>
				<a href="<?php echo esc_url(pps_url($slug)); ?>"><?php echo esc_html($label); ?></a>
			<?php endforeach; ?>
			<a href="<?php echo esc_url(pps_url('request-a-quote')); ?>">Free quote</a>
		</nav>
		<div class="footer-area">
			<?php pps_skyline(); ?>
			<p class="cities">Peoria <i>•</i> Vistancia <i>•</i> Surprise</p>
			<p class="region">Arizona West Valley</p>
		</div>
	</div>
	<div class="wrap footer-bottom">
		<p>© <?php echo esc_html(wp_date('Y')); ?> Prescriptive Pool Service</p>
		<p><a href="<?php echo esc_url(pps_tel()); ?>">Call <?php echo esc_html(pps_phone()); ?></a> <span aria-hidden="true">·</span> <a href="<?php echo esc_url(pps_sms()); ?>">Text us</a></p>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
