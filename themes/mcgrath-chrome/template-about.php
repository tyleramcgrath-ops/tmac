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
		<?php mcg_page_art( 'about', 'The Jupiter shoreline' ); ?>
	</div>
</section>

<div class="gut">
	<p class="lede rv"><?php esc_html_e( 'I have spent my career in search. Not in a strategy role next to it, in it: audits, migrations, content programs, technical fixes and the reporting that tells you whether any of it worked. That is the whole business and there is nobody else here.', 'mcgrath-chrome' ); ?></p>

	<div class="split rv">
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'How I work', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Small number of clients at a time. Direct contact, no ticket queue. Fixed scope where it makes sense, monthly where it pays, and no contract designed to make leaving difficult.', 'mcgrath-chrome' ); ?></p>
			<p><?php esc_html_e( 'You get told what I actually think, including when the answer is that your site is fine and the money is better spent somewhere else.', 'mcgrath-chrome' ); ?></p>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Who this suits', 'mcgrath-chrome' ); ?></h2>
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
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Who this does not suit', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Companies that need a large team, a media buying department or twenty deliverables a month. One person has a ceiling and pretending otherwise would waste both our time.', 'mcgrath-chrome' ); ?></p>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Selected work', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Client work is kept private out of respect for the businesses involved. If you want to see examples, ask on the call and I will walk you through them directly.', 'mcgrath-chrome' ); ?></p>
		</div>
	</div>

	<article class="entry rv">
		<?php while ( have_posts() ) { the_post(); the_content(); } ?>
	</article>
</div>

<?php
get_footer();
