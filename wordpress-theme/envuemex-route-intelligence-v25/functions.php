<?php
/**
 * Theme foundation for EnVueMex Route Intelligence.
 *
 * @package EnVueMex_Premium
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ENVUEMEX_PREMIUM_VERSION', '2.5.1' );

function envuemex_document_title_parts( $title ) {
	if ( is_front_page() ) {
		$title['title'] = 'EnVueMex Solutions | Telemática para flotas en México';
		return $title;
	}
	if ( is_home() ) {
		$title['title'] = 'Blog | EnVueMex Solutions';
		unset( $title['site'] );
		return $title;
	}
	if ( is_page() ) {
		$slug = get_post_field( 'post_name', get_queried_object_id() );
		$titles = array(
			'servicios' => 'Servicios de gestión de flotas | EnVueMex Solutions',
			'soluciones-de-rastreo-gps' => 'Soluciones de rastreo GPS | EnVueMex Solutions',
			'dash-cams' => 'Dash Cams para flotas | EnVueMex Solutions',
			'rastreadores-de-activos-no-vehiculares' => 'Rastreadores de activos no vehiculares | EnVueMex Solutions',
			'acerca-de-nosotros' => 'Acerca de EnVueMex Solutions',
			'corporate-faq' => 'Preguntas frecuentes | EnVueMex Solutions',
			'calendario-de-eventos' => 'Calendario de eventos | EnVueMex Solutions',
			'blog' => 'Blog | EnVueMex Solutions',
			'contacto' => 'Contacto | EnVueMex Solutions',
			'privacy-policy' => 'Política de privacidad | EnVueMex Solutions',
			'terms-and-conditions' => 'Términos y condiciones | EnVueMex Solutions',
			'transporte-y-logistica' => 'Transporte y logística | EnVueMex Solutions',
			'construccion-y-equipo' => 'Construcción y equipo | EnVueMex Solutions',
			'servicios-de-campo' => 'Servicios de campo | EnVueMex Solutions',
			'distribucion-comercial' => 'Distribución comercial | EnVueMex Solutions',
		);
		if ( isset( $titles[ $slug ] ) ) {
			$title['title'] = $titles[ $slug ];
			unset( $title['site'] );
		}
	}
	return $title;
}
add_filter( 'document_title_parts', 'envuemex_document_title_parts', 20 );

function envuemex_excerpt_more() {
	return '...';
}
add_filter( 'excerpt_more', 'envuemex_excerpt_more' );

function envuemex_translate_interface_text( $translated, $text ) {
	$map = array(
		'Continue reading' => 'Continuar leyendo',
		'Month' => 'Mes',
		'Year' => 'Año',
		'Calendar' => 'Calendario',
		'All Calendars' => 'Todos los calendarios',
		'No Calendars' => 'Sin calendarios',
		'My Calendar' => 'Mi calendario',
	);
	return $map[ $text ] ?? $translated;
}
add_filter( 'gettext', 'envuemex_translate_interface_text', 20, 2 );

function envuemex_premium_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'custom-logo' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'align-wide' );
	add_theme_support( 'responsive-embeds' );
	register_nav_menus(
		array(
			'primary' => __( 'Primary navigation', 'envuemex-premium' ),
			'footer'  => __( 'Footer navigation', 'envuemex-premium' ),
		)
	);
}
add_action( 'after_setup_theme', 'envuemex_premium_setup' );

function envuemex_premium_assets() {
	wp_enqueue_style(
		'envuemex-fonts',
		'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap',
		array(),
		null
	);
	wp_enqueue_style(
		'envuemex-premium',
		get_template_directory_uri() . '/assets/css/envuemex.css',
		array( 'envuemex-fonts' ),
		ENVUEMEX_PREMIUM_VERSION
	);
	wp_enqueue_script(
		'envuemex-premium',
		get_template_directory_uri() . '/assets/js/envuemex.js',
		array(),
		ENVUEMEX_PREMIUM_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'envuemex_premium_assets' );

function envuemex_image( $file ) {
	return get_template_directory_uri() . '/assets/images/' . ltrim( $file, '/' );
}

function envuemex_page_url( $slug ) {
	$page = get_page_by_path( $slug );
	return $page ? get_permalink( $page ) : home_url( '/' . trim( $slug, '/' ) . '/' );
}

function envuemex_navigation_pages() {
	return array(
		'servicios'                              => __( 'Servicios', 'envuemex-premium' ),
		'soluciones-de-rastreo-gps'             => __( 'GPS', 'envuemex-premium' ),
		'dash-cams'                              => __( 'Dash Cams', 'envuemex-premium' ),
		'rastreadores-de-activos-no-vehiculares' => __( 'Activos', 'envuemex-premium' ),
		'acerca-de-nosotros'                    => __( 'Nosotros', 'envuemex-premium' ),
		'blog'                                   => __( 'Blog', 'envuemex-premium' ),
		'contacto'                               => __( 'Contacto', 'envuemex-premium' ),
		'transporte-y-logistica'                 => __( 'Transporte', 'envuemex-premium' ),
		'construccion-y-equipo'                  => __( 'Construcción', 'envuemex-premium' ),
		'servicios-de-campo'                     => __( 'Campo', 'envuemex-premium' ),
		'distribucion-comercial'                 => __( 'Distribución', 'envuemex-premium' ),
	);
}

function envuemex_solution_links() {
	return array(
		'soluciones-de-rastreo-gps'             => array( 'title' => 'Rastreo GPS', 'text' => 'Ubicación, rutas y desempeño operativo en una vista accionable.' ),
		'dash-cams'                              => array( 'title' => 'Cámaras de tablero', 'text' => 'Video y contexto para proteger conductores y reducir riesgo.' ),
		'rastreadores-de-activos-no-vehiculares' => array( 'title' => 'Activos no vehiculares', 'text' => 'Seguimiento para remolques, equipos, herramientas y maquinaria.' ),
		'servicios'                              => array( 'title' => 'Servicios de flota', 'text' => 'Implementación, análisis y soporte continuo con expertos locales.' ),
	);
}

function envuemex_page_hero( $slug = '' ) {
	$heroes = array(
		'servicios'                              => array( 'label' => 'Servicios', 'title' => 'Una operación conectada, respaldada por expertos.', 'intro' => 'Implementación, soporte y estrategia para convertir tecnología de flota en decisiones diarias.', 'image' => 'page-about.jpg' ),
		'soluciones-de-rastreo-gps'             => array( 'label' => 'Rastreo GPS', 'title' => 'Cada unidad visible. Cada ruta bajo control.', 'intro' => 'Ubicación, recorridos, alertas y reportes para operar con menos incertidumbre.', 'image' => 'page-gps.jpg' ),
		'dash-cams'                              => array( 'label' => 'Seguridad por video', 'title' => 'Evidencia que protege a sus conductores.', 'intro' => 'Video, contexto y capacitación preventiva para reducir riesgo en carretera y responder con hechos.', 'image' => 'page-dash-cams.jpg' ),
		'rastreadores-de-activos-no-vehiculares' => array( 'label' => 'Activos', 'title' => 'Rastree los activos que mantienen su negocio en movimiento.', 'intro' => 'Visibilidad para remolques, maquinaria, contenedores, equipos y activos críticos.', 'image' => 'page-assets.jpg' ),
		'acerca-de-nosotros'                    => array( 'label' => 'EnVueMex Solutions', 'title' => 'Tecnología global. Acompañamiento local.', 'intro' => 'Un equipo enfocado en que las flotas mexicanas adopten telemática con claridad y soporte real.', 'image' => 'page-about.jpg' ),
		'corporate-faq'                         => array( 'label' => 'Preguntas frecuentes', 'title' => 'Respuestas para tomar una decisión informada.', 'intro' => 'Lo esencial sobre rastreo, cámaras, activos, implementación y soporte.', 'image' => 'hero-control-tower.jpg' ),
		'contacto'                               => array( 'label' => 'Contacto', 'title' => 'Conectemos su flota con el futuro.', 'intro' => 'Cuéntenos cuántas unidades opera, qué necesita controlar y dónde quiere mejorar.', 'image' => 'hero-fleet-journal.jpg' ),
		'blog'                                   => array( 'label' => 'Recursos', 'title' => 'Ideas y estrategias para flotas en México.', 'intro' => 'Contenido para operar con más visibilidad, seguridad y rentabilidad.', 'image' => 'hero-route-intelligence.jpg' ),
		'transporte-y-logistica'                 => array( 'label' => 'Sector', 'title' => 'Transporte y logística con rutas más inteligentes.', 'intro' => 'Visibilidad operativa para flotas que viven del cumplimiento, la seguridad y la puntualidad.', 'image' => 'hero-route-intelligence.jpg' ),
		'construccion-y-equipo'                  => array( 'label' => 'Sector', 'title' => 'Construcción y equipo bajo control.', 'intro' => 'Rastree maquinaria, camiones y activos de alto valor en patios, obras y traslados.', 'image' => 'page-assets.jpg' ),
		'servicios-de-campo'                     => array( 'label' => 'Sector', 'title' => 'Equipos de campo más puntuales y productivos.', 'intro' => 'Coordine técnicos, unidades y evidencia de servicio desde una operación conectada.', 'image' => 'page-gps.jpg' ),
		'distribucion-comercial'                 => array( 'label' => 'Sector', 'title' => 'Distribución comercial con entregas visibles.', 'intro' => 'Controle rutas, tiempos, incidentes y servicio al cliente en la última milla.', 'image' => 'page-dash-cams.jpg' ),
		'calendario-de-eventos'                 => array( 'label' => 'Eventos', 'title' => 'Calendario de eventos', 'intro' => 'Demostraciones, sesiones informativas y próximos encuentros de EnVueMex.', 'image' => 'hero-control-tower.jpg' ),
		'privacy-policy'                        => array( 'label' => 'Legal', 'title' => 'Política de privacidad', 'intro' => 'Información sobre recopilación, uso y protección de datos.', 'image' => 'hero-route-intelligence.jpg' ),
		'terms-and-conditions'                  => array( 'label' => 'Legal', 'title' => 'Términos y condiciones', 'intro' => 'Reglas generales de uso del sitio web de EnVueMex Solutions.', 'image' => 'hero-route-intelligence.jpg' ),
	);
	return isset( $heroes[ $slug ] ) ? $heroes[ $slug ] : array( 'label' => 'EnVueMex', 'title' => get_the_title(), 'intro' => 'Soluciones conectadas para flotas comerciales en México.', 'image' => 'hero-route-intelligence.jpg' );
}

function envuemex_lang_text( $es, $en, $tag = 'span', $class = '' ) {
	printf(
		'<%1$s%2$s data-i18n-es="%3$s" data-i18n-en="%4$s">%5$s</%1$s>',
		tag_escape( $tag ),
		$class ? ' class="' . esc_attr( $class ) . '"' : '',
		esc_attr( $es ),
		esc_attr( $en ),
		esc_html( $es )
	);
}

function envuemex_rich_page_data( $slug ) {
	$faq = array(
		array( '¿Cuánto tarda una implementación?', 'La mayoría de los despliegues empiezan con diagnóstico, instalación por etapas y capacitación operativa para no frenar la flota.', 'How long does implementation take?', 'Most rollouts begin with assessment, phased installation and operations training so the fleet does not stop.' ),
		array( '¿Funciona para flotas mixtas?', 'Sí. Puede combinar unidades, remolques, equipos y activos no vehiculares dentro de una estrategia conectada.', 'Does it work for mixed fleets?', 'Yes. It can combine vehicles, trailers, equipment and non-vehicle assets in one connected strategy.' ),
		array( '¿El equipo recibe soporte local?', 'Sí. EnVueMex acompaña configuración, adopción, reportes y mejora continua para operaciones en México.', 'Is local support included?', 'Yes. EnVueMex supports configuration, adoption, reporting and continuous improvement for operations in Mexico.' ),
	);
	$pages = array(
		'servicios' => array(
			'kicker' => 'Servicios de flota',
			'title' => 'Tecnología implementada con disciplina operativa.',
			'intro' => 'EnVueMex ayuda a que la telemática no se quede como un tablero bonito. El trabajo empieza con entender la operación, las rutas, los activos críticos, los riesgos y la forma en que sus equipos toman decisiones. Desde ahí se configura una plataforma que sirve a supervisores, operadores, mantenimiento, seguridad y dirección.',
			'en_title' => 'Technology implemented with operational discipline.',
			'en_intro' => 'EnVueMex helps telematics become more than a dashboard. The work starts with understanding operations, routes, critical assets, risk and how teams make decisions. From there, the platform is configured for supervisors, drivers, maintenance, safety and leadership.',
			'features' => array( 'Diagnóstico de flota', 'Instalación y configuración', 'Capacitación operativa', 'Reportes ejecutivos', 'Soporte continuo', 'Mejora de procesos' ),
			'features_en' => array( 'Fleet assessment', 'Installation and setup', 'Operations training', 'Executive reporting', 'Ongoing support', 'Process improvement' ),
			'body' => array(
				array( 'De la instalación al resultado', 'La diferencia está en convertir señales en hábitos. Alertas, reportes, video y ubicaciones se ordenan para que cada área sepa qué revisar, cuándo actuar y cómo medir avance.', 'From installation to results', 'The difference is turning signals into habits. Alerts, reports, video and locations are organized so each team knows what to review, when to act and how to measure progress.' ),
				array( 'Menos ruido, más acción', 'Una flota genera muchos datos. EnVueMex prioriza lo que impacta seguridad, puntualidad, uso de combustible, disponibilidad de activos y servicio al cliente.', 'Less noise, more action', 'A fleet produces a lot of data. EnVueMex prioritizes what affects safety, punctuality, fuel use, asset availability and customer service.' ),
			),
		),
		'soluciones-de-rastreo-gps' => array(
			'kicker' => 'Rastreo GPS',
			'title' => 'Ubicación, desempeño y rutas en una vista accionable.',
			'intro' => 'El rastreo GPS permite operar con claridad: dónde está cada unidad, qué ruta tomó, cuánto tiempo estuvo detenida y qué eventos requieren atención. Para flotas mexicanas, esa visibilidad reduce llamadas, mejora coordinación y permite defender decisiones con datos.',
			'en_title' => 'Location, performance and routes in one actionable view.',
			'en_intro' => 'GPS tracking gives operations clarity: where every vehicle is, which route it took, how long it stopped and which events need attention. For Mexican fleets, that visibility reduces calls, improves coordination and supports decisions with data.',
			'features' => array( 'Ubicación en tiempo real', 'Historial de recorridos', 'Alertas por geocerca', 'Tiempos detenidos', 'Reportes de utilización', 'Mejor coordinación' ),
			'features_en' => array( 'Real-time location', 'Route history', 'Geofence alerts', 'Idle time visibility', 'Utilization reports', 'Better coordination' ),
			'body' => array(
				array( 'Control de rutas', 'Supervisores pueden ver desviaciones, paradas no planeadas y retrasos antes de que afecten al cliente. La operación deja de depender de llamadas manuales.', 'Route control', 'Supervisors can see deviations, unplanned stops and delays before they affect customers. Operations stop relying on manual phone calls.' ),
				array( 'Decisiones con evidencia', 'Los reportes ayudan a revisar productividad, uso de unidades, cumplimiento y oportunidades de ahorro por ruta o conductor.', 'Evidence-based decisions', 'Reports help review productivity, vehicle use, compliance and savings opportunities by route or driver.' ),
			),
		),
		'dash-cams' => array(
			'kicker' => 'Dash Cams',
			'title' => 'Video que protege conductores, clientes y operación.',
			'intro' => 'Las cámaras de tablero agregan contexto donde el GPS no alcanza. Un frenado, una distracción o un incidente en ruta se entiende mejor con evidencia visual. Eso permite responder más rápido, entrenar con precisión y proteger a buenos conductores.',
			'en_title' => 'Video that protects drivers, customers and operations.',
			'en_intro' => 'Dash cams add context where GPS is not enough. A hard brake, distraction or road incident is easier to understand with video evidence. That enables faster response, precise coaching and protection for good drivers.',
			'features' => array( 'Evidencia de incidentes', 'Capacitación preventiva', 'Eventos de conducción', 'Reducción de riesgo', 'Protección al conductor', 'Cultura de seguridad' ),
			'features_en' => array( 'Incident evidence', 'Preventive coaching', 'Driving events', 'Risk reduction', 'Driver protection', 'Safety culture' ),
			'body' => array(
				array( 'De alerta a aprendizaje', 'Cada evento puede convertirse en una conversación concreta: qué pasó, por qué pasó y cómo evitar que se repita.', 'From alert to learning', 'Every event can become a concrete conversation: what happened, why it happened and how to prevent it from happening again.' ),
				array( 'Respuesta con hechos', 'Cuando existe una reclamación o duda, el video ayuda a validar condiciones de ruta, comportamiento de conducción y contexto del incidente.', 'Response with facts', 'When there is a claim or question, video helps validate road conditions, driver behavior and incident context.' ),
			),
		),
		'rastreadores-de-activos-no-vehiculares' => array(
			'kicker' => 'Activos no vehiculares',
			'title' => 'Visibilidad para los activos que no siempre tienen conductor.',
			'intro' => 'Remolques, maquinaria, herramientas, contenedores y equipos críticos también necesitan control. El rastreo de activos ayuda a saber dónde están, cómo se usan y cuándo requieren atención, incluso cuando no forman parte de una unidad tradicional.',
			'en_title' => 'Visibility for what does not always have a driver.',
			'en_intro' => 'Trailers, machinery, tools, containers and critical equipment also need control. Asset tracking helps teams know where assets are, how they are used and when they need attention, even when they are not traditional vehicles.',
			'features' => array( 'Remolques y contenedores', 'Maquinaria y equipo', 'Alertas de movimiento', 'Inventario visible', 'Mejor utilización', 'Menos pérdidas' ),
			'features_en' => array( 'Trailers and containers', 'Machinery and equipment', 'Movement alerts', 'Visible inventory', 'Better utilization', 'Less loss' ),
			'body' => array(
				array( 'Activos localizables', 'Saber dónde está cada activo reduce tiempos muertos, búsquedas internas y compras innecesarias de equipo que ya existe.', 'Findable assets', 'Knowing where each asset is reduces downtime, internal searches and unnecessary purchases of equipment that already exists.' ),
				array( 'Operación más ordenada', 'La información permite coordinar patios, obras, almacenes y rutas con menos incertidumbre.', 'More organized operations', 'The information helps coordinate yards, job sites, warehouses and routes with less uncertainty.' ),
			),
		),
		'acerca-de-nosotros' => array(
			'kicker' => 'Nosotros',
			'title' => 'Un socio tecnológico para flotas en México.',
			'intro' => 'EnVueMex combina tecnología conectada con acompañamiento humano. El objetivo no es solo instalar dispositivos, sino ayudar a que la operación adopte nuevas formas de trabajar con datos, alertas, evidencia y seguimiento.',
			'en_title' => 'A technology partner for fleets in Mexico.',
			'en_intro' => 'EnVueMex combines connected technology with human support. The goal is not only to install devices, but to help operations adopt new ways of working with data, alerts, evidence and follow-up.',
			'features' => array( 'Experiencia local', 'Socio tecnológico', 'Soporte cercano', 'Implementación ordenada', 'Enfoque en seguridad', 'Mejora continua' ),
			'features_en' => array( 'Local expertise', 'Technology partner', 'Close support', 'Organized implementation', 'Safety focus', 'Continuous improvement' ),
			'body' => array(
				array( 'Tecnología con adopción', 'La plataforma vale cuando la gente la usa. Por eso el enfoque incluye capacitación, reglas claras y seguimiento después de la instalación.', 'Technology with adoption', 'The platform matters when people use it. That is why the approach includes training, clear rules and follow-up after installation.' ),
				array( 'Hecho para operaciones reales', 'Flotas con presión diaria necesitan datos confiables, soporte claro y soluciones que se adapten a sus procesos.', 'Built for real operations', 'Fleets under daily pressure need reliable data, clear support and solutions that adapt to their processes.' ),
			),
		),
		'contacto' => array(
			'kicker' => 'Contacto',
			'title' => 'Hablemos de su flota, sus rutas y sus prioridades.',
			'intro' => 'La mejor conversación empieza con contexto: cuántas unidades opera, qué activos necesita controlar, qué incidentes quiere reducir y qué indicadores quiere mejorar. EnVueMex puede orientar la demostración alrededor de su operación real.',
			'en_title' => 'Let us talk about your fleet, routes and priorities.',
			'en_intro' => 'The best conversation starts with context: how many vehicles you operate, which assets need control, which incidents you want to reduce and which metrics you want to improve. EnVueMex can shape the demo around your real operation.',
			'features' => array( 'Diagnóstico inicial', 'Demo guiada', 'Revisión de flota', 'Plan de implementación', 'Soporte en México', 'Seguimiento ejecutivo' ),
			'features_en' => array( 'Initial assessment', 'Guided demo', 'Fleet review', 'Implementation plan', 'Support in Mexico', 'Executive follow-up' ),
			'body' => array(
				array( 'Qué preparar', 'Comparta número de unidades, zonas de operación, tipos de activos, prioridades de seguridad y retos actuales. Eso permite que la conversación sea concreta.', 'What to prepare', 'Share vehicle count, operating zones, asset types, safety priorities and current challenges. That keeps the conversation concrete.' ),
				array( 'Qué recibe', 'El equipo puede mostrar rutas, cámaras, activos, alertas y reportes con un enfoque cercano a sus procesos.', 'What you get', 'The team can show routes, cameras, assets, alerts and reports with an approach close to your processes.' ),
			),
			'longform' => false,
		),
		'corporate-faq' => array(
			'kicker' => 'FAQ',
			'title' => 'Preguntas comunes antes de conectar una flota.',
			'intro' => 'Estas respuestas ayudan a entender cómo evaluar una solución de rastreo, seguridad por video, activos e implementación para operaciones en México.',
			'en_title' => 'Common questions before connecting a fleet.',
			'en_intro' => 'These answers help explain how to evaluate tracking, video safety, asset visibility and implementation for operations in Mexico.',
			'features' => array( 'GPS', 'Dash cams', 'Activos', 'Instalación', 'Soporte', 'Reportes' ),
			'features_en' => array( 'GPS', 'Dash cams', 'Assets', 'Installation', 'Support', 'Reports' ),
			'body' => array(
				array( 'Cómo elegir', 'Una buena plataforma debe combinar datos confiables, facilidad de adopción, soporte claro y reportes útiles para dirección.', 'How to choose', 'A strong platform should combine reliable data, easy adoption, clear support and useful executive reporting.' ),
				array( 'Cómo medir valor', 'El valor aparece en seguridad, productividad, uso de activos, menos tiempo perdido y mejor servicio al cliente.', 'How to measure value', 'Value shows up in safety, productivity, asset use, less wasted time and better customer service.' ),
			),
			'longform' => false,
		),
		'calendario-de-eventos' => array(
			'kicker' => 'Eventos',
			'title' => 'Calendario de eventos y demostraciones.',
			'intro' => 'Conozca próximos eventos, sesiones de demostración y oportunidades para hablar con el equipo de EnVueMex sobre telemática, rastreo GPS, cámaras y gestión de activos.',
			'en_title' => 'Events and demo calendar.',
			'en_intro' => 'Find upcoming events, demo sessions and opportunities to talk with EnVueMex about telematics, GPS tracking, cameras and asset management.',
			'features' => array( 'Demostraciones', 'Webinars', 'Ferias', 'Sesiones técnicas', 'Actualizaciones', 'Contacto directo' ),
			'features_en' => array( 'Demos', 'Webinars', 'Trade shows', 'Technical sessions', 'Updates', 'Direct contact' ),
			'body' => array(
				array( 'No hay eventos programados por el momento.', 'Vuelva pronto para conocer nuestros próximos eventos, demostraciones y sesiones informativas para flotas comerciales en México.', 'No events are scheduled at this time.', 'Check back soon for upcoming events, demos and information sessions for commercial fleets in Mexico.' ),
				array( 'Solicite una sesión personalizada.', 'Si necesita revisar una solución antes del próximo evento, nuestro equipo puede preparar una demostración guiada para sus unidades, rutas y activos.', 'Request a private session.', 'If you need to review a solution before the next event, our team can prepare a guided demo for your vehicles, routes and assets.' ),
			),
			'faq' => array(),
			'longform' => false,
		),
		'privacy-policy' => array(
			'kicker' => 'Privacidad',
			'title' => 'Política de privacidad.',
			'intro' => 'Esta política explica cómo EnVueMex Solutions recopila, utiliza y protege la información enviada a través del sitio web y los formularios de contacto.',
			'en_title' => 'Privacy policy.',
			'en_intro' => 'This policy explains how EnVueMex Solutions collects, uses and protects information submitted through the website and contact forms.',
			'features' => array( 'Datos de contacto', 'Uso del sitio', 'Seguridad', 'Comunicación', 'Derechos', 'Contacto' ),
			'features_en' => array( 'Contact data', 'Site use', 'Security', 'Communication', 'Rights', 'Contact' ),
			'body' => array(
				array( 'Recopilación y uso de la información', 'EnVueMex Solutions puede recopilar nombre, empresa, teléfono, correo electrónico, mensaje, datos técnicos básicos del navegador e información necesaria para responder solicitudes comerciales, preparar demostraciones, mejorar el sitio y dar seguimiento a consultas.', 'Collection and use of information', 'EnVueMex Solutions may collect name, company, phone, email, message, basic browser data and information needed to respond to sales requests, prepare demos, improve the site and follow up on inquiries.' ),
				array( 'Protección de datos', 'La información se utiliza para fines relacionados con EnVueMex Solutions. No vendemos información personal. Si el sitio utiliza herramientas de análisis, formularios o servicios de terceros, esos proveedores solo deben procesar datos necesarios para operar sus servicios.', 'Data protection', 'Information is used for purposes related to EnVueMex Solutions. We do not sell personal information. If the site uses analytics, forms or third-party services, those providers should process only data needed to operate their services.' ),
				array( 'Entidad legal', 'Si EnVue Telematics, LLC opera servicios relacionados con EnVueMex Solutions, esa relación debe confirmarse legalmente antes de publicar una versión final. Esta plantilla evita afirmar una entidad legal no confirmada.', 'Legal entity', 'If EnVue Telematics, LLC operates services related to EnVueMex Solutions, that relationship should be legally confirmed before publishing a final version. This template avoids asserting an unconfirmed legal entity.' ),
			),
			'faq' => array(),
			'longform' => false,
		),
		'terms-and-conditions' => array(
			'kicker' => 'Términos',
			'title' => 'Términos y condiciones.',
			'intro' => 'Estos términos establecen reglas generales de uso del sitio web de EnVueMex Solutions. Revise la versión legal final antes de publicar en producción.',
			'en_title' => 'Terms and conditions.',
			'en_intro' => 'These terms set general rules for using the EnVueMex Solutions website. Review the final legal version before publishing to production.',
			'features' => array( 'Uso permitido', 'Contenido', 'Marcas', 'Responsabilidad', 'Cambios', 'Contacto' ),
			'features_en' => array( 'Permitted use', 'Content', 'Trademarks', 'Liability', 'Changes', 'Contact' ),
			'body' => array(
				array( 'Uso permitido', 'El sitio debe utilizarse únicamente con fines legales. No se permite usarlo para ningún propósito ilícito, interferir con su operación, intentar acceder sin autorización o afectar el uso de cualquier otra persona.', 'Permitted use', 'The site must be used only for lawful purposes. It may not be used for any unlawful purpose, to interfere with operation, to attempt unauthorized access or to affect any other person’s use.' ),
				array( 'Contenido y marcas', 'El contenido del sitio se proporciona para información general sobre soluciones de flota. Las marcas, logotipos, textos, imágenes y materiales de EnVueMex Solutions no deben copiarse o reutilizarse sin autorización.', 'Content and trademarks', 'Site content is provided for general information about fleet solutions. EnVueMex Solutions trademarks, logos, text, images and materials may not be copied or reused without permission.' ),
				array( 'Revisión legal pendiente', 'La fecha, entidad legal, jurisdicción, límites de responsabilidad y redacción final deben ser confirmados por el equipo legal antes del lanzamiento. Esta versión corrige formato, idioma y gramática para evitar contenido roto en la página.', 'Pending legal review', 'The date, legal entity, jurisdiction, liability limits and final language should be confirmed by legal counsel before launch. This version fixes formatting, language and grammar to avoid broken page content.' ),
			),
			'faq' => array(),
			'longform' => false,
		),
	);
	$sector = array(
		'transporte-y-logistica' => array( 'Transporte y logística', 'Cumplimiento de rutas, seguridad del conductor y costos bajo control para operaciones de carga, distribución y transporte regional.', 'Transportation and logistics', 'Route compliance, driver safety and controlled costs for freight, distribution and regional transportation operations.' ),
		'construccion-y-equipo' => array( 'Construcción y equipo', 'Visibilidad para maquinaria, camiones y activos que se mueven entre patios, obras y proveedores.', 'Construction and equipment', 'Visibility for machinery, trucks and assets moving between yards, job sites and suppliers.' ),
		'servicios-de-campo' => array( 'Servicios de campo', 'Coordinación de técnicos, unidades y evidencia de servicio para responder más rápido y con mayor control.', 'Field services', 'Coordination for technicians, vehicles and service evidence to respond faster and with more control.' ),
		'distribucion-comercial' => array( 'Distribución comercial', 'Rutas, entregas y servicio al cliente con más visibilidad para equipos de última milla.', 'Commercial distribution', 'Routes, deliveries and customer service with more visibility for last-mile teams.' ),
	);
	if ( isset( $sector[ $slug ] ) ) {
		$item = $sector[ $slug ];
		return array(
			'kicker' => 'Sectores',
			'title' => $item[0],
			'intro' => $item[1],
			'en_title' => $item[2],
			'en_intro' => $item[3],
			'features' => array( 'Visibilidad diaria', 'Alertas operativas', 'Evidencia de ruta', 'Mejor uso de activos', 'Reportes para dirección', 'Soporte local' ),
			'features_en' => array( 'Daily visibility', 'Operational alerts', 'Route evidence', 'Better asset use', 'Leadership reports', 'Local support' ),
			'body' => array(
				array( 'Diseñado para el ritmo de la operación', 'Cada sector tiene prioridades distintas, pero todos necesitan saber dónde están sus recursos, qué requiere atención y cómo mejorar el siguiente recorrido.', 'Designed for the pace of operations', 'Every sector has different priorities, but all need to know where resources are, what needs attention and how to improve the next route.' ),
				array( 'Datos que llegan a la acción', 'La tecnología ayuda cuando los reportes, alertas y evidencias se convierten en decisiones de supervisión, mantenimiento y servicio.', 'Data that leads to action', 'Technology helps when reports, alerts and evidence become decisions for supervision, maintenance and service.' ),
			),
		);
	}
	if ( isset( $pages[ $slug ] ) ) {
		if ( ! array_key_exists( 'faq', $pages[ $slug ] ) ) {
			$pages[ $slug ]['faq'] = $faq;
		}
		return $pages[ $slug ];
	}
	return null;
}

function envuemex_longform_profile( $slug ) {
	$profiles = array(
		'servicios' => array(
			'keyword' => 'servicios de gestión de flotas en México',
			'theme'   => 'servicios conectados de telemática, rastreo GPS, cámaras de tablero, rastreo de activos, análisis operativo y soporte continuo',
			'audience'=> 'directores de operaciones, gerentes de flota, equipos de seguridad, mantenimiento, logística y dirección general',
			'problem' => 'tecnología instalada sin adopción, reportes que nadie revisa, alertas mal configuradas, costos altos de operación y falta de una sola fuente de verdad para la flota',
			'outcome' => 'una operación medible, con datos claros, responsabilidades definidas y una plataforma que ayuda a reducir riesgo, mejorar servicio y tomar mejores decisiones todos los días',
			'cta'     => 'solicitar una evaluación de servicios para revisar unidades, activos, rutas, riesgos y prioridades de implementación',
		),
		'soluciones-de-rastreo-gps' => array(
			'keyword' => 'rastreo GPS para flotas en México',
			'theme'   => 'ubicación en tiempo real, historial de recorridos, geocercas, diagnósticos, alertas, reportes y telemática para unidades comerciales',
			'audience'=> 'empresas de transporte, distribución, servicios de campo, construcción y cualquier negocio que necesita saber dónde está cada unidad',
			'problem' => 'llamadas constantes para ubicar vehículos, rutas no autorizadas, tiempos improductivos, poca visibilidad en zonas de riesgo y decisiones basadas en información incompleta',
			'outcome' => 'control de rutas, reacción más rápida, mejor utilización de unidades, menos incertidumbre operativa y evidencia para revisar desempeño por ruta, vehículo o conductor',
			'cta'     => 'agendar una demostración de rastreo GPS enfocada en sus rutas reales y sus indicadores de operación',
		),
		'dash-cams' => array(
			'keyword' => 'dash cams para flotas en México',
			'theme'   => 'cámaras de tablero, video en ruta, video de cabina, inteligencia artificial, eventos de conducción, evidencia y capacitación preventiva',
			'audience'=> 'flotas que necesitan proteger conductores, reducir incidentes, documentar reclamaciones y crear una cultura de seguridad con datos visuales',
			'problem' => 'accidentes difíciles de reconstruir, reclamos sin evidencia, hábitos de conducción inseguros, costos de seguro y conversaciones de capacitación demasiado generales',
			'outcome' => 'mejor evidencia, respuesta más rápida ante incidentes, capacitación específica y una defensa más clara para conductores que operan correctamente',
			'cta'     => 'solicitar una evaluación de cámaras de tablero para definir qué combinación de video y alertas necesita su flota',
		),
		'rastreadores-de-activos-no-vehiculares' => array(
			'keyword' => 'rastreadores de activos no vehiculares en México',
			'theme'   => 'rastreo de remolques, contenedores, maquinaria, generadores, compresores, herramientas, equipo pesado y activos energizados o no energizados',
			'audience'=> 'empresas que mueven equipo de alto valor entre patios, obras, almacenes, rutas, clientes y proveedores',
			'problem' => 'activos difíciles de localizar, baja utilización, pérdidas, compras innecesarias de equipo, mantenimiento reactivo y falta de control sobre recursos que no tienen conductor asignado',
			'outcome' => 'inventario visible, mejor utilización, menos tiempo perdido buscando equipo, alertas de movimiento y decisiones más inteligentes sobre despliegue de activos',
			'cta'     => 'pedir una revisión de activos para priorizar qué equipos deben rastrearse primero y cómo medir el retorno',
		),
		'acerca-de-nosotros' => array(
			'keyword' => 'soluciones de telemática para flotas en México',
			'theme'   => 'experiencia en transporte, servicio al cliente, relaciones de largo plazo, selección de tecnología, soporte local y adopción operativa',
			'audience'=> 'empresas que buscan un socio que ayude a escoger, implementar y aprovechar soluciones telemáticas en México',
			'problem' => 'proveedores que solo venden dispositivos, falta de acompañamiento después de la compra, herramientas subutilizadas y poca claridad sobre cómo convertir datos en resultados',
			'outcome' => 'una relación de soporte continuo, mejores decisiones de tecnología, capacitación más clara y una operación que usa la telemática para seguridad, cumplimiento, rutas y activos',
			'cta'     => 'conocer al equipo y conversar sobre el tipo de soporte que su flota necesita antes y después de implementar',
		),
		'contacto' => array(
			'keyword' => 'evaluar soluciones de rastreo GPS y telemática en México',
			'theme'   => 'evaluación de flota, demostración guiada, definición de prioridades, contacto comercial, soporte local y próximos pasos de implementación',
			'audience'=> 'equipos que desean comparar soluciones, cotizar dispositivos o entender cómo aplicar la telemática en sus rutas, unidades y activos',
			'problem' => 'no saber qué solución pedir, recibir demos genéricas, comparar proveedores sin criterios claros y perder tiempo en conversaciones que no aterrizan en la operación real',
			'outcome' => 'una conversación concreta sobre unidades, rutas, activos, cámaras, seguridad, indicadores, tiempos de instalación y plan de despliegue',
			'cta'     => 'enviar sus datos para que EnVueMex prepare una conversación enfocada en su flota, no en una presentación genérica',
		),
		'corporate-faq' => array(
			'keyword' => 'preguntas frecuentes sobre telemática y rastreo GPS en México',
			'theme'   => 'dudas sobre GPS, telemática, cámaras, activos, instalación, soporte, datos, reportes, seguridad y retorno de inversión',
			'audience'=> 'compradores, gerentes de flota y directores que necesitan respuestas claras antes de conectar unidades y activos',
			'problem' => 'evaluaciones incompletas, expectativas poco realistas, dudas sobre cobertura, capacitación, privacidad, costo, integración y medición de resultados',
			'outcome' => 'criterios más claros para elegir plataforma, preparar implementación, medir valor y comparar soluciones con base operativa',
			'cta'     => 'usar estas respuestas como guía inicial y solicitar una demostración cuando quiera revisar su caso específico',
		),
		'transporte-y-logistica' => array(
			'keyword' => 'telemática para transporte y logística en México',
			'theme'   => 'rutas de carga, distribución regional, puntualidad, seguridad del conductor, evidencias de recorrido, geocercas y control de costos',
			'audience'=> 'transportistas, operadores logísticos, flotas de carga, distribución, última milla y empresas con rutas nacionales o regionales',
			'problem' => 'entregas tardías, desviaciones, robo de carga, poca trazabilidad, costos de combustible, mantenimiento reactivo y presión constante sobre márgenes',
			'outcome' => 'rutas más visibles, mejor planeación, reacción temprana, documentación de eventos, control de utilización y reportes útiles para dirección y operaciones',
			'cta'     => 'revisar sus rutas principales y construir un plan de visibilidad para transporte y logística',
		),
		'construccion-y-equipo' => array(
			'keyword' => 'telemática para construcción y equipo pesado en México',
			'theme'   => 'maquinaria, equipo pesado, camiones de obra, activos en patios, obras remotas, utilización, horas motor, mantenimiento y seguridad',
			'audience'=> 'constructoras, contratistas, arrendadoras de equipo y empresas con maquinaria que se mueve entre proyectos',
			'problem' => 'equipos sin ubicar, baja utilización, traslados no planeados, mantenimiento tardío, horas improductivas y poca visibilidad entre patios y obras',
			'outcome' => 'mejor control de maquinaria, menos tiempo detenido, inventario operativo visible, mantenimiento más oportuno y decisiones de despliegue con datos',
			'cta'     => 'identificar activos críticos de construcción y definir cómo rastrearlos por ubicación, uso y prioridad de negocio',
		),
		'servicios-de-campo' => array(
			'keyword' => 'gestión de flotas para servicios de campo en México',
			'theme'   => 'técnicos, unidades de servicio, despacho, citas, evidencia de visita, rutas, productividad y atención al cliente',
			'audience'=> 'empresas con técnicos móviles, mantenimiento, instalaciones, reparaciones, servicios públicos, seguridad, telecomunicaciones o atención en sitio',
			'problem' => 'citas incumplidas, baja visibilidad del técnico, rutas mal coordinadas, poca evidencia de servicio y dificultad para medir productividad diaria',
			'outcome' => 'mejor despacho, tiempos de respuesta más claros, evidencia de ruta, seguimiento de visitas y equipos móviles con mayor productividad',
			'cta'     => 'mapear sus rutas de servicio y revisar qué datos necesita su equipo para cumplir más citas con menos fricción',
		),
		'distribucion-comercial' => array(
			'keyword' => 'rastreo GPS para distribución comercial y última milla en México',
			'theme'   => 'rutas urbanas, entregas, ventanas de servicio, clientes, evidencia, desviaciones, paradas, seguridad y eficiencia de reparto',
			'audience'=> 'empresas de retail, alimentos, bebidas, paquetería, distribución comercial y equipos de última milla',
			'problem' => 'rutas saturadas, ventanas incumplidas, clientes sin información, paradas improductivas, incidentes urbanos y poca trazabilidad del reparto',
			'outcome' => 'entregas más visibles, mejor servicio al cliente, control de paradas, evidencia operativa y una base de datos para mejorar rutas semana a semana',
			'cta'     => 'analizar sus rutas de distribución y crear una demostración enfocada en puntualidad, servicio y costo por entrega',
		),
	);
	$default = array(
		'keyword' => 'soluciones conectadas para flotas en México',
		'theme'   => 'rastreo GPS, telemática, cámaras de tablero, activos, reportes y soporte para operaciones comerciales',
		'audience'=> 'empresas que operan vehículos, equipos y activos en México',
		'problem' => 'falta de visibilidad, costos altos, riesgo operativo y decisiones tomadas sin datos confiables',
		'outcome' => 'una operación más visible, segura, eficiente y preparada para mejorar con datos',
		'cta'     => 'solicitar una conversación con EnVueMex para revisar prioridades de flota',
	);
	return $profiles[ $slug ] ?? $default;
}

function envuemex_longform_sections( $slug ) {
	$p = envuemex_longform_profile( $slug );
	return array(
		array(
			'Cómo ayuda EnVueMex',
			sprintf( 'EnVueMex ofrece %1$s para operaciones que necesitan más que un mapa. La plataforma y el acompañamiento se orientan a %2$s, porque una flota no mejora solo por comprar dispositivos: mejora cuando la información correcta llega a la persona correcta en el momento correcto. Nuestro enfoque conecta software personalizable, rastreo de activos, seguridad, cumplimiento normativo y soporte experto para aplicar %3$s dentro de una operación real en México, con rutas, conductores, activos, mantenimiento, servicio al cliente y dirección trabajando desde datos compartidos.', $p['keyword'], $p['audience'], $p['theme'] ),
		),
		array(
			'El problema operativo que resuelve',
			sprintf( 'Muchas empresas llegan a EnVueMex porque enfrentan %s. En la práctica, esos problemas aparecen como llamadas repetidas para saber dónde está una unidad, reportes que llegan tarde, reclamos sin evidencia, activos que no se localizan, rutas que se modifican sin control o supervisores que pasan más tiempo persiguiendo información que corrigiendo la operación. Una solución conectada debe reducir esa fricción. Debe mostrar ubicación, contexto, historial y alertas útiles, pero también debe ayudar a crear reglas internas para que cada dato tenga dueño, prioridad y siguiente acción.', $p['problem'] ),
		),
		array(
			'Qué debe incluir una solución seria',
			sprintf( 'Una estrategia sólida de %1$s debe incluir hardware adecuado, instalación confiable, configuración de plataforma, capacitación, reportes y seguimiento. EnVueMex enfatiza que la telemática debe ayudar a reducir costos, incrementar eficiencia, automatizar datos, mejorar seguridad y apoyar cumplimiento. Por eso la conversación no debe empezar únicamente con precio por dispositivo. Debe empezar con preguntas operativas: qué rutas son críticas, qué activos generan más costo, qué conductas de manejo deben corregirse, qué indicadores revisa dirección y qué información necesita el cliente final para confiar en la entrega o el servicio.', $p['keyword'] ),
		),
		array(
			'Implementación para México',
			'México tiene condiciones operativas particulares: tráfico urbano intenso, largas distancias, zonas con cobertura variable, patios compartidos, riesgos de seguridad, clima exigente y operaciones que combinan unidades propias, contratistas, remolques, maquinaria y activos móviles. Por eso la implementación debe probarse en campo, no solo en escritorio. Los dispositivos deben instalarse correctamente, la cobertura debe validarse en rutas reales y las alertas deben configurarse para generar acción, no ruido. Un despliegue inteligente empieza por un grupo piloto, documenta aprendizajes y después escala por tipo de unidad, región o prioridad de negocio.',
		),
		array(
			'Indicadores que conviene medir',
			sprintf( 'El valor de %1$s se demuestra con indicadores concretos. Algunos KPI útiles son puntualidad, kilómetros recorridos, tiempo en ralentí, paradas no autorizadas, uso de activos, eventos de conducción, tiempo de respuesta, mantenimiento preventivo, recuperación de evidencia y reducción de llamadas manuales. Para dirección, estos datos deben traducirse en costo, riesgo, productividad y servicio. Para operaciones, deben convertirse en listas de acción. Para mantenimiento, deben señalar prioridades. Para seguridad, deben mostrar patrones. Cuando estos indicadores se revisan con disciplina, la flota empieza a generar %2$s.', $p['keyword'], $p['outcome'] ),
		),
		array(
			'Cómo convertir datos en hábitos',
			'La adopción es el punto donde muchas implementaciones fallan. Un tablero lleno de información no cambia la operación si nadie sabe qué revisar, qué ignorar o qué hacer cuando aparece una alerta. EnVueMex se diferencia por el servicio y la relación de largo plazo: el proveedor no solo entrega tecnología, también ayuda a sus clientes a usarla. Eso significa definir responsables, crear rutinas de revisión, explicar a los conductores por qué se mide cierta información y construir reportes que sean simples de leer. La meta es que la telemática deje de ser una herramienta aislada y se vuelva parte del ritmo diario de supervisión.',
		),
		array(
			'Preguntas que debe hacer antes de comprar',
			sprintf( 'Antes de elegir proveedor, conviene preguntar cómo se instala la solución, qué datos entrega, qué soporte existe después de la compra, cómo se capacita al equipo, qué reportes se pueden personalizar, cómo se manejan activos energizados y no energizados, cómo se protegen los datos y qué ocurre cuando una unidad opera en zonas de baja conectividad. También conviene pedir ejemplos de uso para su sector. Una flota de transporte no mide lo mismo que una constructora, un equipo de servicio de campo o una operación de distribución urbana. La tecnología debe adaptarse a %s.', $p['audience'] ),
		),
		array(
			'Próximo paso recomendado',
			sprintf( 'El siguiente paso es %s. Para que la conversación sea útil, prepare una lista de unidades, activos principales, zonas de operación, problemas actuales, prioridades de seguridad y reportes que dirección revisa actualmente. Con esa información, EnVueMex puede orientar una demostración alrededor de su operación real: qué vería el supervisor, qué recibiría mantenimiento, qué evidencia tendría seguridad, qué datos usaría dirección y cómo se mediría el retorno. La mejor solución no es la que muestra más funciones, sino la que ayuda a su equipo a decidir mejor todos los días.', $p['cta'] ),
		),
		array(
			'Qué cambia para cada equipo',
			sprintf( 'Para operaciones, %1$s debe reducir la incertidumbre diaria. Para seguridad, debe documentar eventos y patrones antes de que se conviertan en pérdidas mayores. Para mantenimiento, debe señalar unidades o activos que requieren atención antes de una falla costosa. Para servicio al cliente, debe ofrecer respuestas más confiables sobre tiempos, recorridos y cumplimiento. Para dirección, debe resumir costo, riesgo y productividad sin obligar a revisar cientos de registros. Esta visión por rol es importante porque las operaciones descritas en %2$s no compran tecnología por la misma razón; cada área necesita un beneficio claro para adoptar el sistema.', $p['keyword'], $p['audience'] ),
		),
		array(
			'Seguridad, evidencia y cumplimiento',
			'La seguridad no depende solo de reaccionar cuando ocurre un accidente. Depende de identificar señales tempranas, documentar eventos y crear conversaciones de mejora con conductores, técnicos o responsables de activos. Una solución conectada puede apoyar auditorías internas, revisión de rutas, investigación de incidentes, protección contra reclamaciones incorrectas y cumplimiento de políticas operativas. El objetivo no es vigilar por vigilar; el objetivo es reducir exposición, proteger personas, cuidar activos y demostrar con datos qué ocurrió antes, durante y después de un evento relevante.',
		),
		array(
			'Mantenimiento y disponibilidad',
			sprintf( 'Una flota rentable necesita unidades y activos disponibles. Cuando %1$s se conecta con hábitos de revisión, mantenimiento deja de trabajar únicamente por urgencias. Los datos ayudan a detectar uso excesivo, tiempos improductivos, patrones de ruta, horas de operación y señales que pueden indicar desgaste. Esto permite priorizar recursos, planear servicios, evitar interrupciones y extender la vida útil de vehículos o equipos. En una operación mexicana con distancias largas, tráfico pesado y condiciones variables, esa anticipación puede marcar la diferencia entre cumplir una entrega o detener una ruta completa.', $p['keyword'] ),
		),
		array(
			'Retorno de inversión',
			'El retorno no aparece en una sola línea. Puede aparecer como menos llamadas de seguimiento, menos tiempo buscando activos, reducción de paradas no autorizadas, mejor uso de unidades, disminución de incidentes, menos reclamaciones discutidas sin evidencia, mantenimiento más ordenado y mejor planeación de rutas. Para medirlo, conviene establecer una línea base antes de implementar: costos actuales, frecuencia de incidentes, tiempos de respuesta, productividad por unidad, consumo, disponibilidad y horas dedicadas a tareas manuales. Después, los reportes deben mostrar si la operación realmente cambió.',
		),
		array(
			'Errores comunes al implementar',
			'Uno de los errores más comunes es tratar la telemática como una compra de hardware y no como un cambio operativo. Otro error es activar demasiadas alertas desde el primer día, lo que provoca fatiga y abandono. También es frecuente no explicar a los conductores cómo se usarán los datos, no definir responsables para revisar reportes o no ajustar la configuración después de las primeras semanas. EnVueMex ayuda a evitar estos problemas con diagnóstico, implementación por etapas, capacitación y seguimiento. La tecnología debe iniciar simple, medir lo importante y crecer con la operación.',
		),
		array(
			'Cómo comparar proveedores',
			sprintf( 'Comparar proveedores de %1$s exige revisar más que precio. Pregunte por experiencia en México, compatibilidad con distintos tipos de vehículos y activos, soporte después de la instalación, calidad de reportes, facilidad de uso, capacitación, privacidad de datos, opciones de crecimiento e integración con procesos existentes. También pida claridad sobre tiempos, responsabilidades y soporte cuando una unidad presenta problemas en campo. Un proveedor fuerte debe explicar cómo su solución ayuda a resolver %2$s y cómo acompañará al equipo cuando empiece el uso real.', $p['keyword'], $p['problem'] ),
		),
		array(
			'Checklist antes de la demostración',
			'Antes de una demostración, reúna información básica: número de unidades, tipos de vehículos, activos no vehiculares, zonas de operación, horarios, rutas críticas, problemas de seguridad, indicadores de mantenimiento, sistemas actuales y reportes que usa dirección. También conviene identificar quién decidirá, quién administrará la plataforma y quién usará la información cada día. Con ese contexto, la demostración puede mostrar casos reales en lugar de funciones abstractas. Una buena demo debe responder cómo se ve su operación conectada y qué pasos seguiría para desplegarla sin frenar el trabajo diario.',
		),
		array(
			'Contenido útil para compradores de soluciones de flota',
			sprintf( 'Esta página responde de forma clara las preguntas que compradores y equipos operativos hacen sobre %1$s. Incluye contexto, beneficios, problemas, proceso de implementación, indicadores, errores comunes, preguntas frecuentes y próximos pasos. El objetivo es ayudar a un cliente real a decidir si EnVueMex es el socio adecuado para convertir tecnología conectada en resultados medibles.', $p['keyword'] ),
		),
	);
}

function envuemex_render_rich_page( $slug ) {
	$data = envuemex_rich_page_data( $slug );
	if ( ! $data ) {
		return;
	}
	$faq = $data['faq'] ?? array(
		array( '¿Qué incluye la solución?', 'Incluye visibilidad operativa, alertas, reportes y acompañamiento para que la flota use la información de forma consistente.', 'What is included?', 'It includes operational visibility, alerts, reports and support so the fleet uses information consistently.' ),
		array( '¿Puedo solicitar una demostración?', 'Sí. El equipo puede preparar una conversación basada en sus unidades, rutas y prioridades.', 'Can I request a demo?', 'Yes. The team can prepare a conversation based on your vehicles, routes and priorities.' ),
	);
	?>
	<section class="rich-page-story">
		<div class="wrap rich-intro">
			<?php envuemex_lang_text( $data['kicker'], $data['kicker'], 'span', 'eyebrow' ); ?>
			<?php envuemex_lang_text( $data['title'], $data['en_title'], 'h2' ); ?>
			<?php envuemex_lang_text( $data['intro'], $data['en_intro'], 'p' ); ?>
		</div>
		<div class="wrap rich-feature-grid">
			<?php foreach ( $data['features'] as $index => $feature ) : ?>
				<article>
					<span><?php echo esc_html( str_pad( (string) ( $index + 1 ), 2, '0', STR_PAD_LEFT ) ); ?></span>
					<?php envuemex_lang_text( $feature, $data['features_en'][ $index ] ?? $feature, 'h3' ); ?>
				</article>
			<?php endforeach; ?>
		</div>
		<div class="wrap rich-body-grid">
			<?php foreach ( $data['body'] as $block ) : ?>
				<article>
					<?php envuemex_lang_text( $block[0], $block[2], 'h3' ); ?>
					<?php envuemex_lang_text( $block[1], $block[3], 'p' ); ?>
				</article>
			<?php endforeach; ?>
		</div>
		<?php if ( false !== ( $data['longform'] ?? true ) ) : ?>
			<div class="wrap rich-longform">
				<?php foreach ( envuemex_longform_sections( $slug ) as $section ) : ?>
					<article>
						<h2><?php echo esc_html( $section[0] ); ?></h2>
						<p><?php echo esc_html( $section[1] ); ?></p>
					</article>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
		<?php if ( $faq ) : ?>
			<div class="wrap rich-faq">
				<?php envuemex_lang_text( 'Preguntas frecuentes', 'Frequently asked questions', 'h2' ); ?>
				<?php foreach ( $faq as $item ) : ?>
					<details>
						<summary><?php envuemex_lang_text( $item[0], $item[2] ); ?></summary>
						<?php envuemex_lang_text( $item[1], $item[3], 'p' ); ?>
					</details>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</section>
	<?php
}

function envuemex_phone() {
	return '1-703-705-1304';
}

function envuemex_phone_tel() {
	return '+17037051304';
}

function envuemex_menu_fallback() {
	echo '<ul class="menu">';
	foreach ( envuemex_navigation_pages() as $slug => $title ) {
		printf( '<li><a href="%1$s">%2$s</a></li>', esc_url( envuemex_page_url( $slug ) ), esc_html( $title ) );
	}
	echo '</ul>';
}

function envuemex_assign_existing_front_page() {
	$home = get_page_by_path( 'home' );
	$blog = get_page_by_path( 'blog' );
	if ( $home ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', (int) $home->ID );
	}
	if ( $blog ) {
		update_option( 'page_for_posts', (int) $blog->ID );
	}
}
add_action( 'after_switch_theme', 'envuemex_assign_existing_front_page' );

function envuemex_schema_legacy() {
	if ( is_admin() ) {
		return;
	}
	$data = array(
		'@context' => 'https://schema.org',
		'@type'    => 'Organization',
		'name'     => 'EnVueMex Solutions',
		'url'      => home_url( '/' ),
		'logo'     => envuemex_image( 'envuemex-logo.webp' ),
		'telephone'=> envuemex_phone(),
		'description' => 'Soluciones conectadas de gestión de flota, rastreo GPS, seguridad por video y rastreo de activos para empresas en México.',
	);
	echo '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>';
}
function envuemex_schema() {
	if ( is_admin() ) {
		return;
	}
	$graph = array(
		array(
			'@context' => 'https://schema.org',
			'@type' => 'Organization',
			'name' => 'EnVueMex Solutions',
			'url' => home_url( '/' ),
			'logo' => envuemex_image( 'envuemex-logo.webp' ),
			'telephone' => envuemex_phone(),
			'description' => 'Soluciones conectadas de gestión de flota, rastreo GPS, seguridad por video y rastreo de activos para empresas en México.',
		),
	);
	if ( is_page() ) {
		$slug = get_post_field( 'post_name', get_queried_object_id() );
		$page_data = envuemex_rich_page_data( $slug );
		if ( $page_data ) {
			$profile = envuemex_longform_profile( $slug );
			$graph[] = array(
				'@context' => 'https://schema.org',
				'@type' => 'WebPage',
				'name' => wp_strip_all_tags( $page_data['title'] ),
				'url' => get_permalink(),
				'description' => wp_strip_all_tags( $page_data['intro'] ),
				'inLanguage' => 'es-MX',
				'about' => $profile['keyword'],
			);
			$faq_items = $page_data['faq'] ?? array();
			if ( $faq_items ) {
				$graph[] = array(
					'@context' => 'https://schema.org',
					'@type' => 'FAQPage',
					'mainEntity' => array_map(
						function ( $item ) {
							return array(
								'@type' => 'Question',
								'name' => wp_strip_all_tags( $item[0] ),
								'acceptedAnswer' => array(
									'@type' => 'Answer',
									'text' => wp_strip_all_tags( $item[1] ),
								),
							);
						},
						$faq_items
					),
				);
			}
		}
	}
	$data = count( $graph ) > 1 ? array( '@context' => 'https://schema.org', '@graph' => $graph ) : $graph[0];
	echo '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>';
}
add_action( 'wp_head', 'envuemex_schema', 30 );

function envuemex_body_classes( $classes ) {
	$classes[] = 'envue-site';
	return $classes;
}
add_filter( 'body_class', 'envuemex_body_classes' );
