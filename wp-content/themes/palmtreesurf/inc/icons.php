<?php
/**
 * Inline SVG icons.
 *
 * Original simple geometry drawn for this theme. The design system asks for a
 * consistent professional icon set rather than emoji in production, so the
 * category rail and trust rows draw from here.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * The icon set: key => inner SVG markup on a 24x24 grid.
 *
 * @return array<string, string>
 */
function pt_icon_paths() {
	$stroke = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

	return array(
		'palm'      => '<path d="M12 21V11" ' . $stroke . '/><path d="M12 11c-2.6-2.4-5.6-2.6-7.6-1 1-2.7 4.3-3.6 7.6-1.4" ' . $stroke . '/><path d="M12 11c2.6-2.4 5.6-2.6 7.6-1-1-2.7-4.3-3.6-7.6-1.4" ' . $stroke . '/><path d="M12 8.6C12 5.5 13.8 3.2 16.4 3c-1.3 1.3-1.9 3-1.7 4.6" ' . $stroke . '/><path d="M9 21h6" ' . $stroke . '/>',
		'search'    => '<circle cx="11" cy="11" r="6.5" ' . $stroke . '/><path d="m16 16 4.5 4.5" ' . $stroke . '/>',
		'chat'      => '<path d="M20 15.5a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3H6.5A2.5 2.5 0 0 1 4 15.5v-8A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5Z" ' . $stroke . '/><path d="M8.5 10.5h7" ' . $stroke . '/><path d="M8.5 13.5h4" ' . $stroke . '/>',
		'surf'      => '<path d="M4 20c4-1 6-4 7-7s1.5-6 1.5-9c3 2 5 5 5 9 0 4-3.5 7-8 7Z" ' . $stroke . '/><path d="M3 21c2.5 0 3.5-1.5 5-1.5" ' . $stroke . '/>',
		'boat'      => '<path d="M3 17h18l-2.2 3.3a1.5 1.5 0 0 1-1.2.7H6.4a1.5 1.5 0 0 1-1.2-.7Z" ' . $stroke . '/><path d="M5.5 17V9.5L12 7l6.5 2.5V17" ' . $stroke . '/><path d="M12 7V3" ' . $stroke . '/>',
		'food'      => '<path d="M6 3v8a2 2 0 0 0 4 0V3" ' . $stroke . '/><path d="M8 11v10" ' . $stroke . '/><path d="M17 3c-1.5 1.3-2.2 3-2.2 5.2 0 1.6.8 2.6 2.2 2.8V21" ' . $stroke . '/>',
		'events'    => '<circle cx="7" cy="18" r="2.6" ' . $stroke . '/><circle cx="18" cy="16" r="2.4" ' . $stroke . '/><path d="M9.6 18V6.5L20.4 4v12" ' . $stroke . '/>',
		'transport' => '<path d="M4 16v-3.2L6 7.5A2 2 0 0 1 7.9 6h8.2A2 2 0 0 1 18 7.5l2 5.3V16" ' . $stroke . '/><rect x="3" y="16" width="18" height="3.5" rx="1.2" ' . $stroke . '/><path d="M7 19.5V21M17 19.5V21M5 13h14" ' . $stroke . '/>',
		'wellness'  => '<path d="M12 21c0-4 2.6-7 6.5-7.6C18 17.6 15.5 21 12 21Z" ' . $stroke . '/><path d="M12 21c0-4-2.6-7-6.5-7.6C6 17.6 8.5 21 12 21Z" ' . $stroke . '/><path d="M12 20c-1.6-2.6-1.6-6.4 0-9.6 1.6 3.2 1.6 7 0 9.6Z" ' . $stroke . '/>',
		'nature'    => '<path d="M20 4C10 4 4.5 8.5 4.5 15c0 2 .6 3.6 1.4 4.6" ' . $stroke . '/><path d="M5 20c9.5-.5 15-5.5 15-16" ' . $stroke . '/>',
		'gift'      => '<rect x="3.5" y="10" width="17" height="10.5" rx="1.5" ' . $stroke . '/><path d="M2.5 6.5h19V10h-19z" ' . $stroke . '/><path d="M12 6.5v14" ' . $stroke . '/><path d="M12 6.5C11 4 9.8 3 8.4 3a2 2 0 0 0 0 3.5M12 6.5C13 4 14.2 3 15.6 3a2 2 0 0 1 0 3.5" ' . $stroke . '/>',
		'bolt'      => '<path d="M13.5 2 5 13.5h6L10.5 22 19 10.5h-6Z" ' . $stroke . '/>',
		'experts'   => '<circle cx="9" cy="8" r="3.2" ' . $stroke . '/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" ' . $stroke . '/><path d="M16.5 5.6a3.2 3.2 0 0 1 0 4.8M20.5 20c0-2.3-.9-4.4-2.4-6" ' . $stroke . '/>',
		'shield'    => '<path d="M12 2.5 4.5 5.3v5.5c0 4.7 3.2 8.8 7.5 10.2 4.3-1.4 7.5-5.5 7.5-10.2V5.3Z" ' . $stroke . '/><path d="m8.8 12 2.4 2.4 4.2-4.6" ' . $stroke . '/>',
		'globe'     => '<circle cx="12" cy="12" r="9" ' . $stroke . '/><path d="M3.2 9.5h17.6M3.2 14.5h17.6" ' . $stroke . '/><path d="M12 3c-2.4 2.4-3.6 5.4-3.6 9s1.2 6.6 3.6 9c2.4-2.4 3.6-5.4 3.6-9S14.4 5.4 12 3Z" ' . $stroke . '/>',
		'clock'     => '<circle cx="12" cy="12" r="9" ' . $stroke . '/><path d="M12 6.8V12l3.4 2" ' . $stroke . '/>',
		'star'      => '<path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.8l5.9-.9Z" fill="currentColor"/>',
		'play'      => '<circle cx="12" cy="12" r="9.5" ' . $stroke . '/><path d="M10 8.5 16 12l-6 3.5Z" fill="currentColor"/>',
		'pin'       => '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" ' . $stroke . '/><circle cx="12" cy="10" r="2.6" ' . $stroke . '/>',
		'check'     => '<circle cx="12" cy="12" r="9" ' . $stroke . '/><path d="m8.2 12.2 2.6 2.6 5-5.4" ' . $stroke . '/>',
	);
}

/**
 * Return an inline icon.
 *
 * @param string $name  Icon key.
 * @param string $class Extra classes.
 * @param int    $size  Pixel size.
 * @return string
 */
function pt_get_icon( $name, $class = '', $size = 24 ) {
	$paths = pt_icon_paths();

	if ( ! isset( $paths[ $name ] ) ) {
		return '';
	}

	return sprintf(
		'<svg class="pt-icon %1$s" viewBox="0 0 24 24" width="%2$d" height="%2$d" aria-hidden="true" focusable="false">%3$s</svg>',
		esc_attr( $class ),
		(int) $size,
		$paths[ $name ]
	);
}

/**
 * Print an inline icon.
 *
 * @param string $name  Icon key.
 * @param string $class Extra classes.
 * @param int    $size  Pixel size.
 */
function pt_icon( $name, $class = '', $size = 24 ) {
	echo pt_get_icon( $name, $class, $size ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static markup built above.
}
