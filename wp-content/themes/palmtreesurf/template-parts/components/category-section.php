<?php
/**
 * One category's block on the experiences hub.
 *
 * Anchored on the term slug, so a chip or a nav link lands the visitor here
 * with every other category still on screen above and below — which is what
 * "take me to that section and let me keep looking" needs.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_term = isset( $args['term'] ) ? $args['term'] : null;

if ( ! $pt_term instanceof WP_Term ) {
	return;
}

$pt_query = new WP_Query(
	array(
		'post_type'      => PT_EXPERIENCE_POST_TYPE,
		'posts_per_page' => 6,
		'orderby'        => array(
			'menu_order' => 'ASC',
			'title'      => 'ASC',
		),
		'no_found_rows'  => false,
		'tax_query'      => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
			array(
				'taxonomy' => 'experience_type',
				'field'    => 'term_id',
				'terms'    => $pt_term->term_id,
			),
		),
	)
);

if ( ! $pt_query->have_posts() ) {
	wp_reset_postdata();
	return;
}

$pt_link  = get_term_link( $pt_term );
$pt_link  = is_wp_error( $pt_link ) ? '' : $pt_link;
$pt_copy  = pt_term_copy( $pt_term );
$pt_lede  = $pt_term->description ? $pt_term->description : ( isset( $pt_copy['description'] ) ? $pt_copy['description'] : '' );
$pt_total = (int) $pt_query->found_posts;
?>
<section class="cat-section" id="<?php echo esc_attr( $pt_term->slug ); ?>" data-cat-section="<?php echo esc_attr( $pt_term->slug ); ?>">
	<div class="container">
		<header class="cat-section__head">
			<div>
				<h2 class="cat-section__title">
					<?php if ( $pt_link ) : ?>
						<a href="<?php echo esc_url( $pt_link ); ?>"><?php echo esc_html( $pt_term->name ); ?></a>
					<?php else : ?>
						<?php echo esc_html( $pt_term->name ); ?>
					<?php endif; ?>
				</h2>

				<?php if ( $pt_lede ) : ?>
					<p class="cat-section__lede"><?php echo esc_html( wp_trim_words( wp_strip_all_tags( $pt_lede ), 34 ) ); ?></p>
				<?php endif; ?>
			</div>

			<?php if ( $pt_link ) : ?>
				<a class="btn btn--ghost cat-section__all" href="<?php echo esc_url( $pt_link ); ?>">
					<?php
					printf(
						/* translators: %s: category name. */
						esc_html__( 'All %s', 'palmtreesurf' ),
						esc_html( $pt_term->name )
					);
					?>
				</a>
			<?php endif; ?>
		</header>

		<div class="card-grid" data-reveal-group>
			<?php
			while ( $pt_query->have_posts() ) :
				$pt_query->the_post();
				get_template_part( 'template-parts/components/card', 'experience' );
			endwhile;
			?>
		</div>

		<?php if ( $pt_total > $pt_query->post_count && $pt_link ) : ?>
			<p class="cat-section__more">
				<a href="<?php echo esc_url( $pt_link ); ?>">
					<?php
					printf(
						/* translators: 1: number of further experiences, 2: category name. */
						esc_html( _n( '%1$s more %2$s experience', '%1$s more %2$s experiences', $pt_total - $pt_query->post_count, 'palmtreesurf' ) ),
						esc_html( number_format_i18n( $pt_total - $pt_query->post_count ) ),
						esc_html( $pt_term->name )
					);
					?>
				</a>
			</p>
		<?php endif; ?>
	</div>
</section>
<?php
wp_reset_postdata();
