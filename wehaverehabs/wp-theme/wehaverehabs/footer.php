<?php
/**
 * Site footer.
 *
 * @package WeHaveRehabs
 */

?>
</main>

<footer class="site-footer">
	<div class="wrap">
		<div class="footer-brand">
			<img src="<?php echo esc_url( whr_asset( 'brand/logo-primary.svg' ) ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" width="490" height="170" loading="lazy">
		</div>

		<div class="footer-cols">
			<div>
				<h2><?php esc_html_e( 'Destinations', 'wehaverehabs' ); ?></h2>
				<ul>
					<?php
					$dests = get_terms( array( 'taxonomy' => 'destination', 'parent' => 0, 'hide_empty' => false ) );
					if ( ! is_wp_error( $dests ) ) {
						// Guide destinations (with a photo) first, then the most-listed countries.
						usort(
							$dests,
							function ( $a, $b ) {
								$photo = (int) whr_term_has_image( $b ) - (int) whr_term_has_image( $a );
								return $photo ? $photo : whr_term_count( $b ) - whr_term_count( $a );
							}
						);
						$dests = array_slice( $dests, 0, 6 );
					}
					foreach ( is_wp_error( $dests ) ? array() : $dests as $d ) {
						printf( '<li><a href="%s">%s</a></li>', esc_url( get_term_link( $d ) ), esc_html( $d->name ) );
					}
					?>
				</ul>
			</div>
			<div>
				<h2><?php esc_html_e( 'Healing', 'wehaverehabs' ); ?></h2>
				<ul>
					<?php
					$needs = get_terms( array( 'taxonomy' => 'condition', 'parent' => 0, 'number' => 6, 'hide_empty' => false ) );
					foreach ( is_wp_error( $needs ) ? array() : $needs as $n ) {
						printf( '<li><a href="%s">%s</a></li>', esc_url( get_term_link( $n ) ), esc_html( $n->name ) );
					}
					?>
				</ul>
			</div>
			<div>
				<h2><?php esc_html_e( 'About', 'wehaverehabs' ); ?></h2>
				<?php
				if ( has_nav_menu( 'footer' ) ) {
					wp_nav_menu( array( 'theme_location' => 'footer', 'container' => false, 'depth' => 1 ) );
				} else {
					echo '<ul>';
					foreach ( array( 'how-we-choose', 'for-sanctuaries', 'advertising-disclosure', 'privacy-policy' ) as $slug ) {
						$page = get_page_by_path( $slug );
						if ( $page ) {
							printf( '<li><a href="%s">%s</a></li>', esc_url( get_permalink( $page ) ), esc_html( get_the_title( $page ) ) );
						}
					}
					echo '</ul>';
				}
				?>
			</div>
			<div>
				<h2><?php esc_html_e( 'Speak with us', 'wehaverehabs' ); ?></h2>
				<ul>
					<?php
					$wa = whr_whatsapp_url( whr_option( 'whatsapp' ) );
					if ( $wa ) {
						printf( '<li><a href="%s" target="_blank" rel="noopener">WhatsApp</a></li>', esc_url( $wa ) );
					}
					if ( whr_option( 'advisor_url' ) ) {
						printf( '<li><a href="%s">%s</a></li>', esc_url( whr_option( 'advisor_url' ) ), esc_html__( 'Book a call', 'wehaverehabs' ) );
					}
					if ( is_email( whr_option( 'contact_email' ) ) ) {
						printf( '<li><a href="mailto:%1$s">%1$s</a></li>', esc_html( antispambot( whr_option( 'contact_email' ) ) ) );
					}
					?>
					<li><a href="<?php echo esc_url( whr_text( 'helplines_url' ) ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Crisis helplines worldwide', 'wehaverehabs' ); ?></a></li>
				</ul>
			</div>
		</div>

		<p class="footer-legal">
			<?php
			printf(
				/* translators: %s: site name */
				esc_html__( '%s is a directory, not a healthcare provider, and does not give medical advice. Sanctuaries marked “Sponsored” pay for placement. Retreats are not a substitute for clinical or emergency care.', 'wehaverehabs' ),
				esc_html( get_bloginfo( 'name' ) )
			);
			?>
			© <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php echo esc_html( get_bloginfo( 'name' ) ); ?>
		</p>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
