<?php
/**
 * Hero band for inner pages.
 *
 * @package tylermcgrath
 *
 * @var array $args eyebrow, title, lede.
 */

$args = wp_parse_args(
	$args,
	array(
		'eyebrow' => '',
		'title'   => '',
		'lede'    => '',
	)
);
?>
<header class="tm-page-hero" data-section="page" data-compass="idle">
	<div class="tm-page-hero__sky" aria-hidden="true" style="background-image:url('<?php echo esc_url( tm_room_image() ); ?>')"></div>
	<canvas class="tm-room__stars" data-stars aria-hidden="true"></canvas>
	<div class="tm-wrap tm-page-hero__inner">
		<?php if ( $args['eyebrow'] ) : ?>
			<span class="tm-eyebrow" data-reveal><?php echo wp_kses_post( $args['eyebrow'] ); ?></span>
		<?php endif; ?>
		<h1 class="tm-page-hero__title" data-reveal><?php echo wp_kses_post( $args['title'] ); ?></h1>
		<?php if ( $args['lede'] ) : ?>
			<p class="tm-page-hero__lede" data-reveal><?php echo wp_kses_post( $args['lede'] ); ?></p>
		<?php endif; ?>
	</div>
</header>
