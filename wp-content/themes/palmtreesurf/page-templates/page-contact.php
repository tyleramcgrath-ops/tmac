<?php
/**
 * Template Name: Contact
 * Template Post Type: page
 *
 * Form left, contact panel right (VISUAL-SPEC.md section 8).
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<article <?php post_class( 'entry entry--contact' ); ?>>
		<?php
		get_template_part(
			'template-parts/components/page-header',
			null,
			array(
				'script'   => __( 'Get in touch', 'palmtreesurf' ),
				'lede'     => __( 'Message us about any tour and we answer the same day.', 'palmtreesurf' ),
				'slot'     => 'split-1-offset',
				'modifier' => 'contact',
			)
		);
		?>

		<div class="container location__inner" style="padding-bottom:var(--pt-section-y)">
			<div>
				<?php // The form first — it is what someone came here to use. ?>
				<div id="booking">
					<?php
					pt_booking_form(
						array(
							'title'    => __( 'Send us a message', 'palmtreesurf' ),
							'location' => 'contact-page',
						)
					);
					?>
				</div>

				<div class="entry__content" style="padding-top:var(--pt-space-xl)"><?php the_content(); ?></div>
			</div>

			<aside class="booking-card" aria-label="<?php esc_attr_e( 'Contact details', 'palmtreesurf' ); ?>">
				<h2 class="site-footer__heading" style="color:var(--pt-ink-900)">
					<?php esc_html_e( 'Find us', 'palmtreesurf' ); ?>
				</h2>

				<?php
				$pt_address = pt_filled( 'pt_address' );
				if ( $pt_address ) {
					printf( '<address class="location__address">%s</address>', nl2br( esc_html( $pt_address ) ) );
				}

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

				$pt_hours = pt_filled( 'pt_hours' );
				if ( $pt_hours ) {
					printf(
						'<h2 class="site-footer__heading" style="color:var(--pt-ink-900)">%1$s</h2><p>%2$s</p>',
						esc_html__( 'Hours', 'palmtreesurf' ),
						nl2br( esc_html( $pt_hours ) )
					);
				}

				$pt_wa = pt_whatsapp_url();
				if ( $pt_wa ) {
					printf(
						'<p><a class="btn btn--secondary btn--block" href="%1$s" rel="noopener" target="_blank" data-cta-location="contact-whatsapp">%2$s</a></p>',
						esc_url( $pt_wa ),
						esc_html__( 'WhatsApp us', 'palmtreesurf' )
					);
				}

				pt_social_links();
				?>
			</aside>
		</div>
	</article>
	<?php get_template_part( 'template-parts/components/how-it-works' ); ?>

	<section class="section section--sand">
		<div class="container container--narrow">
			<header class="section__header">
				<p class="eyebrow"><?php esc_html_e( 'Questions', 'palmtreesurf' ); ?></p>
				<h2 class="section__title"><?php esc_html_e( 'Things people ask before they book', 'palmtreesurf' ); ?></h2>
			</header>

			<div class="faq">
				<?php foreach ( pt_about_faq() as $pt_index => $pt_pair ) : ?>
					<details class="faq__item"<?php echo 0 === $pt_index ? ' open' : ''; ?>>
						<summary><?php echo esc_html( $pt_pair[0] ); ?></summary>
						<div class="faq__answer"><p><?php echo esc_html( $pt_pair[1] ); ?></p></div>
					</details>
				<?php endforeach; ?>
			</div>
		</div>
	</section>
	<?php
endwhile;

get_footer();
