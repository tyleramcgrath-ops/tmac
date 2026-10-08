<?php
/**
 * Nothing found at this URL.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>

<div class="container">
	<section class="error-404">
		<h1 class="page-title"><?php esc_html_e( 'That page has drifted off', 'palmtreesurf' ); ?></h1>
		<p><?php esc_html_e( 'The page you were after is not here. Try a search, or head back to the packages.', 'palmtreesurf' ); ?></p>

		<?php get_search_form(); ?>

		<p>
			<a class="btn btn--primary" href="<?php echo esc_url( get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>">
				<?php esc_html_e( 'Browse experiences', 'palmtreesurf' ); ?>
			</a>
		</p>
	</section>
</div>

<?php
get_footer();
