<?php
/**
 * Single blog post.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	$cats = get_the_category();
	get_template_part(
		'template-parts/page-hero',
		null,
		array(
			'image'   => popeye_post_image( null, 'full' ),
			'eyebrow' => $cats ? $cats[0]->name : __( "Captain's Log", 'popeye-charters' ),
			'title'   => get_the_title(),
			/* translators: 1: date, 2: minutes */
			'text'    => sprintf( __( '%1$s · %2$d min read', 'popeye-charters' ), get_the_date(), popeye_reading_time() ),
			'size'    => 'md',
		)
	);
	?>
	<section class="section section--ivory">
		<article <?php post_class( 'container container--narrow' ); ?>>
			<div class="prose">
				<?php
				the_content();
				wp_link_pages();
				?>
			</div>
			<?php the_tags( '<p class="tag-list">', '', '</p>' ); ?>

			<aside class="callout callout--light">
				<h3><?php esc_html_e( 'Ready to see Charleston from the water?', 'popeye-charters' ); ?></h3>
				<p><?php esc_html_e( 'Private charters for up to 10 guests aboard the classic 1979 Popeye.', 'popeye-charters' ); ?></p>
				<div class="btn-row btn-row--center">
					<a class="btn btn--gold" href="<?php echo esc_url( popeye_book_url() ); ?>"><?php esc_html_e( 'Book a Charter', 'popeye-charters' ); ?></a>
					<a class="btn btn--outline-dark" href="<?php echo esc_url( popeye_experiences_url() ); ?>"><?php esc_html_e( 'Browse Experiences', 'popeye-charters' ); ?></a>
				</div>
			</aside>

			<nav class="post-nav">
				<?php
				the_post_navigation(
					array(
						'prev_text' => '<span>&larr; ' . esc_html__( 'Previous', 'popeye-charters' ) . '</span>%title',
						'next_text' => '<span>' . esc_html__( 'Next', 'popeye-charters' ) . ' &rarr;</span>%title',
					)
				);
				?>
			</nav>
			<?php
			if ( comments_open() || get_comments_number() ) {
				comments_template();
			}
			?>
		</article>
	</section>
	<?php
endwhile;

get_footer();
