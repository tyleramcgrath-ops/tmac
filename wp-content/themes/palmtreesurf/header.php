<?php
/**
 * Document head and site header.
 *
 * Matches the approved mockup: logo, compact nav, search, language, login and a
 * coral Sign Up. Transparent over the homepage hero, solid on internal pages.
 *
 * Controls that would have nowhere real to go are not rendered: the language
 * switcher only appears when a translation plugin is active, and Sign Up only
 * when registration is actually open. A dead control is worse than none.
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
						'<a class="site-logo" href="%1$s" rel="home">%2$s<span class="site-logo__text"><span class="site-logo__name">%3$s</span><span class="site-logo__sub">%4$s</span></span></a>',
						esc_url( home_url( '/' ) ),
						pt_get_icon( 'palm', 'site-logo__mark' ),
						esc_html__( 'Palm Tree', 'palmtreesurf' ),
						esc_html__( 'Surf', 'palmtreesurf' )
					);
				}
				?>
			</div>

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
					<button class="site-nav__search" type="button" data-pt-search-toggle aria-expanded="false" aria-controls="pt-search-panel">
						<?php echo pt_get_icon( 'search' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static SVG. ?>
						<span class="screen-reader-text"><?php esc_html_e( 'Search', 'palmtreesurf' ); ?></span>
					</button>

					<?php pt_language_switcher(); ?>

					<?php if ( ! is_user_logged_in() ) : ?>
						<a class="site-nav__login" href="<?php echo esc_url( wp_login_url( home_url( '/' ) ) ); ?>">
							<?php esc_html_e( 'Login', 'palmtreesurf' ); ?>
						</a>

						<?php if ( get_option( 'users_can_register' ) ) : ?>
							<a class="btn btn--coral btn--sm" href="<?php echo esc_url( wp_registration_url() ); ?>">
								<?php esc_html_e( 'Sign Up', 'palmtreesurf' ); ?>
							</a>
						<?php else : ?>
							<?php
							pt_booking_button(
								array(
									'label'    => pt_filled( 'pt_header_cta_text' ) ? pt_filled( 'pt_header_cta_text' ) : __( 'Book Now', 'palmtreesurf' ),
									'location' => 'header',
									'class'    => 'btn btn--coral btn--sm',
								)
							);
							?>
						<?php endif; ?>
					<?php else : ?>
						<a class="site-nav__login" href="<?php echo esc_url( admin_url( 'profile.php' ) ); ?>">
							<?php esc_html_e( 'My Account', 'palmtreesurf' ); ?>
						</a>
						<a class="btn btn--coral btn--sm" href="<?php echo esc_url( wp_logout_url( home_url( '/' ) ) ); ?>">
							<?php esc_html_e( 'Log Out', 'palmtreesurf' ); ?>
						</a>
					<?php endif; ?>
				</div>
			</nav>

			<button class="menu-toggle" type="button" aria-controls="primary-menu" aria-expanded="false">
				<span class="menu-toggle__bars" aria-hidden="true"></span>
				<span class="screen-reader-text"><?php esc_html_e( 'Open menu', 'palmtreesurf' ); ?></span>
			</button>
		</div>

		<div class="search-panel" id="pt-search-panel" hidden>
			<div class="container">
				<?php get_search_form(); ?>
			</div>
		</div>
	</header>

	<main id="main" class="site-main">
