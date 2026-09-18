<?php
/**
 * Template Name: AI Visibility
 *
 * @package mcgrath-chrome
 */

get_header();
?>

<section class="phero">
	<div class="pin">
		<div class="pheroTxt">
			<span class="mono"><?php esc_html_e( 'Answer engine optimization', 'mcgrath-chrome' ); ?></span>
			<h1 data-tag="&lt;h1&gt;"><?php esc_html_e( 'Get Cited by AI, Not Just Ranked', 'mcgrath-chrome' ); ?></h1>
			<p class="sub"><?php esc_html_e( 'When a buyer asks ChatGPT, Gemini, Perplexity or a Google AI Overview who to call in Jupiter, three names come back. This is the work that makes one of them yours.', 'mcgrath-chrome' ); ?></p>
		</div>
		<?php mcg_page_art( 'aeo', 'Search queries from Google, ChatGPT, Gemini and Perplexity converging on one brand' ); ?>
	</div>
</section>

<div class="gut">
	<p class="lede rv"><?php esc_html_e( 'Search did not stop working. It changed shape. A growing number of people now ask a model a question and read one paragraph with a short list of sources instead of scanning ten blue links. There is no second page in that format. Either your business is in the paragraph or it was never considered.', 'mcgrath-chrome' ); ?></p>

	<div class="split rv">
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'What actually gets you cited', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Not prompt tricks, and not paying anyone for placement. Models quote sources they can parse and have reason to trust. In practice that comes down to five things.', 'mcgrath-chrome' ); ?></p>
			<ul class="checks">
				<li><?php esc_html_e( 'Structured data that says plainly what you do and where', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Claims written so they can be lifted in one sentence', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Presence on the third party pages those models already read', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Consistent business facts everywhere they appear', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Content in the format an answer needs, not a blog format', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'How it is measured', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'A fixed set of buying questions your customers would actually type, run against the major models every month. You see which ones name you, which ones name a competitor, and which sources those answers pulled from.', 'mcgrath-chrome' ); ?></p>
			<p><?php esc_html_e( 'That tracking is the whole point. Without it, AI visibility is a story an agency tells you. With it, it is a number that moves.', 'mcgrath-chrome' ); ?></p>
		</div>
	</div>

	<div class="split rv">
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Why now', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Almost nobody in this market is doing this yet. Local competitors are still selling the same blog packages they sold in 2019. The window where being early is cheap does not stay open long, and citations compound the same way links do.', 'mcgrath-chrome' ); ?></p>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'It is not separate from SEO', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'The foundation is shared. A site that is clean, fast, structured and genuinely useful does well in both places. Anyone selling AI visibility as a product disconnected from your actual website is selling you a dashboard.', 'mcgrath-chrome' ); ?></p>
		</div>
	</div>

	<article class="entry rv">
		<?php while ( have_posts() ) { the_post(); the_content(); } ?>
	</article>
</div>

<?php
get_footer();
