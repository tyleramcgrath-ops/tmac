<?php
/**
 * Reviews on a single experience.
 *
 * Score, distribution, the reviews themselves and the form. Everything on this
 * page comes from approved reviews people left — nothing is seeded, and an
 * experience with no reviews says so plainly and asks for the first one.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_id      = get_the_ID();
$pt_summary = pt_rating_summary( $pt_id );
$pt_bars    = $pt_summary['count'] ? pt_rating_breakdown( $pt_id ) : array();
$pt_bar_max = $pt_bars ? max( 1, array_sum( $pt_bars ) ) : 1;
?>
<section class="reviews" id="reviews">
	<div class="container container--narrow">
		<header class="section__header">
			<p class="eyebrow"><?php esc_html_e( 'Reviews', 'palmtreesurf' ); ?></p>
			<h2 class="section__title"><?php esc_html_e( 'What people say', 'palmtreesurf' ); ?></h2>
		</header>

		<?php if ( $pt_summary['count'] ) : ?>
			<div class="reviews__summary">
				<div class="reviews__score">
					<strong class="reviews__average"><?php echo esc_html( number_format_i18n( $pt_summary['average'], 1 ) ); ?></strong>
					<span class="reviews__stars"><?php echo pt_stars( $pt_summary['average'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static markup. ?></span>
					<span class="reviews__count">
						<?php
						printf(
							/* translators: %s: number of reviews. */
							esc_html( _n( '%s review', '%s reviews', $pt_summary['count'], 'palmtreesurf' ) ),
							esc_html( number_format_i18n( $pt_summary['count'] ) )
						);
						?>
					</span>
				</div>

				<?php if ( $pt_bars ) : ?>
					<dl class="reviews__bars">
						<?php foreach ( $pt_bars as $pt_stars_value => $pt_number ) : ?>
							<div class="reviews__bar">
								<dt>
									<?php
									printf(
										/* translators: %s: number of stars. */
										esc_html( _n( '%s star', '%s stars', $pt_stars_value, 'palmtreesurf' ) ),
										esc_html( number_format_i18n( $pt_stars_value ) )
									);
									?>
								</dt>
								<dd class="reviews__track">
									<span class="reviews__fill" style="width:<?php echo esc_attr( round( ( $pt_number / $pt_bar_max ) * 100 ) ); ?>%"></span>
								</dd>
								<dd><?php echo esc_html( number_format_i18n( $pt_number ) ); ?></dd>
							</div>
						<?php endforeach; ?>
					</dl>
				<?php endif; ?>
			</div>
		<?php else : ?>
			<p class="reviews__empty">
				<?php esc_html_e( 'No reviews yet. If you have been out with us, yours would be the first.', 'palmtreesurf' ); ?>
			</p>
		<?php endif; ?>

		<?php if ( have_comments() ) : ?>
			<ol class="reviews__list">
				<?php
				wp_list_comments(
					array(
						'callback'   => 'pt_review_item',
						'style'      => 'ol',
						'short_ping' => true,
					)
				);
				?>
			</ol>

			<?php
			the_comments_pagination(
				array(
					'prev_text' => esc_html__( 'Older reviews', 'palmtreesurf' ),
					'next_text' => esc_html__( 'Newer reviews', 'palmtreesurf' ),
				)
			);
			?>
		<?php endif; ?>

		<?php comment_form(); ?>
	</div>
</section>
