<?php
/**
 * Inline SVG icons. Inline rather than a sprite or an icon font so a single
 * stylesheet and a single script stay the whole front-end payload.
 *
 * @package mcgrath-chrome
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Icon paths. Every icon is drawn on a 24x24 grid and inherits currentColor.
 *
 * @return array<string,string>
 */
function mcg_icon_set() {
	return array(
		/* ---- section + list icons (1.5px stroke) ---- */
		'calendar' => '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
		'bars'     => '<path d="M4 20V13M9.5 20V8M15 20V4M20.5 20v-9"/>',
		'pin'      => '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
		'globe'    => '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3Z"/>',
		'search'   => '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.4 15.4 4.6 4.6"/>',
		'sparkle'  => '<path d="M12 3.2 13.9 9 19.8 11 13.9 13 12 18.8 10.1 13 4.2 11 10.1 9 12 3.2Z"/><path d="M18.6 3.4l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z"/>',
		'monitor'  => '<rect x="2.6" y="4" width="18.8" height="13" rx="2"/><path d="M8.5 21h7M12 17v4"/>',
		'chart'    => '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7.2" y="12.5" width="3.2" height="4.5" rx="1"/><rect x="12.4" y="8.5" width="3.2" height="8.5" rx="1"/><rect x="17.6" y="5" width="3.2" height="12" rx="1"/>',
		'handshake' => '<circle cx="9" cy="8.4" r="3.1"/><path d="M3.2 19.4a5.9 5.9 0 0 1 11.6 0"/><circle cx="17" cy="7.4" r="2.4"/><path d="M16 13.2a5 5 0 0 1 4.8 4.6"/>',
		'building' => '<rect x="4" y="3" width="10" height="18" rx="1.5"/><path d="M14 9h6v12h-6"/><path d="M7.3 7h3.4M7.3 11h3.4M7.3 15h3.4M17 13h.01M17 17h.01"/>',
		'badge'    => '<circle cx="12" cy="10" r="6.2"/><path d="m8.6 15.4-1.2 5.4 4.6-2.3 4.6 2.3-1.2-5.4"/>',
		'check'    => '<circle cx="12" cy="12" r="9"/><path d="m8.2 12.3 2.6 2.6 5-5.4"/>',

		/* ---- AI platform marks in the dashboard ---- */
		'google'   => '<g stroke="none"><path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3.01h3.87c2.26-2.09 3.57-5.17 3.57-8.82Z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.27a12 12 0 0 0 0 10.76l4-3.11Z"/><path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4 3.11C6.22 6.87 8.87 4.75 12 4.75Z"/></g>',
		'openai'   => '<path d="M12 2.6a4.2 4.2 0 0 1 3.7 2.2 4.2 4.2 0 0 1 4.1 6.3 4.2 4.2 0 0 1-3.8 6.4A4.2 4.2 0 0 1 12 21.4a4.2 4.2 0 0 1-3.7-2.2 4.2 4.2 0 0 1-4.1-6.3A4.2 4.2 0 0 1 8 6.5 4.2 4.2 0 0 1 12 2.6Z"/><path d="M12 8.1 15.9 10.3v4.4L12 16.9l-3.9-2.2v-4.4L12 8.1Z"/>',
		'gemini'   => '<path d="M12 2.4c.4 4.9 4.3 8.8 9.2 9.2v.8c-4.9.4-8.8 4.3-9.2 9.2h-.8c-.4-4.9-4.3-8.8-9.2-9.2v-.8c4.9-.4 8.8-4.3 9.2-9.2h.8Z"/>',
		'perplex'  => '<circle cx="12" cy="12" r="9.2"/><path d="M12 4.4v15.2M12 8.6 6.6 4.4v7.2H12M12 8.6l5.4-4.2v7.2H12M12 15.4l-5.4 4.2v-7.2H12M12 15.4l5.4 4.2v-7.2H12"/>',
		'ai'       => '<path d="M12 3.4a3.1 3.1 0 0 1 3 2.3 3.1 3.1 0 0 1 2.7 4.9 3.1 3.1 0 0 1-1.6 5.5 3.1 3.1 0 0 1-4.1 3.5 3.1 3.1 0 0 1-4.1-3.5 3.1 3.1 0 0 1-1.6-5.5A3.1 3.1 0 0 1 9 5.7a3.1 3.1 0 0 1 3-2.3Z"/><path d="M12 9.6v4.8M9.6 12h4.8"/>',

		/* ---- social ---- */
		'linkedin' => '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.4 10.4v6.2M7.4 7.6v.01M11.4 16.6v-6.2M11.4 13.1c0-1.5.9-2.4 2.2-2.4s2.2.9 2.2 2.4v3.5"/>',
		'instagram'=> '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.3 6.7h.01"/>',
		'youtube'  => '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10.3 9.6 5 2.4-5 2.4V9.6Z"/>',
		'facebook' => '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M15.4 8.2h-1.6c-1 0-1.6.6-1.6 1.6v1.7h3l-.4 2.8h-2.6V21"/>',
		'x'        => '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m7.6 7.6 8.8 8.8M16.4 7.6l-8.8 8.8"/>',
	);
}

/**
 * Print an inline SVG icon.
 *
 * @param string $name  Key from mcg_icon_set().
 * @param string $extra Extra attributes, already escaped.
 */
function mcg_icon( $name, $extra = '' ) {
	$set = mcg_icon_set();
	if ( empty( $set[ $name ] ) ) {
		return;
	}

	// The brand marks carry their own fills; everything else is a stroked line icon.
	$filled = in_array( $name, array( 'google' ), true );
	$attrs  = $filled
		? 'fill="none"'
		: 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

	echo '<svg viewBox="0 0 24 24" ' . $attrs . ' aria-hidden="true" focusable="false" ' . $extra . '>'
		. $set[ $name ] // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static markup.
		. '</svg>';
}

/**
 * Page glyphs. Each inner page gets its own drawn figure rather than the same
 * decorative field on every one, so the section you are in is legible before
 * you read a word. Line work only, on the brand palette, no images.
 *
 * @param string $name seo | webdesign | aeo | about | contact | writing
 */
function mcg_glyph( $name ) {
	$glyphs = array(

		/* Ranking positions climbing, with one of them taken. */
		'seo' => '
			<g class="g-line">
				<path d="M20 150 H180"/><path d="M20 150 V20"/>
			</g>
			<g class="g-bar">
				<rect x="36"  y="112" width="20" height="38" rx="3"/>
				<rect x="68"  y="92"  width="20" height="58" rx="3"/>
				<rect x="100" y="66"  width="20" height="84" rx="3"/>
			</g>
			<rect class="g-fill" x="132" y="34" width="20" height="116" rx="3"/>
			<g class="g-accent">
				<circle cx="142" cy="24" r="9"/>
				<path class="g-tick" d="m138 24 3 3 5.5-6"/>
			</g>
			<path class="g-dash" d="M36 122 L78 100 L110 74 L142 42"/>',

		/* A page being composed: frame, header, columns. */
		'webdesign' => '
			<g class="g-line">
				<rect x="18" y="26" width="164" height="128" rx="8"/>
				<path d="M18 52 H182"/>
			</g>
			<g class="g-dot"><circle cx="32" cy="39" r="3.4"/><circle cx="44" cy="39" r="3.4"/><circle cx="56" cy="39" r="3.4"/></g>
			<rect class="g-fill" x="32" y="66" width="62" height="44" rx="4"/>
			<g class="g-line">
				<path d="M106 70 H168"/><path d="M106 82 H150"/>
				<path d="M32 124 H94"/><path d="M32 136 H72"/>
			</g>
			<rect class="g-accent-fill" x="106" y="118" width="46" height="22" rx="5"/>',

		/* One question, several engines answering it. */
		'aeo' => '
			<g class="g-line">
				<path d="M100 60 L44 112"/><path d="M100 60 L100 118"/>
				<path d="M100 60 L156 112"/>
			</g>
			<circle class="g-fill" cx="100" cy="46" r="17"/>
			<g class="g-node">
				<circle cx="44" cy="124" r="13"/>
				<circle cx="100" cy="130" r="13"/>
				<circle cx="156" cy="124" r="13"/>
			</g>
			<g class="g-accent">
				<circle cx="100" cy="46" r="26"/>
				<path class="g-spark" d="M100 20v-9M100 81v9M74 46h-9M126 46h9"/>
			</g>',

		/* One person: a mark, and the ground it stands on. */
		'about' => '
			<g class="g-line">
				<circle cx="100" cy="74" r="44"/>
				<path d="M34 152a66 66 0 0 1 132 0"/>
			</g>
			<circle class="g-fill" cx="100" cy="74" r="22"/>
			<g class="g-accent"><circle cx="100" cy="74" r="58"/></g>',

		/* A place on a map, and the rings that reach out from it. */
		'contact' => '
			<g class="g-accent">
				<circle cx="100" cy="92" r="62"/><circle cx="100" cy="92" r="42"/>
			</g>
			<g class="g-line"><path d="M100 18v18M100 148v18M26 92h18M156 92h18"/></g>
			<path class="g-fill" d="M100 58c14 0 25 11 25 25 0 18-25 44-25 44S75 101 75 83c0-14 11-25 25-25Z"/>
			<circle class="g-hole" cx="100" cy="83" r="9"/>',

		/* Something written down. */
		'writing' => '
			<g class="g-line">
				<path d="M44 24h84l32 32v120H44Z"/><path d="M128 24v32h32"/>
			</g>
			<g class="g-line">
				<path d="M62 88h76"/><path d="M62 106h76"/><path d="M62 124h48"/>
			</g>
			<rect class="g-accent-fill" x="62" y="142" width="34" height="8" rx="4"/>',
	);

	if ( empty( $glyphs[ $name ] ) ) {
		return;
	}

	echo '<div class="glyph glyph--' . esc_attr( $name ) . '" aria-hidden="true">'
		. '<svg viewBox="0 0 200 180" fill="none">'
		. $glyphs[ $name ] // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static markup.
		. '</svg></div>';
}
