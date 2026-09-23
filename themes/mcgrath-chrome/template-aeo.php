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
		<?php mcg_page_art( 'aeo', 'Search bars from four AI engines converging on a single brand panel' ); ?>
	</div>
</section>

<div class="gut">
	<p class="lede rv"><?php esc_html_e( 'Search did not stop working. It changed shape. A growing number of people now ask a model a question and read one paragraph with a short list of sources instead of scanning ten blue links. There is no second page in that format. Either your business is in the paragraph or it was never considered.', 'mcgrath-chrome' ); ?></p>

	<div class="split rv">
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'What actually gets a business cited by AI?', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Not prompt tricks, and not paying anyone for placement. Models quote sources they can parse and have reason to trust. In practice that comes down to five things.', 'mcgrath-chrome' ); ?></p>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'What are the five things that matter?', 'mcgrath-chrome' ); ?></h3>
			<ul class="checks">
				<li><?php esc_html_e( 'Structured data that says plainly what you do and where', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Claims written so they can be lifted in one sentence', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Presence on the third party pages those models already read', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Consistent business facts everywhere they appear', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Content in the format an answer needs, not a blog format', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'How is AI visibility measured?', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'A fixed set of buying questions your customers would actually type, run against the major models every month. You see which ones name you, which ones name a competitor, and which sources those answers pulled from.', 'mcgrath-chrome' ); ?></p>
			<p><?php esc_html_e( 'That tracking is the whole point. Without it, AI visibility is a story an agency tells you. With it, it is a number that moves.', 'mcgrath-chrome' ); ?></p>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'What goes into a question set?', 'mcgrath-chrome' ); ?></h3>
			<ul class="checks">
				<li><?php esc_html_e( 'The phrasing a buyer would actually use, not keyword strings', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Questions naming your town, and questions that do not', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'The same set every month, so the result is comparable', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'The URLs each answer cited, so you can see the source', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
	</div>

	<div class="split rv">
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Why do this now?', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Almost nobody in this market is doing this yet. Local competitors are still selling the same blog packages they sold in 2019. The window where being early is cheap does not stay open long, and citations compound the same way links do.', 'mcgrath-chrome' ); ?></p>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'What is this not?', 'mcgrath-chrome' ); ?></h3>
			<ul class="checks">
				<li><?php esc_html_e( 'Not paying anyone for placement in an answer', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Not prompt tricks aimed at a single model', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Not a guarantee that a model will name you', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Is AI search optimization separate from SEO?', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'No, and anyone selling it that way is selling a dashboard. The foundation is shared. A site that is clean, fast, structured and genuinely useful does well in both places. Anyone selling AI visibility as a product disconnected from your actual website is selling you a dashboard.', 'mcgrath-chrome' ); ?></p>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'What changes on your own site?', 'mcgrath-chrome' ); ?></h3>
			<p><?php esc_html_e( 'Structured data, headings that pose the question a buyer asks, and answers written to be lifted whole. The same pages that rank in the SERPs get easier to quote.', 'mcgrath-chrome' ); ?></p>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'What changes off your site?', 'mcgrath-chrome' ); ?></h3>
			<p><?php esc_html_e( 'Your business facts made consistent everywhere they already appear, and presence built on the third party sources those models read when they answer.', 'mcgrath-chrome' ); ?></p>
		</div>
	</div>

	<?php mcg_depth( 'aeo' ); ?>

	<?php mcg_table( 'aeo' ); ?>

	<?php mcg_questions( 'aeo', 'h3' ); ?>

	<?php mcg_faq_block( 'aeo', __( 'What else do people ask about AI search?', 'mcgrath-chrome' ) ); ?>

	<article class="entry rv">
		<?php while ( have_posts() ) { the_post(); the_content(); } ?>
	</article>
</div>

<?php
get_footer();
