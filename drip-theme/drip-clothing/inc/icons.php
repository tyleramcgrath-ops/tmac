<?php
/**
 * The drop mark and the small line icons.
 *
 * @package drip
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The DRIP drop: an outlined teardrop with the inner swell, in a
 * cyan-to-blue gradient. Every call gets its own gradient id.
 *
 * @param string $class CSS class.
 * @param string $label Unused context hint.
 */
function drip_drop( $class = '', $label = '' ) {
	static $n = 0;
	$n++;
	$id = 'dripg' . $n;
	return '<svg class="' . esc_attr( $class ) . '" viewBox="0 0 100 120" aria-hidden="true" focusable="false">'
		. '<defs><linearGradient id="' . $id . '" x1="0.8" y1="0" x2="0.2" y2="1">'
		. '<stop offset="0" stop-color="#8fe4ff"/><stop offset=".55" stop-color="#3aa6e8"/><stop offset="1" stop-color="#2a63d4"/>'
		. '</linearGradient></defs>'
		. '<path d="M50 6C58 27 80 50 80 77a30 30 0 0 1-60 0C20 50 42 27 50 6Z" fill="none" stroke="url(#' . $id . ')" stroke-width="6.5" stroke-linejoin="round"/>'
		. '<path d="M57 41C42 56 33 73 40 88c6 11 18 14 29 12-13-1-23-9-25-20-2-13 4-26 13-39Z" fill="url(#' . $id . ')"/>'
		. '</svg>';
}

/**
 * A small line icon.
 *
 * @param string $name Icon name.
 * @param int    $size Pixel size.
 */
function drip_icon( $name, $size = 20 ) {
	$paths = array(
		'bag'     => '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
		'user'    => '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
		'search'  => '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
		'arrow'   => '<path d="M5 12h14M13 6l6 6-6 6"/>',
		'close'   => '<path d="M6 6l12 12M18 6 6 18"/>',
		'plus'    => '<path d="M12 5v14M5 12h14"/>',
		'minus'   => '<path d="M5 12h14"/>',
		'wave'    => '<path d="M2 14c3 0 3-4 6-4s3 4 6 4 3-4 6-4 2 2 2 2"/>',
		'shirt'   => '<path d="m8 3-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0Z"/>',
		'box'     => '<path d="m3 7 9-4 9 4v10l-9 4-9-4V7Z"/><path d="m3 7 9 4 9-4M12 11v10"/>',
		'mail'    => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
		'instagram' => '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>',
	);
	if ( ! isset( $paths[ $name ] ) ) {
		return '';
	}
	return '<svg class="icon icon-' . esc_attr( $name ) . '" width="' . (int) $size . '" height="' . (int) $size . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $paths[ $name ] . '</svg>';
}
