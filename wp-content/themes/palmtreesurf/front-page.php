<?php
/**
 * Front page: hero, editor content, featured packages, enquiry form.
 *
 * If a static page is assigned as the front page, its editor content renders
 * between the hero and the package grid, so the client controls the middle of
 * the page without touching this file.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

get_template_part( 'template-parts/section', 'hero' );
?>

<?php if ( is_page() && have_posts() ) : ?>
	<section class="front-content">
		<div class="container">
			<?php
			while ( have_posts() ) :
				the_post();
				the_content();
			endwhile;
			?>
		</div>
	</section>
<?php endif; ?>

<?php
$pts_packages = new WP_Query(
	array(
		'post_type'           => PTS_PACKAGE_POST_TYPE,
		'posts_per_page'      => 6,
		'orderby'             => array(
			'menu_order' => 'ASC',
			'title'      => 'ASC',
		),
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	)
);

if ( $pts_packages->have_posts() ) :
	?>
	<section class="section section--packages">
		<div class="container">
			<header class="section__header">
				<h2 class="section__title"><?php esc_html_e( 'Surf lessons & ocean experiences', 'palmtreesurf' ); ?></h2>
			</header>

			<div class="package-grid">
				<?php
				while ( $pts_packages->have_posts() ) :
					$pts_packages->the_post();
					get_template_part( 'template-parts/card', 'package' );
				endwhile;
				?>
			</div>

			<p class="section__more">
				<a class="btn" href="<?php echo esc_url( get_post_type_archive_link( PTS_PACKAGE_POST_TYPE ) ); ?>">
					<?php esc_html_e( 'See all packages', 'palmtreesurf' ); ?>
				</a>
			</p>
		</div>
	</section>
	<?php
	wp_reset_postdata();
endif;
?>

<section class="section section--enquiry">
	<div class="container container--narrow">
		<?php echo pts_enquiry_form(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped inside the template. ?>
	</div>
</section>

<?php
get_footer();
