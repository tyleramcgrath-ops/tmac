<?php
/**
 * The story page.
 *
 * @package drip
 */

$drip_story = drip_product_by_slug( 'drip-shoreline-minimal-back-tee-lifestyle' );
?>
<main id="main" class="about">
	<section class="about-hero">
		<div class="about-art" aria-hidden="true"><?php echo drip_swell( array( 'lines' => 22, 'height' => 720, 'crest' => 0.5, 'seed' => 11, 'spray' => 120 ) ); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
		<div class="wrap about-hero-inner">
			<p class="eyebrow">Our story</p>
			<h1 class="about-title">Two worlds.<br>One wave.</h1>
			<p class="hero-serif">Built for where you are.</p>
		</div>
	</section>

	<section class="section about-body">
		<div class="wrap about-grid">
			<div class="about-copy">
				<p class="lede">DRIP is the collision of two worlds: the raw energy of ocean swells and the grit of urban streets. Every piece is made for the ones who live between tides and traffic.</p>
				<p>It starts with water. The way a swell stacks up in lines before it breaks, the spray that comes off the lip, the foam it leaves on dark sand. Those shapes are the whole design language: fine lines, a crest, a spray of salt.</p>
				<p>Then it goes to the street. The prints sit high across the back, so the front stays clean and the statement is what people see as you walk away. Black and white, silver and graphite ink, and one blue drop.</p>
			</div>
			<figure class="about-figure" data-reveal>
				<?php if ( $drip_story && $drip_story->get_image_id() ) : ?>
					<?php echo drip_image( $drip_story->get_image_id(), 'large', 'about-img', 'A DRIP back print, worn by the water' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<?php endif; ?>
				<figcaption>Shoreline Minimal Back Tee</figcaption>
			</figure>
		</div>
	</section>

	<section class="section about-marks">
		<div class="wrap marks-grid">
			<div class="mark" data-reveal>
				<?php echo drip_drop( 'mark-drop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<h2>The drop</h2>
				<p>One drop of salt water. It is the mark on every piece, and the only color we let in.</p>
			</div>
			<div class="mark" data-reveal>
				<?php echo drip_line( 'mark-line' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<h2>The line</h2>
				<p>A swell drawn in single strokes. Some prints use a dozen lines, some use one.</p>
			</div>
			<div class="mark" data-reveal>
				<span class="mark-word">DRIP</span>
				<h2>The name</h2>
				<p>What the ocean leaves on you when you walk out of it and back into town.</p>
			</div>
		</div>
	</section>

	<section class="section about-cta">
		<div class="wrap about-cta-inner">
			<h2 class="section-title">See the drop.</h2>
			<a class="btn btn-foam" href="<?php echo drip_wc_url( 'shop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Shop all <?php echo drip_icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
		</div>
	</section>
</main>
