<?php
/**
 * A journal entry card.
 *
 * @package tylermcgrath
 */

?>
<article <?php post_class( 'tm-post-card' ); ?> data-reveal>
	<a href="<?php the_permalink(); ?>" class="tm-post-card__link" data-tilt data-spotlight>
		<?php if ( has_post_thumbnail() ) : ?>
			<span class="tm-post-card__media"><?php the_post_thumbnail( 'tm-card', array( 'loading' => 'lazy' ) ); ?></span>
		<?php endif; ?>
		<span class="tm-post-card__meta"><?php echo esc_html( get_the_date() ); ?></span>
		<span class="tm-post-card__title"><?php the_title(); ?></span>
		<span class="tm-post-card__excerpt"><?php echo esc_html( wp_strip_all_tags( get_the_excerpt() ) ); ?></span>
		<span class="tm-post-card__more"><?php esc_html_e( 'Read', 'tylermcgrath' ); ?> <?php echo tm_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
	</a>
</article>
