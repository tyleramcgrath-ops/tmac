<?php
/**
 * Single blog post — matches the RMA "Blog Post" mockup.
 *
 * @package rma
 */

get_header();

while ( have_posts() ) :
	the_post();
	$cat = get_the_category();
	?>

	<article>
		<section class="post-hero">
			<div class="container" style="max-width:840px">
				<div class="breadcrumb"><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'rma' ); ?></a> / <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>"><?php esc_html_e( 'Blog', 'rma' ); ?></a> / <?php the_title(); ?></div>
				<div class="meta" style="margin-bottom:16px;display:flex;gap:12px;align-items:center">
					<?php if ( ! empty( $cat ) ) : ?><span class="cat"><?php echo esc_html( $cat[0]->name ); ?></span><?php endif; ?>
					<span><?php echo esc_html( get_the_date() ); ?></span>
					<span>&middot; <?php echo esc_html( rma_reading_time() ); ?></span>
				</div>
				<h1 style="font-size:clamp(32px,4.4vw,52px)"><?php the_title(); ?></h1>
			</div>
		</section>

		<div class="container" style="max-width:840px">
			<?php if ( has_post_thumbnail() ) : ?>
				<div style="margin:10px 0 40px;border-radius:var(--radius);overflow:hidden"><?php the_post_thumbnail( 'large' ); ?></div>
			<?php else : ?>
				<div class="post-figure"></div>
			<?php endif; ?>
		</div>

		<div class="container">
			<div class="post-content">
				<?php
				the_content();
				wp_link_pages( array(
					'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'rma' ),
					'after'  => '</div>',
				) );
				?>
			</div>
		</div>

		<?php
		$tags = get_the_tags();
		if ( $tags ) : ?>
			<div class="container" style="max-width:760px;margin-top:30px">
				<div style="display:flex;gap:10px;flex-wrap:wrap">
					<?php foreach ( $tags as $tag ) : ?>
						<a class="filter-pill" href="<?php echo esc_url( get_tag_link( $tag->term_id ) ); ?>">#<?php echo esc_html( $tag->name ); ?></a>
					<?php endforeach; ?>
				</div>
			</div>
		<?php endif; ?>
	</article>

	<?php
	// Related posts.
	$related = new WP_Query( array(
		'posts_per_page'      => 3,
		'post__not_in'        => array( get_the_ID() ),
		'ignore_sticky_posts' => true,
		'orderby'             => 'rand',
	) );
	if ( $related->have_posts() ) : ?>
		<section class="section">
			<div class="container">
				<div class="sec-head"><div><span class="eyebrow"><?php esc_html_e( 'Keep Reading', 'rma' ); ?></span><h2><?php esc_html_e( 'More insights.', 'rma' ); ?></h2></div></div>
				<div class="insights-grid">
					<?php while ( $related->have_posts() ) : $related->the_post(); $rcat = get_the_category(); ?>
						<a class="post-card" href="<?php the_permalink(); ?>">
							<div class="thumb"><?php if ( has_post_thumbnail() ) { the_post_thumbnail( 'medium_large' ); } ?></div>
							<div class="pc-body">
								<div class="meta"><?php if ( ! empty( $rcat ) ) : ?><span class="cat"><?php echo esc_html( $rcat[0]->name ); ?></span><?php endif; ?><span><?php echo esc_html( get_the_date() ); ?></span></div>
								<h3><?php the_title(); ?></h3>
							</div>
						</a>
					<?php endwhile; wp_reset_postdata(); ?>
				</div>
			</div>
		</section>
	<?php endif; ?>

	<?php
	if ( comments_open() || get_comments_number() ) {
		echo '<div class="container" style="max-width:760px;padding-bottom:60px">';
		comments_template();
		echo '</div>';
	}
	?>

	<?php get_template_part( 'template-parts/cta' ); ?>

	<?php
endwhile;

get_footer();
