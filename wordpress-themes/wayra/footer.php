<?php
/**
 * Site footer.
 *
 * @package Wayra
 */

$wayra_socials = array(
	'facebook'  => 'Facebook',
	'instagram' => 'Instagram',
	'youtube'   => 'YouTube',
);
?>
<section class="cta-band">
	<div class="container cta-band__inner">
		<div>
			<p class="eyebrow eyebrow--light"><?php esc_html_e( 'Pura vida starts on Monday', 'wayra' ); ?></p>
			<h2 class="cta-band__title"><?php esc_html_e( 'Your Spanish, your beach, your week.', 'wayra' ); ?></h2>
		</div>
		<div class="cta-band__actions">
			<a class="btn btn--sun btn--lg" href="<?php echo esc_url( wayra_shop_url() ); ?>"><?php esc_html_e( 'Book your program', 'wayra' ); ?> <?php echo wayra_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
			<?php if ( wayra_opt( 'whatsapp' ) ) : ?>
				<a class="btn btn--ghost-light btn--lg" href="https://wa.me/<?php echo esc_attr( preg_replace( '/\D/', '', wayra_opt( 'whatsapp' ) ) ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Ask us on WhatsApp', 'wayra' ); ?></a>
			<?php endif; ?>
		</div>
	</div>
</section>

<footer class="site-footer">
	<?php wayra_wave( 'wave--footer' ); ?>
	<div class="container site-footer__grid">
		<div class="site-footer__brand">
			<p class="site-footer__name">WAYRA</p>
			<p class="site-footer__tag"><?php esc_html_e( 'Instituto de Español · Your language destination since the early days of Tamarindo.', 'wayra' ); ?></p>
			<ul class="socials">
				<?php foreach ( $wayra_socials as $wayra_key => $wayra_label ) : ?>
					<?php if ( wayra_opt( $wayra_key ) ) : ?>
						<li><a href="<?php echo esc_url( wayra_opt( $wayra_key ) ); ?>" target="_blank" rel="noopener"><?php echo esc_html( $wayra_label ); ?></a></li>
					<?php endif; ?>
				<?php endforeach; ?>
			</ul>
		</div>

		<div>
			<h2 class="site-footer__heading"><?php esc_html_e( 'Visit', 'wayra' ); ?></h2>
			<p><?php echo wayra_icon( 'pin' ); // phpcs:ignore WordPress.Security.EscapeOutput ?> <?php echo nl2br( esc_html( wayra_opt( 'address' ) ) ); ?></p>
			<p><?php echo wayra_icon( 'clock' ); // phpcs:ignore WordPress.Security.EscapeOutput ?> <?php echo esc_html( wayra_opt( 'hours' ) ); ?></p>
		</div>

		<div>
			<h2 class="site-footer__heading"><?php esc_html_e( 'Talk to us', 'wayra' ); ?></h2>
			<p><a href="mailto:<?php echo esc_attr( wayra_opt( 'email' ) ); ?>"><?php echo wayra_icon( 'mail' ); // phpcs:ignore WordPress.Security.EscapeOutput ?> <?php echo esc_html( wayra_opt( 'email' ) ); ?></a></p>
			<p><a href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', wayra_opt( 'phone' ) ) ); ?>"><?php echo wayra_icon( 'phone' ); // phpcs:ignore WordPress.Security.EscapeOutput ?> <?php echo esc_html( wayra_opt( 'phone' ) ); ?></a></p>
			<?php if ( wayra_opt( 'tollfree' ) ) : ?>
				<p><a href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', '+' . wayra_opt( 'tollfree' ) ) ); ?>"><?php echo wayra_icon( 'phone' ); // phpcs:ignore WordPress.Security.EscapeOutput ?> <?php echo esc_html( wayra_opt( 'tollfree' ) ); ?> <small><?php esc_html_e( '(USA/Canada)', 'wayra' ); ?></small></a></p>
			<?php endif; ?>
		</div>

		<div>
			<h2 class="site-footer__heading"><?php esc_html_e( 'Explore', 'wayra' ); ?></h2>
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'footer',
					'container'      => false,
					'menu_class'     => 'footer-menu',
					'depth'          => 1,
					'fallback_cb'    => 'wayra_menu_fallback',
				)
			);
			?>
		</div>
	</div>

	<div class="container partners" aria-label="<?php esc_attr_e( 'Accreditations', 'wayra' ); ?>">
		<img src="<?php echo esc_url( wayra_img( 'partners/instituto-cervantes.png' ) ); ?>" width="110" height="60" alt="<?php esc_attr_e( 'Instituto Cervantes accredited center', 'wayra' ); ?>" loading="lazy">
		<img src="<?php echo esc_url( wayra_img( 'partners/dele.png' ) ); ?>" width="110" height="60" alt="<?php esc_attr_e( 'DELE exam center', 'wayra' ); ?>" loading="lazy">
		<img src="<?php echo esc_url( wayra_img( 'partners/canatur.png' ) ); ?>" width="110" height="33" alt="CANATUR" loading="lazy">
		<img src="<?php echo esc_url( wayra_img( 'partners/bildungsurlaub.png' ) ); ?>" width="110" height="33" alt="Bildungsurlaub" loading="lazy">
	</div>

	<div class="container site-footer__bottom">
		<p>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. <?php esc_html_e( 'All rates in USD, VAT included.', 'wayra' ); ?></p>
		<?php if ( function_exists( 'get_privacy_policy_url' ) && get_privacy_policy_url() ) : ?>
			<p><a href="<?php echo esc_url( get_privacy_policy_url() ); ?>"><?php esc_html_e( 'Privacy policy', 'wayra' ); ?></a></p>
		<?php endif; ?>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
