<?php
/**
 * Every experience, tiled together.
 *
 * One dense grid rather than a stacked section per category, so the whole
 * offering is visible at a glance instead of six screens of scrolling. The
 * category chips filter this grid in place; with JavaScript off they are
 * ordinary links to the category pages, so nothing depends on the script.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_query = new WP_Query(
	array(
		'post_type'      => PT_EXPERIENCE_POST_TYPE,
		'posts_per_page' => 48,
		'orderby'        => array(
			'menu_order' => 'ASC',
			'title'      => 'ASC',
		),
		'no_found_rows'  => true,
	)
);

if ( ! $pt_query->have_posts() ) {
	wp_reset_postdata();
	return;
}
?>
<section class="section exp-tiles" id="all">
	<div class="container">
		<div class="listing__head">
			<p class="listing__count">
				<?php
				printf(
					/* translators: %s: number of experiences. */
					esc_html( _n( '%s experience', '%s experiences', $pt_query->post_count, 'palmtreesurf' ) ),
					esc_html( number_format_i18n( $pt_query->post_count ) )
				);
				?>
			</p>
			<p class="exp-tiles__hint" data-tiles-hint hidden>
				<button class="exp-tiles__clear" type="button" data-tiles-clear>
					<?php esc_html_e( 'Show all categories', 'palmtreesurf' ); ?>
				</button>
			</p>
		</div>

		<div class="card-grid card-grid--tiles" data-tiles>
			<?php
			while ( $pt_query->have_posts() ) :
				$pt_query->the_post();

				$pt_terms = get_the_terms( get_the_ID(), 'experience_type' );
				$pt_slugs = array();

				if ( $pt_terms && ! is_wp_error( $pt_terms ) ) {
					foreach ( $pt_terms as $pt_term ) {
						$pt_slugs[] = $pt_term->slug;
					}
				}
				?>
				<div class="exp-tile" data-tile-cats="<?php echo esc_attr( implode( ' ', $pt_slugs ) ); ?>">
					<?php get_template_part( 'template-parts/components/card', 'experience' ); ?>
				</div>
			<?php endwhile; ?>
		</div>

		<p class="exp-tiles__empty" data-tiles-empty hidden>
			<?php esc_html_e( 'Nothing in that category yet. Choose another, or show all.', 'palmtreesurf' ); ?>
		</p>
	</div>
</section>
<?php
wp_reset_postdata();
