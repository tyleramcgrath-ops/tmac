<?php
/**
 * Template Name: About
 *
 * A designed about page rather than a column of text. The page's own content
 * is the story section, so it stays fully editable in the block editor; the
 * sections around it are theme furniture — what we run, how a booking works,
 * safety, the guides, FAQ and a closing CTA.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

$pt_facts = pt_about_facts();
$pt_faq   = pt_about_faq();

while ( have_posts() ) :
	the_post();
	?>
	<section class="page-hero page-hero--about">
		<div class="page-hero__media" aria-hidden="true">
			<?php
			if ( has_post_thumbnail() ) {
				the_post_thumbnail( 'pt-hero', array( 'loading' => 'eager' ) );
			} else {
				pt_image( 'split-1-primary', array( 'priority' => true ) );
			}
			?>
		</div>

		<div class="page-hero__inner container">
			<p class="page-hero__script"><?php esc_html_e( 'Pura Vida', 'palmtreesurf' ); ?></p>
			<?php the_title( '<h1 class="page-hero__title">', '</h1>' ); ?>
			<p class="page-hero__lede">
				<?php esc_html_e( 'Surf lessons, fishing charters, boat tours and wildlife trips, run out of Tamarindo on the Guanacaste coast.', 'palmtreesurf' ); ?>
			</p>
		</div>
	</section>

	<div class="container">
		<?php get_template_part( 'template-parts/components/breadcrumbs' ); ?>
	</div>

	<section class="about-story">
		<div class="container about-story__inner">
			<div class="entry__content about-story__prose">
				<?php
				the_content();

				wp_link_pages(
					array(
						'before' => '<div class="page-links">',
						'after'  => '</div>',
					)
				);
				?>
			</div>

			<?php if ( $pt_facts ) : ?>
				<aside class="about-facts">
					<h2 class="about-facts__title"><?php esc_html_e( 'The short version', 'palmtreesurf' ); ?></h2>
					<dl class="about-facts__list">
						<?php foreach ( $pt_facts as $pt_fact ) : ?>
							<div class="about-fact">
								<dt><?php echo esc_html( $pt_fact[0] ); ?></dt>
								<dd><?php echo esc_html( $pt_fact[1] ); ?></dd>
							</div>
						<?php endforeach; ?>
					</dl>

					<p class="about-facts__cta">
						<a class="btn btn--primary btn--sm" href="<?php echo esc_url( get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>">
							<?php esc_html_e( 'See what we run', 'palmtreesurf' ); ?>
						</a>
					</p>
				</aside>
			<?php endif; ?>
		</div>
	</section>

	<?php get_template_part( 'template-parts/components/how-it-works' ); ?>

	<section class="section section--sand about-safety">
		<div class="container">
			<header class="section__header">
				<p class="eyebrow"><?php esc_html_e( 'How we run it', 'palmtreesurf' ); ?></p>
				<h2 class="section__title"><?php esc_html_e( 'Safety is the boring part we take seriously', 'palmtreesurf' ); ?></h2>
				<p class="section__lede">
					<?php esc_html_e( 'None of this is exciting to read, and all of it is why days go well.', 'palmtreesurf' ); ?>
				</p>
			</header>

			<ul class="about-safety__list" data-reveal-group>
				<?php foreach ( pt_about_safety() as $pt_point ) : ?>
					<li class="about-safety__item" data-reveal>
						<h3><?php echo esc_html( $pt_point[0] ); ?></h3>
						<p><?php echo esc_html( $pt_point[1] ); ?></p>
					</li>
				<?php endforeach; ?>
			</ul>
		</div>
	</section>

	<?php get_template_part( 'template-parts/home/instructors' ); ?>

	<?php if ( $pt_faq ) : ?>
		<section class="section about-faq">
			<div class="container container--narrow">
				<header class="section__header">
					<p class="eyebrow"><?php esc_html_e( 'Questions', 'palmtreesurf' ); ?></p>
					<h2 class="section__title"><?php esc_html_e( 'Things people ask before they book', 'palmtreesurf' ); ?></h2>
				</header>

				<div class="faq">
					<?php foreach ( $pt_faq as $pt_index => $pt_pair ) : ?>
						<details class="faq__item"<?php echo 0 === $pt_index ? ' open' : ''; ?>>
							<summary><?php echo esc_html( $pt_pair[0] ); ?></summary>
							<div class="faq__answer"><p><?php echo esc_html( $pt_pair[1] ); ?></p></div>
						</details>
					<?php endforeach; ?>
				</div>

				<?php $pt_contact = get_page_by_path( 'contact' ); ?>
				<?php if ( $pt_contact ) : ?>
					<p class="about-faq__more">
						<?php esc_html_e( 'Anything not answered here — just ask.', 'palmtreesurf' ); ?>
						<a href="<?php echo esc_url( get_permalink( $pt_contact ) ); ?>"><?php esc_html_e( 'Send us a message', 'palmtreesurf' ); ?></a>
					</p>
				<?php endif; ?>
			</div>
		</section>
	<?php endif; ?>

	<?php get_template_part( 'template-parts/home/location' ); ?>
	<?php get_template_part( 'template-parts/home/cta' ); ?>
	<?php
endwhile;

get_footer();
