<?php
/**
 * Full blog post.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;
?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'entry entry--single' ); ?>>
	<header class="entry__header">
		<?php the_title( '<h1 class="entry__title">', '</h1>' ); ?>
		<?php pt_posted_on(); ?>
	</header>

	<?php pt_post_thumbnail(); ?>

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

	<footer class="entry__footer">
		<?php
		the_tags( '<p class="entry__tags">', ', ', '</p>' );
		?>
	</footer>
</article>
