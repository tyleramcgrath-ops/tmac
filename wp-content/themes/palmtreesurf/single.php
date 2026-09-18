<?php
/**
 * Single journal post.
 *
 * Designed like the rest of the site rather than dropped into the default
 * two-column blog layout: photo header, a readable measure, a contents list
 * built from the post's own headings, and a related rail at the foot. No
 * widget sidebar — Search and Recent Comments next to a 2,000-word guide is
 * noise that competes with the thing the reader came for.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();

	$pt_id       = get_the_ID();
	$pt_headings = pt_post_headings( get_post_field( 'post_content', $pt_id ) );
	$pt_minutes  = pt_reading_time( get_post_field( 'post_content', $pt_id ) );
	?>
	<article <?php post_class( 'entry entry--post' ); ?>>
		<header class="post-hero">
			<?php if ( has_post_thumbnail() ) : ?>
				<div class="post-hero__media" aria-hidden="true">
					<?php the_post_thumbnail( 'pt-hero', array( 'loading' => 'eager', 'fetchpriority' => 'high' ) ); ?>
				</div>
			<?php endif; ?>

			<div class="post-hero__inner container container--narrow">
				<?php
				$pt_cats = get_the_category();

				if ( $pt_cats ) :
					?>
					<p class="eyebrow post-hero__cat">
						<a href="<?php echo esc_url( get_category_link( $pt_cats[0] ) ); ?>">
							<?php echo esc_html( $pt_cats[0]->name ); ?>
						</a>
					</p>
				<?php endif; ?>

				<h1 class="post-hero__title"><?php the_title(); ?></h1>

				<p class="post-hero__meta">
					<time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
					<?php if ( $pt_minutes ) : ?>
						<span aria-hidden="true">&middot;</span>
						<span>
							<?php
							printf(
								/* translators: %s: number of minutes. */
								esc_html( _n( '%s minute read', '%s minute read', $pt_minutes, 'palmtreesurf' ) ),
								esc_html( number_format_i18n( $pt_minutes ) )
							);
							?>
						</span>
					<?php endif; ?>
				</p>
			</div>
		</header>

		<div class="container">
			<?php get_template_part( 'template-parts/components/breadcrumbs' ); ?>
		</div>

		<div class="container container--narrow post-body">
			<?php if ( count( $pt_headings ) > 3 ) : ?>
				<nav class="post-toc" aria-label="<?php esc_attr_e( 'On this page', 'palmtreesurf' ); ?>">
					<h2 class="post-toc__title"><?php esc_html_e( 'On this page', 'palmtreesurf' ); ?></h2>
					<ol class="post-toc__list">
						<?php foreach ( $pt_headings as $pt_heading ) : ?>
							<li><a href="#<?php echo esc_attr( $pt_heading['id'] ); ?>"><?php echo esc_html( $pt_heading['text'] ); ?></a></li>
						<?php endforeach; ?>
					</ol>
				</nav>
			<?php endif; ?>

			<div class="entry__content">
				<?php
				the_content();

				wp_link_pages(
					array(
						'before' => '<div class="page-links">',
						'after'  => '</div>',
					)
				);
				?>
			</div>

			<?php pt_post_tags(); ?>
		</div>

		<?php get_template_part( 'template-parts/components/post-cta' ); ?>
	</article>

	<?php get_template_part( 'template-parts/components/related', 'posts' ); ?>
	<?php
endwhile;

get_footer();
