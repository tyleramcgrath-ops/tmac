<?php
/**
 * Regular pages, including WooCommerce Cart, Checkout and My Account:
 * the page title on the dark band, the content on a bone panel.
 */
defined( 'ABSPATH' ) || exit;
teddy_body( array( 'page' => 'page' ) );
get_header();
while ( have_posts() ) :
	the_post();
	?>
	<section class="phero"><div class="wrap" style="display:grid;gap:18px">
		<span class="eyebrow"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></span>
		<h1 class="display" style="font-size:clamp(44px,8vw,120px)"><?php the_title(); ?></h1>
	</div></section>
	<section class="section--tight"><div class="wrap">
		<div class="page-panel entry-content"><?php the_content(); ?></div>
	</div></section>
	<?php
endwhile;
get_footer();
