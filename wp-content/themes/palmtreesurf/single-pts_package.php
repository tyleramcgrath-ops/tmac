<?php
/**
 * Single surf package.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<article id="package-<?php the_ID(); ?>" <?php post_class( 'package' ); ?>>
		<header class="package__header">
			<div class="container">
				<?php
				$pts_types = get_the_term_list( get_the_ID(), 'pts_package_type', '', ', ' );
				if ( $pts_types && ! is_wp_error( $pts_types ) ) {
					printf( '<p class="package__eyebrow">%s</p>', wp_kses_post( $pts_types ) );
				}
				?>
				<h1 class="package__title"><?php the_title(); ?></h1>
				<?php if ( has_excerpt() ) : ?>
					<p class="package__lede"><?php echo esc_html( get_the_excerpt() ); ?></p>
				<?php endif; ?>
			</div>
		</header>

		<?php if ( has_post_thumbnail() ) : ?>
			<figure class="package__media">
				<?php the_post_thumbnail( 'pts-hero', array( 'loading' => 'eager' ) ); ?>
			</figure>
		<?php endif; ?>

		<div class="container layout layout--package">
			<div class="layout__content entry__content">
				<?php
				the_content();

				wp_link_pages(
					array(
						'before' => '<div class="page-links">',
						'after'  => '</div>',
					)
				);

				pts_package_includes( get_the_ID() );
				?>
			</div>

			<aside class="package__aside">
				<?php $pts_details = pts_package_details( get_the_ID() ); ?>
				<?php if ( $pts_details ) : ?>
					<dl class="package__details">
						<?php foreach ( $pts_details as $pts_row ) : ?>
							<div class="package__detail">
								<dt><?php echo esc_html( $pts_row['label'] ); ?></dt>
								<dd><?php echo esc_html( $pts_row['value'] ); ?></dd>
							</div>
						<?php endforeach; ?>
					</dl>
				<?php endif; ?>

				<a class="btn btn--primary btn--block" href="<?php echo esc_url( pts_booking_url( get_the_ID() ) ); ?>">
					<?php esc_html_e( 'Book this package', 'palmtreesurf' ); ?>
				</a>

				<?php pts_whatsapp_link(); ?>
			</aside>
		</div>

		<div class="container container--narrow">
			<?php
			echo pts_enquiry_form( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped inside the template.
				array(
					'package' => get_the_title(),
					'title'   => __( 'Ask about this package', 'palmtreesurf' ),
				)
			);
			?>
		</div>
	</article>
	<?php
endwhile;

get_footer();
