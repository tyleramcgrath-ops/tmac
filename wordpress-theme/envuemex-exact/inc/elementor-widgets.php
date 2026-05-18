<?php
/**
 * EnVueMex Exact — Elementor widgets (v7.4.1).
 * Adds data-en attributes throughout so the front-end language toggle
 * (initLang in envuemex-exact.js) can swap content between ES and EN.
 *
 * @package envuemex-exact
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

abstract class EnVueMex_Base_Widget extends Widget_Base {
	protected function asset_url( $file ) { return esc_url( get_template_directory_uri() . '/assets/' . $file ); }
	protected function text_control( $id, $label, $default, $type = 'TEXT' ) {
		$this->add_control( $id, array(
			'label'       => $label,
			'type'        => $type === 'TEXTAREA' ? Controls_Manager::TEXTAREA : Controls_Manager::TEXT,
			'default'     => $default,
			'label_block' => true,
		) );
	}
	public function get_categories() { return array( 'envuemex' ); }
}

/* =========================================================
   Home hero
   ========================================================= */
class EnVueMex_Hero_Widget extends EnVueMex_Base_Widget {
	public function get_name()  { return 'envuemex_home_hero'; }
	public function get_title() { return 'EnVueMex Hero'; }
	public function get_icon()  { return 'eicon-slider-push'; }
	protected function register_controls() {
		$this->start_controls_section( 'content', array( 'label' => 'Hero Content (ES)' ) );
		$this->text_control( 'eyebrow',         'Eyebrow',          'EnVueMex Solutions' );
		$this->text_control( 'title',           'Headline (ES)',    'SOLUCIONES CONECTADAS PARA FLOTAS COMERCIALES EN MÉXICO', 'TEXTAREA' );
		$this->text_control( 'copy',            'Copy (ES)',        'Software innovador y personalizable de gestión de flota, rastreo de activos y soluciones de seguridad y cumplimiento normativo.', 'TEXTAREA' );
		$this->text_control( 'primary_label',   'Primary Button (ES)',   'Comience hoy' );
		$this->text_control( 'primary_url',     'Primary URL',           '/contacto/' );
		$this->text_control( 'secondary_label', 'Secondary Button (ES)', 'Descubre más' );
		$this->text_control( 'secondary_url',   'Secondary URL',         '#soluciones' );
		$this->add_control( 'image1', array( 'label' => 'Hero Image 1', 'type' => Controls_Manager::MEDIA, 'default' => array( 'url' => $this->asset_url( 'hero-truck-line.jpg' ) ) ) );
		$this->add_control( 'image2', array( 'label' => 'Hero Image 2', 'type' => Controls_Manager::MEDIA, 'default' => array( 'url' => $this->asset_url( 'hero-gps-rendering.jpg' ) ) ) );
		$this->add_control( 'image3', array( 'label' => 'Hero Image 3', 'type' => Controls_Manager::MEDIA, 'default' => array( 'url' => $this->asset_url( 'hero-lorry-yard.jpg' ) ) ) );
		$this->end_controls_section();

		$this->start_controls_section( 'content_en', array( 'label' => 'Hero Content (EN)' ) );
		$this->text_control( 'title_en',         'Headline (EN)',         'CONNECTED SOLUTIONS FOR COMMERCIAL FLEETS IN MEXICO', 'TEXTAREA' );
		$this->text_control( 'copy_en',          'Copy (EN)',             'Innovative, customizable fleet-management software, asset tracking, and safety &amp; compliance solutions.', 'TEXTAREA' );
		$this->text_control( 'primary_label_en', 'Primary Button (EN)',   'Get started' );
		$this->text_control( 'secondary_label_en','Secondary Button (EN)','Discover more' );
		$this->end_controls_section();
	}
	protected function render() {
		$s = $this->get_settings_for_display();
		// Italic-accent last word of headline (works for both ES + EN).
		$split = function( $t ) {
			$t = trim( (string) $t );
			$pos = strrpos( $t, ' ' );
			if ( $pos === false ) return '<h1>' . esc_html( $t ) . '</h1>';
			return esc_html( substr( $t, 0, $pos ) ) . ' <em>' . esc_html( substr( $t, $pos + 1 ) ) . '</em>';
		};
		$title_es_html = $split( $s['title'] );
		$title_en_html = $split( $s['title_en'] );
		?>
<section class="hero">
	<div class="hero-bg">
		<div class="hero-slide active"><img src="<?php echo esc_url( $s['image1']['url'] ); ?>" alt="Fila de camiones de flota"></div>
		<div class="hero-slide"><img src="<?php echo esc_url( $s['image2']['url'] ); ?>" alt="Camiones sobre mapa de rastreo GPS"></div>
		<div class="hero-slide"><img src="<?php echo esc_url( $s['image3']['url'] ); ?>" alt="Vista aérea de camiones en patio logístico"></div>
	</div>
	<div class="hero-frame"></div>
	<div class="hero-inner">
		<div>
			<div class="telemetry-strip" aria-hidden="true">
				<span class="tele-line">SYS · <strong>LIVE</strong></span>
				<span class="tele-line">NODES · <strong data-live="nodes" data-base="10234">10,234</strong></span>
				<span class="tele-line">POS · <strong data-live="lat">25.60°N · 100.30°W</strong></span>
				<span class="tele-line"><strong data-live="time">— UTC-6</strong></span>
			</div>
			<div class="eyebrow"><span class="pulse-dot"></span> <?php echo esc_html( $s['eyebrow'] ); ?></div>
			<h1 data-en="<?php echo esc_attr( $title_en_html ); ?>"><?php echo $title_es_html; // contains <em> ?></h1>
			<p class="hero-copy" data-en="<?php echo esc_attr( $s['copy_en'] ); ?>"><?php echo esc_html( $s['copy'] ); ?></p>
			<div class="hero-actions">
				<a class="btn btn-primary" href="<?php echo esc_url( $s['primary_url'] ); ?>" data-en="<?php echo esc_attr( $s['primary_label_en'] ); ?>"><?php echo esc_html( $s['primary_label'] ); ?></a>
				<a class="btn btn-on-dark" href="<?php echo esc_url( $s['secondary_url'] ); ?>" data-en="<?php echo esc_attr( $s['secondary_label_en'] ); ?>"><?php echo esc_html( $s['secondary_label'] ); ?></a>
			</div>
		</div>
		<aside class="command-panel">
			<div class="panel-head">
				<div class="panel-kicker" data-en="Telemetry · Live">Telemetría · Live</div>
				<div class="panel-status">ON-LINE</div>
			</div>
			<div class="panel-spark" aria-hidden="true">
				<svg viewBox="0 0 320 72" preserveAspectRatio="none">
					<defs>
						<linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
							<stop offset="0%" stop-color="#7be3ff" stop-opacity="0.4"/>
							<stop offset="100%" stop-color="#7be3ff" stop-opacity="0"/>
						</linearGradient>
					</defs>
					<path class="spark-fill" d="M0,60 C30,50 50,30 80,35 S140,65 170,40 220,15 260,28 310,52 320,42 L320,72 L0,72 Z"/>
					<path class="spark-line" d="M0,60 C30,50 50,30 80,35 S140,65 170,40 220,15 260,28 310,52 320,42"/>
					<circle class="spark-dot" cx="320" cy="42"/>
				</svg>
			</div>
			<div class="panel-meta">
				<span>VEL · <span data-live="speed">88 KM/H · AVG</span></span>
				<span>SIG · STRONG</span>
			</div>
			<div class="signal-grid">
				<div class="signal"><div class="metric-value">15</div><p data-en="Years in the<br>Mexican market">Años en el<br>mercado mexicano</p></div>
				<div class="signal"><div class="metric-value">2011</div><p data-en="Verified Geotab<br>partner">Socio Geotab<br>verificado</p></div>
				<div class="signal"><div class="metric-value">24/7</div><p data-en="Tracking and<br>continuous support">Rastreo y<br>soporte continuo</p></div>
			</div>
		</aside>
	</div>
	<div class="hero-dots">
		<button class="hero-dot active" type="button" data-slide="0" aria-label="Ver fila de camiones" data-en-attr="aria-label=View truck row"></button>
		<button class="hero-dot" type="button" data-slide="1" aria-label="Ver sistema GPS" data-en-attr="aria-label=View GPS system"></button>
		<button class="hero-dot" type="button" data-slide="2" aria-label="Ver patio logístico" data-en-attr="aria-label=View logistics yard"></button>
	</div>
</section><?php
	}
}

/* =========================================================
   Route strip
   ========================================================= */
class EnVueMex_Route_Widget extends EnVueMex_Base_Widget {
	public function get_name()  { return 'envuemex_route'; }
	public function get_title() { return 'EnVueMex Route Strip'; }
	public function get_icon()  { return 'eicon-columns'; }
	protected function register_controls() {}
	protected function render() { ?>
<div class="route-strip">
	<div class="route-inner">
		<div class="route-item"><span data-en="Difference">Diferencia</span><strong data-en="Safety, experience, reliability and service">Seguridad, experiencia, confiabilidad y servicio</strong></div>
		<div class="route-item"><span data-en="Specialty">Especialidad</span><strong data-en="Commercial fleet management">Gestión de flotas comerciales</strong></div>
		<div class="route-item"><span data-en="Platform">Plataforma</span><strong data-en="Leading Geotab partner">Socio líder de Geotab</strong></div>
		<div class="route-item"><span data-en="Support">Soporte</span><strong data-en="Implementation and ongoing care">Implementación y acompañamiento</strong></div>
	</div>
</div><?php
	}
}

/* =========================================================
   Difference section
   ========================================================= */
class EnVueMex_Difference_Widget extends EnVueMex_Base_Widget {
	public function get_name()  { return 'envuemex_difference'; }
	public function get_title() { return 'EnVueMex Difference Section'; }
	public function get_icon()  { return 'eicon-info-box'; }
	protected function register_controls() {
		$this->start_controls_section( 'content', array( 'label' => 'Content (ES)' ) );
		$this->text_control( 'label', 'Label', 'Diferencia EnVueMex' );
		$this->text_control( 'title', 'Title', '¿Por qué escoger a EnVueMex Solutions?', 'TEXTAREA' );
		$this->text_control( 'lead',  'Lead',  'Gestionar flotas comerciales en México es más complejo que nunca. Te ayudamos a vencer los desafíos competitivos, regulatorios y operativos con tecnología y acompañamiento experto.', 'TEXTAREA' );
		$this->end_controls_section();
		$this->start_controls_section( 'content_en', array( 'label' => 'Content (EN)' ) );
		$this->text_control( 'label_en', 'Label (EN)', 'EnVueMex Difference' );
		$this->text_control( 'title_en', 'Title (EN)', 'Why choose EnVueMex Solutions?', 'TEXTAREA' );
		$this->text_control( 'lead_en',  'Lead (EN)',  'Managing commercial fleets in Mexico is more complex than ever. We help you beat the competitive, regulatory and operational challenges with technology and expert support.', 'TEXTAREA' );
		$this->end_controls_section();
	}
	protected function render() {
		$s = $this->get_settings_for_display();
		// Helper: split last word into <em> for italic accent
		$split = function( $t ) {
			$t = trim( (string) $t );
			$pos = strrpos( $t, ' ' );
			if ( $pos === false ) return esc_html( $t );
			return esc_html( substr( $t, 0, $pos ) ) . ' <em>' . esc_html( substr( $t, $pos + 1 ) ) . '</em>';
		};
		?>
<section class="section" id="diferencia">
	<div class="inner section-grid">
		<div data-reveal>
			<div class="section-label" data-en="<?php echo esc_attr( $s['label_en'] ); ?>"><?php echo esc_html( $s['label'] ); ?></div>
			<h2 data-en="<?php echo esc_attr( $split( $s['title_en'] ) ); ?>"><?php echo $split( $s['title'] ); ?></h2>
			<p class="lead" data-en="<?php echo esc_attr( $s['lead_en'] ); ?>"><?php echo esc_html( $s['lead'] ); ?></p>
		</div>
		<div class="difference-rail">
			<article class="diff-row" data-reveal>
				<h3 data-en="Safety">Seguridad</h3>
				<p data-en="Our products deliver enhanced fleet safety, backed by deep know-how on getting the most from connected devices.">Nuestros productos ofrecen seguridad mejorada para las flotas, respaldada por nuestra destreza en cómo aprovechar mejor los dispositivos conectados.</p>
			</article>
			<article class="diff-row" data-reveal>
				<h3 data-en="Experience">Experiencia</h3>
				<p data-en="With 15 years in the market, EnVueMex extends to Latin America the mastery of the world's first Geotab distributor.">Con 15 años en el mercado, EnVueMex extiende al mercado latinoamericano la maestría del primer distribuidor mundial de Geotab.</p>
			</article>
			<article class="diff-row" data-reveal>
				<h3 data-en="Reliability">Confiabilidad</h3>
				<p data-en="We build long-term relationships: we advise you on the products, technology and tools that improve your fleet's performance.">Construimos relaciones de largo plazo: te aconsejamos en los productos, tecnología y herramientas que mejoran el rendimiento de tu flota.</p>
			</article>
			<article class="diff-row" data-reveal>
				<h3 data-en="Service">Servicio</h3>
				<p data-en="EnVueMex provides support long after the purchase, helping customers get the most effective use from their investments.">EnVueMex provee soporte mucho después de la compra, ayudando a los clientes a darle a sus inversiones el uso más efectivo posible.</p>
			</article>
		</div>
	</div>
</section><?php
	}
}

/* =========================================================
   Solutions (dark)
   ========================================================= */
class EnVueMex_Solutions_Widget extends EnVueMex_Base_Widget {
	public function get_name()  { return 'envuemex_solutions'; }
	public function get_title() { return 'EnVueMex Solutions Section'; }
	public function get_icon()  { return 'eicon-editor-list-ul'; }
	protected function register_controls() {}
	protected function render() {
		$gps = esc_url( home_url( '/soluciones-de-rastreo-gps/' ) );
		$dash = esc_url( home_url( '/dash-cams/' ) );
		$assets = esc_url( home_url( '/rastreadores-de-activos-no-vehiculares/' ) );
		?>
<section class="section dark" id="soluciones">
	<div class="inner">
		<div data-reveal>
			<div class="section-label" data-en="Fleet management solutions">Soluciones de gestión de flotas</div>
			<h2 data-en="Backed by two decades of experience in the <em>transport</em> industry.">Respaldado por dos décadas de experiencia en la industria del <em>transporte.</em></h2>
			<p class="lead" data-en="EnVueMex Solutions delivers solutions that reduce fleet costs, increase efficiency, automate data reports and maintain regulatory compliance.">EnVueMex Solutions provee soluciones que reducen costos de flota, incrementan eficiencia, automatizan reportes de datos y mantienen el cumplimiento normativo.</p>
		</div>
		<div class="solution-list">
			<a class="solution-row" href="<?php echo $gps; ?>" data-reveal>
				<div class="solution-index">01</div>
				<div>
					<h3 data-en="GPS Tracking Solutions">Soluciones de Rastreo GPS</h3>
					<p data-en="GPS tracking devices and systems that make fleets more efficient and cost-effective.">Dispositivos y sistemas de rastreo GPS que vuelven las flotas más eficientes y efectivas en costo.</p>
				</div>
				<div class="arrow" aria-hidden="true">→</div>
			</a>
			<a class="solution-row" href="<?php echo $dash; ?>" data-reveal>
				<div class="solution-index">02</div>
				<div>
					<h3 data-en="Dash Cams">Cámaras de Tablero</h3>
					<p data-en="Vehicle camera systems that are key to managing fleet risk and making the roads safer.">Sistemas de cámaras vehiculares clave para gestionar riesgos de flota y hacer los caminos más seguros.</p>
				</div>
				<div class="arrow" aria-hidden="true">→</div>
			</a>
			<a class="solution-row" href="<?php echo $assets; ?>" data-reveal>
				<div class="solution-index">03</div>
				<div>
					<h3 data-en="Non-Vehicle Asset Trackers">Rastreadores de Activos no Vehiculares</h3>
					<p data-en="Heavy construction and agriculture equipment, ATVs, generators, compressors and more.">Equipo pesado de construcción y agricultura, ATVs, generadores, compresores y más.</p>
				</div>
				<div class="arrow" aria-hidden="true">→</div>
			</a>
		</div>
	</div>
</section><?php
	}
}

/* =========================================================
   Feature splits
   ========================================================= */
class EnVueMex_Features_Widget extends EnVueMex_Base_Widget {
	public function get_name()  { return 'envuemex_features'; }
	public function get_title() { return 'EnVueMex Feature Splits'; }
	public function get_icon()  { return 'eicon-image-box'; }
	protected function register_controls() {
		$this->start_controls_section( 'images', array( 'label' => 'Images' ) );
		$this->add_control( 'image1', array( 'label' => 'Dashcam Image', 'type' => Controls_Manager::MEDIA, 'default' => array( 'url' => $this->asset_url( 'home-dashcams.jpg' ) ) ) );
		$this->add_control( 'image2', array( 'label' => 'Geotab Image',  'type' => Controls_Manager::MEDIA, 'default' => array( 'url' => $this->asset_url( 'geotab-go.jpg' ) ) ) );
		$this->end_controls_section();
	}
	protected function render() {
		$s = $this->get_settings_for_display(); ?>
<section>
	<div class="feature-split">
		<figure class="feature-image"><img src="<?php echo esc_url( $s['image1']['url'] ); ?>" alt="Dash cams" loading="lazy"></figure>
		<div class="feature-copy" data-reveal>
			<div class="section-label" data-en="Let us worry about your fleet">Preocupémonos de su flota</div>
			<h2 data-en="A full suite of <em>telematic</em> products.">Ofrecemos una suite completa de productos <em>telemáticos.</em></h2>
			<p data-en="Whether you're looking for GPS, dash cams or non-vehicle asset tracking, EnVueMex has the solution and the team to implement it.">Ya sea que busque GPS, dash-cams o rastreo de activos no vehiculares, EnVueMex tiene la solución y el equipo para implementarla.</p>
			<a class="btn btn-primary" href="<?php echo esc_url( home_url( '/contacto/' ) ); ?>" data-en="Get started">Comience hoy</a>
		</div>
	</div>
	<div class="feature-split" id="geotab">
		<figure class="feature-image"><img src="<?php echo esc_url( $s['image2']['url'] ); ?>" alt="Dispositivo Geotab GO" loading="lazy"></figure>
		<div class="feature-copy" data-reveal>
			<div class="section-label" data-en="Leading Geotab partner">Socio líder de Geotab</div>
			<h2 data-en="Trusted partnership with Geotab since <em>2011.</em>">Asociación de confianza con Geotab desde <em>2011.</em></h2>
			<p data-en="Our strategic alliance with Geotab lets us personally handle every telematic need, backed by the world's largest distributor.">Nuestra alianza estratégica con Geotab nos permite atender personalmente todas sus necesidades telemáticas, con el respaldo del mayor distribuidor a nivel mundial.</p>
			<a class="btn btn-light" href="#diferencia" data-en="Learn more about us">Conoce más sobre nosotros</a>
		</div>
	</div>
</section><?php
	}
}

/* =========================================================
   Proof stats
   ========================================================= */
class EnVueMex_Proof_Widget extends EnVueMex_Base_Widget {
	public function get_name()  { return 'envuemex_proof'; }
	public function get_title() { return 'EnVueMex Proof Stats'; }
	public function get_icon()  { return 'eicon-counter'; }
	protected function register_controls() {}
	protected function render() { ?>
<section class="proof">
	<div class="proof-item" data-reveal><strong>15</strong><span data-en="years in the Mexican market">años de experiencia en el mercado</span></div>
	<div class="proof-item" data-reveal><strong>2011</strong><span data-en="trusted partnership with Geotab">asociación de confianza con Geotab</span></div>
	<div class="proof-item" data-reveal><strong>3</strong><span data-en="core telematic solution lines">líneas principales de soluciones telemáticas</span></div>
	<div class="proof-item" data-reveal><strong>24/7</strong><span data-en="fleet, asset and safety visibility">visibilidad de flota, activos y seguridad</span></div>
</section><?php
	}
}

/* =========================================================
   CTA + footer
   ========================================================= */
class EnVueMex_CTA_Widget extends EnVueMex_Base_Widget {
	public function get_name()  { return 'envuemex_cta_footer'; }
	public function get_title() { return 'EnVueMex CTA + Footer'; }
	public function get_icon()  { return 'eicon-call-to-action'; }
	protected function register_controls() {}
	protected function render() { ?>
<section class="cta" id="contacto-cta">
	<div class="cta-inner">
		<div data-reveal>
			<div class="section-label" data-en="Become a customer">Conviértete en cliente</div>
			<h2 data-en="Talk to our qualified <em>advisor.</em>">Hable con nuestro asesor <em>calificado.</em></h2>
			<p data-en="Start today with connected solutions for commercial fleets in Mexico. Same-day business response.">Comience hoy con soluciones conectadas para flotas comerciales en México. Le respondemos el mismo día hábil.</p>
		</div>
		<div class="cta-actions" data-reveal>
			<a class="btn btn-primary" href="mailto:ventas@et-envue.com">ventas@et-envue.com</a>
			<a class="btn btn-on-dark" href="tel:8121880258">81 2188 0258</a>
		</div>
	</div>
</section>

<footer>
	<div class="footer-grid">
		<div>
			<div class="footer-logo"><img src="<?php echo $this->asset_url( 'envuemex-logo.webp' ); ?>" alt="EnVueMex Solutions"></div>
			<p data-en="Connected solutions for commercial fleets in Mexico, with expert support and Geotab-leading technology.">Soluciones conectadas para flotas comerciales en México, con soporte experto y tecnología líder de Geotab.</p>
		</div>
		<div>
			<h4 data-en="Solutions">Soluciones</h4>
			<ul>
				<li><a href="<?php echo esc_url( home_url( '/soluciones-de-rastreo-gps/' ) ); ?>" data-en="GPS Tracking">Rastreo GPS</a></li>
				<li><a href="<?php echo esc_url( home_url( '/dash-cams/' ) ); ?>" data-en="Dash cams">Dash cams</a></li>
				<li><a href="<?php echo esc_url( home_url( '/rastreadores-de-activos-no-vehiculares/' ) ); ?>" data-en="Non-vehicle assets">Activos no vehiculares</a></li>
				<li><a href="<?php echo esc_url( home_url( '/servicios/' ) ); ?>" data-en="Fleet management">Gestión de flota</a></li>
			</ul>
		</div>
		<div>
			<h4 data-en="Company">Empresa</h4>
			<ul>
				<li><a href="<?php echo esc_url( home_url( '/acerca-de-nosotros/' ) ); ?>" data-en="About">Nosotros</a></li>
				<li><a href="<?php echo esc_url( home_url( '/corporate-faq/' ) ); ?>">FAQ</a></li>
				<li><a href="<?php echo esc_url( home_url( '/calendario-de-eventos/' ) ); ?>" data-en="Events">Eventos</a></li>
				<li><a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>">Blog</a></li>
			</ul>
		</div>
		<div>
			<h4 data-en="Contact">Contacto</h4>
			<ul>
				<li>Blvd. Díaz Ordaz 3102, Piso 2</li>
				<li>Santa María, 64650 Monterrey, N.L.</li>
				<li><a href="tel:8121880258">81 2188 0258</a></li>
				<li><a href="mailto:ventas@et-envue.com">ventas@et-envue.com</a></li>
			</ul>
		</div>
	</div>
	<div class="footer-bottom">
		<span data-en="© <?php echo esc_attr( gmdate( 'Y' ) ); ?> EnVueMex Solutions. All rights reserved.">© <?php echo esc_html( gmdate( 'Y' ) ); ?> EnVueMex Solutions. Todos los derechos reservados.</span>
		<span data-en="Fleet management · Safety · Compliance">Gestión de flotas, seguridad y cumplimiento normativo.</span>
	</div>
</footer><?php
	}
}

/* =========================================================
   Inner page content
   ========================================================= */
class EnVueMex_Page_Content_Widget extends EnVueMex_Base_Widget {
	public function get_name()  { return 'envuemex_page_content'; }
	public function get_title() { return 'EnVueMex Inner Page Content'; }
	public function get_icon()  { return 'eicon-document-file'; }
	protected function register_controls() {
		$this->start_controls_section( 'content', array( 'label' => 'Page Content (ES)' ) );
		$this->text_control( 'title', 'Title (ES)', 'Servicios' );
		$this->text_control( 'label', 'Label (ES)', 'Bienvenido a EnVueMex' );
		$this->text_control( 'intro', 'Intro (ES)', 'Gracias por visitarnos.', 'TEXTAREA' );
		$this->add_control( 'hero_image', array( 'label' => 'Hero Image', 'type' => Controls_Manager::MEDIA, 'default' => array( 'url' => $this->asset_url( 'hero-truck-line.jpg' ) ) ) );
		$this->add_control( 'body_html', array( 'label' => 'Body HTML', 'type' => Controls_Manager::WYSIWYG, 'default' => '' ) );
		$this->end_controls_section();
		$this->start_controls_section( 'content_en', array( 'label' => 'Page Content (EN)' ) );
		$this->text_control( 'title_en', 'Title (EN)', 'Services' );
		$this->text_control( 'label_en', 'Label (EN)', 'Welcome to EnVueMex' );
		$this->text_control( 'intro_en', 'Intro (EN)', 'Thanks for visiting.', 'TEXTAREA' );
		$this->add_control( 'body_html_en', array( 'label' => 'Body HTML (EN)', 'type' => Controls_Manager::WYSIWYG, 'default' => '' ) );
		$this->end_controls_section();
	}
	protected function render() {
		$s = $this->get_settings_for_display();
		$body_es = wp_kses_post( $s['body_html'] );
		$body_en = ! empty( $s['body_html_en'] ) ? wp_kses_post( $s['body_html_en'] ) : $body_es;
		?>
<div class="emx-page-simple">
	<section class="emx-page-hero" style="background-image:url('<?php echo esc_url( $s['hero_image']['url'] ); ?>')">
		<div class="emx-page-hero-inner" data-reveal>
			<div class="eyebrow"><span class="pulse-dot"></span> <span data-en="<?php echo esc_attr( $s['label_en'] ); ?>"><?php echo esc_html( $s['label'] ); ?></span></div>
			<h1 data-en="<?php echo esc_attr( $s['title_en'] ); ?>"><?php echo esc_html( $s['title'] ); ?></h1>
			<p data-en="<?php echo esc_attr( $s['intro_en'] ); ?>"><?php echo esc_html( $s['intro'] ); ?></p>
		</div>
	</section>
	<section class="emx-page-content">
		<div class="emx-page-content-inner emx-prose" data-en="<?php echo esc_attr( $body_en ); ?>"><?php echo $body_es; ?></div>
	</section>
</div><?php
	}
}

/* =========================================================
   Contact form widget
   ========================================================= */
class EnVueMex_Contact_Widget extends EnVueMex_Base_Widget {
	public function get_name()  { return 'envuemex_contact'; }
	public function get_title() { return 'EnVueMex Contact Form'; }
	public function get_icon()  { return 'eicon-form-horizontal'; }
	protected function register_controls() {
		$this->start_controls_section( 'content', array( 'label' => 'Content' ) );
		$this->text_control( 'label', 'Label', 'Contacto' );
		$this->text_control( 'title', 'Title', 'Cuéntanos sobre tu flota.', 'TEXTAREA' );
		$this->text_control( 'intro', 'Intro', 'Te respondemos el mismo día hábil con una propuesta a la medida.', 'TEXTAREA' );
		$this->text_control( 'email', 'Email', 'ventas@et-envue.com' );
		$this->text_control( 'phone', 'Phone', '81 2188 0258' );
		$this->text_control( 'address', 'Address', 'Blvd. Díaz Ordaz 3102, Piso 2, Santa María, 64650 Monterrey, N.L.', 'TEXTAREA' );
		$this->end_controls_section();
	}
	protected function render() {
		$s = $this->get_settings_for_display();
		$nonce = wp_create_nonce( 'emx_contact' );
		?>
<section class="section">
	<div class="inner emx-contact">
		<div class="emx-contact-info" data-reveal>
			<div class="section-label" data-en="Contact"><?php echo esc_html( $s['label'] ); ?></div>
			<h2 data-en="Tell us about your <em>fleet.</em>"><?php echo esc_html( $s['title'] ); ?></h2>
			<p class="lead" data-en="We get back to you within one business day with a tailored proposal."><?php echo esc_html( $s['intro'] ); ?></p>
			<ul>
				<li><span data-en="Email">Correo</span><a href="mailto:<?php echo esc_attr( $s['email'] ); ?>"><?php echo esc_html( $s['email'] ); ?></a></li>
				<li><span data-en="Phone">Teléfono</span><a href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', $s['phone'] ) ); ?>"><?php echo esc_html( $s['phone'] ); ?></a></li>
				<li><span data-en="Offices">Oficinas</span><span><?php echo esc_html( $s['address'] ); ?></span></li>
				<li><span data-en="Hours">Horario</span><span data-en="Mon–Fri 9:00–18:00 · 24/7 critical support">Lun–Vie 9:00–18:00 · soporte crítico 24/7</span></li>
			</ul>
		</div>
		<form class="emx-form" data-emx-form data-reveal>
			<input type="hidden" name="emx_nonce" value="<?php echo esc_attr( $nonce ); ?>">
			<input type="text" name="emx_hp" autocomplete="off" tabindex="-1" style="position:absolute;left:-9999px;height:0;width:0;opacity:0" aria-hidden="true">
			<div class="emx-field">
				<label for="emx-name" data-en="Name">Nombre</label>
				<input id="emx-name" name="name" type="text" autocomplete="name" required>
			</div>
			<div class="emx-field">
				<label for="emx-company" data-en="Company">Empresa</label>
				<input id="emx-company" name="company" type="text" autocomplete="organization" required>
			</div>
			<div class="emx-field">
				<label for="emx-email" data-en="Work email">Correo de trabajo</label>
				<input id="emx-email" name="email" type="email" autocomplete="email" required>
			</div>
			<div class="emx-field">
				<label for="emx-phone" data-en="Phone">Teléfono</label>
				<input id="emx-phone" name="phone" type="tel" autocomplete="tel">
			</div>
			<div class="emx-field">
				<label for="emx-size" data-en="Fleet size">Tamaño de flota</label>
				<select id="emx-size" name="fleet_size">
					<option value="1-10" data-en="1 — 10 units">1 — 10</option>
					<option value="11-50" data-en="11 — 50 units">11 — 50</option>
					<option value="51-200" data-en="51 — 200 units">51 — 200</option>
					<option value="200+" data-en="200+ units">200+</option>
				</select>
			</div>
			<div class="emx-field">
				<label for="emx-interest" data-en="Primary interest">Interés principal</label>
				<select id="emx-interest" name="interest">
					<option value="gps" data-en="GPS Tracking">Rastreo GPS</option>
					<option value="dashcam" data-en="Dash cams">Dash cams</option>
					<option value="assets" data-en="Non-vehicle assets">Activos no vehiculares</option>
					<option value="all" data-en="Full solution">Solución integral</option>
				</select>
			</div>
			<div class="emx-field is-full">
				<label for="emx-message" data-en="How can we help?">¿Cómo podemos ayudarte?</label>
				<textarea id="emx-message" name="message" rows="4"></textarea>
			</div>
			<div class="emx-form-status" role="status" aria-live="polite"></div>
			<button class="btn btn-primary" type="submit" data-en="Send request">Enviar solicitud</button>
			<p class="emx-form-note" data-en="By submitting you accept that we'll contact you about your request. We don't share your data.">Al enviar aceptas que te contactemos sobre tu solicitud. No compartimos tus datos.</p>
		</form>
	</div>
</section><?php
	}
}

/* =========================================================
   Registration
   ========================================================= */
function envuemex_register_elementor_widgets( $widgets_manager ) {
	$widgets_manager->register( new \EnVueMex_Hero_Widget() );
	$widgets_manager->register( new \EnVueMex_Route_Widget() );
	$widgets_manager->register( new \EnVueMex_Difference_Widget() );
	$widgets_manager->register( new \EnVueMex_Solutions_Widget() );
	$widgets_manager->register( new \EnVueMex_Features_Widget() );
	$widgets_manager->register( new \EnVueMex_Proof_Widget() );
	$widgets_manager->register( new \EnVueMex_CTA_Widget() );
	$widgets_manager->register( new \EnVueMex_Page_Content_Widget() );
	$widgets_manager->register( new \EnVueMex_Contact_Widget() );
}
add_action( 'elementor/widgets/register', 'envuemex_register_elementor_widgets' );

add_action( 'elementor/elements/categories_registered', function ( $elements_manager ) {
	$elements_manager->add_category( 'envuemex', array(
		'title' => 'EnVueMex Sections',
		'icon'  => 'fa fa-plug',
	) );
} );
