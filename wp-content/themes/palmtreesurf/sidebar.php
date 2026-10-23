<?php
/**
 * Blog sidebar.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

if ( ! is_active_sidebar( 'sidebar-1' ) ) {
	return;
}
?>
<aside id="secondary" class="layout__sidebar widget-area">
	<?php dynamic_sidebar( 'sidebar-1' ); ?>
</aside>
