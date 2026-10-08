<?php
/**
 * Default page template.
 *
 * @package NetworkIP
 */

get_header();
?>
<main id="main" class="nip-main">
	<?php
	while ( have_posts() ) :
		the_post();
		get_template_part(
			'template-parts/page-header',
			null,
			array(
				'title' => get_the_title(),
				'text'  => has_excerpt() ? get_the_excerpt() : '',
			)
		);
		?>
		<article id="post-<?php the_ID(); ?>" <?php post_class( 'nip-section nip-section--plain' ); ?>>
			<div class="nip-wrap nip-wrap--narrow entry-content">
				<?php
				the_content();
				wp_link_pages(
					array(
						'before' => '<nav class="page-links" aria-label="' . esc_attr__( 'Page', 'networkip' ) . '">',
						'after'  => '</nav>',
					)
				);
				?>
			</div>
		</article>
		<?php
		if ( comments_open() || get_comments_number() ) {
			echo '<div class="nip-wrap nip-wrap--narrow">';
			comments_template();
			echo '</div>';
		}
	endwhile;

	get_template_part( 'template-parts/cta' );
	?>
</main>
<?php
get_footer();
