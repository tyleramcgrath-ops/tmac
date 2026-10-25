<?php
/**
 * Document head, the website-history intro (home only), and the navigation.
 *
 * @package rma
 */

$rma_slug = is_page() ? get_post_field( 'post_name', get_queried_object_id() ) : '';
$rma_in_services = 'services' === $rma_slug || array_key_exists( $rma_slug, rma_services() );
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

<?php
if ( is_front_page() ) {
	get_template_part( 'template-parts/intro' );
}
?>

<div class="grain" aria-hidden="true"></div>

<header class="site-header" data-header>
	<nav class="nav wrap" aria-label="Primary">
		<a class="brand" href="<?php echo rma_url(); ?>" aria-label="Relative Marketing Agency home">
			<?php echo rma_logo(); // phpcs:ignore WordPress.Security.EscapeOutput -- built from escaped parts. ?>
			<span class="brand-words"><b>Relative</b><b>Marketing</b><b>Agency</b></span>
		</a>

		<div class="nav-links" id="nav-links" data-nav-links>
			<a href="<?php echo rma_url(); ?>" <?php echo is_front_page() ? 'aria-current="page"' : ''; ?>>Home</a>
			<div class="menu-group">
				<a href="<?php echo rma_url( 'services' ); ?>" <?php echo $rma_in_services ? 'aria-current="page"' : ''; ?>>Services <span class="caret" aria-hidden="true"></span></a>
				<div class="mega-menu">
					<p class="mega-label">Eight services, one system</p>
					<div class="mega-grid">
						<?php foreach ( rma_services() as $slug => $service ) : ?>
							<a href="<?php echo rma_url( $slug ); ?>" <?php echo $slug === $rma_slug ? 'aria-current="page"' : ''; ?>>
								<span class="mega-icon"><?php echo rma_icon( $slug, 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
								<span><b><?php echo esc_html( $service['title'] ); ?></b><small><?php echo esc_html( $service['tag'] ); ?></small></span>
							</a>
						<?php endforeach; ?>
					</div>
				</div>
			</div>
			<?php foreach ( array( 'case-studies', 'about', 'insights', 'contact' ) as $slug ) : ?>
				<a href="<?php echo rma_url( $slug ); ?>" <?php echo $slug === $rma_slug ? 'aria-current="page"' : ''; ?>><?php echo esc_html( rma_company_pages()[ $slug ]['title'] ); ?></a>
			<?php endforeach; ?>
		</div>

		<a class="btn btn-small nav-cta" href="<?php echo rma_url( 'contact' ); ?>">Let's Grow <?php echo rma_icon( 'arrow', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
		<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" data-nav-toggle>
			<span class="sr-only">Menu</span>
			<span class="nav-toggle-bars" aria-hidden="true"></span>
		</button>
	</nav>
</header>
