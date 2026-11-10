<?php
/**
 * Pieces the templates share: page kinds, breadcrumbs, the estimate form, sidebars, related news.
 */

defined( 'ABSPATH' ) || exit;

/** Permalink for a page by slug, falling back to the address it would have. */
function suncoast_url( $slug ) {
	if ( $slug === '' || $slug === 'home' ) {
		return home_url( '/' );
	}
	if ( $slug[0] === '/' ) {
		return home_url( $slug );
	}
	$page = get_page_by_path( $slug );
	if ( $page ) {
		return get_permalink( $page );
	}
	if ( $slug === 'news' ) {
		$posts_page = (int) get_option( 'page_for_posts' );
		return $posts_page ? get_permalink( $posts_page ) : home_url( '/news/' );
	}
	$post = get_page_by_path( $slug, OBJECT, 'post' );
	return $post ? get_permalink( $post ) : home_url( '/' . $slug . '/' );
}

/** What kind of page this is, which decides the sidebar, the breadcrumbs and the schema. */
function suncoast_page_kind( $post = null ) {
	$post = get_post( $post );
	if ( ! $post ) {
		return 'page';
	}
	if ( $post->post_type === 'post' ) {
		return 'post';
	}
	if ( (int) get_option( 'page_on_front' ) === $post->ID ) {
		return 'home';
	}
	if ( (int) get_option( 'page_for_posts' ) === $post->ID || $post->post_name === 'news' ) {
		return 'news';
	}
	$slug = $post->post_name;
	if ( $slug === 'best-cleaning-services-in-florida' ) {
		return 'services-index';
	}
	if ( $slug === 'locations' ) {
		return 'locations-index';
	}
	if ( $slug === 'get-that-stain-out' ) {
		return 'stains-index';
	}
	if ( isset( suncoast_services()[ $slug ] ) ) {
		return 'service';
	}
	if ( isset( suncoast_locations()[ $slug ] ) ) {
		return 'location';
	}
	if ( in_array( $slug, suncoast_stains(), true ) ) {
		return 'stain';
	}
	return array( 'about-suncoast-carpet-cleaning' => 'about', 'contact-us' => 'contact', 'privacy' => 'legal' )[ $slug ] ?? 'page';
}

/** Section label and parent page for the eyebrow and breadcrumbs. */
function suncoast_section( $kind ) {
	switch ( $kind ) {
		case 'service':
		case 'services-index':
			return array( 'Services', 'best-cleaning-services-in-florida' );
		case 'location':
		case 'locations-index':
			return array( 'Locations', 'locations' );
		case 'stain':
		case 'stains-index':
			return array( 'Get That Stain Out!', 'get-that-stain-out' );
		case 'post':
		case 'news':
			return array( 'News', 'news' );
		case 'about':
			return array( 'About Sun Coast', '' );
		case 'contact':
			return array( 'Contact', '' );
		case 'legal':
			return array( 'Legal', '' );
	}
	return array( 'Sun Coast', '' );
}

/** Breadcrumb trail as [label, url|null] pairs, the last being the current page. */
function suncoast_breadcrumb_items( $post = null ) {
	$post  = get_post( $post );
	$kind  = suncoast_page_kind( $post );
	$items = array( array( 'Home', home_url( '/' ) ) );
	list( $label, $parent ) = suncoast_section( $kind );
	if ( $parent && $parent !== $post->post_name && ! in_array( $kind, array( 'services-index', 'locations-index', 'stains-index', 'news' ), true ) ) {
		$items[] = array( $label, suncoast_url( $parent ) );
	}
	$items[] = array( get_the_title( $post ), null );
	return $items;
}

function suncoast_breadcrumbs( $items = null ) {
	$items = $items ?? suncoast_breadcrumb_items();
	$out   = '<nav class="crumbs" aria-label="Breadcrumb"><ol>';
	$last  = count( $items ) - 1;
	foreach ( $items as $i => $item ) {
		if ( $i < $last && $item[1] ) {
			$out .= '<li><a href="' . esc_url( $item[1] ) . '">' . esc_html( $item[0] ) . '</a></li>';
		} else {
			$out .= '<li aria-current="page">' . esc_html( $item[0] ) . '</li>';
		}
	}
	return $out . '</ol></nav>';
}

/** The dark page header. */
function suncoast_page_hero( $eyebrow_html, $title, $meta = '', $crumbs = '' ) {
	return '<section class="page-hero"><div class="wrap">' . $crumbs .
		'<p class="eyebrow">' . $eyebrow_html . '</p><h1>' . esc_html( $title ) . '</h1>' .
		( $meta ? '<p class="meta">' . $meta . '</p>' : '' ) . '</div></section>';
}

/** The estimate form. Posts to admin-post.php; inc/form.php emails it. */
function suncoast_estimate_form( $compact = false ) {
	$phone = suncoast_option( 'phone' );
	$tel   = 'tel:' . suncoast_option( 'phone_tel' );
	$opts  = '';
	foreach ( suncoast_service_options() as $o ) {
		$opts .= '<option>' . esc_html( $o ) . '</option>';
	}
	$sent   = isset( $_GET['estimate'] ) ? sanitize_key( wp_unslash( $_GET['estimate'] ) ) : '';
	$notice = '';
	if ( $sent === 'sent' ) {
		$notice = '<p class="form-note" role="status">Thank you. Your request is on its way to Sun Coast; we\'ll call or text you back.</p>';
	} elseif ( $sent === 'error' ) {
		$notice = '<p class="form-note" role="alert">Something went wrong sending the form. Please call or text ' . esc_html( $phone ) . '.</p>';
	}
	$hidden = '<input type="hidden" name="action" value="suncoast_estimate">' . wp_nonce_field( 'suncoast_estimate', '_sc_nonce', true, false ) .
		'<input type="hidden" name="_sc_return" value="' . esc_url( get_permalink() ?: home_url( '/' ) ) . '">' .
		'<p class="hp" aria-hidden="true"><label>Leave this field empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></p>';
	$action = esc_url( admin_url( 'admin-post.php' ) );
	if ( $compact ) {
		return '<form class="quote-card" id="estimate" method="post" action="' . $action . '" aria-labelledby="est-title">' .
			'<h2 id="est-title">Get a free estimate</h2><p class="sub">Tell us what needs cleaning. We\'ll call or text you back.</p>' . $hidden .
			'<label class="field"><span>Name</span><input id="est-name" name="name" autocomplete="name" required></label>' .
			'<label class="field"><span>Phone</span><input id="est-phone" name="phone" type="tel" autocomplete="tel" required></label>' .
			'<label class="field"><span>Service</span><select id="est-service" name="service">' . $opts . '</select></label>' .
			'<button class="btn btn-primary" type="submit">Request my free estimate<svg aria-hidden="true"><use href="#arrow"/></svg></button>' . $notice .
			'<p class="fine">Or call <a href="' . esc_attr( $tel ) . '">' . esc_html( $phone ) . '</a></p></form>';
	}
	return '<form class="quote-card" id="estimate" method="post" action="' . $action . '" aria-labelledby="est-title">' .
		'<h2 id="est-title">Get a free estimate</h2><p class="sub">Tell us what needs cleaning. We\'ll call or text you back.</p>' . $hidden .
		'<div class="row2"><label class="field"><span>Name</span><input id="est-name" name="name" autocomplete="name" required></label>' .
		'<label class="field"><span>Phone</span><input id="est-phone" name="phone" type="tel" autocomplete="tel" required></label></div>' .
		'<div class="row2"><label class="field"><span>Service</span><select id="est-service" name="service">' . $opts . '</select></label>' .
		'<label class="field"><span>ZIP code</span><input id="est-zip" name="zip" inputmode="numeric" autocomplete="postal-code" maxlength="10"></label></div>' .
		'<label class="field"><span>Anything we should know? <em style="font-weight:400;color:var(--muted);font-style:normal">(optional)</em></span>' .
		'<textarea id="est-notes" name="notes" rows="3" placeholder="Rooms, rug size, pet stains, water in the house…"></textarea></label>' .
		'<button class="btn btn-primary" type="submit" style="background:var(--ink);color:#fff">Request my free estimate<svg aria-hidden="true"><use href="#arrow"/></svg></button>' . $notice .
		'<p class="fine">Water in the house? Call now: <a href="' . esc_attr( $tel ) . '">' . esc_html( $phone ) . '</a></p></form>';
}

function suncoast_side_list( $heading, $items, $current = '' ) {
	$out = '<div class="side-card"><h3>' . esc_html( $heading ) . '</h3><ul>';
	foreach ( $items as $slug => $label ) {
		$cur  = $slug === $current ? ' aria-current="page"' : '';
		$out .= '<li><a href="' . esc_url( suncoast_url( $slug ) ) . '"' . $cur . '>' . esc_html( $label ) . '</a></li>';
	}
	return $out . '</ul></div>';
}

function suncoast_contact_card() {
	return '<div class="side-card"><h3>Talk to Sun Coast</h3><a class="call" href="tel:' . esc_attr( suncoast_option( 'phone_tel' ) ) . '">' .
		esc_html( suncoast_option( 'phone' ) ) . '</a><p>Call or text, 7 days a week. Email <a href="mailto:' . esc_attr( suncoast_option( 'email' ) ) . '">' .
		esc_html( suncoast_option( 'email' ) ) . '</a>. ' . esc_html( suncoast_option( 'address' ) ) . '.</p></div>';
}

/** All posts' id, title and date, once per request. */
function suncoast_all_posts() {
	static $rows = null;
	if ( $rows === null ) {
		$rows = get_transient( 'suncoast_post_index' );
		if ( ! is_array( $rows ) ) {
			global $wpdb;
			$rows = $wpdb->get_results( "SELECT ID, post_title, post_date, post_name FROM {$wpdb->posts} WHERE post_type = 'post' AND post_status = 'publish' ORDER BY post_date DESC", ARRAY_A );
			set_transient( 'suncoast_post_index', $rows, HOUR_IN_SECONDS );
		}
	}
	return $rows;
}
add_action( 'save_post_post', function () { delete_transient( 'suncoast_post_index' ); } );

/** Posts whose title mentions any of the words, newest first. */
function suncoast_related_posts( $words, $exclude = 0, $n = 6 ) {
	$out = array();
	foreach ( suncoast_all_posts() as $row ) {
		if ( (int) $row['ID'] === (int) $exclude ) {
			continue;
		}
		$title = strtolower( html_entity_decode( $row['post_title'] ) );
		foreach ( $words as $w ) {
			if ( preg_match( '/\b' . preg_quote( strtolower( $w ), '/' ) . '/u', $title ) ) {
				$out[] = (int) $row['ID'];
				break;
			}
		}
		if ( count( $out ) >= $n ) {
			break;
		}
	}
	return $out;
}

function suncoast_excerpt( $post, $n = 170 ) {
	$text = wp_strip_all_tags( strip_shortcodes( get_post( $post )->post_content ) );
	$text = trim( preg_replace( '/\s+/u', ' ', str_replace( "\xc2\xa0", ' ', html_entity_decode( $text, ENT_QUOTES, 'UTF-8' ) ) ) );
	if ( mb_strlen( $text ) <= $n ) {
		return $text;
	}
	$cut = mb_substr( $text, 0, $n );
	$cut = preg_replace( '/\s+\S*$/u', '', $cut );
	return rtrim( $cut, ' ,.;:' ) . '…';
}

function suncoast_recent_news( $current = 0 ) {
	$out = '<div class="side-card"><h3>Recent news</h3><ul>';
	foreach ( array_slice( suncoast_all_posts(), 0, 6 ) as $row ) {
		$cur  = (int) $row['ID'] === (int) $current ? ' aria-current="page"' : '';
		$out .= '<li><a href="' . esc_url( get_permalink( $row['ID'] ) ) . '"' . $cur . '>' . esc_html( html_entity_decode( $row['post_title'] ) ) .
			'<span class="date">' . esc_html( date_i18n( 'F j, Y', strtotime( $row['post_date'] ) ) ) . '</span></a></li>';
	}
	return $out . '</ul><p style="margin-top:12px"><a href="' . esc_url( suncoast_url( 'news' ) ) . '">All news</a></p></div>';
}

function suncoast_related_list( $heading, $ids, $intro = '' ) {
	if ( ! $ids ) {
		return '';
	}
	$out = '<section class="related"><h2>' . esc_html( $heading ) . '</h2>' . ( $intro ? '<p>' . esc_html( $intro ) . '</p>' : '' ) . '<ul class="news-list">';
	foreach ( $ids as $id ) {
		$out .= '<li><a href="' . esc_url( get_permalink( $id ) ) . '">' . esc_html( get_the_title( $id ) ) . '</a>' .
			'<time datetime="' . esc_attr( get_the_date( 'Y-m-d', $id ) ) . '">' . esc_html( get_the_date( 'F j, Y', $id ) ) . '</time>' .
			'<p>' . esc_html( suncoast_excerpt( $id, 140 ) ) . '</p></li>';
	}
	return $out . '</ul></section>';
}

function suncoast_glance() {
	$out = '<section class="glance"><h2>Sun Coast at a glance</h2><ul>';
	foreach ( suncoast_facts() as $f ) {
		$out .= '<li>' . esc_html( $f ) . '</li>';
	}
	return $out . '</ul><p>Call or text <a href="tel:' . esc_attr( suncoast_option( 'phone_tel' ) ) . '">' . esc_html( suncoast_option( 'phone' ) ) .
		'</a> for a free estimate, or email <a href="mailto:' . esc_attr( suncoast_option( 'email' ) ) . '">' . esc_html( suncoast_option( 'email' ) ) . '</a>.</p></section>';
}

function suncoast_areas_sentence( $label ) {
	$links = array();
	foreach ( suncoast_locations() as $slug => $town ) {
		$links[] = '<a href="' . esc_url( suncoast_url( $slug ) ) . '">' . esc_html( $town ) . '</a>';
	}
	return '<section class="areas"><h2>Where we offer ' . esc_html( strtolower( $label ) ) . '</h2><p>Sun Coast comes to you in ' . implode( ', ', $links ) .
		', and the rest of Palm Beach, Martin and St. Lucie counties. <a href="' . esc_url( suncoast_url( 'locations' ) ) . '">See every town we serve</a>.</p></section>';
}

function suncoast_town_services( $town ) {
	$out = '<section class="areas"><h2>Cleaning services in ' . esc_html( $town ) . '</h2><p>Every Sun Coast service is available in ' . esc_html( $town ) . ':</p><ul class="svc-links">';
	foreach ( suncoast_services() as $slug => $label ) {
		$out .= '<li><a href="' . esc_url( suncoast_url( $slug ) ) . '">' . esc_html( $label ) . '</a></li>';
	}
	return $out . '</ul></section>';
}

/** Supporting content under a page's copy, all of it from elsewhere on the site. */
function suncoast_page_extras( $post = null ) {
	$post = get_post( $post );
	$kind = suncoast_page_kind( $post );
	$slug = $post->post_name;
	$out  = '';
	switch ( $kind ) {
		case 'service':
			$label = suncoast_services()[ $slug ];
			$out  .= suncoast_areas_sentence( $label );
			$out  .= suncoast_related_list( 'News about ' . strtolower( $label ), suncoast_related_posts( suncoast_service_words()[ $slug ] ), 'Tips and announcements from Sun Coast on this service.' );
			$out  .= suncoast_glance();
			break;
		case 'location':
			$town = suncoast_locations()[ $slug ];
			$out .= suncoast_town_services( $town );
			$out .= suncoast_related_list( 'News from ' . $town, suncoast_related_posts( array( $town ) ) );
			$out .= suncoast_glance();
			break;
		case 'stain':
			$out .= '<section class="areas"><h2>When the stain won\'t come out</h2><p>Sun Coast\'s <a href="' . esc_url( suncoast_url( 'carpet-cleaning' ) ) . '">carpet cleaning</a>, <a href="' .
				esc_url( suncoast_url( 'furniture-cleaning-that-gets-out-stains' ) ) . '">furniture cleaning</a> and <a href="' . esc_url( suncoast_url( 'area-rug-cleaning' ) ) .
				'">area rug cleaning</a> technicians treat set-in stains, pet stains and odors every day across Jupiter and the Palm Beaches. Call or text <a href="tel:' .
				esc_attr( suncoast_option( 'phone_tel' ) ) . '">' . esc_html( suncoast_option( 'phone' ) ) . '</a> for a free estimate.</p></section>';
			$out .= suncoast_related_list( 'Stain tips from our news', suncoast_related_posts( array( 'stain', 'spill', 'ketchup', 'pet stain', 'scotchgard', 'myths' ) ) );
			break;
		case 'about':
		case 'contact':
		case 'locations-index':
		case 'services-index':
			$out .= suncoast_glance();
			break;
		case 'post':
			$t     = strtolower( get_the_title( $post ) . ' ' . suncoast_excerpt( $post, 300 ) );
			$hit   = function ( $w ) use ( $t ) { return preg_match( '/\b' . preg_quote( strtolower( $w ), '/' ) . '/u', $t ); };
			$words = array();
			$links = '';
			foreach ( suncoast_services() as $s => $label ) {
				foreach ( suncoast_service_words()[ $s ] as $w ) {
					if ( $hit( $w ) ) {
						$links .= '<li><a href="' . esc_url( suncoast_url( $s ) ) . '">' . esc_html( $label ) . '</a></li>';
						$words  = array_merge( $words, suncoast_service_words()[ $s ] );
						break;
					}
				}
			}
			foreach ( suncoast_locations() as $s => $town ) {
				if ( $hit( $town ) ) {
					$links  .= '<li><a href="' . esc_url( suncoast_url( $s ) ) . '">' . esc_html( $town ) . ' carpet cleaning</a></li>';
					$words[] = $town;
				}
			}
			$rel = $words ? suncoast_related_posts( $words, $post->ID, 4 ) : array();
			if ( count( $rel ) < 4 ) {
				foreach ( suncoast_all_posts() as $row ) {
					if ( (int) $row['ID'] !== $post->ID && ! in_array( (int) $row['ID'], $rel, true ) ) {
						$rel[] = (int) $row['ID'];
					}
					if ( count( $rel ) >= 4 ) {
						break;
					}
				}
			}
			if ( $links ) {
				$out .= '<section class="areas"><h2>Sun Coast services in this article</h2><ul class="svc-links">' . $links . '</ul></section>';
			}
			$out .= suncoast_related_list( 'Related reading', $rel );
			break;
	}
	return $out;
}

/** The sidebar for a page kind. */
function suncoast_sidebar( $post = null ) {
	$post  = get_post( $post );
	$kind  = suncoast_page_kind( $post );
	$slug  = $post ? $post->post_name : '';
	$parts = array( suncoast_estimate_form( true ) );
	switch ( $kind ) {
		case 'service':
		case 'services-index':
			$parts[] = suncoast_side_list( 'All services', suncoast_services(), $slug );
			break;
		case 'location':
		case 'locations-index':
			$parts[] = suncoast_side_list( 'Areas we serve', suncoast_locations(), $slug );
			$parts[] = suncoast_side_list( 'All services', suncoast_services() );
			break;
		case 'stain':
		case 'stains-index':
			$items = array();
			foreach ( suncoast_stains() as $s ) {
				$p = get_page_by_path( $s );
				if ( $p ) {
					$items[ $s ] = get_the_title( $p );
				}
			}
			$parts[] = suncoast_side_list( 'Get that stain out', $items, $slug );
			break;
		case 'post':
		case 'news':
			$parts[] = suncoast_recent_news( $post ? $post->ID : 0 );
			$parts[] = suncoast_side_list( 'All services', suncoast_services() );
			break;
		default:
			$parts[] = suncoast_contact_card();
			$parts[] = suncoast_side_list( 'All services', suncoast_services() );
	}
	return implode( "\n", $parts );
}

/** Steps parsed from a stain guide ("1.) Blot", ...). */
function suncoast_howto_steps( $post ) {
	$text  = wp_strip_all_tags( str_replace( array( '<br />', '<br>', '<br/>' ), "\n", get_post( $post )->post_content ) );
	$steps = array();
	foreach ( preg_split( '/\r?\n/', $text ) as $line ) {
		$line = trim( $line );
		if ( preg_match( '/^\d+\.\)\s*(.+)$/u', $line, $m ) ) {
			$steps[] = trim( $m[1] );
		}
	}
	return $steps;
}

/** The logo mark in the header: the custom logo if one is set, else the theme's. */
function suncoast_brand( $footer = false ) {
	$home = esc_url( home_url( '/' ) );
	if ( $footer ) {
		return '<a class="brand logo-tile" href="' . $home . '"><img class="logo" src="' . esc_url( get_template_directory_uri() . '/assets/img/logo.png' ) .
			'" width="283" height="240" alt="' . esc_attr( get_bloginfo( 'name' ) ) . '"></a>';
	}
	$mark = get_template_directory_uri() . '/assets/img/logo-mark.png';
	if ( has_custom_logo() ) {
		$src = wp_get_attachment_image_url( get_theme_mod( 'custom_logo' ), 'medium' );
		if ( $src ) {
			$mark = $src;
		}
	}
	return '<a class="brand" href="' . $home . '" aria-label="' . esc_attr( get_bloginfo( 'name' ) ) . ', home"><img class="mark" src="' . esc_url( $mark ) .
		'" width="283" height="162" alt=""><span><b>Sun Coast</b><small>Cleaning &amp; Restoration</small></span></a>';
}

/** The home page's own words, read from the Home page's content (fusion markup), with fallbacks. */
function suncoast_home_parts() {
	$front = (int) get_option( 'page_on_front' );
	$html  = $front ? get_post( $front )->post_content : '';
	$parts = array(
		'h1'       => 'Carpet and Upholstery Cleaning in Jupiter and Palm Beaches',
		'heading'  => 'Trusted name with 23 years of carpet cleaning experience',
		'intro'    => array(),
		'reviews'  => array(),
	);
	if ( ! $html ) {
		return $parts;
	}
	libxml_use_internal_errors( true );
	$doc = new DOMDocument();
	$doc->loadHTML( '<?xml encoding="utf-8" ?><div>' . $html . '</div>' );
	$xp    = new DOMXPath( $doc );
	$clean = function ( $node ) { return trim( preg_replace( '/\s+/u', ' ', $node->textContent ) ); };
	foreach ( $xp->query( '//h1' ) as $h ) {
		if ( $clean( $h ) ) {
			$parts['h1'] = ucwords( strtolower( $clean( $h ) ) );
			$parts['h1'] = str_replace( array( ' And ', ' In ' ), array( ' and ', ' in ' ), $parts['h1'] );
			break;
		}
	}
	foreach ( $xp->query( '//h2' ) as $h ) {
		if ( stripos( $clean( $h ), 'TRUSTED' ) === 0 ) {
			$parts['heading'] = ucfirst( strtolower( $clean( $h ) ) );
		}
	}
	foreach ( $xp->query( '//p' ) as $p ) {
		$t = $clean( $p );
		if ( $t && stripos( $t, 'Click here' ) !== 0 && ( stripos( $t, 'A leader' ) === 0 || stripos( $t, 'If you are looking' ) === 0 || stripos( $t, 'Suncoast Cleaning and Restoration' ) === 0 ) ) {
			$parts['intro'][] = $t;
		}
	}
	foreach ( $xp->query( '//*[contains(concat(" ", normalize-space(@class), " "), " review ")]' ) as $r ) {
		$q = $xp->query( './/q|.//blockquote', $r )->item( 0 );
		if ( ! $q ) {
			continue;
		}
		foreach ( $xp->query( './/br', $q ) as $br ) {
			$br->parentNode->replaceChild( $doc->createTextNode( "\n" ), $br );
		}
		$lines = array_values( array_filter( array_map( 'trim', explode( "\n", preg_replace( '/[ \t]+/u', ' ', $q->textContent ) ) ) ) );
		$name  = $xp->query( './/*[contains(@class,"company-name")]/strong', $r )->item( 0 );
		$place = $xp->query( './/*[contains(@class,"company-name")]/span', $r )->item( 0 );
		$parts['reviews'][] = array( 'lines' => $lines, 'name' => $name ? $clean( $name ) : '', 'place' => $place ? $clean( $place ) : '' );
	}
	return $parts;
}
