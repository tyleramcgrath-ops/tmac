<?php
/**
 * Journal / search result card.
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;
?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'post-card' ); ?>>
	<a class="post-card__link" href="<?php the_permalink(); ?>">
		<span class="post-card__media">
			<?php
			if ( has_post_thumbnail() ) {
				the_post_thumbnail( 'medium_large', array( 'loading' => 'lazy', 'alt' => '' ) );
			}
			?>
		</span>
		<span class="post-card__meta"><?php echo esc_html( get_the_date() ); ?></span>
		<h2 class="post-card__title"><?php the_title(); ?></h2>
		<span class="post-card__excerpt"><?php echo esc_html( wp_strip_all_tags( get_the_excerpt() ) ); ?></span>
	</a>
</article>
