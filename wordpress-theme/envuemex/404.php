<?php
/**
 * 404 template.
 *
 * @package envuemex
 */

get_header();
?>

<section class="hero" style="padding:120px 0 100px;text-align:center">
	<div class="hero__bg" aria-hidden="true">
		<div class="hero__grid"></div>
		<div class="hero__glow hero__glow--a"></div>
		<div class="hero__glow hero__glow--b"></div>
	</div>
	<div class="container hero__inner" style="max-width:640px;margin:0 auto">
		<p class="hero__title grad" style="font-family:var(--font-display);font-size:clamp(4rem,12vw,8rem);font-weight:800;line-height:1;margin:0">404</p>
		<h1 style="color:#fff;margin-top:14px;font-size:1.6rem">
			<span data-es="Ruta no encontrada" data-en="Route not found">Ruta no encontrada</span>
		</h1>
		<p class="hero__lede" style="margin:14px auto 28px" data-es="La página que buscas se salió del mapa." data-en="The page you're looking for went off the map.">La página que buscas se salió del mapa.</p>
		<div class="hero__ctas" style="justify-content:center">
			<a class="btn btn--primary btn--lg" href="<?php echo esc_url( home_url( '/' ) ); ?>" data-es="← Volver al inicio" data-en="← Back home">← Volver al inicio</a>
		</div>
	</div>
</section>

<?php
get_footer();
