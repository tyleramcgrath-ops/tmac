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
				$pt_address = pt_mod( 'pt_address' );
				if ( $pt_address ) {
					printf( '<address class="site-footer__address">%s</address>', nl2br( esc_html( $pt_address ) ) );
				}

				$pt_phone = pt_mod( 'pt_phone' );
				if ( $pt_phone ) {
					printf(
						'<p><a href="tel:%1$s">%2$s</a></p>',
						esc_attr( preg_replace( '/[^\d+]/', '', $pt_phone ) ),
						esc_html( $pt_phone )
					);
				}

				$pt_email = pt_mod( 'pt_email' );
				if ( $pt_email && is_email( $pt_email ) ) {
					printf(
						'<p><a href="%1$s">%2$s</a></p>',
						esc_url( 'mailto:' . $pt_email ),
						esc_html( $pt_email )
					);
				}

				$pt_hours = pt_mod( 'pt_hours' );
				if ( $pt_hours ) {
					printf( '<p class="site-footer__hours">%s</p>', nl2br( esc_html( $pt_hours ) ) );
				}

				$pt_map = pt_mod( 'pt_map_url' );
				if ( $pt_map ) {
					printf(
						'<p><a href="%1$s" rel="noopener" target="_blank">%2$s</a></p>',
						esc_url( $pt_map ),
						esc_html__( 'Find us on the map', 'palmtreesurf' )
					);
				}

				pt_whatsapp_link();
				pt_social_links();
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
				$pt_footer_text = pt_mod( 'pt_footer_text' );
				if ( $pt_footer_text ) {
					printf( '<p class="site-footer__text">%s</p>', esc_html( $pt_footer_text ) );
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
