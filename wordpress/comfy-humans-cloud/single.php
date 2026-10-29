<?php
/**
 * A single blog post.
 *
 * @package comfy-humans-cloud
 */

defined( 'ABSPATH' ) || exit;

get_header();
while ( have_posts() ) :
	the_post();
	?>
	<section class="page-sky">
		<div class="sky-layer" data-clouds="back" data-depth="0.3"></div>
		<div class="wrap"><header class="page-head"><p class="eyebrow"><?php echo esc_html( get_the_date() ); ?></p><h1><?php the_title(); ?></h1></header></div>
	</section>
	<div class="wrap page-body">
		<article <?php post_class( 'soft-panel entry' ); ?>>
			<?php if ( has_post_thumbnail() ) : ?>
				<div class="entry-thumb"><?php the_post_thumbnail( 'large' ); ?></div>
			<?php endif; ?>
			<?php the_content(); ?>
		</article>
		<?php
		if ( comments_open() || get_comments_number() ) {
			comments_template();
		}
		?>
	</div>
	<?php
endwhile;
get_footer();
