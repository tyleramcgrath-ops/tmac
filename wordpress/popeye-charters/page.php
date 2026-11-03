<?php
/**
 * Default page template.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	get_template_part(
		'template-parts/page-hero',
		null,
		array(
			'image' => has_post_thumbnail() ? get_the_post_thumbnail_url( null, 'full' ) : popeye_img( 'public_fbab_6229d9679bfe4e8c8741d48790e51b52' ),
			'title' => get_the_title(),
			'text'  => has_excerpt() ? get_the_excerpt() : '',
			'size'  => 'sm',
		)
	);
	?>
	<section class="section section--ivory">
		<div class="container container--narrow prose">
			<?php
			the_content();
			wp_link_pages();
			?>
		</div>
		<?php
		if ( comments_open() || get_comments_number() ) {
			echo '<div class="container container--narrow">';
			comments_template();
			echo '</div>';
		}
		?>
	</section>
	<?php
endwhile;

get_footer();
