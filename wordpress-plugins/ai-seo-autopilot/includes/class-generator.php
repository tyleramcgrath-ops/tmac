<?php
/**
 * Builds the prompts and validates what Claude returns.
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AISA_Generator {
	const PROFILE_OPTION = 'aisa_site_profile';

	const PAGE_TYPES    = [ 'WebPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'FAQPage', 'ItemPage', 'ProfilePage', 'CheckoutPage', 'SearchResultsPage', 'MedicalWebPage' ];
	const ARTICLE_TYPES = [ 'none', 'Article', 'BlogPosting', 'NewsArticle' ];

	const SOCIAL_KEYS = [ 'facebook', 'twitter', 'instagram', 'tiktok', 'pinterest', 'youtube', 'linkedin', 'yelp', 'wikipedia', 'google_places', 'threads', 'bluesky' ];

	/* ---------------------------------------------------------------------
	 * Site profile
	 * ------------------------------------------------------------------- */

	/**
	 * Saved site profile (the business facts every page prompt uses).
	 *
	 * @return array
	 */
	public static function profile() {
		$p = get_option( self::PROFILE_OPTION, [] );
		return is_array( $p ) ? $p : [];
	}

	/**
	 * Asks Claude to work out who the site belongs to.
	 *
	 * @return array|WP_Error Proposed profile (not saved).
	 */
	public static function generate_profile() {
		$home_url  = home_url( '/' );
		$home_html = self::fetch_html( $home_url );
		$sections  = [];

		$sections[] = "Site name: " . get_bloginfo( 'name' );
		$sections[] = "Tagline: " . get_bloginfo( 'description' );
		$sections[] = "URL: " . $home_url;
		$sections[] = "Language: " . self::language();

		$notes = trim( (string) AISA_Settings::get( 'business_notes' ) );
		if ( '' !== $notes ) {
			$sections[] = "Owner's notes about the business (authoritative):\n" . $notes;
		}

		$links = self::social_links_in( $home_html );
		if ( $links ) {
			$sections[] = "Social profile links found on the homepage:\n" . implode( "\n", $links );
		}

		$contact_bits = self::contact_bits_in( $home_html );
		if ( $contact_bits ) {
			$sections[] = "Phone numbers and emails linked on the homepage:\n" . implode( "\n", $contact_bits );
		}

		$saver      = AISA_Settings::token_saver();
		$sections[] = "Homepage text:\n" . self::truncate( AISA_Content_Extractor::clean_html( self::main_html( $home_html ) ), $saver ? 5000 : 12000 );

		foreach ( self::key_pages() as $page ) {
			$text       = AISA_Content_Extractor::for_post( $page );
			$sections[] = sprintf( "Page \"%s\" (%s):\n%s", $page->post_title, get_permalink( $page ), self::truncate( $text['text'], $saver ? 2500 : 6000 ) );
		}

		$sections[] = "Titles of other published pages:\n" . implode( "\n", self::page_titles( $saver ? 25 : 60 ) );

		$system = self::system_prompt() . "\n\nYou are now building the site profile: the facts about the business behind this website. "
			. 'Use only facts stated in the material. Leave a field as an empty string when the material does not state it. '
			. 'Never invent phone numbers, emails, addresses, founding dates or social URLs. '
			. 'business_type must be the most specific schema.org Organization or LocalBusiness subtype that fits (for example Plumber, Dentist, LegalService, RealEstateAgent, Restaurant, OnlineStore, ProfessionalService, Organization). '
			. 'home_title is the homepage SEO title: at most 60 characters, main service and location first when it is a local business, brand name at the end. '
			. 'home_description is 140 to 155 characters, specific, and ends with a reason to click. '
			. 'voice is one or two sentences describing how the brand writes and who it speaks to, for other writers to follow.';

		$out = AISA_Claude_Client::json( $system, implode( "\n\n---\n\n", $sections ), self::profile_schema() );
		if ( is_wp_error( $out ) ) {
			return $out;
		}

		$out = self::sanitize_profile( $out );

		// The logo is a fact WordPress already knows; prefer it over anything guessed.
		$logo = self::site_logo_url();
		if ( $logo ) {
			$out['logo'] = $logo;
		}

		return $out;
	}

	/**
	 * JSON schema for the site profile.
	 *
	 * @return array
	 */
	public static function profile_schema() {
		$str    = [ 'type' => 'string' ];
		$social = [];
		foreach ( self::SOCIAL_KEYS as $k ) {
			$social[ $k ] = $str;
		}
		return [
			'type'                 => 'object',
			'additionalProperties' => false,
			'required'             => [ 'site_represents', 'name', 'description', 'business_type', 'phone', 'email', 'founding_date', 'address', 'area_served', 'price_range', 'home_title', 'home_description', 'primary_keyphrase', 'voice', 'social' ],
			'properties'           => [
				'site_represents'   => [
					'type' => 'string',
					'enum' => [ 'organization', 'person' ],
				],
				'name'              => $str,
				'description'       => $str,
				'business_type'     => $str,
				'phone'             => $str,
				'email'             => $str,
				'founding_date'     => $str,
				'address'           => [
					'type'                 => 'object',
					'additionalProperties' => false,
					'required'             => [ 'street', 'city', 'region', 'postal_code', 'country' ],
					'properties'           => [
						'street'      => $str,
						'city'        => $str,
						'region'      => $str,
						'postal_code' => $str,
						'country'     => $str,
					],
				],
				'area_served'       => $str,
				'price_range'       => $str,
				'home_title'        => $str,
				'home_description'  => $str,
				'primary_keyphrase' => $str,
				'voice'             => $str,
				'social'            => [
					'type'                 => 'object',
					'additionalProperties' => false,
					'required'             => self::SOCIAL_KEYS,
					'properties'           => $social,
				],
			],
		];
	}

	/**
	 * Cleans a profile from Claude or from the edit form.
	 *
	 * @param array $in Raw profile.
	 * @return array
	 */
	public static function sanitize_profile( $in ) {
		$t   = function ( $k, $src = null ) use ( $in ) {
			$src = null === $src ? $in : $src;
			return isset( $src[ $k ] ) ? trim( sanitize_text_field( (string) $src[ $k ] ) ) : '';
		};
		$out = [
			'site_represents'   => 'person' === $t( 'site_represents' ) ? 'person' : 'organization',
			'name'              => $t( 'name' ),
			'description'       => $t( 'description' ),
			'business_type'     => preg_replace( '/[^A-Za-z]/', '', $t( 'business_type' ) ),
			'phone'             => $t( 'phone' ),
			'email'             => sanitize_email( $t( 'email' ) ),
			'founding_date'     => $t( 'founding_date' ),
			'area_served'       => $t( 'area_served' ),
			'price_range'       => $t( 'price_range' ),
			'home_title'        => $t( 'home_title' ),
			'home_description'  => $t( 'home_description' ),
			'primary_keyphrase' => $t( 'primary_keyphrase' ),
			'voice'             => $t( 'voice' ),
			'logo'              => isset( $in['logo'] ) ? esc_url_raw( (string) $in['logo'] ) : '',
			'address'           => [],
			'social'            => [],
		];
		$addr = isset( $in['address'] ) && is_array( $in['address'] ) ? $in['address'] : [];
		foreach ( [ 'street', 'city', 'region', 'postal_code', 'country' ] as $k ) {
			$out['address'][ $k ] = $t( $k, $addr );
		}
		$social = isset( $in['social'] ) && is_array( $in['social'] ) ? $in['social'] : [];
		foreach ( self::SOCIAL_KEYS as $k ) {
			$url                 = isset( $social[ $k ] ) ? esc_url_raw( trim( (string) $social[ $k ] ) ) : '';
			$out['social'][ $k ] = $url;
		}
		return $out;
	}

	/* ---------------------------------------------------------------------
	 * Per-page generation
	 * ------------------------------------------------------------------- */

	/**
	 * Generates SEO fields and schema for one post.
	 *
	 * @param WP_Post $post Post.
	 * @return array|WP_Error ['fields' => [...], 'schema' => [...], 'warnings' => []]
	 */
	public static function generate_post( $post ) {
		$content = AISA_Content_Extractor::for_post( $post );
		$profile = self::profile();

		$is_front = (int) get_option( 'page_on_front' ) === (int) $post->ID && 'page' === get_option( 'show_on_front' );

		$lines   = [];
		$lines[] = 'Page title: ' . $post->post_title;
		$lines[] = 'URL: ' . get_permalink( $post );
		$lines[] = 'Content type: ' . $post->post_type . ( $is_front ? ' (this is the homepage)' : '' );
		if ( 'post' === $post->post_type ) {
			$cats = wp_get_post_categories( $post->ID, [ 'fields' => 'names' ] );
			if ( $cats ) {
				$lines[] = 'Categories: ' . implode( ', ', $cats );
			}
		}
		if ( $post->post_excerpt ) {
			$lines[] = 'Excerpt: ' . wp_strip_all_tags( $post->post_excerpt );
		}
		if ( $content['truncated'] ) {
			$lines[] = '(Page text below is the first ' . AISA_Content_Extractor::max_chars() . ' characters of a longer page.)';
		}
		$lines[] = "Page text:\n" . ( '' !== $content['text'] ? $content['text'] : '(no readable text found)' );

		$system = self::system_prompt() . "\n\n" . self::profile_brief( $profile ) . "\n\n" . self::page_rules( AISA_AIOSEO_Bridge::is_pro() );

		$out = AISA_Claude_Client::json( $system, implode( "\n", $lines ), self::page_schema() );
		if ( is_wp_error( $out ) ) {
			return $out;
		}

		$problems = AISA_Settings::token_saver() ? [] : self::length_problems( $out );
		if ( $problems ) {
			// One corrective pass keeps quality high without looping on cost.
			$retry = AISA_Claude_Client::json(
				$system,
				implode( "\n", $lines ) . "\n\nA previous draft had these problems, fix them:\n- " . implode( "\n- ", $problems ) . "\nPrevious draft:\n" . wp_json_encode( $out ),
				self::page_schema()
			);
			if ( ! is_wp_error( $retry ) ) {
				$out = $retry;
			}
		}

		$result = self::sanitize_page_result( $out );
		if ( AISA_Settings::token_saver() ) {
			// Instead of a second request, shorten anything over the limit at a word boundary.
			$result['fields']['title']       = self::fit( $result['fields']['title'], 60 );
			$result['fields']['description'] = self::fit( $result['fields']['description'], 158 );
			$result['warnings']              = [];
		}
		return $result;
	}

	/**
	 * Shortens text to a maximum length at a word boundary, dropping a dangling separator.
	 *
	 * @param string $text Text.
	 * @param int    $max  Max characters.
	 * @return string
	 */
	public static function fit( $text, $max ) {
		if ( mb_strlen( $text ) <= $max ) {
			return $text;
		}
		// Too long with the brand suffix: drop the suffix first.
		if ( preg_match( '/^(.*)\s+[|\-–—]\s+[^|\-–—]+$/u', $text, $m ) && mb_strlen( $m[1] ) <= $max ) {
			return $m[1];
		}
		$cut = mb_substr( $text, 0, $max + 1 );
		$pos = mb_strrpos( $cut, ' ' );
		$cut = false !== $pos && $pos > $max * 0.6 ? mb_substr( $cut, 0, $pos ) : mb_substr( $text, 0, $max );
		return rtrim( $cut, " \t,;:|-–—" );
	}

	/**
	 * JSON schema for one page.
	 *
	 * @return array
	 */
	public static function page_schema() {
		$str = [ 'type' => 'string' ];
		return [
			'type'                 => 'object',
			'additionalProperties' => false,
			'required'             => [ 'title', 'description', 'focus_keyphrase', 'additional_keyphrases', 'og_title', 'og_description', 'schema' ],
			'properties'           => [
				'title'                 => $str,
				'description'           => $str,
				'focus_keyphrase'       => $str,
				'additional_keyphrases' => [
					'type'  => 'array',
					'items' => $str,
				],
				'og_title'              => $str,
				'og_description'        => $str,
				'schema'                => [
					'type'                 => 'object',
					'additionalProperties' => false,
					'required'             => [ 'page_type', 'article_type', 'service', 'faqs' ],
					'properties'           => [
						'page_type'    => [
							'type' => 'string',
							'enum' => self::PAGE_TYPES,
						],
						'article_type' => [
							'type' => 'string',
							'enum' => self::ARTICLE_TYPES,
						],
						'service'      => [
							'type'                 => 'object',
							'additionalProperties' => false,
							'required'             => [ 'include', 'name', 'service_type', 'description', 'area_served' ],
							'properties'           => [
								'include'      => [ 'type' => 'boolean' ],
								'name'         => $str,
								'service_type' => $str,
								'description'  => $str,
								'area_served'  => $str,
							],
						],
						'faqs'         => [
							'type'  => 'array',
							'items' => [
								'type'                 => 'object',
								'additionalProperties' => false,
								'required'             => [ 'question', 'answer' ],
								'properties'           => [
									'question' => $str,
									'answer'   => $str,
								],
							],
						],
					],
				],
			],
		];
	}

	/**
	 * Rules for page-level output.
	 *
	 * @param bool $is_pro Whether AIOSEO Pro is active.
	 * @return string
	 */
	private static function page_rules( $is_pro ) {
		$rules = [
			'Write SEO metadata for the page below.',
			'title: 50 to 60 characters. Put the focus keyphrase (or a natural form of it) near the start. End with " | " and the brand name only when it still fits in 60 characters. Unique to this page, no clickbait, no ALL CAPS, no quotation marks, no emoji.',
			'description: 140 to 155 characters. Include the focus keyphrase naturally, say specifically what the page offers, and end with a reason to click. No quotation marks.',
			'focus_keyphrase: the 2 to 5 word search phrase this page is best placed to rank for, based on what the page actually covers. Lowercase unless a proper noun.',
			$is_pro
				? 'additional_keyphrases: 2 or 3 closely related phrases the page also covers.'
				: 'additional_keyphrases: return an empty array.',
			'og_title: an engaging social-share headline for this page, at most 70 characters, without the brand suffix.',
			'og_description: a social-share summary, 100 to 200 characters.',
			'schema.page_type: the schema.org WebPage type that describes the page. Use AboutPage, ContactPage, FAQPage, CollectionPage (listings/archives), ItemPage (single product or listing), ProfilePage (a person/team member), CheckoutPage, SearchResultsPage or MedicalWebPage only when clearly right; otherwise WebPage.',
			'schema.article_type: BlogPosting for blog posts, NewsArticle for news reporting, Article for other editorial articles, none for everything else (service pages, landing pages, contact pages).',
			'schema.service: set include to true only when the page presents a specific service the business sells; then give its name, the general service_type, a one-sentence description, and area_served when the page or profile states one. Otherwise include=false and empty strings.',
			'schema.faqs: only question-and-answer pairs that are written on the page itself, copied faithfully (answers may be shortened). Never invent FAQs. Empty array when the page has none.',
			'Write in the same language as the page.',
		];
		return implode( "\n", $rules );
	}

	/**
	 * Shared system prompt.
	 *
	 * @return string
	 */
	private static function system_prompt() {
		return 'You are an expert technical SEO copywriter filling in metadata for a WordPress website. '
			. 'Your output goes straight into the site\'s SEO plugin, so it must be accurate to the page, specific rather than generic, and within the stated length limits. '
			. 'Write for people first: clear, benefit-led, and in the brand\'s voice. Preferred output language: ' . self::language() . '.';
	}

	/**
	 * Business context for page prompts.
	 *
	 * @param array $profile Site profile.
	 * @return string
	 */
	private static function profile_brief( $profile ) {
		$name = ! empty( $profile['name'] ) ? $profile['name'] : get_bloginfo( 'name' );
		$bits = [ 'Brand name: ' . $name ];
		foreach ( [
			'description'       => 'About the business',
			'business_type'     => 'Business type',
			'area_served'       => 'Area served',
			'primary_keyphrase' => 'Main site keyphrase',
			'voice'             => 'Brand voice',
		] as $key => $label ) {
			if ( ! empty( $profile[ $key ] ) ) {
				$bits[] = $label . ': ' . $profile[ $key ];
			}
		}
		if ( ! empty( $profile['address']['city'] ) ) {
			$bits[] = 'Location: ' . trim( $profile['address']['city'] . ', ' . $profile['address']['region'], ', ' );
		}
		$notes = trim( (string) AISA_Settings::get( 'business_notes' ) );
		if ( '' !== $notes ) {
			$bits[] = "Owner's notes: " . $notes;
		}
		return "Business context:\n" . implode( "\n", $bits );
	}

	/**
	 * Length checks worth one corrective retry.
	 *
	 * @param array $out Claude output.
	 * @return string[]
	 */
	private static function length_problems( $out ) {
		$p     = [];
		$title = isset( $out['title'] ) ? (string) $out['title'] : '';
		$desc  = isset( $out['description'] ) ? (string) $out['description'] : '';
		if ( mb_strlen( $title ) > 60 ) {
			$p[] = sprintf( 'title is %d characters; the maximum is 60.', mb_strlen( $title ) );
		}
		if ( mb_strlen( $title ) < 25 ) {
			$p[] = sprintf( 'title is only %d characters; aim for 50 to 60.', mb_strlen( $title ) );
		}
		if ( mb_strlen( $desc ) > 160 ) {
			$p[] = sprintf( 'description is %d characters; the maximum is 155.', mb_strlen( $desc ) );
		}
		if ( mb_strlen( $desc ) < 110 ) {
			$p[] = sprintf( 'description is only %d characters; aim for 140 to 155.', mb_strlen( $desc ) );
		}
		return $p;
	}

	/**
	 * Cleans Claude's page output into what gets stored.
	 *
	 * @param array $out Raw output.
	 * @return array
	 */
	public static function sanitize_page_result( $out ) {
		$s = function ( $v ) {
			return trim( preg_replace( '/\s+/u', ' ', sanitize_text_field( (string) $v ) ) );
		};

		$fields = [
			'title'                 => $s( isset( $out['title'] ) ? $out['title'] : '' ),
			'description'           => $s( isset( $out['description'] ) ? $out['description'] : '' ),
			'focus_keyphrase'       => $s( isset( $out['focus_keyphrase'] ) ? $out['focus_keyphrase'] : '' ),
			'additional_keyphrases' => array_values( array_filter( array_map( $s, isset( $out['additional_keyphrases'] ) ? (array) $out['additional_keyphrases'] : [] ) ) ),
			'og_title'              => $s( isset( $out['og_title'] ) ? $out['og_title'] : '' ),
			'og_description'        => $s( isset( $out['og_description'] ) ? $out['og_description'] : '' ),
		];
		$fields['additional_keyphrases'] = array_slice( $fields['additional_keyphrases'], 0, 3 );

		$schema_in = isset( $out['schema'] ) && is_array( $out['schema'] ) ? $out['schema'] : [];
		$schema    = [
			'page_type'    => isset( $schema_in['page_type'] ) && in_array( $schema_in['page_type'], self::PAGE_TYPES, true ) ? $schema_in['page_type'] : 'WebPage',
			'article_type' => isset( $schema_in['article_type'] ) && in_array( $schema_in['article_type'], self::ARTICLE_TYPES, true ) ? $schema_in['article_type'] : 'none',
			'service'      => null,
			'faqs'         => [],
		];
		if ( ! empty( $schema_in['service']['include'] ) && ! empty( $schema_in['service']['name'] ) ) {
			$schema['service'] = [
				'name'         => $s( $schema_in['service']['name'] ),
				'service_type' => $s( isset( $schema_in['service']['service_type'] ) ? $schema_in['service']['service_type'] : '' ),
				'description'  => $s( isset( $schema_in['service']['description'] ) ? $schema_in['service']['description'] : '' ),
				'area_served'  => $s( isset( $schema_in['service']['area_served'] ) ? $schema_in['service']['area_served'] : '' ),
			];
		}
		if ( ! empty( $schema_in['faqs'] ) && is_array( $schema_in['faqs'] ) ) {
			foreach ( array_slice( $schema_in['faqs'], 0, 20 ) as $faq ) {
				$q = $s( isset( $faq['question'] ) ? $faq['question'] : '' );
				$a = $s( isset( $faq['answer'] ) ? $faq['answer'] : '' );
				if ( '' !== $q && '' !== $a ) {
					$schema['faqs'][] = [
						'question' => $q,
						'answer'   => $a,
					];
				}
			}
		}

		$warnings = [];
		if ( mb_strlen( $fields['title'] ) > 60 ) {
			$warnings[] = sprintf( __( 'Title is %d characters (over 60).', 'ai-seo-autopilot' ), mb_strlen( $fields['title'] ) );
		}
		if ( mb_strlen( $fields['description'] ) > 160 ) {
			$warnings[] = sprintf( __( 'Description is %d characters (over 160).', 'ai-seo-autopilot' ), mb_strlen( $fields['description'] ) );
		}

		return [
			'fields'   => $fields,
			'schema'   => $schema,
			'warnings' => $warnings,
		];
	}

	/* ---------------------------------------------------------------------
	 * Taxonomy terms (Pro)
	 * ------------------------------------------------------------------- */

	/**
	 * Generates a title and description for a category/tag archive.
	 *
	 * @param WP_Term $term Term.
	 * @return array|WP_Error
	 */
	public static function generate_term( $term ) {
		$posts  = get_posts(
			[
				'post_type'      => 'any',
				'posts_per_page' => 15,
				'tax_query'      => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
					[
						'taxonomy' => $term->taxonomy,
						'terms'    => $term->term_id,
					],
				],
			]
		);
		$titles = wp_list_pluck( $posts, 'post_title' );
		$tax    = get_taxonomy( $term->taxonomy );

		$user = sprintf(
			"Archive page for the %s \"%s\".\nURL: %s\nDescription: %s\nItems listed on it include:\n- %s",
			$tax ? $tax->labels->singular_name : $term->taxonomy,
			$term->name,
			get_term_link( $term ),
			wp_strip_all_tags( $term->description ),
			implode( "\n- ", $titles )
		);

		$system = self::system_prompt() . "\n\n" . self::profile_brief( self::profile() ) . "\n\n"
			. "Write the SEO title (50 to 60 characters, brand at the end after \" | \" if it fits) and meta description (140 to 155 characters) for this archive page.";

		$schema = [
			'type'                 => 'object',
			'additionalProperties' => false,
			'required'             => [ 'title', 'description' ],
			'properties'           => [
				'title'       => [ 'type' => 'string' ],
				'description' => [ 'type' => 'string' ],
			],
		];

		$out = AISA_Claude_Client::json( $system, $user, $schema );
		if ( is_wp_error( $out ) ) {
			return $out;
		}
		return [
			'fields'   => [
				'title'       => sanitize_text_field( $out['title'] ),
				'description' => sanitize_text_field( $out['description'] ),
			],
			'schema'   => null,
			'warnings' => [],
		];
	}

	/* ---------------------------------------------------------------------
	 * Helpers
	 * ------------------------------------------------------------------- */

	/**
	 * Output language.
	 *
	 * @return string
	 */
	public static function language() {
		$lang = trim( (string) AISA_Settings::get( 'language' ) );
		return '' !== $lang ? $lang : get_locale();
	}

	/**
	 * About/contact/services pages, which carry most business facts.
	 *
	 * @return WP_Post[]
	 */
	private static function key_pages() {
		$found = [];
		foreach ( [ 'about', 'about-us', 'contact', 'contact-us', 'services', 'our-services' ] as $slug ) {
			$page = get_page_by_path( $slug );
			if ( $page && 'publish' === $page->post_status ) {
				$found[ $page->ID ] = $page;
			}
			if ( count( $found ) >= 3 ) {
				break;
			}
		}
		return array_values( $found );
	}

	/**
	 * Titles of published pages, for context.
	 *
	 * @param int $limit Max titles.
	 * @return string[]
	 */
	private static function page_titles( $limit ) {
		$pages = get_posts(
			[
				'post_type'      => 'page',
				'post_status'    => 'publish',
				'posts_per_page' => $limit,
				'orderby'        => 'menu_order',
				'order'          => 'ASC',
			]
		);
		return wp_list_pluck( $pages, 'post_title' );
	}

	/**
	 * Fetches a page's HTML.
	 *
	 * @param string $url URL.
	 * @return string
	 */
	private static function fetch_html( $url ) {
		$response = wp_remote_get(
			$url,
			[
				'timeout'   => 20,
				'sslverify' => apply_filters( 'https_local_ssl_verify', false ),
			]
		);
		if ( is_wp_error( $response ) ) {
			return '';
		}
		return (string) wp_remote_retrieve_body( $response );
	}

	/**
	 * The page body without head.
	 *
	 * @param string $html HTML.
	 * @return string
	 */
	private static function main_html( $html ) {
		if ( preg_match( '#<body\b[^>]*>(.*)</body>#is', $html, $m ) ) {
			return $m[1];
		}
		return $html;
	}

	/**
	 * Social profile URLs linked from a page.
	 *
	 * @param string $html HTML.
	 * @return string[]
	 */
	public static function social_links_in( $html ) {
		$domains = 'facebook\.com|x\.com|twitter\.com|instagram\.com|tiktok\.com|pinterest\.[a-z.]+|youtube\.com|linkedin\.com|yelp\.[a-z.]+|wikipedia\.org|threads\.net|bsky\.app|g\.page|maps\.app\.goo\.gl|google\.com/maps';
		preg_match_all( '#href=["\'](https?://(?:[a-z0-9-]+\.)*(?:' . $domains . ')[^"\'\s]*)["\']#i', (string) $html, $m );
		$links = array_unique( array_map( 'esc_url_raw', $m[1] ) );
		// Share buttons are not profiles.
		$links = array_filter(
			$links,
			function ( $u ) {
				return ! preg_match( '#/(sharer|share|intent|pin/create|shareArticle)#i', $u );
			}
		);
		return array_slice( array_values( $links ), 0, 20 );
	}

	/**
	 * tel: and mailto: links on a page.
	 *
	 * @param string $html HTML.
	 * @return string[]
	 */
	private static function contact_bits_in( $html ) {
		preg_match_all( '#href=["\'](tel:|mailto:)([^"\'?]+)#i', (string) $html, $m );
		$bits = [];
		foreach ( $m[2] as $i => $value ) {
			$bits[] = ( 'tel:' === strtolower( $m[1][ $i ] ) ? 'Phone: ' : 'Email: ' ) . sanitize_text_field( rawurldecode( $value ) );
		}
		return array_slice( array_values( array_unique( $bits ) ), 0, 10 );
	}

	/**
	 * The site logo (Customizer logo, else site icon).
	 *
	 * @return string
	 */
	public static function site_logo_url() {
		$id = (int) get_theme_mod( 'custom_logo' );
		if ( $id ) {
			$src = wp_get_attachment_image_url( $id, 'full' );
			if ( $src ) {
				return $src;
			}
		}
		$icon = get_site_icon_url( 512 );
		return $icon ? $icon : '';
	}

	/**
	 * Truncates text to a character budget.
	 *
	 * @param string $text Text.
	 * @param int    $max  Max characters.
	 * @return string
	 */
	private static function truncate( $text, $max ) {
		return mb_strlen( $text ) > $max ? mb_substr( $text, 0, $max ) . ' …' : $text;
	}
}
