<?php
/**
 * Search results template.
 *
 * @package envuemex
 */

get_header();
?>

<section class="section">
	<div class="container">
		<header class="section__head">
			<span class="eyebrow eyebrow--center">
				<span class="dot"></span>
				<span data-es="Búsqueda" data-en="Search">Búsqueda</span>
			</span>
			<h2>
				<?php
				/* translators: %s: search query */
				printf( esc_html__( 'Resultados para "%s"', 'envuemex' ), '<em>' . esc_html( get_search_query() ) . '</em>' );
				?>
			</h2>
		</header>

		<?php if ( have_posts() ) : ?>
			<div class="grid grid--3">
				<?php while ( have_posts() ) : the_post(); ?>
					<article <?php post_class( 'feat' ); ?>>
						<h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
						<p><?php echo wp_kses_post( get_the_excerpt() ); ?></p>
					</article>
				<?php endwhile; ?>
			</div>
		<?php else : ?>
			<p style="text-align:center;color:var(--muted)"><?php esc_html_e( 'Sin resultados. Intenta otra búsqueda.', 'envuemex' ); ?></p>
			<div style="display:flex;justify-content:center;margin-top:24px">
				<?php get_search_form(); ?>
			</div>
		<?php endif; ?>
	</div>
</section>

<?php
get_footer();
