<?php
/**
 * Document head, the announcement line, and the navigation.
 *
 * @package drip
 */

$drip_shop_links = array(
	array( 'Shop all', drip_wc_url( 'shop' ) ),
);
foreach ( drip_shop_categories() as $drip_term ) {
	$drip_shop_links[] = array( $drip_term->name, get_term_link( $drip_term ) );
}
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#main">Skip to content</a>

<div class="announce">
	<a href="<?php echo drip_wc_url( 'shop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">
		<span class="announce-dot" aria-hidden="true"></span>
		The new drop is live<span class="announce-more"> — back prints in black &amp; white</span>
		<?php echo drip_icon( 'arrow', 14 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
	</a>
</div>

<header class="site-header" data-header>
	<div class="nav wrap">
		<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-panel" data-nav-toggle>
			<span class="sr-only">Menu</span>
			<span class="nav-toggle-bars" aria-hidden="true"></span>
		</button>

		<nav class="nav-links" id="nav-panel" aria-label="Primary" data-nav-panel>
			<?php if ( has_nav_menu( 'primary' ) ) : ?>
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'primary',
						'container'      => false,
						'menu_class'     => 'menu',
						'depth'          => 1,
					)
				);
				?>
			<?php else : ?>
				<ul class="menu">
					<?php foreach ( $drip_shop_links as $drip_link ) : ?>
						<li><a href="<?php echo esc_url( $drip_link[1] ); ?>"><?php echo esc_html( $drip_link[0] ); ?></a></li>
					<?php endforeach; ?>
					<li><a href="<?php echo drip_url( 'about' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Story</a></li>
					<li><a href="<?php echo drip_url( 'contact' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Contact</a></li>
				</ul>
			<?php endif; ?>
			<p class="nav-panel-foot">Born from salt water.</p>
		</nav>

		<a class="brand" href="<?php echo drip_url(); // phpcs:ignore WordPress.Security.EscapeOutput ?>" aria-label="DRIP home">
			<?php echo drip_logo( 'header' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		</a>

		<div class="nav-tools">
			<a class="tool tool-account" href="<?php echo drip_wc_url( 'myaccount' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>" aria-label="Account">
				<?php echo drip_icon( 'user', 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			</a>
			<a class="tool tool-bag" href="<?php echo drip_wc_url( 'cart' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>" aria-label="Bag">
				<?php echo drip_icon( 'bag', 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<?php echo drip_bag_count_html(); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			</a>
		</div>
	</div>
</header>
