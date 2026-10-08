<?php
/**
 * Homepage template. Each section is a template part in template-parts/home/.
 *
 * The static front page's own editor content is ignored by default, because on
 * sites migrated from a page builder it holds the old homepage design. Turn on
 * Customize → NetworkIP Homepage → Hero → "Show the front page's editor content"
 * to show it after the About section.
 *
 * @package NetworkIP
 */

get_header();
?>
<main id="main" class="nip-main nip-home">
	<?php
	get_template_part( 'template-parts/home/hero' );
	get_template_part( 'template-parts/home/about' );

	if ( 'page' === get_option( 'show_on_front' ) && '1' === networkip_mod( 'home_show_content' ) ) {
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
