<?php
/**
 * Static page body.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;
?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'entry entry--page' ); ?>>
	<?php get_template_part( 'template-parts/components/breadcrumbs' ); ?>
	<header class="page-header">
		<div class="container">
			<?php the_title( '<h1 class="page-title">', '</h1>' ); ?>
		</div>
	</header>

	<?php if ( has_post_thumbnail() ) : ?>
		<figure class="entry__media entry__media--wide">
			<?php the_post_thumbnail( 'pts-hero', array( 'loading' => 'eager' ) ); ?>
		</figure>
	<?php endif; ?>

	<div class="container container--narrow">
		<div class="entry__content">
			<?php
			the_content();

			wp_link_pages(
				array(
					'before' => '<div class="page-links">',
					'after'  => '</div>',
				)
			);
			?>
		</div>
	</div>
</article>
