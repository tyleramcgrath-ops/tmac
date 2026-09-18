<?php
/**
 * Document head and site header.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link screen-reader-text" href="#main"><?php esc_html_e( 'Skip to content', 'palmtreesurf' ); ?></a>

<div id="page" class="site">
	<header id="masthead" class="site-header">
		<div class="site-header__inner container">
			<div class="site-branding">
				<?php
				if ( has_custom_logo() ) {
					the_custom_logo();
				} elseif ( is_front_page() ) {
					printf(
						'<h1 class="site-title"><a href="%1$s" rel="home">%2$s</a></h1>',
						esc_url( home_url( '/' ) ),
						esc_html( get_bloginfo( 'name' ) )
					);
				} else {
					printf(
						'<p class="site-title"><a href="%1$s" rel="home">%2$s</a></p>',
						esc_url( home_url( '/' ) ),
						esc_html( get_bloginfo( 'name' ) )
					);
				}

				$pts_tagline = get_bloginfo( 'description', 'display' );
				if ( $pts_tagline ) {
					printf( '<p class="site-description">%s</p>', esc_html( $pts_tagline ) );
				}
				?>
			</div>

			<button class="menu-toggle" type="button" aria-controls="primary-menu" aria-expanded="false">
				<span class="menu-toggle__bars" aria-hidden="true"></span>
				<span class="screen-reader-text"><?php esc_html_e( 'Open menu', 'palmtreesurf' ); ?></span>
			</button>

			<nav id="site-navigation" class="site-nav" aria-label="<?php esc_attr_e( 'Primary', 'palmtreesurf' ); ?>">
				<?php
				if ( has_nav_menu( 'primary' ) ) {
					wp_nav_menu(
						array(
							'theme_location' => 'primary',
							'menu_id'        => 'primary-menu',
							'menu_class'     => 'nav',
							'container'      => false,
							'depth'          => 2,
							'walker'         => new PTS_Nav_Walker(),
						)
					);
				}

				$pts_cta_label = pts_mod( 'pts_header_cta_text' );
				if ( $pts_cta_label ) {
					printf(
						'<a class="btn btn--primary site-nav__cta" href="%1$s">%2$s</a>',
						esc_url( pts_booking_url() ),
						esc_html( $pts_cta_label )
					);
				}
				?>
			</nav>
		</div>
	</header>

	<main id="main" class="site-main">
