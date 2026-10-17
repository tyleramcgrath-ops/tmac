<?php
/**
 * Sitewide structured data beyond the single-page nodes.
 *
 * Organization and WebSite identify the business and the site itself, which is
 * what an answer engine needs to attribute a fact to a source. ItemList
 * describes a listing page as a list rather than leaving the crawler to infer
 * it from markup. Everything here is built from values the client has actually
 * entered — a placeholder or an empty field is omitted, never guessed.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * A stable @id for the organisation, so other nodes can point at it.
 *
 * @return string
 */
function pt_org_id() {
	return home_url( '/#organization' );
}

/**
 * The Organization node.
 *
 * @return array<string, mixed>
 */
function pt_organization_schema() {
	$data = array(
		'@context' => 'https://schema.org',
		'@type'    => 'Organization',
		'@id'      => pt_org_id(),
		'name'     => get_bloginfo( 'name' ),
		'url'      => home_url( '/' ),
	);

	$description = get_bloginfo( 'description' );

	if ( $description ) {
		$data['description'] = $description;
	}

	$logo = pt_logo_url( 'logo-horizontal.png' );

	if ( has_custom_logo() ) {
		$custom = wp_get_attachment_image_url( (int) get_theme_mod( 'custom_logo' ), 'full' );
		$logo   = $custom ? $custom : $logo;
	}

	if ( $logo ) {
		$data['logo'] = array(
			'@type' => 'ImageObject',
			'url'   => $logo,
		);
	}

	$phone = pt_filled( 'pt_phone' );
	$email = pt_filled( 'pt_email' );

	if ( $phone || $email ) {
		$contact = array(
			'@type'             => 'ContactPoint',
			'contactType'       => 'customer service',
			'availableLanguage' => array( 'English', 'Spanish' ),
		);

		if ( $phone ) {
			$contact['telephone'] = $phone;
		}

		if ( $email && is_email( $email ) ) {
			$contact['email'] = $email;
		}

		$data['contactPoint'] = array( $contact );
	}

	$social = array();

	foreach ( array( 'pt_instagram', 'pt_facebook', 'pt_tripadvisor', 'pt_youtube' ) as $key ) {
		$url = pt_filled( $key );

		if ( $url ) {
			$social[] = $url;
		}
	}

	if ( $social ) {
		$data['sameAs'] = $social;
	}

	return $data;
}

/**
 * The WebSite node, with the site search action.
 *
 * @return array<string, mixed>
 */
function pt_website_schema() {
	return array(
		'@context'        => 'https://schema.org',
		'@type'           => 'WebSite',
		'@id'             => home_url( '/#website' ),
		'url'             => home_url( '/' ),
		'name'            => get_bloginfo( 'name' ),
		'publisher'       => array( '@id' => pt_org_id() ),
		'inLanguage'      => pt_bilingual_enabled() && 'es' === pt_current_language() ? 'es' : 'en',
		'potentialAction' => array(
			'@type'       => 'SearchAction',
			'target'      => array(
				'@type'       => 'EntryPoint',
				'urlTemplate' => home_url( '/?s={search_term_string}' ),
			),
			'query-input' => 'required name=search_term_string',
		),
	);
}

/**
 * An ItemList for whatever experiences a listing page is showing.
 *
 * Only ever describes posts actually rendered on the page.
 *
 * @return array<string, mixed>
 */
function pt_item_list_schema() {
	global $wp_query;

	if ( empty( $wp_query->posts ) ) {
		return array();
	}

	$items = array();
	$index = 0;

	foreach ( $wp_query->posts as $post ) {
		if ( PT_EXPERIENCE_POST_TYPE !== $post->post_type ) {
			continue;
		}

		++$index;

		$items[] = array(
			'@type'    => 'ListItem',
			'position' => $index,
			'url'      => get_permalink( $post ),
			'name'     => wp_strip_all_tags( get_the_title( $post ) ),
		);
	}

	if ( ! $items ) {
		return array();
	}

	$name = post_type_archive_title( '', false );

	if ( is_tax() ) {
		$term = get_queried_object();
		$name = $term instanceof WP_Term ? $term->name : $name;
	}

	return array(
		'@context'        => 'https://schema.org',
		'@type'           => 'ItemList',
		'name'            => $name,
		'numberOfItems'   => count( $items ),
		'itemListElement' => $items,
	);
}

/**
 * The hub lists categories rather than individual experiences.
 *
 * @return array<string, mixed>
 */
function pt_category_list_schema() {
	$terms = get_terms(
		array(
			'taxonomy'   => 'experience_type',
			'hide_empty' => true,
		)
	);

	if ( ! $terms || is_wp_error( $terms ) ) {
		return array();
	}

	$items = array();

	foreach ( $terms as $index => $term ) {
		$link = get_term_link( $term );

		if ( is_wp_error( $link ) ) {
			continue;
		}

		$items[] = array(
			'@type'    => 'ListItem',
			'position' => $index + 1,
			'url'      => $link,
			'name'     => $term->name,
		);
	}

	if ( ! $items ) {
		return array();
	}

	return array(
		'@context'        => 'https://schema.org',
		'@type'           => 'ItemList',
		'name'            => __( 'Experience categories in Tamarindo', 'palmtreesurf' ),
		'numberOfItems'   => count( $items ),
		'itemListElement' => $items,
	);
}

/**
 * Emit the sitewide and listing nodes.
 */
function pt_print_site_schema() {
	/*
	 * Organization and WebSite are ours regardless of an SEO plugin: the free
	 * tiers emit one or the other inconsistently, and both carry an @id so a
	 * duplicate is merged rather than treated as a competing claim.
	 */
	pt_print_jsonld( pt_organization_schema() );
	pt_print_jsonld( pt_website_schema() );

	if ( is_post_type_archive( PT_EXPERIENCE_POST_TYPE ) && ! is_search() ) {
		pt_print_jsonld( pt_category_list_schema() );
		return;
	}

	if ( is_tax( pt_experience_taxonomies() ) || is_post_type_archive( PT_EXPERIENCE_POST_TYPE ) ) {
		pt_print_jsonld( pt_item_list_schema() );
	}
}
add_action( 'wp_head', 'pt_print_site_schema', 29 );
