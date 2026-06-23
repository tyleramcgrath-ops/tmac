<?php
/**
 * Comments template.
 *
 * @package rma
 */

if ( post_password_required() ) {
	return;
}
?>
<div id="comments" class="comments-area">
	<?php if ( have_comments() ) : ?>
		<h3 style="margin-bottom:24px">
			<?php
			$count = get_comments_number();
			/* translators: %s: comment count. */
			printf( esc_html( _n( '%s Comment', '%s Comments', $count, 'rma' ) ), esc_html( number_format_i18n( $count ) ) );
			?>
		</h3>
		<ol class="comment-list" style="list-style:none;padding:0">
			<?php
			wp_list_comments( array(
				'style'      => 'ol',
				'short_ping' => true,
				'avatar_size'=> 44,
			) );
			?>
		</ol>
		<?php the_comments_pagination(); ?>
	<?php endif; ?>

	<?php
	comment_form( array(
		'class_submit' => 'btn btn--primary',
		'title_reply'  => __( 'Leave a comment', 'rma' ),
	) );
	?>
</div>
