<?php
/**
 * Header.
 *
 * @package mcgrath-chrome
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link" href="#main"><?php esc_html_e( 'Skip to content', 'mcgrath-chrome' ); ?></a>

<header class="nav gut" id="siteNav">
	<div class="navIn">
		<a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"
			aria-label="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
			<?php if ( has_custom_logo() ) : ?>
				<?php the_custom_logo(); ?>
			<?php else : ?>
				<img class="mark" src="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo.png' ); ?>"
					alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" width="1109" height="612" fetchpriority="high">
			<?php endif; ?>
			<span class="brandTxt"><?php echo esc_html( mcg_opt( 'mcg_brand_line', 'McGrath Marketing Group' ) ); ?></span>
		</a>

		<nav aria-label="<?php esc_attr_e( 'Primary', 'mcgrath-chrome' ); ?>" id="primaryNav">
			<?php
			// The theme's own pages, linked directly. A WordPress menu stores
			// page IDs, so a menu built under a previous site goes on pointing
			// at that site's pages no matter what this theme does.
			mcg_nav();
			?>
		</nav>

		<div class="navRight">
			<button class="vmode" id="vmode" type="button" aria-pressed="false"><?php esc_html_e( 'Crawler view', 'mcgrath-chrome' ); ?></button>
			<a href="<?php echo esc_url( mcg_url( 'contact' ) ); ?>" class="navcta" data-mag>
				<?php esc_html_e( 'Start a Project', 'mcgrath-chrome' ); ?> <span class="arw" aria-hidden="true">&rarr;</span>
			</a>
			<button class="navToggle" id="navToggle" type="button" aria-expanded="false" aria-controls="primaryNav"
				aria-label="<?php esc_attr_e( 'Toggle menu', 'mcgrath-chrome' ); ?>">
				<span></span><span></span><span></span>
			</button>
		</div>
	</div>
</header>

<main id="main">
