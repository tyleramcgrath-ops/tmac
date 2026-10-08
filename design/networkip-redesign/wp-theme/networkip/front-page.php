<?php
/**
 * Homepage template. Each section is a template part in template-parts/home/.
 *
 * If the static front page has editor content, it is shown after the About section.
 *
 * @package NetworkIP
 */

get_header();
?>
<main id="main" class="nip-main nip-home">
	<?php
	get_template_part( 'template-parts/home/hero' );
	get_template_part( 'template-parts/home/about' );

	if ( 'page' === get_option( 'show_on_front' ) ) {
		while ( have_posts() ) {
			the_post();
			if ( '' !== trim( get_the_content() ) ) {
				echo '<section class="nip-section nip-section--plain"><div class="nip-wrap entry-content">';
				the_content();
				echo '</div></section>';
			}
		}
	}

	get_template_part( 'template-parts/home/services' );
	get_template_part( 'template-parts/home/network' );
	get_template_part( 'template-parts/home/technology' );
	get_template_part( 'template-parts/home/contact' );
	?>
</main>
<?php
get_footer();
