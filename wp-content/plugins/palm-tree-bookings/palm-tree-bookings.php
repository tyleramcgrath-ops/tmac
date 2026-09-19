<?php
/**
 * Plugin Name:       Palm Tree Bookings
 * Description:       Booking requests for surf lessons, tours and custom experiences: capture, manage, notify and export. Lives in a plugin so booking data survives a theme change.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Text Domain:       palm-tree-bookings
 * License:           GPL-2.0-or-later
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

define( 'PTB_VERSION', '1.0.0' );
define( 'PTB_FILE', __FILE__ );
define( 'PTB_DIR', plugin_dir_path( __FILE__ ) );
define( 'PTB_URL', plugin_dir_url( __FILE__ ) );

/**
 * Post type holding one booking request each.
 */
define( 'PTB_POST_TYPE', 'ptb_booking' );

require_once PTB_DIR . 'inc/schema.php';
require_once PTB_DIR . 'inc/post-type.php';
require_once PTB_DIR . 'inc/form.php';
require_once PTB_DIR . 'inc/submission.php';
require_once PTB_DIR . 'inc/emails.php';
require_once PTB_DIR . 'inc/admin.php';
require_once PTB_DIR . 'inc/export.php';
require_once PTB_DIR . 'inc/settings.php';
require_once PTB_DIR . 'inc/payments.php';
require_once PTB_DIR . 'inc/availability.php';
require_once PTB_DIR . 'inc/schedule-admin.php';

/**
 * Register the post type on activation so its rewrite rules exist immediately.
 */
function ptb_activate() {
	ptb_register_post_type();
	flush_rewrite_rules();
}
register_activation_hook( PTB_FILE, 'ptb_activate' );

/**
 * Leave the rewrite table clean behind us.
 */
function ptb_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( PTB_FILE, 'ptb_deactivate' );
