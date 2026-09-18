<?php
/**
 * Footer.
 *
 * @package mcgrath-chrome
 */
?>
</main>

<footer class="site-foot gut">
	<div class="footIn">
		<a class="footBrand" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
			<img class="mark" src="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo.png' ); ?>"
				alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" width="1109" height="612" loading="lazy">
			<span><?php echo esc_html( mcg_opt( 'mcg_brand_line', 'McGrath Marketing Group' ) ); ?></span>
		</a>

		<nav class="footNav" aria-label="<?php esc_attr_e( 'Footer', 'mcgrath-chrome' ); ?>">
			<?php
			wp_nav_menu( array(
				'theme_location' => 'footer',
				'container'      => false,
				'depth'          => 1,
				'fallback_cb'    => 'mcg_fallback_menu',
			) );
			?>
		</nav>

		<p class="footMeta">
			<b><?php echo esc_html( mcg_opt( 'mcg_location', 'Jupiter, Florida' ) ); ?></b>
			<?php echo esc_html( mcg_opt( 'mcg_reach', 'Serving Clients Nationwide' ) ); ?>
		</p>

		<div class="social">
			<?php foreach ( mcg_social() as $mcg_s ) : ?>
				<a href="<?php echo esc_url( $mcg_s['url'] ); ?>" rel="noopener" target="_blank"
					aria-label="<?php echo esc_attr( $mcg_s['label'] ); ?>"><?php mcg_icon( $mcg_s['icon'] ); ?></a>
			<?php endforeach; ?>
		</div>
	</div>

	<div class="footLegal">
		<span>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. <?php esc_html_e( 'All rights reserved.', 'mcgrath-chrome' ); ?></span>
		<span><?php echo esc_html( mcg_opt( 'mcg_tagline', 'A Higher Visibility. A Brighter Tomorrow.' ) ); ?>&trade;</span>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
