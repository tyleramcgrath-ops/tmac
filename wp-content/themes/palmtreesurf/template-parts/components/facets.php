<?php
/**
 * Sidebar facets for the experiences listing.
 *
 * Only renders filters backed by real taxonomy data — the brief is explicit
 * that a filter should exist only when something stands behind it.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_groups = array(
	'experience_type' => __( 'Categories', 'palmtreesurf' ),
	'skill_level'     => __( 'Skill level', 'palmtreesurf' ),
);
?>
<aside class="facets" aria-label="<?php esc_attr_e( 'Filter experiences', 'palmtreesurf' ); ?>">
	<?php foreach ( $pt_groups as $pt_tax => $pt_label ) : ?>
		<?php
		$pt_terms = get_terms(
			array(
				'taxonomy'   => $pt_tax,
				'hide_empty' => true,
			)
		);

		if ( ! $pt_terms || is_wp_error( $pt_terms ) ) {
			continue;
		}
		?>
		<div class="facets__group">
			<h3><?php echo esc_html( $pt_label ); ?></h3>
			<ul class="facets__list">
				<li>
					<a class="<?php echo is_post_type_archive() ? 'is-current' : ''; ?>" href="<?php echo esc_url( get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>">
						<span><?php esc_html_e( 'All', 'palmtreesurf' ); ?></span>
					</a>
				</li>
				<?php foreach ( $pt_terms as $pt_term ) : ?>
					<li>
						<a class="<?php echo is_tax( $pt_tax, $pt_term->term_id ) ? 'is-current' : ''; ?>" href="<?php echo esc_url( get_term_link( $pt_term ) ); ?>">
							<span><?php echo esc_html( $pt_term->name ); ?></span>
							<span class="facets__count"><?php echo esc_html( number_format_i18n( $pt_term->count ) ); ?></span>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>
		</div>
	<?php endforeach; ?>
</aside>
