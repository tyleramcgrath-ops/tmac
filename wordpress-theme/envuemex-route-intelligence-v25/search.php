<?php
/**
 * Search results.
 *
 * @package EnVueMex_Premium
 */
get_header();
?>
<main id="main" class="content-archive">
	<header class="archive-header wrap">
		<span class="eyebrow">Buscar</span>
		<h1><?php printf( esc_html__( 'Resultados para: %s', 'envuemex-premium' ), esc_html( get_search_query() ) ); ?></h1>
	</header>
	<div class="wrap archive-grid">
		<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
			<article class="archive-card"><span><?php echo esc_html( get_post_type() ); ?></span><h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2><?php the_excerpt(); ?><a class="read" href="<?php the_permalink(); ?>">Abrir →</a></article>
		<?php endwhile; else : ?><p>No se encontraron resultados.</p><?php endif; ?>
	</div>
</main>
<?php get_footer(); ?>
