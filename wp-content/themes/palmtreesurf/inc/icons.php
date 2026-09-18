<?php
/**
 * Inline SVG icons.
 *
 * Original simple geometry drawn for this theme — no third-party marks or
 * brand logos. Inline rather than a sprite or icon font so there is no extra
 * request and no FOIT.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * The icon set.
 *
 * @return array<string, string>
 */
function pt_icon_paths() {
	return array(
		// Tick inside a shield: certification.
		'shield' => '<path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m8.5 12 2.5 2.5L16 9.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
		// Long tapered shape: a board.
		'board'  => '<path d="M12 2c3.5 3.5 5 8 5 11 0 5-2.2 9-5 9s-5-4-5-9c0-3 1.5-7.5 5-11Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 6v12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
		// Three figures: small groups.
		'group'  => '<circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M16 5.5a3.2 3.2 0 0 1 0 5M18 20c0-2.3-.9-4.4-2.4-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
		// Camera body with a lens: session photos.
		'camera' => '<rect x="3" y="7" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 7l1.4-2.4a1 1 0 0 1 .9-.6h1.4a1 1 0 0 1 .9.6L15 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13.5" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/>',
		// A rising wave.
		'wave'   => '<path d="M2 14c3 0 4-3 6-3s2.5 3 5 3 3.5-4 6-4 3 2 3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M2 19c3 0 4-3 6-3s2.5 3 5 3 3.5-4 6-4 3 2 3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>',
	);
}

/**
 * Print an inline icon.
 *
 * @param string $name  Icon key.
 * @param string $class Extra classes.
 */
function pt_icon( $name, $class = '' ) {
	$paths = pt_icon_paths();

	if ( ! isset( $paths[ $name ] ) ) {
		return;
	}

	printf(
		'<svg class="pt-icon %1$s" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">%2$s</svg>',
		esc_attr( $class ),
		$paths[ $name ] // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static markup defined above.
	);
}
