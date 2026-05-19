<?php
/**
 * Default page template.
 *
 * Pages built with Elementor render through here. The container uses
 * the same paper-tone surface as the rest of the theme.
 *
 * @package envuemex
 */

get_header();
?>

<section class="section">
	<div class="container" style="max-width:920px">
		<?php
		while ( have_posts() ) :
			the_post();
			?>
			<article <?php post_class(); ?>>
				<header class="section__head" style="text-align:left;margin-bottom:32px">
					<h1 style="margin:0"><?php the_title(); ?></h1>
				</header>

				<div class="page-content">
					<?php
					the_content();
					wp_link_pages( array(
						'before' => '<nav class="page-links">',
						'after'  => '</nav>',
					) );
					?>
				</div>

				<?php if ( comments_open() || get_comments_number() ) : ?>
					<div style="margin-top:48px">
						<?php comments_template(); ?>
					</div>
				<?php endif; ?>
			</article>
			<?php
		endwhile;
		?>
	</div>
</section>

<style>
	.page-content { color: var(--text); font-size: 1.05rem; }
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
</style>

<?php
get_footer();
