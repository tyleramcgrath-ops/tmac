<?php
/**
 * Default page.
 *
 * @package WeHaveRehabs
 */

get_header();
while ( have_posts() ) :
	the_post();
	?>
	<article <?php post_class( 'entry' ); ?>>
		<h1><?php the_title(); ?></h1>
		<?php
		if ( has_post_thumbnail() ) {
			the_post_thumbnail( 'whr-wide' );
		}
		the_content();
		wp_link_pages();
		?>
	</article>
	<?php
endwhile;
get_footer();
