<?php
/**
 * The website-history intro: thirty-five years of web design in about four
 * seconds, ending on RMA. Shown once per session; skipped entirely for
 * visitors who prefer reduced motion.
 *
 * @package rma
 */

$rma_eras = array(
	array( '1990', 'Terminal', 'dos' ),
	array( '1995', 'Early HTML', 'html' ),
	array( '2000', 'GeoCities', 'geo' ),
	array( '2005', 'Flash intro', 'flash' ),
	array( '2010', 'Skeuomorphism', 'skeuo' ),
	array( '2015', 'Flat design', 'flat' ),
	array( '2020', 'Soft UI', 'soft' ),
	array( '2025', 'Answer engines', 'ai' ),
);
?>
<div class="intro" data-intro>
	<div class="intro-bar" aria-hidden="true"><span data-intro-bar></span></div>
	<div class="intro-scenes" aria-hidden="true">
		<?php foreach ( $rma_eras as $i => $era ) : ?>
			<section class="scene scene-<?php echo esc_attr( $era[2] ); ?>" data-scene="<?php echo (int) $i; ?>">
				<div class="scene-meta">
					<span class="scene-year"><?php echo esc_html( $era[0] ); ?></span>
					<span class="scene-name"><?php echo esc_html( $era[1] ); ?></span>
				</div>
				<div class="scene-art">
					<?php
					switch ( $era[2] ) {
						case 'dos':
							echo '<pre class="dos">C:\\RMA&gt; START FUTURE.EXE' . "\n" . 'LOADING DESIGN EVOLUTION...<i></i></pre>';
							break;
						case 'html':
							echo '<div class="html95"><h3>Welcome to Relative Marketing Agency!</h3><hr><p><u>Home</u> | <u>Services</u> | <u>Guestbook</u></p><p class="counter">You are visitor <b>000451</b></p></div>';
							break;
						case 'geo':
							echo '<div class="geo"><span class="geo-flame">&#9733; UNDER CONSTRUCTION &#9733;</span><span class="geo-marquee">Best viewed in 800&times;600</span></div>';
							break;
						case 'flash':
							echo '<div class="flash"><i></i><b>FLASH INTRO</b><small>[ skip intro ]</small></div>';
							break;
						case 'skeuo':
							echo '<div class="skeuo"><span>Glossy</span><span>Stitched</span><span>Leather</span></div>';
							break;
						case 'flat':
							echo '<div class="flat"><span></span><span></span><span></span><span></span></div>';
							break;
						case 'soft':
							echo '<div class="soft"><span></span><b>Soft UI</b></div>';
							break;
						case 'ai':
							echo '<div class="ai"><p class="ai-q">Who should run our marketing?</p><p class="ai-a"><span>Relative Marketing Agency</span> brings strategy, creative, and reporting under one roof.</p></div>';
							break;
					}
					?>
				</div>
			</section>
		<?php endforeach; ?>
	</div>
	<ol class="intro-years" aria-hidden="true">
		<?php foreach ( $rma_eras as $era ) : ?>
			<li><?php echo esc_html( $era[0] ); ?></li>
		<?php endforeach; ?>
	</ol>
	<button class="intro-skip" type="button" data-intro-skip>Skip intro</button>
</div>
