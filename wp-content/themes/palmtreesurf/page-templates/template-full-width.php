<?php
/**
 * Template Name: Full Width
 * Template Post Type: page
 *
 * Page with no sidebar and no width cap, for landing pages built from blocks.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<article id="post-<?php the_ID(); ?>" <?php post_class( 'entry entry--full' ); ?>>
		<div class="entry__content entry__content--full">
			<?php the_content(); ?>
		</div>
	</article>
	<?php
endwhile;

get_footer();
