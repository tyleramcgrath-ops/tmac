<?php
/**
 * Single post template.
 *
 * @package NetworkIP
 */

get_header();
?>
<main id="main" class="nip-main">
	<?php
	while ( have_posts() ) :
		the_post();
		get_template_part( 'template-parts/page-header', null, array( 'title' => get_the_title(), 'text' => get_the_date() ) );
		?>
		<article id="post-<?php the_ID(); ?>" <?php post_class( 'nip-section nip-section--plain' ); ?>>
			<div class="nip-wrap nip-wrap--narrow entry-content">
				<?php
				if ( has_post_thumbnail() ) {
					the_post_thumbnail( 'large', array( 'class' => 'nip-featured' ) );
				}
				the_content();
				wp_link_pages();
				?>
			</div>
			<div class="nip-wrap nip-wrap--narrow">
				<?php
				the_post_navigation(
					array(
						'prev_text' => '<span class="nip-eyebrow">' . esc_html__( 'Previous', 'networkip' ) . '</span>%title',
						'next_text' => '<span class="nip-eyebrow">' . esc_html__( 'Next', 'networkip' ) . '</span>%title',
					)
				);
				if ( comments_open() || get_comments_number() ) {
					comments_template();
				}
				?>
			</div>
		</article>
	<?php endwhile; ?>
</main>
<?php
get_footer();
