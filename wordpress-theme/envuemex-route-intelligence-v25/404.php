<?php
/**
 * Not found template.
 *
 * @package EnVueMex_Premium
 */
get_header();
?>
<main id="main" class="not-found">
	<div class="narrow">
		<span class="eyebrow">Error 404</span>
		<h1>Esta ruta no está disponible.</h1>
		<p>Regrese a las soluciones de EnVueMex o contacte a nuestro equipo para encontrar lo que necesita.</p>
		<a class="button button-primary" href="<?php echo esc_url( home_url( '/' ) ); ?>">Volver al inicio</a>
	</div>
</main>
<?php get_footer(); ?>
