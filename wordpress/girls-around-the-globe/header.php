<?php
/**
 * Site header.
 *
 * @package gag
 */

$gag_login = get_theme_mod( 'gag_login_url', '' );
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link screen-reader-text" href="#content"><?php esc_html_e( 'Skip to content', 'gag' ); ?></a>

<header class="site-header">
	<div class="wrap">
		<a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php esc_attr_e( 'Girls Around the Globe home', 'gag' ); ?>">
			<?php echo gag_logo( 'mark' ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in gag_logo(). ?>
		</a>
		<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="<?php esc_attr_e( 'Menu', 'gag' ); ?>">
			<?php echo gag_icon( 'menu', 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		</button>
		<nav id="site-nav" class="nav" aria-label="<?php esc_attr_e( 'Main', 'gag' ); ?>">
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'depth'          => 1,
					'fallback_cb'    => 'gag_default_menu',
				)
			);
			?>
			<?php if ( $gag_login ) : ?>
				<a href="<?php echo esc_url( $gag_login ); ?>"><?php esc_html_e( 'Log in', 'gag' ); ?></a>
			<?php endif; ?>
			<a class="btn btn-gold" href="<?php echo esc_url( gag_join_url() ); ?>"><?php esc_html_e( 'Join free', 'gag' ); ?></a>
		</nav>
	</div>
</header>

<main id="content">
