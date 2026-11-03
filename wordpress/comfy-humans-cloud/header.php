<?php
/**
 * Site header: the floating glass nav.
 *
 * @package comfy-humans-cloud
 */

defined( 'ABSPATH' ) || exit;
$chc_cart = function_exists( 'wc_get_cart_url' ) ? wc_get_cart_url() : home_url( '/' );
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#content"><?php esc_html_e( 'Skip to content', 'comfy-humans-cloud' ); ?></a>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
	<filter id="fluff" x="-20%" y="-20%" width="140%" height="140%">
		<feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="4" seed="7" result="n"/>
		<feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G" result="d"/>
		<feGaussianBlur in="d" stdDeviation="1.6"/>
	</filter>
</svg>
<header class="top">
	<div class="wrap">
		<nav class="nav" aria-label="<?php esc_attr_e( 'Main', 'comfy-humans-cloud' ); ?>">
			<?php if ( has_custom_logo() ) : ?>
				<?php the_custom_logo(); ?>
			<?php else : ?>
				<a class="logo" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php echo chc_cloud_svg(); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( strtolower( get_bloginfo( 'name' ) ) ); ?></a>
			<?php endif; ?>
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'depth'          => 1,
					'fallback_cb'    => 'chc_menu_fallback',
				)
			);
			?>
			<a class="bag" href="<?php echo esc_url( $chc_cart ); ?>"><?php esc_html_e( 'Bag', 'comfy-humans-cloud' ); ?> <b class="chc-bag-count"><?php echo esc_html( chc_bag_count() ); ?></b></a>
		</nav>
	</div>
</header>
<main id="content">
