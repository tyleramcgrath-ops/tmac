<?php
/**
 * Default page template.
 *
 * @package rma
 */

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<section class="page-hero">
		<div class="container" style="max-width:840px">
			<h1><?php the_title(); ?></h1>
		</div>
	</section>
	<section class="section--tight">
		<div class="container">
			<div class="post-content">
				<?php
				the_content();
				wp_link_pages( array(
					'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'rma' ),
					'after'  => '</div>',
				) );
				?>
			</div>
		</div>
	</section>
	<?php
	if ( comments_open() || get_comments_number() ) {
		echo '<div class="container" style="max-width:760px;padding-bottom:60px">';
		comments_template();
		echo '</div>';
	}
endwhile;

get_footer();
