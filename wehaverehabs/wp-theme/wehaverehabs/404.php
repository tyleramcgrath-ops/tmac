<?php
/**
 * Not found.
 *
 * @package WeHaveRehabs
 */

get_header();
?>
<section class="section">
	<div class="narrow center">
		<img class="mark" src="<?php echo esc_url( whr_asset( 'brand/mark-lotus.svg' ) ); ?>" alt="" width="96" height="52" style="height:52px;width:auto;margin:0 auto 26px">
		<h1 class="display"><?php echo wp_kses_post( __( 'This path has <em>wandered off</em>', 'wehaverehabs' ) ); ?></h1>
		<p class="lede" style="margin:22px 0 32px"><?php esc_html_e( 'The page you were looking for isn’t here. Let’s find your way back.', 'wehaverehabs' ); ?></p>
		<div class="btn-row" style="justify-content:center">
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'wehaverehabs' ); ?></a>
			<a class="btn btn--outline" href="<?php echo esc_url( get_post_type_archive_link( 'sanctuary' ) ); ?>"><?php esc_html_e( 'Browse sanctuaries', 'wehaverehabs' ); ?></a>
		</div>
	</div>
</section>
<?php
get_footer();
