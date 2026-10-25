<?php
/**
 * Site header.
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#main"><?php esc_html_e( 'Skip to content', 'drip-current' ); ?></a>

<header class="site-header" id="site-header">
	<div class="site-header__inner">
		<?php drip_current_brand( 'header' ); ?>

		<nav class="primary-nav" id="primary-nav" aria-label="<?php esc_attr_e( 'Main', 'drip-current' ); ?>">
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_class'     => 'menu',
					'depth'          => 2,
					'fallback_cb'    => 'drip_current_primary_fallback',
				)
			);
			?>
		</nav>

		<div class="header-actions">
			<button class="header-icon search-toggle" type="button" aria-expanded="false" aria-controls="search-panel" aria-label="<?php esc_attr_e( 'Search', 'drip-current' ); ?>">
				<?php echo drip_current_icon( 'search' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			</button>
			<?php if ( class_exists( 'WooCommerce' ) ) : ?>
				<a class="header-icon header-account" href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>" aria-label="<?php esc_attr_e( 'Account', 'drip-current' ); ?>">
					<?php echo drip_current_icon( 'account' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				</a>
				<a class="header-icon header-bag" href="<?php echo esc_url( wc_get_cart_url() ); ?>" aria-label="<?php esc_attr_e( 'Bag', 'drip-current' ); ?>">
					<?php echo drip_current_icon( 'bag' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
					<?php echo drip_current_cart_count(); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				</a>
			<?php endif; ?>
			<button class="header-icon menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="<?php esc_attr_e( 'Menu', 'drip-current' ); ?>">
				<?php echo drip_current_icon( 'menu' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<?php echo drip_current_icon( 'close' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			</button>
		</div>
	</div>

	<div class="search-panel" id="search-panel" hidden>
		<form role="search" method="get" class="search-panel__form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
			<label class="screen-reader-text" for="header-search"><?php esc_html_e( 'Search products', 'drip-current' ); ?></label>
			<input id="header-search" type="search" name="s" placeholder="<?php esc_attr_e( 'Search tees, hoodies, caps…', 'drip-current' ); ?>" value="<?php echo esc_attr( get_search_query() ); ?>">
			<?php if ( class_exists( 'WooCommerce' ) ) : ?>
				<input type="hidden" name="post_type" value="product">
			<?php endif; ?>
			<button type="submit" aria-label="<?php esc_attr_e( 'Search', 'drip-current' ); ?>"><?php echo drip_current_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
		</form>
	</div>
</header>
