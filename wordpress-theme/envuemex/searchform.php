<?php
/**
 * Search form.
 *
 * @package envuemex
 */
?>
<form role="search" method="get" class="contact__form" style="grid-template-columns:1fr auto;max-width:520px" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<div class="field">
		<label class="screen-reader-text" for="s"><?php esc_html_e( 'Buscar', 'envuemex' ); ?></label>
		<input id="s" type="search" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="<?php esc_attr_e( 'Buscar…', 'envuemex' ); ?>" />
	</div>
	<button class="btn btn--primary" type="submit"><?php esc_html_e( 'Buscar', 'envuemex' ); ?></button>
</form>
