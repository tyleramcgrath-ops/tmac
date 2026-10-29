<?php
/**
 * Shop, product category and single product pages.
 *
 * @package comfy-humans-cloud
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<section class="page-sky">
	<div class="sky-layer" data-clouds="back" data-depth="0.3"></div>
	<div class="wrap">
		<header class="page-head">
			<?php if ( is_product() ) : ?>
				<?php woocommerce_breadcrumb(); ?>
			<?php else : ?>
				<p class="eyebrow"><?php esc_html_e( 'The feel-good department', 'comfy-humans-cloud' ); ?></p>
				<h1><?php woocommerce_page_title(); ?></h1>
			<?php endif; ?>
		</header>
	</div>
</section>
<div class="wrap page-body shop-body">
	<?php woocommerce_content(); ?>
</div>
<?php
get_footer();
