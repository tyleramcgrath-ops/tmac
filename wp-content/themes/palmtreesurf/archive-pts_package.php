<?php
/**
 * Packages archive and package taxonomy archives.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>

<div class="container">
	<header class="page-header">
		<?php if ( is_tax() ) : ?>
			<?php
			the_archive_title( '<h1 class="page-title">', '</h1>' );
			the_archive_description( '<div class="archive-description">', '</div>' );
			?>
		<?php else : ?>
			<h1 class="page-title"><?php esc_html_e( 'Surf Packages', 'palmtreesurf' ); ?></h1>
			<?php
			$pts_archive_page = get_post_type_object( PTS_PACKAGE_POST_TYPE );
			if ( $pts_archive_page && ! empty( $pts_archive_page->description ) ) {
				printf( '<div class="archive-description">%s</div>', esc_html( $pts_archive_page->description ) );
			}
			?>
		<?php endif; ?>
	</header>

	<?php
	$pts_types = get_terms(
		array(
			'taxonomy'   => 'pts_package_type',
			'hide_empty' => true,
		)
	);

	if ( $pts_types && ! is_wp_error( $pts_types ) ) :
		?>
		<nav class="filters" aria-label="<?php esc_attr_e( 'Filter packages', 'palmtreesurf' ); ?>">
			<ul class="filters__list">
				<li>
					<a class="filters__link<?php echo is_post_type_archive() ? ' is-current' : ''; ?>" href="<?php echo esc_url( get_post_type_archive_link( PTS_PACKAGE_POST_TYPE ) ); ?>">
						<?php esc_html_e( 'All', 'palmtreesurf' ); ?>
					</a>
				</li>
				<?php foreach ( $pts_types as $pts_type ) : ?>
					<li>
						<a class="filters__link<?php echo is_tax( 'pts_package_type', $pts_type->term_id ) ? ' is-current' : ''; ?>" href="<?php echo esc_url( get_term_link( $pts_type ) ); ?>">
							<?php echo esc_html( $pts_type->name ); ?>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>
		</nav>
	<?php endif; ?>

	<?php if ( have_posts() ) : ?>
		<div class="package-grid">
			<?php
			while ( have_posts() ) :
				the_post();
				get_template_part( 'template-parts/card', 'package' );
			endwhile;
			?>
		</div>

		<?php pts_pagination(); ?>
	<?php else : ?>
		<?php get_template_part( 'template-parts/content', 'none' ); ?>
	<?php endif; ?>
</div>

<?php
get_footer();
