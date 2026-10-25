<?php
/**
 * Comments.
 *
 * @package tylermcgrath
 */

if ( post_password_required() ) {
	return;
}
?>
<section class="tm-comments" id="comments">
	<?php if ( have_comments() ) : ?>
		<h2 class="tm-comments__title">
			<?php
			/* translators: %s: number of comments. */
			printf( esc_html( _n( '%s response', '%s responses', get_comments_number(), 'tylermcgrath' ) ), esc_html( number_format_i18n( get_comments_number() ) ) );
			?>
		</h2>
		<ol class="tm-comments__list">
			<?php
			wp_list_comments(
				array(
					'style'       => 'ol',
					'avatar_size' => 44,
					'short_ping'  => true,
				)
			);
			?>
		</ol>
		<?php the_comments_navigation(); ?>
	<?php endif; ?>
	<?php comment_form(); ?>
</section>
