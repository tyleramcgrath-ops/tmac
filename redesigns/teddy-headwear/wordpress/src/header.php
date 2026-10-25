<?php
/**
 * Header: the ticker, navigation and cart button are drawn by site.js into #chrome-top
 * (the same code as the static site), so every page shares one header.
 */
defined( 'ABSPATH' ) || exit;
$teddy_b     = teddy_body();
$teddy_intro = 'home' === $teddy_b['page'] && get_theme_mod( 'teddy_intro', true );
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<?php wp_head(); ?>
</head>
<body <?php body_class( $teddy_b['hero'] ? 'has-hero' : '' ); ?> data-page="<?php echo esc_attr( $teddy_b['page'] ); ?>"<?php echo $teddy_b['id'] ? ' data-id="' . esc_attr( $teddy_b['id'] ) . '"' : ''; ?>>
<?php wp_body_open(); ?>
<script><?php echo $teddy_intro ? "try{if(sessionStorage.getItem('teddy-intro'))document.documentElement.classList.add('no-intro')}catch(e){}" : "document.documentElement.classList.add('no-intro')"; ?></script>
<?php
if ( $teddy_intro ) {
	get_template_part( 'template-parts/intro' );
}
?>
<div id="chrome-top"></div>
<main id="top">
