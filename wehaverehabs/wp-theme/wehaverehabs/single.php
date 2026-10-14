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
		<p class="meta"><?php echo esc_html( get_the_date() ); ?><?php echo get_the_category_list( ', ' ) ? ' · ' . wp_kses_post( get_the_category_list( ', ' ) ) : ''; ?></p>
		<h1><?php the_title(); ?></h1>
		<?php
		if ( has_post_thumbnail() ) {
			the_post_thumbnail( 'whr-wide' );
		}
		the_content();
		wp_link_pages();
		?>
		<p style="margin-top:50px"><a class="btn btn--outline" href="<?php echo esc_url( get_post_type_archive_link( 'sanctuary' ) ); ?>"><?php esc_html_e( 'Explore sanctuaries', 'wehaverehabs' ); ?></a></p>
	</article>
	<?php
endwhile;
get_footer();
