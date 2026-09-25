<?php
/**
 * Not found.
 *
 * @package drip
 */

get_header();
?>
<main id="main" class="lost">
	<div class="lost-art" aria-hidden="true"><?php echo drip_swell( array( 'lines' => 16, 'height' => 600, 'crest' => 0.5, 'seed' => 404, 'spray' => 90 ) ); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
	<div class="wrap lost-inner">
		<p class="eyebrow">404</p>
		<h1 class="about-title">Washed out.</h1>
		<p class="lede">This page went out with the tide. The shop is still right where you left it.</p>
		<div class="hero-actions">
			<a class="btn btn-foam" href="<?php echo drip_wc_url( 'shop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Shop the drop <?php echo drip_icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
			<a class="btn btn-ghost" href="<?php echo drip_url(); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Home</a>
		</div>
	</div>
</main>
<?php
get_footer();
