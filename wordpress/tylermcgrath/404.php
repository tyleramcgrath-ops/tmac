<?php
/**
 * Off course.
 *
 * @package tylermcgrath
 */

get_header();
?>
<main id="main" class="tm-main tm-inner tm-404" data-section="lost" data-compass="warning">
	<?php
	get_template_part(
		'template-parts/page-hero',
		null,
		array(
			'eyebrow' => '404 · ' . esc_html__( 'Off course', 'tylermcgrath' ),
			'title'   => esc_html__( 'This star isn’t on the map.', 'tylermcgrath' ),
			'lede'    => esc_html__( 'The page you were looking for has moved or never existed. Let the compass take you home.', 'tylermcgrath' ),
		)
	);
	?>
	<section class="tm-section">
		<div class="tm-wrap tm-404__actions">
			<a class="tm-btn tm-btn--brass" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to the studio', 'tylermcgrath' ); ?> ↗</a>
			<?php get_search_form(); ?>
		</div>
	</section>
</main>
<?php
get_footer();
