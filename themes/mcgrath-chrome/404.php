<?php
/**
 * 404.
 *
 * @package mcgrath-chrome
 */

get_header();
?>

<section class="phero">
	<div class="pin">
		<div class="pheroTxt">
			<span class="mono"><?php esc_html_e( 'Error 404', 'mcgrath-chrome' ); ?></span>
			<h1 data-tag="&lt;h1&gt;"><?php esc_html_e( 'That page is not here', 'mcgrath-chrome' ); ?></h1>
		</div>
	</div>
</section>

<div class="gut">
	<article class="entry rv">
		<p><?php esc_html_e( 'The link is broken or the page moved. A 404 on a live site is usually a redirect that never got written, which is worth fixing.', 'mcgrath-chrome' ); ?></p>
		<p><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to the homepage', 'mcgrath-chrome' ); ?></a></p>
	</article>
</div>

<?php
get_footer();
