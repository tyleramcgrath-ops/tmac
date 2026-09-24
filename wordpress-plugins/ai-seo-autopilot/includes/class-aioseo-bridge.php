<?php
/**
 * The only place that knows about All in One SEO.
 *
 * Detects AIOSEO (Lite or Pro), picks a working adapter, verifies every write by reading
 * it back, and falls through to the next adapter if one stops working after an update.
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AISA_AIOSEO_Bridge {
	const COMPAT_OPTION = 'aisa_compat';

	/**
	 * Adapter instances, cached per request.
	 *
	 * @var AISA_Adapter[]|null
	 */
	private static $adapters = null;

	/**
	 * Whether AIOSEO is loaded.
	 *
	 * @return bool
	 */
	public static function is_active() {
		return function_exists( 'aioseo' ) && defined( 'AIOSEO_VERSION' );
	}

	/**
	 * Installed AIOSEO version, or '' when it is not active.
	 *
	 * @return string
	 */
	public static function version() {
		return defined( 'AIOSEO_VERSION' ) ? (string) AIOSEO_VERSION : '';
	}

	/**
	 * Whether AIOSEO Pro is running.
	 *
	 * @return bool
	 */
	public static function is_pro() {
		if ( ! self::is_active() ) {
			return false;
		}
		try {
			$aioseo = aioseo();
			return ! empty( $aioseo->pro );
		} catch ( \Throwable $e ) {
			return false;
		}
	}

	/**
	 * Registered adapters in priority order. Add-on "fix" plugins can prepend their own.
	 *
	 * @return AISA_Adapter[]
	 */
	public static function adapters() {
		if ( null === self::$adapters ) {
			$list = apply_filters(
				'aisa_adapters',
				[
					new AISA_Adapter_Abilities(),
					new AISA_Adapter_Service(),
					new AISA_Adapter_Model(),
				]
			);
			self::$adapters = array_values(
				array_filter(
					(array) $list,
					function ( $a ) {
						return $a instanceof AISA_Adapter;
					}
				)
			);
		}
		return self::$adapters;
	}

	/**
	 * Clears cached adapters (used by tests and after a version change).
	 */
	public static function reset() {
		self::$adapters = null;
	}

	/**
	 * Adapters whose AIOSEO surface exists, preferred (last verified) one first.
	 *
	 * @return AISA_Adapter[]
	 */
	public static function available_adapters() {
		if ( ! self::is_active() ) {
			return [];
		}
		$available = [];
		foreach ( self::adapters() as $adapter ) {
			try {
				if ( $adapter->is_available() ) {
					$available[] = $adapter;
				}
			} catch ( \Throwable $e ) {
				continue;
			}
		}

		$compat    = self::compat();
		$preferred = isset( $compat['adapter'] ) ? $compat['adapter'] : '';
		$broken    = isset( $compat['broken'] ) ? (array) $compat['broken'] : [];

		usort(
			$available,
			function ( $a, $b ) use ( $preferred, $broken ) {
				$score = function ( $x ) use ( $preferred, $broken ) {
					if ( $x->id() === $preferred ) {
						return 0;
					}
					return in_array( $x->id(), $broken, true ) ? 2 : 1;
				};
				return $score( $a ) - $score( $b );
			}
		);

		return $available;
	}

	/**
	 * Stored compatibility state from the last self-test or write.
	 *
	 * @return array
	 */
	public static function compat() {
		$c = get_option( self::COMPAT_OPTION, [] );
		return is_array( $c ) ? $c : [];
	}

	/**
	 * Updates compatibility state.
	 *
	 * @param array $changes Keys to merge.
	 */
	public static function update_compat( $changes ) {
		update_option( self::COMPAT_OPTION, array_merge( self::compat(), $changes ), false );
	}

	/**
	 * Current SEO fields for a post.
	 *
	 * @param int $post_id Post ID.
	 * @return array|WP_Error
	 */
	public static function read( $post_id ) {
		$last = new WP_Error( 'aisa_no_adapter', __( 'All in One SEO is not active, or none of its supported interfaces were found.', 'ai-seo-autopilot' ) );
		foreach ( self::available_adapters() as $adapter ) {
			try {
				$out = $adapter->read( $post_id );
			} catch ( \Throwable $e ) {
				$out = new WP_Error( 'aisa_exception', $e->getMessage() );
			}
			if ( ! is_wp_error( $out ) ) {
				return $out;
			}
			$last = $out;
		}
		return $last;
	}

	/**
	 * Writes fields and proves they landed by reading them back. If an adapter fails or
	 * the values do not stick, the next adapter is tried and the broken one is recorded.
	 *
	 * @param int   $post_id Post ID.
	 * @param array $fields  Normalized fields.
	 * @return array|WP_Error ['adapter' => id] on success.
	 */
	public static function write( $post_id, $fields ) {
		$fields = self::strip_unsupported( $fields );
		if ( empty( $fields ) ) {
			return [ 'adapter' => 'none' ];
		}

		$errors = [];
		foreach ( self::available_adapters() as $adapter ) {
			try {
				$result = $adapter->write( $post_id, $fields );
				if ( ! is_wp_error( $result ) ) {
					$result = self::verify( $adapter, $post_id, $fields );
				}
			} catch ( \Throwable $e ) {
				$result = new WP_Error( 'aisa_exception', $e->getMessage() );
			}

			// A permissions problem is about the current user, not AIOSEO: stop and report it.
			if ( is_wp_error( $result ) && self::is_permission_error( $result ) ) {
				return $result;
			}

			if ( ! is_wp_error( $result ) ) {
				$compat = self::compat();
				if ( ! isset( $compat['adapter'] ) || $compat['adapter'] !== $adapter->id() ) {
					self::update_compat( [ 'adapter' => $adapter->id() ] );
				}
				return [ 'adapter' => $adapter->id() ];
			}

			$errors[] = $adapter->id() . ': ' . $result->get_error_message();
			self::mark_broken( $adapter->id(), $result->get_error_message() );
		}

		if ( empty( $errors ) ) {
			return new WP_Error( 'aisa_no_adapter', __( 'All in One SEO is not active, or none of its supported interfaces were found.', 'ai-seo-autopilot' ) );
		}

		return new WP_Error(
			'aisa_write_failed',
			sprintf(
				/* translators: %s: error details */
				__( 'Could not save to All in One SEO. Open the Health tab and copy the diagnostic report. Details: %s', 'ai-seo-autopilot' ),
				implode( ' | ', $errors )
			)
		);
	}

	/**
	 * Reads back through the same adapter and compares what matters.
	 *
	 * @param AISA_Adapter $adapter Adapter.
	 * @param int          $post_id Post ID.
	 * @param array        $fields  What was written.
	 * @return true|WP_Error
	 */
	private static function verify( $adapter, $post_id, $fields ) {
		$now = $adapter->read( $post_id );
		if ( is_wp_error( $now ) ) {
			return $now;
		}
		foreach ( [ 'title', 'description', 'focus_keyphrase', 'og_title', 'og_description' ] as $key ) {
			if ( ! array_key_exists( $key, $fields ) || null === $fields[ $key ] ) {
				continue;
			}
			if ( self::normalize( $fields[ $key ] ) !== self::normalize( isset( $now[ $key ] ) ? $now[ $key ] : '' ) ) {
				return new WP_Error(
					'aisa_verify_failed',
					sprintf( 'Field "%s" did not persist (wrote "%s", read "%s").', $key, $fields[ $key ], isset( $now[ $key ] ) ? (string) $now[ $key ] : '' )
				);
			}
		}
		return true;
	}

	/**
	 * Comparison form of a value: decoded, sanitized, whitespace-collapsed.
	 *
	 * @param mixed $value Value.
	 * @return string
	 */
	public static function normalize( $value ) {
		$value = html_entity_decode( (string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		$value = sanitize_text_field( $value );
		return trim( preg_replace( '/\s+/u', ' ', $value ) );
	}

	/**
	 * Creates AIOSEO's row for a post that has never been saved through AIOSEO's editor
	 * (common for content created before AIOSEO was installed, or by page builders).
	 * AIOSEO's own services answer "Post not found" until that row exists.
	 *
	 * @param int $post_id Post ID.
	 * @return bool Whether a row now exists.
	 */
	public static function prime_row( $post_id ) {
		$class = '\AIOSEO\Plugin\Common\Models\Post';
		if ( ! get_post( $post_id ) || ! class_exists( $class ) || ! method_exists( $class, 'getPost' ) || ! method_exists( $class, 'savePost' ) ) {
			return false;
		}
		try {
			if ( $class::getPost( $post_id )->exists() ) {
				return true;
			}
			// A patch that sets nothing: AIOSEO saves its defaults and creates the row.
			$class::savePost( $post_id, [ 'title' => null ] );
			return $class::getPost( $post_id )->exists();
		} catch ( \Throwable $e ) {
			return false;
		}
	}

	/**
	 * Whether an error means "this user may not do that".
	 *
	 * @param WP_Error $error Error.
	 * @return bool
	 */
	public static function is_permission_error( $error ) {
		return in_array( $error->get_error_code(), [ 'forbidden', 'rest_forbidden', 'ability_invalid_permissions' ], true );
	}

	/**
	 * Records an adapter failure for the Health tab.
	 *
	 * @param string $id      Adapter ID.
	 * @param string $message Error.
	 */
	private static function mark_broken( $id, $message ) {
		$compat           = self::compat();
		$broken           = isset( $compat['broken'] ) ? (array) $compat['broken'] : [];
		$broken[]         = $id;
		$errors           = isset( $compat['errors'] ) ? (array) $compat['errors'] : [];
		$errors[ $id ]    = gmdate( 'c' ) . ' ' . $message;
		$changes          = [
			'broken' => array_values( array_unique( $broken ) ),
			'errors' => $errors,
		];
		if ( isset( $compat['adapter'] ) && $compat['adapter'] === $id ) {
			$changes['adapter'] = '';
		}
		self::update_compat( $changes );
	}

	/**
	 * Drops fields the installed edition cannot use.
	 *
	 * @param array $fields Normalized fields.
	 * @return array
	 */
	public static function strip_unsupported( $fields ) {
		if ( ! self::is_pro() ) {
			unset( $fields['additional_keyphrases'] );
		}
		return $fields;
	}

	/* ---------------------------------------------------------------------
	 * Site-wide settings (knowledge graph, homepage, social profiles).
	 * ------------------------------------------------------------------- */

	/**
	 * Map of site profile keys to AIOSEO option paths. Filterable so a fix add-on can
	 * repoint a path if AIOSEO renames a setting.
	 *
	 * @return array<string,string>
	 */
	public static function site_option_map() {
		return apply_filters(
			'aisa_site_option_map',
			[
				'site_represents'          => 'searchAppearance.global.schema.siteRepresents',
				'organization_name'        => 'searchAppearance.global.schema.organizationName',
				'organization_description' => 'searchAppearance.global.schema.organizationDescription',
				'organization_logo'        => 'searchAppearance.global.schema.organizationLogo',
				'person_name'              => 'searchAppearance.global.schema.personName',
				'person_logo'              => 'searchAppearance.global.schema.personLogo',
				'phone'                    => 'searchAppearance.global.schema.phone',
				'email'                    => 'searchAppearance.global.schema.email',
				'founding_date'            => 'searchAppearance.global.schema.foundingDate',
				'home_title'               => 'searchAppearance.global.siteTitle',
				'home_description'         => 'searchAppearance.global.metaDescription',
				'facebook'                 => 'social.profiles.urls.facebookPageUrl',
				'twitter'                  => 'social.profiles.urls.twitterUrl',
				'instagram'                => 'social.profiles.urls.instagramUrl',
				'tiktok'                   => 'social.profiles.urls.tiktokUrl',
				'pinterest'                => 'social.profiles.urls.pinterestUrl',
				'youtube'                  => 'social.profiles.urls.youtubeUrl',
				'linkedin'                 => 'social.profiles.urls.linkedinUrl',
				'yelp'                     => 'social.profiles.urls.yelpPageUrl',
				'wikipedia'                => 'social.profiles.urls.wikipediaUrl',
				'google_places'            => 'social.profiles.urls.googlePlacesUrl',
				'threads'                  => 'social.profiles.urls.threadsUrl',
				'bluesky'                  => 'social.profiles.urls.blueskyUrl',
			]
		);
	}

	/**
	 * Reads one AIOSEO option by dotted path.
	 *
	 * @param string $path Dotted path.
	 * @return mixed|WP_Error
	 */
	public static function get_option_path( $path ) {
		if ( ! self::is_active() ) {
			return new WP_Error( 'aisa_inactive', 'AIOSEO is not active.' );
		}
		try {
			$parts = explode( '.', $path );
			$last  = array_pop( $parts );
			$node  = aioseo()->options;
			foreach ( $parts as $part ) {
				$node = $node->$part;
			}
			if ( method_exists( $node, 'has' ) && ! $node->has( $last ) ) {
				return new WP_Error( 'aisa_option_missing', 'AIOSEO option not found: ' . $path );
			}
			$node = aioseo()->options;
			foreach ( $parts as $part ) {
				$node = $node->$part;
			}
			return $node->$last;
		} catch ( \Throwable $e ) {
			return new WP_Error( 'aisa_option_error', $e->getMessage() );
		}
	}

	/**
	 * Writes one AIOSEO option by dotted path and confirms it stuck.
	 *
	 * @param string $path  Dotted path.
	 * @param string $value Value.
	 * @return true|WP_Error
	 */
	public static function set_option_path( $path, $value ) {
		$before = self::get_option_path( $path );
		if ( is_wp_error( $before ) ) {
			return $before;
		}
		try {
			$parts = explode( '.', $path );
			$last  = array_pop( $parts );
			$node  = aioseo()->options;
			foreach ( $parts as $part ) {
				$node = $node->$part;
			}
			$node->$last = $value;
		} catch ( \Throwable $e ) {
			return new WP_Error( 'aisa_option_error', $e->getMessage() );
		}

		$after = self::get_option_path( $path );
		if ( is_wp_error( $after ) ) {
			return $after;
		}
		if ( self::normalize( $after ) !== self::normalize( $value ) ) {
			return new WP_Error( 'aisa_option_verify', sprintf( 'AIOSEO option %s did not keep the new value.', $path ) );
		}
		return true;
	}

	/* ---------------------------------------------------------------------
	 * Taxonomy terms (AIOSEO Pro only).
	 * ------------------------------------------------------------------- */

	/**
	 * Term SEO abilities, when AIOSEO Pro registers them.
	 *
	 * @return array{get:?object,update:?object,id_key:string}|null
	 */
	private static function term_abilities() {
		if ( ! self::is_pro() || ! function_exists( 'wp_get_ability' ) ) {
			return null;
		}
		$names = apply_filters(
			'aisa_term_ability_names',
			[
				'get'    => 'aioseo-terms/seo-data-get',
				'update' => 'aioseo-terms/seo-data-update',
			]
		);
		$get    = wp_get_ability( $names['get'] );
		$update = wp_get_ability( $names['update'] );
		if ( ! $update ) {
			return null;
		}
		$schema = method_exists( $update, 'get_input_schema' ) ? $update->get_input_schema() : [];
		$props  = isset( $schema['properties'] ) ? (array) $schema['properties'] : [];
		$id_key = '';
		foreach ( [ 'termId', 'term_id', 'id' ] as $candidate ) {
			if ( isset( $props[ $candidate ] ) ) {
				$id_key = $candidate;
				break;
			}
		}
		if ( '' === $id_key || ! isset( $props['title'], $props['description'] ) ) {
			return null;
		}
		return [
			'get'    => $get,
			'update' => $update,
			'id_key' => $id_key,
			'props'  => $props,
		];
	}

	/**
	 * Whether category/tag SEO can be written.
	 *
	 * @return bool
	 */
	public static function supports_terms() {
		return null !== self::term_abilities();
	}

	/**
	 * Reads a term's title/description.
	 *
	 * @param int $term_id Term ID.
	 * @return array|WP_Error
	 */
	public static function read_term( $term_id ) {
		$ab = self::term_abilities();
		if ( ! $ab || ! $ab['get'] ) {
			return new WP_Error( 'aisa_terms_unsupported', __( 'Category and tag SEO requires AIOSEO Pro.', 'ai-seo-autopilot' ) );
		}
		$out = $ab['get']->execute( [ $ab['id_key'] => (int) $term_id ] );
		if ( is_wp_error( $out ) ) {
			return $out;
		}
		return AISA_Adapter_Abilities::normalize_snapshot( is_array( $out ) ? $out : [] );
	}

	/**
	 * Writes a term's title/description.
	 *
	 * @param int   $term_id Term ID.
	 * @param array $fields  Normalized fields (title, description used).
	 * @return array|WP_Error
	 */
	public static function write_term( $term_id, $fields ) {
		$ab = self::term_abilities();
		if ( ! $ab ) {
			return new WP_Error( 'aisa_terms_unsupported', __( 'Category and tag SEO requires AIOSEO Pro.', 'ai-seo-autopilot' ) );
		}
		$input = [ $ab['id_key'] => (int) $term_id ];
		foreach ( [ 'title', 'description' ] as $key ) {
			if ( array_key_exists( $key, $fields ) ) {
				$input[ $key ] = $fields[ $key ];
			}
		}
		$out = $ab['update']->execute( $input );
		return is_wp_error( $out ) ? $out : [ 'adapter' => 'abilities-terms' ];
	}
}
