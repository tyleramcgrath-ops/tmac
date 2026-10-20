<?php
/**
 * Journal / blog index and generic archive fallback.
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<main id="main" class="site-main">
	<div class="container">
		<header class="page-header">
			<h1 class="page-title">
				<?php
				if ( is_home() && ! is_front_page() ) {
					single_post_title();
				} elseif ( is_search() ) {
					/* translators: %s search query */
					printf( esc_html__( 'Results for “%s”', 'drip-current' ), esc_html( get_search_query() ) );
				} elseif ( is_archive() ) {
					the_archive_title();
				} else {
					esc_html_e( 'Journal', 'drip-current' );
				}
				?>
			</h1>
			<?php the_archive_description( '<div class="page-lede">', '</div>' ); ?>
		</header>

		<?php if ( have_posts() ) : ?>
			<div class="post-grid">
				<?php
				while ( have_posts() ) {
					the_post();
					get_template_part( 'template-parts/card', get_post_type() );
				}
				?>
			</div>
			<?php
			the_posts_pagination(
				array(
					'prev_text' => '&larr;',
					'next_text' => '&rarr;',
				)
			);
			?>
		<?php else : ?>
			<div class="empty-state">
				<p><?php esc_html_e( 'Nothing here yet.', 'drip-current' ); ?></p>
				<?php get_search_form(); ?>
			</div>
		<?php endif; ?>
	</div>
</main>
<?php
get_footer();
