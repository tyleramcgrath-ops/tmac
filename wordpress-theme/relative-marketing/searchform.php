<?php
/**
 * Search form.
 *
 * @package rma
 */
?>
<form role="search" method="get" class="search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<div class="field" style="display:flex;gap:10px;margin:0">
		<input type="search" class="search-field" placeholder="<?php esc_attr_e( 'Search…', 'rma' ); ?>" value="<?php echo get_search_query(); ?>" name="s" />
		<button type="submit" class="btn btn--primary"><?php esc_html_e( 'Search', 'rma' ); ?></button>
	</div>
</form>
