<?php
/**
 * A journal post.
 *
 * @package drip
 */

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<main id="main" class="post light">
		<article <?php post_class( 'wrap post-wrap' ); ?>>
			<header class="post-head">
				<p class="eyebrow"><?php echo esc_html( get_the_date() ); ?></p>
				<h1 class="page-title"><?php the_title(); ?></h1>
			</header>
			<?php if ( has_post_thumbnail() ) : ?>
				<figure class="post-hero"><?php the_post_thumbnail( 'large' ); ?></figure>
			<?php endif; ?>
			<div class="entry"><?php the_content(); ?></div>
		</article>
	</main>
	<?php
endwhile;

get_footer();
