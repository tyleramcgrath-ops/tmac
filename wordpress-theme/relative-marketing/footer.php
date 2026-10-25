<?php
/**
 * Footer template.
 *
 * @package rma
 */
?>
</main><!-- #content -->

<footer class="site-footer">
	<div class="container">
		<div class="footer-grid">
			<div>
				<?php echo rma_brand_mark( true ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<p class="f-about"><?php esc_html_e( 'AI-powered marketing systems that drive real growth. Built for the next era of search.', 'rma' ); ?></p>
				<div class="social">
					<a href="#" aria-label="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 102.5 6a2.5 2.5 0 002.48-2.5zM3 8.5h4V21H3zM9 8.5h3.8v1.7h.05a4.2 4.2 0 013.78-2.07C20.4 8.13 22 10 22 13.5V21h-4v-6.6c0-1.57-.03-3.6-2.2-3.6s-2.5 1.7-2.5 3.48V21H9z"/></svg></a>
					<a href="#" aria-label="Twitter"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.6-2.3.7a4 4 0 001.7-2.2c-.8.5-1.6.8-2.5 1a4 4 0 00-6.9 3.6A11.3 11.3 0 013.1 4.8a4 4 0 001.2 5.3c-.6 0-1.2-.2-1.8-.5a4 4 0 003.2 3.9c-.6.2-1.2.2-1.8.1a4 4 0 003.7 2.8A8 8 0 012 18.1a11.3 11.3 0 006.1 1.8c7.3 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg></a>
					<a href="#" aria-label="YouTube"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 00-1.7-1.7C19.4 5.2 12 5.2 12 5.2s-7.4 0-8.9.4A2.5 2.5 0 001.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 001.7 1.7c1.5.4 8.9.4 8.9.4s7.4 0 8.9-.4a2.5 2.5 0 001.7-1.7C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z"/></svg></a>
					<a href="#" aria-label="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
				</div>
			</div>

			<div>
				<h5><?php esc_html_e( 'Services', 'rma' ); ?></h5>
				<?php
				if ( has_nav_menu( 'footer_services' ) ) {
					wp_nav_menu( array( 'theme_location' => 'footer_services', 'container' => false, 'depth' => 1 ) );
				} else { ?>
					<ul>
						<li><a href="#"><?php esc_html_e( 'AI Search Optimization', 'rma' ); ?></a></li>
						<li><a href="#"><?php esc_html_e( 'SEO', 'rma' ); ?></a></li>
						<li><a href="#"><?php esc_html_e( 'Paid Media', 'rma' ); ?></a></li>
						<li><a href="#"><?php esc_html_e( 'Web Design', 'rma' ); ?></a></li>
						<li><a href="#"><?php esc_html_e( 'Branding', 'rma' ); ?></a></li>
						<li><a href="#"><?php esc_html_e( 'Automation & Analytics', 'rma' ); ?></a></li>
					</ul>
				<?php } ?>
			</div>

			<div>
				<h5><?php esc_html_e( 'Company', 'rma' ); ?></h5>
				<?php
				if ( has_nav_menu( 'footer_company' ) ) {
					wp_nav_menu( array( 'theme_location' => 'footer_company', 'container' => false, 'depth' => 1 ) );
				} else { ?>
					<ul>
						<li><a href="<?php echo esc_url( home_url( '/about/' ) ); ?>"><?php esc_html_e( 'About', 'rma' ); ?></a></li>
						<li><a href="<?php echo esc_url( home_url( '/case-studies/' ) ); ?>"><?php esc_html_e( 'Case Studies', 'rma' ); ?></a></li>
						<li><a href="<?php echo esc_url( home_url( '/insights/' ) ); ?>"><?php esc_html_e( 'Insights', 'rma' ); ?></a></li>
						<li><a href="<?php echo esc_url( home_url( '/careers/' ) ); ?>"><?php esc_html_e( 'Careers', 'rma' ); ?></a></li>
						<li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Contact', 'rma' ); ?></a></li>
					</ul>
				<?php } ?>
			</div>

			<div>
				<h5><?php esc_html_e( 'Resources', 'rma' ); ?></h5>
				<?php
				if ( has_nav_menu( 'footer_resources' ) ) {
					wp_nav_menu( array( 'theme_location' => 'footer_resources', 'container' => false, 'depth' => 1 ) );
				} else { ?>
					<ul>
						<li><a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>"><?php esc_html_e( 'Blog', 'rma' ); ?></a></li>
						<li><a href="#"><?php esc_html_e( 'Guides', 'rma' ); ?></a></li>
						<li><a href="#"><?php esc_html_e( 'Privacy Policy', 'rma' ); ?></a></li>
						<li><a href="#"><?php esc_html_e( 'Terms of Service', 'rma' ); ?></a></li>
					</ul>
				<?php } ?>
			</div>

			<div>
				<h5><?php esc_html_e( 'Contact', 'rma' ); ?></h5>
				<?php if ( is_active_sidebar( 'footer-contact' ) ) : ?>
					<?php dynamic_sidebar( 'footer-contact' ); ?>
				<?php else : ?>
					<div class="f-contact-item"><?php echo rma_icon( 'mail', 18 ); ?><span>hello@relativemarketing.com</span></div>
					<div class="f-contact-item"><?php echo rma_icon( 'phone', 18 ); ?><span>(888) 123-4567</span></div>
					<div class="f-contact-item"><?php echo rma_icon( 'pin', 18 ); ?><span>123 Growth St.<br>Austin, TX 78701</span></div>
				<?php endif; ?>
			</div>
		</div>

		<div class="footer-bottom">
			<?php
			/* translators: %1$s: year, %2$s: site name. */
			printf( esc_html__( '© %1$s %2$s. All rights reserved.', 'rma' ), esc_html( gmdate( 'Y' ) ), esc_html( get_bloginfo( 'name' ) ) );
			?>
		</div>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
