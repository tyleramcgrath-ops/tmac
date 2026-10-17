<?php
/**
 * Not found.
 *
 * @package gag
 */

get_header();
?>
<div class="page-wrap" style="text-align:center">
	<p class="label"><?php esc_html_e( 'Page not found', 'gag' ); ?></p>
	<h1 class="page-title" style="margin-top:16px"><?php esc_html_e( 'This page got lost somewhere around the globe.', 'gag' ); ?></h1>
	<p class="entry-content"><a class="btn btn-gold" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to the homepage', 'gag' ); ?></a></p>
</div>
<?php
get_footer();
