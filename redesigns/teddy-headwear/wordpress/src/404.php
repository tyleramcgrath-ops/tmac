<?php
/**
 * Not found: the bear, lost.
 */
defined( 'ABSPATH' ) || exit;
teddy_body( array( 'page' => '404' ) );
get_header();
?>
<section class="phero" style="min-height:80vh;display:grid;align-items:center">
	<div class="wrap" style="display:grid;gap:22px;justify-items:start">
		<div data-bear style="width:140px"></div>
		<span class="eyebrow"><?php esc_html_e( 'Error 404', 'teddy' ); ?></span>
		<h1 class="display" style="font-size:clamp(48px,9vw,140px)"><?php esc_html_e( 'Off the', 'teddy' ); ?> <span class="serif-i gold"><?php esc_html_e( 'map.', 'teddy' ); ?></span></h1>
		<p class="lede" style="margin:0"><?php esc_html_e( "This page wandered off. The hats didn't.", 'teddy' ); ?></p>
		<div style="display:flex;gap:12px;flex-wrap:wrap">
			<a class="btn" href="<?php echo esc_url( teddy_url( 'shop' ) ); ?>"><?php esc_html_e( 'Shop hats', 'teddy' ); ?> <span class="arrow">→</span></a>
			<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back home', 'teddy' ); ?></a>
		</div>
	</div>
</section>
<?php
get_footer();
