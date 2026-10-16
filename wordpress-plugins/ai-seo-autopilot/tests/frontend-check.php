<?php
/**
 * Checks the rendered pages: AIOSEO title/meta and the merged JSON-LD graph.
 * Usage: php frontend-check.php <service-page-url> <blog-post-url>
 */

$fail = 0;
function check( $ok, $label ) {
	global $fail;
	echo ( $ok ? '  ok   ' : '  FAIL ' ) . $label . "\n";
	$fail += $ok ? 0 : 1;
}
function graph_types( $html ) {
	$types = [];
	preg_match_all( '#<script type="application/ld\+json"[^>]*>(.*?)</script>#s', $html, $m );
	foreach ( $m[1] as $json ) {
		$data = json_decode( $json, true );
		foreach ( (array) ( $data['@graph'] ?? [] ) as $node ) {
			$types[] = is_array( $node['@type'] ) ? implode( ',', $node['@type'] ) : $node['@type'];
		}
	}
	return $types;
}

$service = file_get_contents( $argv[1] );
$post    = file_get_contents( $argv[2] );

check( false !== strpos( $service, '<title>Edited Proposal Title &amp; More</title>' ), 'AIOSEO outputs the title set through the plugin' );
check( (bool) preg_match( '#<meta name="description" content="Learn about teeth whitening#', $service ), 'AIOSEO outputs the generated meta description' );
$types = graph_types( $service );
check( in_array( 'Dentist', $types, true ), 'organization typed as Dentist in AIOSEO graph' );
check( in_array( 'Service', $types, true ), 'Service node added' );
check( in_array( 'FAQPage', $types, true ), 'FAQPage node added' );
check( 1 === substr_count( $service, 'application/ld+json' ), 'one merged JSON-LD block (no duplicate graph)' );
check( in_array( 'BlogPosting', graph_types( $post ), true ), 'blog post uses BlogPosting' );

exit( $fail ? 1 : 0 );
