<?php
/**
 * Search form.
 *
 * @package tylermcgrath
 */

?>
<form role="search" method="get" class="tm-search" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label class="screen-reader-text" for="tm-s-<?php echo esc_attr( wp_unique_id() ); ?>"><?php esc_html_e( 'Search', 'tylermcgrath' ); ?></label>
	<input type="search" id="tm-s-<?php echo esc_attr( wp_unique_id() ); ?>" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="<?php esc_attr_e( 'Search the studio…', 'tylermcgrath' ); ?>">
	<button type="submit" aria-label="<?php esc_attr_e( 'Search', 'tylermcgrath' ); ?>"><?php echo tm_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></button>
</form>
