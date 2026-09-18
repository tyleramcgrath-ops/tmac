<?php
/**
 * The Palm Tree Surf logo and favicons.
 *
 * The logo ships with the theme rather than needing a Media Library upload, so
 * a fresh install is branded the moment the theme is activated. Two variants:
 * the reversed one while the header is transparent over a hero, the full-colour
 * one once the header sticks and turns white. A custom logo set in the
 * Customizer overrides both, which is how a client swaps it later.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * URL of a bundled logo file, cache-busted on its own mtime.
 *
 * @param string $file Filename inside assets/images/logo/.
 * @return string
 */
function pt_logo_url( $file ) {
	$path = PT_DIR . 'assets/images/logo/' . $file;
	$url  = PT_URI . 'assets/images/logo/' . $file;

	return file_exists( $path ) ? add_query_arg( 'v', (string) filemtime( $path ), $url ) : '';
}

/**
 * Print the site logo.
 *
 * PNG rather than SVG deliberately. The supplied SVGs set the wordmark as live
 * <text> in Montserrat — a font this site does not load — so every browser
 * rendered it in its own fallback and the logo came out looking nothing like
 * the artwork. The PNGs carry the type baked in.
 *
 * @param string $variant 'auto' swaps on header state, 'light' forces the
 *                        reversed mark for a dark background.
 * @return string
 */
function pt_site_logo( $variant = 'auto' ) {
	if ( has_custom_logo() && 'auto' === $variant ) {
		return get_custom_logo();
	}

	$light = pt_logo_url( 'logo-horizontal-reversed.png' );
	$dark  = pt_logo_url( 'logo-horizontal.png' );

	if ( ! $light || ! $dark ) {
		// Fall back to the mark and wordmark, so the header is never empty.
		return sprintf(
			'<a class="site-logo" href="%1$s" rel="home">%2$s<span class="site-logo__text"><span class="site-logo__name">%3$s</span><span class="site-logo__sub">%4$s</span></span></a>',
			esc_url( home_url( '/' ) ),
			pt_get_icon( 'palm', 'site-logo__mark' ),
			esc_html__( 'Palm Tree', 'palmtreesurf' ),
			esc_html__( 'Surf', 'palmtreesurf' )
		);
	}

	$alt = sprintf(
		/* translators: %s: site name. */
		__( '%s home', 'palmtreesurf' ),
		get_bloginfo( 'name' )
	);

	// On a dark surface only the reversed mark is ever right.
	if ( 'light' === $variant ) {
		return sprintf(
			'<a class="site-logo site-logo--image" href="%1$s" rel="home">'
			. '<img class="site-logo__img" src="%2$s" alt="%3$s" width="638" height="160" loading="lazy" decoding="async" />'
			. '</a>',
			esc_url( home_url( '/' ) ),
			esc_url( $light ),
			esc_attr( $alt )
		);
	}

	return sprintf(
		'<a class="site-logo site-logo--image" href="%1$s" rel="home">'
		. '<img class="site-logo__img site-logo__img--light" src="%2$s" alt="%4$s" width="638" height="160" fetchpriority="high" decoding="async" />'
		. '<img class="site-logo__img site-logo__img--dark" src="%3$s" alt="" aria-hidden="true" width="638" height="160" decoding="async" loading="lazy" />'
		. '</a>',
		esc_url( home_url( '/' ) ),
		esc_url( $light ),
		esc_url( $dark ),
		esc_attr( $alt )
	);
}

/**
 * Favicons, when the client has not set a Site Icon of their own.
 *
 * WordPress prints its own tags for a Site Icon, so this only fills the gap on
 * a fresh install.
 */
function pt_print_favicons() {
	if ( has_site_icon() ) {
		return;
	}

	$icons = array(
		array( 'favicon-32.png', '32x32', 'icon' ),
		array( 'favicon-192.png', '192x192', 'icon' ),
		array( 'apple-touch-icon-180.png', '180x180', 'apple-touch-icon' ),
	);

	foreach ( $icons as $icon ) {
		$url = pt_logo_url( $icon[0] );

		if ( ! $url ) {
			continue;
		}

		printf(
			'<link rel="%1$s" href="%2$s" sizes="%3$s" />' . "\n",
			esc_attr( $icon[2] ),
			esc_url( $url ),
			esc_attr( $icon[1] )
		);
	}
}
add_action( 'wp_head', 'pt_print_favicons', 2 );
add_action( 'admin_head', 'pt_print_favicons', 2 );
add_action( 'login_head', 'pt_print_favicons', 2 );

/**
 * Use the wave mark on the login screen too.
 */
function pt_login_logo() {
	$url = pt_logo_url( 'logo-horizontal.png' );

	if ( ! $url ) {
		return;
	}

	printf(
		'<style>#login h1 a{background-image:url(%1$s);background-size:contain;width:260px;height:68px;margin:0 auto 18px}</style>',
		esc_url( $url )
	);
}
add_action( 'login_head', 'pt_login_logo', 20 );

/**
 * Point the login logo at the site rather than at wordpress.org.
 *
 * @return string
 */
function pt_login_logo_url() {
	return home_url( '/' );
}
add_filter( 'login_headerurl', 'pt_login_logo_url' );

/**
 * And label it with the site name.
 *
 * @return string
 */
function pt_login_logo_title() {
	return get_bloginfo( 'name' );
}
add_filter( 'login_headertext', 'pt_login_logo_title' );
