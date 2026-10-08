<?php
/**
 * Single article template.
 *
 * @package EnVueMex_Premium
 */
get_header();
while ( have_posts() ) :
	the_post();
	?>
	<main id="main" class="single-article">
		<header class="article-hero">
			<div class="narrow">
				<span class="eyebrow">Blog EnVueMex / <?php echo esc_html( get_the_date( 'j M Y' ) ); ?></span>
				<h1><?php the_title(); ?></h1>
				<?php if ( has_excerpt() ) : ?><p><?php echo esc_html( get_the_excerpt() ); ?></p><?php endif; ?>
			</div>
		</header>
		<?php if ( has_post_thumbnail() ) : ?><div class="wrap article-image"><?php the_post_thumbnail( 'full' ); ?></div><?php endif; ?>
		<article class="narrow editable-content article-content"><?php the_content(); ?></article>
	</main>
	<?php
endwhile;
get_footer();
