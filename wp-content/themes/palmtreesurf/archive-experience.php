<?php
/**
 * Experiences archive and experience taxonomy archives.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<?php get_template_part( 'template-parts/components/breadcrumbs' ); ?>
<div class="container">
	<header class="page-header">
		<?php if ( is_tax() ) : ?>
			<p class="eyebrow"><?php esc_html_e( 'Experiences', 'palmtreesurf' ); ?></p>
			<?php the_archive_title( '<h1 class="page-title">', '</h1>' ); ?>
			<?php the_archive_description( '<div class="section__lede">', '</div>' ); ?>
		<?php else : ?>
			<p class="eyebrow"><?php esc_html_e( 'Experiences & Adventures', 'palmtreesurf' ); ?></p>
			<h1 class="page-title"><?php esc_html_e( 'Explore Tamarindo Activities', 'palmtreesurf' ); ?></h1>
			<p class="section__lede">
				<?php esc_html_e( 'Surf lessons, fishing charters, boat tours and wildlife adventures — led by local certified guides.', 'palmtreesurf' ); ?>
			</p>
		<?php endif; ?>
	</header>

	<?php get_template_part( 'template-parts/components/filter-panel' ); ?>

	<?php
	$pt_types = get_terms(
		array(
			'taxonomy'   => 'experience_type',
			'hide_empty' => true,
		)
	);

	if ( $pt_types && ! is_wp_error( $pt_types ) ) :
		?>
		<nav class="filters" aria-label="<?php esc_attr_e( 'Filter by category', 'palmtreesurf' ); ?>" style="margin-top:var(--pt-space-lg)">
			<ul class="filters__list">
				<li>
					<a class="filters__link<?php echo is_post_type_archive() ? ' is-current' : ''; ?>" href="<?php echo esc_url( get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>">
						<?php esc_html_e( 'All', 'palmtreesurf' ); ?>
					</a>
				</li>
				<?php foreach ( $pt_types as $pt_type ) : ?>
					<li>
						<a class="filters__link<?php echo is_tax( 'experience_type', $pt_type->term_id ) ? ' is-current' : ''; ?>" href="<?php echo esc_url( get_term_link( $pt_type ) ); ?>">
							<?php echo esc_html( $pt_type->name ); ?>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>
		</nav>
	<?php endif; ?>

	<?php if ( have_posts() ) : ?>
		<div class="card-grid" data-reveal-group>
			<?php
			while ( have_posts() ) :
				the_post();
				get_template_part( 'template-parts/components/card', 'experience' );
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
