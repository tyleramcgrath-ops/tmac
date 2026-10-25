<?php
/**
 * Search form.
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;

$drip_id = wp_unique_id( 'search-' );
?>
<form role="search" method="get" class="search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label class="screen-reader-text" for="<?php echo esc_attr( $drip_id ); ?>"><?php esc_html_e( 'Search', 'drip-current' ); ?></label>
	<input type="search" id="<?php echo esc_attr( $drip_id ); ?>" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="<?php esc_attr_e( 'Search', 'drip-current' ); ?>">
	<button type="submit"><?php esc_html_e( 'Search', 'drip-current' ); ?></button>
</form>
