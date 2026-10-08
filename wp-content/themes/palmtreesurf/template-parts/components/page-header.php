<?php
/**
 * The banner every page opens with.
 *
 * About, Experiences and List Your Tours each had a proper header while the
 * Journal, the Gallery, Contact and every article opened straight onto body
 * text under a bare strip of white. Same treatment, one place, so a page added
 * later cannot quietly ship without one.
 *
 * @package PalmTreeSurf
 *
 * @var array $args {
 *     @type string $title    Heading. Defaults to the current page's title.
 *     @type string $lede     Optional sentence under the heading.
 *     @type string $script   Small handwritten line above it.
 *     @type string $slot     Manifest image slot to fall back on.
 *     @type string $modifier Extra class, for per-page tuning.
 * }
 */

$pt_title = isset( $args['title'] ) && '' !== $args['title']
	? $args['title']
	: get_the_title();

$pt_lede     = isset( $args['lede'] ) ? $args['lede'] : '';
$pt_script   = isset( $args['script'] ) ? $args['script'] : __( 'Pura Vida', 'palmtreesurf' );
$pt_slot     = isset( $args['slot'] ) ? $args['slot'] : 'split-1-primary';
$pt_modifier = isset( $args['modifier'] ) ? $args['modifier'] : '';
$pt_file     = isset( $args['file'] ) ? $args['file'] : '';
$pt_alt      = isset( $args['alt'] ) ? $args['alt'] : '';

// Set when the page's featured image is not this page's own picture.
$pt_ignore_thumb = ! empty( $args['ignore_thumbnail'] );
?>

<section class="page-hero<?php echo $pt_modifier ? ' page-hero--' . esc_attr( $pt_modifier ) : ''; ?>">
	<div class="page-hero__media" aria-hidden="true">
		<?php
		/*
		 * An explicit file wins, then the page's own featured image, then a
		 * manifest slot. The explicit option exists because on the Journal the
		 * loop's first post is already the current post, so a featured-image
		 * banner quietly showed the newest article's photo — the same picture
		 * the card right beneath it was showing.
		 */
		if ( $pt_file ) {
			pt_bundled_image( $pt_file, $pt_alt );
		} elseif ( ! $pt_ignore_thumb && has_post_thumbnail() ) {
			the_post_thumbnail( 'pt-hero', array( 'loading' => 'eager' ) );
		} else {
			pt_image( $pt_slot, array( 'priority' => true ) );
		}
		?>
	</div>

	<div class="page-hero__inner container">
		<?php if ( $pt_script ) : ?>
			<p class="page-hero__script"><?php echo esc_html( $pt_script ); ?></p>
		<?php endif; ?>

		<h1 class="page-hero__title"><?php echo esc_html( $pt_title ); ?></h1>

		<?php if ( $pt_lede ) : ?>
			<p class="page-hero__lede"><?php echo esc_html( $pt_lede ); ?></p>
		<?php endif; ?>
	</div>
</section>
