<?php
/**
 * EnVueMex Exact theme bootstrap.
 *
 * @package envuemex-exact
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'EMX_VERSION', '7.4.2' );
define( 'EMX_DIR', get_template_directory() );
define( 'EMX_URI', get_template_directory_uri() );

/* =========================================================
   Assets
   ========================================================= */
function envuemex_exact_assets() {
	wp_enqueue_style(
		'envuemex-fonts',
		'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:ital,wght@0,600;0,700;0,800;0,900;1,700;1,800;1,900&family=JetBrains+Mono:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'envuemex-exact', EMX_URI . '/assets/envuemex-exact.css', array(), EMX_VERSION );
	wp_enqueue_script( 'envuemex-exact', EMX_URI . '/assets/envuemex-exact.js', array(), EMX_VERSION, true );
	wp_localize_script( 'envuemex-exact', 'emxConfig', array(
		'ajaxUrl' => admin_url( 'admin-ajax.php' ),
	) );
}
add_action( 'wp_enqueue_scripts', 'envuemex_exact_assets', 20 );

/* =========================================================
   Theme setup
   ========================================================= */
add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'elementor' );
} );

/* =========================================================
   Elementor widgets
   ========================================================= */
require_once EMX_DIR . '/inc/elementor-widgets.php';

/* =========================================================
   Elementor section helper
   ========================================================= */
function envuemex_elementor_section( $widget_name, $settings = array() ) {
	return array(
		'id'       => substr( md5( $widget_name . wp_json_encode( $settings ) . wp_rand() ), 0, 7 ),
		'elType'   => 'section',
		'settings' => array( 'layout' => 'full_width', 'gap' => 'no', 'css_classes' => 'emx-shell-section' ),
		'elements' => array( array(
			'id'       => substr( md5( 'col' . $widget_name . wp_rand() ), 0, 7 ),
			'elType'   => 'column',
			'settings' => array( '_column_size' => 100 ),
			'elements' => array( array(
				'id'         => substr( md5( 'w' . $widget_name . wp_rand() ), 0, 7 ),
				'elType'     => 'widget',
				'widgetType' => $widget_name,
				'settings'   => $settings,
				'elements'   => array(),
			) ),
		) ),
	);
}

/* =========================================================
   Per-page tailored content
   ========================================================= */
function envuemex_get_page_data( $slug, $title ) {
	$assets_url = trailingslashit( EMX_URI ) . 'assets/';

	if ( $slug === 'index' ) {
		return array(
			envuemex_elementor_section( 'envuemex_home_hero' ),
			envuemex_elementor_section( 'envuemex_route' ),
			envuemex_elementor_section( 'envuemex_difference' ),
			envuemex_elementor_section( 'envuemex_solutions' ),
			envuemex_elementor_section( 'envuemex_features' ),
			envuemex_elementor_section( 'envuemex_proof' ),
			envuemex_elementor_section( 'envuemex_cta_footer' ),
		);
	}

	if ( $slug === 'contacto' ) {
		return array(
			envuemex_elementor_section( 'envuemex_page_content', array(
				'title'      => 'Contacto',
				'label'      => 'Hable con nosotros',
				'intro'      => 'Comience hoy con soluciones conectadas para flotas comerciales en México. Respuesta el mismo día hábil.',
				'hero_image' => array( 'url' => $assets_url . 'hero-driver-phone.jpg' ),
				'body_html'  => '',
			) ),
			envuemex_elementor_section( 'envuemex_contact' ),
			envuemex_elementor_section( 'envuemex_cta_footer' ),
		);
	}

	$map = array(
		'servicios' => array(
			'title' => 'Servicios',
			'label' => 'Bienvenido a EnVueMex',
			'intro' => 'Gestión integral de flotas comerciales. GPS, dash cams y rastreo de activos no vehiculares con instalación, capacitación y soporte continuo.',
			'image' => 'hero-road-train.jpg',
			'body'  => emx_body_servicios(),
		),
		'soluciones-de-rastreo-gps' => array(
			'title' => 'Soluciones de Rastreo GPS',
			'label' => 'El rastreo de activos hecho fácil',
			'intro' => 'Dispositivos y sistemas de rastreo GPS que hacen las flotas más eficientes, seguras y rentables — desde un vehículo hasta miles.',
			'image' => 'hero-gps-rendering.jpg',
			'body'  => emx_body_gps(),
		),
		'dash-cams' => array(
			'title' => 'Cámaras de Tablero',
			'label' => 'Las mejores dash cams para flota',
			'intro' => 'Videovigilancia con IA para mejorar la seguridad vial, reducir siniestros y proteger a tus conductores y activos.',
			'image' => 'hero-dashcam-road.jpg',
			'body'  => emx_body_dashcams(),
		),
		'rastreadores-de-activos-no-vehiculares' => array(
			'title' => 'Rastreadores de Activos no Vehiculares',
			'label' => 'Optimiza el uso de tus activos',
			'intro' => 'Visibilidad de equipo pesado, generadores, contenedores y herramientas — donde sea que estén.',
			'image' => 'hero-lorry-yard.jpg',
			'body'  => emx_body_assets(),
		),
		'acerca-de-nosotros' => array(
			'title' => 'Acerca de Nosotros',
			'label' => 'EnVueMex Solutions',
			'intro' => 'Proveedor líder de soluciones para flotas de vehículos comerciales en México, en alianza con Geotab desde 2011.',
			'image' => 'home-trucks-front.jpg',
			'body'  => emx_body_about(),
		),
		'corporate-faq' => array(
			'title' => 'Preguntas frecuentes',
			'label' => 'FAQ',
			'intro' => 'Respuestas para flotas comerciales que evalúan telemática, seguridad y rastreo.',
			'image' => 'hero-gps-dashboard.jpeg',
			'body'  => emx_body_faq(),
		),
		'calendario-de-eventos' => array(
			'title' => 'Calendario de Eventos',
			'label' => 'Eventos EnVueMex',
			'intro' => 'Conoce nuestros eventos, sesiones, demos y actualizaciones a lo largo del año.',
			'image' => 'hero-lorry-yard.jpg',
			'body'  => emx_body_events(),
		),
		'blog' => array(
			'title' => 'Recursos y Blog',
			'label' => 'Insights para flotas',
			'intro' => 'Ideas y guías sobre gestión de flotas, seguridad, rastreo GPS y cumplimiento.',
			'image' => 'hero-truck-line.jpg',
			'body'  => emx_body_blog(),
		),
		'privacy-policy' => array(
			'title' => 'Política de privacidad',
			'label' => 'Privacy Policy',
			'intro' => 'Información sobre cómo tratamos tus datos personales.',
			'image' => 'hero-truck-line.jpg',
			'body'  => emx_body_legal( 'privacidad' ),
		),
		'terms-and-conditions' => array(
			'title' => 'Términos y condiciones',
			'label' => 'Terms and Conditions',
			'intro' => 'Términos de uso de EnVueMex Solutions.',
			'image' => 'hero-truck-line.jpg',
			'body'  => emx_body_legal( 'terminos' ),
		),
	);

	$d = isset( $map[ $slug ] ) ? $map[ $slug ] : array(
		'title' => $title,
		'label' => 'EnVueMex Solutions',
		'intro' => 'Soluciones conectadas para flotas comerciales en México.',
		'image' => 'hero-truck-line.jpg',
		'body'  => emx_body_about(),
	);

	$sections = array(
		envuemex_elementor_section( 'envuemex_page_content', array(
			'title'      => $d['title'],
			'label'      => $d['label'],
			'intro'      => $d['intro'],
			'hero_image' => array( 'url' => $assets_url . $d['image'] ),
			'body_html'  => $d['body'],
		) ),
		envuemex_elementor_section( 'envuemex_cta_footer' ),
	);
	return $sections;
}

/* =========================================================
   Page body builders
   ========================================================= */
function emx_body_servicios() {
	return '<div class="emx-card-grid">' .
		emx_card( 'GPS', 'Rastreo GPS', 'Ubicación, ruta histórica, geocercas y reportes para toda la flota.' ) .
		emx_card( 'CAM', 'Dash Cams', 'Video con IA: detección de distracción, fatiga, colisión y eventos críticos.' ) .
		emx_card( 'AST', 'Activos', 'Remolques, contenedores, generadores y equipo con dispositivos cableados o de batería.' ) .
		emx_card( 'OBD', 'Plug & Play', 'Instalación rápida vía OBD-II, sin afectar la operación.' ) .
		emx_card( 'API', 'Integraciones', 'Conexión con ERP, TMS, combustible y nómina vía API o conectores nativos.' ) .
		emx_card( '24/7', 'Soporte', 'Soporte bilingüe 24/7 con SLA contractual y monitoreo de salud del dispositivo.' ) .
	'</div>';
}
function emx_body_gps() {
	return '<div class="emx-split">' .
		'<div class="emx-prose">' .
		'<h2>Visibilidad de cada vehículo, en tiempo real</h2>' .
		'<p>Nuestras soluciones GPS conectan toda la flota con datos accionables: ubicación segundo a segundo, ruta histórica, geocercas, alertas y reportes a la medida de tu KPI.</p>' .
		'<ul class="emx-feature-list">' .
		'<li>Actualización GPS cada 1–5 segundos según plan</li>' .
		'<li>Reportes de combustible, ralentí y conducción</li>' .
		'<li>Geocercas ilimitadas con alertas en tiempo real</li>' .
		'<li>Mantenimiento preventivo automatizado</li>' .
		'<li>App móvil para gerentes y conductores</li>' .
		'</ul>' .
		'<a class="btn btn-primary" href="' . esc_url( home_url( '/contacto/' ) ) . '">Solicitar demo</a>' .
		'</div>' .
		'<div class="emx-split-image"><img src="' . esc_url( EMX_URI . '/assets/hero-gps-dashboard.jpeg' ) . '" alt="Tablero GPS"></div>' .
	'</div>';
}
function emx_body_dashcams() {
	return '<div class="emx-split">' .
		'<div class="emx-split-image"><img src="' . esc_url( EMX_URI . '/assets/home-dashcams.jpg' ) . '" alt="Dash cams"></div>' .
		'<div class="emx-prose">' .
		'<h2>Más que video — coaching de conductores con IA</h2>' .
		'<p>Las dash cams modernas no solo graban: detectan fatiga, distracción, frenado brusco y eventos críticos en tiempo real para mejorar el comportamiento de manejo y reducir siniestros.</p>' .
		'<ul class="emx-feature-list">' .
		'<li>Cámara delantera + interior con visión nocturna</li>' .
		'<li>Detección de fatiga, distracción y celular</li>' .
		'<li>Reproducción remota de eventos críticos</li>' .
		'<li>Calificación de manejo y coaching automatizado</li>' .
		'<li>Reducción promedio del 45% en eventos de riesgo</li>' .
		'</ul>' .
		'<a class="btn btn-primary" href="' . esc_url( home_url( '/contacto/' ) ) . '">Hablar con un experto</a>' .
		'</div>' .
	'</div>';
}
function emx_body_assets() {
	return '<div class="emx-split">' .
		'<div class="emx-prose">' .
		'<h2>Telemática para todo lo que se mueve — o no debería moverse</h2>' .
		'<p>Equipo de construcción, generadores, compresores, contenedores y herramientas valiosas: visibilidad total con dispositivos cableados, plug-in o de batería de larga duración.</p>' .
		'<ul class="emx-feature-list">' .
		'<li>Hasta 5 años de batería en dispositivos no cableados</li>' .
		'<li>Alertas de movimiento no autorizado y geocercas</li>' .
		'<li>Conteo de horas de motor y uso real</li>' .
		'<li>Modelos certificados para entornos rudos (IP67/IP69)</li>' .
		'<li>Integración con tu sistema de mantenimiento</li>' .
		'</ul>' .
		'<a class="btn btn-primary" href="' . esc_url( home_url( '/contacto/' ) ) . '">Cotizar instalación</a>' .
		'</div>' .
		'<div class="emx-split-image"><img src="' . esc_url( EMX_URI . '/assets/hero-lorry-yard.jpg' ) . '" alt="Patio de activos"></div>' .
	'</div>';
}
function emx_body_about() {
	return '<div class="emx-split">' .
		'<div class="emx-prose">' .
		'<h2>15 años conectando flotas en México</h2>' .
		'<p>EnVueMex Solutions es el socio de referencia para empresas de transporte y logística que buscan modernizar su operación con telemática líder del mundo. Operamos en alianza estratégica con Geotab desde 2011.</p>' .
		'<p>Nuestro equipo binacional combina experiencia profunda del mercado mexicano con tecnología y mejores prácticas de Norteamérica.</p>' .
		'<ul class="emx-feature-list">' .
		'<li>Socio Premier Partner de Geotab en Latinoamérica</li>' .
		'<li>Implementación a nivel nacional con técnicos certificados</li>' .
		'<li>Soporte 24/7 en español e inglés</li>' .
		'<li>Más de 10,000 vehículos conectados</li>' .
		'</ul>' .
		'<a class="btn btn-primary" href="' . esc_url( home_url( '/contacto/' ) ) . '">Conversemos</a>' .
		'</div>' .
		'<div class="emx-split-image"><img src="' . esc_url( EMX_URI . '/assets/home-trucks-front.jpg' ) . '" alt="Camiones EnVueMex"></div>' .
	'</div>';
}
function emx_body_faq() {
	$faqs = array(
		array( '¿Cuánto tarda la instalación?', 'La mayoría de dispositivos GPS plug-in se instalan en menos de 10 minutos. Instalaciones cableadas y dash cams toman entre 30 y 90 minutos por vehículo, con cita programada en tu instalación o ruta.' ),
		array( '¿Funciona con cualquier vehículo?', 'Sí. Tenemos hardware para autos, camionetas, tractocamiones, equipo pesado, motocicletas, remolques y activos no vehiculares.' ),
		array( '¿Hay contrato mínimo?', 'Ofrecemos planes mensuales y anuales. Te recomendamos el que mejor se ajuste a tu operación y tamaño de flota.' ),
		array( '¿Cómo es el soporte?', 'Soporte por teléfono, correo y chat en español e inglés. Casos críticos atendidos 24/7. SLA contractual disponible.' ),
		array( '¿La plataforma es solo web?', 'Tienes acceso web (cualquier navegador) y apps móviles nativas para iOS y Android para gerentes y conductores.' ),
		array( '¿Pueden integrar con mi ERP/TMS?', 'Sí. Geotab cuenta con APIs robustas y conectores nativos a los TMS, ERPs y plataformas de combustible más usadas en México.' ),
	);
	$html = '<div class="emx-prose"><h2>Preguntas frecuentes</h2>';
	foreach ( $faqs as $f ) {
		$html .= '<h3>' . esc_html( $f[0] ) . '</h3><p>' . esc_html( $f[1] ) . '</p>';
	}
	$html .= '</div>';
	return $html;
}
function emx_body_events() {
	return '<div class="emx-prose"><h2>Próximamente</h2><p>Estamos preparando demos en vivo, sesiones técnicas con Geotab y eventos regionales en Monterrey, CDMX y Guadalajara. Suscríbete para recibir invitaciones.</p>'
		. '<a class="btn btn-primary" href="' . esc_url( home_url( '/contacto/' ) ) . '">Recibir invitaciones</a></div>';
}
function emx_body_blog() {
	return '<div class="emx-prose"><h2>Próximamente</h2><p>Publicaremos guías prácticas sobre telemática, casos de éxito de flotas mexicanas, mejores prácticas de seguridad vial y novedades de la plataforma Geotab.</p>'
		. '<a class="btn btn-primary" href="' . esc_url( home_url( '/contacto/' ) ) . '">Quiero recibir el newsletter</a></div>';
}
function emx_body_legal( $kind ) {
	if ( $kind === 'privacidad' ) {
		return '<div class="emx-prose"><h2>Política de privacidad</h2>'
			. '<p>EnVueMex Solutions respeta tu privacidad. Recolectamos únicamente los datos necesarios para responder a tus solicitudes, prestar nuestros servicios y mejorar tu experiencia con nuestra plataforma.</p>'
			. '<h3>Qué recolectamos</h3>'
			. '<p>Nombre, empresa, correo, teléfono y mensaje a través de nuestros formularios. Datos operativos de tus vehículos y activos a través de la plataforma contratada.</p>'
			. '<h3>Cómo usamos tus datos</h3>'
			. '<p>Para responder cotizaciones, prestar soporte, facturación y mejorar nuestros servicios. No vendemos tus datos a terceros.</p>'
			. '<p>Esta es una política base; sustitúyela por tu versión legal completa antes de producción.</p></div>';
	}
	return '<div class="emx-prose"><h2>Términos y condiciones</h2>'
		. '<p>El uso de los servicios de EnVueMex Solutions está sujeto a los términos pactados en el contrato individual con cada cliente. Esta página resume los principios generales.</p>'
		. '<h3>Servicios</h3>'
		. '<p>Provemos hardware, software y servicios de telemática para flotas y activos. El alcance y SLA específicos se definen contractualmente.</p>'
		. '<h3>Propiedad</h3>'
		. '<p>El software, marcas y documentación son propiedad de sus respectivos titulares. Los datos de operación de cada cliente son del cliente.</p>'
		. '<p>Sustituye por la versión legal completa antes de producción.</p></div>';
}
function emx_card( $icon_text, $title, $body ) {
	return '<article class="emx-card"><div class="emx-card-icon">' . esc_html( $icon_text ) . '</div><h3>' . esc_html( $title ) . '</h3><p>' . esc_html( $body ) . '</p></article>';
}

/* =========================================================
   Page import (auto on activation + admin trigger)
   ========================================================= */
function envuemex_exact_import_pages() {
	$pages = array(
		'index'                                  => 'Inicio',
		'servicios'                              => 'Servicios',
		'soluciones-de-rastreo-gps'              => 'Soluciones de Rastreo GPS',
		'dash-cams'                              => 'Dash Cams',
		'rastreadores-de-activos-no-vehiculares' => 'Rastreadores de Activos no Vehiculares',
		'acerca-de-nosotros'                     => 'Acerca de Nosotros',
		'corporate-faq'                          => 'FAQ',
		'calendario-de-eventos'                  => 'Calendario de Eventos',
		'blog'                                   => 'Blog',
		'contacto'                               => 'Contacto',
		'privacy-policy'                         => 'Privacy Policy',
		'terms-and-conditions'                   => 'Terms and Conditions',
	);
	foreach ( $pages as $slug => $title ) {
		$post_name = $slug === 'index' ? 'inicio' : $slug;
		$existing  = get_page_by_path( $post_name );
		$postarr   = array(
			'post_title'   => $title,
			'post_name'    => $post_name,
			'post_status'  => 'publish',
			'post_type'    => 'page',
			'post_content' => '',
		);
		if ( $existing ) {
			$postarr['ID'] = $existing->ID;
			$page_id       = wp_update_post( $postarr, true );
		} else {
			$page_id = wp_insert_post( $postarr, true );
		}
		if ( is_wp_error( $page_id ) ) { continue; }
		update_post_meta( $page_id, '_elementor_data', wp_slash( wp_json_encode( envuemex_get_page_data( $slug, $title ) ) ) );
		update_post_meta( $page_id, '_elementor_edit_mode', 'builder' );
		update_post_meta( $page_id, '_elementor_template_type', 'wp-page' );
		update_post_meta( $page_id, '_elementor_version', defined( 'ELEMENTOR_VERSION' ) ? ELEMENTOR_VERSION : '3.20.0' );
		update_post_meta( $page_id, '_wp_page_template', 'templates/elementor-full-width.php' );
		if ( $slug === 'index' ) {
			update_option( 'show_on_front', 'page' );
			update_option( 'page_on_front', $page_id );
		}
	}
	flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'envuemex_exact_import_pages' );
add_action( 'admin_init', function () {
	if ( current_user_can( 'manage_options' ) && isset( $_GET['envuemex_import_pages'] ) ) {
		envuemex_exact_import_pages();
		wp_safe_redirect( admin_url( 'edit.php?post_type=page' ) );
		exit;
	}
} );

/* =========================================================
   Contact form AJAX handler
   ========================================================= */
function envuemex_handle_contact() {
	if ( ! check_ajax_referer( 'emx_contact', 'emx_nonce', false ) ) {
		wp_send_json_error( array( 'message' => 'Solicitud inválida. Recarga la página y vuelve a intentar.' ), 400 );
	}
	// Honeypot.
	if ( ! empty( $_POST['emx_hp'] ) ) {
		wp_send_json_success( array( 'message' => 'Gracias, te contactaremos pronto.' ) );
	}

	$name    = sanitize_text_field( wp_unslash( $_POST['name']    ?? '' ) );
	$company = sanitize_text_field( wp_unslash( $_POST['company'] ?? '' ) );
	$email   = sanitize_email( wp_unslash( $_POST['email']        ?? '' ) );
	$phone   = sanitize_text_field( wp_unslash( $_POST['phone']   ?? '' ) );
	$size    = sanitize_text_field( wp_unslash( $_POST['fleet_size'] ?? '' ) );
	$interest= sanitize_text_field( wp_unslash( $_POST['interest']?? '' ) );
	$message = sanitize_textarea_field( wp_unslash( $_POST['message'] ?? '' ) );

	if ( ! $name || ! $company || ! is_email( $email ) ) {
		wp_send_json_error( array( 'message' => 'Por favor completa nombre, empresa y un correo válido.' ), 400 );
	}

	$to      = apply_filters( 'envuemex_contact_to', get_option( 'admin_email', 'ventas@et-envue.com' ) );
	$subject = sprintf( '[EnVueMex] Solicitud de %s — %s', $name, $company );
	$body    = "Nombre: {$name}\n"
		. "Empresa: {$company}\n"
		. "Correo: {$email}\n"
		. "Teléfono: {$phone}\n"
		. "Tamaño de flota: {$size}\n"
		. "Interés: {$interest}\n"
		. "Mensaje:\n{$message}\n";
	$headers = array(
		'Content-Type: text/plain; charset=UTF-8',
		'Reply-To: ' . $name . ' <' . $email . '>',
	);

	$ok = wp_mail( $to, $subject, $body, $headers );

	// Always log to a CPT-like option so submissions aren't lost if mail fails.
	$log               = get_option( 'envuemex_contact_log', array() );
	$log[]             = array(
		'time'     => current_time( 'mysql' ),
		'name'     => $name,
		'company'  => $company,
		'email'    => $email,
		'phone'    => $phone,
		'size'     => $size,
		'interest' => $interest,
		'message'  => $message,
		'mailed'   => (bool) $ok,
	);
	update_option( 'envuemex_contact_log', array_slice( $log, -200 ), false );

	wp_send_json_success( array( 'message' => 'Gracias, ' . esc_html( $name ) . '. Te contactaremos a la brevedad.' ) );
}
add_action( 'wp_ajax_emx_contact_submit',        'envuemex_handle_contact' );
add_action( 'wp_ajax_nopriv_emx_contact_submit', 'envuemex_handle_contact' );

/* =========================================================
   Small admin notice for setup
   ========================================================= */
add_action( 'admin_notices', function () {
	if ( ! current_user_can( 'manage_options' ) ) { return; }
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen || ! in_array( $screen->id, array( 'themes', 'dashboard' ), true ) ) { return; }
	$theme = wp_get_theme();
	if ( $theme->get_stylesheet() !== get_stylesheet() ) { return; }
	echo '<div class="notice notice-info"><p><strong>EnVueMex Exact ' . esc_html( EMX_VERSION ) . ':</strong> ';
	echo 'Las 12 páginas se importan automáticamente al activar el tema. Si no aparecen, visita <a href="' . esc_url( admin_url( '?envuemex_import_pages=1' ) ) . '">esta URL</a> para reimportar.';
	echo '</p></div>';
} );
