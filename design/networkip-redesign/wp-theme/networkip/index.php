<?php
/**
 * Fallback template for blog, archives and search.
 *
 * @package NetworkIP
 */

get_header();

if ( is_search() ) {
	/* translators: %s: search query. */
	$networkip_title = sprintf( __( 'Search results for “%s”', 'networkip' ), get_search_query() );
} elseif ( is_archive() ) {
	$networkip_title = wp_strip_all_tags( get_the_archive_title() );
} elseif ( is_home() && ! is_front_page() ) {
	$networkip_title = single_post_title( '', false );
} else {
	$networkip_title = get_bloginfo( 'name' );
}
?>
<main id="main" class="nip-main">
	<?php get_template_part( 'template-parts/page-header', null, array( 'title' => $networkip_title ) ); ?>
	<section class="nip-section nip-section--plain">
		<div class="nip-wrap nip-wrap--narrow">
			<?php if ( have_posts() ) : ?>
				<ul class="nip-posts" role="list">
					<?php
					while ( have_posts() ) :
						the_post();
						?>
						<li <?php post_class( 'nip-card' ); ?>>
							<p class="nip-eyebrow"><?php echo esc_html( get_the_date() ); ?></p>
							<h2><a class="nip-card__link" href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
							<?php the_excerpt(); ?>
						</li>
					<?php endwhile; ?>
				</ul>
				<?php the_posts_pagination(); ?>
			<?php else : ?>
				<p class="nip-lead"><?php esc_html_e( 'Nothing was found here. Try a search instead.', 'networkip' ); ?></p>
				<?php get_search_form(); ?>
			<?php endif; ?>
		</div>
	</section>
</main>
<?php
get_footer();
