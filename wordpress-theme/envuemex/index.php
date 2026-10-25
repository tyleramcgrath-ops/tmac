<?php
/**
 * Fallback template — used for the blog index when no static front page
 * is selected, or as a last-resort fallback for any post type without a
 * more specific template.
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
				<span data-es="Blog" data-en="Blog">Blog</span>
			</span>
			<h2><?php single_post_title(); the_archive_title(); ?></h2>
		</header>

		<?php if ( have_posts() ) : ?>
			<div class="grid grid--3">
				<?php
				while ( have_posts() ) :
					the_post();
					?>
					<article <?php post_class( 'feat' ); ?>>
						<?php if ( has_post_thumbnail() ) : ?>
							<a class="feat__thumb" href="<?php the_permalink(); ?>">
								<?php the_post_thumbnail( 'medium_large' ); ?>
							</a>
						<?php endif; ?>
						<h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
						<p><?php echo wp_kses_post( get_the_excerpt() ); ?></p>
						<a class="btn btn--ghost" href="<?php the_permalink(); ?>" style="--btn-color:var(--purple-600);color:var(--purple-600);border-color:rgba(75,46,131,.25)" data-es="Leer más →" data-en="Read more →">Leer más →</a>
					</article>
				<?php endwhile; ?>
			</div>

			<div style="margin-top:48px;display:flex;justify-content:center">
				<?php
				the_posts_pagination( array(
					'mid_size'  => 1,
					'prev_text' => '←',
					'next_text' => '→',
				) );
				?>
			</div>
		<?php else : ?>
			<p style="text-align:center;color:var(--muted)"><?php esc_html_e( 'No hay publicaciones todavía.', 'envuemex' ); ?></p>
		<?php endif; ?>
	</div>
</section>

<?php
get_footer();
