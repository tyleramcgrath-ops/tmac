<?php
/**
 * Adapter for AIOSEO's WordPress Abilities (AIOSEO 4.9.8+ on WordPress 6.9+).
 *
 * This is the preferred path: the abilities are a published contract with a versioned
 * JSON input schema, designed for AI agents, so they are the least likely surface to
 * change between AIOSEO releases. The adapter also reads the live input schema and only
 * sends keys the installed AIOSEO declares, so a renamed or removed field degrades to
 * "not written" instead of failing the whole save.
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AISA_Adapter_Abilities implements AISA_Adapter {
	const GET    = 'aioseo-posts/seo-data-get';
	const UPDATE = 'aioseo-posts/seo-data-update';

	public function id() {
		return 'abilities';
	}

	public function label() {
		return __( 'AIOSEO Abilities API (official)', 'ai-seo-autopilot' );
	}

	public function is_available() {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			return false;
		}
		$update = wp_get_ability( self::UPDATE );
		$get    = wp_get_ability( self::GET );
		if ( ! $update || ! $get ) {
			return false;
		}
		$props = $this->input_properties( $update );
		// Without these two the adapter is pointless.
		return isset( $props['title'], $props['description'] );
	}

	public function read( $post_id ) {
		$ability = wp_get_ability( self::GET );
		if ( ! $ability ) {
			return new WP_Error( 'aisa_ability_missing', 'Ability ' . self::GET . ' is not registered.' );
		}
		$out = $ability->execute( [ 'postId' => (int) $post_id ] );
		if ( is_wp_error( $out ) ) {
			// No AIOSEO row yet means nothing has been set for this post.
			return 'not_found' === $out->get_error_code() && get_post( $post_id ) ? self::normalize_snapshot( [] ) : $out;
		}
		return self::normalize_snapshot( is_array( $out ) ? $out : [] );
	}

	public function write( $post_id, $fields ) {
		$ability = wp_get_ability( self::UPDATE );
		if ( ! $ability ) {
			return new WP_Error( 'aisa_ability_missing', 'Ability ' . self::UPDATE . ' is not registered.' );
		}

		$props = $this->input_properties( $ability );
		$input = [ 'postId' => (int) $post_id ];

		foreach ( [ 'title', 'description', 'focus_keyphrase', 'additional_keyphrases' ] as $key ) {
			if ( array_key_exists( $key, $fields ) && isset( $props[ $key ] ) ) {
				$input[ $key ] = $fields[ $key ];
			}
		}

		$social_props = isset( $props['social']['properties'] ) ? $props['social']['properties'] : [];
		foreach ( [ 'og_title', 'og_description', 'twitter_title', 'twitter_description' ] as $key ) {
			if ( array_key_exists( $key, $fields ) && isset( $social_props[ $key ] ) ) {
				$input['social'][ $key ] = $fields[ $key ];
			}
		}

		$out = $ability->execute( $input );
		if ( is_wp_error( $out ) && 'not_found' === $out->get_error_code() && AISA_AIOSEO_Bridge::prime_row( $post_id ) ) {
			$out = $ability->execute( $input );
		}
		if ( is_wp_error( $out ) ) {
			return $out;
		}
		if ( is_array( $out ) && isset( $out['updated'] ) && ! $out['updated'] ) {
			return new WP_Error( 'aisa_not_updated', 'AIOSEO reported that nothing was updated.' );
		}
		return true;
	}

	/**
	 * Top-level properties from an ability's input schema.
	 *
	 * @param WP_Ability $ability Ability.
	 * @return array
	 */
	private function input_properties( $ability ) {
		if ( ! method_exists( $ability, 'get_input_schema' ) ) {
			return [];
		}
		$schema = $ability->get_input_schema();
		return isset( $schema['properties'] ) && is_array( $schema['properties'] ) ? $schema['properties'] : [];
	}

	/**
	 * Maps AIOSEO's agent snapshot to the normalized shape.
	 *
	 * @param array $snap Snapshot from seo-data-get / PostSeoService::getSeoData().
	 * @return array
	 */
	public static function normalize_snapshot( $snap ) {
		$social = isset( $snap['social'] ) && is_array( $snap['social'] ) ? $snap['social'] : [];
		return [
			'title'                 => isset( $snap['title'] ) ? $snap['title'] : null,
			'description'           => isset( $snap['description'] ) ? $snap['description'] : null,
			'focus_keyphrase'       => isset( $snap['focus_keyphrase'] ) ? $snap['focus_keyphrase'] : null,
			'additional_keyphrases' => isset( $snap['additional_keyphrases'] ) && is_array( $snap['additional_keyphrases'] ) ? array_values( $snap['additional_keyphrases'] ) : [],
			'og_title'              => isset( $social['og_title'] ) ? $social['og_title'] : null,
			'og_description'        => isset( $social['og_description'] ) ? $social['og_description'] : null,
			'twitter_title'         => isset( $social['twitter_title'] ) ? $social['twitter_title'] : null,
			'twitter_description'   => isset( $social['twitter_description'] ) ? $social['twitter_description'] : null,
		];
	}
}
