<?php
/**
 * Titles, descriptions, social tags and schema for every page.
 * Steps aside entirely when All in One SEO, Yoast or Rank Math is active.
 */

defined( 'ABSPATH' ) || exit;

function suncoast_seo_plugin_active() {
	return defined( 'AIOSEO_VERSION' ) || defined( 'WPSEO_VERSION' ) || class_exists( 'RankMath' ) || defined( 'SEOPRESS_VERSION' );
}

function suncoast_sentence_cut( $text, $n = 158 ) {
	$text = trim( preg_replace( '/\s+/u', ' ', $text ) );
	if ( mb_strlen( $text ) <= $n ) {
		return $text;
	}
	$cut = mb_substr( $text, 0, $n );
	if ( preg_match( '/^(.*[.!?])\s/u', $cut, $m ) && mb_strlen( $m[1] ) > 70 ) {
		return $m[1];
	}
	return rtrim( preg_replace( '/\s+\S*$/u', '', $cut ), ' ,.;:' ) . '…';
}

/** The title tag for a page or post. */
function suncoast_seo_title( $post = null ) {
	$post = get_post( $post );
	if ( ! $post ) {
		return get_bloginfo( 'name' );
	}
	$kind  = suncoast_page_kind( $post );
	$title = html_entity_decode( get_the_title( $post ), ENT_QUOTES, 'UTF-8' );
	if ( $kind === 'home' ) {
		return 'Carpet Cleaning Jupiter & Palm Beach | Sun Coast Cleaning';
	}
	if ( $kind === 'stain' ) {
		return 'How to Remove ' . $title . ' Stains | Sun Coast Cleaning';
	}
	if ( $kind === 'post' ) {
		return mb_strlen( $title ) <= 48 ? $title . ' | Sun Coast News' : $title;
	}
	$long = $title . ' | Sun Coast Cleaning and Restoration';
	return mb_strlen( $long ) <= 60 ? $long : $title . ' | Sun Coast';
}

/** The meta description for a page or post. */
function suncoast_seo_description( $post = null ) {
	$post = get_post( $post );
	if ( ! $post ) {
		return suncoast_descriptions()['home'];
	}
	$kind = suncoast_page_kind( $post );
	$slug = $kind === 'home' ? 'home' : $post->post_name;
	$all  = suncoast_descriptions();
	if ( isset( $all[ $slug ] ) ) {
		return suncoast_sentence_cut( $all[ $slug ] );
	}
	if ( $kind === 'location' ) {
		$town = suncoast_locations()[ $slug ];
		return suncoast_sentence_cut( $town . ' carpet cleaning by Sun Coast, since 1988: carpet, tile and grout, upholstery, area rugs and water damage restoration in ' . $town . ', FL. Free estimates: (561) 747-8787.' );
	}
	if ( $kind === 'stain' ) {
		$steps = suncoast_howto_steps( $post );
		$first = strtolower( implode( '; ', array_slice( $steps, 0, 2 ) ) );
		return suncoast_sentence_cut( 'Sun Coast\'s steps to remove ' . strtolower( html_entity_decode( get_the_title( $post ) ) ) . ' stains from carpet: ' . $first . '. Test an inconspicuous area first. Still stained? Call (561) 747-8787 in Jupiter.' );
	}
	if ( has_excerpt( $post ) ) {
		return suncoast_sentence_cut( wp_strip_all_tags( $post->post_excerpt ) );
	}
	$text = suncoast_excerpt( $post, 400 );
	return $text ? suncoast_sentence_cut( $text ) : html_entity_decode( get_the_title( $post ) ) . ' from Sun Coast Cleaning and Restoration in Jupiter, Florida.';
}

function suncoast_business_ld() {
	return array(
		'@context'      => 'https://schema.org',
		'@type'         => 'LocalBusiness',
		'@id'           => home_url( '/#business' ),
		'name'          => 'Sun Coast Cleaning and Restoration',
		'alternateName' => 'Suncoast Cleaning and Restoration',
		'url'           => home_url( '/' ),
		'telephone'     => '+1-561-747-8787',
		'email'         => suncoast_option( 'email' ),
		'foundingDate'  => '1988',
		'image'         => get_template_directory_uri() . '/assets/img/logo.png',
		'logo'          => get_template_directory_uri() . '/assets/img/logo.png',
		'address'       => array( '@type' => 'PostalAddress', 'addressLocality' => 'Jupiter', 'addressRegion' => 'FL', 'postalCode' => '33478', 'addressCountry' => 'US' ),
		'areaServed'    => array( 'Jupiter', 'Palm Beach Gardens', 'West Palm Beach', 'Palm Beach', 'Lake Worth', 'Wellington', 'Boynton Beach', 'Delray Beach', 'Boca Raton', 'Stuart', 'Jensen Beach', 'Port St. Lucie', 'Indiantown', 'Royal Palm Beach' ),
		'sameAs'        => array( suncoast_option( 'facebook' ), suncoast_option( 'twitter' ) ),
	);
}

function suncoast_breadcrumb_ld( $items ) {
	$els = array();
	foreach ( $items as $i => $item ) {
		$el = array( '@type' => 'ListItem', 'position' => $i + 1, 'name' => $item[0] );
		if ( $item[1] ) {
			$el['item'] = $item[1];
		} elseif ( $i === count( $items ) - 1 ) {
			$el['item'] = get_permalink();
		}
		$els[] = $el;
	}
	return array( '@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => $els );
}

/** All the schema for the current page. */
function suncoast_schemas() {
	$out = array( suncoast_business_ld() );
	if ( is_front_page() ) {
		$out[] = array( '@context' => 'https://schema.org', '@type' => 'WebSite', '@id' => home_url( '/#website' ), 'url' => home_url( '/' ),
			'name' => 'Sun Coast Cleaning and Restoration', 'publisher' => array( '@id' => home_url( '/#business' ) ) );
		$list = array();
		$i    = 1;
		foreach ( suncoast_services() as $slug => $label ) {
			$list[] = array( '@type' => 'ListItem', 'position' => $i++, 'name' => $label, 'url' => suncoast_url( $slug ) );
		}
		$out[] = array( '@context' => 'https://schema.org', '@type' => 'ItemList', 'name' => 'Services', 'itemListElement' => $list );
		return $out;
	}
	if ( is_home() ) {
		$out[] = suncoast_breadcrumb_ld( array( array( 'Home', home_url( '/' ) ), array( 'News', suncoast_url( 'news' ) ) ) );
		$out[] = array( '@context' => 'https://schema.org', '@type' => 'CollectionPage', 'name' => 'News', 'url' => suncoast_url( 'news' ),
			'description' => suncoast_descriptions()['news'], 'isPartOf' => array( '@id' => home_url( '/#website' ) ) );
		return $out;
	}
	if ( ! is_singular() ) {
		return $out;
	}
	$post  = get_post();
	$kind  = suncoast_page_kind( $post );
	$desc  = suncoast_seo_description( $post );
	$title = html_entity_decode( get_the_title( $post ), ENT_QUOTES, 'UTF-8' );
	$url   = get_permalink( $post );
	$out[] = suncoast_breadcrumb_ld( suncoast_breadcrumb_items( $post ) );
	if ( $kind === 'post' ) {
		$out[] = array( '@context' => 'https://schema.org', '@type' => 'Article', 'headline' => $title, 'description' => $desc,
			'datePublished' => get_the_date( 'c', $post ), 'dateModified' => get_the_modified_date( 'c', $post ), 'url' => $url, 'mainEntityOfPage' => $url,
			'image' => get_template_directory_uri() . '/assets/img/1600210492486-724fe5c67fb0.jpg',
			'author' => array( '@type' => 'Organization', 'name' => 'Sun Coast Cleaning and Restoration', '@id' => home_url( '/#business' ) ),
			'publisher' => array( '@id' => home_url( '/#business' ) ), 'articleSection' => 'News' );
		return $out;
	}
	$types = array( 'about' => 'AboutPage', 'contact' => 'ContactPage', 'services-index' => 'CollectionPage', 'locations-index' => 'CollectionPage', 'stains-index' => 'CollectionPage' );
	$out[] = array( '@context' => 'https://schema.org', '@type' => $types[ $kind ] ?? 'WebPage', 'name' => $title, 'description' => $desc, 'url' => $url,
		'isPartOf' => array( '@id' => home_url( '/#website' ) ), 'about' => array( '@id' => home_url( '/#business' ) ) );
	if ( $kind === 'service' ) {
		$out[] = array( '@context' => 'https://schema.org', '@type' => 'Service', 'name' => $title, 'serviceType' => suncoast_services()[ $post->post_name ],
			'description' => $desc, 'url' => $url, 'provider' => array( '@id' => home_url( '/#business' ) ), 'areaServed' => suncoast_business_ld()['areaServed'] );
	}
	if ( $kind === 'location' ) {
		$out[] = array( '@context' => 'https://schema.org', '@type' => 'Service', 'name' => $title, 'serviceType' => 'Carpet cleaning', 'description' => $desc, 'url' => $url,
			'provider' => array( '@id' => home_url( '/#business' ) ), 'areaServed' => array( '@type' => 'City', 'name' => suncoast_locations()[ $post->post_name ] ) );
	}
	if ( $kind === 'stain' ) {
		$steps = suncoast_howto_steps( $post );
		if ( count( $steps ) >= 2 ) {
			$list = array();
			foreach ( $steps as $i => $s ) {
				$list[] = array( '@type' => 'HowToStep', 'position' => $i + 1, 'text' => $s );
			}
			$out[] = array( '@context' => 'https://schema.org', '@type' => 'HowTo', 'name' => 'How to remove ' . strtolower( $title ) . ' stains', 'description' => $desc, 'url' => $url, 'step' => $list );
		}
	}
	return $out;
}

add_action( 'init', function () {
	if ( suncoast_seo_plugin_active() ) {
		return;
	}
	add_filter( 'pre_get_document_title', function ( $title ) {
		if ( is_front_page() ) {
			return suncoast_seo_title( get_option( 'page_on_front' ) );
		}
		if ( is_home() ) {
			return 'News | Sun Coast Cleaning and Restoration';
		}
		if ( is_singular() ) {
			return suncoast_seo_title();
		}
		if ( is_404() ) {
			return 'Page not found | Sun Coast Cleaning and Restoration';
		}
		return $title;
	} );
	add_filter( 'wp_robots', function ( $robots ) {
		if ( is_404() || is_search() ) {
			$robots['noindex'] = true;
			$robots['follow']  = true;
			return $robots;
		}
		$robots['index']               = true;
		$robots['follow']              = true;
		$robots['max-image-preview:large'] = true;
		$robots['max-snippet:-1']      = true;
		return $robots;
	} );
	add_action( 'wp_head', 'suncoast_seo_head', 1 );
} );

function suncoast_seo_head() {
	$desc  = is_home() ? suncoast_descriptions()['news'] : ( is_404() ? 'That page could not be found on suncoastclean.com.' : suncoast_seo_description() );
	$title = wp_get_document_title();
	$url   = is_front_page() ? home_url( '/' ) : ( is_home() ? suncoast_url( 'news' ) : ( is_singular() ? get_permalink() : home_url( add_query_arg( array() ) ) ) );
	$img   = get_template_directory_uri() . '/assets/img/1600210492486-724fe5c67fb0.jpg';
	$type  = is_singular( 'post' ) ? 'article' : 'website';
	echo '<meta name="description" content="' . esc_attr( $desc ) . '">' . "\n";
	if ( ! is_singular() ) {
		echo '<link rel="canonical" href="' . esc_url( $url ) . '">' . "\n";
	}
	echo '<meta property="og:site_name" content="Sun Coast Cleaning and Restoration">' . "\n";
	echo '<meta property="og:type" content="' . $type . '">' . "\n";
	echo '<meta property="og:title" content="' . esc_attr( $title ) . '">' . "\n";
	echo '<meta property="og:description" content="' . esc_attr( $desc ) . '">' . "\n";
	echo '<meta property="og:url" content="' . esc_url( $url ) . '">' . "\n";
	echo '<meta property="og:image" content="' . esc_url( $img ) . '">' . "\n";
	echo '<meta property="og:image:width" content="1800"><meta property="og:image:height" content="1100">' . "\n";
	echo '<meta property="og:locale" content="en_US">' . "\n";
	echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
	echo '<meta name="twitter:site" content="@SunCoastClean">' . "\n";
	echo '<meta name="twitter:title" content="' . esc_attr( $title ) . '">' . "\n";
	echo '<meta name="twitter:description" content="' . esc_attr( $desc ) . '">' . "\n";
	echo '<meta name="twitter:image" content="' . esc_url( $img ) . '">' . "\n";
	if ( is_singular( 'post' ) ) {
		echo '<meta property="article:published_time" content="' . esc_attr( get_the_date( 'c' ) ) . '">' . "\n";
		echo '<meta property="article:modified_time" content="' . esc_attr( get_the_modified_date( 'c' ) ) . '">' . "\n";
	}
	foreach ( suncoast_schemas() as $schema ) {
		echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
	}
}
