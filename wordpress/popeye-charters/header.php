<?php
/**
 * Site header.
 *
 * @package Popeye_Charters
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
<a class="skip-link" href="#main"><?php esc_html_e( 'Skip to content', 'popeye-charters' ); ?></a>

<header class="site-header" id="site-header">
	<div class="container site-header__inner">
		<div class="site-brand">
			<?php if ( has_custom_logo() ) : ?>
				<?php the_custom_logo(); ?>
			<?php else : ?>
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="custom-logo-link" rel="home">
					<img src="<?php echo esc_url( popeye_img( 'logo-light.png' ) ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" class="custom-logo" width="543" height="289">
				</a>
			<?php endif; ?>
		</div>

		<button class="nav-toggle" aria-controls="site-nav" aria-expanded="false">
			<span class="nav-toggle__open"><?php popeye_the_icon( 'menu' ); ?></span>
			<span class="nav-toggle__close"><?php popeye_the_icon( 'close' ); ?></span>
			<span class="screen-reader-text"><?php esc_html_e( 'Menu', 'popeye-charters' ); ?></span>
		</button>

		<nav class="site-nav" id="site-nav" aria-label="<?php esc_attr_e( 'Primary', 'popeye-charters' ); ?>">
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_id'        => 'primary-menu',
					'fallback_cb'    => 'popeye_fallback_menu',
					'depth'          => 2,
				)
			);
			?>
			<a class="btn btn--gold btn--sm site-nav__cta" href="<?php echo esc_url( popeye_book_url() ); ?>"><?php esc_html_e( 'Book', 'popeye-charters' ); ?></a>
		</nav>
	</div>
</header>

<main id="main" class="site-main">
