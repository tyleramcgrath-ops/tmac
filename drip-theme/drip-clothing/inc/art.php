<?php
/**
 * Code-drawn wave art: the fine-line swell from the back prints, drawn as
 * SVG so it stays sharp at any size and costs no image requests.
 *
 * @package drip
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * A deterministic pseudo-random sequence, so the art is identical on every
 * page load (and cacheable).
 *
 * @param int $seed Seed.
 */
function drip_rng( $seed ) {
	$state = $seed;
	return function () use ( &$state ) {
		$state = ( $state * 1103515245 + 12345 ) & 0x7fffffff;
		return $state / 0x7fffffff;
	};
}

/**
 * Catmull-Rom points to a smooth cubic path.
 *
 * @param array $pts List of [x, y].
 */
function drip_smooth_path( $pts ) {
	$d = sprintf( 'M%.1f %.1f', $pts[0][0], $pts[0][1] );
	$n = count( $pts );
	for ( $i = 0; $i < $n - 1; $i++ ) {
		$p0 = $pts[ max( 0, $i - 1 ) ];
		$p1 = $pts[ $i ];
		$p2 = $pts[ $i + 1 ];
		$p3 = $pts[ min( $n - 1, $i + 2 ) ];
		$d .= sprintf(
			'C%.1f %.1f %.1f %.1f %.1f %.1f',
			$p1[0] + ( $p2[0] - $p0[0] ) / 6,
			$p1[1] + ( $p2[1] - $p0[1] ) / 6,
			$p2[0] - ( $p3[0] - $p1[0] ) / 6,
			$p2[1] - ( $p3[1] - $p1[1] ) / 6,
			$p2[0],
			$p2[1]
		);
	}
	return $d;
}

/**
 * The swell: many fine lines that gather into a cresting wave, with foam
 * spray off the lip.
 *
 * @param array $args lines, width, height, crest (0-1 across), seed, spray, class.
 */
function drip_swell( $args = array() ) {
	$a = array_merge(
		array(
			'lines'  => 26,
			'width'  => 1600,
			'height' => 640,
			'crest'  => 0.62,
			'seed'   => 7,
			'spray'  => 160,
			'class'  => 'swell',
		),
		$args
	);
	$w      = $a['width'];
	$h      = $a['height'];
	$rand   = drip_rng( $a['seed'] );
	$cx     = $w * $a['crest'];
	$mid    = $h * 0.58;
	$paths  = '';
	$lines  = (int) $a['lines'];

	for ( $i = 0; $i < $lines; $i++ ) {
		$t    = $lines > 1 ? $i / ( $lines - 1 ) : 0;
		$base = $mid + ( $t - 0.5 ) * $h * 0.32;
		$lift = $h * ( 0.16 + 0.22 * ( 1 - $t ) );
		$ph   = $rand() * 6.28;
		$pts  = array();
		for ( $x = -60; $x <= $w + 60; $x += 50 ) {
			$g     = exp( -pow( ( $x - $cx ) / ( $w * ( 0.16 + 0.05 * $t ) ), 2 ) );
			$lean  = exp( -pow( ( $x - $cx - $w * 0.05 ) / ( $w * 0.07 ), 2 ) );
			$y     = $base
				- $lift * $g
				- $h * 0.05 * $lean * ( 1 - $t )
				+ 9 * sin( $x * 0.004 + $ph )
				+ 5 * sin( $x * 0.011 - $i * 0.35 );
			$pts[] = array( $x, $y );
		}
		$tone   = $i % 7 === 3 ? 'is-blue' : ( $i % 3 === 0 ? 'is-bright' : '' );
		$paths .= '<path class="swell-line ' . $tone . '" style="--i:' . $i . '" d="' . drip_smooth_path( $pts ) . '"/>';
	}

	$spray = '';
	for ( $s = 0; $s < (int) $a['spray']; $s++ ) {
		$ang = $rand() * 3.14;
		$r   = pow( $rand(), 0.7 ) * $w * 0.13;
		$x   = $cx + $w * 0.03 + cos( $ang ) * $r * 1.4;
		$y   = $mid - $h * 0.36 - sin( $ang ) * $r * 0.55 + $rand() * 30;
		$sz  = 0.6 + $rand() * 2.1;
		$spray .= sprintf( '<circle cx="%.1f" cy="%.1f" r="%.2f" style="--d:%.2fs"/>', $x, $y, $sz, $rand() * 3 );
	}

	return '<svg class="' . esc_attr( $a['class'] ) . '" viewBox="0 0 ' . $w . ' ' . $h . '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">'
		. '<defs><linearGradient id="swell-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' . $w . '" y2="0">'
		. '<stop offset="0" stop-color="#c9ced4" stop-opacity="0"/><stop offset=".3" stop-color="#c9ced4" stop-opacity=".55"/>'
		. '<stop offset=".62" stop-color="#ffffff" stop-opacity=".95"/><stop offset="1" stop-color="#c9ced4" stop-opacity="0"/></linearGradient>'
		. '<linearGradient id="swell-blue" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' . $w . '" y2="0">'
		. '<stop offset="0" stop-color="#3aa6e8" stop-opacity="0"/><stop offset=".6" stop-color="#5cc3f5" stop-opacity=".9"/><stop offset="1" stop-color="#2a63d4" stop-opacity="0"/></linearGradient></defs>'
		. '<g class="swell-lines">' . $paths . '</g><g class="swell-spray">' . $spray . '</g></svg>';
}

/**
 * A single fine line, for dividers and small accents.
 *
 * @param string $class CSS class.
 */
function drip_line( $class = 'rule-wave' ) {
	return '<svg class="' . esc_attr( $class ) . '" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
		. '<path d="M0 14C60 14 80 6 140 6s90 12 150 12 70-8 110-8" fill="none" stroke="currentColor" stroke-width="1"/>'
		. '<path d="M0 18C70 18 90 11 150 11s80 10 140 10 70-6 110-6" fill="none" stroke="currentColor" stroke-width=".6" opacity=".5"/></svg>';
}
