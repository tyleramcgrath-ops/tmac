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
define( 'PT_VERSION', '1.8.0' );

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
	'inc/performance.php',      // Front-end performance.
	'inc/template-tags.php',    // Reusable output helpers.
	'inc/template-functions.php', // Body classes and other filters.
	'inc/posts.php',            // Journal post helpers.
	'inc/class-pt-nav-walker.php', // Nav menu markup.
	'inc/icons.php',            // Inline SVG icons.
	'inc/branding.php',         // Logo and favicons.
	'inc/images.php',           // Manifest-driven image slots.
	'inc/gallery.php',          // Photo gallery sources and schema.
	'inc/post-types.php',       // Experiences, testimonials, instructors.
	'inc/fields.php',           // Experience detail fields.
	'inc/taxonomy-content.php', // Category archives: routing, copy, term images.
	'inc/reviews.php',          // Star ratings from moderated visitor reviews.
	'inc/customizer.php',       // Contact details, social links, footer.
	'inc/i18n.php',             // English and Spanish.
	'inc/blocks.php',           // Editor colours and block patterns.
	'inc/booking.php',          // Booking CTAs and plugin handoff.
	'inc/forms.php',            // Contact enquiry fallback.
	'inc/operators.php',        // Operator applications.
	'inc/schema.php',           // JSON-LD structured data.
	'inc/schema-site.php',      // Organization, WebSite and list schema.
	'inc/seo.php',              // Meta tags and SEO-plugin cooperation.
	'inc/about-content.php',    // About page copy and FAQ.
	'inc/seed-copy.php',        // Starter long-form copy.
	'inc/seed-posts.php',       // Long-form journal articles.
	'inc/setup-content.php',    // First-run pages, menus and sample content.
	'inc/content-refresh.php',  // Bring untouched seeded pages forward on update.
	'inc/media-sync.php',       // Assign bundled photography on upgrade.
);

foreach ( $pt_includes as $pt_include ) {
	require_once PT_DIR . $pt_include;
}
unset( $pt_includes, $pt_include );
