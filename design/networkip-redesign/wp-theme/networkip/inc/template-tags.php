<?php
/**
 * Template helpers.
 *
 * @package NetworkIP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get a Customizer value, falling back to the theme default.
 *
 * @param string $key Setting key without the networkip_ prefix.
 * @return string
 */
function networkip_mod( $key ) {
	$defaults = networkip_defaults();
	$default  = isset( $defaults[ $key ] ) ? $defaults[ $key ] : '';
	return (string) get_theme_mod( 'networkip_' . $key, $default );
}

/**
 * Resolve a site-relative path ("/contact-us/") with home_url(). Absolute URLs and anchors pass through.
 *
 * @param string $url URL or site-relative path.
 * @return string Unescaped URL.
 */
function networkip_url( $url ) {
	$url = trim( (string) $url );
	if ( '' === $url ) {
		return '';
	}
	if ( '/' === $url[0] && ( ! isset( $url[1] ) || '/' !== $url[1] ) ) {
		return home_url( $url );
	}
	return $url;
}

/**
 * Split a comma-separated setting into trimmed, non-empty items.
 *
 * @param string $value Comma-separated string.
 * @return string[]
 */
function networkip_split_list( $value ) {
	return array_values( array_filter( array_map( 'trim', explode( ',', (string) $value ) ), 'strlen' ) );
}

/**
 * URL of a bundled theme asset.
 *
 * @param string $path Path relative to assets/.
 * @return string
 */
function networkip_asset( $path ) {
	return get_template_directory_uri() . '/assets/' . ltrim( $path, '/' );
}

/**
 * WebP srcset for a bundled responsive image.
 *
 * @param string $name Image base name (hero-globe or network-map).
 * @return string
 */
function networkip_srcset( $name ) {
	$parts = array();
	foreach ( array( 960, 1600, 2560 ) as $w ) {
		$parts[] = networkip_asset( "images/{$name}-{$w}.webp" ) . " {$w}w";
	}
	return implode( ', ', $parts );
}

/**
 * Output a responsive <picture> for a bundled background image.
 *
 * @param string $name  Image base name.
 * @param string $class Class for the <img>.
 * @param bool   $eager Load eagerly with high priority (hero) or lazily.
 * @param int    $w     Intrinsic width.
 * @param int    $h     Intrinsic height.
 */
function networkip_picture( $name, $class, $eager, $w, $h ) {
	printf(
		'<picture><source type="image/webp" srcset="%1$s" sizes="100vw"><img class="%2$s" src="%3$s" width="%4$d" height="%5$d" alt="" decoding="async" %6$s></picture>',
		esc_attr( networkip_srcset( $name ) ),
		esc_attr( $class ),
		esc_url( networkip_asset( "images/{$name}-1600.jpg" ) ),
		(int) $w,
		(int) $h,
		$eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'
	);
}

/**
 * Output a decorative icon from assets/icons. Icons are <img> elements because
 * the source SVGs share internal gradient ids.
 *
 * @param string $name Icon file name without extension.
 * @param int    $size Rendered size in px.
 */
function networkip_icon( $name, $size = 56 ) {
	$name = sanitize_file_name( $name );
	if ( ! file_exists( get_template_directory() . "/assets/icons/{$name}.svg" ) ) {
		return;
	}
	printf(
		'<img class="nip-icon" src="%1$s" width="%2$d" height="%2$d" alt="" loading="lazy" decoding="async">',
		esc_url( networkip_asset( "icons/{$name}.svg" ) ),
		(int) $size
	);
}

/**
 * Site logo: the custom logo if one is set, otherwise the temporary text wordmark.
 */
function networkip_logo() {
	if ( has_custom_logo() ) {
		the_custom_logo();
		return;
	}
	printf(
		'<a class="nip-wordmark" href="%1$s" rel="home"><span class="nip-wordmark__text">Network<span>IP</span></span><span class="screen-reader-text"> %2$s</span></a>',
		esc_url( home_url( '/' ) ),
		esc_html__( 'home', 'networkip' )
	);
}

/**
 * Output a menu location, or the public-site fallback links if none is assigned.
 *
 * @param string $location   Menu location.
 * @param string $menu_class Class for the <ul>.
 */
function networkip_menu( $location, $menu_class ) {
	if ( has_nav_menu( $location ) ) {
		wp_nav_menu(
			array(
				'theme_location' => $location,
				'container'      => false,
				'menu_class'     => $menu_class,
				'depth'          => 'primary' === $location ? 2 : 1,
				'fallback_cb'    => false,
			)
		);
		return;
	}

	$current = untrailingslashit( (string) wp_parse_url( add_query_arg( array() ), PHP_URL_PATH ) );
	echo '<ul class="' . esc_attr( $menu_class ) . '">';
	foreach ( networkip_fallback_links( $location ) as $link ) {
		$url     = networkip_url( $link['url'] );
		$path    = untrailingslashit( (string) wp_parse_url( $url, PHP_URL_PATH ) );
		$is_curr = ( $path === $current );
		printf(
			'<li class="menu-item%1$s"><a href="%2$s"%3$s>%4$s</a></li>',
			$is_curr ? ' current-menu-item' : '',
			esc_url( $url ),
			$is_curr ? ' aria-current="page"' : '',
			esc_html( $link['label'] )
		);
	}
	echo '</ul>';
}

/**
 * Section heading block (eyebrow, h2, intro).
 *
 * @param array  $heading Array with eyebrow, title and text keys.
 * @param string $id      Id for the h2 (used by aria-labelledby).
 */
function networkip_section_heading( $heading, $id ) {
	if ( ! empty( $heading['eyebrow'] ) ) {
		echo '<p class="nip-eyebrow">' . esc_html( $heading['eyebrow'] ) . '</p>';
	}
	if ( ! empty( $heading['title'] ) ) {
		echo '<h2 id="' . esc_attr( $id ) . '">' . esc_html( $heading['title'] ) . '</h2>';
	}
	if ( ! empty( $heading['text'] ) ) {
		echo '<p class="nip-lead">' . esc_html( $heading['text'] ) . '</p>';
	}
}
