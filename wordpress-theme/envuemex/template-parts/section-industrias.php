<?php
/**
 * Industries grid.
 *
 * @package envuemex
 */
$items = array(
	array( 'Transporte & Carga',          'Transport & Freight',     'Visibilidad transfronteriza, ETA precisas y cumplimiento aduanal.',           'Cross-border visibility, accurate ETAs and customs compliance.' ),
	array( 'Construcción',                 'Construction',            'Control de horas-máquina, ubicación de equipo y prevención de robo.',         'Machine-hour control, equipment location and theft prevention.' ),
	array( 'Distribución & Última milla',  'Distribution & Last-mile','Optimización de rutas, prueba de entrega y experiencia de cliente.',          'Route optimization, proof of delivery and customer experience.' ),
	array( 'Petróleo & Gas',               'Oil & Gas',               'Activos en zonas remotas, telemetría industrial y protocolos de seguridad.',  'Assets in remote zones, industrial telemetry and safety protocols.' ),
	array( 'Servicios de Campo',           'Field Services',          'Despacho inteligente, productividad de técnicos y reporte de trabajo.',       'Smart dispatch, technician productivity and job reporting.' ),
	array( 'Gobierno & Pasajeros',         'Government & Transit',    'Rendición de cuentas, transparencia operativa y seguridad ciudadana.',        'Accountability, operational transparency and citizen safety.' ),
);
?>
<section class="section section--alt" id="industrias">
	<div class="container">
		<header class="section__head">
			<span class="eyebrow eyebrow--center">
				<span class="dot"></span>
				<span data-es="Industrias" data-en="Industries">Industrias</span>
			</span>
			<h2 data-es="Construido para las flotas que mueven a México." data-en="Built for the fleets that move Mexico.">Construido para las flotas que mueven a México.</h2>
		</header>

		<div class="ind">
			<?php foreach ( $items as $i => $row ) : list( $es_t, $en_t, $es_p, $en_p ) = $row; ?>
				<a class="ind__item" href="<?php echo esc_url( home_url( '/#contacto' ) ); ?>" data-reveal>
					<span class="ind__num"><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span>
					<h4 data-es="<?php echo esc_attr( $es_t ); ?>" data-en="<?php echo esc_attr( $en_t ); ?>"><?php echo esc_html( $es_t ); ?></h4>
					<p data-es="<?php echo esc_attr( $es_p ); ?>" data-en="<?php echo esc_attr( $en_p ); ?>"><?php echo esc_html( $es_p ); ?></p>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</section>
