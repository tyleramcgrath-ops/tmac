<?php
/**
 * Category rail — approved mockup.
 *
 * Built from the real experience_type terms rather than a hardcoded list, so it
 * always reflects what the site actually sells. Terms with no matching icon fall
 * back to a neutral one.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_terms = get_terms(
	array(
		'taxonomy'   => 'experience_type',
		'hide_empty' => false,
	)
);

if ( ! $pt_terms || is_wp_error( $pt_terms ) ) {
	return;
}

// Map a term slug to an icon; anything unmatched gets the palm mark.
$pt_icon_map = array(
	'surf-lessons'     => 'surf',
	'boat-tours'       => 'boat',
	'fishing-charters' => 'boat',
	'wildlife-nature'  => 'nature',
	'adventure'        => 'transport',
	'private-custom'   => 'gift',
	'wellness-yoga'    => 'wellness',
	'food-dining'      => 'food',
	'events-nightlife' => 'events',
	'transportation'   => 'transport',
	'gift-vouchers'    => 'gift',
);
?>
<section class="rail" aria-label="<?php esc_attr_e( 'Browse by category', 'palmtreesurf' ); ?>">
	<div class="container">
		<ul class="rail__list" data-reveal-group>
			<?php foreach ( $pt_terms as $pt_term ) : ?>
				<?php $pt_icon = isset( $pt_icon_map[ $pt_term->slug ] ) ? $pt_icon_map[ $pt_term->slug ] : 'palm'; ?>
				<li class="rail__item" data-reveal>
					<a class="rail__link" href="<?php echo esc_url( get_term_link( $pt_term ) ); ?>">
						<span class="rail__icon"><?php echo pt_get_icon( $pt_icon, '', 26 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static SVG. ?></span>
						<span class="rail__label"><?php echo esc_html( $pt_term->name ); ?></span>
					</a>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
</section>
