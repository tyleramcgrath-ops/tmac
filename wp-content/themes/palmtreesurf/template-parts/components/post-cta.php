<?php
/**
 * Closing call to action on a journal post.
 *
 * A guide that answers a question should offer the obvious next step, without
 * interrupting the reading to do it.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;
?>
<aside class="post-cta">
	<div class="container container--narrow">
		<div class="post-cta__inner">
			<div>
				<h2 class="post-cta__title"><?php esc_html_e( 'Planning a trip to Tamarindo?', 'palmtreesurf' ); ?></h2>
				<p class="post-cta__text">
					<?php esc_html_e( 'Tell us your dates and who is coming, and we will put the week together with you — surf, water, wildlife or all of it.', 'palmtreesurf' ); ?>
				</p>
			</div>

			<p class="post-cta__actions">
				<a class="btn btn--primary" href="<?php echo esc_url( get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>">
					<?php esc_html_e( 'See all experiences', 'palmtreesurf' ); ?>
				</a>
			</p>
		</div>
	</div>
</aside>
