<?php
/**
 * Pages (also cart, checkout and my account, which WooCommerce renders as page content).
 *
 * @package comfy-humans-cloud
 */

defined( 'ABSPATH' ) || exit;

get_header();
while ( have_posts() ) :
	the_post();
	?>
	<section class="page-sky">
		<div class="sky-layer" data-clouds="back" data-depth="0.3"></div>
		<div class="wrap"><header class="page-head"><h1><?php the_title(); ?></h1></header></div>
	</section>
	<div class="wrap page-body">
		<div class="soft-panel entry"><?php the_content(); ?></div>
	</div>
	<?php
endwhile;
get_footer();
