<?php
/**
 * End-to-end test against a real WordPress + All in One SEO install.
 * Run with: wp eval-file tests/e2e.php --user=admin
 * Requires tests/mock-claude.php installed as a mu-plugin.
 */

// eval-file runs this file inside a function, so the counter must live in $GLOBALS.
$GLOBALS['aisa_failures'] = 0;
function aisa_t( $ok, $label, $detail = '' ) {
	if ( $ok ) {
		WP_CLI::line( "  ok   {$label}" );
	} else {
		$GLOBALS['aisa_failures']++;
		WP_CLI::line( "  FAIL {$label}" . ( $detail ? " — {$detail}" : '' ) );
	}
}
function aisa_seo( $id ) {
	// Read straight from AIOSEO's model (exists in every AIOSEO 4.x/5.x), not through the plugin.
	$m = new AISA_Adapter_Model();
	$r = $m->read( $id );
	return is_wp_error( $r ) ? [] : $r;
}
function aisa_expected_adapter() {
	if ( function_exists( 'wp_get_ability' ) && wp_get_ability( 'aioseo-posts/seo-data-update' ) ) {
		return 'abilities';
	}
	return class_exists( '\AIOSEO\Plugin\Common\Services\PostSeoService' ) ? 'service' : 'model';
}
WP_CLI::line( 'Environment: WordPress ' . get_bloginfo( 'version' ) . ', AIOSEO ' . AIOSEO_VERSION . ', expected write path: ' . aisa_expected_adapter() );

AISA_Settings::save(
	[
		'api_key'     => 'sk-ant-test-key',
		'token_saver' => false,
		'model'       => 'claude-opus-5',
		'effort'     => 'low',
		'mode'       => 'fill_empty',
		'post_types' => [ 'post', 'page' ],
	]
);

$ids = [];
foreach ( get_posts( [ 'post_type' => [ 'post', 'page' ], 'post_status' => 'publish', 'posts_per_page' => -1 ] ) as $p ) {
	$ids[ $p->post_title ] = $p->ID;
}

WP_CLI::line( 'Compatibility' );
$h = AISA_Health_Check::run();
aisa_t( $h['ok'], 'self-test passes' );
aisa_t( aisa_expected_adapter() === AISA_AIOSEO_Bridge::compat()['adapter'], 'the most official available write path is active', AISA_AIOSEO_Bridge::compat()['adapter'] );
aisa_t( 0 === count( get_posts( [ 's' => 'compatibility test', 'post_status' => 'any' ] ) ), 'self-test cleaned up its draft post' );

WP_CLI::line( 'Existing manual SEO is kept in fill-empty mode' );
AISA_AIOSEO_Bridge::write( $ids['About Us'], [ 'title' => 'My Handwritten About Title' ] );
aisa_t( 'My Handwritten About Title' === aisa_seo( $ids['About Us'] )['title'], 'manual title seeded' );

WP_CLI::line( 'Site profile' );
delete_option( 'aisa_test_requests' );
$profile = AISA_Generator::generate_profile();
aisa_t( ! is_wp_error( $profile ), 'profile generated', is_wp_error( $profile ) ? $profile->get_error_message() : '' );
$req = get_option( 'aisa_test_requests' )[0];
aisa_t( 'claude-opus-5' === $req['body']['model'], 'request uses the configured model' );
aisa_t( 'default' === $req['body']['fallbacks'] && 'server-side-fallback-2026-07-01' === $req['headers']['anthropic-beta'], 'refusal fallbacks enabled for Opus 5' );
aisa_t( 'json_schema' === $req['body']['output_config']['format']['type'] && 'low' === $req['body']['output_config']['effort'], 'structured output + effort sent' );
aisa_t( false !== strpos( $req['body']['messages'][0]['content'], '(512) 555-0142' ), 'homepage text reached the prompt' );

$report = AISA_Jobs::apply_profile( $profile );
aisa_t( 'Bright Smile Dental' === aioseo()->options->searchAppearance->global->schema->organizationName, 'organization name written to AIOSEO', wp_json_encode( $report ) );
aisa_t( '+1-512-555-0142' === aioseo()->options->searchAppearance->global->schema->phone, 'phone written to AIOSEO' );
aisa_t( 'https://www.facebook.com/brightsmileatx' === aioseo()->options->social->profiles->urls->facebookPageUrl, 'Facebook profile written to AIOSEO' );
aisa_t( ! isset( $report['home_title'] ), 'homepage title skipped in settings because the front page is a static page' );

WP_CLI::line( 'Generate and apply every page' );
foreach ( AISA_Jobs::targets() as $item ) {
	$g = AISA_Jobs::generate( $item['type'], $item['id'] );
	aisa_t( ! is_wp_error( $g ), "generate {$item['title']}", is_wp_error( $g ) ? $g->get_error_message() : '' );
	$a = AISA_Jobs::apply( $item['type'], $item['id'] );
	aisa_t( ! is_wp_error( $a ), "apply {$item['title']}", is_wp_error( $a ) ? $a->get_error_message() : '' );
}

$w = aisa_seo( $ids['Teeth Whitening'] );
aisa_t( 'Teeth Whitening in Austin, TX | Bright Smile Dental' === $w['title'], 'title saved in AIOSEO', $w['title'] );
aisa_t( 0 === strpos( (string) $w['description'], 'Learn about teeth whitening' ), 'description saved in AIOSEO' );
aisa_t( 'teeth whitening austin' === $w['focus_keyphrase'], 'focus keyphrase saved in AIOSEO', (string) $w['focus_keyphrase'] );
aisa_t( 'Teeth Whitening at Bright Smile Dental' === $w['og_title'], 'Open Graph title saved in AIOSEO' );
aisa_t( array() === $w['additional_keyphrases'], 'additional keyphrases skipped on AIOSEO Lite', wp_json_encode( $w['additional_keyphrases'] ) );
$row = \AIOSEO\Plugin\Common\Models\Post::getPost( $ids['Teeth Whitening'] );
if ( property_exists( $row, 'focus_keyword' ) || isset( $row->focus_keyword ) ) {
	aisa_t( 'teeth whitening austin' === $row->focus_keyword, 'AIOSEO 5 focus_keyword column kept in sync' );
}

$about = aisa_seo( $ids['About Us'] );
aisa_t( 'My Handwritten About Title' === $about['title'], 'manual About title was NOT overwritten' );
aisa_t( 0 === strpos( (string) $about['description'], 'Learn about about us' ), 'empty About description was filled' );

$schema = AISA_Jobs::active_schema( $ids['Teeth Whitening'] );
aisa_t( 'Professional Teeth Whitening' === $schema['service']['name'] && 1 === count( $schema['faqs'] ), 'Service and FAQ schema stored' );

WP_CLI::line( 'Restore' );
$r = AISA_Jobs::restore( 'post', $ids['Teeth Whitening'] );
$w = aisa_seo( $ids['Teeth Whitening'] );
aisa_t( ! is_wp_error( $r ) && empty( $w['title'] ) && empty( $w['description'] ) && empty( $w['focus_keyphrase'] ), 'restore returns AIOSEO to its previous (empty) values', wp_json_encode( $w ) );
aisa_t( null === AISA_Jobs::active_schema( $ids['Teeth Whitening'] ), 'restore removes the added schema' );
AISA_Jobs::apply( 'post', $ids['Teeth Whitening'] );
aisa_t( 'Teeth Whitening in Austin, TX | Bright Smile Dental' === aisa_seo( $ids['Teeth Whitening'] )['title'], 're-apply after restore works' );
AISA_Jobs::edit( 'post', $ids['Teeth Whitening'], [ 'title' => 'Edited Proposal Title & More' ] );
AISA_Jobs::apply( 'post', $ids['Teeth Whitening'] );
aisa_t( 'Edited Proposal Title & More' === aisa_seo( $ids['Teeth Whitening'] )['title'], 'fill-empty mode can update values this plugin wrote itself', aisa_seo( $ids['Teeth Whitening'] )['title'] );
AISA_Jobs::apply( 'post', $ids['About Us'] );
aisa_t( 'My Handwritten About Title' === aisa_seo( $ids['About Us'] )['title'], '…but still never touches a value a person wrote' );

WP_CLI::line( 'Overwrite mode' );
AISA_Settings::save( [ 'mode' => 'overwrite' ] );
AISA_Jobs::apply( 'post', $ids['About Us'] );
aisa_t( 'About Us in Austin, TX | Bright Smile Dental' === aisa_seo( $ids['About Us'] )['title'], 'overwrite mode replaces the manual title' );
AISA_Jobs::restore( 'post', $ids['About Us'] );
aisa_t( 'My Handwritten About Title' === aisa_seo( $ids['About Us'] )['title'], 'restore brings the manual title back' );
AISA_Settings::save( [ 'mode' => 'fill_empty' ] );

WP_CLI::line( 'Pro path (simulated)' );
aioseo()->pro = true;
AISA_Settings::save( [ 'mode' => 'overwrite' ] );
AISA_Jobs::apply( 'post', $ids['Contact'] );
aisa_t( [ 'dentist austin', 'austin dental care' ] === aisa_seo( $ids['Contact'] )['additional_keyphrases'], 'additional keyphrases written when Pro is active', wp_json_encode( aisa_seo( $ids['Contact'] )['additional_keyphrases'] ) );
aioseo()->pro = false;
AISA_Settings::save( [ 'mode' => 'fill_empty' ] );

WP_CLI::line( 'Resilience: a write path that silently stops working' );
class AISA_Test_Silent_Adapter implements AISA_Adapter {
	public function id() { return 'silent'; }
	public function label() { return 'Silent'; }
	public function is_available() { return true; }
	public function read( $id ) { return AISA_Adapter_Abilities::normalize_snapshot( [] ); }
	public function write( $id, $f ) { return true; } // Claims success, saves nothing.
}
add_filter( 'aisa_adapters', function ( $a ) { array_unshift( $a, new AISA_Test_Silent_Adapter() ); return $a; } );
AISA_AIOSEO_Bridge::reset();
AISA_AIOSEO_Bridge::update_compat( [ 'adapter' => 'silent', 'broken' => [] ] );
$res = AISA_AIOSEO_Bridge::write( $ids['Sample Page'], [ 'title' => 'Resilience check title' ] );
aisa_t( ! is_wp_error( $res ) && 'silent' !== $res['adapter'], 'write detected the silent failure and used the next path', wp_json_encode( $res ) );
aisa_t( 'Resilience check title' === aisa_seo( $ids['Sample Page'] )['title'], 'value really landed in AIOSEO' );
aisa_t( in_array( 'silent', AISA_AIOSEO_Bridge::compat()['broken'], true ), 'broken path recorded for the Health tab' );

WP_CLI::line( 'Resilience: every path broken' );
add_filter( 'aisa_adapters', function () { return [ new AISA_Test_Silent_Adapter() ]; }, 99 );
AISA_AIOSEO_Bridge::reset();
$res = AISA_AIOSEO_Bridge::write( $ids['Sample Page'], [ 'title' => 'Should not be claimed' ] );
aisa_t( is_wp_error( $res ) && 'aisa_write_failed' === $res->get_error_code(), 'write reports a clear error instead of pretending' );
$h = AISA_Health_Check::run();
aisa_t( ! $h['ok'], 'self-test reports the problem' );
aisa_t( false !== strpos( AISA_Health_Check::report(), 'silent: available=yes passed=no' ), 'diagnostic report names the failing path' );
remove_all_filters( 'aisa_adapters' );
AISA_AIOSEO_Bridge::reset();
aisa_t( AISA_Health_Check::run()['ok'], 'self-test recovers once the path works again' );

WP_CLI::line( 'Token saver mode' );
AISA_Settings::save( [ 'token_saver' => true, 'model' => 'claude-haiku-4-5', 'mode' => 'fill_empty' ] );
aisa_t( 6000 === AISA_Content_Extractor::max_chars(), 'page text capped at 6,000 characters' );
$long_id = wp_insert_post( [ 'post_title' => 'Long Page', 'post_status' => 'publish', 'post_type' => 'page', 'post_content' => str_repeat( 'Dental implants replace missing teeth. ', 1500 ) ] );
delete_option( 'aisa_test_requests' );
AISA_Jobs::generate( 'post', $long_id );
$reqs = get_option( 'aisa_test_requests', [] );
aisa_t( 1 === count( $reqs ), 'one request per page (no second "fix the length" request)', count( $reqs ) . ' requests' );
aisa_t( mb_strlen( $reqs[0]['body']['messages'][0]['content'] ) < 7000, 'request carries only the capped text', mb_strlen( $reqs[0]['body']['messages'][0]['content'] ) . ' chars' );
aisa_t( 'claude-haiku-4-5' === $reqs[0]['body']['model'] && ! isset( $reqs[0]['body']['output_config']['effort'] ) && ! isset( $reqs[0]['body']['fallbacks'] ), 'Haiku request has no effort or fallbacks parameters' );
AISA_AIOSEO_Bridge::write( $long_id, [ 'title' => 'Person Title', 'description' => 'Person description.', 'focus_keyphrase' => 'person phrase' ] );
delete_post_meta( $long_id, '_aisa_proposal' );
delete_post_meta( $long_id, '_aisa_written' );
delete_option( 'aisa_test_requests' );
$row = AISA_Jobs::generate( 'post', $long_id );
aisa_t( 'skipped' === $row['status'] && ! get_option( 'aisa_test_requests' ), 'page whose SEO a person wrote is skipped without calling Claude' );
aisa_t( 'Teeth Whitening in Austin' === AISA_Generator::fit( 'Teeth Whitening in Austin | Bright Smile Dental Clinic Group Of Texas', 45 ), 'over-long title drops the brand suffix', AISA_Generator::fit( 'Teeth Whitening in Austin | Bright Smile Dental Clinic Group Of Texas', 45 ) );
$fit = AISA_Generator::fit( str_repeat( 'word ', 50 ), 60 );
aisa_t( mb_strlen( $fit ) <= 60 && 'word' === substr( $fit, -4 ), 'long text is cut at a word boundary', $fit );
wp_delete_post( $long_id, true );

WP_CLI::line( 'Export / import (no API key)' );
AISA_Settings::save( [ 'api_key' => '', 'clear_api_key' => 1, 'mode' => 'overwrite' ] );
$export = AISA_Exchange::export();
aisa_t( 'aisa-export/1' === $export['format'] && $export['total'] === count( $export['items'] ), 'export lists every page' );
$wh = null;
foreach ( $export['items'] as $it ) {
	if ( $it['id'] === $ids['Teeth Whitening'] ) {
		$wh = $it;
	}
}
aisa_t( $wh && false !== strpos( $wh['text'], 'whitening' ) && is_array( $wh['current'] ), 'export includes page text and current SEO' );
delete_option( 'aisa_test_requests' );
$report = AISA_Exchange::import(
	[
		'format' => 'aisa-import/1',
		'items'  => [
			[
				'type'            => 'post',
				'id'              => $ids['Sample Page'],
				'title'           => 'Imported Whitening Title | Bright Smile',
				'description'     => 'Imported description written in a Claude chat, long enough to be a proper meta description for this whitening page. Book today.',
				'focus_keyphrase' => 'imported whitening',
				'og_title'        => '',
				'schema'          => [ 'page_type' => 'WebPage', 'article_type' => 'none', 'service' => [ 'name' => 'Imported Service' ], 'faqs' => [] ],
			],
			[ 'type' => 'post', 'id' => 999999, 'title' => 'Nope' ],
		],
	]
);
aisa_t( 'stored' === $report['items'][0]['result'] && 0 === strpos( $report['items'][1]['result'], 'error' ), 'import stores valid items and rejects unknown ids' );
aisa_t( ! get_option( 'aisa_test_requests' ), 'import makes no Claude API calls' );
aisa_t( 'Imported Whitening Title | Bright Smile' !== aisa_seo( $ids['Sample Page'] )['title'], 'import without apply does not touch AIOSEO yet' );
$prop = AISA_Jobs::get_proposal( 'post', $ids['Sample Page'] );
aisa_t( 'import' === $prop['model'] && ! isset( $prop['fields']['og_title'] ) && 'Imported Service' === $prop['schema']['service']['name'], 'blank fields are ignored and service schema is kept' );
AISA_Jobs::apply( 'post', $ids['Sample Page'] );
aisa_t( 'Imported Whitening Title | Bright Smile' === aisa_seo( $ids['Sample Page'] )['title'], 'applying an imported proposal writes it to AIOSEO without an API key' );
$report = AISA_Exchange::import( [ 'apply' => true, 'items' => [ [ 'type' => 'post', 'id' => $ids['Contact'], 'title' => 'Imported Contact Title' ] ] ] );
aisa_t( 'applied' === $report['items'][0]['result'] && 'Imported Contact Title' === aisa_seo( $ids['Contact'] )['title'], 'import with apply writes straight to AIOSEO' );
AISA_Settings::save( [ 'mode' => 'fill_empty' ] );

WP_CLI::line( '' );
if ( $GLOBALS['aisa_failures'] ) {
	WP_CLI::error( $GLOBALS['aisa_failures'] . ' check(s) failed.' );
}
WP_CLI::success( 'All checks passed.' );
