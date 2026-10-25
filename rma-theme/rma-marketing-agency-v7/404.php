<?php
/**
 * Not found.
 *
 * @package rma
 */

get_header();
?>
<main id="main">
	<header class="subhero subhero-plain subhero-404">
		<div class="wrap">
			<p class="eyebrow">Error 404</p>
			<h1>This page took a <em>different path.</em></h1>
			<p class="lede">It may have moved. The homepage and services are a good place to pick the trail back up.</p>
			<div class="hero-actions">
				<a class="btn btn-glow" href="<?php echo rma_url(); ?>">Go Home <?php echo rma_icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
				<a class="btn btn-ghost" href="<?php echo rma_url( 'services' ); ?>">Services</a>
			</div>
		</div>
	</header>
</main>
<?php
get_footer();
