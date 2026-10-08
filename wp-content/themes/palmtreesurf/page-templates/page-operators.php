<?php
/**
 * Template Name: For Operators
 *
 * The pitch to tour companies, then the application form.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<section class="page-hero page-hero--operators">
		<div class="page-hero__media" aria-hidden="true">
			<?php pt_image( 'story-banner', array( 'priority' => true ) ); ?>
		</div>

		<div class="page-hero__inner container">
			<p class="page-hero__script"><?php esc_html_e( 'Partner', 'palmtreesurf' ); ?></p>
			<?php the_title( '<h1 class="page-hero__title">', '</h1>' ); ?>
			<p class="page-hero__lede">
				<?php esc_html_e( 'Run tours in Guanacaste? List them here and reach visitors who are already looking for exactly what you do.', 'palmtreesurf' ); ?>
			</p>
			<p class="page-hero__actions">
				<a class="btn btn--primary btn--lg" href="#apply"><?php esc_html_e( 'Apply to list your tours', 'palmtreesurf' ); ?></a>
			</p>
		</div>
	</section>

	<div class="container">
		<?php get_template_part( 'template-parts/components/breadcrumbs' ); ?>
	</div>

	<?php if ( trim( wp_strip_all_tags( get_the_content() ) ) ) : ?>
		<div class="container container--narrow entry__content" style="padding-block:var(--pt-space-xl)">
			<?php the_content(); ?>
		</div>
	<?php endif; ?>

	<section class="section operator-why">
		<div class="container">
			<header class="section__header">
				<p class="eyebrow"><?php esc_html_e( 'Why list with us', 'palmtreesurf' ); ?></p>
				<h2 class="section__title"><?php esc_html_e( 'One place visitors already trust', 'palmtreesurf' ); ?></h2>
			</header>

			<ul class="operator-why__list" data-reveal-group>
				<?php foreach ( pt_operator_benefits() as $pt_benefit ) : ?>
					<li class="operator-why__item" data-reveal>
						<h3><?php echo esc_html( $pt_benefit[0] ); ?></h3>
						<p><?php echo esc_html( $pt_benefit[1] ); ?></p>
					</li>
				<?php endforeach; ?>
			</ul>
		</div>
	</section>

	<section class="section section--sand">
		<div class="container">
			<header class="section__header">
				<p class="eyebrow"><?php esc_html_e( 'How it works', 'palmtreesurf' ); ?></p>
				<h2 class="section__title"><?php esc_html_e( 'From application to listed', 'palmtreesurf' ); ?></h2>
			</header>

			<ol class="steps" data-reveal-group>
				<?php foreach ( pt_operator_steps() as $pt_index => $pt_step ) : ?>
					<li class="step" data-reveal>
						<span class="step__number"><?php echo esc_html( number_format_i18n( $pt_index + 1 ) ); ?></span>
						<h3 class="step__title"><?php echo esc_html( $pt_step[0] ); ?></h3>
						<p class="step__text"><?php echo esc_html( $pt_step[1] ); ?></p>
					</li>
				<?php endforeach; ?>
			</ol>
		</div>
	</section>

	<section class="section operator-apply">
		<div class="container container--narrow">
			<header class="section__header">
				<p class="eyebrow"><?php esc_html_e( 'Apply', 'palmtreesurf' ); ?></p>
				<h2 class="section__title"><?php esc_html_e( 'Tell us about your tours', 'palmtreesurf' ); ?></h2>
				<p class="section__lede">
					<?php esc_html_e( 'It takes about five minutes. Everything marked with a star is needed; the rest helps us understand what you run.', 'palmtreesurf' ); ?>
				</p>
			</header>

			<?php get_template_part( 'template-parts/components/operator-form' ); ?>
		</div>
	</section>

	<?php if ( pt_operator_faq() ) : ?>
		<section class="section section--sand">
			<div class="container container--narrow">
				<header class="section__header">
					<p class="eyebrow"><?php esc_html_e( 'Questions', 'palmtreesurf' ); ?></p>
					<h2 class="section__title"><?php esc_html_e( 'Before you apply', 'palmtreesurf' ); ?></h2>
				</header>

				<div class="faq">
					<?php foreach ( pt_operator_faq() as $pt_index => $pt_pair ) : ?>
						<details class="faq__item"<?php echo 0 === $pt_index ? ' open' : ''; ?>>
							<summary><?php echo esc_html( $pt_pair[0] ); ?></summary>
							<div class="faq__answer"><p><?php echo esc_html( $pt_pair[1] ); ?></p></div>
						</details>
					<?php endforeach; ?>
				</div>
			</div>
		</section>
	<?php endif; ?>
	<?php
endwhile;

get_footer();
