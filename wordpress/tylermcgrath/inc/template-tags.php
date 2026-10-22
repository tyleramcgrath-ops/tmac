<?php
/**
 * Small template helpers.
 *
 * @package tylermcgrath
 */

defined( 'ABSPATH' ) || exit;

/**
 * A Customizer value with its theme default.
 *
 * @param string $key Setting key (without the tm_ prefix).
 * @return string
 */
function tm_mod( $key ) {
	$defaults = tm_defaults();
	return get_theme_mod( 'tm_' . $key, isset( $defaults[ $key ] ) ? $defaults[ $key ] : '' );
}

/**
 * Inline SVG icons used across the theme.
 *
 * @param string $name Icon name.
 * @return string
 */
function tm_icon( $name ) {
	$icons = array(
		'arrow'    => '<path d="M5 12h14M13 6l6 6-6 6"/>',
		'arrow-up' => '<path d="M12 19V5M6 11l6-6 6 6"/>',
		'external' => '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
		'star'     => '<path d="M12 2l1.8 8.2L22 12l-8.2 1.8L12 22l-1.8-8.2L2 12l8.2-1.8z" fill="currentColor" stroke="none"/>',
		'sun'      => '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
		'mail'     => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
		'linkedin' => '<path d="M4 9h3v11H4zM5.5 4a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM10 9h3v1.6c.5-.9 1.7-1.8 3.4-1.8 3.2 0 3.6 2.1 3.6 4.8V20h-3v-5.7c0-1.4 0-3-1.9-3s-2.1 1.4-2.1 2.9V20h-3z" fill="currentColor" stroke="none"/>',
		'github'   => '<path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z" fill="currentColor" stroke="none"/>',
		'x'        => '<path d="M4 4l16 16M20 4L4 20"/>',
		'insta'    => '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>',
	);
	if ( ! isset( $icons[ $name ] ) ) {
		return '';
	}
	return '<svg class="tm-icon tm-icon--' . esc_attr( $name ) . '" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $icons[ $name ] . '</svg>';
}

/**
 * Social profiles that have a URL set in the Customizer.
 *
 * @return array[] Each item: label, url, icon.
 */
function tm_socials() {
	$out  = array();
	$list = array(
		'linkedin'  => array( 'LinkedIn', 'linkedin' ),
		'github'    => array( 'GitHub', 'github' ),
		'x'         => array( 'X', 'x' ),
		'instagram' => array( 'Instagram', 'insta' ),
	);
	foreach ( $list as $key => $meta ) {
		$url = tm_mod( 'social_' . $key );
		if ( $url ) {
			$out[] = array(
				'label' => $meta[0],
				'url'   => $url,
				'icon'  => $meta[1],
			);
		}
	}
	return $out;
}

/**
 * Split a comma-separated string into trimmed, non-empty parts.
 *
 * @param string $value Comma-separated list.
 * @return string[]
 */
function tm_split( $value ) {
	return array_values( array_filter( array_map( 'trim', explode( ',', (string) $value ) ) ) );
}

/**
 * Fallback for the primary menu: anchors to the home page sections.
 */
function tm_menu_fallback() {
	$home  = home_url( '/' );
	$items = array(
		'#about'     => esc_html__( 'About', 'tylermcgrath' ),
		'#seo'       => esc_html__( 'SEO & AI Search', 'tylermcgrath' ),
		'#marketing' => esc_html__( 'Marketing', 'tylermcgrath' ),
		'#portfolio' => esc_html__( 'The portfolio', 'tylermcgrath' ) . ' <sup>' . count( tm_get_projects() ) . '</sup>',
	);
	echo '<ul class="tm-menu">';
	foreach ( $items as $hash => $label ) {
		printf( '<li><a href="%s">%s</a></li>', esc_url( is_front_page() ? $hash : $home . $hash ), $label ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
	}
	if ( get_option( 'page_for_posts' ) ) {
		printf( '<li><a href="%s">%s</a></li>', esc_url( get_permalink( get_option( 'page_for_posts' ) ) ), esc_html__( 'Journal', 'tylermcgrath' ) );
	}
	echo '</ul>';
}

/**
 * Print the 2D brass seal (used for the logo mark and portrait fallback).
 *
 * @param string $class Extra class.
 */
function tm_seal( $class = '' ) {
	$gid = 'tmBrass' . wp_unique_id();
	?>
	<svg class="tm-seal <?php echo esc_attr( $class ); ?>" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
		<defs>
			<linearGradient id="<?php echo esc_attr( $gid ); ?>" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#f3dc9a"/><stop offset=".45" stop-color="#caa24e"/><stop offset="1" stop-color="#7d5f28"/>
			</linearGradient>
		</defs>
		<circle cx="50" cy="50" r="46" fill="none" stroke="url(#<?php echo esc_attr( $gid ); ?>)" stroke-width="2"/>
		<circle cx="50" cy="50" r="40" fill="none" stroke="url(#<?php echo esc_attr( $gid ); ?>)" stroke-width=".8" stroke-dasharray="1 3.2"/>
		<path d="M50 8 L55 45 L92 50 L55 55 L50 92 L45 55 L8 50 L45 45 Z" fill="url(#<?php echo esc_attr( $gid ); ?>)" opacity=".95"/>
		<path d="M50 22 L52.5 47.5 L78 50 L52.5 52.5 L50 78 L47.5 52.5 L22 50 L47.5 47.5 Z" fill="#0a0d18" opacity=".55" transform="rotate(45 50 50)"/>
		<circle cx="50" cy="50" r="4" fill="#fff6e0"/>
	</svg>
	<?php
}

/**
 * The studio room photograph.
 *
 * @return string
 */
function tm_room_image() {
	$custom = tm_mod( 'room_image' );
	return $custom ? $custom : TM_URI . '/assets/img/studio-office.webp';
}

/**
 * Where the Connect button goes: the Customizer URL, or the contact section.
 *
 * @return string
 */
function tm_connect_url() {
	$url = tm_mod( 'connect_url' );
	if ( $url ) {
		return $url;
	}
	return is_front_page() ? '#connect' : home_url( '/#connect' );
}

/**
 * Whether the Connect button leaves the site.
 *
 * @return bool
 */
function tm_connect_is_external() {
	$host = wp_parse_url( tm_connect_url(), PHP_URL_HOST );
	return $host && wp_parse_url( home_url(), PHP_URL_HOST ) !== $host;
}

/**
 * Turn a number-ish stat into parts the counter animation can use.
 *
 * @param string $value e.g. "14+", "{projects}", "3".
 * @return array{0:string,1:int|null,2:string} prefix, number, suffix.
 */
function tm_stat_parts( $value ) {
	$value = str_replace( '{projects}', (string) count( tm_get_projects() ), $value );
	if ( preg_match( '/^(\D*)(\d+)(.*)$/', $value, $m ) ) {
		return array( $m[1], (int) $m[2], $m[3] );
	}
	return array( $value, null, '' );
}

/**
 * Escape a name for small-caps settings, keeping "Mc" in mixed case
 * (TYLER McGRATH, not TYLER MCGRATH) under text-transform: uppercase.
 *
 * @param string $text Plain text.
 * @return string Safe HTML.
 */
function tm_caps( $text ) {
	return preg_replace( '/\bMc(?=[A-Z])/', '<span class="tm-mc">Mc</span>', esc_html( $text ) );
}
