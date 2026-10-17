<?php
/**
 * Comments on posts.
 *
 * @package gag
 */

if ( post_password_required() ) {
	return;
}
?>
<section class="entry-content comments" id="comments">
	<?php if ( have_comments() ) : ?>
		<h2>
			<?php
			/* translators: %s: number of comments. */
			printf( esc_html( _n( '%s comment', '%s comments', get_comments_number(), 'gag' ) ), esc_html( number_format_i18n( get_comments_number() ) ) );
			?>
		</h2>
		<ol class="post-list">
			<?php wp_list_comments( array( 'style' => 'ol', 'short_ping' => true, 'avatar_size' => 0 ) ); ?>
		</ol>
		<?php the_comments_pagination(); ?>
	<?php endif; ?>

	<?php
	comment_form(
		array(
			'class_submit'  => 'btn btn-gold',
			'title_reply'   => esc_html__( 'Leave a comment', 'gag' ),
			'comment_field' => '<p><label for="comment">' . esc_html__( 'Comment', 'gag' ) . '</label><textarea id="comment" name="comment" class="field" rows="5" style="min-height:140px;padding:12px" required></textarea></p>',
		)
	);
	?>
</section>
