<?php
/**
 * Single post.
 *
 * @package mcgrath-chrome
 */

get_header();
?>

<section class="phero">
	<div class="pin">
		<div class="pheroTxt">
			<span class="mono"><?php echo esc_html( get_the_date() ); ?></span>
			<h1 data-tag="&lt;h1&gt;"><?php the_title(); ?></h1>
		</div>
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

	<?php
	if ( comments_open() || get_comments_number() ) {
		comments_template();
	}
	?>
</div>

<?php
get_footer();
