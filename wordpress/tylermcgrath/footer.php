<?php
/**
 * Site footer.
 *
 * @package tylermcgrath
 */

?>
<footer class="tm-footer">
	<div class="tm-wrap tm-footer__inner">
		<div class="tm-footer__brand">
			<?php tm_seal( 'tm-footer__seal' ); ?>
			<div>
				<strong><?php echo tm_caps( get_bloginfo( 'name' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></strong>
				<span><?php echo esc_html( tm_mod( 'location_sub' ) ); ?></span>
			</div>
		</div>
		<nav class="tm-footer__nav" aria-label="<?php esc_attr_e( 'Footer', 'tylermcgrath' ); ?>">
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_class'     => 'tm-menu',
					'depth'          => 1,
					'fallback_cb'    => 'tm_menu_fallback',
				)
			);
			?>
		</nav>
		<div class="tm-footer__social">
			<?php foreach ( tm_socials() as $social ) : ?>
				<a href="<?php echo esc_url( $social['url'] ); ?>" target="_blank" rel="noopener me" aria-label="<?php echo esc_attr( $social['label'] ); ?>"><?php echo tm_icon( $social['icon'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a>
			<?php endforeach; ?>
			<a href="#top" class="tm-footer__top" data-to-top aria-label="<?php esc_attr_e( 'Back to top', 'tylermcgrath' ); ?>"><?php echo tm_icon( 'arrow-up' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a>
		</div>
	</div>
	<div class="tm-wrap tm-footer__base">
		<span>© <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php echo tm_caps( get_bloginfo( 'name' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
		<span><?php echo esc_html( tm_mod( 'entrance_footer' ) ); ?> ✧</span>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
