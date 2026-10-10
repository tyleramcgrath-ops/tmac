<?php
/**
 * Agentic browsing: the two documents an AI agent looks for before it reads
 * the site, plus the signals that point at them.
 *
 * Lighthouse 13.3 added an "Agentic Browsing" category. Three of its seven
 * checks only apply to sites using WebMCP, which this theme does not; of the
 * rest, two are earned by publishing documents WordPress does not ship:
 *
 *   /llms.txt                      a plain-text guide to the site for models
 *   /.well-known/ai-catalog.json   an ARD 1.0 manifest naming that guide
 *
 * Both are served from here rather than dropped in the web root, so they
 * follow the install: the URLs, the page list and the address all come from
 * the same options the rest of the theme renders from, and a staging copy
 * describes itself instead of production.
 *
 * A word of warning about the catalog. Lighthouse skips the ard-schema audit
 * entirely when a site advertises no catalog, and scores it the moment one
 * appears. Publishing a broken manifest is therefore worse than publishing
 * none at all, which is why mcg_ai_catalog() below sticks to the subset of
 * ARD 1.0 the conformance suite accepts without a single warning.
 *
 * @package McGrath_Chrome
 */

defined( 'ABSPATH' ) || exit;

/** Bumped whenever the rules below change, so they re-flush once on upgrade. */
define( 'MCG_AGENT_RULES_VERSION', '1' );

/**
 * The business address, in parts, so the schema, the contact page and
 * llms.txt all state it the same way.
 *
 * @return array{street:string,city:string,region:string,postal:string,country:string}
 */
function mcg_address() {
	return array(
		'street'  => mcg_opt( 'mcg_street', '5785 Golden Eagle Cir' ),
		'city'    => mcg_opt( 'mcg_city', 'Palm Beach Gardens' ),
		'region'  => mcg_opt( 'mcg_region', 'FL' ),
		'postal'  => mcg_opt( 'mcg_postal', '33418' ),
		'country' => mcg_opt( 'mcg_country', 'United States' ),
	);
}

/**
 * That address on one line, the way it would be written on an envelope.
 *
 * @return string
 */
function mcg_address_line() {
	$a = mcg_address();

	$parts = array_filter( array(
		$a['street'],
		$a['city'],
		trim( $a['region'] . ' ' . $a['postal'] ),
		$a['country'],
	) );

	return implode( ', ', $parts );
}

/* =====================================================================
 * Routing. Both documents are virtual: there is no file on disk, so
 * nothing to keep in sync with the options and nothing left behind when
 * the theme is switched away.
 * ===================================================================== */

/** Teach WordPress the two paths. */
function mcg_agent_rewrites() {
	add_rewrite_rule( '^llms\.txt$', 'index.php?mcg_agent=llms', 'top' );
	add_rewrite_rule( '^\.well-known/ai-catalog\.json$', 'index.php?mcg_agent=catalog', 'top' );
}
add_action( 'init', 'mcg_agent_rewrites' );

/** Let the rule above survive the query parsing. */
function mcg_agent_query_var( $vars ) {
	$vars[] = 'mcg_agent';
	return $vars;
}
add_filter( 'query_vars', 'mcg_agent_query_var' );

/**
 * Flush once after an upgrade adds or changes a rule.
 *
 * Theme activation already flushes; this covers the case where the theme is
 * updated in place and never re-activated, which would otherwise leave both
 * URLs 404ing until somebody saved the permalink settings by hand.
 */
function mcg_agent_maybe_flush() {
	if ( get_option( 'mcg_agent_rules' ) === MCG_AGENT_RULES_VERSION ) {
		return;
	}
	mcg_agent_rewrites();
	flush_rewrite_rules( false );
	update_option( 'mcg_agent_rules', MCG_AGENT_RULES_VERSION );
}
add_action( 'wp_loaded', 'mcg_agent_maybe_flush' );

/**
 * Serve whichever document was asked for.
 *
 * Status, content type and length are set explicitly: Lighthouse fails
 * llms-txt outright on a 5xx, and treats a 404 as "no llms.txt here", so a
 * soft 404 carrying 27 KB of theme HTML is the one outcome worth avoiding.
 */
function mcg_agent_serve() {
	$which = get_query_var( 'mcg_agent' );

	if ( 'llms' !== $which && 'catalog' !== $which ) {
		return;
	}

	if ( 'llms' === $which ) {
		$body = mcg_llms_txt();
		$type = 'text/plain; charset=utf-8';
	} else {
		$body = wp_json_encode( mcg_ai_catalog(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
		$type = 'application/json; charset=utf-8';
	}

	status_header( 200 );
	header( 'Content-Type: ' . $type );
	// No noindex here on purpose: both documents exist to be found and fetched.
	header( 'Cache-Control: public, max-age=3600' );
	mcg_agent_strip_nocache();

	echo $body; // phpcs:ignore WordPress.Security.EscapeOutput -- plain text and JSON, not HTML.
	exit;
}
add_action( 'template_redirect', 'mcg_agent_serve' );

/**
 * WordPress sends no-cache headers on anything it considers uncacheable.
 * These two documents are static for any given install, so the headers set
 * above should stand.
 */
function mcg_agent_strip_nocache() {
	if ( ! headers_sent() ) {
		header_remove( 'Expires' );
		header_remove( 'Pragma' );
	}
}

/* =====================================================================
 * The documents themselves.
 * ===================================================================== */

/**
 * /llms.txt — the site described once, in the order a model would want it.
 *
 * Lighthouse checks three things: an H1, at least one markdown link, and
 * more than 50 characters. Everything here is drawn from the same arrays the
 * pages render from, so the file cannot drift from the site it describes.
 *
 * @return string
 */
function mcg_llms_txt() {
	$name  = get_bloginfo( 'name' );
	$desc  = get_bloginfo( 'description' );
	$email = mcg_opt( 'mcg_email', 'tyler@mcgrathmarketinggroup.com' );

	$out   = array();
	$out[] = '# ' . $name;
	$out[] = '';

	if ( $desc ) {
		$out[] = '> ' . $desc;
		$out[] = '';
	}

	$out[] = 'Office: ' . mcg_address_line() . '.';
	$out[] = 'Areas served: ' . implode( ', ', mcg_areas() ) . '. Remote clients welcome.';
	$out[] = '';

	$out[] = '## Pages';
	$out[] = '';

	// Walked by key rather than by slug so each link goes through mcg_url(),
	// which returns the page's real permalink. Building the URL from the slug
	// instead would point the home entry at /home/ rather than the front page.
	$map = mcg_pages_map();

	foreach ( mcg_slugs() as $key => $slug ) {
		if ( 'vault' === $key || empty( $map[ $slug ] ) ) {
			continue; // the vault is password protected; nothing there to read.
		}
		$line = '- [' . $map[ $slug ]['title'] . '](' . mcg_url( $key ) . ')';
		if ( ! empty( $map[ $slug ]['excerpt'] ) ) {
			$line .= ': ' . $map[ $slug ]['excerpt'];
		}
		$out[] = $line;
	}

	$out[] = '';
	$out[] = '## Contact';
	$out[] = '';
	$out[] = '- [Email ' . $email . '](mailto:' . $email . ')';
	$out[] = '- [Request a free SEO audit](' . mcg_url( 'contact' ) . ')';
	$out[] = '';

	return implode( "\n", $out );
}

/**
 * /.well-known/ai-catalog.json — an ARD 1.0 manifest pointing at llms.txt.
 *
 * Deliberately one entry. The ARD media-type vocabulary has no llms.txt
 * type; `text/markdown; profile="urn:air:agent-skills"` is the only markdown
 * type the conformance suite accepts without warning, and an llms.txt is a
 * markdown document telling an agent what this site can do for it.
 *
 * The shape is fixed by the spec and the validator will reject anything
 * else, so treat each key as load-bearing:
 *   - the root takes specVersion, host and entries, and nothing else;
 *   - identifier must match urn:air:<publisher>:<namespace>:<name>;
 *   - an entry carries url or data, never both;
 *   - representativeQueries wants between two and five strings.
 *
 * @return array
 */
function mcg_ai_catalog() {
	$host = wp_parse_url( home_url(), PHP_URL_HOST );
	$host = $host ? $host : 'example.com';

	// The URN publisher segment allows letters, digits, dots and hyphens.
	$publisher = preg_replace( '/[^a-zA-Z0-9.-]/', '', $host );

	return array(
		'specVersion' => '1.0',
		'host'        => array(
			'displayName'      => get_bloginfo( 'name' ),
			'documentationUrl' => home_url( '/' ),
		),
		'entries'     => array(
			array(
				'identifier'           => 'urn:air:' . $publisher . ':site:llms-txt',
				'displayName'          => get_bloginfo( 'name' ) . ' site guide',
				'type'                 => 'text/markdown; profile="urn:air:agent-skills"',
				'url'                  => home_url( '/llms.txt' ),
				'description'          => 'A plain-text guide to ' . get_bloginfo( 'name' )
					. ': the services offered, the areas served, every public page and how to make contact.',
				'representativeQueries' => array(
					'SEO company in Jupiter, FL',
					'web design in Palm Beach County',
					'AI search optimization agency',
				),
			),
		),
	);
}

/* =====================================================================
 * Discovery. Lighthouse looks for the catalog in four places; the two a
 * theme can supply are a link element and a robots.txt directive.
 * ===================================================================== */

/** <link rel="ai-catalog"> in the head of every page. */
function mcg_agent_link_tag() {
	printf(
		'<link rel="ai-catalog" href="%s">' . "\n",
		esc_url( home_url( '/.well-known/ai-catalog.json' ) )
	);
}
add_action( 'wp_head', 'mcg_agent_link_tag', 4 );

/**
 * Agentmap: in robots.txt.
 *
 * Only reaches the served file when WordPress is the one generating it. An
 * SEO plugin that writes its own robots.txt, or a static file in the web
 * root, takes over and this filter never runs — which is survivable, since
 * the link element above is signal enough on its own.
 */
function mcg_agent_robots( $output ) {
	return $output . "\nAgentmap: " . esc_url_raw( home_url( '/.well-known/ai-catalog.json' ) ) . "\n";
}
add_filter( 'robots_txt', 'mcg_agent_robots' );
