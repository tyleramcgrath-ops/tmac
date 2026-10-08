<?php
/**
 * Hero section.
 *
 * @package envuemex
 */
?>
<section class="hero" id="top">
	<div class="hero__bg" aria-hidden="true">
		<div class="hero__grid"></div>
		<div class="hero__glow hero__glow--a"></div>
		<div class="hero__glow hero__glow--b"></div>
		<svg class="hero__route" viewBox="0 0 1200 600" preserveAspectRatio="none">
			<path d="M-20,460 C200,420 300,520 520,440 S840,300 1220,360" fill="none" stroke="url(#routeGrad)" stroke-width="2" stroke-dasharray="6 8"/>
			<defs>
				<linearGradient id="routeGrad" x1="0" x2="1">
					<stop offset="0" stop-color="#8A5CF6" stop-opacity="0"/>
					<stop offset=".5" stop-color="#C9A4FF" stop-opacity=".9"/>
					<stop offset="1" stop-color="#8A5CF6" stop-opacity="0"/>
				</linearGradient>
			</defs>
		</svg>
	</div>

	<div class="container hero__inner">
		<span class="eyebrow">
			<span class="dot"></span>
			<span data-es="Telemática para flotas · México" data-en="Fleet telematics · Mexico">Telemática para flotas · México</span>
		</span>

		<h1 class="hero__title">
			<span data-es="Visibilidad total de tu flota," data-en="Total visibility of your fleet,">Visibilidad total de tu flota,</span>
			<span class="grad" data-es="en tiempo real." data-en="in real time.">en tiempo real.</span>
		</h1>

		<p class="hero__lede" data-es="Distribuidor autorizado de las plataformas líderes de telemática y videovigilancia. Conecta vehículos, activos y conductores con datos accionables — desde Tijuana hasta Cancún." data-en="Authorized reseller of leading telematics and video platforms. Connect vehicles, assets and drivers with actionable data — from Tijuana to Cancún.">
			Distribuidor autorizado de las plataformas líderes de telemática y videovigilancia. Conecta vehículos, activos y conductores con datos accionables — desde Tijuana hasta Cancún.
		</p>

		<div class="hero__ctas">
			<a class="btn btn--primary btn--lg" href="<?php echo esc_url( home_url( '/#contacto' ) ); ?>" data-es="Solicitar demo" data-en="Request demo">Solicitar demo</a>
			<a class="btn btn--ghost btn--lg" href="<?php echo esc_url( home_url( '/#soluciones' ) ); ?>" data-es="Ver soluciones →" data-en="See solutions →">Ver soluciones →</a>
		</div>

		<div class="hero__meta">
			<div>
				<strong>10K+</strong>
				<span data-es="vehículos conectados" data-en="connected vehicles">vehículos conectados</span>
			</div>
			<div>
				<strong>99.9%</strong>
				<span data-es="disponibilidad" data-en="uptime">disponibilidad</span>
			</div>
			<div>
				<strong>24/7</strong>
				<span data-es="soporte bilingüe" data-en="bilingual support">soporte bilingüe</span>
			</div>
		</div>
	</div>

	<div class="hero__card" aria-hidden="true">
		<div class="card__head">
			<span class="card__dot"></span>
			<span class="card__dot"></span>
			<span class="card__dot"></span>
			<span class="card__title">fleet.envuemex.com</span>
		</div>
		<div class="card__body">
			<div class="card__row">
				<div class="card__kpi">
					<span class="card__lbl" data-es="Activos" data-en="Active">Activos</span>
					<strong>284</strong>
				</div>
				<div class="card__kpi">
					<span class="card__lbl" data-es="En ruta" data-en="On route">En ruta</span>
					<strong>197</strong>
				</div>
				<div class="card__kpi">
					<span class="card__lbl" data-es="Alertas" data-en="Alerts">Alertas</span>
					<strong class="warn">3</strong>
				</div>
			</div>
			<div class="card__chart" aria-hidden="true">
				<svg viewBox="0 0 320 80" preserveAspectRatio="none">
					<defs>
						<linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
							<stop offset="0" stop-color="#8A5CF6" stop-opacity=".7"/>
							<stop offset="1" stop-color="#8A5CF6" stop-opacity="0"/>
						</linearGradient>
					</defs>
					<path d="M0,60 C30,55 50,30 80,35 S140,65 170,40 220,15 260,28 310,55 320,45 L320,80 L0,80 Z" fill="url(#cg)"/>
					<path d="M0,60 C30,55 50,30 80,35 S140,65 170,40 220,15 260,28 310,55 320,45" fill="none" stroke="#C9A4FF" stroke-width="1.6"/>
				</svg>
			</div>
			<ul class="card__list">
				<li><span class="pill pill--ok">OK</span> <span data-es="MTY-104 · CDMX → QRO" data-en="MTY-104 · CDMX → QRO">MTY-104 · CDMX → QRO</span></li>
				<li><span class="pill pill--warn">!</span> <span data-es="GDL-22 · exceso velocidad" data-en="GDL-22 · over speed">GDL-22 · exceso velocidad</span></li>
				<li><span class="pill pill--ok">OK</span> <span data-es="TIJ-08 · ralentí 4m" data-en="TIJ-08 · idle 4m">TIJ-08 · ralentí 4m</span></li>
			</ul>
		</div>
	</div>
</section>
