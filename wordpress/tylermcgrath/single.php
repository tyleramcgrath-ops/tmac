<?php
/**
 * A single journal entry.
 *
 * @package tylermcgrath
 */

get_header();
while ( have_posts() ) :
	the_post();
	?>
	<main id="main" class="tm-main tm-inner">
		<?php
		$tm_cats = get_the_category_list( ', ' );
		get_template_part(
			'template-parts/page-hero',
			null,
			array(
				'eyebrow' => esc_html( get_the_date() ) . ( $tm_cats ? ' · ' . $tm_cats : '' ),
				'title'   => esc_html( get_the_title() ),
				'lede'    => has_excerpt() ? esc_html( get_the_excerpt() ) : '',
			)
		);
		?>
		<article <?php post_class( 'tm-section tm-article' ); ?>>
			<?php if ( has_post_thumbnail() ) : ?>
				<figure class="tm-article__media tm-wrap" data-reveal><?php the_post_thumbnail( 'tm-wide' ); ?></figure>
			<?php endif; ?>
			<div class="tm-content tm-prose">
				<?php
				the_content();
				wp_link_pages();
				?>
			</div>
			<footer class="tm-content tm-article__foot">
				<?php the_tags( '<div class="tm-tags">', '', '</div>' ); ?>
				<nav class="tm-postnav">
					<?php previous_post_link( '<div>%link</div>', '← %title' ); ?>
					<?php next_post_link( '<div>%link</div>', '%title →' ); ?>
				</nav>
			</footer>
			<?php
			if ( comments_open() || get_comments_number() ) {
				echo '<div class="tm-content">';
				comments_template();
				echo '</div>';
			}
			?>
		</article>
	</main>
	<?php
endwhile;
get_footer();
