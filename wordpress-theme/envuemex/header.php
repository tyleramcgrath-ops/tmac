<?php
/**
 * Site header.
 *
 * @package envuemex
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip" href="#main" data-es="Saltar al contenido" data-en="Skip to content"><?php esc_html_e( 'Saltar al contenido', 'envuemex' ); ?></a>

<header class="nav" id="nav">
	<div class="container nav__inner">
		<a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php bloginfo( 'name' ); ?>">
			<?php if ( has_custom_logo() ) : ?>
				<?php the_custom_logo(); ?>
			<?php else : ?>
				<svg class="brand__mark" viewBox="0 0 40 40" aria-hidden="true">
					<defs>
						<linearGradient id="lg" x1="0" x2="1" y1="0" y2="1">
							<stop offset="0" stop-color="#8A5CF6"/>
							<stop offset="1" stop-color="#4B2E83"/>
						</linearGradient>
					</defs>
					<path d="M20 3 L36 12 V28 L20 37 L4 28 V12 Z" fill="url(#lg)"/>
					<path d="M20 11 L28 15.5 V24.5 L20 29 L12 24.5 V15.5 Z" fill="#0B0712" opacity=".85"/>
					<circle cx="20" cy="20" r="2.6" fill="#C9A4FF"/>
				</svg>
				<span class="brand__word">Envue<span class="brand__accent">Mex</span></span>
			<?php endif; ?>
		</a>

		<nav class="nav__links" aria-label="<?php esc_attr_e( 'Primary', 'envuemex' ); ?>">
			<?php
			if ( has_nav_menu( 'primary' ) ) {
				wp_nav_menu( array(
					'theme_location' => 'primary',
					'container'      => false,
					'items_wrap'     => '%3$s',
					'depth'          => 1,
					'fallback_cb'    => false,
				) );
			} else {
				?>
				<a href="<?php echo esc_url( home_url( '/#soluciones' ) ); ?>" data-es="Soluciones" data-en="Solutions">Soluciones</a>
				<a href="<?php echo esc_url( home_url( '/#industrias' ) ); ?>" data-es="Industrias" data-en="Industries">Industrias</a>
				<a href="<?php echo esc_url( home_url( '/#plataforma' ) ); ?>" data-es="Plataforma" data-en="Platform">Plataforma</a>
				<a href="<?php echo esc_url( home_url( '/#nosotros' ) ); ?>" data-es="Nosotros" data-en="About">Nosotros</a>
				<a href="<?php echo esc_url( home_url( '/#contacto' ) ); ?>" data-es="Contacto" data-en="Contact">Contacto</a>
				<?php
			}
			?>
		</nav>

		<div class="nav__actions">
			<div class="lang" role="group" aria-label="<?php esc_attr_e( 'Language', 'envuemex' ); ?>">
				<button type="button" data-lang-btn="es" class="lang__btn is-active" aria-pressed="true">ES</button>
				<span aria-hidden="true">/</span>
				<button type="button" data-lang-btn="en" class="lang__btn" aria-pressed="false">EN</button>
			</div>
			<a class="btn btn--primary nav__cta" href="<?php echo esc_url( home_url( '/#contacto' ) ); ?>" data-es="Cotizar" data-en="Get a quote">Cotizar</a>
			<button class="nav__toggle" type="button" aria-label="<?php esc_attr_e( 'Menu', 'envuemex' ); ?>" aria-expanded="false">
				<span></span><span></span><span></span>
			</button>
		</div>
	</div>
</header>

<main id="main">
