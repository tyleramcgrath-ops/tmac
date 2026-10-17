<?php
/**
 * Homepage editorial band.
 *
 * The homepage is the page most likely to be cited for "surf lessons in
 * Tamarindo", and it had almost no prose on it. This gives it something to
 * actually rank and be quoted for, without turning it into an essay.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;
?>
<section class="section home-intro">
	<div class="container home-intro__inner">
		<div class="home-intro__prose">
			<p class="eyebrow"><?php esc_html_e( 'Tamarindo, Costa Rica', 'palmtreesurf' ); ?></p>
			<h2 class="section__title"><?php esc_html_e( 'One town, four completely different days on the water', 'palmtreesurf' ); ?></h2>

			<p>
				<?php esc_html_e( 'Tamarindo is unusual. Most beach towns are good at one thing; here, several very different days out sit within a few kilometres of each other, and that is the whole reason this school runs what it runs.', 'palmtreesurf' ); ?>
			</p>
			<p>
				<?php esc_html_e( 'The main break is sand-bottom rather than reef, so the wave rolls instead of dumping and the bottom forgives the falls every learner takes. That single fact is why Tamarindo became a teaching beach. The water sits in the high twenties Celsius all year, so nobody owns a wetsuit and nobody cuts a session short because they got cold.', 'palmtreesurf' ); ?>
			</p>
			<p>
				<?php esc_html_e( 'A few hundred metres north, the estuary opens into mangrove channels inside a protected wildlife refuge — flat water, deep shade, and howler monkeys at first light. Offshore, the seabed drops away quickly, so a boat can work the rocky points inshore or run out to blue water without spending half the day travelling. An hour inland, the dry forest starts, with waterfalls and river crossings most visitors never see.', 'palmtreesurf' ); ?>
			</p>
			<p>
				<?php esc_html_e( 'You can learn to surf in the morning, paddle a mangrove channel at dawn the next day, and be offshore for sunset that evening, without moving where you are staying. That combination is rare, and it is what a week here is actually for.', 'palmtreesurf' ); ?>
			</p>

			<p class="home-intro__actions">
				<a class="btn btn--primary" href="<?php echo esc_url( get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>">
					<?php esc_html_e( 'Browse every experience', 'palmtreesurf' ); ?>
				</a>
			</p>
		</div>

		<aside class="home-intro__facts">
			<h3 class="home-intro__facts-title"><?php esc_html_e( 'Good to know', 'palmtreesurf' ); ?></h3>
			<dl class="about-facts__list">
				<?php foreach ( pt_home_facts() as $pt_fact ) : ?>
					<div class="about-fact">
						<dt><?php echo esc_html( $pt_fact[0] ); ?></dt>
						<dd><?php echo esc_html( $pt_fact[1] ); ?></dd>
					</div>
				<?php endforeach; ?>
			</dl>
		</aside>
	</div>
</section>
