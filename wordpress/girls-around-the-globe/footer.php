<?php
/**
 * Site footer.
 *
 * @package gag
 */

?>
</main>

<footer class="site-footer">
	<div class="wrap footer-main">
		<div class="footer-brand">
			<?php echo gag_logo( 'full' ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in gag_logo(). ?>
			<p><?php esc_html_e( 'Serious dating for adults around the world. Respect first, and no paid arrangements, ever.', 'gag' ); ?></p>
		</div>
		<nav class="footer-nav" aria-label="<?php esc_attr_e( 'Footer', 'gag' ); ?>">
			<?php
			if ( has_nav_menu( 'footer' ) ) {
				wp_nav_menu(
					array(
						'theme_location' => 'footer',
						'container'      => false,
						'depth'          => 1,
					)
				);
			} else {
				gag_default_menu();
			}
			?>
		</nav>
	</div>
	<div class="wrap footer-bottom">
		<span>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?> &middot; <?php esc_html_e( 'Adults 18+ only', 'gag' ); ?></span>
		<span><?php esc_html_e( 'Photos on our marketing pages show models.', 'gag' ); ?></span>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
