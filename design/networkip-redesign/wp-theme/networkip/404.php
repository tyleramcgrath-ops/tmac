<?php
/**
 * 404 template.
 *
 * @package NetworkIP
 */

get_header();
?>
<main id="main" class="nip-main">
	<?php get_template_part( 'template-parts/page-header', null, array( 'title' => __( 'Page not found', 'networkip' ), 'text' => __( 'The page you are looking for may have moved. Try the navigation above, or search the site.', 'networkip' ) ) ); ?>
	<section class="nip-section nip-section--plain">
		<div class="nip-wrap nip-wrap--narrow">
			<?php get_search_form(); ?>
			<p><a class="nip-btn nip-btn--primary" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to home', 'networkip' ); ?></a></p>
		</div>
	</section>
</main>
<?php
get_footer();
