<?php
/**
 * Single posts.
 *
 * @package gag
 */

get_header();
while ( have_posts() ) :
	the_post();
	?>
	<article class="page-wrap">
		<p class="label"><?php echo esc_html( get_the_date() ); ?></p>
		<h1 class="page-title" style="margin-top:12px"><?php the_title(); ?></h1>
		<?php if ( has_post_thumbnail() ) : ?>
			<div class="entry-content"><?php the_post_thumbnail( 'large' ); ?></div>
		<?php endif; ?>
		<div class="entry-content"><?php the_content(); ?></div>
	</article>
	<?php
	if ( comments_open() || get_comments_number() ) {
		echo '<div class="page-wrap" style="padding-top:0">';
		comments_template();
		echo '</div>';
	}
endwhile;
get_footer();
