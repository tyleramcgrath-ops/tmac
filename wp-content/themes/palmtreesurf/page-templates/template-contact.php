<?php
/**
 * Template Name: Contact
 * Template Post Type: page
 *
 * Page content followed by the booking enquiry form and the contact details.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<article id="post-<?php the_ID(); ?>" <?php post_class( 'entry entry--contact' ); ?>>
		<header class="page-header">
			<div class="container">
				<?php the_title( '<h1 class="page-title">', '</h1>' ); ?>
			</div>
		</header>

		<div class="container layout layout--contact">
			<div class="layout__content">
				<div class="entry__content">
					<?php the_content(); ?>
				</div>

				<?php echo pt_enquiry_form( array( 'title' => __( 'Send us a message', 'palmtreesurf' ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped inside the template. ?>
			</div>

			<aside class="layout__sidebar contact-details">
				<?php
				$pt_address = pt_mod( 'pt_address' );
				if ( $pt_address ) {
					printf(
						'<h2>%1$s</h2><address>%2$s</address>',
						esc_html__( 'Where to find us', 'palmtreesurf' ),
						nl2br( esc_html( $pt_address ) )
					);
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
					printf(
						'<h2>%1$s</h2><p>%2$s</p>',
						esc_html__( 'Hours', 'palmtreesurf' ),
						nl2br( esc_html( $pt_hours ) )
					);
				}

				pt_whatsapp_link();
				pt_social_links();
				?>
			</aside>
		</div>
	</article>
	<?php
endwhile;

get_footer();
