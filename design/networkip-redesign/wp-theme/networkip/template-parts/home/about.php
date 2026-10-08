<?php
/**
 * Homepage about / positioning.
 *
 * @package NetworkIP
 */

$networkip_carriers = networkip_split_list( networkip_mod( 'about_carriers' ) );
?>
<section class="nip-section nip-section--alt" id="about" aria-labelledby="about-title">
	<div class="nip-wrap nip-split">
		<div class="nip-split__main">
			<?php
			networkip_section_heading(
				array(
					'eyebrow' => networkip_mod( 'about_eyebrow' ),
					'title'   => networkip_mod( 'about_title' ),
				),
				'about-title'
			);
			?>
			<p class="nip-lead"><?php echo esc_html( networkip_mod( 'about_text' ) ); ?></p>
			<a class="nip-link" href="<?php echo esc_url( networkip_url( '/about-us/' ) ); ?>"><?php esc_html_e( 'More about NetworkIP', 'networkip' ); ?> <span aria-hidden="true">→</span></a>
		</div>

		<aside class="nip-panel nip-split__aside" aria-labelledby="about-panel-title">
			<?php networkip_icon( 'phone-calls', 48 ); ?>
			<h3 id="about-panel-title"><?php echo esc_html( networkip_mod( 'about_panel_title' ) ); ?></h3>
			<p><?php echo esc_html( networkip_mod( 'about_panel_text' ) ); ?></p>
			<?php if ( $networkip_carriers ) : ?>
				<ul class="nip-carriers">
					<?php foreach ( $networkip_carriers as $networkip_carrier ) : ?>
						<li><?php echo esc_html( $networkip_carrier ); ?></li>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>
		</aside>
	</div>
</section>
