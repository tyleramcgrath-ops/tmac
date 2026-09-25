<?php
/**
 * The shop, and product category archives.
 *
 * Overrides woocommerce/templates/archive-product.php.
 *
 * @package drip
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' );

$drip_current = is_product_category() ? get_queried_object() : null;
?>
<main id="main" class="shop light">
	<header class="shop-head">
		<div class="shop-head-art" aria-hidden="true"><?php echo drip_line( 'shop-head-line' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
		<div class="wrap">
			<?php woocommerce_breadcrumb(); ?>
			<h1 class="page-title"><?php woocommerce_page_title(); ?></h1>
			<?php if ( $drip_current && $drip_current->description ) : ?>
				<p class="lede"><?php echo esc_html( $drip_current->description ); ?></p>
			<?php else : ?>
				<p class="lede">Back prints in black and white. Drawn from the swell, worn on the street.</p>
			<?php endif; ?>
		</div>
	</header>

	<div class="wrap">
		<div class="shop-bar">
			<nav class="chips" aria-label="Categories">
				<a class="chip<?php echo $drip_current ? '' : ' is-on'; ?>" href="<?php echo drip_wc_url( 'shop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>" <?php echo $drip_current ? '' : 'aria-current="page"'; ?>>All</a>
				<?php foreach ( drip_shop_categories() as $drip_term ) : ?>
					<?php $drip_on = $drip_current && $drip_current->term_id === $drip_term->term_id; ?>
					<a class="chip<?php echo $drip_on ? ' is-on' : ''; ?>" href="<?php echo esc_url( get_term_link( $drip_term ) ); ?>" <?php echo $drip_on ? 'aria-current="page"' : ''; ?>><?php echo esc_html( $drip_term->name ); ?> <small><?php echo (int) $drip_term->count; ?></small></a>
				<?php endforeach; ?>
			</nav>
			<div class="shop-bar-right">
				<div class="chips chips-tone" role="group" aria-label="Filter by color" data-tone-filter="shop-grid">
					<button type="button" class="chip is-on" data-tone="all" aria-pressed="true">Any color</button>
					<button type="button" class="chip" data-tone="black" aria-pressed="false"><i class="swatch swatch-black" aria-hidden="true"></i>Black</button>
					<button type="button" class="chip" data-tone="white" aria-pressed="false"><i class="swatch swatch-white" aria-hidden="true"></i>White</button>
				</div>
				<?php woocommerce_catalog_ordering(); ?>
			</div>
		</div>

		<?php woocommerce_output_all_notices(); ?>

		<?php if ( woocommerce_product_loop() ) : ?>
			<div class="shop-meta"><?php woocommerce_result_count(); ?></div>
			<div class="grid products-grid" id="shop-grid">
				<?php
				while ( have_posts() ) {
					the_post();
					drip_card( wc_get_product( get_the_ID() ) );
				}
				?>
			</div>
			<p class="tone-empty" hidden>No pieces in that color on this page.</p>
			<?php woocommerce_pagination(); ?>
		<?php else : ?>
			<div class="empty-state">
				<?php echo drip_drop( 'empty-drop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<h2>Flat water.</h2>
				<p>Nothing here right now. The next drop is coming.</p>
				<a class="btn btn-ink" href="#join">Join the drop list</a>
			</div>
		<?php endif; ?>
	</div>
</main>
<?php
get_footer( 'shop' );
