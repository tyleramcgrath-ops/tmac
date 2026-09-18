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

				<?php echo pts_enquiry_form( array( 'title' => __( 'Send us a message', 'palmtreesurf' ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped inside the template. ?>
			</div>

			<aside class="layout__sidebar contact-details">
				<?php
				$pts_address = pts_mod( 'pts_address' );
				if ( $pts_address ) {
					printf(
						'<h2>%1$s</h2><address>%2$s</address>',
						esc_html__( 'Where to find us', 'palmtreesurf' ),
						nl2br( esc_html( $pts_address ) )
					);
				}

				$pts_phone = pts_mod( 'pts_phone' );
				if ( $pts_phone ) {
					printf(
						'<p><a href="tel:%1$s">%2$s</a></p>',
						esc_attr( preg_replace( '/[^\d+]/', '', $pts_phone ) ),
						esc_html( $pts_phone )
					);
				}

				$pts_email = pts_mod( 'pts_email' );
				if ( $pts_email && is_email( $pts_email ) ) {
					printf(
						'<p><a href="%1$s">%2$s</a></p>',
						esc_url( 'mailto:' . $pts_email ),
						esc_html( $pts_email )
					);
				}

				$pts_hours = pts_mod( 'pts_hours' );
				if ( $pts_hours ) {
					printf(
						'<h2>%1$s</h2><p>%2$s</p>',
						esc_html__( 'Hours', 'palmtreesurf' ),
						nl2br( esc_html( $pts_hours ) )
					);
				}

				pts_whatsapp_link();
				pts_social_links();
				?>
			</aside>
		</div>
	</article>
	<?php
endwhile;

get_footer();
