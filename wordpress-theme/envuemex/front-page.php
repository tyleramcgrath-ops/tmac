<?php
/**
 * Front page template — assembles the bilingual marketing homepage.
 *
 * If the front page is configured as an Elementor-built page, this template
 * yields to Elementor automatically via the WP template hierarchy when the
 * page template is set to "Elementor Canvas" or "Elementor (Header + Footer)".
 *
 * @package envuemex
 */

get_header();

get_template_part( 'template-parts/section', 'hero' );
get_template_part( 'template-parts/section', 'trust' );
get_template_part( 'template-parts/section', 'soluciones' );
get_template_part( 'template-parts/section', 'industrias' );
get_template_part( 'template-parts/section', 'plataforma' );
get_template_part( 'template-parts/section', 'stats' );
get_template_part( 'template-parts/section', 'nosotros' );
get_template_part( 'template-parts/section', 'cta' );
get_template_part( 'template-parts/section', 'contacto' );

get_footer();
