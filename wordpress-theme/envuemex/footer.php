<?php
/**
 * Site footer.
 *
 * @package envuemex
 */
$tmac_url = envuemex_get( 'envuemex_us_url', 'https://tyleramcgrath-ops.github.io/tmac/' );
$email    = envuemex_get( 'envuemex_email', 'ventas@envuemex.com' );
$support  = envuemex_get( 'envuemex_support_email', 'soporte@envuemex.com' );
$phone    = envuemex_get( 'envuemex_phone', '+52 800 123 4567' );
?>
</main>

<footer class="foot">
	<div class="container foot__inner">
		<div class="foot__brand">
			<a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php bloginfo( 'name' ); ?>">
				<svg class="brand__mark" viewBox="0 0 40 40" aria-hidden="true">
					<path d="M20 3 L36 12 V28 L20 37 L4 28 V12 Z" fill="url(#lg)"/>
					<path d="M20 11 L28 15.5 V24.5 L20 29 L12 24.5 V15.5 Z" fill="#0B0712" opacity=".85"/>
					<circle cx="20" cy="20" r="2.6" fill="#C9A4FF"/>
				</svg>
				<span class="brand__word">Envue<span class="brand__accent">Mex</span></span>
			</a>
			<p data-es="Telemática y videovigilancia para flotas — México." data-en="Telematics and video for fleets — Mexico.">Telemática y videovigilancia para flotas — México.</p>
		</div>

		<div class="foot__cols">
			<div>
				<h5 data-es="Soluciones" data-en="Solutions">Soluciones</h5>
				<?php
				if ( has_nav_menu( 'footer-solutions' ) ) {
					wp_nav_menu( array(
						'theme_location' => 'footer-solutions',
						'container'      => false,
						'items_wrap'     => '%3$s',
						'depth'          => 1,
						'fallback_cb'    => false,
					) );
				} else {
					?>
					<a href="<?php echo esc_url( home_url( '/#soluciones' ) ); ?>" data-es="Rastreo GPS" data-en="GPS tracking">Rastreo GPS</a>
					<a href="<?php echo esc_url( home_url( '/#soluciones' ) ); ?>" data-es="Cámaras IA" data-en="AI dashcams">Cámaras IA</a>
					<a href="<?php echo esc_url( home_url( '/#soluciones' ) ); ?>" data-es="Activos" data-en="Assets">Activos</a>
					<a href="<?php echo esc_url( home_url( '/#soluciones' ) ); ?>" data-es="Integraciones" data-en="Integrations">Integraciones</a>
					<?php
				}
				?>
			</div>
			<div>
				<h5 data-es="Empresa" data-en="Company">Empresa</h5>
				<?php
				if ( has_nav_menu( 'footer-company' ) ) {
					wp_nav_menu( array(
						'theme_location' => 'footer-company',
						'container'      => false,
						'items_wrap'     => '%3$s',
						'depth'          => 1,
						'fallback_cb'    => false,
					) );
				} else {
					?>
					<a href="<?php echo esc_url( home_url( '/#nosotros' ) ); ?>" data-es="Nosotros" data-en="About">Nosotros</a>
					<a href="<?php echo esc_url( home_url( '/#industrias' ) ); ?>" data-es="Industrias" data-en="Industries">Industrias</a>
					<a href="<?php echo esc_url( home_url( '/#contacto' ) ); ?>" data-es="Contacto" data-en="Contact">Contacto</a>
					<a href="<?php echo esc_url( $tmac_url ); ?>" target="_blank" rel="noopener">TMAC USA ↗</a>
					<?php
				}
				?>
			</div>
			<div>
				<h5 data-es="Soporte" data-en="Support">Soporte</h5>
				<?php
				if ( has_nav_menu( 'footer-support' ) ) {
					wp_nav_menu( array(
						'theme_location' => 'footer-support',
						'container'      => false,
						'items_wrap'     => '%3$s',
						'depth'          => 1,
						'fallback_cb'    => false,
					) );
				} else {
					?>
					<a href="mailto:<?php echo esc_attr( $support ); ?>"><?php echo esc_html( $support ); ?></a>
					<a href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', $phone ) ); ?>"><?php echo esc_html( $phone ); ?></a>
					<span data-es="Lun–Vie · 24/7 críticos" data-en="Mon–Fri · 24/7 critical">Lun–Vie · 24/7 críticos</span>
					<?php
				}
				?>
			</div>
		</div>
	</div>

	<div class="container foot__bottom">
		<small>© <span id="yr"><?php echo esc_html( gmdate( 'Y' ) ); ?></span> <?php bloginfo( 'name' ); ?> · <span data-es="Todos los derechos reservados." data-en="All rights reserved.">Todos los derechos reservados.</span></small>
		<small>
			<?php
			if ( get_privacy_policy_url() ) {
				printf(
					'<a href="%s" data-es="Privacidad" data-en="Privacy">%s</a> · ',
					esc_url( get_privacy_policy_url() ),
					esc_html__( 'Privacidad', 'envuemex' )
				);
			} else {
				echo '<a href="#" data-es="Privacidad" data-en="Privacy">Privacidad</a> · ';
			}
			?>
			<a href="#" data-es="Términos" data-en="Terms">Términos</a>
		</small>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
