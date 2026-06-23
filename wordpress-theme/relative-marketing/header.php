<?php
/**
 * Header template.
 *
 * @package rma
 */
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header">
	<div class="container header-inner">
		<a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
			<?php echo rma_brand_mark(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		</a>

		<nav class="main-nav" aria-label="<?php esc_attr_e( 'Primary', 'rma' ); ?>">
			<?php
			if ( has_nav_menu( 'primary' ) ) {
				wp_nav_menu( array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_class'     => 'menu',
					'depth'          => 2,
				) );
			} else {
				rma_default_menu();
			}
			?>
		</nav>

		<div class="header-actions">
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( "Let's Grow", 'rma' ); ?></a>
			<button class="nav-toggle" aria-label="<?php esc_attr_e( 'Toggle menu', 'rma' ); ?>" aria-expanded="false">
				<span></span><span></span><span></span>
			</button>
		</div>
	</div>

	<div class="mobile-nav">
		<?php
		if ( has_nav_menu( 'primary' ) ) {
			wp_nav_menu( array(
				'theme_location' => 'primary',
				'container'      => false,
				'menu_class'     => 'menu',
				'depth'          => 1,
			) );
		} else {
			rma_default_menu();
		}
		?>
		<a class="btn btn--primary btn--block" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( "Let's Grow", 'rma' ); ?></a>
	</div>
</header>

<main id="content" class="site-content">
