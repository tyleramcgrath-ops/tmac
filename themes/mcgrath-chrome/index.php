<?php
/**
 * Blog index / fallback.
 *
 * @package mcgrath-chrome
 */

get_header();
?>

<section class="phero">
	<canvas id="chrome"></canvas>
	<div class="pin">
		<span class="mono"><?php esc_html_e( 'Notes on search', 'mcgrath-chrome' ); ?></span>
		<h1 data-tag="&lt;h1&gt;"><?php echo esc_html( is_home() && ! is_front_page() ? get_the_title( get_option( 'page_for_posts' ) ) : __( 'Writing', 'mcgrath-chrome' ) ); ?></h1>
	</div>
</section>

<section class="gut" style="padding-top:clamp(44px,7vw,90px);">
	<?php if ( have_posts() ) : ?>
		<div class="cards posts rv">
			<?php
			while ( have_posts() ) :
				the_post();
				?>
				<article <?php post_class( 'card' ); ?>>
					<time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
					<h3 data-tag="&lt;h3&gt;"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
					<p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 28 ) ); ?></p>
					<span class="mono"><?php esc_html_e( 'Read →', 'mcgrath-chrome' ); ?></span>
				</article>
				<?php
			endwhile;
			?>
		</div>

		<div class="pager">
			<?php
			echo wp_kses_post(
				paginate_links( array(
					'prev_text' => __( 'Previous', 'mcgrath-chrome' ),
					'next_text' => __( 'Next', 'mcgrath-chrome' ),
				) )
			);
			?>
		</div>
	<?php else : ?>
		<article class="entry">
			<p><?php esc_html_e( 'Nothing published yet.', 'mcgrath-chrome' ); ?></p>
		</article>
	<?php endif; ?>
</section>

<?php
get_footer();
