<?php
/**
 * Banner used at the top of interior pages.
 *
 * @package NetworkIP
 *
 * @var array $args { title: string, text?: string }
 */

$networkip_title = isset( $args['title'] ) ? $args['title'] : '';
$networkip_text  = isset( $args['text'] ) ? $args['text'] : '';
?>
<header class="nip-page-header">
	<div class="nip-page-header__media" aria-hidden="true">
		<?php networkip_picture( 'network-map', 'nip-page-header__img', true, 2560, 1024 ); ?>
	</div>
	<div class="nip-wrap nip-page-header__inner">
		<h1><?php echo esc_html( $networkip_title ); ?></h1>
		<?php if ( $networkip_text ) : ?>
			<p class="nip-lead"><?php echo esc_html( $networkip_text ); ?></p>
		<?php endif; ?>
	</div>
</header>
