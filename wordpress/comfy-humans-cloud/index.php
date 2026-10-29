<?php
/**
 * Blog, archives, search and anything without its own template.
 *
 * @package comfy-humans-cloud
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<section class="page-sky">
	<div class="sky-layer" data-clouds="back" data-depth="0.3"></div>
	<div class="wrap">
		<header class="page-head">
			<?php if ( is_home() && ! is_front_page() ) : ?>
				<h1><?php single_post_title(); ?></h1>
			<?php elseif ( is_search() ) : ?>
				<h1><?php printf( esc_html__( 'Results for "%s"', 'comfy-humans-cloud' ), esc_html( get_search_query() ) ); ?></h1>
			<?php elseif ( is_archive() ) : ?>
				<?php the_archive_title( '<h1>', '</h1>' ); ?>
			<?php elseif ( is_404() ) : ?>
				<h1><?php esc_html_e( 'This page drifted away.', 'comfy-humans-cloud' ); ?></h1>
				<p><?php esc_html_e( 'It may have floated off on a cloud. Try the shop or the home page.', 'comfy-humans-cloud' ); ?></p>
			<?php else : ?>
				<h1><?php esc_html_e( 'From the cloud', 'comfy-humans-cloud' ); ?></h1>
			<?php endif; ?>
		</header>
	</div>
</section>
<div class="wrap page-body">
	<?php if ( have_posts() && ! is_404() ) : ?>
		<div class="post-grid">
			<?php
			while ( have_posts() ) :
				the_post();
				?>
				<article <?php post_class( 'post-card' ); ?>>
					<?php if ( has_post_thumbnail() ) : ?>
						<a href="<?php the_permalink(); ?>" class="post-thumb"><?php the_post_thumbnail( 'medium_large' ); ?></a>
					<?php endif; ?>
					<p class="eyebrow"><?php echo esc_html( get_the_date() ); ?></p>
					<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
					<?php the_excerpt(); ?>
				</article>
			<?php endwhile; ?>
		</div>
		<?php the_posts_pagination(); ?>
	<?php elseif ( ! is_404() ) : ?>
		<p><?php esc_html_e( 'Nothing here yet. It is probably napping.', 'comfy-humans-cloud' ); ?></p>
	<?php endif; ?>
	<?php if ( is_404() || is_search() ) : ?>
		<?php get_search_form(); ?>
	<?php endif; ?>
</div>
<?php
get_footer();
