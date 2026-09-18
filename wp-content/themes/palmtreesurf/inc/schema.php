<?php
/**
 * JSON-LD structured data.
 *
 * LocalBusiness sitewide, Product plus Offer on experiences, FAQPage where an
 * experience has FAQ entries, and BreadcrumbList on interior pages.
 *
 * AggregateRating is emitted only when a real rating and review count exist on
 * the experience. Inventing review data would be both wrong and a policy
 * violation, so an experience with no rating simply omits the property.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Print a JSON-LD block.
 *
 * @param array $data Structured data.
 */
function pt_print_jsonld( $data ) {
	if ( ! $data ) {
		return;
	}

	printf(
		'<script type="application/ld+json">%s</script>',
		wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE )
	);
}

/**
 * The sitewide LocalBusiness node.
 *
 * @return array<string, mixed>
 */
function pt_local_business_schema() {
	$data = array(
		'@context' => 'https://schema.org',
		'@type'    => 'LocalBusiness',
		'name'     => get_bloginfo( 'name' ),
		'url'      => home_url( '/' ),
	);

	$description = get_bloginfo( 'description' );
	if ( $description ) {
		$data['description'] = $description;
	}

	if ( has_custom_logo() ) {
		$logo_id = (int) get_theme_mod( 'custom_logo' );
		$logo    = wp_get_attachment_image_url( $logo_id, 'full' );
		if ( $logo ) {
			$data['logo']  = $logo;
			$data['image'] = $logo;
		}
	}

	$phone = pt_mod( 'pt_phone' );
	if ( $phone ) {
		$data['telephone'] = $phone;
	}

	$email = pt_mod( 'pt_email' );
	if ( $email && is_email( $email ) ) {
		$data['email'] = $email;
	}

	$address = pt_mod( 'pt_address' );
	if ( $address ) {
		$data['address'] = array(
			'@type'           => 'PostalAddress',
			'streetAddress'   => $address,
			'addressLocality' => 'Tamarindo',
			'addressRegion'   => 'Guanacaste',
			'addressCountry'  => 'CR',
		);
	}

	$social = array();
	foreach ( array( 'pt_instagram', 'pt_facebook', 'pt_tripadvisor', 'pt_youtube' ) as $key ) {
		$url = pt_mod( $key );
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
 * The Product node for a single experience.
 *
 * @param int $post_id Experience ID.
 * @return array<string, mixed>
 */
function pt_experience_schema( $post_id ) {
	$data = array(
		'@context'    => 'https://schema.org',
		'@type'       => 'Product',
		'name'        => get_the_title( $post_id ),
		'url'         => get_permalink( $post_id ),
		'description' => wp_strip_all_tags( get_the_excerpt( $post_id ) ),
	);

	$image = get_the_post_thumbnail_url( $post_id, 'pt-hero' );
	if ( $image ) {
		$data['image'] = $image;
	}

	$price = pt_field( $post_id, 'price_from' );
	if ( $price ) {
		$data['offers'] = array(
			'@type'         => 'Offer',
			'price'         => $price,
			'priceCurrency' => 'USD',
			'availability'  => 'https://schema.org/InStock',
			'url'           => get_permalink( $post_id ),
		);
	}

	// Only ever emitted from real stored values.
	$rating  = pt_field( $post_id, 'rating' );
	$reviews = (int) pt_field( $post_id, 'review_count' );

	if ( $rating && $reviews > 0 ) {
		$data['aggregateRating'] = array(
			'@type'       => 'AggregateRating',
			'ratingValue' => $rating,
			'reviewCount' => $reviews,
		);
	}

	return $data;
}

/**
 * The FAQPage node for an experience, when it has FAQ entries.
 *
 * @param int $post_id Experience ID.
 * @return array<string, mixed>
 */
function pt_faq_schema( $post_id ) {
	$pairs = pt_field_pairs( $post_id, 'faq' );

	if ( ! $pairs ) {
		return array();
	}

	$entities = array();

	foreach ( $pairs as $pair ) {
		if ( '' === $pair[0] || '' === $pair[1] ) {
			continue;
		}

		$entities[] = array(
			'@type'          => 'Question',
			'name'           => $pair[0],
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => $pair[1],
			),
		);
	}

	if ( ! $entities ) {
		return array();
	}

	return array(
		'@context'   => 'https://schema.org',
		'@type'      => 'FAQPage',
		'mainEntity' => $entities,
	);
}

/**
 * Breadcrumbs for interior pages.
 *
 * @return array<string, mixed>
 */
function pt_breadcrumb_schema() {
	if ( is_front_page() ) {
		return array();
	}

	$items = array(
		array(
			'@type'    => 'ListItem',
			'position' => 1,
			'name'     => __( 'Home', 'palmtreesurf' ),
			'item'     => home_url( '/' ),
		),
	);

	if ( is_singular( PT_EXPERIENCE_POST_TYPE ) ) {
		$archive = get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE );

		if ( $archive ) {
			$items[] = array(
				'@type'    => 'ListItem',
				'position' => 2,
				'name'     => __( 'Experiences', 'palmtreesurf' ),
				'item'     => $archive,
			);
		}

		$items[] = array(
			'@type'    => 'ListItem',
			'position' => count( $items ) + 1,
			'name'     => get_the_title(),
			'item'     => get_permalink(),
		);
	} elseif ( is_singular() ) {
		$items[] = array(
			'@type'    => 'ListItem',
			'position' => 2,
			'name'     => get_the_title(),
			'item'     => get_permalink(),
		);
	}

	if ( count( $items ) < 2 ) {
		return array();
	}

	return array(
		'@context'        => 'https://schema.org',
		'@type'           => 'BreadcrumbList',
		'itemListElement' => $items,
	);
}

/**
 * Print the structured data for the current view.
 */
function pt_print_schema() {
	/*
	 * AIOSEO, Yoast and Rank Math all emit LocalBusiness and BreadcrumbList.
	 * Emitting a second copy competes with theirs, so those are theirs when a
	 * plugin is active. Product/Offer and FAQPage for a custom post type are
	 * not covered by the free tiers, so the theme keeps those either way.
	 */
	if ( ! function_exists( 'pt_seo_plugin_active' ) || ! pt_seo_plugin_active() ) {
		pt_print_jsonld( pt_local_business_schema() );
		pt_print_jsonld( pt_breadcrumb_schema() );
	}

	if ( is_singular( PT_EXPERIENCE_POST_TYPE ) ) {
		$post_id = get_queried_object_id();
		pt_print_jsonld( pt_experience_schema( $post_id ) );
		pt_print_jsonld( pt_faq_schema( $post_id ) );
	}
}
add_action( 'wp_head', 'pt_print_schema', 30 );
