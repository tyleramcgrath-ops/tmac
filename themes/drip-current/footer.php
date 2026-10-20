<?php
/**
 * Site footer.
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;

$drip_region = drip_current_mod( 'drip_footer_region' );
if ( '' === $drip_region && function_exists( 'get_woocommerce_currency' ) ) {
	$drip_region = WC()->countries->get_base_country() . ' / ' . get_woocommerce_currency();
}
?>
<footer class="site-footer">
	<div class="site-footer__inner">
		<?php drip_current_brand( 'footer' ); ?>

		<nav class="footer-nav" aria-label="<?php esc_attr_e( 'Footer', 'drip-current' ); ?>">
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'footer',
					'container'      => false,
					'menu_class'     => 'menu',
					'depth'          => 1,
					'fallback_cb'    => 'drip_current_footer_fallback',
				)
			);
			?>
		</nav>

		<div class="footer-end">
			<?php drip_current_social_links(); ?>
			<?php if ( $drip_region ) : ?>
				<span class="footer-region"><?php echo esc_html( $drip_region ); ?></span>
			<?php endif; ?>
		</div>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
