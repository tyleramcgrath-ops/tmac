<?php
/**
 * Site footer.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;
?>
</main>

<footer class="site-footer">
	<div class="container">
		<div class="site-footer__grid">
			<div class="site-footer__about">
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-footer__logo">
					<?php
					$logo_id = get_theme_mod( 'custom_logo' );
					if ( $logo_id ) {
						echo wp_get_attachment_image( $logo_id, 'medium', false, array( 'alt' => get_bloginfo( 'name' ) ) );
					} else {
						echo '<img src="' . esc_url( popeye_img( 'logo-light.png' ) ) . '" alt="' . esc_attr( get_bloginfo( 'name' ) ) . '" width="543" height="289" loading="lazy">';
					}
					?>
				</a>
				<p><?php echo esc_html( popeye_opt( 'footer_about' ) ); ?></p>
				<?php if ( popeye_opt( 'footer_quote' ) ) : ?>
					<span class="quote-badge"><?php echo esc_html( popeye_opt( 'footer_quote' ) ); ?></span>
				<?php endif; ?>
			</div>

			<div class="site-footer__nav">
				<h4 class="eyebrow"><?php esc_html_e( 'Navigate', 'popeye-charters' ); ?></h4>
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'footer',
						'container'      => false,
						'depth'          => 1,
						'fallback_cb'    => function () {
							echo '<ul class="menu">';
							foreach ( array(
								home_url( '/' )           => __( 'Home', 'popeye-charters' ),
								popeye_experiences_url()  => __( 'Experiences', 'popeye-charters' ),
								popeye_story_url()        => __( 'Our Story', 'popeye-charters' ),
								popeye_gallery_url()      => __( 'Gallery', 'popeye-charters' ),
								popeye_book_url()         => __( 'Book a Charter', 'popeye-charters' ),
								popeye_contact_url()      => __( 'Contact', 'popeye-charters' ),
							) as $url => $label ) {
								echo '<li><a href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a></li>';
							}
							echo '</ul>';
						},
					)
				);
				?>
			</div>

			<div class="site-footer__contact">
				<h4 class="eyebrow"><?php esc_html_e( 'Get in Touch', 'popeye-charters' ); ?></h4>
				<p class="site-footer__label"><?php esc_html_e( 'Call or Text', 'popeye-charters' ); ?></p>
				<p><a href="tel:<?php echo esc_attr( popeye_opt( 'phone_raw' ) ); ?>"><?php echo esc_html( popeye_opt( 'phone' ) ); ?></a></p>
				<p class="site-footer__label"><?php esc_html_e( 'Email', 'popeye-charters' ); ?></p>
				<p><a href="mailto:<?php echo esc_attr( antispambot( popeye_opt( 'email' ) ) ); ?>"><?php echo esc_html( antispambot( popeye_opt( 'email' ) ) ); ?></a></p>
				<p class="site-footer__muted"><?php echo esc_html( popeye_opt( 'location' ) ); ?></p>
			</div>
		</div>

		<div class="site-footer__bottom">
			<p>&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. <?php esc_html_e( 'All rights reserved.', 'popeye-charters' ); ?></p>
			<p class="site-footer__tag"><?php esc_html_e( 'Strong to the finich.', 'popeye-charters' ); ?></p>
		</div>
	</div>
</footer>

<button class="to-top" aria-label="<?php esc_attr_e( 'Back to top', 'popeye-charters' ); ?>"><?php popeye_the_icon( 'up' ); ?></button>

<?php if ( popeye_opt( 'sticky_bar' ) && ! is_page_template( 'page-templates/book.php' ) ) : ?>
	<div class="sticky-bar" aria-hidden="false">
		<div class="container sticky-bar__inner">
			<p class="sticky-bar__brand"><strong><?php bloginfo( 'name' ); ?></strong> <span>· <?php esc_html_e( '1979 Young Brothers · Possibly a movie star', 'popeye-charters' ); ?></span></p>
			<p class="sticky-bar__text"><?php echo esc_html( popeye_opt( 'sticky_text' ) ); ?></p>
			<a class="btn btn--gold btn--sm" href="<?php echo esc_url( popeye_book_url() ); ?>"><?php esc_html_e( 'Book a Charter', 'popeye-charters' ); ?></a>
		</div>
	</div>
<?php endif; ?>

<?php wp_footer(); ?>
</body>
</html>
