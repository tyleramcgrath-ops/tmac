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
 * Line-icon paths, keyed by the icon names used in inc/content.php and inc/pages.php.
 * Static, theme-authored markup (24x24 viewBox, stroked with currentColor).
 *
 * @return array<string,string>
 */
function networkip_icon_paths() {
	$globe  = '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 3.9 5.8 3.9 9s-1.3 6.2-3.9 9c-2.6-2.8-3.9-5.8-3.9-9S9.4 5.8 12 3z"/>';
	$shield = '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>';
	$phone  = '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>';
	return array(
		'international-calling'   => $globe,
		'globe-coverage'          => $globe,
		'customer-intelligence'   => '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
		'integration-flexibility' => '<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5"/>',
		'call-quality-shield'     => $shield,
		'service-platform'        => '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
		'carriers-users'          => '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/><path d="M19 20c0 1.1-1.8 2-4 2h-2"/>',
		'phone-calls'             => $phone,
		'calendar-experience'     => '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
	);
}

/**
 * Output a decorative line icon in a gold tile.
 *
 * @param string $name Icon name (see networkip_icon_paths()).
 * @param int    $size Kept for backwards compatibility; size is set in CSS.
 */
function networkip_icon( $name, $size = 56 ) {
	$paths = networkip_icon_paths();
	if ( ! isset( $paths[ $name ] ) ) {
		return;
	}
	unset( $size );
	// The paths are static strings defined above, not user input.
	echo '<span class="nip-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false">' . $paths[ $name ] . '</svg></span>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

/**
 * Site logo for the dark header and footer.
 *
 * Order: the "Logo for dark backgrounds" Customizer image, then the bundled
 * white version of the official NetworkIP logo. The regular Site Identity logo
 * is not used here because the official logo has black lettering that disappears
 * on the dark navy header.
 *
 * @param string $context "header" or "footer" (used for the class name).
 */
function networkip_logo( $context = 'header' ) {
	$custom = networkip_mod( 'logo_light' );
	if ( $custom ) {
		$src    = $custom;
		$srcset = '';
	} else {
		$src    = networkip_asset( 'images/networkip-logo-white.png' );
		$srcset = networkip_asset( 'images/networkip-logo-white.png' ) . ' 1x, ' . networkip_asset( 'images/networkip-logo-white@2x.png' ) . ' 2x';
	}

	printf(
		'<a class="nip-logo nip-logo--%1$s" href="%2$s" rel="home"><img src="%3$s"%4$s width="170" height="50" alt="%5$s" decoding="async"></a>',
		esc_attr( $context ),
		esc_url( home_url( '/' ) ),
		esc_url( $src ),
		$srcset ? ' srcset="' . esc_attr( $srcset ) . '"' : '',
		esc_attr__( 'NetworkIP home', 'networkip' )
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

/**
 * Escape a heading and wrap the first occurrence of a phrase in a gold span.
 *
 * @param string $text      Heading text.
 * @param string $highlight Phrase to highlight (optional).
 * @return string Escaped HTML.
 */
function networkip_highlight( $text, $highlight ) {
	$text      = esc_html( $text );
	$highlight = esc_html( trim( (string) $highlight ) );
	if ( '' === $highlight || false === strpos( $text, $highlight ) ) {
		return $text;
	}
	$pos = strpos( $text, $highlight );
	return substr( $text, 0, $pos ) . '<span class="nip-gold">' . $highlight . '</span>' . substr( $text, $pos + strlen( $highlight ) );
}
