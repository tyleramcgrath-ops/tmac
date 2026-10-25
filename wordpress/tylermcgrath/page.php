<?php
/**
 * A page.
 *
 * @package tylermcgrath
 */

get_header();
while ( have_posts() ) :
	the_post();
	?>
	<main id="main" class="tm-main tm-inner">
		<?php
		get_template_part(
			'template-parts/page-hero',
			null,
			array(
				'eyebrow' => esc_html( get_bloginfo( 'name' ) ),
				'title'   => esc_html( get_the_title() ),
				'lede'    => has_excerpt() ? esc_html( get_the_excerpt() ) : '',
			)
		);
		?>
		<article <?php post_class( 'tm-section tm-article' ); ?>>
			<div class="tm-content tm-prose">
				<?php
				the_content();
				wp_link_pages();
				?>
			</div>
			<?php
			if ( comments_open() || get_comments_number() ) {
				echo '<div class="tm-content">';
				comments_template();
				echo '</div>';
			}
			?>
		</article>
	</main>
	<?php
endwhile;
get_footer();
