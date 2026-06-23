<?php
/**
 * 404 — matches the RMA "404 Page" mockup.
 *
 * @package rma
 */

get_header();
?>

<section class="error-404">
	<div class="container">
		<div class="big">404</div>
		<h2><?php esc_html_e( 'Page not found', 'rma' ); ?></h2>
		<p class="lead" style="max-width:420px;margin:0 auto 28px"><?php esc_html_e( "Looks like you've ventured into unexplored territory.", 'rma' ); ?></p>
		<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to Home', 'rma' ); ?></a>
	</div>
</section>

<?php
get_footer();
