<?php
/**
 * Single journal post.
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<main id="main" class="site-main">
	<?php
	while ( have_posts() ) :
		the_post();
		?>
		<article id="post-<?php the_ID(); ?>" <?php post_class( 'container page-article' ); ?>>
			<header class="page-header">
				<p class="eyebrow"><?php echo esc_html( get_the_date() ); ?></p>
				<h1 class="page-title"><?php the_title(); ?></h1>
			</header>
			<?php if ( has_post_thumbnail() ) : ?>
				<figure class="page-hero"><?php the_post_thumbnail( 'full' ); ?></figure>
			<?php endif; ?>
			<div class="entry-content">
				<?php
				the_content();
				wp_link_pages();
				?>
			</div>
			<?php
			the_post_navigation(
				array(
					'prev_text' => '&larr; %title',
					'next_text' => '%title &rarr;',
				)
			);
			?>
		</article>
		<?php
		if ( comments_open() || get_comments_number() ) {
			echo '<div class="container page-article">';
			comments_template();
			echo '</div>';
		}
	endwhile;
	?>
</main>
<?php
get_footer();
