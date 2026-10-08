<?php
/**
 * Single experience.
 *
 * Compact hero, then a two-column body with long-form content and a sticky
 * booking card. Below 1024px the card unsticks; below 768px it is replaced by a
 * fixed bottom bar (VISUAL-SPEC.md sections 7.6 and 8).
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();

	$pt_id       = get_the_ID();
	$pt_price    = pt_field( $pt_id, 'price_from' );
	$pt_suffix   = pt_field( $pt_id, 'price_suffix' );
	$pt_details  = pt_experience_details( $pt_id );
	$pt_itinerary = pt_field_pairs( $pt_id, 'itinerary' );
	$pt_faq      = pt_field_pairs( $pt_id, 'faq' );
	$pt_types    = get_the_term_list( $pt_id, 'experience_type', '', ', ' );
	?>
	<article id="experience-<?php echo esc_attr( $pt_id ); ?>" <?php post_class( 'experience' ); ?>>

		<header class="exp-hero">
			<?php if ( has_post_thumbnail() ) : ?>
				<div class="exp-hero__media">
					<?php the_post_thumbnail( 'pt-hero', array( 'loading' => 'eager', 'fetchpriority' => 'high' ) ); ?>
				</div>
			<?php endif; ?>

			<div class="exp-hero__inner container">
				<?php if ( $pt_types && ! is_wp_error( $pt_types ) ) : ?>
					<p class="eyebrow eyebrow--light"><?php echo wp_kses_post( $pt_types ); ?></p>
				<?php endif; ?>

				<h1 class="exp-hero__title"><?php the_title(); ?></h1>

				<?php if ( $pt_details ) : ?>
					<ul class="exp-hero__meta">
						<?php foreach ( $pt_details as $pt_row ) : ?>
							<li><?php echo esc_html( $pt_row['label'] . ': ' . $pt_row['value'] ); ?></li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
			</div>
		</header>

		<?php get_template_part( 'template-parts/components/breadcrumbs' ); ?>

		<div class="container exp-layout">
			<div class="exp-content container--narrow">
				<?php if ( has_excerpt() ) : ?>
					<p class="section__lede"><?php echo esc_html( get_the_excerpt() ); ?></p>
				<?php endif; ?>

				<?php
				/*
				 * What is included and what to bring come before the prose on
				 * purpose: they are what someone decides on. The description,
				 * the itinerary and the FAQ are what they read afterwards, and
				 * they belong below the booking form rather than in front of it.
				 */
				?>
				<?php
				/*
				 * Options first, when there are any: on a tour sold three ways
				 * a single "what is included" list would be describing a trip
				 * the customer has not chosen yet.
				 */
				get_template_part(
					'template-parts/components/trip-options',
					null,
					array( 'id' => $pt_id )
				);
				?>

				<?php if ( pt_field( $pt_id, 'includes' ) ) : ?>
					<h2><?php esc_html_e( 'What is included', 'palmtreesurf' ); ?></h2>
					<?php pt_experience_list( $pt_id, 'includes', 'checklist' ); ?>
				<?php endif; ?>

				<?php if ( pt_field( $pt_id, 'bring' ) ) : ?>
					<h2><?php esc_html_e( 'What to bring', 'palmtreesurf' ); ?></h2>
					<?php pt_experience_list( $pt_id, 'bring', 'checklist' ); ?>
				<?php endif; ?>

				<div id="booking">
					<?php
					pt_booking_form(
						array(
							'experience' => $pt_id,
							'title'      => __( 'Request this experience', 'palmtreesurf' ),
							'location'   => 'experience-single',
						)
					);
					?>
				</div>

				<?php the_content(); ?>

				<?php pt_experience_video( $pt_id ); ?>

				<?php if ( $pt_itinerary ) : ?>
					<h2><?php esc_html_e( 'How the day runs', 'palmtreesurf' ); ?></h2>
					<dl class="conditions">
						<?php foreach ( $pt_itinerary as $pt_step ) : ?>
							<div class="conditions__row">
								<dt><?php echo esc_html( $pt_step[0] ); ?></dt>
								<dd><?php echo esc_html( $pt_step[1] ); ?></dd>
							</div>
						<?php endforeach; ?>
					</dl>
				<?php endif; ?>

				<?php if ( $pt_faq ) : ?>
					<h2><?php esc_html_e( 'Questions', 'palmtreesurf' ); ?></h2>
					<div class="faq">
						<?php foreach ( $pt_faq as $pt_pair ) : ?>
							<?php if ( '' === $pt_pair[0] || '' === $pt_pair[1] ) { continue; } ?>
							<details class="faq__item">
								<summary><?php echo esc_html( $pt_pair[0] ); ?></summary>
								<div class="faq__answer"><?php echo esc_html( $pt_pair[1] ); ?></div>
							</details>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
			</div>

			<aside class="booking-card" aria-label="<?php esc_attr_e( 'Booking', 'palmtreesurf' ); ?>">
				<?php if ( $pt_price ) : ?>
					<p class="booking-card__price">
						<?php
						printf(
							/* translators: %s: price. */
							esc_html__( 'From $%s', 'palmtreesurf' ),
							esc_html( $pt_price )
						);
						?>
						<?php if ( $pt_suffix ) : ?>
							<span><?php echo esc_html( $pt_suffix ); ?></span>
						<?php endif; ?>
					</p>
				<?php endif; ?>

				<?php if ( $pt_details ) : ?>
					<dl class="booking-card__rows">
						<?php foreach ( $pt_details as $pt_row ) : ?>
							<div class="booking-card__row">
								<dt><?php echo esc_html( $pt_row['label'] ); ?></dt>
								<dd><?php echo esc_html( $pt_row['value'] ); ?></dd>
							</div>
						<?php endforeach; ?>
					</dl>
				<?php endif; ?>

				<?php
				get_template_part(
					'template-parts/components/availability',
					null,
					array( 'post_id' => $pt_id )
				);
				?>

				<a class="btn btn--primary btn--block" href="#booking" data-cta-location="experience-sticky-card">
					<?php esc_html_e( 'Check availability', 'palmtreesurf' ); ?>
				</a>

				<?php
				$pt_wa = pt_whatsapp_url(
					sprintf(
						/* translators: %s: experience title. */
						__( 'Hi! I am interested in %s.', 'palmtreesurf' ),
						get_the_title()
					)
				);

				if ( $pt_wa ) :
					?>
					<p style="margin-top:var(--pt-space-sm)">
						<a href="<?php echo esc_url( $pt_wa ); ?>" rel="noopener" target="_blank" data-cta-location="experience-whatsapp">
							<?php esc_html_e( 'Ask on WhatsApp', 'palmtreesurf' ); ?>
						</a>
					</p>
				<?php endif; ?>
			</aside>
		</div>

		<?php
		/*
		 * This experience's own photographs, below the booking form and the
		 * description. Reuses the gallery grid and lightbox rather than
		 * defining a second one, so there is one component to style.
		 */
		$pt_photos = pt_experience_gallery_images( $pt_id );

		if ( $pt_photos ) {
			get_template_part(
				'template-parts/home/gallery',
				null,
				array(
					'images'  => $pt_photos,
					'eyebrow' => __( 'On the water', 'palmtreesurf' ),
					'heading' => sprintf(
						/* translators: %s: experience title. */
						__( 'Photos from %s', 'palmtreesurf' ),
						get_the_title()
					),
				)
			);
		}
		?>

		<div class="book-bar">
			<p class="book-bar__price">
				<?php
				echo $pt_price
					? esc_html( sprintf( /* translators: %s: price. */ __( 'From $%s', 'palmtreesurf' ), $pt_price ) )
					: esc_html__( 'Enquire', 'palmtreesurf' );
				?>
			</p>
			<a class="btn btn--primary btn--sm" href="#booking" data-cta-location="mobile-book-bar">
				<?php esc_html_e( 'Book', 'palmtreesurf' ); ?>
			</a>
		</div>
	</article>

	<?php comments_template( '/template-parts/components/reviews.php' ); ?>

	<?php get_template_part( 'template-parts/components/related' ); ?>
	<?php
endwhile;

get_footer();
