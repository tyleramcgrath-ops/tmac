<?php
/**
 * Header.
 *
 * @package EnVueMex_Premium
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div class="fleet-ticker" aria-label="Indicadores de operación">
	<div class="ticker-inner">
		<span class="ticker-live"><i></i> <span data-i18n-es="En vivo" data-i18n-en="Live">En vivo</span></span>
		<span><span data-i18n-es="Unidades monitoreadas" data-i18n-en="Monitored vehicles">Unidades monitoreadas</span> <strong id="metricUnits">1,284</strong></span>
		<span><span data-i18n-es="Señal promedio" data-i18n-en="Average signal">Señal promedio</span> <strong>98.7%</strong></span>
		<span><span data-i18n-es="Alertas resueltas hoy" data-i18n-en="Alerts resolved today">Alertas resueltas hoy</span> <strong id="metricAlerts">47</strong></span>
		<span><span data-i18n-es="Soporte en México" data-i18n-en="Support in Mexico">Soporte en México</span> <strong>24/7</strong></span>
	</div>
</div>
<header class="site-header">
	<div class="nav-shell">
		<a class="site-brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="EnVueMex Solutions">
			<img src="<?php echo esc_url( envuemex_image( 'envuemex-logo.webp' ) ); ?>" alt="EnVueMex Solutions">
		</a>
		<nav class="primary-nav" aria-label="<?php esc_attr_e( 'Primary navigation', 'envuemex-premium' ); ?>">
			<ul class="menu">
				<li class="has-menu"><a href="<?php echo esc_url( envuemex_page_url( 'servicios' ) ); ?>" data-i18n-es="Soluciones" data-i18n-en="Solutions">Soluciones</a>
					<div class="dropdown">
						<?php foreach ( envuemex_solution_links() as $slug => $solution ) : ?>
							<a href="<?php echo esc_url( envuemex_page_url( $slug ) ); ?>"><strong><?php echo esc_html( $solution['title'] ); ?></strong><small><?php echo esc_html( $solution['text'] ); ?></small></a>
						<?php endforeach; ?>
					</div>
				</li>
				<li><a href="<?php echo esc_url( envuemex_page_url( 'soluciones-de-rastreo-gps' ) ); ?>">GPS</a></li>
				<li><a href="<?php echo esc_url( envuemex_page_url( 'dash-cams' ) ); ?>">Dash Cams</a></li>
				<li><a href="<?php echo esc_url( envuemex_page_url( 'rastreadores-de-activos-no-vehiculares' ) ); ?>" data-i18n-es="Activos" data-i18n-en="Assets">Activos</a></li>
				<li class="has-menu"><a href="<?php echo esc_url( envuemex_page_url( 'transporte-y-logistica' ) ); ?>" data-i18n-es="Sectores" data-i18n-en="Industries">Sectores</a>
					<div class="dropdown short">
						<a href="<?php echo esc_url( envuemex_page_url( 'transporte-y-logistica' ) ); ?>"><strong data-i18n-es="Transporte y logística" data-i18n-en="Transportation and logistics">Transporte y logística</strong><small data-i18n-es="Rutas, cumplimiento y seguridad." data-i18n-en="Routes, compliance and safety.">Rutas, cumplimiento y seguridad.</small></a>
						<a href="<?php echo esc_url( envuemex_page_url( 'construccion-y-equipo' ) ); ?>"><strong data-i18n-es="Construcción y equipo" data-i18n-en="Construction and equipment">Construcción y equipo</strong><small data-i18n-es="Maquinaria, patios y activos críticos." data-i18n-en="Machinery, yards and critical assets.">Maquinaria, patios y activos críticos.</small></a>
						<a href="<?php echo esc_url( envuemex_page_url( 'servicios-de-campo' ) ); ?>"><strong data-i18n-es="Servicios de campo" data-i18n-en="Field services">Servicios de campo</strong><small data-i18n-es="Técnicos, unidades y evidencia." data-i18n-en="Technicians, vehicles and evidence.">Técnicos, unidades y evidencia.</small></a>
						<a href="<?php echo esc_url( envuemex_page_url( 'distribucion-comercial' ) ); ?>"><strong data-i18n-es="Distribución comercial" data-i18n-en="Commercial distribution">Distribución comercial</strong><small data-i18n-es="Última milla y entregas visibles." data-i18n-en="Last-mile and visible deliveries.">Última milla y entregas visibles.</small></a>
					</div>
				</li>
				<li><a href="<?php echo esc_url( envuemex_page_url( 'acerca-de-nosotros' ) ); ?>" data-i18n-es="Nosotros" data-i18n-en="About">Nosotros</a></li>
				<li class="has-menu"><a href="<?php echo esc_url( envuemex_page_url( 'blog' ) ); ?>" data-i18n-es="Recursos" data-i18n-en="Resources">Recursos</a>
					<div class="dropdown short">
						<a href="<?php echo esc_url( envuemex_page_url( 'blog' ) ); ?>"><strong>Blog</strong><small data-i18n-es="Noticias y estrategia de flota." data-i18n-en="Fleet news and strategy.">Noticias y estrategia de flota.</small></a>
						<a href="<?php echo esc_url( envuemex_page_url( 'corporate-faq' ) ); ?>"><strong data-i18n-es="Preguntas frecuentes" data-i18n-en="FAQ">Preguntas frecuentes</strong><small data-i18n-es="Respuestas sobre la plataforma." data-i18n-en="Answers about the platform.">Respuestas sobre la plataforma.</small></a>
						<a href="<?php echo esc_url( envuemex_page_url( 'calendario-de-eventos' ) ); ?>"><strong data-i18n-es="Eventos" data-i18n-en="Events">Eventos</strong><small data-i18n-es="Encuentre al equipo EnVueMex." data-i18n-en="Meet the EnVueMex team.">Encuentre al equipo EnVueMex.</small></a>
					</div>
				</li>
			</ul>
		</nav>
		<div class="header-actions">
			<a class="header-phone" href="tel:<?php echo esc_attr( envuemex_phone_tel() ); ?>"><?php echo esc_html( envuemex_phone() ); ?></a>
			<a class="button button-primary" href="<?php echo esc_url( envuemex_page_url( 'contacto' ) ); ?>" data-i18n-es="Solicitar demo" data-i18n-en="Request demo">Solicitar demo</a>
			<button class="mobile-toggle" id="mobileToggle" aria-controls="mobileMenu" aria-expanded="false"><span></span><span></span></button>
		</div>
	</div>
	<div class="mobile-menu" id="mobileMenu" hidden>
		<?php envuemex_menu_fallback(); ?>
		<a class="button button-primary" href="<?php echo esc_url( envuemex_page_url( 'contacto' ) ); ?>" data-i18n-es="Solicitar demo" data-i18n-en="Request demo">Solicitar demo</a>
	</div>
</header>
