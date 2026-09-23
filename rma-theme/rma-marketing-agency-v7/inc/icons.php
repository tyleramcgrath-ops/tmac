<?php
/**
 * Line icons, drawn on a 24px grid so they inherit currentColor.
 *
 * @package rma
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Echo-ready SVG markup for an icon.
 *
 * @param string $name Icon key (a service slug, or a UI icon).
 * @param int    $size Rendered size in px.
 */
function rma_icon( $name, $size = 24 ) {
	$paths = array(
		'ai-search-optimization' => '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.6-4.6"/><path d="M10.5 7.2v1.6M10.5 12.2v1.6M7.2 10.5h1.6M12.2 10.5h1.6"/>',
		'seo'                    => '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
		'paid-media'             => '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
		'web-design'             => '<rect x="2.5" y="4" width="19" height="15" rx="2.5"/><path d="M2.5 8.5h19M6 6.3h.01M8.5 6.3h.01"/><path d="M7 13h6M7 15.5h4"/>',
		'social-media'           => '<path d="M20.5 11.5a8 8 0 0 1-11.8 7L3.5 20l1.4-4.8A8 8 0 1 1 20.5 11.5Z"/><path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01"/>',
		'event-planning'         => '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m9.5 15 1.8 1.8 3.5-3.6"/>',
		'branding'               => '<path d="M12 2.5 21.5 12 12 21.5 2.5 12Z"/><path d="M12 7.5 16.5 12 12 16.5 7.5 12Z"/>',
		'analytics-reporting'    => '<path d="M3 17.5 9 11l4 4 8-8.5"/><path d="M15.5 6.5H21V12"/>',
		'arrow'                  => '<path d="M5 12h14M13 6l6 6-6 6"/>',
		'arrow-up-right'         => '<path d="M7 17 17 7M8 7h9v9"/>',
		'plus'                   => '<path d="M12 5v14M5 12h14"/>',
		'menu'                   => '<path d="M4 8h16M4 16h16"/>',
		'close'                  => '<path d="m6 6 12 12M18 6 6 18"/>',
	);
	if ( ! isset( $paths[ $name ] ) ) {
		return '';
	}
	return sprintf(
		'<svg class="icon" width="%1$d" height="%1$d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">%2$s</svg>',
		(int) $size,
		$paths[ $name ]
	);
}
