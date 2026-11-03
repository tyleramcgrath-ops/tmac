<?php
/**
 * LocalBusiness / FAQ structured data and meta description.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

add_action( 'wp_head', 'popeye_meta_description', 3 );
/**
 * Basic meta description, skipped when an SEO plugin is active.
 */
function popeye_meta_description() {
	if ( defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) || defined( 'AIOSEO_VERSION' ) || defined( 'SEOPRESS_VERSION' ) ) {
		return;
	}
	if ( is_front_page() ) {
		$desc = get_bloginfo( 'description' );
		if ( ! $desc ) {
			$desc = 'Charter the classic 1979 Young Brothers lobster boat Popeye for unforgettable coastal experiences on Charleston Harbor. Book your private charter today.';
		}
	} elseif ( is_singular() && has_excerpt() ) {
		$desc = get_the_excerpt();
	} elseif ( is_singular() ) {
		$desc = wp_trim_words( wp_strip_all_tags( get_post_field( 'post_content', get_queried_object_id() ) ), 30, '…' );
	} else {
		return;
	}
	if ( $desc ) {
		echo '<meta name="description" content="' . esc_attr( wp_strip_all_tags( $desc ) ) . '">' . "\n";
	}
}

add_action( 'wp_head', 'popeye_schema', 30 );
/**
 * JSON-LD on the front page.
 */
function popeye_schema() {
	if ( ! is_front_page() ) {
		return;
	}
	$offers = array();
	foreach ( get_posts( array( 'post_type' => 'experience', 'posts_per_page' => 20, 'orderby' => 'menu_order', 'order' => 'ASC' ) ) as $p ) {
		$offers[] = array(
			'@type'       => 'Offer',
			'itemOffered' => array(
				'@type'       => 'Service',
				'name'        => get_the_title( $p ),
				'description' => wp_strip_all_tags( get_the_excerpt( $p ) ),
				'url'         => get_permalink( $p ),
			),
		);
	}
	$business = array(
		'@context'                  => 'https://schema.org',
		'@type'                     => array( 'LocalBusiness', 'TouristAttraction' ),
		'name'                      => get_bloginfo( 'name' ),
		'description'               => 'Private boat charters on Charleston Harbor, SC aboard the historic 1979 Young Brothers lobster boat Popeye. USCG-licensed captain. Up to 10 guests per private charter.',
		'url'                       => home_url( '/' ),
		'telephone'                 => popeye_opt( 'phone_raw' ),
		'email'                     => popeye_opt( 'email' ),
		'priceRange'                => '$$',
		'image'                     => popeye_img( 'public_8555_1417e3bb588a49a0aa0e9522fddd7af9' ),
		'address'                   => array(
			'@type'           => 'PostalAddress',
			'addressLocality' => 'Charleston',
			'addressRegion'   => 'SC',
			'addressCountry'  => 'US',
		),
		'geo'                       => array(
			'@type'     => 'GeoCoordinates',
			'latitude'  => 32.7765,
			'longitude' => -79.9311,
		),
		'openingHoursSpecification' => array(
			array(
				'@type'     => 'OpeningHoursSpecification',
				'dayOfWeek' => array( 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ),
				'opens'     => '08:00',
				'closes'    => '20:00',
			),
		),
	);
	if ( $offers ) {
		$business['hasOfferCatalog'] = array(
			'@type'           => 'OfferCatalog',
			'name'            => 'Charter Experiences',
			'itemListElement' => $offers,
		);
	}

	$faq = array(
		'@context'   => 'https://schema.org',
		'@type'      => 'FAQPage',
		'mainEntity' => array_map(
			fn( $q ) => array(
				'@type'          => 'Question',
				'name'           => $q[0],
				'acceptedAnswer' => array(
					'@type' => 'Answer',
					'text'  => $q[1],
				),
			),
			popeye_content( 'faqs' )
		),
	);

	foreach ( array( $business, $faq ) as $graph ) {
		echo '<script type="application/ld+json">' . wp_json_encode( $graph, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "</script>\n";
	}
}
