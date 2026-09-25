<?php
/**
 * A plain page. Cart, checkout, and account pages land here too, so the
 * light "shop" surface applies to them.
 *
 * @package drip
 */

$drip_is_shop_page = drip_has_woo() && ( is_cart() || is_checkout() || is_account_page() );
?>
<main id="main" class="page-main <?php echo $drip_is_shop_page ? 'light shop-page' : 'plain-page'; ?>">
	<header class="page-head wrap">
		<?php if ( $drip_is_shop_page ) : ?>
			<p class="eyebrow"><?php echo is_cart() ? 'Your bag' : ( is_checkout() ? 'Checkout' : 'Account' ); ?></p>
		<?php endif; ?>
		<h1 class="page-title"><?php the_title(); ?></h1>
	</header>
	<div class="wrap page-body entry">
		<?php the_content(); ?>
	</div>
</main>
