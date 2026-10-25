<?php
/**
 * Blog index, archives and search results.
 *
 * @package tylermcgrath
 */

get_header();

if ( is_search() ) {
	/* translators: %s: search query. */
	$tm_title = sprintf( __( 'Results for “%s”', 'tylermcgrath' ), esc_html( get_search_query() ) );
	$tm_eye   = __( 'Search', 'tylermcgrath' );
} elseif ( is_archive() ) {
	$tm_title = get_the_archive_title();
	$tm_eye   = __( 'Archive', 'tylermcgrath' );
} elseif ( is_home() && get_option( 'page_for_posts' ) ) {
	$tm_title = get_the_title( get_option( 'page_for_posts' ) );
	$tm_eye   = __( 'Field notes', 'tylermcgrath' );
} else {
	$tm_title = __( 'Journal', 'tylermcgrath' );
	$tm_eye   = __( 'Field notes', 'tylermcgrath' );
}
?>
<main id="main" class="tm-main tm-inner">
	<?php
	get_template_part(
		'template-parts/page-hero',
		null,
		array(
			'eyebrow' => esc_html( $tm_eye ),
			'title'   => $tm_title,
			'lede'    => is_archive() ? get_the_archive_description() : '',
		)
	);
	?>
	<section class="tm-section">
		<div class="tm-wrap">
			<?php if ( have_posts() ) : ?>
				<div class="tm-posts">
					<?php
					while ( have_posts() ) :
						the_post();
						get_template_part( 'template-parts/post-card' );
					endwhile;
					?>
				</div>
				<div class="tm-pagination">
					<?php
					the_posts_pagination(
						array(
							'prev_text' => '←',
							'next_text' => '→',
						)
					);
					?>
				</div>
			<?php else : ?>
				<div class="tm-empty">
					<p><?php esc_html_e( 'Nothing charted here yet.', 'tylermcgrath' ); ?></p>
					<?php get_search_form(); ?>
				</div>
			<?php endif; ?>
		</div>
	</section>
</main>
<?php
get_footer();
