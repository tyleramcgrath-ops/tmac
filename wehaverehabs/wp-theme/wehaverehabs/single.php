<?php
/**
 * Journal article.
 *
 * @package WeHaveRehabs
 */

get_header();
while ( have_posts() ) :
	the_post();
	?>
	<article <?php post_class( 'entry' ); ?>>
		<p class="meta">
			<?php
			echo esc_html( get_the_date() );
			echo get_the_category_list( ', ' ) ? ' · ' . wp_kses_post( get_the_category_list( ', ' ) ) : '';
			/* translators: %d: minutes */
			echo ' · ' . esc_html( sprintf( _n( '%d min read', '%d min read', whr_reading_minutes(), 'wehaverehabs' ), whr_reading_minutes() ) );
			?>
		</p>
		<h1><?php the_title(); ?></h1>
		<?php if ( has_excerpt() ) : ?>
			<p class="entry-lede"><?php echo esc_html( get_the_excerpt() ); ?></p>
		<?php endif; ?>
		<?php
		if ( has_post_thumbnail() ) {
			the_post_thumbnail( 'whr-wide', array( 'loading' => 'eager', 'fetchpriority' => 'high' ) );
		}
		echo whr_blog_toc(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in whr_blog_toc().
		the_content();
		wp_link_pages();
		?>
		<div class="entry-cta">
			<p class="eyebrow"><?php esc_html_e( 'Find a place to heal', 'wehaverehabs' ); ?></p>
			<p><?php esc_html_e( 'Search retreats, clinical programs and medically supervised care around the world, filtered by what you need.', 'wehaverehabs' ); ?></p>
			<a class="btn btn--outline" href="<?php echo esc_url( get_post_type_archive_link( 'sanctuary' ) ); ?>"><?php esc_html_e( 'Explore sanctuaries', 'wehaverehabs' ); ?></a>
		</div>
	</article>
	<?php
	$related = new WP_Query(
		array(
			'post_type'           => 'post',
			'posts_per_page'      => 3,
			'post__not_in'        => array( get_the_ID() ),
			'category__in'        => wp_get_post_categories( get_the_ID() ),
			'orderby'             => 'rand',
			'no_found_rows'       => true,
			'ignore_sticky_posts' => true,
		)
	);
	if ( $related->have_posts() ) :
		?>
		<section class="section entry-related">
			<div class="wrap">
				<div class="section-head center"><div class="eyebrow"><?php esc_html_e( 'Keep reading', 'wehaverehabs' ); ?></div></div>
				<div class="post-list">
					<?php
					while ( $related->have_posts() ) {
						$related->the_post();
						get_template_part( 'template-parts/card-post' );
					}
					wp_reset_postdata();
					?>
				</div>
			</div>
		</section>
		<?php
	endif;
endwhile;
get_footer();
