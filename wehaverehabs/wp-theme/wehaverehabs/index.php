<?php
/**
 * Journal index and general fallback.
 *
 * @package WeHaveRehabs
 */

get_header();
?>
<section class="section">
	<div class="wrap">
		<div class="section-head center">
			<div class="eyebrow"><?php esc_html_e( 'The Journal', 'wehaverehabs' ); ?></div>
			<h1 class="display">
				<?php
				if ( is_search() ) {
					/* translators: %s: search term */
					printf( esc_html__( 'Results for “%s”', 'wehaverehabs' ), esc_html( get_search_query() ) );
				} elseif ( is_archive() ) {
					echo esc_html( wp_strip_all_tags( get_the_archive_title() ) );
				} else {
					echo wp_kses_post( __( 'Stories for the <em>journey</em>', 'wehaverehabs' ) );
				}
				?>
			</h1>
		</div>
		<?php if ( have_posts() ) : ?>
			<div class="post-list">
				<?php
				while ( have_posts() ) {
					the_post();
					get_template_part( 'template-parts/card-post' );
				}
				?>
			</div>
			<nav class="pagination" aria-label="<?php esc_attr_e( 'Pages', 'wehaverehabs' ); ?>"><?php echo paginate_links(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></nav>
		<?php else : ?>
			<p class="center lede"><?php esc_html_e( 'Nothing here yet.', 'wehaverehabs' ); ?></p>
		<?php endif; ?>
	</div>
</section>
<?php
get_footer();
