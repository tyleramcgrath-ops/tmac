<?php
/**
 * Site footer and closing document tags.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;
?>
	</main>

	<footer id="colophon" class="site-footer">
		<div class="site-footer__inner container">
			<div class="site-footer__contact">
				<h2 class="site-footer__heading"><?php esc_html_e( 'Get in touch', 'palmtreesurf' ); ?></h2>

				<?php
				$pts_address = pts_mod( 'pts_address' );
				if ( $pts_address ) {
					printf( '<address class="site-footer__address">%s</address>', nl2br( esc_html( $pts_address ) ) );
				}

				$pts_phone = pts_mod( 'pts_phone' );
				if ( $pts_phone ) {
					printf(
						'<p><a href="tel:%1$s">%2$s</a></p>',
						esc_attr( preg_replace( '/[^\d+]/', '', $pts_phone ) ),
						esc_html( $pts_phone )
					);
				}

				$pts_email = pts_mod( 'pts_email' );
				if ( $pts_email && is_email( $pts_email ) ) {
					printf(
						'<p><a href="%1$s">%2$s</a></p>',
						esc_url( 'mailto:' . $pts_email ),
						esc_html( $pts_email )
					);
				}

				$pts_hours = pts_mod( 'pts_hours' );
				if ( $pts_hours ) {
					printf( '<p class="site-footer__hours">%s</p>', nl2br( esc_html( $pts_hours ) ) );
				}

				$pts_map = pts_mod( 'pts_map_url' );
				if ( $pts_map ) {
					printf(
						'<p><a href="%1$s" rel="noopener" target="_blank">%2$s</a></p>',
						esc_url( $pts_map ),
						esc_html__( 'Find us on the map', 'palmtreesurf' )
					);
				}

				pts_whatsapp_link();
				pts_social_links();
				?>
			</div>

			<?php if ( has_nav_menu( 'footer' ) ) : ?>
				<nav class="site-footer__nav" aria-label="<?php esc_attr_e( 'Footer', 'palmtreesurf' ); ?>">
					<?php
					wp_nav_menu(
						array(
							'theme_location' => 'footer',
							'menu_class'     => 'footer-nav',
							'container'      => false,
							'depth'          => 1,
						)
					);
					?>
				</nav>
			<?php endif; ?>

			<?php if ( is_active_sidebar( 'footer-1' ) ) : ?>
				<div class="site-footer__widgets">
					<?php dynamic_sidebar( 'footer-1' ); ?>
				</div>
			<?php endif; ?>
		</div>

		<div class="site-footer__bar">
			<div class="container">
				<?php
				$pts_footer_text = pts_mod( 'pts_footer_text' );
				if ( $pts_footer_text ) {
					printf( '<p class="site-footer__text">%s</p>', esc_html( $pts_footer_text ) );
				}

				printf(
					'<p class="site-footer__copyright">&copy; %1$s %2$s</p>',
					esc_html( gmdate( 'Y' ) ),
					esc_html( get_bloginfo( 'name' ) )
				);

				if ( has_nav_menu( 'legal' ) ) {
					wp_nav_menu(
						array(
							'theme_location' => 'legal',
							'menu_class'     => 'legal-nav',
							'container'      => false,
							'depth'          => 1,
						)
					);
				}
				?>
			</div>
		</div>
	</footer>
</div>

<?php wp_footer(); ?>
</body>
</html>
