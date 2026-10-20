<?php
/**
 * The journal, archives, and search results.
 *
 * @package drip
 */

get_header();
?>
<main id="main" class="journal light">
	<header class="page-head wrap">
		<p class="eyebrow"><?php echo is_search() ? 'Search' : 'Journal'; ?></p>
		<h1 class="page-title">
			<?php
			if ( is_search() ) {
				echo esc_html( 'Results for “' . get_search_query() . '”' );
			} elseif ( is_archive() ) {
				echo esc_html( wp_strip_all_tags( get_the_archive_title() ) );
			} else {
				echo 'Notes from the water.';
			}
			?>
		</h1>
	</header>
	<div class="wrap">
		<?php if ( have_posts() ) : ?>
			<div class="post-grid">
				<?php
				while ( have_posts() ) :
					the_post();
					?>
					<article <?php post_class( 'post-card' ); ?> data-reveal>
						<a class="post-media" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
							<?php
							if ( has_post_thumbnail() ) {
								the_post_thumbnail( 'medium_large' );
							} else {
								echo drip_line( 'post-line' ); // phpcs:ignore WordPress.Security.EscapeOutput
							}
							?>
						</a>
						<p class="post-date"><?php echo esc_html( get_the_date() ); ?></p>
						<h2 class="post-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
						<p class="post-excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 22 ) ); ?></p>
					</article>
				<?php endwhile; ?>
			</div>
			<div class="pagination"><?php the_posts_pagination( array( 'mid_size' => 1 ) ); ?></div>
		<?php else : ?>
			<p class="lede">Nothing here yet.</p>
		<?php endif; ?>
	</div>
</main>
<?php
get_footer();
