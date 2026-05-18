<?php
/**
 * EnVueMex Exact — Elementor widgets (v7.2).
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
		$this->start_controls_section( 'content', array( 'label' => 'Hero Content' ) );
		$this->text_control( 'eyebrow',         'Eyebrow',          'EnVueMex Solutions' );
		$this->text_control( 'title',           'Headline',         'SOLUCIONES CONECTADAS PARA FLOTAS COMERCIALES EN MÉXICO', 'TEXTAREA' );
		$this->text_control( 'copy',            'Copy',             'Software innovador y personalizable de gestión de flota, rastreo de activos y soluciones de seguridad y cumplimiento normativo.', 'TEXTAREA' );
		$this->text_control( 'primary_label',   'Primary Button',   'Comience hoy' );
		$this->text_control( 'primary_url',     'Primary URL',      '/contacto/' );
		$this->text_control( 'secondary_label', 'Secondary Button', 'Descubre más' );
		$this->text_control( 'secondary_url',   'Secondary URL',    '#soluciones' );
		$this->add_control( 'image1', array( 'label' => 'Hero Image 1', 'type' => Controls_Manager::MEDIA, 'default' => array( 'url' => $this->asset_url( 'hero-truck-line.jpg' ) ) ) );
		$this->add_control( 'image2', array( 'label' => 'Hero Image 2', 'type' => Controls_Manager::MEDIA, 'default' => array( 'url' => $this->asset_url( 'hero-gps-rendering.jpg' ) ) ) );
		$this->add_control( 'image3', array( 'label' => 'Hero Image 3', 'type' => Controls_Manager::MEDIA, 'default' => array( 'url' => $this->asset_url( 'hero-lorry-yard.jpg' ) ) ) );
		$this->end_controls_section();
	}
	protected function render() {
		$s = $this->get_settings_for_display(); ?>
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
				<span class="tele-line">SYS · LIVE</span>
				<span class="tele-line">NODES · 10,234</span>
				<span class="tele-line">LAT 25.6°N · LON 100.3°W</span>
			</div>
			<div class="eyebrow"><span class="pulse-dot"></span> <?php echo esc_html( $s['eyebrow'] ); ?></div>
			<h1><?php echo esc_html( $s['title'] ); ?></h1>
			<p class="hero-copy"><?php echo esc_html( $s['copy'] ); ?></p>
			<div class="hero-actions">
				<a class="btn btn-primary" href="<?php echo esc_url( $s['primary_url'] ); ?>"><?php echo esc_html( $s['primary_label'] ); ?></a>
				<a class="btn btn-on-dark" href="<?php echo esc_url( $s['secondary_url'] ); ?>"><?php echo esc_html( $s['secondary_label'] ); ?></a>
			</div>
		</div>
		<aside class="command-panel">
			<div class="panel-head">
				<div class="panel-kicker">Telemetría · Live</div>
				<div class="panel-status">ON-LINE</div>
			</div>
			<div class="signal"><div class="metric-value">15</div><p>Años en el<br>mercado mexicano</p></div>
			<div class="signal"><div class="metric-value">2011</div><p>Socio Geotab<br>verificado</p></div>
			<div class="signal"><div class="metric-value">24/7</div><p>Rastreo y<br>soporte continuo</p></div>
		</aside>
	</div>
	<div class="hero-dots">
		<button class="hero-dot active" type="button" data-slide="0" aria-label="Ver fila de camiones"></button>
		<button class="hero-dot" type="button" data-slide="1" aria-label="Ver sistema GPS"></button>
		<button class="hero-dot" type="button" data-slide="2" aria-label="Ver patio logístico"></button>
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
		<div class="route-item" data-reveal><span>Diferencia</span><strong>Seguridad, experiencia, confiabilidad y servicio</strong></div>
		<div class="route-item" data-reveal><span>Especialidad</span><strong>Gestión de flotas comerciales</strong></div>
		<div class="route-item" data-reveal><span>Plataforma</span><strong>Socio líder de Geotab</strong></div>
		<div class="route-item" data-reveal><span>Soporte</span><strong>Implementación y acompañamiento</strong></div>
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
		$this->start_controls_section( 'content', array( 'label' => 'Content' ) );
		$this->text_control( 'label', 'Label', 'Diferencia EnVueMex' );
		$this->text_control( 'title', 'Title', '¿Por qué escoger a EnVueMex Solutions?', 'TEXTAREA' );
		$this->text_control( 'lead',  'Lead',  'Gestionar flotas comerciales en México es más complejo que nunca. Te ayudamos a vencer los desafíos competitivos, regulatorios y operativos con tecnología y acompañamiento experto.', 'TEXTAREA' );
		$this->end_controls_section();
	}
	protected function render() {
		$s = $this->get_settings_for_display(); ?>
<section class="section" id="diferencia">
	<div class="inner section-grid">
		<div data-reveal>
			<div class="section-label"><?php echo esc_html( $s['label'] ); ?></div>
			<h2><?php echo esc_html( $s['title'] ); ?></h2>
			<p class="lead"><?php echo esc_html( $s['lead'] ); ?></p>
		</div>
		<div class="difference-rail">
			<article class="diff-row" data-reveal>
				<h3>Seguridad</h3>
				<p>Nuestros productos ofrecen seguridad mejorada para las flotas, respaldada por nuestra destreza en cómo aprovechar mejor los dispositivos conectados.</p>
			</article>
			<article class="diff-row" data-reveal>
				<h3>Experiencia</h3>
				<p>Con 15 años en el mercado, EnVueMex extiende al mercado latinoamericano la maestría del primer distribuidor mundial de Geotab.</p>
			</article>
			<article class="diff-row" data-reveal>
				<h3>Confiabilidad</h3>
				<p>Construimos relaciones de largo plazo: te aconsejamos en los productos, tecnología y herramientas que mejoran el rendimiento de tu flota.</p>
			</article>
			<article class="diff-row" data-reveal>
				<h3>Servicio</h3>
				<p>EnVueMex provee soporte mucho después de la compra, ayudando a los clientes a darle a sus inversiones el uso más efectivo posible.</p>
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
			<div class="section-label">Soluciones de gestión de flotas</div>
			<h2>Respaldado por dos décadas de experiencia en la industria del transporte</h2>
			<p class="lead">EnVueMex Solutions provee soluciones que reducen costos de flota, incrementan eficiencia, automatizan reportes de datos y mantienen el cumplimiento normativo.</p>
		</div>
		<div class="solution-list">
			<a class="solution-row" href="<?php echo $gps; ?>" data-reveal>
				<div class="solution-index">01</div>
				<div>
					<h3>Soluciones de Rastreo GPS</h3>
					<p>Dispositivos y sistemas de rastreo GPS que vuelven las flotas más eficientes y efectivas en costo.</p>
				</div>
				<div class="arrow" aria-hidden="true">→</div>
			</a>
			<a class="solution-row" href="<?php echo $dash; ?>" data-reveal>
				<div class="solution-index">02</div>
				<div>
					<h3>Cámaras de Tablero</h3>
					<p>Sistemas de cámaras vehiculares clave para gestionar riesgos de flota y hacer los caminos más seguros.</p>
				</div>
				<div class="arrow" aria-hidden="true">→</div>
			</a>
			<a class="solution-row" href="<?php echo $assets; ?>" data-reveal>
				<div class="solution-index">03</div>
				<div>
					<h3>Rastreadores de Activos no Vehiculares</h3>
					<p>Equipo pesado de construcción y agricultura, ATVs, generadores, compresores y más.</p>
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
		$this->add_control( 'image2', array( 'label' => 'Geotab Image',  'type' => Controls_Manager::MEDIA, 'default' => array( 'url' => $this->asset_url( 'geotab-award.webp' ) ) ) );
		$this->end_controls_section();
	}
	protected function render() {
		$s = $this->get_settings_for_display(); ?>
<section>
	<div class="feature-split">
		<figure class="feature-image"><img src="<?php echo esc_url( $s['image1']['url'] ); ?>" alt="Dash cams" loading="lazy"></figure>
		<div class="feature-copy" data-reveal>
			<div class="section-label">Preocupémonos de su flota</div>
			<h2>Ofrecemos una suite completa de productos telemáticos</h2>
			<p>Ya sea que busque GPS, dash-cams o rastreo de activos no vehiculares, EnVueMex tiene la solución y el equipo para implementarla.</p>
			<a class="btn btn-primary" href="<?php echo esc_url( home_url( '/contacto/' ) ); ?>">Comience hoy</a>
		</div>
	</div>
	<div class="feature-split" id="geotab">
		<figure class="feature-image"><img src="<?php echo esc_url( $s['image2']['url'] ); ?>" alt="Geotab Connect Innovation Award 2023" loading="lazy"></figure>
		<div class="feature-copy" data-reveal>
			<div class="section-label">Socio líder de Geotab</div>
			<h2>Asociación de confianza con Geotab desde 2011</h2>
			<p>Nuestra alianza estratégica con Geotab nos permite atender personalmente todas sus necesidades telemáticas, con el respaldo del mayor distribuidor a nivel mundial.</p>
			<a class="btn btn-light" href="#diferencia">Conoce más sobre nosotros</a>
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
	<div class="proof-item" data-reveal><strong>15</strong><span>años de experiencia en el mercado</span></div>
	<div class="proof-item" data-reveal><strong>2011</strong><span>asociación de confianza con Geotab</span></div>
	<div class="proof-item" data-reveal><strong>3</strong><span>líneas principales de soluciones telemáticas</span></div>
	<div class="proof-item" data-reveal><strong>24/7</strong><span>visibilidad de flota, activos y seguridad</span></div>
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
			<div class="section-label">Conviértete en cliente</div>
			<h2>Hable con nuestro asesor calificado</h2>
			<p>Comience hoy con soluciones conectadas para flotas comerciales en México. Le respondemos el mismo día hábil.</p>
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
			<p>Soluciones conectadas para flotas comerciales en México, con soporte experto y tecnología líder de Geotab.</p>
		</div>
		<div>
			<h4>Soluciones</h4>
			<ul>
				<li><a href="<?php echo esc_url( home_url( '/soluciones-de-rastreo-gps/' ) ); ?>">Rastreo GPS</a></li>
				<li><a href="<?php echo esc_url( home_url( '/dash-cams/' ) ); ?>">Dash cams</a></li>
				<li><a href="<?php echo esc_url( home_url( '/rastreadores-de-activos-no-vehiculares/' ) ); ?>">Activos no vehiculares</a></li>
				<li><a href="<?php echo esc_url( home_url( '/servicios/' ) ); ?>">Gestión de flota</a></li>
			</ul>
		</div>
		<div>
			<h4>Empresa</h4>
			<ul>
				<li><a href="<?php echo esc_url( home_url( '/acerca-de-nosotros/' ) ); ?>">Nosotros</a></li>
				<li><a href="<?php echo esc_url( home_url( '/corporate-faq/' ) ); ?>">FAQ</a></li>
				<li><a href="<?php echo esc_url( home_url( '/calendario-de-eventos/' ) ); ?>">Eventos</a></li>
				<li><a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>">Blog</a></li>
			</ul>
		</div>
		<div>
			<h4>Contacto</h4>
			<ul>
				<li>Blvd. Díaz Ordaz 3102, Piso 2</li>
				<li>Santa María, 64650 Monterrey, N.L.</li>
				<li><a href="tel:8121880258">81 2188 0258</a></li>
				<li><a href="mailto:ventas@et-envue.com">ventas@et-envue.com</a></li>
			</ul>
		</div>
	</div>
	<div class="footer-bottom">
		<span>© <?php echo esc_html( gmdate( 'Y' ) ); ?> EnVueMex Solutions. Todos los derechos reservados.</span>
		<span>Gestión de flotas, seguridad y cumplimiento normativo.</span>
	</div>
</footer><?php
	}
}

/* =========================================================
   Inner page content (real per-page sections)
   ========================================================= */
class EnVueMex_Page_Content_Widget extends EnVueMex_Base_Widget {
	public function get_name()  { return 'envuemex_page_content'; }
	public function get_title() { return 'EnVueMex Inner Page Content'; }
	public function get_icon()  { return 'eicon-document-file'; }
	protected function register_controls() {
		$this->start_controls_section( 'content', array( 'label' => 'Page Content' ) );
		$this->text_control( 'title', 'Title', 'Servicios' );
		$this->text_control( 'label', 'Label', 'Bienvenido a EnVueMex' );
		$this->text_control( 'intro', 'Intro', 'Gracias por visitarnos.', 'TEXTAREA' );
		$this->add_control( 'hero_image', array( 'label' => 'Hero Image', 'type' => Controls_Manager::MEDIA, 'default' => array( 'url' => $this->asset_url( 'hero-truck-line.jpg' ) ) ) );
		$this->add_control( 'body_html', array( 'label' => 'Body HTML', 'type' => Controls_Manager::WYSIWYG, 'default' => '' ) );
		$this->end_controls_section();
	}
	protected function render() {
		$s = $this->get_settings_for_display(); ?>
<div class="emx-page-simple">
	<section class="emx-page-hero" style="background-image:url('<?php echo esc_url( $s['hero_image']['url'] ); ?>')">
		<div class="emx-page-hero-inner" data-reveal>
			<div class="eyebrow"><span class="pulse-dot"></span> <?php echo esc_html( $s['label'] ); ?></div>
			<h1><?php echo esc_html( $s['title'] ); ?></h1>
			<p><?php echo esc_html( $s['intro'] ); ?></p>
		</div>
	</section>
	<section class="emx-page-content">
		<div class="emx-page-content-inner emx-prose"><?php echo wp_kses_post( $s['body_html'] ); ?></div>
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
			<div class="section-label"><?php echo esc_html( $s['label'] ); ?></div>
			<h2><?php echo esc_html( $s['title'] ); ?></h2>
			<p class="lead"><?php echo esc_html( $s['intro'] ); ?></p>
			<ul>
				<li><span>Correo</span><a href="mailto:<?php echo esc_attr( $s['email'] ); ?>"><?php echo esc_html( $s['email'] ); ?></a></li>
				<li><span>Teléfono</span><a href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', $s['phone'] ) ); ?>"><?php echo esc_html( $s['phone'] ); ?></a></li>
				<li><span>Oficinas</span><span><?php echo esc_html( $s['address'] ); ?></span></li>
				<li><span>Horario</span><span>Lun–Vie 9:00–18:00 · soporte crítico 24/7</span></li>
			</ul>
		</div>
		<form class="emx-form" data-emx-form data-reveal>
			<input type="hidden" name="emx_nonce" value="<?php echo esc_attr( $nonce ); ?>">
			<input type="text" name="emx_hp" autocomplete="off" tabindex="-1" style="position:absolute;left:-9999px;height:0;width:0;opacity:0" aria-hidden="true">
			<div class="emx-field">
				<label for="emx-name">Nombre</label>
				<input id="emx-name" name="name" type="text" autocomplete="name" required>
			</div>
			<div class="emx-field">
				<label for="emx-company">Empresa</label>
				<input id="emx-company" name="company" type="text" autocomplete="organization" required>
			</div>
			<div class="emx-field">
				<label for="emx-email">Correo de trabajo</label>
				<input id="emx-email" name="email" type="email" autocomplete="email" required>
			</div>
			<div class="emx-field">
				<label for="emx-phone">Teléfono</label>
				<input id="emx-phone" name="phone" type="tel" autocomplete="tel">
			</div>
			<div class="emx-field">
				<label for="emx-size">Tamaño de flota</label>
				<select id="emx-size" name="fleet_size">
					<option value="1-10">1 — 10</option>
					<option value="11-50">11 — 50</option>
					<option value="51-200">51 — 200</option>
					<option value="200+">200+</option>
				</select>
			</div>
			<div class="emx-field">
				<label for="emx-interest">Interés principal</label>
				<select id="emx-interest" name="interest">
					<option value="gps">Rastreo GPS</option>
					<option value="dashcam">Dash cams</option>
					<option value="assets">Activos no vehiculares</option>
					<option value="all">Solución integral</option>
				</select>
			</div>
			<div class="emx-field is-full">
				<label for="emx-message">¿Cómo podemos ayudarte?</label>
				<textarea id="emx-message" name="message" rows="4"></textarea>
			</div>
			<div class="emx-form-status" role="status" aria-live="polite"></div>
			<button class="btn btn-primary" type="submit">Enviar solicitud</button>
			<p class="emx-form-note">Al enviar aceptas que te contactemos sobre tu solicitud. No compartimos tus datos.</p>
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
