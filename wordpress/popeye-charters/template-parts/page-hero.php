<?php
/**
 * Full-bleed image hero. Args: image, eyebrow, title, title_em, text, size (lg|md|sm), align (left|center), buttons (array of [label,url,style]).
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

$a = wp_parse_args(
	$args,
	array(
		'image'    => '',
		'eyebrow'  => '',
		'title'    => get_the_title(),
		'title_em' => '',
		'text'     => '',
		'size'     => 'md',
		'align'    => 'center',
		'buttons'  => array(),
		'tag'      => 'h1',
	)
);
$tag = in_array( $a['tag'], array( 'h1', 'h2' ), true ) ? $a['tag'] : 'h1';
?>
<section class="hero hero--<?php echo esc_attr( $a['size'] ); ?> hero--<?php echo esc_attr( $a['align'] ); ?>">
	<?php if ( $a['image'] ) : ?>
		<img class="hero__bg" src="<?php echo esc_url( $a['image'] ); ?>" alt="" fetchpriority="high">
	<?php endif; ?>
	<div class="hero__shade" aria-hidden="true"></div>
	<div class="container hero__content">
		<?php if ( $a['eyebrow'] ) : ?>
			<p class="eyebrow eyebrow--gold"><?php echo esc_html( $a['eyebrow'] ); ?></p>
		<?php endif; ?>
		<<?php echo esc_html( $tag ); ?> class="hero__title"><?php echo esc_html( $a['title'] ); ?><?php if ( $a['title_em'] ) : ?><br><em><?php echo esc_html( $a['title_em'] ); ?></em><?php endif; ?></<?php echo esc_html( $tag ); ?>>
		<?php if ( $a['text'] ) : ?>
			<p class="hero__text"><?php echo esc_html( $a['text'] ); ?></p>
		<?php endif; ?>
		<?php if ( $a['buttons'] ) : ?>
			<div class="btn-row">
				<?php foreach ( $a['buttons'] as $b ) : ?>
					<a class="btn btn--<?php echo esc_attr( isset( $b[2] ) ? $b[2] : 'gold' ); ?>" href="<?php echo esc_url( $b[1] ); ?>"><?php echo esc_html( $b[0] ); ?></a>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</div>
</section>
