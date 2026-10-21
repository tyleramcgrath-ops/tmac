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
define( 'MCG_AGENT_RULES_VERSION', '2' );

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
 *
 * These were routed through add_rewrite_rule() until 3.5.2, and on a real
 * host that went wrong in two different ways at once:
 *
 *   /llms.txt answered 301 to /llms.txt/ before serving, because something
 *   between the browser and WordPress appends a trailing slash to a path
 *   that has not matched a rule yet.
 *
 *   /.well-known/ai-catalog.json answered a flat 404, because hosts commonly
 *   serve /.well-known/ off disk for certificate validation and the request
 *   never reaches PHP at all.
 *
 * So the path is read off REQUEST_URI at init instead. Nothing to flush,
 * nothing a permalink setting can undo, and no host's slash habit to argue
 * with. The catalog is also served from the site root, which is the copy
 * advertised, because that is a path PHP is certain to see.
 * ===================================================================== */

/**
 * The virtual documents, by request path.
 *
 * @return array<string,string> path without slashes => which document.
 */
function mcg_agent_routes() {
	return array(
		'llms.txt'                     => 'llms',
		'ai-catalog.json'              => 'catalog',
		// Kept for hosts that do pass it through, since it is the path the
		// ARD spec names by default. Where the host swallows it, the link
		// element and the robots directive both point at the root copy.
		'.well-known/ai-catalog.json'  => 'catalog',
	);
}

/**
 * Serve whichever document was asked for, before WordPress routes anything.
 *
 * Status, content type and length are set explicitly: Lighthouse fails
 * llms-txt outright on a 5xx, and treats a 404 as "no llms.txt here", so a
 * soft 404 carrying 27 KB of theme HTML is the one outcome worth avoiding.
 */
function mcg_agent_serve() {
	if ( empty( $_SERVER['REQUEST_URI'] ) ) {
		return;
	}

	// Path only: the query string and any trailing slash are not part of the
	// match, so /llms.txt, /llms.txt/ and /llms.txt?v=2 all land here.
	$path = wp_parse_url( wp_unslash( $_SERVER['REQUEST_URI'] ), PHP_URL_PATH ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- compared against a fixed list, never echoed.
	$path = trim( (string) $path, '/' );

	$routes = mcg_agent_routes();
	if ( ! isset( $routes[ $path ] ) ) {
		return;
	}

	$which = $routes[ $path ];

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
// Priority 1 on init: ahead of the canonical redirect, ahead of routing, and
// late enough that the theme's own helpers and the options are all loaded.
add_action( 'init', 'mcg_agent_serve', 1 );

/**
 * Drop the rewrite rules 3.4.0 added.
 *
 * They are no longer consulted — mcg_agent_serve() has already answered and
 * exited by the time WordPress parses a request — but leaving them in the
 * stored rules would keep pointing /llms.txt at a query variable nothing
 * reads any more. One flush on upgrade clears them.
 */
function mcg_agent_maybe_flush() {
	if ( get_option( 'mcg_agent_rules' ) === MCG_AGENT_RULES_VERSION ) {
		return;
	}
	update_option( 'mcg_agent_rules', MCG_AGENT_RULES_VERSION );
	flush_rewrite_rules( false );
}
add_action( 'wp_loaded', 'mcg_agent_maybe_flush' );

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
		// A key with no page behind it would be listed at a guessed /slug/
		// that returns a 404, which is worse than leaving it out.
		if ( ! mcg_page_id( $key ) ) {
			continue;
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

/**
 * <link rel="ai-catalog"> in the head of every page.
 *
 * Points at the root copy rather than the /.well-known/ one. Advertising a
 * catalog is what makes Lighthouse score the ard-schema audit at all, so
 * advertising one the host answers 404 for turns a skipped check into a
 * failed one — which is exactly what happened on the live site.
 */
function mcg_agent_link_tag() {
	printf(
		'<link rel="ai-catalog" href="%s">' . "\n",
		esc_url( home_url( '/ai-catalog.json' ) )
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
	return $output . "\nAgentmap: " . esc_url_raw( home_url( '/ai-catalog.json' ) ) . "\n";
}
add_filter( 'robots_txt', 'mcg_agent_robots' );
