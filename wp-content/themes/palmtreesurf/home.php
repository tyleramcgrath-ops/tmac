<?php
/**
 * The journal index.
 *
 * Its own template so the posts page does not inherit the generic archive
 * layout with a widget sidebar.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

$pt_page = get_option( 'page_for_posts' ) ? get_post( get_option( 'page_for_posts' ) ) : null;
?>
<section class="journal-hero">
	<div class="container">
		<p class="journal-hero__script"><?php esc_html_e( 'Tamarindo', 'palmtreesurf' ); ?></p>
		<?php
		// The script line already says "Tamarindo", so avoid repeating the page
		// title back at itself when the client has named the page "Journal".
		$pt_title = $pt_page ? $pt_page->post_title : __( 'Guides', 'palmtreesurf' );
		?>
		<h1 class="journal-hero__title"><?php echo esc_html( $pt_title ); ?></h1>
		<p class="journal-hero__lede">
			<?php esc_html_e( 'Practical guides to surfing, fishing, wildlife and getting the most out of a week on the Guanacaste coast. Written by people who are in this water every day.', 'palmtreesurf' ); ?>
		</p>
	</div>
</section>

<div class="container">
	<?php get_template_part( 'template-parts/components/breadcrumbs' ); ?>
</div>

<div class="container journal-list">
	<?php if ( have_posts() ) : ?>
		<div class="card-grid card-grid--3" data-reveal-group>
			<?php
			while ( have_posts() ) :
				the_post();
				get_template_part( 'template-parts/components/card', 'post' );
			endwhile;
			?>
		</div>

		<?php pt_pagination(); ?>
	<?php else : ?>
		<?php get_template_part( 'template-parts/content', 'none' ); ?>
	<?php endif; ?>
</div>
<?php
get_footer();
