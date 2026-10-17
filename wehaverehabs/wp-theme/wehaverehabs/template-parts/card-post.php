<?php
/**
 * Journal post card.
 *
 * @package WeHaveRehabs
 */

$cat = get_the_category();
?>
<a class="post-card" href="<?php the_permalink(); ?>">
	<?php echo whr_post_image( null, 'whr-card', array( 'alt' => '' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	<?php if ( $cat ) : ?>
		<span class="eyebrow"><?php echo esc_html( $cat[0]->name ); ?></span>
	<?php endif; ?>
	<span class="t"><?php the_title(); ?></span>
</a>
