<?php
/**
 * Site footer.
 *
 * @package comfy-humans-cloud
 */

defined( 'ABSPATH' ) || exit;
?>
</main>
<footer class="site-foot">
	<div class="wrap foot">
		<a class="logo" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo chc_cloud_svg(); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( strtolower( get_bloginfo( 'name' ) ) ); ?></a>
		<?php
		wp_nav_menu(
			array(
				'theme_location' => 'footer',
				'container'      => false,
				'depth'          => 1,
				'fallback_cb'    => false,
				'menu_class'     => 'foot-menu',
			)
		);
		?>
		<span><?php esc_html_e( 'Soft stuff. Happy humans. A little less rush.', 'comfy-humans-cloud' ); ?></span>
		<span>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php echo esc_html( get_bloginfo( 'name' ) ); ?></span>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
