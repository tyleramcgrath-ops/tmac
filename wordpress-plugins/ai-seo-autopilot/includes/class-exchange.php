<?php
/**
 * Export / import, so the SEO can be written outside WordPress (for example by Claude in a
 * chat, with no Anthropic API credits) and brought back in for review and apply.
 *
 * Available two ways:
 *   - the Import / Export tab (download a file, upload a file);
 *   - a REST API at /wp-json/aisa/v1/ for a remote assistant, authenticated with a
 *     WordPress Application Password belonging to an administrator.
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AISA_Exchange {
	const NS = 'aisa/v1';

	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'routes' ] );
	}

	public static function routes() {
		$admin = function () {
			return current_user_can( 'manage_options' );
		};

		register_rest_route(
			self::NS,
			'/status',
			[
				'methods'             => 'GET',
				'permission_callback' => $admin,
				'callback'            => function () {
					$health = AISA_Health_Check::last();
					return [
						'plugin_version' => AISA_VERSION,
						'aioseo_version' => AISA_AIOSEO_Bridge::version(),
						'aioseo_pro'     => AISA_AIOSEO_Bridge::is_pro(),
						'compatible'     => ! empty( $health['ok'] ),
						'mode'           => AISA_Settings::get( 'mode' ),
					];
				},
			]
		);

		register_rest_route(
			self::NS,
			'/export',
			[
				'methods'             => 'GET',
				'permission_callback' => $admin,
				'args'                => [
					'offset' => [
						'type'    => 'integer',
						'default' => 0,
						'minimum' => 0,
					],
					'limit'  => [
						'type'    => 'integer',
						'default' => 50,
						'minimum' => 1,
						'maximum' => 200,
					],
				],
				'callback'            => function ( WP_REST_Request $req ) {
					return self::export( (int) $req['offset'], (int) $req['limit'] );
				},
			]
		);

		register_rest_route(
			self::NS,
			'/import',
			[
				'methods'             => 'POST',
				'permission_callback' => $admin,
				'callback'            => function ( WP_REST_Request $req ) {
					$payload = $req->get_json_params();
					if ( ! is_array( $payload ) ) {
						return new WP_Error( 'aisa_bad_payload', 'Send a JSON body.', [ 'status' => 400 ] );
					}
					return self::import( $payload );
				},
			]
		);

		register_rest_route(
			self::NS,
			'/restore',
			[
				'methods'             => 'POST',
				'permission_callback' => $admin,
				'callback'            => function ( WP_REST_Request $req ) {
					$out = [];
					foreach ( (array) $req->get_param( 'items' ) as $item ) {
						$type  = isset( $item['type'] ) && 'term' === $item['type'] ? 'term' : 'post';
						$id    = isset( $item['id'] ) ? absint( $item['id'] ) : 0;
						$r     = $id ? AISA_Jobs::restore( $type, $id ) : new WP_Error( 'aisa_bad_id', 'Missing id.' );
						$out[] = [
							'type'   => $type,
							'id'     => $id,
							'result' => is_wp_error( $r ) ? 'error: ' . $r->get_error_message() : 'restored',
						];
					}
					return [ 'items' => $out ];
				},
			]
		);
	}

	/**
	 * Site facts, current SEO and page text for everything the plugin can optimize.
	 *
	 * @param int $offset First item.
	 * @param int $limit  Max items (0 = all).
	 * @return array
	 */
	public static function export( $offset = 0, $limit = 0 ) {
		$targets = AISA_Jobs::targets();
		$total   = count( $targets );
		$slice   = $limit ? array_slice( $targets, $offset, $limit ) : $targets;

		$items = [];
		foreach ( $slice as $t ) {
			$current = 'term' === $t['type'] ? AISA_AIOSEO_Bridge::read_term( $t['id'] ) : AISA_AIOSEO_Bridge::read( $t['id'] );
			$text    = '';
			$post    = null;
			if ( 'post' === $t['type'] ) {
				$post = get_post( $t['id'] );
				$text = $post ? AISA_Content_Extractor::for_post( $post )['text'] : '';
			} else {
				$term = get_term( $t['id'] );
				$text = $term && ! is_wp_error( $term ) ? wp_strip_all_tags( $term->description ) : '';
			}
			$items[] = [
				'type'      => $t['type'],
				'id'        => $t['id'],
				'kind'      => $t['subtype'],
				'title'     => $t['title'],
				'url'       => $t['url'],
				'post_type' => $post ? $post->post_type : null,
				'is_home'   => $post && 'page' === get_option( 'show_on_front' ) && (int) get_option( 'page_on_front' ) === (int) $post->ID,
				'status'    => $t['status'],
				'current'   => is_wp_error( $current ) ? null : $current,
				'text'      => $text,
			];
		}

		return [
			'format'  => 'aisa-export/1',
			'site'    => [
				'name'           => get_bloginfo( 'name' ),
				'tagline'        => get_bloginfo( 'description' ),
				'url'            => home_url( '/' ),
				'language'       => AISA_Generator::language(),
				'homepage_is'    => 'page' === get_option( 'show_on_front' ) ? 'static page' : 'latest posts',
				'logo'           => AISA_Generator::site_logo_url(),
				'aioseo_pro'     => AISA_AIOSEO_Bridge::is_pro(),
				'mode'           => AISA_Settings::get( 'mode' ),
				'business_notes' => AISA_Settings::get( 'business_notes' ),
				'profile'        => AISA_Generator::profile(),
			],
			'total'   => $total,
			'offset'  => $offset,
			'items'   => $items,
			'import_format' => self::format_help(),
		];
	}

	/**
	 * Describes the import format inside every export, so whoever writes the SEO knows
	 * exactly what to send back.
	 *
	 * @return array
	 */
	public static function format_help() {
		return [
			'format'        => 'aisa-import/1',
			'profile'       => 'Optional. Same keys as site.profile: site_represents (organization|person), name, description, business_type (schema.org type), phone, email, founding_date, address {street, city, region, postal_code, country}, area_served, price_range, home_title, home_description, primary_keyphrase, voice, logo, social {facebook, twitter, instagram, tiktok, pinterest, youtube, linkedin, yelp, wikipedia, google_places, threads, bluesky}. Use "" for unknown; never invent contact details.',
			'apply_profile' => 'true to save the profile into AIOSEO now; false to store it for review.',
			'apply'         => 'true to write items into AIOSEO now; false (recommended) to store them for review on the Autopilot tab.',
			'items'         => '[{type:"post"|"term", id, title (<=60 chars), description (140-155 chars), focus_keyphrase, additional_keyphrases [] (Pro only), og_title, og_description, schema: {page_type: WebPage|AboutPage|ContactPage|CollectionPage|FAQPage|ItemPage|ProfilePage|CheckoutPage|SearchResultsPage|MedicalWebPage, article_type: none|Article|BlogPosting|NewsArticle, service: null or {name, service_type, description, area_served}, faqs: [{question, answer}] only if written on the page}}]. Terms only use title and description.',
		];
	}

	/**
	 * Stores (and optionally applies) SEO written elsewhere.
	 *
	 * @param array $payload Decoded import JSON.
	 * @return array Report.
	 */
	public static function import( $payload ) {
		$report = [
			'profile' => null,
			'items'   => [],
		];

		if ( ! empty( $payload['profile'] ) && is_array( $payload['profile'] ) ) {
			$profile = AISA_Generator::sanitize_profile( $payload['profile'] );
			if ( '' === $profile['logo'] ) {
				$profile['logo'] = AISA_Generator::site_logo_url();
			}
			if ( ! empty( $payload['apply_profile'] ) ) {
				$report['profile'] = AISA_Jobs::apply_profile( $profile );
			} else {
				update_option( AISA_Generator::PROFILE_OPTION, $profile, false );
				$report['profile'] = 'saved for review on the Site profile tab';
			}
		}

		foreach ( (array) ( isset( $payload['items'] ) ? $payload['items'] : [] ) as $item ) {
			$type = isset( $item['type'] ) && 'term' === $item['type'] ? 'term' : 'post';
			$id   = isset( $item['id'] ) ? absint( $item['id'] ) : 0;
			$row  = [
				'type' => $type,
				'id'   => $id,
			];

			$exists = 'term' === $type ? ( $id && get_term( $id ) && ! is_wp_error( get_term( $id ) ) ) : ( $id && get_post( $id ) );
			$can    = 'term' === $type ? current_user_can( 'edit_term', $id ) : current_user_can( 'edit_post', $id );
			if ( ! $exists || ! $can ) {
				$row['result']        = 'error: not found or not editable';
				$report['items'][] = $row;
				continue;
			}

			$result = self::normalize_item( $item, $type );
			AISA_Jobs::store_proposal( $type, $id, $result, 'import' );
			$row['result'] = 'stored';

			if ( ! empty( $payload['apply'] ) ) {
				$applied       = AISA_Jobs::apply( $type, $id );
				$row['result'] = is_wp_error( $applied ) ? 'error: ' . $applied->get_error_message() : 'applied';
			}
			$report['items'][] = $row;
		}

		return $report;
	}

	/**
	 * Turns one imported item into the stored proposal shape.
	 *
	 * @param array  $item Item.
	 * @param string $type "post" or "term".
	 * @return array
	 */
	private static function normalize_item( $item, $type ) {
		$schema = isset( $item['schema'] ) && is_array( $item['schema'] ) ? $item['schema'] : [];
		if ( isset( $schema['service'] ) && is_array( $schema['service'] ) && ! isset( $schema['service']['include'] ) ) {
			$schema['service']['include'] = ! empty( $schema['service']['name'] );
		}
		$item['schema'] = $schema;

		$result = AISA_Generator::sanitize_page_result( $item );
		// Keep lengths inside what search engines show, the same way token saver does.
		$result['fields']['title']       = AISA_Generator::fit( $result['fields']['title'], 60 );
		$result['fields']['description'] = AISA_Generator::fit( $result['fields']['description'], 160 );
		$result['warnings']              = [];

		if ( 'term' === $type ) {
			$result['fields'] = array_intersect_key( $result['fields'], array_flip( [ 'title', 'description' ] ) );
			$result['schema'] = null;
		}

		// Blank fields in the file mean "no suggestion", not "clear this field".
		$result['fields'] = array_filter(
			$result['fields'],
			function ( $v ) {
				return is_array( $v ) ? ! empty( $v ) : '' !== $v;
			}
		);
		return $result;
	}
}
