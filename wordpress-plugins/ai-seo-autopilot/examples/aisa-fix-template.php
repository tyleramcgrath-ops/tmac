<?php
/**
 * Plugin Name: AI SEO Autopilot – Fix for AIOSEO X.Y (template)
 * Description: Example "fix pack". Copy this file, adjust it for the AIOSEO change the diagnostic report shows, zip it and install it next to AI SEO Autopilot. No need to replace the main plugin.
 * Version:     1.0.0
 * Requires Plugins: ai-seo-autopilot
 *
 * How it works: AI SEO Autopilot asks the `aisa_adapters` filter for the list of ways it can
 * write to All in One SEO, tries them in order, and proves each write by reading it back. A
 * fix pack adds a new adapter at the front of that list (and/or repoints renamed settings via
 * `aisa_site_option_map`). The self-test on the Health tab then confirms the fix on your site.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'plugins_loaded',
	function () {
		if ( ! interface_exists( 'AISA_Adapter' ) ) {
			return; // Main plugin not active.
		}

		/**
		 * Example adapter. Replace the bodies of read() and write() with calls that match the
		 * new AIOSEO build (the diagnostic report lists which classes, methods, abilities and
		 * table columns exist).
		 */
		class AISA_Fix_Adapter_Example implements AISA_Adapter {
			public function id() {
				return 'fix-example';
			}

			public function label() {
				return 'Fix pack: AIOSEO X.Y';
			}

			public function is_available() {
				// Only claim availability on the AIOSEO versions this fix is for.
				return defined( 'AIOSEO_VERSION' ) && version_compare( AIOSEO_VERSION, 'X.Y', '>=' );
			}

			public function read( $post_id ) {
				// Return the normalized shape: title, description, focus_keyphrase,
				// additional_keyphrases, og_title, og_description, twitter_title, twitter_description.
				return new WP_Error( 'todo', 'Implement read() for the new AIOSEO build.' );
			}

			public function write( $post_id, $fields ) {
				return new WP_Error( 'todo', 'Implement write() for the new AIOSEO build.' );
			}
		}

		add_filter(
			'aisa_adapters',
			function ( $adapters ) {
				array_unshift( $adapters, new AISA_Fix_Adapter_Example() );
				return $adapters;
			}
		);

		// Example: AIOSEO renamed a site setting.
		add_filter(
			'aisa_site_option_map',
			function ( $map ) {
				// $map['phone'] = 'searchAppearance.global.schema.contactPhone';
				return $map;
			}
		);

		// Force a fresh compatibility test now that the fix is installed.
		if ( is_admin() && ! get_option( 'aisa_fix_example_tested' ) ) {
			delete_option( 'aisa_health' );
			update_option( 'aisa_fix_example_tested', 1, false );
		}
	},
	5
);
