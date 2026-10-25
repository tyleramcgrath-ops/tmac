<?php
/**
 * Footer.
 *
 * @package EnVueMex_Premium
 */
?>
<section class="final-cta">
	<div class="wrap final-grid">
		<div>
			<span class="eyebrow">Siguiente recorrido</span>
			<h2>Una flota más visible empieza con una conversación.</h2>
		</div>
		<div>
			<p>Hable con especialistas de EnVueMex sobre rastreo, cámaras, activos e implementación para su operación en México.</p>
			<a class="button button-primary" href="<?php echo esc_url( envuemex_page_url( 'contacto' ) ); ?>">Hable con un especialista <span>→</span></a>
		</div>
	</div>
</section>
<footer class="site-footer">
	<div class="wrap footer-grid">
		<div class="footer-brand">
			<img src="<?php echo esc_url( envuemex_image( 'envuemex-logo.webp' ) ); ?>" alt="EnVueMex Solutions">
			<p>Soluciones conectadas para flotas comerciales en México: rastreo GPS, seguridad por video, activos y soporte experto.</p>
		</div>
		<div>
			<h3>Soluciones</h3>
			<a href="<?php echo esc_url( envuemex_page_url( 'soluciones-de-rastreo-gps' ) ); ?>">Rastreo GPS</a>
			<a href="<?php echo esc_url( envuemex_page_url( 'dash-cams' ) ); ?>">Cámaras de tablero</a>
			<a href="<?php echo esc_url( envuemex_page_url( 'rastreadores-de-activos-no-vehiculares' ) ); ?>">Activos no vehiculares</a>
			<a href="<?php echo esc_url( envuemex_page_url( 'servicios' ) ); ?>">Servicios</a>
		</div>
		<div>
			<h3>Empresa</h3>
			<a href="<?php echo esc_url( envuemex_page_url( 'acerca-de-nosotros' ) ); ?>">Acerca de nosotros</a>
			<a href="<?php echo esc_url( envuemex_page_url( 'blog' ) ); ?>">Blog</a>
			<a href="<?php echo esc_url( envuemex_page_url( 'calendario-de-eventos' ) ); ?>">Eventos</a>
			<a href="<?php echo esc_url( envuemex_page_url( 'corporate-faq' ) ); ?>">Preguntas frecuentes</a>
		</div>
		<div>
			<h3>Contacto</h3>
			<a href="tel:<?php echo esc_attr( envuemex_phone_tel() ); ?>"><?php echo esc_html( envuemex_phone() ); ?></a>
			<a href="<?php echo esc_url( envuemex_page_url( 'contacto' ) ); ?>">Hable con un especialista</a>
			<a href="<?php echo esc_url( envuemex_page_url( 'privacy-policy' ) ); ?>">Privacidad</a>
			<a href="<?php echo esc_url( envuemex_page_url( 'terms-and-conditions' ) ); ?>">Términos</a>
		</div>
	</div>
	<div class="wrap footer-bottom">© <?php echo esc_html( gmdate( 'Y' ) ); ?> EnVueMex Solutions. Todos los derechos reservados. Gestión de flotas, seguridad y cumplimiento normativo.</div>
</footer>
<div class="envue-assistant" id="envueAssistant">
	<button class="assistant-launch" id="assistantOpen" aria-controls="assistantPanel" aria-expanded="false">
		<span class="pulse"></span><strong>Asistente EnVue</strong><small>Pregunte por su flota</small>
	</button>
	<section class="assistant-panel" id="assistantPanel" aria-label="Asistente EnVueMex" hidden>
		<header><div><strong>Asistente EnVue</strong><small>Orientación inmediata</small></div><button id="assistantClose" aria-label="Cerrar">×</button></header>
		<div class="assistant-messages" id="assistantMessages"></div>
		<div class="assistant-prompts">
			<button data-answer="gps">Rastreo GPS</button><button data-answer="cams">Dash Cams</button><button data-answer="roi">Ahorros</button><button data-answer="demo">Demo</button>
		</div>
	</section>
</div>
<?php wp_footer(); ?>
</body>
</html>
