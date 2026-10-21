<?php
/**
 * Removes plugin options and scheduled events. Product and order meta is
 * kept so listings can be picked up again if the plugin is reinstalled.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

$ola_searches = get_option( 'ola_research_searches', array() );
foreach ( is_array( $ola_searches ) ? array_keys( $ola_searches ) : array() as $ola_id ) {
	delete_option( 'ola_research_result_' . $ola_id );
	wp_clear_scheduled_hook( 'ola_run_research', array( $ola_id ) );
}

delete_option( 'ola_research_searches' );
delete_option( 'ola_settings' );
delete_option( 'ola_orders_last_updated_after' );
delete_transient( 'ola_lwa_access_token' );
wp_clear_scheduled_hook( 'ola_import_orders' );
