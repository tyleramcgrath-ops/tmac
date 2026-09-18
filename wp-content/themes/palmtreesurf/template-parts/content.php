<?php
/**
 * Blog post card on indexes and archives.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;
?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'entry entry--card' ); ?>>
	<?php pt_post_thumbnail(); ?>

	<div class="entry__body">
		<?php the_title( sprintf( '<h2 class="entry__title"><a href="%s" rel="bookmark">', esc_url( get_permalink() ) ), '</a></h2>' ); ?>
		<?php pt_posted_on(); ?>

		<div class="entry__excerpt">
			<?php the_excerpt(); ?>
		</div>
	</div>
</article>
