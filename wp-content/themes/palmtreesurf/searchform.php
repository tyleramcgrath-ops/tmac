<?php
/**
 * Search form.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pts_search_id = wp_unique_id( 'pts-search-' );
?>
<form role="search" method="get" class="search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label for="<?php echo esc_attr( $pts_search_id ); ?>" class="screen-reader-text">
		<?php esc_html_e( 'Search this site', 'palmtreesurf' ); ?>
	</label>
	<input
		type="search"
		id="<?php echo esc_attr( $pts_search_id ); ?>"
		class="search-form__field"
		value="<?php echo esc_attr( get_search_query() ); ?>"
		name="s"
		placeholder="<?php esc_attr_e( 'Search&hellip;', 'palmtreesurf' ); ?>"
	/>
	<button type="submit" class="search-form__submit btn">
		<?php esc_html_e( 'Search', 'palmtreesurf' ); ?>
	</button>
</form>
