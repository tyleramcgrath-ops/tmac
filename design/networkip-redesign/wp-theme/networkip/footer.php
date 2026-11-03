<?php
/**
 * Site footer.
 *
 * @package NetworkIP
 */

$networkip_address = networkip_mod( 'contact_address' );
$networkip_phone   = networkip_mod( 'contact_phone' );
$networkip_email   = networkip_mod( 'contact_email' );
?>
<footer class="nip-footer">
	<div class="nip-wrap nip-footer__grid">
		<div class="nip-footer__brand">
			<?php networkip_logo( 'footer' ); ?>
			<address class="nip-footer__contact">
				<?php if ( $networkip_address ) : ?>
					<span><?php echo nl2br( esc_html( $networkip_address ) ); ?></span>
				<?php endif; ?>
				<?php if ( $networkip_phone ) : ?>
					<a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $networkip_phone ) ); ?>"><?php echo esc_html( $networkip_phone ); ?></a>
				<?php endif; ?>
				<?php if ( $networkip_email ) : ?>
					<a href="mailto:<?php echo esc_attr( antispambot( $networkip_email ) ); ?>"><?php echo esc_html( antispambot( $networkip_email ) ); ?></a>
				<?php endif; ?>
			</address>
		</div>

		<?php
		$networkip_columns = array(
			'footer-company'    => __( 'Company', 'networkip' ),
			'footer-service'    => __( 'Service', 'networkip' ),
			'footer-technology' => __( 'Technology', 'networkip' ),
		);
		foreach ( $networkip_columns as $networkip_location => $networkip_title ) :
			?>
			<nav class="nip-footer__col" aria-label="<?php echo esc_attr( $networkip_title ); ?>">
				<h2 class="nip-footer__title"><?php echo esc_html( $networkip_title ); ?></h2>
				<?php networkip_menu( $networkip_location, 'nip-footer__list' ); ?>
			</nav>
		<?php endforeach; ?>
	</div>

	<div class="nip-wrap"><div class="nip-footer__bottom">
		<p>
			<?php
			/* translators: %s: current year. */
			echo esc_html( sprintf( __( 'All rights reserved by NetworkIP © %s.', 'networkip' ), wp_date( 'Y' ) ) );
			?>
		</p>
		<?php
		$networkip_privacy = get_privacy_policy_url();
		if ( ! $networkip_privacy ) {
			$networkip_privacy = networkip_url( '/privacy-policy/' );
		}
		?>
		<a href="<?php echo esc_url( $networkip_privacy ); ?>"><?php esc_html_e( 'Privacy Policy', 'networkip' ); ?></a>
	</div></div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
