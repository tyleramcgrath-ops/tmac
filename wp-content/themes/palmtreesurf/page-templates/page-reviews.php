<?php
/**
 * Template Name: Leave a Review
 * Template Post Type: page
 *
 * The page a guest is sent to by link or QR code. Four questions and done.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

$pt_state    = pt_review_state();
$pt_hosts    = pt_review_hosts();
$pt_page_id  = pt_reviews_page_id();
$pt_summary  = pt_site_rating_summary();
$pt_reviews  = pt_recent_reviews( 24 );
$pt_user     = wp_get_current_commenter();

while ( have_posts() ) :
	the_post();

	get_template_part(
		'template-parts/components/page-header',
		null,
		array(
			'script' => __( 'Your trip, your words', 'palmtreesurf' ),
			'title'  => __( 'Leave a Review', 'palmtreesurf' ),
			'lede'   => __( 'If you went out with us, we would love to hear how it went. It takes about a minute.', 'palmtreesurf' ),
			'file'   => 'kayak-group-guests.jpg',
			'alt'    => __( 'A group of guests with their kayaks at the end of a tour', 'palmtreesurf' ),
			'ignore_thumbnail' => true,
		)
	);
	?>

	<div class="container container--narrow section">

		<div id="review-status" class="review-page__status" aria-live="polite">
			<?php if ( 'received' === $pt_state ) : ?>
				<div class="review-page__notice">
					<h2><?php esc_html_e( 'Thank you — that has reached us', 'palmtreesurf' ); ?></h2>
					<p>
						<?php esc_html_e( 'We read every review before it goes up, so give us a day or so and yours will appear on the page below and on your tour.', 'palmtreesurf' ); ?>
					</p>
				</div>
			<?php elseif ( 'published' === $pt_state ) : ?>
				<div class="review-page__notice">
					<h2><?php esc_html_e( 'Thank you — your review is up', 'palmtreesurf' ); ?></h2>
					<p><?php esc_html_e( 'You should see it in the list below.', 'palmtreesurf' ); ?></p>
				</div>
			<?php endif; ?>
		</div>

		<?php if ( get_the_content() ) : ?>
			<div class="prose"><?php the_content(); ?></div>
		<?php endif; ?>

		<?php if ( 'received' !== $pt_state && 'published' !== $pt_state ) : ?>
			<?php if ( ! $pt_hosts ) : ?>
				<p class="section__lede">
					<?php esc_html_e( 'The review form appears here once the tours are published.', 'palmtreesurf' ); ?>
				</p>
			<?php else : ?>
				<form class="review-page__form" method="post"
					action="<?php echo esc_url( site_url( '/wp-comments-post.php' ) ); ?>">

					<?php wp_nonce_field( 'pt_review', 'pt_review_nonce' ); ?>
					<input type="hidden" name="pt_review_source" value="page" />

					<?php /* Left empty by a person; filled in by most bots. */ ?>
					<p class="review-page__hp" aria-hidden="true">
						<label for="pt-review-website"><?php esc_html_e( 'Leave this empty', 'palmtreesurf' ); ?></label>
						<input type="text" name="pt_review_website" id="pt-review-website" tabindex="-1" autocomplete="off" />
					</p>

					<div class="review-page__field">
						<label for="pt-review-experience">
							<?php esc_html_e( 'Which trip did you go on?', 'palmtreesurf' ); ?>
							<span class="required">*</span>
						</label>
						<select name="comment_post_ID" id="pt-review-experience" required>
							<option value=""><?php esc_html_e( 'Choose your trip…', 'palmtreesurf' ); ?></option>
							<?php foreach ( $pt_hosts as $pt_id => $pt_label ) : ?>
								<option value="<?php echo esc_attr( (string) $pt_id ); ?>">
									<?php echo esc_html( $pt_label ); ?>
								</option>
							<?php endforeach; ?>
							<?php if ( $pt_page_id ) : ?>
								<option value="<?php echo esc_attr( (string) $pt_page_id ); ?>">
									<?php esc_html_e( 'More than one trip, or Palm Tree Surf in general', 'palmtreesurf' ); ?>
								</option>
							<?php endif; ?>
						</select>
					</div>

					<fieldset class="review-form__rating">
						<legend>
							<?php esc_html_e( 'How was it?', 'palmtreesurf' ); ?>
							<span class="required">*</span>
						</legend>
						<div class="review-form__stars">
							<?php
							// Reversed, so the CSS sibling selector lights the stars to the left.
							for ( $pt_i = 5; $pt_i >= 1; $pt_i-- ) :
								$pt_star_id = 'pt-page-rating-' . $pt_i;
								?>
								<input type="radio" id="<?php echo esc_attr( $pt_star_id ); ?>"
									name="pt_rating" value="<?php echo esc_attr( (string) $pt_i ); ?>" required />
								<label for="<?php echo esc_attr( $pt_star_id ); ?>">
									<span class="screen-reader-text">
										<?php
										printf(
											/* translators: %s: number of stars. */
											esc_html( _n( '%s star', '%s stars', $pt_i, 'palmtreesurf' ) ),
											esc_html( number_format_i18n( $pt_i ) )
										);
										?>
									</span>
								</label>
							<?php endfor; ?>
						</div>
					</fieldset>

					<div class="review-page__field">
						<label for="pt-review-comment">
							<?php esc_html_e( 'How did it go?', 'palmtreesurf' ); ?>
							<span class="required">*</span>
						</label>
						<textarea name="comment" id="pt-review-comment" rows="5" required
							placeholder="<?php esc_attr_e( 'What you did, who looked after you, anything the next person should know.', 'palmtreesurf' ); ?>"></textarea>
					</div>

					<div class="review-page__row">
						<div class="review-page__field">
							<label for="pt-review-author">
								<?php esc_html_e( 'Your name', 'palmtreesurf' ); ?>
								<span class="required">*</span>
							</label>
							<input type="text" name="author" id="pt-review-author" required
								autocomplete="name"
								value="<?php echo esc_attr( $pt_user['comment_author'] ); ?>" />
						</div>

						<div class="review-page__field">
							<label for="pt-review-email">
								<?php esc_html_e( 'Email', 'palmtreesurf' ); ?>
								<span class="required">*</span>
							</label>
							<input type="email" name="email" id="pt-review-email" required
								autocomplete="email"
								value="<?php echo esc_attr( $pt_user['comment_author_email'] ); ?>" />
							<p class="review-page__hint">
								<?php esc_html_e( 'Not published, and not added to any list. It is only so we can reply if we need to.', 'palmtreesurf' ); ?>
							</p>
						</div>
					</div>

					<p class="review-page__submit">
						<button type="submit" class="btn btn--primary">
							<?php esc_html_e( 'Send my review', 'palmtreesurf' ); ?>
						</button>
						<span class="review-page__note">
							<?php esc_html_e( 'We read each one before it goes up.', 'palmtreesurf' ); ?>
						</span>
					</p>
				</form>
			<?php endif; ?>
		<?php endif; ?>
	</div>

	<?php if ( $pt_reviews ) : ?>
		<section class="section section--sand">
			<div class="container container--narrow">
				<p class="eyebrow"><?php esc_html_e( 'From our guests', 'palmtreesurf' ); ?></p>

				<div class="review-page__summary">
					<h2><?php esc_html_e( 'What people said', 'palmtreesurf' ); ?></h2>

					<?php if ( $pt_summary['count'] ) : ?>
						<p class="review-page__average">
							<?php echo pt_stars( $pt_summary['average'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static markup. ?>
							<strong><?php echo esc_html( number_format_i18n( $pt_summary['average'], 1 ) ); ?></strong>
							<span>
								<?php
								printf(
									/* translators: %s: number of reviews. */
									esc_html( _n( 'from %s review', 'from %s reviews', $pt_summary['count'], 'palmtreesurf' ) ),
									esc_html( number_format_i18n( $pt_summary['count'] ) )
								);
								?>
							</span>
						</p>
					<?php endif; ?>
				</div>

				<ol class="review-page__list">
					<?php
					foreach ( $pt_reviews as $pt_review ) :
						$pt_rating = pt_review_rating( $pt_review->comment_ID );
						$pt_host   = (int) $pt_review->comment_post_ID;
						?>
						<li class="review">
							<article class="review__inner">
								<header class="review__head">
									<div>
										<p class="review__author">
											<?php echo esc_html( get_comment_author( $pt_review ) ); ?>
										</p>
										<p class="review__date">
											<time datetime="<?php echo esc_attr( get_comment_date( 'c', $pt_review ) ); ?>">
												<?php echo esc_html( get_comment_date( '', $pt_review ) ); ?>
											</time>
										</p>
									</div>

									<?php if ( $pt_rating ) : ?>
										<p class="review__rating">
											<?php echo pt_stars( $pt_rating ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static markup. ?>
											<span class="screen-reader-text">
												<?php
												printf(
													/* translators: %s: number of stars. */
													esc_html__( '%s out of 5', 'palmtreesurf' ),
													esc_html( number_format_i18n( $pt_rating ) )
												);
												?>
											</span>
										</p>
									<?php endif; ?>
								</header>

								<div class="review__body"><?php echo wpautop( esc_html( $pt_review->comment_content ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above. ?></div>

								<?php if ( $pt_host !== $pt_page_id ) : ?>
									<p class="review__host">
										<a href="<?php echo esc_url( (string) get_permalink( $pt_host ) ); ?>">
											<?php echo esc_html( pt_translate_seeded( get_the_title( $pt_host ) ) ); ?>
										</a>
									</p>
								<?php endif; ?>
							</article>
						</li>
					<?php endforeach; ?>
				</ol>
			</div>
		</section>
	<?php endif; ?>

	<?php
endwhile;

get_footer();
