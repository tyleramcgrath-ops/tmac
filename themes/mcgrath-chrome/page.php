<?php
/**
 * Default page template: chrome hero + editor content.
 *
 * @package mcgrath-chrome
 */

get_header();
?>

<section class="phero">
	<canvas id="chrome"></canvas>
	<div class="pin">
		<span class="mono"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></span>
		<h1 data-tag="&lt;h1&gt;"><?php the_title(); ?></h1>
	</div>
</section>

<div class="gut">
	<article class="entry rv">
		<?php
		while ( have_posts() ) {
			the_post();
			the_content();
		}
		?>
	</article>
</div>

<?php
get_footer();
