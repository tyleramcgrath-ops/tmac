<?php
/**
 * Comments area.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

// Never expose comments on a password-protected post until the password is given.
if ( post_password_required() ) {
	return;
}
?>
<section id="comments" class="comments">
	<?php if ( have_comments() ) : ?>
		<h2 class="comments__title">
			<?php
			$pt_count = get_comments_number();
			printf(
				esc_html(
					/* translators: %s: comment count. */
					_n( '%s comment', '%s comments', $pt_count, 'palmtreesurf' )
				),
				esc_html( number_format_i18n( $pt_count ) )
			);
			?>
		</h2>

		<ol class="comments__list">
			<?php
			wp_list_comments(
				array(
					'style'      => 'ol',
					'short_ping' => true,
					'avatar_size' => 56,
				)
			);
			?>
		</ol>

		<?php
		the_comments_navigation(
			array(
				'prev_text' => esc_html__( 'Older comments', 'palmtreesurf' ),
				'next_text' => esc_html__( 'Newer comments', 'palmtreesurf' ),
			)
		);
		?>

		<?php if ( ! comments_open() ) : ?>
			<p class="comments__closed"><?php esc_html_e( 'Comments are closed.', 'palmtreesurf' ); ?></p>
		<?php endif; ?>
	<?php endif; ?>

	<?php
	comment_form(
		array(
			'title_reply'        => esc_html__( 'Leave a comment', 'palmtreesurf' ),
			'class_submit'       => 'btn btn--primary',
			'comment_notes_after' => '',
		)
	);
	?>
</section>
