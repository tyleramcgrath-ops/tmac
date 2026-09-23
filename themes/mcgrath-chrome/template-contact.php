<?php
/**
 * Template Name: Contact
 *
 * @package mcgrath-chrome
 */

get_header();
?>

<section class="phero solo">
	<div class="pin">
		<div class="pheroTxt">
			<span class="mono"><?php esc_html_e( 'One call, no pitch', 'mcgrath-chrome' ); ?></span>
			<h1 data-tag="&lt;h1&gt;"><?php esc_html_e( 'Get a Free Jupiter SEO Audit', 'mcgrath-chrome' ); ?></h1>
			<p class="sub"><?php esc_html_e( 'I will look at your rankings, your site health and whether AI answers mention you at all, then send back the three things worth fixing first. It costs nothing and you keep the findings either way.', 'mcgrath-chrome' ); ?></p>
		</div>
	</div>
</section>

<!-- the enquiry itself: the form beside the chart, contact details beneath -->
<section class="enqSec gut">
	<div class="enqIn">
		<div class="enqLeft rv">
			<span class="eyebrow"><?php esc_html_e( 'Tell me what you need', 'mcgrath-chrome' ); ?></span>
			<?php mcg_contact_form(); ?>
		</div>

		<figure class="enqMap rv" data-d="1">
			<?php mcg_img( 'page-contact', __( 'A chart of the Palm Beach coast with Jupiter, Florida marked', 'mcgrath-chrome' ) ); ?>
			<?php // the chart already names the town, so the caption adds the fix, not a repeat. ?>
			<figcaption>
				<span><?php echo esc_html( mcg_opt( 'mcg_coords', '26.9342° N, 80.0942° W' ) ); ?></span>
			</figcaption>
		</figure>
	</div>
</section>

<div class="gut">
	<div class="contactGrid rv">
		<div>
			<span class="mono"><?php esc_html_e( 'Email', 'mcgrath-chrome' ); ?></span>
			<a class="big" href="mailto:<?php echo esc_attr( mcg_opt( 'mcg_email', 'tyler@mcgrathmarketinggroup.com' ) ); ?>"><?php echo esc_html( mcg_opt( 'mcg_email', 'tyler@mcgrathmarketinggroup.com' ) ); ?></a>
		</div>
		<div>
			<span class="mono"><?php esc_html_e( 'Serving', 'mcgrath-chrome' ); ?></span>
			<p style="font-size:17px;line-height:1.6;color:var(--ink-70);">
				<?php esc_html_e( 'Jupiter, Palm Beach Gardens, Tequesta, Juno Beach, Abacoa, Jupiter Farms, Hobe Sound and Stuart. Remote clients welcome.', 'mcgrath-chrome' ); ?>
			</p>
		</div>
		<div>
			<span class="mono"><?php esc_html_e( 'Response', 'mcgrath-chrome' ); ?></span>
			<p style="font-size:17px;line-height:1.6;color:var(--ink-70);">
				<?php esc_html_e( 'Within one business day. You will hear from me, not from a scheduler bot.', 'mcgrath-chrome' ); ?>
			</p>
		</div>
	</div>

	<div class="split rv">
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'What happens after you send this', 'mcgrath-chrome' ); ?></h2>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'In order', 'mcgrath-chrome' ); ?></h3>
			<ul class="checks">
				<li><?php esc_html_e( 'I run the audit before we speak, so the call is not a discovery session', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'You get the findings in writing, yours to keep', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'If I am not the right fit, I will say so and point you somewhere better', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'No proposal deck, no follow up sequence, no pressure', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'What to send', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Your website address, the area you want customers from, and the one search term you wish you owned. That is enough to start.', 'mcgrath-chrome' ); ?></p>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'Useful, but not required', 'mcgrath-chrome' ); ?></h3>
			<ul class="checks">
				<li><?php esc_html_e( 'Read access to your analytics and Search Console', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'The businesses you consider your real competition', 'mcgrath-chrome' ); ?></li>
				<li><?php esc_html_e( 'Anything a previous agency left you, good or bad', 'mcgrath-chrome' ); ?></li>
			</ul>
		</div>
	</div>

	<div class="split rv">
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Why the audit is free', 'mcgrath-chrome' ); ?></h2>
			<p><?php esc_html_e( 'Because it is the fastest way for both of us to find out whether there is work worth doing. If the site is sound and the SERPs already treat it well, that takes an hour to establish and saves you a retainer. If it is not, you can see exactly what is wrong before spending anything.', 'mcgrath-chrome' ); ?></p>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'And what it costs you', 'mcgrath-chrome' ); ?></h3>
			<p><?php esc_html_e( 'One conversation. The findings are yours in writing either way, and they are just as useful handed to a developer or another agency as they are to me.', 'mcgrath-chrome' ); ?></p>
		</div>
		<div>
			<h2 data-tag="&lt;h2&gt;"><?php esc_html_e( 'Who this is for', 'mcgrath-chrome' ); ?></h2>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'Businesses in and around Jupiter', 'mcgrath-chrome' ); ?></h3>
			<p><?php esc_html_e( 'Proximity decides the map pack, so the local half of the audit is specific to the streets your customers actually search from, not to a county-wide average.', 'mcgrath-chrome' ); ?></p>
			<h3 data-tag="&lt;h3&gt;"><?php esc_html_e( 'Businesses further out', 'mcgrath-chrome' ); ?></h3>
			<p><?php esc_html_e( 'Still worth sending. The technical review, the content gaps and the AI visibility check run the same way wherever the business is, and the local portion is built around your area instead of mine.', 'mcgrath-chrome' ); ?></p>
		</div>
	</div>

	<?php mcg_depth( 'contact' ); ?>

	<?php mcg_table( 'contact' ); ?>

	<?php mcg_questions( 'contact', 'h3' ); ?>

	<?php mcg_faq_block( 'contact', __( 'Questions people ask before sending this', 'mcgrath-chrome' ) ); ?>

	<article class="entry rv">
		<?php while ( have_posts() ) { the_post(); the_content(); } ?>
	</article>
</div>

<?php
get_footer();
