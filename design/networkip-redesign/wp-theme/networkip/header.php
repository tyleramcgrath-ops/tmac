<?php
/**
 * Site header.
 *
 * @package NetworkIP
 */

?><!doctype html>
<html <?php language_attributes(); ?> class="no-js">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="theme-color" content="#ffffff">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link screen-reader-text" href="#main"><?php esc_html_e( 'Skip to content', 'networkip' ); ?></a>

<header class="nip-header" id="site-header">
	<div class="nip-wrap nip-header__inner">
		<div class="nip-header__brand">
			<?php networkip_logo(); ?>
		</div>

		<button class="nip-menu-toggle" type="button" aria-expanded="false" aria-controls="site-navigation">
			<span class="nip-menu-toggle__bars" aria-hidden="true"><span></span><span></span><span></span></span>
			<span class="nip-menu-toggle__label"><?php esc_html_e( 'Menu', 'networkip' ); ?></span>
		</button>

		<nav class="nip-nav" id="site-navigation" aria-label="<?php esc_attr_e( 'Primary', 'networkip' ); ?>">
			<?php networkip_menu( 'primary', 'nip-nav__list' ); ?>
			<a class="nip-btn nip-btn--primary nip-btn--sm nip-nav__cta" href="<?php echo esc_url( networkip_url( '/contact-us/' ) ); ?>"><?php echo esc_html( networkip_mod( 'header_cta_label' ) ); ?> <svg class="nip-btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
		</nav>
	</div>
</header>
