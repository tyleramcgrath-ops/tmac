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
		</div>
	</div>

	<article class="entry rv">
		<?php while ( have_posts() ) { the_post(); the_content(); } ?>
	</article>
</div>

<?php
get_footer();
