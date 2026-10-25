<?php
/**
 * Site header: entrance doors (home, first visit), studio header, waypoint menu.
 *
 * @package tylermcgrath
 */

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="theme-color" content="#03040a">
	<?php if ( is_front_page() ) : ?>
		<link rel="preload" as="image" href="<?php echo esc_url( tm_room_image() ); ?>">
	<?php endif; ?>
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="tm-skip" href="#main"><?php esc_html_e( 'Skip to content', 'tylermcgrath' ); ?></a>

<?php if ( is_front_page() && tm_mod( 'entrance_on' ) ) : ?>
	<div class="tm-entrance" role="dialog" aria-modal="true" aria-labelledby="tm-entrance-title">
		<div class="tm-entrance__architecture" aria-hidden="true"></div>
		<div class="tm-door tm-door--left" aria-hidden="true"><span></span></div>
		<div class="tm-door tm-door--right" aria-hidden="true"><span></span></div>
		<div class="tm-door-seam" aria-hidden="true"></div>
		<div class="tm-entrance__plate">
			<?php tm_seal( 'tm-entrance__seal' ); ?>
			<h2 id="tm-entrance-title"><?php echo tm_caps( tm_mod( 'entrance_title' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></h2>
			<p><?php echo esc_html( tm_mod( 'entrance_text' ) ); ?></p>
			<button type="button" class="tm-entrance__enter" data-enter>
				<?php echo esc_html( tm_mod( 'entrance_button' ) ); ?><span aria-hidden="true">↗</span>
			</button>
		</div>
		<div class="tm-entrance__footer" aria-hidden="true">
			<span><?php echo tm_caps( get_bloginfo( 'name' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
			<span><?php echo esc_html( tm_mod( 'entrance_footer' ) ); ?></span>
		</div>
	</div>
<?php endif; ?>

<div class="tm-cursor" aria-hidden="true"><span class="tm-cursor__dot"></span><span class="tm-cursor__ring"></span></div>

<header class="tm-header" data-header>
	<div class="tm-header__location">
		<i aria-hidden="true"></i>
		<?php echo esc_html( tm_mod( 'location_label' ) ); ?>
		<span><?php echo esc_html( tm_mod( 'location_sub' ) ); ?></span>
	</div>

	<a class="tm-brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
		<?php
		if ( has_custom_logo() ) {
			echo wp_get_attachment_image( get_theme_mod( 'custom_logo' ), 'thumbnail', false, array( 'class' => 'tm-brand__logo' ) );
		}
		?>
		<span class="tm-brand__name"><?php echo tm_caps( get_bloginfo( 'name' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
		<small><?php echo esc_html( tm_mod( 'brand_sub' ) ); ?></small>
	</a>

	<nav class="tm-nav" aria-label="<?php esc_attr_e( 'Main navigation', 'tylermcgrath' ); ?>">
		<?php
		wp_nav_menu(
			array(
				'theme_location' => 'primary',
				'container'      => false,
				'menu_class'     => 'tm-menu',
				'depth'          => 1,
				'fallback_cb'    => 'tm_menu_fallback',
			)
		);
		?>
		<a class="tm-connect" href="<?php echo esc_url( tm_connect_url() ); ?>" <?php echo tm_connect_is_external() ? 'target="_blank" rel="noopener"' : ''; ?>>
			<?php echo esc_html( tm_mod( 'connect_label' ) ); ?> <span aria-hidden="true">↗</span>
		</a>
	</nav>

	<div class="tm-header__tools">
		<button type="button" class="tm-time" data-time-toggle aria-label="<?php esc_attr_e( 'Change the time of day', 'tylermcgrath' ); ?>">
			<?php echo tm_icon( 'sun' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<span data-time-label>Auto</span>
		</button>
		<button type="button" class="tm-burger" data-menu-open aria-expanded="false" aria-controls="tm-waypoints">
			<span></span><span></span><span class="screen-reader-text"><?php esc_html_e( 'Open menu', 'tylermcgrath' ); ?></span>
		</button>
	</div>
</header>

<div class="tm-waypoints" id="tm-waypoints" hidden>
	<button type="button" class="tm-waypoints__close" data-menu-close><?php esc_html_e( 'Close', 'tylermcgrath' ); ?> ✕</button>
	<div class="tm-waypoints__rose" aria-hidden="true">
		<svg viewBox="0 0 400 400">
			<circle cx="200" cy="200" r="190" class="r1"/>
			<circle cx="200" cy="200" r="150" class="r2"/>
			<circle cx="200" cy="200" r="110" class="r3"/>
			<g class="ticks">
				<?php
				for ( $i = 0; $i < 72; $i++ ) {
					$len = 0 === $i % 18 ? 18 : ( 0 === $i % 6 ? 10 : 5 );
					printf( '<line x1="200" y1="10" x2="200" y2="%d" transform="rotate(%d 200 200)"/>', (int) ( 10 + $len ), (int) ( $i * 5 ) );
				}
				?>
			</g>
			<g class="needle" data-needle>
				<path d="M200 48 L214 200 L200 214 L186 200 Z" class="n"/>
				<path d="M200 352 L214 200 L200 186 L186 200 Z" class="s"/>
				<circle cx="200" cy="200" r="8"/>
			</g>
		</svg>
	</div>
	<nav class="tm-waypoints__nav" aria-label="<?php esc_attr_e( 'Waypoints', 'tylermcgrath' ); ?>">
		<?php
		wp_nav_menu(
			array(
				'theme_location' => 'primary',
				'container'      => false,
				'menu_class'     => 'tm-menu',
				'depth'          => 1,
				'fallback_cb'    => 'tm_menu_fallback',
			)
		);
		?>
		<a class="tm-connect" href="<?php echo esc_url( tm_connect_url() ); ?>" <?php echo tm_connect_is_external() ? 'target="_blank" rel="noopener"' : ''; ?>><?php echo esc_html( tm_mod( 'connect_label' ) ); ?> ↗</a>
	</nav>
</div>

<div class="tm-compass-stage" data-compass-stage aria-hidden="true">
	<div class="tm-compass-bloom"></div>
	<canvas class="tm-compass-canvas" data-compass-canvas></canvas>
	<?php tm_seal( 'tm-compass-fallback' ); ?>
</div>
<button type="button" class="tm-compass-dock" data-compass-dock aria-label="<?php esc_attr_e( 'Back to the studio', 'tylermcgrath' ); ?>"></button>
