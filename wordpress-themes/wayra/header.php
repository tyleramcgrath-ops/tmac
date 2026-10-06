<?php
/**
 * Site header.
 *
 * @package Wayra
 */

$wayra_tollfree = wayra_opt( 'tollfree' );
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="theme-color" content="#0a3d62">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#main"><?php esc_html_e( 'Skip to content', 'wayra' ); ?></a>

<div class="topbar">
	<div class="container topbar__inner">
		<p class="topbar__note"><?php echo esc_html( wayra_opt( 'announcement' ) ); ?></p>
		<ul class="topbar__meta">
			<?php if ( $wayra_tollfree ) : ?>
				<li><a href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', '+' . $wayra_tollfree ) ); ?>"><?php echo wayra_icon( 'phone' ); // phpcs:ignore WordPress.Security.EscapeOutput ?> <span><?php esc_html_e( 'USA/Canada toll-free', 'wayra' ); ?> <?php echo esc_html( $wayra_tollfree ); ?></span></a></li>
			<?php endif; ?>
			<li class="topbar__clock"><?php echo wayra_icon( 'clock' ); // phpcs:ignore WordPress.Security.EscapeOutput ?> <span><?php esc_html_e( 'Tamarindo', 'wayra' ); ?> <time data-tamarindo-clock>--:--</time></span></li>
		</ul>
	</div>
</div>

<header class="site-header" data-header>
	<div class="container site-header__inner">
		<div class="site-branding">
			<?php wayra_logo(); ?>
			<?php if ( is_front_page() ) : ?>
				<h1 class="screen-reader-text"><?php bloginfo( 'name' ); ?></h1>
			<?php endif; ?>
		</div>

		<nav class="primary-nav" id="primary-nav" aria-label="<?php esc_attr_e( 'Main', 'wayra' ); ?>">
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'menu_id'        => 'primary-menu',
					'container'      => false,
					'fallback_cb'    => 'wayra_menu_fallback',
					'depth'          => 2,
				)
			);
			?>
		</nav>

		<div class="header-actions">
			<a class="icon-btn" href="<?php echo esc_url( home_url( '/?s=' ) ); ?>" data-search-toggle aria-label="<?php esc_attr_e( 'Search', 'wayra' ); ?>"><?php echo wayra_icon( 'search' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
			<?php if ( class_exists( 'WooCommerce' ) ) : ?>
				<a class="icon-btn" href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>" aria-label="<?php esc_attr_e( 'My account', 'wayra' ); ?>"><?php echo wayra_icon( 'user' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
				<a class="icon-btn cart-btn" href="<?php echo esc_url( wc_get_cart_url() ); ?>" aria-label="<?php esc_attr_e( 'Your booking', 'wayra' ); ?>"><?php echo wayra_icon( 'cart' ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php wayra_cart_count(); ?></a>
			<?php endif; ?>
			<a class="btn btn--sun header-cta" href="<?php echo esc_url( wayra_shop_url() ); ?>"><?php esc_html_e( 'Book a program', 'wayra' ); ?></a>
			<button class="icon-btn nav-toggle" type="button" aria-controls="primary-nav" aria-expanded="false" data-nav-toggle>
				<span class="screen-reader-text"><?php esc_html_e( 'Menu', 'wayra' ); ?></span>
				<?php echo wayra_icon( 'menu' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			</button>
		</div>
	</div>
	<div class="search-drawer" data-search-drawer hidden>
		<div class="container">
			<?php get_search_form(); ?>
		</div>
	</div>
</header>
