<?php
/**
 * Template Name: SEO Services
 *
 * @package mcgrath-chrome
 */

get_header();
?>

<section class="phero">
	<div class="pin">
		<div class="pheroTxt">
			<span class="mono"><?php esc_html_e( 'Search engine optimization', 'mcgrath-chrome' ); ?></span>
			<h1 data-tag="&lt;h1&gt;"><?php esc_html_e( 'SEO Company in Jupiter, FL', 'mcgrath-chrome' ); ?></h1>
			<p class="sub"><?php esc_html_e( 'Local and national search work for businesses in Jupiter, Palm Beach Gardens and Tequesta. Run by the person who does it, priced in the open, with no long contract.', 'mcgrath-chrome' ); ?></p>
		</div>
		<?php mcg_page_art( 'seo', 'The Jupiter Inlet light standing over a rising curve of search rankings' ); ?>
	</div>
</section>

<div class="gut">
	<p class="lede rv"><?php esc_html_e( 'Most Jupiter businesses do not have a traffic problem. They have a visibility problem inside a two mile radius, a site that loads slowly on a phone at the beach, and a Google Business Profile nobody has touched since it was claimed. That is usually where the money is, and it is where this starts.', 'mcgrath-chrome' ); ?></p>

	<div class="split rv">
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Local SEO', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Showing up in the map pack when somebody in Abacoa or Jupiter Farms searches for what you sell. That means a Google Business Profile that is actually optimized, consistent citations across the directories that matter in Palm Beach County, location pages that are written rather than spun, and reviews arriving on a schedule instead of in bursts.', 'mcgrath-chrome' ); ?></p>
			<ul class="checks">
				<li><?php esc_html_e( 'Google Business Profile optimization and posting', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Citation cleanup and NAP consistency', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Service area and neighborhood pages', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Review generation that does not feel spammy', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Local schema and map embedding', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Technical SEO', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'The unglamorous half. Crawl and index issues, page speed and Core Web Vitals, internal linking, duplicate and thin pages, redirect chains left behind by the last redesign. None of it is exciting and all of it decides whether the content you publish ever gets a chance.', 'mcgrath-chrome' ); ?></p>
			<ul class="checks">
				<li><?php esc_html_e( 'Full technical audit with a prioritized fix list', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Core Web Vitals and mobile performance', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Schema markup and structured data', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Site architecture and internal linking', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Migration and redirect mapping', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
	</div>

	<div class="split rv">
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Content that earns the ranking', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Pages written for the question behind the search, not for a keyword density target. For a local business that usually means service pages with real detail, comparison and cost pages that answer what buyers are nervous about, and a small number of articles that are genuinely worth linking to.', 'mcgrath-chrome' ); ?></p>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Reporting you can read', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'One monthly report in plain English: what moved, what did not, what is next, and what it is worth. No forty page PDF of screenshots. If a month was slow you will hear that from me before you notice it yourself.', 'mcgrath-chrome' ); ?></p>
		</div>
	</div>

	<div class="tiers rv">
		<div class="tier">
			<h3><?php esc_html_e( 'One-off audit', 'mcgrath-chrome' ); ?></h3>
			<span class="price"><?php echo esc_html( mcg_opt( 'mcg_price_audit', 'On request' ) ); ?></span>
			<ul>
				<li><?php esc_html_e( 'Technical, local and content review', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Competitor comparison', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Prioritized fix list you can hand anyone', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
		<div class="tier feature">
			<h3><?php esc_html_e( 'Monthly SEO', 'mcgrath-chrome' ); ?></h3>
			<span class="price"><?php echo esc_html( mcg_opt( 'mcg_price_month', 'On request' ) ); ?></span>
			<ul>
				<li><?php esc_html_e( 'Local and organic run together', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Content shipped every month', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Technical work included, not billed extra', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Cancel any month', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
		<div class="tier">
			<h3><?php esc_html_e( 'Local launch', 'mcgrath-chrome' ); ?></h3>
			<span class="price"><?php echo esc_html( mcg_opt( 'mcg_price_launch', 'Fixed scope, on request' ) ); ?></span>
			<ul>
				<li><?php esc_html_e( 'Profile, citations and location pages', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Schema and tracking setup', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Ninety day plan handed over', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
	</div>

	<article class="entry rv">
		<?php while ( have_posts() ) { the_post(); the_content(); } ?>
	</article>
</div>

<?php
get_footer();
