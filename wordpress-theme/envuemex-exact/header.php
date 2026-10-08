<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#071321">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="emx-skip" href="#main" data-en="Skip to content">Saltar al contenido</a>

<?php
$logo_url = esc_url( get_template_directory_uri() . '/assets/envuemex-logo.webp' );
$nav_items = array(
	array( 'label' => 'Inicio',     'en' => 'Home',      'url' => home_url( '/' ) ),
	array( 'label' => 'Servicios',  'en' => 'Services',  'url' => home_url( '/servicios/' ) ),
	array( 'label' => 'GPS',        'en' => 'GPS',       'url' => home_url( '/soluciones-de-rastreo-gps/' ) ),
	array( 'label' => 'Dash Cams',  'en' => 'Dash Cams', 'url' => home_url( '/dash-cams/' ) ),
	array( 'label' => 'Activos',    'en' => 'Assets',    'url' => home_url( '/rastreadores-de-activos-no-vehiculares/' ) ),
	array( 'label' => 'Nosotros',   'en' => 'About',     'url' => home_url( '/acerca-de-nosotros/' ) ),
	array( 'label' => 'FAQ',        'en' => 'FAQ',       'url' => home_url( '/corporate-faq/' ) ),
	array( 'label' => 'Eventos',    'en' => 'Events',    'url' => home_url( '/calendario-de-eventos/' ) ),
	array( 'label' => 'Blog',       'en' => 'Blog',      'url' => home_url( '/blog/' ) ),
	array( 'label' => 'Contacto',   'en' => 'Contact',   'url' => home_url( '/contacto/' ) ),
);
$current = home_url( $_SERVER['REQUEST_URI'] ?? '/' );
?>

<header class="topline" role="banner">
	<a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="EnVueMex Solutions">
		<img src="<?php echo $logo_url; ?>" alt="EnVueMex Solutions" />
	</a>

	<nav class="nav-links" aria-label="Primary">
		<?php foreach ( $nav_items as $item ) :
			$is_current = trailingslashit( $item['url'] ) === trailingslashit( $current );
			?>
			<a class="nav-link" href="<?php echo esc_url( $item['url'] ); ?>"<?php echo $is_current ? ' aria-current="page"' : ''; ?> data-en="<?php echo esc_attr( $item['en'] ); ?>"><?php echo esc_html( $item['label'] ); ?></a>
		<?php endforeach; ?>
	</nav>

	<div class="nav-actions">
		<div class="lang-toggle" role="group" aria-label="Language">
			<button type="button" data-lang-btn="es" class="is-active" aria-pressed="true">ES</button>
			<button type="button" data-lang-btn="en" aria-pressed="false">EN</button>
		</div>
		<a class="btn btn-ghost" href="tel:8121880258">81 2188 0258</a>
		<a class="btn btn-primary" href="<?php echo esc_url( home_url( '/contacto/' ) ); ?>" data-en="Get started">Comience hoy</a>
		<button class="nav-toggle" type="button" aria-label="Abrir menú" data-en-attr="aria-label=Open menu" aria-expanded="false" aria-controls="emx-drawer">
			<span></span><span></span><span></span>
		</button>
	</div>
</header>

<aside class="mobile-drawer" id="emx-drawer" aria-label="Menú móvil" data-en-attr="aria-label=Mobile menu">
	<div class="lang-toggle" role="group" aria-label="Language">
		<button type="button" data-lang-btn="es" class="is-active" aria-pressed="true">ES</button>
		<button type="button" data-lang-btn="en" aria-pressed="false">EN</button>
	</div>
	<ul>
		<?php foreach ( $nav_items as $item ) : ?>
			<li><a href="<?php echo esc_url( $item['url'] ); ?>" data-en="<?php echo esc_attr( $item['en'] ); ?>"><?php echo esc_html( $item['label'] ); ?></a></li>
		<?php endforeach; ?>
	</ul>
	<a class="btn btn-primary" href="<?php echo esc_url( home_url( '/contacto/' ) ); ?>" data-en="Get started">Comience hoy</a>
</aside>
