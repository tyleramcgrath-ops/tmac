<?php
/**
 * Comments template.
 *
 * @package envuemex
 */

if ( post_password_required() ) {
	return;
}
?>
<div id="comments" class="comments-area" style="margin-top:32px;padding-top:24px;border-top:1px solid var(--line-dk)">
	<?php if ( have_comments() ) : ?>
		<h3 style="margin-bottom:16px">
			<?php
			$count = get_comments_number();
			/* translators: %s: comment count */
			printf( esc_html( _n( '%s comentario', '%s comentarios', $count, 'envuemex' ) ), number_format_i18n( $count ) );
			?>
		</h3>

		<ol class="comment-list" style="list-style:none;padding:0">
			<?php
			wp_list_comments( array(
				'style'      => 'ol',
				'short_ping' => true,
				'avatar_size'=> 40,
			) );
			?>
		</ol>

		<?php the_comments_pagination(); ?>
	<?php endif; ?>

	<?php
	if ( comments_open() ) {
		comment_form( array(
			'class_form'  => 'contact__form',
			'title_reply' => esc_html__( 'Deja un comentario', 'envuemex' ),
		) );
	}
	?>
</div>
