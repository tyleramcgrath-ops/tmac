<?php
/**
 * Generate → review → apply → restore, for posts, terms and the site profile.
 *
 * Proposals and backups live in post/term meta owned by this plugin, so nothing is
 * written to AIOSEO until "apply", and every apply can be undone.
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AISA_Jobs {
	const META_PROPOSAL = '_aisa_proposal';
	const META_STATUS   = '_aisa_status';
	const META_ERROR    = '_aisa_error';
	const META_HISTORY  = '_aisa_history';
	const META_SCHEMA   = '_aisa_schema';
	const META_WRITTEN  = '_aisa_written';

	const SITE_BACKUP = 'aisa_site_backup';
	// Set when an imported profile is waiting to be saved into AIOSEO.
	const PROFILE_PENDING = 'aisa_site_profile_pending';
	const MAX_HISTORY = 5;

	/**
	 * Everything that can be optimized.
	 *
	 * @return array[] Items: type, id, title, subtype, url, status.
	 */
	public static function targets() {
		$items = [];
		// Intersect so a type saved earlier but now excluded (e.g. a builder template library) is skipped.
		$types = array_values( array_intersect( (array) AISA_Settings::get( 'post_types' ), array_keys( AISA_Settings::available_post_types() ) ) );
		if ( $types ) {
			$ids = get_posts(
				[
					'post_type'      => $types,
					'post_status'    => 'publish',
					'posts_per_page' => -1,
					'fields'         => 'ids',
					'orderby'        => 'menu_order date',
					'order'          => 'ASC',
				]
			);
			foreach ( $ids as $id ) {
				$items[] = self::describe( 'post', $id );
			}
		}

		if ( AISA_AIOSEO_Bridge::supports_terms() ) {
			$terms = get_terms(
				[
					'taxonomy'   => array_values( get_taxonomies( [ 'public' => true ] ) ),
					'hide_empty' => true,
				]
			);
			if ( ! is_wp_error( $terms ) ) {
				foreach ( $terms as $term ) {
					if ( 'post_format' === $term->taxonomy ) {
						continue;
					}
					$items[] = self::describe( 'term', $term->term_id );
				}
			}
		}

		return $items;
	}

	/**
	 * One row for the review table.
	 *
	 * @param string $type "post" or "term".
	 * @param int    $id   ID.
	 * @return array
	 */
	public static function describe( $type, $id ) {
		if ( 'term' === $type ) {
			$term = get_term( $id );
			$tax  = $term && ! is_wp_error( $term ) ? get_taxonomy( $term->taxonomy ) : null;
			return [
				'type'     => 'term',
				'id'       => (int) $id,
				'title'    => $term && ! is_wp_error( $term ) ? $term->name : '',
				'subtype'  => $tax ? $tax->labels->singular_name : '',
				'url'      => $term && ! is_wp_error( $term ) ? get_term_link( $term ) : '',
				'status'   => (string) get_term_meta( $id, self::META_STATUS, true ),
				'error'    => (string) get_term_meta( $id, self::META_ERROR, true ),
				'proposal' => self::get_proposal( 'term', $id ),
				'history'  => count( self::history( 'term', $id ) ),
			];
		}
		$post = get_post( $id );
		$pto  = $post ? get_post_type_object( $post->post_type ) : null;
		return [
			'type'     => 'post',
			'id'       => (int) $id,
			'title'    => $post ? get_the_title( $post ) : '',
			'subtype'  => $pto ? $pto->labels->singular_name : '',
			'url'      => $post ? get_permalink( $post ) : '',
			'status'   => (string) get_post_meta( $id, self::META_STATUS, true ),
			'error'    => (string) get_post_meta( $id, self::META_ERROR, true ),
			'proposal' => self::get_proposal( 'post', $id ),
			'history'  => count( self::history( 'post', $id ) ),
		];
	}

	/* ---------------------------------------------------------------------
	 * Meta helpers (posts and terms share one code path).
	 * ------------------------------------------------------------------- */

	private static function meta_get( $type, $id, $key ) {
		return 'term' === $type ? get_term_meta( $id, $key, true ) : get_post_meta( $id, $key, true );
	}

	private static function meta_set( $type, $id, $key, $value ) {
		// wp_slash() because update_*_meta() unslashes, which would corrupt JSON escapes.
		return 'term' === $type
			? update_term_meta( $id, $key, wp_slash( $value ) )
			: update_post_meta( $id, $key, wp_slash( $value ) );
	}

	private static function meta_delete( $type, $id, $key ) {
		return 'term' === $type ? delete_term_meta( $id, $key ) : delete_post_meta( $id, $key );
	}

	/**
	 * Stored proposal.
	 *
	 * @param string $type Type.
	 * @param int    $id   ID.
	 * @return array|null
	 */
	public static function get_proposal( $type, $id ) {
		$raw = self::meta_get( $type, $id, self::META_PROPOSAL );
		$val = is_string( $raw ) ? json_decode( $raw, true ) : $raw;
		return is_array( $val ) ? $val : null;
	}

	/**
	 * Undo history, newest last.
	 *
	 * @param string $type Type.
	 * @param int    $id   ID.
	 * @return array[]
	 */
	public static function history( $type, $id ) {
		$raw = self::meta_get( $type, $id, self::META_HISTORY );
		$val = is_string( $raw ) ? json_decode( $raw, true ) : $raw;
		return is_array( $val ) ? $val : [];
	}

	/**
	 * Field values this plugin last wrote to AIOSEO.
	 *
	 * @param string $type Type.
	 * @param int    $id   ID.
	 * @return array
	 */
	public static function written( $type, $id ) {
		$raw = self::meta_get( $type, $id, self::META_WRITTEN );
		$val = is_string( $raw ) ? json_decode( $raw, true ) : $raw;
		return is_array( $val ) ? $val : [];
	}

	/**
	 * The schema data the injector outputs for a post.
	 *
	 * @param int $post_id Post ID.
	 * @return array|null
	 */
	public static function active_schema( $post_id ) {
		$raw = get_post_meta( $post_id, self::META_SCHEMA, true );
		$val = is_string( $raw ) ? json_decode( $raw, true ) : $raw;
		return is_array( $val ) ? $val : null;
	}

	/* ---------------------------------------------------------------------
	 * Generate
	 * ------------------------------------------------------------------- */

	/**
	 * Generates and stores a proposal. Nothing is written to AIOSEO.
	 *
	 * @param string $type "post" or "term".
	 * @param int    $id   ID.
	 * @return array|WP_Error Row description.
	 */
	public static function generate( $type, $id ) {
		if ( 'term' === $type ) {
			$term = get_term( $id );
			if ( ! $term || is_wp_error( $term ) ) {
				return new WP_Error( 'aisa_not_found', __( 'Term not found.', 'ai-seo-autopilot' ) );
			}
			$result = AISA_Generator::generate_term( $term );
		} else {
			$post = get_post( $id );
			if ( ! $post ) {
				return new WP_Error( 'aisa_not_found', __( 'Post not found.', 'ai-seo-autopilot' ) );
			}
			if ( self::already_done_by_person( $id ) ) {
				// Nothing would be written in fill-empty mode, so don't spend tokens generating.
				self::meta_set( $type, $id, self::META_STATUS, 'skipped' );
				self::meta_delete( $type, $id, self::META_ERROR );
				return self::describe( $type, $id );
			}
			$result = AISA_Generator::generate_post( $post );
		}

		if ( is_wp_error( $result ) ) {
			self::meta_set( $type, $id, self::META_STATUS, 'error' );
			self::meta_set( $type, $id, self::META_ERROR, $result->get_error_message() );
			return $result;
		}

		return self::store_proposal( $type, $id, $result, AISA_Settings::get( 'model' ) );
	}

	/**
	 * Saves a proposal for review, whether generated here or imported.
	 *
	 * @param string $type   Type.
	 * @param int    $id     ID.
	 * @param array  $result ['fields' => [...], 'schema' => [...]|null, 'warnings' => []].
	 * @param string $source Model ID, or "import".
	 * @return array Row description.
	 */
	public static function store_proposal( $type, $id, $result, $source ) {
		$result['generated_at'] = gmdate( 'c' );
		$result['model']        = $source;

		self::meta_set( $type, $id, self::META_PROPOSAL, wp_json_encode( $result ) );
		self::meta_set( $type, $id, self::META_STATUS, 'generated' );
		self::meta_delete( $type, $id, self::META_ERROR );

		return self::describe( $type, $id );
	}

	/**
	 * Token saver + fill-empty mode: whether a person already wrote this post's title,
	 * description and focus keyphrase, so a generated proposal could never be applied.
	 *
	 * @param int $id Post ID.
	 * @return bool
	 */
	private static function already_done_by_person( $id ) {
		if ( ! AISA_Settings::token_saver() || 'fill_empty' !== AISA_Settings::get( 'mode' ) ) {
			return false;
		}
		$current = AISA_AIOSEO_Bridge::read( $id );
		if ( is_wp_error( $current ) ) {
			return false;
		}
		$ours = self::written( 'post', $id );
		foreach ( [ 'title', 'description', 'focus_keyphrase' ] as $key ) {
			$now = isset( $current[ $key ] ) ? $current[ $key ] : null;
			if ( self::is_empty_value( $now ) ) {
				return false;
			}
			if ( isset( $ours[ $key ] ) && AISA_AIOSEO_Bridge::normalize( $ours[ $key ] ) === AISA_AIOSEO_Bridge::normalize( $now ) ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Replaces a proposal with edits from the review table.
	 *
	 * @param string $type   Type.
	 * @param int    $id     ID.
	 * @param array  $fields Edited fields.
	 * @return array|WP_Error
	 */
	public static function edit( $type, $id, $fields ) {
		$proposal = self::get_proposal( $type, $id );
		if ( ! $proposal ) {
			return new WP_Error( 'aisa_no_proposal', __( 'Generate this item first.', 'ai-seo-autopilot' ) );
		}
		foreach ( [ 'title', 'description', 'focus_keyphrase', 'og_title', 'og_description' ] as $key ) {
			if ( isset( $fields[ $key ] ) ) {
				$proposal['fields'][ $key ] = sanitize_text_field( wp_unslash( $fields[ $key ] ) );
			}
		}
		if ( isset( $fields['additional_keyphrases'] ) ) {
			$list                                        = is_array( $fields['additional_keyphrases'] ) ? $fields['additional_keyphrases'] : explode( ',', (string) $fields['additional_keyphrases'] );
			$proposal['fields']['additional_keyphrases'] = array_values( array_filter( array_map( 'sanitize_text_field', array_map( 'trim', wp_unslash( $list ) ) ) ) );
		}
		$proposal['edited'] = true;
		self::meta_set( $type, $id, self::META_PROPOSAL, wp_json_encode( $proposal ) );
		return self::describe( $type, $id );
	}

	/* ---------------------------------------------------------------------
	 * Apply / restore
	 * ------------------------------------------------------------------- */

	/**
	 * Writes a proposal into AIOSEO after saving a backup.
	 *
	 * @param string $type Type.
	 * @param int    $id   ID.
	 * @return array|WP_Error
	 */
	public static function apply( $type, $id ) {
		$proposal = self::get_proposal( $type, $id );
		if ( ! $proposal ) {
			return new WP_Error( 'aisa_no_proposal', __( 'Generate this item first.', 'ai-seo-autopilot' ) );
		}

		$current = 'term' === $type ? AISA_AIOSEO_Bridge::read_term( $id ) : AISA_AIOSEO_Bridge::read( $id );
		if ( is_wp_error( $current ) ) {
			return $current;
		}

		$fields = $proposal['fields'];
		if ( 'fill_empty' === AISA_Settings::get( 'mode' ) ) {
			// Values this plugin wrote earlier are ours to update; anything else was written by a person.
			$ours = self::written( $type, $id );
			foreach ( $fields as $key => $value ) {
				$now = isset( $current[ $key ] ) ? $current[ $key ] : null;
				if ( self::is_empty_value( $now ) ) {
					continue;
				}
				$same = is_array( $now ) || is_array( $ours[ $key ] ?? null )
					? wp_json_encode( $ours[ $key ] ?? null ) === wp_json_encode( $now )
					: AISA_AIOSEO_Bridge::normalize( $ours[ $key ] ?? '' ) === AISA_AIOSEO_Bridge::normalize( $now );
				if ( array_key_exists( $key, $ours ) && $same ) {
					continue;
				}
				unset( $fields[ $key ] );
			}
		}

		// Back up only what is about to change.
		$snapshot = [
			'at'     => gmdate( 'c' ),
			'fields' => array_intersect_key( $current, $fields ),
		];
		if ( 'post' === $type ) {
			$snapshot['schema'] = self::active_schema( $id );
		}

		$history   = self::history( $type, $id );
		$history[] = $snapshot;
		$history   = array_slice( $history, -self::MAX_HISTORY );
		self::meta_set( $type, $id, self::META_HISTORY, wp_json_encode( $history ) );

		$result = 'term' === $type ? AISA_AIOSEO_Bridge::write_term( $id, $fields ) : AISA_AIOSEO_Bridge::write( $id, $fields );
		if ( is_wp_error( $result ) ) {
			// Drop the backup we just pushed; nothing changed.
			array_pop( $history );
			self::meta_set( $type, $id, self::META_HISTORY, wp_json_encode( $history ) );
			self::meta_set( $type, $id, self::META_ERROR, $result->get_error_message() );
			return $result;
		}

		self::meta_set( $type, $id, self::META_WRITTEN, wp_json_encode( array_merge( self::written( $type, $id ), $fields ) ) );

		if ( 'post' === $type && ! empty( $proposal['schema'] ) ) {
			// The added schema only ever comes from this plugin, so it is always safe to update.
			update_post_meta( $id, self::META_SCHEMA, wp_slash( wp_json_encode( $proposal['schema'] ) ) );
		}

		self::meta_set( $type, $id, self::META_STATUS, 'applied' );
		self::meta_delete( $type, $id, self::META_ERROR );

		$row            = self::describe( $type, $id );
		$row['adapter'] = isset( $result['adapter'] ) ? $result['adapter'] : '';
		return $row;
	}

	/**
	 * Restores the most recent backup.
	 *
	 * @param string $type Type.
	 * @param int    $id   ID.
	 * @return array|WP_Error
	 */
	public static function restore( $type, $id ) {
		$history = self::history( $type, $id );
		if ( ! $history ) {
			return new WP_Error( 'aisa_no_history', __( 'Nothing to restore.', 'ai-seo-autopilot' ) );
		}
		$snapshot = array_pop( $history );

		// A field that was empty before goes back to empty so AIOSEO's template applies again.
		$fields = [];
		foreach ( (array) $snapshot['fields'] as $key => $value ) {
			$fields[ $key ] = 'additional_keyphrases' === $key ? (array) $value : ( null === $value ? '' : $value );
		}

		if ( $fields ) {
			$result = 'term' === $type ? AISA_AIOSEO_Bridge::write_term( $id, $fields ) : AISA_AIOSEO_Bridge::write( $id, $fields );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}

		if ( 'post' === $type && array_key_exists( 'schema', $snapshot ) ) {
			if ( empty( $snapshot['schema'] ) ) {
				delete_post_meta( $id, self::META_SCHEMA );
			} else {
				update_post_meta( $id, self::META_SCHEMA, wp_slash( wp_json_encode( $snapshot['schema'] ) ) );
			}
		}

		self::meta_set( $type, $id, self::META_HISTORY, wp_json_encode( $history ) );
		self::meta_set( $type, $id, self::META_STATUS, $history ? 'applied' : 'restored' );
		self::meta_set( $type, $id, self::META_WRITTEN, wp_json_encode( array_diff_key( self::written( $type, $id ), $fields ) ) );

		return self::describe( $type, $id );
	}

	/**
	 * Whether an AIOSEO value counts as "not set". Values made only of AIOSEO smart tags
	 * (e.g. "#post_title #separator_sa #site_title") are AIOSEO's defaults, so they count too.
	 *
	 * @param mixed $value Value.
	 * @return bool
	 */
	public static function is_empty_value( $value ) {
		if ( is_array( $value ) ) {
			return empty( $value );
		}
		$value = trim( (string) $value );
		if ( '' === $value ) {
			return true;
		}
		return '' === trim( preg_replace( '/#[a-z_]+/i', '', $value ) );
	}

	/* ---------------------------------------------------------------------
	 * Site profile
	 * ------------------------------------------------------------------- */

	/**
	 * Saves the profile and writes its settings into AIOSEO.
	 *
	 * @param array $profile   Profile (already sanitized).
	 * @param bool  $overwrite Replace values already set in AIOSEO. Used when a person saves the
	 *                         reviewed profile form; otherwise the Settings mode decides.
	 * @return array Report: field => "ok" | "kept" | error message.
	 */
	public static function apply_profile( $profile, $overwrite = false ) {
		update_option( AISA_Generator::PROFILE_OPTION, $profile, false );

		$values = [
			'site_represents'  => $profile['site_represents'],
			'home_title'       => $profile['home_title'],
			'home_description' => $profile['home_description'],
			'phone'            => $profile['phone'],
			'email'            => $profile['email'],
			'founding_date'    => $profile['founding_date'],
		];
		if ( 'person' === $profile['site_represents'] ) {
			$values['person_name'] = $profile['name'];
			$values['person_logo'] = $profile['logo'];
		} else {
			$values['organization_name']        = $profile['name'];
			$values['organization_description'] = $profile['description'];
			$values['organization_logo']        = $profile['logo'];
		}
		foreach ( AISA_Generator::SOCIAL_KEYS as $k ) {
			$values[ $k ] = isset( $profile['social'][ $k ] ) ? $profile['social'][ $k ] : '';
		}
		if ( 'organization' === $profile['site_represents'] ) {
			$addr   = isset( $profile['address'] ) ? (array) $profile['address'] : [];
			$values = array_merge(
				$values,
				[
					'local_name'          => $profile['name'],
					'local_business_type' => $profile['business_type'],
					'local_area_served'   => $profile['area_served'],
					'local_street'        => isset( $addr['street'] ) ? $addr['street'] : '',
					'local_city'          => isset( $addr['city'] ) ? $addr['city'] : '',
					'local_region'        => isset( $addr['region'] ) ? $addr['region'] : '',
					'local_postal_code'   => isset( $addr['postal_code'] ) ? $addr['postal_code'] : '',
					'local_country'       => isset( $addr['country'] ) ? $addr['country'] : '',
					'local_phone'         => $profile['phone'],
					'local_email'         => $profile['email'],
					'local_price_range'   => $profile['price_range'],
				]
			);
		}

		// With a static front page, the homepage title lives on that page, not in settings.
		if ( 'page' === get_option( 'show_on_front' ) && get_option( 'page_on_front' ) ) {
			unset( $values['home_title'], $values['home_description'] );
		}

		$map       = AISA_AIOSEO_Bridge::site_option_map();
		$fill_only = ! $overwrite && 'fill_empty' === AISA_Settings::get( 'mode' );
		$no_local  = false;
		$backup    = get_option( self::SITE_BACKUP, [] );
		$backup    = is_array( $backup ) ? $backup : [];
		$report    = [];

		foreach ( $values as $key => $value ) {
			if ( '' === (string) $value || ! isset( $map[ $key ] ) ) {
				continue;
			}
			$current = AISA_AIOSEO_Bridge::get_option_path( $map[ $key ] );
			if ( is_wp_error( $current ) ) {
				// The Local SEO add-on is optional; report its absence once, not per field.
				if ( 0 === strpos( $key, 'local_' ) && 'aisa_option_missing' === $current->get_error_code() ) {
					$no_local = true;
					continue;
				}
				$report[ $key ] = $current->get_error_message();
				continue;
			}
			// site_represents always follows the profile; everything else respects fill-empty mode.
			if ( $fill_only && 'site_represents' !== $key && ! self::is_empty_value( $current ) ) {
				$report[ $key ] = 'kept';
				continue;
			}
			if ( (string) $current === (string) $value ) {
				$report[ $key ] = 'ok';
				continue;
			}
			if ( ! array_key_exists( $map[ $key ], $backup ) ) {
				$backup[ $map[ $key ] ] = $current;
			}
			$result         = AISA_AIOSEO_Bridge::set_option_path( $map[ $key ], $value );
			$report[ $key ] = is_wp_error( $result ) ? $result->get_error_message() : 'ok';
		}

		// Person mode points AIOSEO at a manually entered person.
		if ( 'person' === $profile['site_represents'] ) {
			AISA_AIOSEO_Bridge::set_option_path( 'searchAppearance.global.schema.person', 'manual' );
		}

		if ( $no_local ) {
			$report['local_seo'] = 'address not saved to Local SEO: the AIOSEO Local SEO add-on is not active (the address is still added to your schema)';
		}

		update_option( self::SITE_BACKUP, $backup, false );
		update_option( AISA_Generator::PROFILE_OPTION . '_applied', gmdate( 'c' ), false );
		delete_option( self::PROFILE_PENDING );

		return $report;
	}

	/**
	 * Restores AIOSEO site settings to what they were before the first apply.
	 *
	 * @return array Report.
	 */
	public static function restore_profile() {
		$backup = get_option( self::SITE_BACKUP, [] );
		$report = [];
		foreach ( (array) $backup as $path => $value ) {
			$result          = AISA_AIOSEO_Bridge::set_option_path( $path, $value );
			$report[ $path ] = is_wp_error( $result ) ? $result->get_error_message() : 'ok';
		}
		delete_option( self::SITE_BACKUP );
		delete_option( AISA_Generator::PROFILE_OPTION . '_applied' );
		return $report;
	}
}
