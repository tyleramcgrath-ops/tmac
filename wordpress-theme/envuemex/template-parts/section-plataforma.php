<?php
/**
 * Platform feature section + live map visual.
 *
 * @package envuemex
 */
?>
<section class="section feature" id="plataforma">
	<div class="container feature__grid">
		<div class="feature__copy" data-reveal>
			<span class="eyebrow">
				<span class="dot"></span>
				<span data-es="Plataforma" data-en="Platform">Plataforma</span>
			</span>
			<h2 data-es="Datos crudos en decisiones que ahorran combustible, tiempo y vidas." data-en="Raw data into decisions that save fuel, time and lives.">Datos crudos en decisiones que ahorran combustible, tiempo y vidas.</h2>
			<p data-es="Implementamos, configuramos y operamos contigo. No vendemos un dispositivo y desaparecemos — somos tu socio de telemática de largo plazo." data-en="We implement, configure and operate with you. We don't sell a device and disappear — we're your long-term telematics partner.">Implementamos, configuramos y operamos contigo. No vendemos un dispositivo y desaparecemos — somos tu socio de telemática de largo plazo.</p>

			<ul class="ticks">
				<li data-es="Instalación a nivel nacional con técnicos certificados" data-en="Nationwide installation with certified technicians">Instalación a nivel nacional con técnicos certificados</li>
				<li data-es="Tableros y reportes personalizados a tu KPI" data-en="Dashboards and reports tuned to your KPIs">Tableros y reportes personalizados a tu KPI</li>
				<li data-es="Soporte 24/7 en español e inglés" data-en="24/7 support in Spanish and English">Soporte 24/7 en español e inglés</li>
				<li data-es="Garantía extendida y monitoreo de salud de dispositivo" data-en="Extended warranty and device-health monitoring">Garantía extendida y monitoreo de salud de dispositivo</li>
			</ul>

			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/#contacto' ) ); ?>" data-es="Hablar con un experto" data-en="Talk to an expert">Hablar con un experto</a>
		</div>

		<div class="feature__visual" data-reveal aria-hidden="true">
			<div class="map">
				<div class="map__layer"></div>
				<svg class="map__paths" viewBox="0 0 400 320">
					<path d="M30,260 C90,220 130,260 170,210 S260,140 380,170" fill="none" stroke="#C9A4FF" stroke-width="1.5" stroke-dasharray="4 6"/>
					<path d="M50,80 C110,110 160,80 220,130 S320,210 370,260" fill="none" stroke="#8A5CF6" stroke-width="1.5" stroke-dasharray="4 6"/>
				</svg>
				<span class="pin pin--a" style="left:18%;top:60%"></span>
				<span class="pin pin--b" style="left:48%;top:40%"></span>
				<span class="pin pin--c" style="left:78%;top:55%"></span>
				<span class="pin pin--d" style="left:32%;top:28%"></span>
				<div class="map__chip" style="left:48%;top:32%">
					<strong>MTY-104</strong>
					<span data-es="92 km/h · en ruta" data-en="92 km/h · on route">92 km/h · en ruta</span>
				</div>
			</div>
		</div>
	</div>
</section>
