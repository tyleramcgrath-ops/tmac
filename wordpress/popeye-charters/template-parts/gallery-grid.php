<?php
/**
 * Polaroid-style photo grid with lightbox. Args: items (array of [img, caption, cat]), filters (bool).
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

$items   = isset( $args['items'] ) ? $args['items'] : popeye_content( 'gallery' );
$filters = ! empty( $args['filters'] );
$cats    = popeye_content( 'gallery_cats' );
?>
<?php if ( $filters ) : ?>
	<div class="filters" role="toolbar" aria-label="<?php esc_attr_e( 'Filter photos', 'popeye-charters' ); ?>">
		<button class="filter is-active" data-filter="all" aria-pressed="true"><?php esc_html_e( 'All Photos', 'popeye-charters' ); ?></button>
		<?php foreach ( $cats as $slug => $label ) : ?>
			<button class="filter" data-filter="<?php echo esc_attr( $slug ); ?>" aria-pressed="false"><?php echo esc_html( $label ); ?></button>
		<?php endforeach; ?>
	</div>
<?php endif; ?>
<div class="photo-grid" data-lightbox>
	<?php foreach ( $items as $item ) : ?>
		<figure class="photo" data-cat="<?php echo esc_attr( isset( $item[2] ) ? $item[2] : '' ); ?>">
			<a href="<?php echo esc_url( popeye_img( $item[0] ) ); ?>" data-caption="<?php echo esc_attr( $item[1] ); ?>">
				<img src="<?php echo esc_url( popeye_img( $item[0] ) ); ?>" alt="<?php echo esc_attr( $item[1] ); ?>" loading="lazy">
			</a>
			<figcaption><?php echo esc_html( $item[1] ); ?></figcaption>
		</figure>
	<?php endforeach; ?>
</div>
