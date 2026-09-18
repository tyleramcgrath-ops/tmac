<?php
/**
 * Document head and site header.
 *
 * The header is transparent over the hero on the front page and solid
 * everywhere else. The swap to solid is driven by an IntersectionObserver on a
 * 1px sentinel rather than a scroll listener (VISUAL-SPEC.md section 7.1).
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_overlay = is_front_page() && ! is_paged();
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<?php wp_head(); ?>
</head>

<body <?php body_class( $pt_overlay ? 'has-overlay-header' : 'has-solid-header' ); ?>>
<?php wp_body_open(); ?>

<a class="skip-link" href="#main"><?php esc_html_e( 'Skip to content', 'palmtreesurf' ); ?></a>

<?php // Sentinel the header observer watches. Never visible. ?>
<div class="header-sentinel" aria-hidden="true"></div>

<div id="page" class="site">
	<header id="masthead" class="site-header<?php echo $pt_overlay ? '' : ' is-stuck is-static'; ?>">
		<div class="site-header__inner container">
			<div class="site-branding">
				<?php
				if ( has_custom_logo() ) {
					the_custom_logo();
				} else {
					printf(
						'<a class="site-logo" href="%1$s" rel="home"><span class="site-logo__mark" aria-hidden="true"></span><span class="site-logo__text">%2$s</span></a>',
						esc_url( home_url( '/' ) ),
						esc_html( get_bloginfo( 'name' ) )
					);
				}
				?>
			</div>

			<button class="menu-toggle" type="button" aria-controls="primary-menu" aria-expanded="false">
				<span class="menu-toggle__bars" aria-hidden="true"></span>
				<span class="screen-reader-text"><?php esc_html_e( 'Open menu', 'palmtreesurf' ); ?></span>
			</button>

			<nav id="site-navigation" class="site-nav" aria-label="<?php esc_attr_e( 'Primary', 'palmtreesurf' ); ?>">
				<?php
				if ( has_nav_menu( 'primary' ) ) {
					wp_nav_menu(
						array(
							'theme_location' => 'primary',
							'menu_id'        => 'primary-menu',
							'menu_class'     => 'nav',
							'container'      => false,
							'depth'          => 2,
							'walker'         => new PT_Nav_Walker(),
						)
					);
				}
				?>

				<div class="site-nav__actions">
					<?php
					$pt_wa = pt_whatsapp_url();
					if ( $pt_wa ) {
						printf(
							'<a class="site-nav__wa" href="%1$s" rel="noopener" target="_blank" title="%2$s"><span class="screen-reader-text">%2$s</span><span aria-hidden="true">%3$s</span></a>',
							esc_url( $pt_wa ),
							esc_attr__( 'Message us on WhatsApp', 'palmtreesurf' ),
							esc_html__( 'WhatsApp', 'palmtreesurf' )
						);
					}

					pt_booking_button(
						array(
							'label'    => pt_filled( 'pt_header_cta_text' ) ? pt_filled( 'pt_header_cta_text' ) : __( 'Book Now', 'palmtreesurf' ),
							'location' => 'header',
							'class'    => 'btn btn--primary btn--sm',
						)
					);
					?>
				</div>
			</nav>
		</div>
	</header>

	<main id="main" class="site-main">
