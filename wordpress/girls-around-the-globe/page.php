<?php
/**
 * Pages (Safety, Privacy, Terms…).
 *
 * @package gag
 */

get_header();
while ( have_posts() ) :
	the_post();
	?>
	<article class="page-wrap">
		<h1 class="page-title"><?php the_title(); ?></h1>
		<div class="entry-content"><?php the_content(); ?></div>
	</article>
	<?php
endwhile;
get_footer();
