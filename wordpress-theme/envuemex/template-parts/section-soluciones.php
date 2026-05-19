<?php
/**
 * Solutions grid.
 *
 * @package envuemex
 */
$features = array(
	array(
		'icon' => '<path d="M12 2c-3.9 0-7 3.1-7 7 0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" fill="currentColor"/>',
		'es_title' => 'Rastreo GPS en tiempo real',
		'en_title' => 'Real-time GPS tracking',
		'es_text'  => 'Ubicación, ruta histórica, geocercas y reportes para toda tu flota — actualizados cada segundo.',
		'en_text'  => 'Live location, historical routes, geofences and reports for your entire fleet — updated every second.',
	),
	array(
		'icon' => '<path d="M4 7h12l4 4v6h-2a2 2 0 1 1-4 0H10a2 2 0 1 1-4 0H4V7Zm12 2v3h4l-3-3h-1Z" fill="currentColor"/>',
		'es_title' => 'Gestión de flota',
		'en_title' => 'Fleet management',
		'es_text'  => 'Mantenimiento preventivo, combustible, kilometraje, productividad y costo por kilómetro en un solo tablero.',
		'en_text'  => 'Preventive maintenance, fuel, mileage, productivity and cost per kilometer in a single dashboard.',
	),
	array(
		'icon' => '<path d="M4 6h12l4 3v9H4V6Zm8 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" fill="currentColor"/>',
		'es_title' => 'Cámaras DVR / IA',
		'en_title' => 'AI dashcams / DVR',
		'es_text'  => 'Videovigilancia con IA: detección de distracción, fatiga, colisiones y eventos críticos en cabina.',
		'en_text'  => 'AI-powered video: distraction, fatigue, collision and critical in-cab event detection.',
	),
	array(
		'icon' => '<path d="M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5Zm0 4 5 2.8V13c0 3-2.4 5.4-5 6.2-2.6-.8-5-3.2-5-6.2V8.8L12 6Z" fill="currentColor"/>',
		'es_title' => 'Seguridad y conductor',
		'en_title' => 'Driver safety',
		'es_text'  => 'Calificación de conducción, alertas en cabina y coaching para reducir siniestros y costos de seguro.',
		'en_text'  => 'Driver scoring, in-cab alerts and coaching to reduce incidents and insurance costs.',
	),
	array(
		'icon' => '<path d="M3 5h18v3H3V5Zm0 5h12v3H3v-3Zm0 5h18v3H3v-3Z" fill="currentColor"/>',
		'es_title' => 'Rastreo de activos',
		'en_title' => 'Asset tracking',
		'es_text'  => 'Remolques, contenedores, generadores y equipo pesado con dispositivos de batería o cableados.',
		'en_text'  => 'Trailers, containers, generators and heavy equipment with battery or wired devices.',
	),
	array(
		'icon' => '<path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Zm1 0v9h9a9 9 0 0 0-9-9Z" fill="currentColor"/>',
		'es_title' => 'Integraciones & API',
		'en_title' => 'Integrations & API',
		'es_text'  => 'Conecta tu telemática con TMS, ERP, combustible y nómina vía API o conectores nativos.',
		'en_text'  => 'Connect telematics to TMS, ERP, fuel and payroll via API or native connectors.',
	),
);
?>
<section class="section" id="soluciones">
	<div class="container">
		<header class="section__head">
			<span class="eyebrow eyebrow--center">
				<span class="dot"></span>
				<span data-es="Soluciones" data-en="Solutions">Soluciones</span>
			</span>
			<h2 data-es="Una plataforma para cada activo en movimiento." data-en="One platform for every moving asset.">Una plataforma para cada activo en movimiento.</h2>
			<p class="section__lede" data-es="Diseñamos, instalamos y damos soporte a soluciones de telemática a la medida de tu operación." data-en="We design, install and support telematics solutions tailored to your operation.">
				Diseñamos, instalamos y damos soporte a soluciones de telemática a la medida de tu operación.
			</p>
		</header>

		<div class="grid grid--3">
			<?php foreach ( $features as $f ) : ?>
				<article class="feat" data-reveal>
					<div class="feat__ico">
						<svg viewBox="0 0 24 24"><?php echo $f['icon']; // raw svg ?></svg>
					</div>
					<h3 data-es="<?php echo esc_attr( $f['es_title'] ); ?>" data-en="<?php echo esc_attr( $f['en_title'] ); ?>"><?php echo esc_html( $f['es_title'] ); ?></h3>
					<p data-es="<?php echo esc_attr( $f['es_text'] ); ?>" data-en="<?php echo esc_attr( $f['en_text'] ); ?>"><?php echo esc_html( $f['es_text'] ); ?></p>
				</article>
			<?php endforeach; ?>
		</div>
	</div>
</section>
