<?php
/**
 * Premium redesigned home page.
 *
 * @package EnVueMex_Premium
 */
get_header();
?>
<main id="main" class="home-page">
	<section class="hero-home" id="heroSlider" aria-label="Destacados EnVueMex">
		<div class="hero-backgrounds" aria-hidden="true">
			<div class="hero-bg active" data-bg="0"></div>
			<div class="hero-bg" data-bg="1"></div>
			<div class="hero-bg" data-bg="2"></div>
		</div>
		<div class="wrap hero-layout">
			<div class="hero-content">
				<div class="hero-slide active" data-slide="0">
					<span class="eyebrow">Inteligencia para cada ruta</span>
					<h1>Cada unidad visible. <span>Cada decisión a tiempo.</span></h1>
					<p>EnVueMex conecta sus flotas, activos y evidencia de seguridad con rastreo GPS, cámaras de tablero y tecnología respaldada por especialistas para México.</p>
				</div>
				<div class="hero-slide" data-slide="1" aria-hidden="true">
					<span class="eyebrow">Centro de control</span>
					<h1>Controle kilómetros, riesgo y <span>rentabilidad.</span></h1>
					<p>Telemetría y señales en vivo para transformar recorridos diarios en una operación más segura, medible y eficiente.</p>
				</div>
				<div class="hero-slide" data-slide="2" aria-hidden="true">
					<span class="eyebrow">Implementación local</span>
					<h1>Tecnología que su equipo <span>sí utiliza.</span></h1>
					<p>Desde el diagnóstico hasta el soporte continuo, acompañamos a su flota para convertir datos conectados en resultados reales.</p>
				</div>
				<div class="hero-actions">
					<a class="button button-primary" href="<?php echo esc_url( envuemex_page_url( 'contacto' ) ); ?>">Solicitar demo <span>→</span></a>
					<a class="button button-ghost" href="#plataforma">Conozca más</a>
				</div>
			</div>
			<div class="hero-clean-controls" aria-label="Cambiar imagen destacada">
				<button class="hero-arrow" id="heroPrevious" aria-label="Anterior">←</button>
				<div class="hero-dots">
					<button class="hero-dot active" data-hero-go="0" aria-pressed="true" aria-label="Ver imagen de patio logístico"></button>
					<button class="hero-dot" data-hero-go="1" aria-pressed="false" aria-label="Ver imagen de centro de control"></button>
					<button class="hero-dot" data-hero-go="2" aria-pressed="false" aria-label="Ver imagen de instalación"></button>
				</div>
				<div class="hero-count" aria-live="polite"><strong id="heroCurrent">01</strong><small>/ 03</small></div>
				<button class="hero-arrow" id="heroNext" aria-label="Siguiente">→</button>
			</div>
		</div>
	</section>
	<section class="credibility">
		<div class="wrap stat-band">
			<div><strong>15+</strong><span>Años acompañando operaciones</span></div>
			<div><strong>2011</strong><span>Socio autorizado de Geotab</span></div>
			<div><strong>24/7</strong><span>Visibilidad y soporte</span></div>
			<div><strong>México</strong><span>Experiencia local para flotas</span></div>
		</div>
	</section>
	<section class="section fleet-command">
		<div class="wrap command-grid">
			<div class="command-copy">
				<span class="eyebrow">Operación conectada</span>
				<h2>Una vista clara para cada equipo que toca la flota.</h2>
				<p>Dirección necesita indicadores. Operaciones necesita saber dónde actuar. Seguridad necesita contexto. Mantenimiento necesita señales tempranas. EnVueMex ordena esa información para que cada área trabaje con la misma verdad operativa.</p>
				<div class="command-points">
					<div><strong>01</strong><span>Supervisión de unidades, rutas y tiempos improductivos.</span></div>
					<div><strong>02</strong><span>Evidencia visual para incidentes, capacitación preventiva y protección del conductor.</span></div>
					<div><strong>03</strong><span>Reportes para dirección con ahorro, riesgo, utilización y servicio.</span></div>
				</div>
			</div>
			<div class="command-images">
				<img class="main" src="<?php echo esc_url( envuemex_image( 'page-gps.jpg' ) ); ?>" alt="Centro de operaciones monitoreando una flota">
				<img class="float top" src="<?php echo esc_url( envuemex_image( 'page-dash-cams.jpg' ) ); ?>" alt="Seguridad por video para conductores de flota">
				<img class="float bottom" src="<?php echo esc_url( envuemex_image( 'page-assets.jpg' ) ); ?>" alt="Rastreo de activos y equipo operativo">
			</div>
		</div>
	</section>
	<section class="section proof-section">
		<div class="wrap proof-grid">
			<article class="proof-card-large">
				<img src="<?php echo esc_url( envuemex_image( 'hero-control-tower.jpg' ) ); ?>" alt="Control operativo de flota">
				<span>Control</span>
				<h3>Menos llamadas para ubicar unidades.</h3>
				<p>El equipo ve rutas, paradas, desviaciones y señales críticas desde una base compartida.</p>
				<a href="<?php echo esc_url( envuemex_page_url( 'soluciones-de-rastreo-gps' ) ); ?>">Ver rastreo GPS →</a>
			</article>
			<article>
				<img src="<?php echo esc_url( envuemex_image( 'hero-fleet-journal.jpg' ) ); ?>" alt="Equipo revisando datos de flota">
				<span>Adopción</span>
				<h3>Datos que el equipo sí usa.</h3>
				<p>Capacitación, reportes y acompañamiento para convertir tecnología en hábitos de operación.</p>
				<a href="<?php echo esc_url( envuemex_page_url( 'servicios' ) ); ?>">Ver servicios →</a>
			</article>
			<article>
				<img src="<?php echo esc_url( envuemex_image( 'hero-route-intelligence.jpg' ) ); ?>" alt="Camiones en ruta en México">
				<span>Resultados</span>
				<h3>Mejores decisiones en la siguiente ruta.</h3>
				<p>Visibilidad para reducir desperdicio, responder antes y proteger la rentabilidad de la flota.</p>
				<a href="<?php echo esc_url( envuemex_page_url( 'contacto' ) ); ?>">Solicitar demo →</a>
			</article>
		</div>
	</section>
	<section id="plataforma" class="section solutions-section">
		<div class="wrap">
			<div class="section-head">
				<div><span class="eyebrow">Plataforma EnVueMex</span><h2>Control completo para su operación.</h2></div>
				<p>Convierta los datos de flota en decisiones diarias: dónde está cada unidad, cómo se conduce, qué activo necesita atención y dónde puede reducir costo.</p>
			</div>
			<div class="solution-tabs">
				<div class="tab-buttons" role="tablist">
					<button class="active" data-tab="gps" role="tab">Rastreo GPS</button>
					<button data-tab="camera" role="tab">Dash Cams</button>
					<button data-tab="assets" role="tab">Activos</button>
					<button data-tab="service" role="tab">Implementación</button>
				</div>
				<div class="tab-panels">
					<article class="tab-panel active" id="tab-gps">
						<img src="<?php echo esc_url( envuemex_image( 'page-gps.jpg' ) ); ?>" alt="Centro de operaciones monitoreando rutas GPS">
						<div><span class="number">01 / GPS</span><h3>Rastreo que se convierte en acción.</h3><p>Ubicación en tiempo real, rutas, tiempos improductivos y reportes para tomar decisiones rápidas y fundamentadas.</p><a href="<?php echo esc_url( envuemex_page_url( 'soluciones-de-rastreo-gps' ) ); ?>">Ver rastreo GPS →</a></div>
					</article>
					<article class="tab-panel" id="tab-camera">
						<img src="<?php echo esc_url( envuemex_image( 'page-dash-cams.jpg' ) ); ?>" alt="Conductor profesional con cámara de seguridad">
						<div><span class="number">02 / Seguridad</span><h3>Video para entender y prevenir riesgo.</h3><p>Proteja a conductores y operación con evidencia visual y una cultura de seguridad mejor informada.</p><a href="<?php echo esc_url( envuemex_page_url( 'dash-cams' ) ); ?>">Ver cámaras →</a></div>
					</article>
					<article class="tab-panel" id="tab-assets">
						<img src="<?php echo esc_url( envuemex_image( 'page-assets.jpg' ) ); ?>" alt="Seguimiento de remolques y equipos">
						<div><span class="number">03 / Activos</span><h3>Visibilidad más allá del vehículo.</h3><p>Rastree remolques, maquinaria, generadores y equipos desde la misma estrategia de flota.</p><a href="<?php echo esc_url( envuemex_page_url( 'rastreadores-de-activos-no-vehiculares' ) ); ?>">Ver activos →</a></div>
					</article>
					<article class="tab-panel" id="tab-service">
						<img src="<?php echo esc_url( envuemex_image( 'page-about.jpg' ) ); ?>" alt="Equipo EnVueMex de soporte de flota">
						<div><span class="number">04 / Soporte</span><h3>El sistema correcto, implementado correctamente.</h3><p>Nuestro equipo acompaña configuración, adopción y mejora continua de su operación conectada.</p><a href="<?php echo esc_url( envuemex_page_url( 'servicios' ) ); ?>">Ver servicios →</a></div>
					</article>
				</div>
			</div>
		</div>
	</section>
	<section class="section feature-tools">
		<div class="wrap tools-grid">
			<div class="roi-tool">
				<span class="eyebrow">Calculadora operativa</span>
				<h2>Estime el ahorro de una flota conectada.</h2>
				<label>Vehículos en su flota <output id="fleetOutput">50</output></label>
				<input id="fleetRange" type="range" min="10" max="500" value="50" step="10">
				<label>Gasto mensual de combustible por vehículo</label>
				<div class="money-field"><span>$</span><input id="fuelInput" type="number" value="24000" min="1000" step="1000"><small>MXN</small></div>
				<div class="saving-result">
					<small>Ahorro potencial anual estimado*</small>
					<strong id="savingTotal">$1,728,000 MXN</strong>
				</div>
				<p class="disclaimer">*Ejemplo ilustrativo basado en una reducción operativa del 12%; la evaluación real depende de su operación.</p>
			</div>
			<div class="safety-demo">
				<span class="eyebrow">Seguridad por video</span>
				<h2>De alerta a contexto en segundos.</h2>
				<div class="video-card">
					<div class="video-feed">
						<img src="<?php echo esc_url( envuemex_image( 'page-dash-cams.jpg' ) ); ?>" alt="Simulación de cámara de tablero">
						<span class="record">● REC</span>
						<span class="event" id="safetyEvent">Conducción segura</span>
					</div>
					<div class="event-actions">
						<button data-event="safe" class="active">Ruta normal</button>
						<button data-event="brake">Frenado brusco</button>
						<button data-event="distracted">Distracción</button>
					</div>
					<div class="coaching" id="coachingMessage">Sin alertas. La ruta continúa con conducción estable y señal activa.</div>
				</div>
			</div>
		</div>
	</section>
	<section class="section rollout-section">
		<div class="wrap rollout-grid">
			<div class="rollout-copy">
				<span class="eyebrow">Activación EnVueMex</span>
				<h2>De la evaluación al control total de su flota.</h2>
				<p>Un sistema conectado funciona cuando el despliegue es claro. Explore el proceso que lleva su operación desde la revisión inicial hasta la mejora continua.</p>
				<div class="rollout-steps" role="tablist" aria-label="Etapas de implementación">
					<button class="active" data-rollout="audit" role="tab" aria-selected="true"><span>01</span>Diagnóstico</button>
					<button data-rollout="install" role="tab" aria-selected="false"><span>02</span>Instalación</button>
					<button data-rollout="train" role="tab" aria-selected="false"><span>03</span>Adopción</button>
					<button data-rollout="improve" role="tab" aria-selected="false"><span>04</span>Optimización</button>
				</div>
			</div>
			<div class="rollout-panel">
				<span class="panel-label" id="rolloutLabel">Semana 01 / Diagnóstico</span>
				<h3 id="rolloutTitle">Comprendemos su operación antes de instalar.</h3>
				<p id="rolloutText">Revisión de unidades, activos, rutas, riesgos y prioridades para diseñar una implementación adecuada a su flota.</p>
				<div class="rollout-deliverables">
					<div><small>Entregable</small><strong id="rolloutDeliverable">Mapa de necesidades</strong></div>
					<div><small>Enfoque</small><strong id="rolloutFocus">Visibilidad</strong></div>
					<div><small>Estado</small><strong class="ready">Listo</strong></div>
				</div>
			</div>
		</div>
	</section>
	<section class="section sectors">
		<div class="wrap">
			<div class="section-head compact">
				<div><span class="eyebrow">Operaciones</span><h2>Creada para flotas que mueven México.</h2></div>
				<a href="<?php echo esc_url( envuemex_page_url( 'servicios' ) ); ?>">Explorar servicios →</a>
			</div>
			<div class="sector-cards">
				<a href="<?php echo esc_url( envuemex_page_url( 'transporte-y-logistica' ) ); ?>"><img src="<?php echo esc_url( envuemex_image( 'hero-route-intelligence.jpg' ) ); ?>" alt=""><span>01</span><h3>Transporte y logística</h3><p>Rutas visibles, conductores seguros y costos controlados.</p></a>
				<a href="<?php echo esc_url( envuemex_page_url( 'construccion-y-equipo' ) ); ?>"><img src="<?php echo esc_url( envuemex_image( 'page-assets.jpg' ) ); ?>" alt=""><span>02</span><h3>Construcción y equipo</h3><p>Seguimiento de maquinaria y activos de alto valor.</p></a>
				<a href="<?php echo esc_url( envuemex_page_url( 'servicios-de-campo' ) ); ?>"><img src="<?php echo esc_url( envuemex_image( 'page-about.jpg' ) ); ?>" alt=""><span>03</span><h3>Servicios de campo</h3><p>Más puntualidad y productividad para equipos móviles.</p></a>
				<a href="<?php echo esc_url( envuemex_page_url( 'distribucion-comercial' ) ); ?>"><img src="<?php echo esc_url( envuemex_image( 'page-dash-cams.jpg' ) ); ?>" alt=""><span>04</span><h3>Distribución comercial</h3><p>Evidencia, cumplimiento y servicio confiable.</p></a>
			</div>
		</div>
	</section>
	<section class="section journal">
		<div class="wrap">
			<div class="section-head compact">
				<div><span class="eyebrow">Recursos</span><h2>Conocimiento para gestores de flota.</h2></div>
				<a href="<?php echo esc_url( envuemex_page_url( 'blog' ) ); ?>">Ver todos los artículos →</a>
			</div>
			<div class="post-grid">
				<?php
				$latest = new WP_Query( array( 'post_type' => 'post', 'posts_per_page' => 3, 'post_status' => 'publish' ) );
				if ( $latest->have_posts() ) :
					while ( $latest->have_posts() ) :
						$latest->the_post();
						?>
						<article class="post-card">
							<span><?php echo esc_html( get_the_date( 'j M Y' ) ); ?></span>
							<h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
							<a class="read" href="<?php the_permalink(); ?>">Leer artículo →</a>
						</article>
						<?php
					endwhile;
					wp_reset_postdata();
				else :
					?>
					<article class="post-card"><span>Guía</span><h3>Telemática para flotas en México</h3><a class="read" href="<?php echo esc_url( envuemex_page_url( 'blog' ) ); ?>">Explorar recursos →</a></article>
					<article class="post-card"><span>Seguridad</span><h3>Cómo reducir riesgo operativo</h3><a class="read" href="<?php echo esc_url( envuemex_page_url( 'blog' ) ); ?>">Explorar recursos →</a></article>
					<article class="post-card"><span>Eficiencia</span><h3>Datos para decisiones de flota</h3><a class="read" href="<?php echo esc_url( envuemex_page_url( 'blog' ) ); ?>">Explorar recursos →</a></article>
				<?php endif; ?>
			</div>
		</div>
	</section>
</main>
<?php get_footer(); ?>
