<?php
/**
 * Search form.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;
?>
<form role="search" method="get" class="search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label class="screen-reader-text" for="s-<?php echo esc_attr( wp_unique_id() ); ?>"><?php esc_html_e( 'Search for:', 'popeye-charters' ); ?></label>
	<input type="search" id="s-<?php echo esc_attr( wp_unique_id() ); ?>" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="<?php esc_attr_e( 'Search guides…', 'popeye-charters' ); ?>">
	<button type="submit" class="btn btn--navy btn--sm"><?php esc_html_e( 'Search', 'popeye-charters' ); ?></button>
</form>
