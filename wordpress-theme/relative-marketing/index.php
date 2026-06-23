<?php
/**
 * Blog index / fallback archive — matches the RMA "Blog" mockup.
 *
 * @package rma
 */

get_header();

$cats = get_categories( array( 'number' => 5, 'orderby' => 'count', 'order' => 'DESC' ) );
?>

<section class="page-hero">
	<div class="container">
		<?php if ( is_home() && ! is_front_page() ) : ?>
			<h1><?php esc_html_e( 'Blog', 'rma' ); ?></h1>
			<p class="lead"><?php esc_html_e( 'Insights, strategies, and trends to help you grow smarter.', 'rma' ); ?></p>
		<?php elseif ( is_archive() ) : ?>
			<h1><?php the_archive_title(); ?></h1>
			<p class="lead"><?php the_archive_description(); ?></p>
		<?php elseif ( is_search() ) : ?>
			<h1><?php printf( esc_html__( 'Search results for: %s', 'rma' ), '<span class="text-blue">' . esc_html( get_search_query() ) . '</span>' ); ?></h1>
		<?php else : ?>
			<h1><?php esc_html_e( 'Blog', 'rma' ); ?></h1>
			<p class="lead"><?php esc_html_e( 'Insights, strategies, and trends to help you grow smarter.', 'rma' ); ?></p>
		<?php endif; ?>
	</div>
</section>

<section class="section--tight">
	<div class="container">
		<?php if ( ! empty( $cats ) ) : ?>
		<div class="filters">
			<a class="filter-pill active" href="<?php echo esc_url( home_url( '/blog/' ) ); ?>"><?php esc_html_e( 'All', 'rma' ); ?></a>
			<?php foreach ( $cats as $cat ) : ?>
				<a class="filter-pill" href="<?php echo esc_url( get_category_link( $cat->term_id ) ); ?>"><?php echo esc_html( $cat->name ); ?></a>
			<?php endforeach; ?>
		</div>
		<?php endif; ?>

		<?php if ( have_posts() ) : ?>
			<?php
			$first = true;
			while ( have_posts() ) :
				the_post();
				$cat = get_the_category();
				if ( $first && ! is_paged() ) :
					$first = false;
					?>
					<article class="blog-featured">
						<a class="thumb" href="<?php the_permalink(); ?>"><?php if ( has_post_thumbnail() ) { the_post_thumbnail( 'large' ); } ?></a>
						<div>
							<div class="meta" style="margin-bottom:12px">
								<?php if ( ! empty( $cat ) ) : ?><span class="cat"><?php echo esc_html( $cat[0]->name ); ?></span><?php endif; ?>
								<span><?php echo esc_html( get_the_date() ); ?></span>
							</div>
							<h2 style="font-size:30px"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
							<p class="lead"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 28 ) ); ?></p>
							<a class="link-arrow" href="<?php the_permalink(); ?>"><?php esc_html_e( 'Read More', 'rma' ); ?><?php echo rma_icon( 'arrow', 16 ); ?></a>
						</div>
					</article>
					<?php
				else :
					?>
					<article class="blog-list-row">
						<a class="thumb" href="<?php the_permalink(); ?>"><?php if ( has_post_thumbnail() ) { the_post_thumbnail( 'thumbnail' ); } ?></a>
						<div>
							<div class="meta" style="margin-bottom:6px">
								<?php if ( ! empty( $cat ) ) : ?><span class="cat"><?php echo esc_html( $cat[0]->name ); ?></span><?php endif; ?>
								<span><?php echo esc_html( get_the_date() ); ?></span>
							</div>
							<h4><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h4>
						</div>
					</article>
					<?php
				endif;
			endwhile;
			?>

			<div style="margin-top:40px" class="center">
				<?php
				the_posts_pagination( array(
					'mid_size'  => 1,
					'prev_text' => __( '&larr; Previous', 'rma' ),
					'next_text' => __( 'Next &rarr;', 'rma' ),
				) );
				?>
			</div>

		<?php else : ?>
			<div class="center" style="padding:60px 0">
				<h3><?php esc_html_e( 'No articles yet', 'rma' ); ?></h3>
				<p class="lead"><?php esc_html_e( 'Check back soon — fresh insights are on the way.', 'rma' ); ?></p>
			</div>
		<?php endif; ?>
	</div>
</section>

<?php
get_footer();
