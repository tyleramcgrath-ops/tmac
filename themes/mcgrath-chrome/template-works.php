<?php
/**
 * Template Name: Works
 *
 * The portfolio. Every other page on this site is black and white; this is
 * the one place colour appears, and all of it belongs to the work rather
 * than to the theme. The header carries that idea literally: the twelve
 * screenshots are laid out as one picture behind the title, greyed down,
 * and the cursor light restores the colour it crosses.
 *
 * @package mcgrath-chrome
 */

get_header();

$mcg_works = mcg_works();
?>

<section class="phero bedded worksHero">
	<?php mcg_light_bed( 'page-works', '50% 50%' ); ?>
	<div class="pin">
		<div class="pheroTxt">
			<span class="mono"><?php esc_html_e( 'Selected work', 'mcgrath-chrome' ); ?></span>
			<h1 data-tag="&lt;h1&gt;"><?php esc_html_e( 'Works', 'mcgrath-chrome' ); ?></h1>
			<p class="sub"><?php
				printf(
					/* translators: %s: the number of sites, in words. */
					esc_html__( 'Every page on this site is black and white. These %s are the exception, because the colour is theirs. Move the light to see them.', 'mcgrath-chrome' ),
					esc_html( number_format_i18n( count( $mcg_works ) ) )
				);
			?></p>
		</div>
	</div>
</section>

<div class="gut">
	<p class="lede rv"><?php esc_html_e( 'Live sites, each one still running. Restaurants and surf schools, a legal directory covering fifty states, an electrician, a builder, a clothing label and a piece of software. Every screenshot below was taken from the site as it stands, and every line under one is that site describing itself.', 'mcgrath-chrome' ); ?></p>
</div>

<section class="worksSec">
	<div class="gut">

		<div class="wkLedger rv" role="presentation">
			<?php foreach ( $mcg_works as $mcg_i => $mcg_w ) : ?>
				<span class="wkLedgerRow">
					<span><?php echo esc_html( sprintf( '%02d', $mcg_i + 1 ) ); ?></span>
					<span><?php echo esc_html( $mcg_w['name'] ); ?></span>
					<span><?php echo esc_html( $mcg_w['tag'] ); ?></span>
				</span>
			<?php endforeach; ?>
		</div>

		<div class="wkGrid">
			<?php foreach ( $mcg_works as $mcg_i => $mcg_w ) : ?>
				<?php mcg_work_card( $mcg_w, $mcg_i ); ?>
			<?php endforeach; ?>
		</div>

	</div>
</section>

<div class="gut">
	<article class="entry rv">
		<?php while ( have_posts() ) { the_post(); the_content(); } ?>
	</article>
</div>

<?php
get_footer();
