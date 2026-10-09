<?php
/**
 * Homepage template. Each section is a template part in template-parts/home/.
 *
 * Default order: hero, carrier strip, gold band, photo section, impact figures,
 * services, technology, contact. Change it with the `networkip_home_sections`
 * filter (for example, add 'network' to bring back the global-calling map section).
 *
 * The static front page's own editor content is ignored by default, because on
 * sites migrated from a page builder it holds the old homepage design. Turn on
 * Customize → NetworkIP Homepage → Layout & compatibility → "Show the front
 * page's own editor content" to show it after the impact figures.
 *
 * @package NetworkIP
 */

$networkip_sections = apply_filters(
	'networkip_home_sections',
	array( 'hero', 'carriers', 'band', 'bridge', 'impact', 'content', 'services', 'technology', 'contact' )
);

get_header();
?>
<main id="main" class="nip-main nip-home">
	<?php
	foreach ( (array) $networkip_sections as $networkip_section ) {
		if ( 'content' === $networkip_section ) {
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
			continue;
		}
		get_template_part( 'template-parts/home/' . sanitize_key( $networkip_section ) );
	}
	?>
</main>
<?php
get_footer();
