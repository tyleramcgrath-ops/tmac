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
define( 'PTS_VERSION', '1.0.0' );

/**
 * Absolute path to the theme directory, with a trailing slash.
 */
define( 'PTS_DIR', trailingslashit( get_template_directory() ) );

/**
 * Public URL of the theme directory, with a trailing slash.
 */
define( 'PTS_URI', trailingslashit( get_template_directory_uri() ) );

/**
 * Post type slug for bookable surf packages.
 */
define( 'PTS_PACKAGE_POST_TYPE', 'pts_package' );

$pts_includes = array(
	'inc/setup.php',            // Theme supports, menus, image sizes.
	'inc/enqueue.php',          // Styles and scripts.
	'inc/template-tags.php',    // Reusable output helpers.
	'inc/template-functions.php', // Body classes and other filters.
	'inc/class-pts-nav-walker.php', // Nav menu markup.
	'inc/post-types.php',       // Packages CPT and taxonomies.
	'inc/meta-boxes.php',       // Package price/duration/level fields.
	'inc/customizer.php',       // Contact details, social links, footer.
	'inc/blocks.php',           // Editor colours and block patterns.
	'inc/forms.php',            // Booking and contact enquiry handling.
);

foreach ( $pts_includes as $pts_include ) {
	require_once PTS_DIR . $pts_include;
}
unset( $pts_includes, $pts_include );
