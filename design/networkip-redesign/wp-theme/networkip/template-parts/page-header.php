<?php
/**
 * Light banner at the top of interior pages, with the gold globe on the right.
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
		<?php networkip_webp( 'hero-globe-gold', array( 960, 1600, 1920 ), 'nip-page-header__img', true, 1920, 1080, '60vw' ); ?>
	</div>
	<div class="nip-wrap nip-page-header__inner">
		<h1><?php echo networkip_highlight( $networkip_title, '' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in networkip_highlight(). ?></h1>
		<?php if ( $networkip_text ) : ?>
			<p class="nip-lead"><?php echo esc_html( $networkip_text ); ?></p>
		<?php endif; ?>
	</div>
</header>
