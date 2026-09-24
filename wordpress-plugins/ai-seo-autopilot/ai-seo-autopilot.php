<?php
/**
 * Plugin Name:       AI SEO Autopilot for All in One SEO
 * Description:       Uses Claude to write SEO titles, meta descriptions, keyphrases, social tags and schema for every page, then fills them into All in One SEO (Lite or Pro) in one click. Every change can be previewed and restored.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            TMAC
 * License:           GPL-2.0-or-later
 * Text Domain:       ai-seo-autopilot
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'AISA_VERSION', '1.0.0' );
define( 'AISA_FILE', __FILE__ );
define( 'AISA_DIR', plugin_dir_path( __FILE__ ) );
define( 'AISA_URL', plugin_dir_url( __FILE__ ) );

require_once AISA_DIR . 'includes/class-settings.php';
require_once AISA_DIR . 'includes/class-claude-client.php';
require_once AISA_DIR . 'includes/class-content-extractor.php';
require_once AISA_DIR . 'includes/adapters/interface-adapter.php';
require_once AISA_DIR . 'includes/adapters/class-adapter-abilities.php';
require_once AISA_DIR . 'includes/adapters/class-adapter-service.php';
require_once AISA_DIR . 'includes/adapters/class-adapter-model.php';
require_once AISA_DIR . 'includes/class-aioseo-bridge.php';
require_once AISA_DIR . 'includes/class-generator.php';
require_once AISA_DIR . 'includes/class-jobs.php';
require_once AISA_DIR . 'includes/class-schema-injector.php';
require_once AISA_DIR . 'includes/class-health-check.php';
require_once AISA_DIR . 'includes/class-admin.php';

/**
 * Boots the plugin once every other plugin (including AIOSEO) has loaded.
 */
function aisa_boot() {
	AISA_Schema_Injector::init();
	AISA_Health_Check::init();

	if ( is_admin() ) {
		AISA_Admin::init();
	}

	if ( defined( 'WP_CLI' ) && WP_CLI ) {
		require_once AISA_DIR . 'includes/class-cli.php';
		WP_CLI::add_command( 'aisa', 'AISA_CLI' );
	}
}
add_action( 'plugins_loaded', 'aisa_boot', 20 );
