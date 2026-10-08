<?php
/**
 * Blog archive.
 *
 * @package EnVueMex_Premium
 */
get_header();
?>
<main id="main" class="content-archive">
	<header class="archive-header resource-hero">
		<div class="wrap">
			<span class="eyebrow">Blog EnVueMex</span>
			<h1>Perspectivas para flotas conectadas.</h1>
			<p>Seguridad, telemática, cumplimiento, rastreo y eficiencia operativa para negocios en México.</p>
		</div>
	</header>
	<div class="wrap archive-grid">
		<?php while ( have_posts() ) : the_post(); ?>
			<article class="archive-card">
				<?php if ( has_post_thumbnail() ) : the_post_thumbnail( 'large' ); endif; ?>
				<span><?php echo esc_html( get_the_date( 'j M Y' ) ); ?></span>
				<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
				<?php the_excerpt(); ?>
				<a class="read" href="<?php the_permalink(); ?>">Leer artículo →</a>
			</article>
		<?php endwhile; ?>
	</div>
	<div class="wrap pagination"><?php the_posts_pagination(); ?></div>
</main>
<?php get_footer(); ?>
