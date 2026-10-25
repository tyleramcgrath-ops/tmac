<?php
/**
 * Standard page template, retaining editable WordPress/Elementor content.
 *
 * @package EnVueMex_Premium
 */
get_header();
while ( have_posts() ) :
	the_post();
	$slug = isset( $GLOBALS['envuemex_page_slug'] ) ? $GLOBALS['envuemex_page_slug'] : get_post_field( 'post_name', get_the_ID() );
	$hero = envuemex_page_hero( $slug );
	$managed_page = (bool) envuemex_rich_page_data( $slug );
	?>
	<main id="main" class="interior-page">
		<section class="page-hero">
			<div class="wrap page-hero-grid">
				<div>
					<span class="eyebrow"><?php echo esc_html( $hero['label'] ); ?></span>
					<h1><?php echo esc_html( $hero['title'] ); ?></h1>
					<p><?php echo esc_html( $hero['intro'] ?? 'Soluciones conectadas y acompañamiento especializado para operaciones comerciales en México.' ); ?></p>
				</div>
				<img src="<?php echo esc_url( envuemex_image( $hero['image'] ) ); ?>" alt="">
			</div>
		</section>
		<?php envuemex_render_rich_page( $slug ); ?>
		<?php if ( ! $managed_page ) : ?>
			<article class="wrap editable-content">
				<?php the_content(); ?>
			</article>
		<?php endif; ?>
	</main>
	<?php
endwhile;
get_footer();
