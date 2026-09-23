<?php
/**
 * Template Name: About
 *
 * @package mcgrath-chrome
 */

get_header();
?>

<section class="phero">
	<div class="pin">
		<div class="pheroTxt">
			<span class="mono"><?php esc_html_e( 'Who you are hiring', 'mcgrath-chrome' ); ?></span>
			<h1 data-tag="&lt;h1&gt;"><?php esc_html_e( 'One Person, Not an Agency', 'mcgrath-chrome' ); ?></h1>
			<p class="sub"><?php esc_html_e( 'Tyler McGrath. Search and web work for Jupiter and the surrounding area, done by the person you talk to.', 'mcgrath-chrome' ); ?></p>
		</div>
		<?php mcg_page_art( 'about', 'A laptop showing a coastal site on a seawall table, the inlet behind it' ); ?>
	</div>
</section>

<div class="gut">
	<p class="lede rv"><?php esc_html_e( 'I have spent my career in search. Not in a strategy role next to it, in it: audits, migrations, content programs, technical fixes and the reporting that tells you whether any of it worked. That is the whole business and there is nobody else here.', 'mcgrath-chrome' ); ?></p>

	<div class="split rv">
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'How do you work?', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Small number of clients at a time. Direct contact, no ticket queue. Fixed scope where it makes sense, monthly where it pays, and no contract designed to make leaving difficult.', 'mcgrath-chrome' ); ?></p>
			<p><?php esc_html_e( 'You get told what I actually think, including when the answer is that your site is fine and the money is better spent somewhere else.', 'mcgrath-chrome' ); ?></p>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Who is this a good fit for?', 'mcgrath-chrome' ); ?></h2>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'What does a good fit look like?', 'mcgrath-chrome' ); ?></h3>
			<ul class="checks">
				<li><?php esc_html_e( 'Local businesses that need the phone to ring from this area', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Owners who want to talk to the person doing the work', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Companies rebuilding a site and worried about losing rankings', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Anyone who has been burned by a monthly retainer with no output', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
	</div>

	<div class="split rv">
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Who is this not a good fit for?', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Companies that need a large team, a media buying department or twenty deliverables a month. One person has a ceiling and pretending otherwise would waste both our time.', 'mcgrath-chrome' ); ?></p>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'What will you not do?', 'mcgrath-chrome' ); ?></h3>
			<ul class="checks">
				<li><?php esc_html_e( 'Take a retainer for work that has nowhere left to go', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Promise a position in the SERPs by a particular date', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Rebuild a site that did not need rebuilding', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Hold your logins, your URLs or your data hostage', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Can I see examples of your work?', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Not published, but yes on a call. Client work is kept private out of respect for the businesses involved. If you want to see examples, ask on the call and I will walk you through them directly.', 'mcgrath-chrome' ); ?></p>
		</div>
	</div>

	<div class="rv">
		<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'How does an engagement run?', 'mcgrath-chrome' ); ?></h2>
		<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'What happens in the first conversation?', 'mcgrath-chrome' ); ?></h3>
		<p><?php esc_html_e( 'The audit is run before we speak, so the call is spent on what it found rather than on discovery questions. You leave it knowing what is wrong, roughly what it takes to fix, and whether I am the right person to do it.', 'mcgrath-chrome' ); ?></p>
		<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'What happens in the first month?', 'mcgrath-chrome' ); ?></h3>
		<p><?php esc_html_e( 'Technical fixes first, because they are the cheapest wins and everything else depends on them. Alongside that, the pages and URLs that already nearly rank get the attention, since moving something from the bottom of page one beats starting a new page from nothing.', 'mcgrath-chrome' ); ?></p>
		<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'What happens every month after?', 'mcgrath-chrome' ); ?></h3>
		<p><?php esc_html_e( 'Content ships, local signals get maintained, and one report tells you what moved in the SERPs, what did not, and what is next. You deal with me directly throughout, and you can stop at the end of any month.', 'mcgrath-chrome' ); ?></p>
	</div>

	<?php mcg_depth( 'about' ); ?>

	<?php mcg_table( 'about' ); ?>

	<?php mcg_questions( 'about', 'h3' ); ?>

	<?php mcg_faq_block( 'about', __( 'What else do people ask before hiring me?', 'mcgrath-chrome' ) ); ?>

	<article class="entry rv">
		<?php while ( have_posts() ) { the_post(); the_content(); } ?>
	</article>
</div>

<?php
get_footer();
