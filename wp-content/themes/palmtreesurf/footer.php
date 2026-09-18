<?php
/**
 * Site footer — deep ocean, four columns, per the approved mockup.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;
?>
	</main>

	<footer id="colophon" class="site-footer">
		<div class="container">
			<div class="site-footer__cols">

				<div class="site-footer__col site-footer__col--brand">
					<?php // Reversed mark: the footer is always deep ocean. ?>
					<?php echo pt_site_logo( 'light' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped in pt_site_logo(). ?>

					<?php
					$pt_statement = get_bloginfo( 'description' );
					if ( $pt_statement ) {
						printf( '<p class="site-footer__statement">%s</p>', esc_html( $pt_statement ) );
					}
					?>

					<?php pt_social_links(); ?>
				</div>

				<div class="site-footer__col">
					<h2 class="site-footer__heading"><?php esc_html_e( 'Explore Tamarindo', 'palmtreesurf' ); ?></h2>
					<?php
					$pt_types = get_terms(
						array(
							'taxonomy'   => 'experience_type',
							'hide_empty' => false,
							'number'     => 7,
						)
					);

					if ( $pt_types && ! is_wp_error( $pt_types ) ) :
						?>
						<ul class="site-footer__list">
							<?php foreach ( $pt_types as $pt_type ) : ?>
								<li><a href="<?php echo esc_url( get_term_link( $pt_type ) ); ?>"><?php echo esc_html( $pt_type->name ); ?></a></li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>
				</div>

				<div class="site-footer__col">
					<h2 class="site-footer__heading"><?php esc_html_e( 'Support', 'palmtreesurf' ); ?></h2>
					<?php
					if ( has_nav_menu( 'footer' ) ) {
						wp_nav_menu(
							array(
								'theme_location' => 'footer',
								'menu_class'     => 'site-footer__list',
								'container'      => false,
								'depth'          => 1,
							)
						);
					}
					?>
				</div>

				<div class="site-footer__col">
					<h2 class="site-footer__heading"><?php esc_html_e( 'Get in touch', 'palmtreesurf' ); ?></h2>

					<?php
					$pt_phone = pt_filled( 'pt_phone' );
					if ( $pt_phone ) {
						printf(
							'<p><a href="tel:%1$s">%2$s</a></p>',
							esc_attr( preg_replace( '/[^\d+]/', '', $pt_phone ) ),
							esc_html( $pt_phone )
						);
					}

					$pt_email = pt_filled( 'pt_email' );
					if ( $pt_email && is_email( $pt_email ) ) {
						printf(
							'<p><a href="%1$s">%2$s</a></p>',
							esc_url( 'mailto:' . $pt_email ),
							esc_html( $pt_email )
						);
					}

					$pt_wa = pt_whatsapp_url();
					if ( $pt_wa ) {
						printf(
							'<p><a href="%1$s" rel="noopener" target="_blank">%2$s</a></p>',
							esc_url( $pt_wa ),
							esc_html__( 'WhatsApp us', 'palmtreesurf' )
						);
					}

					$pt_hours = pt_filled( 'pt_hours' );
					if ( $pt_hours ) {
						printf( '<p class="site-footer__hours">%s</p>', nl2br( esc_html( $pt_hours ) ) );
					}
					?>

					<p class="site-footer__cta">
						<?php
						pt_booking_button(
							array(
								'label'    => __( 'Book an experience', 'palmtreesurf' ),
								'location' => 'footer',
								'class'    => 'btn btn--primary btn--sm',
							)
						);
						?>
					</p>
				</div>

			</div>
		</div>

		<div class="site-footer__bar">
			<div class="container site-footer__bar-inner">
				<p class="site-footer__copyright">
					<?php
					printf(
						/* translators: 1: year, 2: site name. */
						esc_html__( '© %1$s %2$s. All rights reserved.', 'palmtreesurf' ),
						esc_html( wp_date( 'Y' ) ),
						esc_html( get_bloginfo( 'name' ) )
					);
					?>
				</p>

				<?php
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

				<p class="site-footer__place">
					<?php echo pt_get_icon( 'pin', '', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static SVG. ?>
					<?php esc_html_e( 'Tamarindo, Costa Rica', 'palmtreesurf' ); ?>
				</p>
			</div>
		</div>
	</footer>
</div>

<?php
$pt_float_wa = pt_whatsapp_url();
if ( $pt_float_wa ) :
	?>
	<a class="wa-float" href="<?php echo esc_url( $pt_float_wa ); ?>" rel="noopener" target="_blank" data-cta-location="floating-whatsapp">
		<span class="screen-reader-text"><?php esc_html_e( 'Message us on WhatsApp', 'palmtreesurf' ); ?></span>
		<svg class="wa-float__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
			<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.4A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20Zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.6-.7c.1-.2.1-.3 0-.5l-.7-1.7c-.1-.3-.3-.3-.5-.3h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.6-.9 2.5a9 9 0 0 0 2.5 4.2 8 8 0 0 0 4.5 2.2c.9.1 1.8-.2 2.4-.9.2-.2.3-.5.3-.8v-.2c0-.2-.1-.3-.2-.4Z"/>
		</svg>
	</a>
<?php endif; ?>

<?php wp_footer(); ?>
</body>
</html>
