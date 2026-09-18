<?php
/**
 * Palm Tree Surf theme bootstrap.
 *
 * Every feature lives in its own file under inc/. This file only defines the
 * constants those files share and loads them in dependency order.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Theme version. Used to bust asset caches; bump it on every release.
 */
define( 'PT_VERSION', '1.3.0' );

/**
 * Absolute path to the theme directory, with a trailing slash.
 */
define( 'PT_DIR', trailingslashit( get_template_directory() ) );

/**
 * Public URL of the theme directory, with a trailing slash.
 */
define( 'PT_URI', trailingslashit( get_template_directory_uri() ) );

/**
 * Post type slug for bookable experiences: surf lessons, fishing charters,
 * boat tours, wildlife trips and custom trips.
 */
define( 'PT_EXPERIENCE_POST_TYPE', 'experience' );

$pt_includes = array(
	'inc/setup.php',            // Theme supports, menus, image sizes.
	'inc/enqueue.php',          // Styles and scripts.
	'inc/template-tags.php',    // Reusable output helpers.
	'inc/template-functions.php', // Body classes and other filters.
	'inc/class-pt-nav-walker.php', // Nav menu markup.
	'inc/icons.php',            // Inline SVG icons.
	'inc/images.php',           // Manifest-driven image slots.
	'inc/post-types.php',       // Experiences, testimonials, instructors.
	'inc/fields.php',           // Experience detail fields.
	'inc/customizer.php',       // Contact details, social links, footer.
	'inc/blocks.php',           // Editor colours and block patterns.
	'inc/booking.php',          // Booking CTAs and plugin handoff.
	'inc/forms.php',            // Contact enquiry fallback.
	'inc/schema.php',           // JSON-LD structured data.
	'inc/seo.php',              // Meta tags and SEO-plugin cooperation.
	'inc/seed-copy.php',        // Starter long-form copy.
	'inc/setup-content.php',    // First-run pages, menus and sample content.
);

foreach ( $pt_includes as $pt_include ) {
	require_once PT_DIR . $pt_include;
}
unset( $pt_includes, $pt_include );
