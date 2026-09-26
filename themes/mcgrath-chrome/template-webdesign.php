<?php
/**
 * Template Name: Web Design
 *
 * @package mcgrath-chrome
 */

get_header();
?>

<section class="phero">
	<div class="pin">
		<div class="pheroTxt">
			<span class="mono"><?php esc_html_e( 'Design and development', 'mcgrath-chrome' ); ?></span>
			<h1 data-tag="&lt;h1&gt;"><?php esc_html_e( 'Web Design in Jupiter, FL', 'mcgrath-chrome' ); ?></h1>
			<p class="sub"><?php esc_html_e( 'Custom WordPress sites for Palm Beach County businesses. Fast, built to rank from launch day, and handed over so you own every part of it.', 'mcgrath-chrome' ); ?></p>
		</div>
		<?php mcg_page_art( 'webdesign', 'A laptop and phone on a seawall showing the same site at both sizes' ); ?>
	</div>
</section>

<div class="gut">
	<p class="lede rv"><?php esc_html_e( 'A website is not a brochure and it is not a portfolio piece. It is the thing that has to turn a stranger who found you at ten at night into a phone call the next morning. Most local sites fail at that for boring reasons: they load slowly, they bury the phone number, and they were built on a theme that search engines have to fight through.', 'mcgrath-chrome' ); ?></p>

	<?php mcg_questions( 'webdesign', 'h2' ); ?>

	<div class="split rv">
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'What a build includes', 'mcgrath-chrome' ); ?></h2>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'On every build', 'mcgrath-chrome' ); ?></h3>
			<ul class="checks">
				<li><?php esc_html_e( 'Custom design, no marketplace theme with your logo dropped on it', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Built on WordPress so you can edit it without calling me', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Core Web Vitals handled before launch, not after', 'mcgrath-chrome' ); ?></li>
			</ul>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'Before it goes live', 'mcgrath-chrome' ); ?></h3>
			<ul class="checks">
				<li><?php esc_html_e( 'Schema, clean heading structure and crawlable markup', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Mobile first, because most of your traffic is on a phone', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Analytics, call tracking and form tracking wired up', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Redesigns without losing rankings', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'The most expensive mistake in local web design is a redesign that looks better and ranks worse. It happens when URLs change without redirects, when content gets trimmed for aesthetics, and when nobody checks what the old site was ranking for before it is replaced.', 'mcgrath-chrome' ); ?></p>
			<p><?php esc_html_e( 'Every redesign here starts with a crawl of the current site, a map of what it earns today, and a redirect plan written before a single page is designed.', 'mcgrath-chrome' ); ?></p>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'The redirect map', 'mcgrath-chrome' ); ?></h3>
			<ul class="checks">
				<li><?php esc_html_e( 'Crawl the live site and list every URL', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Record what each one earns in the SERPs today', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Point every old URL at its closest new match', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Re-crawl after launch and fix what broke', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
	</div>

	<?php
	mcg_body_art(
		'art-mobile',
		__( 'The same site shown on two phones, beside the shoreline it was designed for', 'mcgrath-chrome' ),
		__( 'Every build is drawn at phone width first, then opened out.', 'mcgrath-chrome' )
	);
	?>

	<div class="split rv">
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Designed around the decision', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Pages are laid out around what a buyer needs to know in the order they need to know it: what you do, whether you serve their area, what it costs, what happens next. That order matters more than any visual trend.', 'mcgrath-chrome' ); ?></p>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'The order a page is read in', 'mcgrath-chrome' ); ?></h3>
			<p><?php esc_html_e( 'Above the fold answers what you do and where. Below it, proof and detail. The phone number and the form stay reachable the whole way down rather than waiting at the bottom.', 'mcgrath-chrome' ); ?></p>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'You own it', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'The site is yours, on your hosting, with your logins, documented so any developer can pick it up. No proprietary builder you have to keep paying for and no hostage situation if you move on.', 'mcgrath-chrome' ); ?></p>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'What gets handed over', 'mcgrath-chrome' ); ?></h3>
			<ul class="checks">
				<li><?php esc_html_e( 'Hosting, domain and WordPress logins in your name', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Analytics and Search Console under your account', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'The redirect map and a note on how the site is built', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
	</div>

	<?php mcg_depth( 'webdesign' ); ?>

	<?php mcg_table( 'webdesign' ); ?>

	<?php mcg_faq_block( 'webdesign', __( 'Questions people ask before a build', 'mcgrath-chrome' ) ); ?>

	<article class="entry rv">
		<?php while ( have_posts() ) { the_post(); the_content(); } ?>
	</article>
</div>

<?php
get_footer();
