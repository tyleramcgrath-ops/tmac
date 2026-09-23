<?php
/**
 * Shown when a query returns nothing.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;
?>
<section class="no-results">
	<h2 class="no-results__title"><?php esc_html_e( 'Nothing found', 'palmtreesurf' ); ?></h2>

	<?php if ( is_search() ) : ?>
		<p><?php esc_html_e( 'No matches for that search. Try another wording.', 'palmtreesurf' ); ?></p>
		<?php get_search_form(); ?>
	<?php else : ?>
		<p><?php esc_html_e( 'There is nothing here yet. Please check back soon.', 'palmtreesurf' ); ?></p>
	<?php endif; ?>
</section>
