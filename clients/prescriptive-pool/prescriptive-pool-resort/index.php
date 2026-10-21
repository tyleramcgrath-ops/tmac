<?php get_header(); ?>
<section class="page-head"><div class="wrap"><h1><?php echo is_home() ? esc_html__('News', 'prescriptive-pool') : wp_kses_post(get_the_archive_title()); ?></h1></div></section>
<section class="section">
	<div class="wrap narrow entry">
		<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
			<article class="post-summary">
				<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
				<?php is_singular() ? the_content() : the_excerpt(); ?>
			</article>
		<?php endwhile; the_posts_pagination(); else : ?>
			<p>Nothing here yet.</p>
		<?php endif; ?>
	</div>
</section>
<?php get_footer(); ?>
