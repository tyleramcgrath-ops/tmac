<?php
/**
 * Template Name: Gallery
 *
 * Shows the bundled photo set with category filters. Any images/blocks added in the
 * page editor are displayed above it.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>

<section class="section section--cream section--page-top">
	<div class="container">
		<header class="section-head">
			<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Gallery', 'popeye-charters' ); ?></p>
			<h1 class="h-xl"><?php esc_html_e( 'Scenes From the Water & Screen', 'popeye-charters' ); ?></h1>
			<p class="lead"><?php esc_html_e( "From Popeye's warm wood wheelhouse to stills from the 1980 movie — explore the boat, the crew, and the legend.", 'popeye-charters' ); ?></p>
		</header>
		<?php
		while ( have_posts() ) :
			the_post();
			if ( trim( get_the_content() ) ) :
				?>
				<div class="prose prose--wide"><?php the_content(); ?></div>
				<?php
			endif;
		endwhile;

		get_template_part( 'template-parts/gallery-grid', null, array( 'filters' => true ) );
		?>
	</div>
</section>

<?php
get_footer();
