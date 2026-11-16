<?php
/**
 * Tidies each page's own HTML for the theme without changing a word:
 * drops images that no longer exist, points old .aspx links at the new pages, turns
 * tables of links and towns into responsive lists, makes phone numbers tappable.
 */

defined( 'ABSPATH' ) || exit;

function suncoast_map_href( $href ) {
	$href = trim( (string) $href );
	if ( $href === '' || strpos( $href, 'AddArticle.aspx' ) === 0 ) {
		return null;
	}
	if ( ! preg_match( '#^(?:https?://(?:www\.)?suncoastclean\.com)?(/[^?\#]*)?(\#.*)?$#i', $href, $m ) ) {
		return $href;
	}
	$path = trim( $m[1] ?? '/', '/' );
	$frag = $m[2] ?? '';
	if ( $path === '' ) {
		return home_url( '/' ) . $frag;
	}
	if ( substr( $path, -5 ) === '.aspx' ) {
		$key  = substr( $path, 0, -5 );
		$map  = suncoast_aspx_map();
		$path = $map[ $key ] ?? $key;
		if ( $path === '/#reviews' ) {
			return home_url( '/#reviews' );
		}
		if ( $key === 'admin/pages/leave-a-testimonial-for-suncoast' ) {
			return 'mailto:' . suncoast_option( 'email' ) . '?subject=' . rawurlencode( 'A testimonial for Sun Coast' );
		}
	}
	return suncoast_url( $path ) . $frag;
}

function suncoast_filter_content( $content ) {
	if ( ! is_singular() || ! in_the_loop() || ! is_main_query() || trim( $content ) === '' ) {
		return $content;
	}
	libxml_use_internal_errors( true );
	$doc = new DOMDocument();
	$doc->loadHTML( '<?xml encoding="utf-8" ?><div id="sc-root">' . $content . '</div>' );
	$xp   = new DOMXPath( $doc );
	$root = $doc->getElementById( 'sc-root' );

	foreach ( iterator_to_array( $xp->query( '//script|//style' ) ) as $n ) {
		$n->parentNode->removeChild( $n );
	}
	// Attributes the old theme and Word left behind.
	foreach ( iterator_to_array( $xp->query( '//*[@style or @dir or @width or @height or @cellspacing or @cellpadding or @border or @align or @valign or @class]' ) ) as $el ) {
		foreach ( array( 'style', 'dir', 'cellspacing', 'cellpadding', 'border', 'align', 'valign' ) as $a ) {
			$el->removeAttribute( $a );
		}
		if ( $el->nodeName !== 'img' ) {
			$el->removeAttribute( 'width' );
			$el->removeAttribute( 'height' );
			$cls = trim( preg_replace( '/\b(fusion\S*|wp-block-\S*|has-fixed-layout)\b/', '', $el->getAttribute( 'class' ) ) );
			if ( $cls === '' ) {
				$el->removeAttribute( 'class' );
			} else {
				$el->setAttribute( 'class', $cls );
			}
		}
	}
	// Images from the site's old /filesimages/ folder are gone (404 on the live site).
	foreach ( iterator_to_array( $xp->query( '//img' ) ) as $img ) {
		$src = $img->getAttribute( 'src' );
		if ( strpos( $src, 'filesimages' ) !== false || strpos( $src, 'carpetcleangreen' ) !== false ) {
			$parent = $img->parentNode;
			$parent->removeChild( $img );
			if ( $parent->nodeName === 'p' && trim( $parent->textContent ) === '' && ! $xp->query( './/*', $parent )->length ) {
				$parent->parentNode->removeChild( $parent );
			}
		}
	}
	// Video embeds get a responsive frame.
	foreach ( iterator_to_array( $xp->query( '//iframe' ) ) as $fr ) {
		$src = $fr->getAttribute( 'src' );
		$src = preg_replace( '#^http://#', 'https://', $src );
		$fr->setAttribute( 'src', $src );
		$fr->setAttribute( 'loading', 'lazy' );
		$fr->setAttribute( 'title', 'Video' );
		$wrap = $doc->createElement( 'div' );
		$wrap->setAttribute( 'class', 'video-embed' );
		$holder = ( $fr->parentNode->nodeName === 'p' ) ? $fr->parentNode : $fr;
		$holder->parentNode->replaceChild( $wrap, $holder );
		$wrap->appendChild( $fr );
	}
	// Unwrap the divs the old editor put inside list items; drop empty elements.
	foreach ( iterator_to_array( $xp->query( '//li/div|//figure|//span|//u' ) ) as $n ) {
		while ( $n->firstChild ) {
			$n->parentNode->insertBefore( $n->firstChild, $n );
		}
		$n->parentNode->removeChild( $n );
	}
	foreach ( iterator_to_array( $xp->query( '//p|//h1|//h2|//h3|//h4|//li|//b|//strong|//ul|//ol' ) ) as $n ) {
		if ( ! $n->parentNode ) {
			continue;
		}
		$t = trim( str_replace( "\xc2\xa0", '', $n->textContent ) );
		if ( $t === '' && ! $xp->query( './/img|.//a|.//iframe', $n )->length ) {
			$n->parentNode->removeChild( $n );
		}
	}
	// The page title is the only H1.
	foreach ( iterator_to_array( $xp->query( '//h1' ) ) as $h ) {
		$h2 = $doc->createElement( 'h2' );
		while ( $h->firstChild ) {
			$h2->appendChild( $h->firstChild );
		}
		$h->parentNode->replaceChild( $h2, $h );
	}
	foreach ( iterator_to_array( $xp->query( '//a' ) ) as $a ) {
		$new = suncoast_map_href( $a->getAttribute( 'href' ) );
		if ( $new === null ) {
			while ( $a->firstChild ) {
				$a->parentNode->insertBefore( $a->firstChild, $a );
			}
			$a->parentNode->removeChild( $a );
			continue;
		}
		$a->setAttribute( 'href', $new );
		if ( preg_match( '#^https?://#', $new ) && strpos( $new, home_url() ) !== 0 ) {
			$a->setAttribute( 'target', '_blank' );
			$a->setAttribute( 'rel', 'noopener' );
		}
	}
	// Tables: towns -> columns of lists; cards of h3s; link tables; everything else scrolls.
	foreach ( iterator_to_array( $xp->query( '//table' ) ) as $tb ) {
		$tds   = iterator_to_array( $xp->query( './/td', $tb ) );
		$inner = array();
		foreach ( $tds as $td ) {
			foreach ( $xp->query( './/*', $td ) as $c ) {
				$inner[ $c->nodeName ] = true;
			}
		}
		if ( $tds && ! array_diff( array_keys( $inner ), array( 'br' ) ) ) {
			$cols = $doc->createElement( 'div' );
			$cols->setAttribute( 'class', 'town-cols' );
			foreach ( $tds as $td ) {
				$ul   = $doc->createElement( 'ul' );
				$html = '';
				foreach ( $td->childNodes as $c ) {
					$html .= $doc->saveHTML( $c );
				}
				foreach ( preg_split( '#<br\s*/?>#i', $html ) as $line ) {
					$line = trim( preg_replace( '/\s+/u', ' ', wp_strip_all_tags( $line ) ) );
					if ( $line !== '' ) {
						$li = $doc->createElement( 'li' );
						$li->appendChild( $doc->createTextNode( html_entity_decode( $line, ENT_QUOTES, 'UTF-8' ) ) );
						$ul->appendChild( $li );
					}
				}
				$cols->appendChild( $ul );
			}
			$tb->parentNode->replaceChild( $cols, $tb );
			continue;
		}
		$all_h3 = (bool) $tds;
		foreach ( $tds as $td ) {
			if ( ! $xp->query( './/h3', $td )->length ) {
				$all_h3 = false;
			}
		}
		if ( $all_h3 ) {
			$cards = $doc->createElement( 'div' );
			$cards->setAttribute( 'class', 'cards' );
			foreach ( $tds as $td ) {
				$box = $doc->createElement( 'div' );
				while ( $td->firstChild ) {
					$box->appendChild( $td->firstChild );
				}
				$cards->appendChild( $box );
			}
			$tb->parentNode->replaceChild( $cards, $tb );
			continue;
		}
		$links_only = (bool) $tds;
		foreach ( $tds as $td ) {
			if ( ! ( $xp->query( './/a', $td )->length && $xp->query( './/*', $td )->length === 1 ) ) {
				$links_only = false;
			}
		}
		if ( $links_only ) {
			$tb->setAttribute( 'class', 'link-table' );
		}
		$wrap = $doc->createElement( 'div' );
		$wrap->setAttribute( 'class', 'table-wrap' );
		$tb->parentNode->replaceChild( $wrap, $tb );
		$wrap->appendChild( $tb );
	}
	// A heading that is just a phone number becomes a call box.
	foreach ( iterator_to_array( $xp->query( '//h3' ) ) as $h ) {
		if ( preg_match( '/^(1-877-747-8787|\(561\)\s?747-8787|561-747-8787)/', trim( $h->textContent ) ) ) {
			$p = $doc->createElement( 'p' );
			$p->setAttribute( 'class', 'call-box' );
			while ( $h->firstChild ) {
				$p->appendChild( $h->firstChild );
			}
			$h->parentNode->replaceChild( $p, $h );
		}
	}
	if ( is_page( 'contact-us' ) ) {
		foreach ( iterator_to_array( $xp->query( '//p[contains(., "Phone:")]' ) ) as $p ) {
			$p->setAttribute( 'class', 'lead-contact' );
			$first = $p->firstChild;
			while ( $first && $first->nodeType === XML_TEXT_NODE && trim( $first->textContent ) === '' ) {
				$first = $first->nextSibling;
			}
			if ( $first && $first->nodeName === 'br' ) {
				$p->removeChild( $first );
			}
		}
	}
	// Phone numbers become links.
	$tel = 'tel:' . suncoast_option( 'phone_tel' );
	foreach ( iterator_to_array( $xp->query( '//text()[not(ancestor::a)]' ) ) as $text ) {
		if ( ! preg_match( '/(1-877-747-8787|\(561\)\s?747-8787|561-747-8787)/', $text->nodeValue ) ) {
			continue;
		}
		$parts = preg_split( '/(1-877-747-8787|\(561\)\s?747-8787|561-747-8787)/', $text->nodeValue, -1, PREG_SPLIT_DELIM_CAPTURE );
		$frag  = $doc->createDocumentFragment();
		foreach ( $parts as $i => $part ) {
			if ( $i % 2 === 1 ) {
				$a = $doc->createElement( 'a', htmlspecialchars( $part ) );
				$a->setAttribute( 'href', $tel );
				$frag->appendChild( $a );
			} elseif ( $part !== '' ) {
				$frag->appendChild( $doc->createTextNode( $part ) );
			}
		}
		$text->parentNode->replaceChild( $frag, $text );
	}

	$out = '';
	foreach ( $root->childNodes as $child ) {
		$out .= $doc->saveHTML( $child );
	}
	return $out;
}
add_filter( 'the_content', 'suncoast_filter_content', 20 );
