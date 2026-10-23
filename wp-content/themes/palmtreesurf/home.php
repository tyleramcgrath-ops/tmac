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
<?php
/*
 * This was a heading and a paragraph on a plain band — no photograph — while
 * About and Experiences both opened on a full-width banner. Same component as
 * the rest of the site now, so the Journal does not read as an unfinished page.
 */
get_template_part(
	'template-parts/components/page-header',
	null,
	array(
		'title'    => $pt_page ? $pt_page->post_title : __( 'Guides', 'palmtreesurf' ),
		'script'   => __( 'Tamarindo', 'palmtreesurf' ),
		'lede'     => __( 'Practical guides to surfing, fishing, wildlife and getting the most out of a week on the Guanacaste coast. Written by people who are in this water every day.', 'palmtreesurf' ),
		// Explicit, because inside the loop has_post_thumbnail() would return
		// the newest article's picture — the one the first card already shows.
		'file'     => 'fishing-boat-headland.jpg',
		'modifier' => 'journal',
	)
);
?>

<div class="container">
	<?php get_template_part( 'template-parts/components/breadcrumbs' ); ?>
</div>

<div class="container container--narrow entry__content" style="padding-top:var(--pt-space-xl)">
	<p>
		<?php esc_html_e( 'These are the answers we end up giving over and over — in the shop, on the boat, and in the emails people send before they book. Rather than repeat them one at a time, they are written out properly here.', 'palmtreesurf' ); ?>
	</p>
	<p>
		<?php esc_html_e( 'Everything is specific to this coast. When a guide says the wind builds through the morning, or that a particular month is wrong for the fish you are after, that comes from working these waters rather than from a general travel article. Where something is genuinely uncertain — what you will see on a wildlife trip, what the surf will do next week — it says so.', 'palmtreesurf' ); ?>
	</p>
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
