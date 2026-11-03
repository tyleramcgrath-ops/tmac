<?php
/**
 * Blog index, archives and search results.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

get_header();

if ( is_home() ) {
	$title    = __( 'Plan Your Perfect Charter', 'popeye-charters' );
	$eyebrow  = __( "Captain's Log", 'popeye-charters' );
	$subtitle = __( 'Guides, inspiration, and local knowledge from the crew of Popeye — everything you need before you step aboard.', 'popeye-charters' );
} elseif ( is_search() ) {
	/* translators: %s: search query */
	$title    = sprintf( __( 'Results for “%s”', 'popeye-charters' ), get_search_query() );
	$eyebrow  = __( 'Search', 'popeye-charters' );
	$subtitle = '';
} else {
	$title    = wp_strip_all_tags( get_the_archive_title() );
	$eyebrow  = __( "Captain's Log", 'popeye-charters' );
	$subtitle = wp_strip_all_tags( get_the_archive_description() );
}

get_template_part(
	'template-parts/page-hero',
	null,
	array(
		'image'   => popeye_img( 'public_fbab_6229d9679bfe4e8c8741d48790e51b52' ),
		'eyebrow' => $eyebrow,
		'title'   => $title,
		'text'    => $subtitle,
		'size'    => 'sm',
	)
);
?>

<section class="section section--parchment">
	<div class="container">
		<?php
		$cats = get_categories( array( 'hide_empty' => true ) );
		if ( ( is_home() || is_category() ) && count( $cats ) > 1 ) :
			?>
			<nav class="filters" aria-label="<?php esc_attr_e( 'Blog categories', 'popeye-charters' ); ?>">
				<a class="filter<?php echo is_home() ? ' is-active' : ''; ?>" href="<?php echo esc_url( popeye_blog_url() ); ?>"><?php esc_html_e( 'All', 'popeye-charters' ); ?> <span><?php echo (int) wp_count_posts()->publish; ?></span></a>
				<?php foreach ( $cats as $c ) : ?>
					<a class="filter<?php echo is_category( $c->term_id ) ? ' is-active' : ''; ?>" href="<?php echo esc_url( get_category_link( $c ) ); ?>"><?php echo esc_html( $c->name ); ?> <span><?php echo (int) $c->count; ?></span></a>
				<?php endforeach; ?>
			</nav>
		<?php endif; ?>
		<?php if ( have_posts() ) : ?>
			<div class="grid grid--3">
				<?php
				while ( have_posts() ) :
					the_post();
					get_template_part( 'template-parts/post-card' );
				endwhile;
				?>
			</div>
			<div class="pagination">
				<?php
				the_posts_pagination(
					array(
						'mid_size'  => 1,
						'prev_text' => '&larr; ' . __( 'Newer', 'popeye-charters' ),
						'next_text' => __( 'Older', 'popeye-charters' ) . ' &rarr;',
					)
				);
				?>
			</div>
		<?php else : ?>
			<div class="container--narrow center">
				<p><?php esc_html_e( 'Nothing found here yet.', 'popeye-charters' ); ?></p>
				<?php get_search_form(); ?>
			</div>
		<?php endif; ?>
	</div>
</section>

<?php
get_template_part( 'template-parts/cta-band' );
get_footer();
