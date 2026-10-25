<?php
/**
 * Taxonomy, category and custom post archive layout.
 *
 * @package EnVueMex_Premium
 */
get_header();
?>
<main id="main" class="content-archive">
	<header class="archive-header wrap">
		<span class="eyebrow">Archivo EnVueMex</span>
		<h1><?php the_archive_title(); ?></h1>
		<?php the_archive_description( '<p>', '</p>' ); ?>
	</header>
	<div class="wrap archive-grid">
		<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
			<article class="archive-card">
				<span><?php echo esc_html( get_the_date( 'j M Y' ) ); ?></span>
				<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
				<?php the_excerpt(); ?>
				<a class="read" href="<?php the_permalink(); ?>">Ver detalle →</a>
			</article>
		<?php endwhile; endif; ?>
	</div>
	<div class="wrap pagination"><?php the_posts_pagination(); ?></div>
</main>
<?php get_footer(); ?>
