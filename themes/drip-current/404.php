<?php
/**
 * Not found.
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<main id="main" class="site-main">
	<div class="container empty-state empty-state--404">
		<p class="eyebrow">404</p>
		<h1 class="page-title"><?php esc_html_e( 'Lost the line', 'drip-current' ); ?></h1>
		<p><?php esc_html_e( 'That page drifted out with the tide.', 'drip-current' ); ?></p>
		<a class="pill-button" href="<?php echo esc_url( drip_current_shop_url() ); ?>"><?php esc_html_e( 'Shop the tee edit', 'drip-current' ); ?> <?php echo drip_current_icon( 'chevron-r' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
	</div>
</main>
<?php
get_footer();
