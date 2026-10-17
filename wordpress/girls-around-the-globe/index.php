<?php
/**
 * Blog, archives and search.
 *
 * @package gag
 */

get_header();
?>
<div class="page-wrap">
	<h1 class="page-title">
		<?php
		if ( is_search() ) {
			/* translators: %s: search query. */
			printf( esc_html__( 'Results for "%s"', 'gag' ), esc_html( get_search_query() ) );
		} elseif ( is_archive() ) {
			echo esc_html( wp_strip_all_tags( get_the_archive_title() ) );
		} else {
			esc_html_e( 'Stories & advice', 'gag' );
		}
		?>
	</h1>

	<?php if ( have_posts() ) : ?>
		<ul class="post-list">
			<?php
			while ( have_posts() ) :
				the_post();
				?>
				<li>
					<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
					<p class="entry-meta"><?php echo esc_html( get_the_date() ); ?></p>
					<p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 32 ) ); ?></p>
				</li>
			<?php endwhile; ?>
		</ul>
		<div class="pagination"><?php the_posts_pagination(); ?></div>
	<?php else : ?>
		<p class="entry-content"><?php esc_html_e( 'Nothing here yet.', 'gag' ); ?></p>
	<?php endif; ?>
</div>
<?php
get_footer();
