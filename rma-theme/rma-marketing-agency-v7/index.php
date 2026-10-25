<?php
/**
 * Fallback for posts, archives, and search.
 *
 * @package rma
 */

get_header();
?>
<main id="main">
	<header class="subhero subhero-plain">
		<div class="wrap">
			<p class="eyebrow"><?php echo is_search() ? 'Search' : 'Insights'; ?></p>
			<h1><?php echo is_home() || is_front_page() ? esc_html( get_bloginfo( 'name' ) ) : wp_kses_post( get_the_archive_title() ); ?></h1>
		</div>
	</header>
	<section class="wrap post-list">
		<?php if ( have_posts() ) : ?>
			<?php
			while ( have_posts() ) :
				the_post();
				?>
				<article <?php post_class( 'post-row' ); ?>>
					<?php if ( ! is_singular() ) : ?>
						<p class="eyebrow"><?php echo esc_html( get_the_date() ); ?></p>
						<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
						<?php the_excerpt(); ?>
					<?php else : ?>
						<h2><?php the_title(); ?></h2>
						<div class="prose"><?php the_content(); ?></div>
					<?php endif; ?>
				</article>
			<?php endwhile; ?>
			<?php the_posts_pagination(); ?>
		<?php else : ?>
			<p>Nothing here yet.</p>
		<?php endif; ?>
	</section>
</main>
<?php
get_footer();
