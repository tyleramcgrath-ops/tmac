<?php
/**
 * "Other categories" cards at the foot of a category page.
 *
 * A dead end at the bottom of a category is where visitors leave. This puts
 * every sibling one click away, with its own photo, and points back at the hub.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_current = isset( $args['current'] ) && $args['current'] instanceof WP_Term ? $args['current'] : null;

$pt_terms = get_terms(
	array(
		'taxonomy'   => 'experience_type',
		'hide_empty' => true,
		'exclude'    => $pt_current ? array( $pt_current->term_id ) : array(),
	)
);

if ( ! $pt_terms || is_wp_error( $pt_terms ) ) {
	return;
}
?>
<section class="section section--dark cat-others">
	<div class="container">
		<header class="section__header">
			<p class="eyebrow"><?php esc_html_e( 'Keep looking', 'palmtreesurf' ); ?></p>
			<h2 class="section__title"><?php esc_html_e( 'Other things to do here', 'palmtreesurf' ); ?></h2>
		</header>

		<ul class="cat-others__list" data-reveal-group>
			<?php foreach ( $pt_terms as $pt_term ) : ?>
				<?php
				$pt_link = get_term_link( $pt_term );

				if ( is_wp_error( $pt_link ) ) {
					continue;
				}

				$pt_slot = pt_term_image_slot( $pt_term );
				?>
				<li class="cat-tile" data-reveal>
					<a class="cat-tile__link" href="<?php echo esc_url( $pt_link ); ?>">
						<span class="cat-tile__media">
							<?php pt_image( $pt_slot ? $pt_slot : 'story-banner', array( 'sizes' => '(min-width: 1000px) 260px, (min-width: 560px) 45vw, 90vw' ) ); ?>
						</span>
						<span class="cat-tile__body">
							<span class="cat-tile__name"><?php echo esc_html( $pt_term->name ); ?></span>
							<span class="cat-tile__count">
								<?php
								printf(
									/* translators: %s: number of experiences. */
									esc_html( _n( '%s experience', '%s experiences', $pt_term->count, 'palmtreesurf' ) ),
									esc_html( number_format_i18n( $pt_term->count ) )
								);
								?>
							</span>
						</span>
					</a>
				</li>
			<?php endforeach; ?>
		</ul>

		<p class="cat-others__all">
			<a class="btn btn--ghost" href="<?php echo esc_url( get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>">
				<?php esc_html_e( 'Browse everything', 'palmtreesurf' ); ?>
			</a>
		</p>
	</div>
</section>
