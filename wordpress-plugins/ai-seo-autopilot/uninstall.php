<?php
/**
 * Removes this plugin's own data. The SEO values already saved in All in One SEO stay where
 * they are; only this plugin's settings, proposals and backups are deleted.
 *
 * @package AISA
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

foreach ( [ 'aisa_settings', 'aisa_compat', 'aisa_health', 'aisa_site_profile', 'aisa_site_profile_applied', 'aisa_site_backup', 'aisa_schema_filter_seen' ] as $option ) {
	delete_option( $option );
}
delete_transient( 'aisa_filter_seen_recent' );
delete_transient( 'aisa_health_running' );

foreach ( [ '_aisa_proposal', '_aisa_status', '_aisa_error', '_aisa_history', '_aisa_schema', '_aisa_written' ] as $key ) {
	delete_metadata( 'post', 0, $key, '', true );
	delete_metadata( 'term', 0, $key, '', true );
}
