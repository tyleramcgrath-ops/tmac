<?php
/**
 * Sticky category chip bar.
 *
 * On the hub it scrolls to the matching section; on a category page it links
 * between categories. Either way it is the one control that keeps every
 * category one click away, which is the point of the hub.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_terms = get_terms(
	array(
		'taxonomy'   => 'experience_type',
		'hide_empty' => true,
	)
);

if ( ! $pt_terms || is_wp_error( $pt_terms ) ) {
	return;
}

$pt_hub     = get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE );
$pt_on_hub  = is_post_type_archive( PT_EXPERIENCE_POST_TYPE );
$pt_current = is_tax( 'experience_type' ) ? get_queried_object_id() : 0;
?>
<nav class="cat-nav" aria-label="<?php esc_attr_e( 'Experience categories', 'palmtreesurf' ); ?>" data-cat-nav>
	<div class="container cat-nav__inner">
		<ul class="cat-nav__list">
			<li>
				<a class="cat-chip<?php echo $pt_on_hub ? ' is-current' : ''; ?>" href="<?php echo esc_url( $pt_hub ); ?>"<?php echo $pt_on_hub ? ' data-cat-link="all"' : ''; ?>>
					<?php esc_html_e( 'All', 'palmtreesurf' ); ?>
				</a>
			</li>

			<?php foreach ( $pt_terms as $pt_term ) : ?>
				<?php
				// On the hub, jump to the section. Elsewhere, go to the hub at it.
				$pt_href = $pt_on_hub
					? '#' . rawurlencode( $pt_term->slug )
					: $pt_hub . '#' . rawurlencode( $pt_term->slug );
				?>
				<li>
					<a
						class="cat-chip<?php echo (int) $pt_term->term_id === $pt_current ? ' is-current' : ''; ?>"
						href="<?php echo esc_url( $pt_href ); ?>"
						data-cat-link="<?php echo esc_attr( $pt_term->slug ); ?>"
					>
						<?php echo esc_html( $pt_term->name ); ?>
						<span class="cat-chip__count"><?php echo esc_html( number_format_i18n( $pt_term->count ) ); ?></span>
					</a>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
</nav>
