<?php
/**
 * Adds the generated schema to the page.
 *
 * Merges into AIOSEO's own JSON-LD graph through AIOSEO's public `aioseo_schema_output`
 * filter (present since AIOSEO 4.0), so there is one graph with no duplicate nodes. If a
 * future AIOSEO stops calling that filter, the extra nodes are printed as a separate
 * JSON-LD block instead, so the schema never silently disappears.
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AISA_Schema_Injector {
	/**
	 * Whether AIOSEO called our filter during this request.
	 *
	 * @var bool
	 */
	private static $filter_ran = false;

	const WEBPAGE_TYPES = [ 'WebPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'FAQPage', 'ItemPage', 'ProfilePage', 'CheckoutPage', 'SearchResultsPage', 'MedicalWebPage', 'RealEstateListing' ];
	const ARTICLE_TYPES = [ 'Article', 'BlogPosting', 'NewsArticle' ];

	public static function init() {
		if ( is_admin() ) {
			return;
		}
		add_filter( 'aioseo_schema_output', [ __CLASS__, 'filter_graph' ], 20 );
		add_action( 'wp_footer', [ __CLASS__, 'fallback_output' ], 99 );
	}

	/**
	 * Adjusts AIOSEO's graph.
	 *
	 * @param array $graph AIOSEO graph nodes.
	 * @return array
	 */
	public static function filter_graph( $graph ) {
		self::$filter_ran = true;
		// Lets the Health tab show that AIOSEO still calls this filter (throttled to once a day).
		if ( ! get_transient( 'aisa_filter_seen_recent' ) ) {
			update_option( 'aisa_schema_filter_seen', gmdate( 'c' ), false );
			set_transient( 'aisa_filter_seen_recent', 1, DAY_IN_SECONDS );
		}
		if ( ! is_array( $graph ) ) {
			return $graph;
		}
		try {
			$graph = self::apply_site_profile( $graph );
			$data  = self::current_schema();
			if ( $data ) {
				$graph = self::apply_page_schema( $graph, $data );
			}
		} catch ( \Throwable $e ) {
			// Never break the page because of schema.
			unset( $e );
		}
		return $graph;
	}

	/**
	 * Prints our nodes on their own if AIOSEO's filter never ran but AIOSEO is active.
	 */
	public static function fallback_output() {
		if ( self::$filter_ran || ! AISA_AIOSEO_Bridge::is_active() || ! apply_filters( 'aisa_schema_fallback_enabled', true ) ) {
			return;
		}
		$data = self::current_schema();
		if ( ! $data ) {
			return;
		}
		$nodes = self::extra_nodes( $data, self::page_url(), trailingslashit( home_url() ) . '#organization', self::page_url() . '#webpage' );
		if ( ! $nodes ) {
			return;
		}
		$json = wp_json_encode(
			[
				'@context' => 'https://schema.org',
				'@graph'   => $nodes,
			],
			JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
		);
		echo "\n<script type=\"application/ld+json\" class=\"aisa-schema\">" . str_replace( '</', '<\/', $json ) . "</script>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Schema data stored for the current singular page.
	 *
	 * @return array|null
	 */
	private static function current_schema() {
		if ( ! is_singular() ) {
			return null;
		}
		$id = get_queried_object_id();
		return $id ? AISA_Jobs::active_schema( $id ) : null;
	}

	/**
	 * Canonical URL of the current page.
	 *
	 * @return string
	 */
	private static function page_url() {
		$id = get_queried_object_id();
		return $id ? (string) get_permalink( $id ) : home_url( '/' );
	}

	/**
	 * Organization → specific business type, address, area served.
	 *
	 * @param array $graph Graph.
	 * @return array
	 */
	private static function apply_site_profile( $graph ) {
		if ( ! get_option( AISA_Generator::PROFILE_OPTION . '_applied' ) ) {
			return $graph;
		}
		$p = AISA_Generator::profile();
		if ( empty( $p ) || 'organization' !== ( isset( $p['site_represents'] ) ? $p['site_represents'] : '' ) ) {
			return $graph;
		}

		foreach ( $graph as $i => $node ) {
			if ( ! is_array( $node ) || ! isset( $node['@type'] ) || 'Organization' !== $node['@type'] ) {
				continue;
			}
			if ( ! empty( $p['business_type'] ) && 'Organization' !== $p['business_type'] ) {
				$node['@type'] = $p['business_type'];
			}
			$addr = isset( $p['address'] ) ? array_filter( (array) $p['address'] ) : [];
			if ( $addr && empty( $node['address'] ) ) {
				$node['address'] = array_filter(
					[
						'@type'           => 'PostalAddress',
						'streetAddress'   => isset( $addr['street'] ) ? $addr['street'] : '',
						'addressLocality' => isset( $addr['city'] ) ? $addr['city'] : '',
						'addressRegion'   => isset( $addr['region'] ) ? $addr['region'] : '',
						'postalCode'      => isset( $addr['postal_code'] ) ? $addr['postal_code'] : '',
						'addressCountry'  => isset( $addr['country'] ) ? $addr['country'] : '',
					]
				);
			}
			if ( ! empty( $p['area_served'] ) && empty( $node['areaServed'] ) ) {
				$node['areaServed'] = $p['area_served'];
			}
			if ( ! empty( $p['price_range'] ) && empty( $node['priceRange'] ) ) {
				$node['priceRange'] = $p['price_range'];
			}
			$graph[ $i ] = $node;
		}
		return $graph;
	}

	/**
	 * Page type, article type, Service and FAQ nodes.
	 *
	 * @param array $graph Graph.
	 * @param array $data  Stored schema data.
	 * @return array
	 */
	private static function apply_page_schema( $graph, $data ) {
		$url          = self::page_url();
		$org_id       = trailingslashit( home_url() ) . '#organization';
		$webpage_id   = $url . '#webpage';
		$webpage_key  = null;
		$has_faq_node = false;

		foreach ( $graph as $i => $node ) {
			if ( ! is_array( $node ) || ! isset( $node['@type'] ) || ! is_string( $node['@type'] ) ) {
				continue;
			}
			if ( in_array( $node['@type'], self::WEBPAGE_TYPES, true ) && null === $webpage_key ) {
				$webpage_key = $i;
				if ( ! empty( $data['page_type'] ) && in_array( $data['page_type'], self::WEBPAGE_TYPES, true ) ) {
					$graph[ $i ]['@type'] = $data['page_type'];
				}
				if ( ! empty( $node['@id'] ) ) {
					$webpage_id = $node['@id'];
				}
			} elseif ( 'FAQPage' === $node['@type'] ) {
				// AIOSEO (e.g. a Pro FAQ block) already describes the FAQs.
				$has_faq_node = true;
			}
			if ( in_array( $node['@type'], self::ARTICLE_TYPES, true ) && ! empty( $data['article_type'] ) && in_array( $data['article_type'], self::ARTICLE_TYPES, true ) ) {
				$graph[ $i ]['@type'] = $data['article_type'];
			}
			if ( isset( $node['@id'] ) && preg_match( '/#organization$/', (string) $node['@id'] ) ) {
				$org_id = $node['@id'];
			}
		}

		if ( $has_faq_node ) {
			$data['faqs'] = [];
		} elseif ( null !== $webpage_key && 'FAQPage' === $graph[ $webpage_key ]['@type'] && ! empty( $data['faqs'] ) ) {
			// The page itself is the FAQPage: attach the questions to it rather than adding a second FAQPage.
			$graph[ $webpage_key ]['mainEntity'] = self::faq_questions( $data['faqs'] );
			$data['faqs']                        = [];
		}

		$existing = [];
		foreach ( $graph as $node ) {
			if ( isset( $node['@id'] ) ) {
				$existing[ $node['@id'] ] = true;
			}
		}
		foreach ( self::extra_nodes( $data, $url, $org_id, $webpage_id ) as $node ) {
			if ( empty( $existing[ $node['@id'] ] ) ) {
				$graph[] = $node;
			}
		}
		return $graph;
	}

	/**
	 * Service and FAQPage nodes.
	 *
	 * @param array  $data       Stored schema data.
	 * @param string $url        Page URL.
	 * @param string $org_id     Organization @id.
	 * @param string $webpage_id WebPage @id.
	 * @return array[]
	 */
	private static function extra_nodes( $data, $url, $org_id, $webpage_id ) {
		$nodes = [];
		if ( ! empty( $data['service']['name'] ) ) {
			$s       = $data['service'];
			$nodes[] = array_filter(
				[
					'@type'            => 'Service',
					'@id'              => $url . '#service',
					'name'             => $s['name'],
					'serviceType'      => isset( $s['service_type'] ) ? $s['service_type'] : '',
					'description'      => isset( $s['description'] ) ? $s['description'] : '',
					'areaServed'       => isset( $s['area_served'] ) ? $s['area_served'] : '',
					'provider'         => [ '@id' => $org_id ],
					'url'              => $url,
					'mainEntityOfPage' => [ '@id' => $webpage_id ],
				]
			);
		}
		if ( ! empty( $data['faqs'] ) && is_array( $data['faqs'] ) ) {
			$questions = self::faq_questions( $data['faqs'] );
			if ( $questions ) {
				$nodes[] = [
					'@type'      => 'FAQPage',
					'@id'        => $url . '#faq',
					'url'        => $url,
					'isPartOf'   => [ '@id' => $webpage_id ],
					'mainEntity' => $questions,
				];
			}
		}
		return $nodes;
	}

	/**
	 * FAQ pairs as schema.org Question nodes.
	 *
	 * @param array $faqs Pairs.
	 * @return array[]
	 */
	private static function faq_questions( $faqs ) {
		$questions = [];
		foreach ( (array) $faqs as $faq ) {
			if ( empty( $faq['question'] ) || empty( $faq['answer'] ) ) {
				continue;
			}
			$questions[] = [
				'@type'          => 'Question',
				'name'           => $faq['question'],
				'acceptedAnswer' => [
					'@type' => 'Answer',
					'text'  => $faq['answer'],
				],
			];
		}
		return $questions;
	}
}
