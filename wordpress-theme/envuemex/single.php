<?php
/**
 * Single post template.
 *
 * @package envuemex
 */

get_header();
?>

<section class="section">
	<div class="container" style="max-width:780px">
		<?php
		while ( have_posts() ) :
			the_post();
			?>
			<article <?php post_class(); ?>>
				<header style="margin-bottom:32px">
					<span class="eyebrow">
						<span class="dot"></span>
						<span><?php echo esc_html( get_the_date() ); ?></span>
					</span>
					<h1 style="margin:14px 0 0"><?php the_title(); ?></h1>
					<?php if ( has_excerpt() ) : ?>
						<p class="section__lede" style="margin-top:14px;text-align:left"><?php echo esc_html( get_the_excerpt() ); ?></p>
					<?php endif; ?>
				</header>

				<?php if ( has_post_thumbnail() ) : ?>
					<div style="margin-bottom:32px;border-radius:var(--r-lg);overflow:hidden">
						<?php the_post_thumbnail( 'large' ); ?>
					</div>
				<?php endif; ?>

				<div class="page-content">
					<?php
					the_content();
					wp_link_pages( array(
						'before' => '<nav class="page-links">',
						'after'  => '</nav>',
					) );
					?>
				</div>

				<footer style="margin-top:48px;padding-top:24px;border-top:1px solid var(--line-dk);color:var(--muted);font-size:.9rem">
					<?php if ( has_category() ) : ?>
						<div><?php the_category( ', ' ); ?></div>
					<?php endif; ?>
				</footer>
			</article>

			<?php
			if ( comments_open() || get_comments_number() ) {
				comments_template();
			}

			the_post_navigation( array(
				'prev_text' => '← %title',
				'next_text' => '%title →',
			) );
			?>
			<?php
		endwhile;
		?>
	</div>
</section>

<style>
	.page-content { color: var(--text); font-size: 1.05rem; line-height:1.7 }
	.page-content h2 { margin-top: 1.8em; }
	.page-content h3 { margin-top: 1.6em; }
	.page-content a { color: var(--purple-600); text-decoration: underline; text-underline-offset: 3px; }
	.page-content a:hover { color: var(--purple-500); }
	.page-content blockquote {
		border-left: 3px solid var(--purple-500);
		padding: 8px 0 8px 18px;
		color: var(--muted);
		margin: 24px 0;
	}
	.page-content img { border-radius: var(--r-md); }
	.post-navigation { margin-top:48px; display:flex; justify-content:space-between; gap:24px; }
	.post-navigation a { color: var(--purple-600); font-weight:600 }
</style>

<?php
get_footer();
