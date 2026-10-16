<?php
/**
 * Adapter for AIOSEO's PostSeoService (AIOSEO 4.9.8+), used when WordPress is older than
 * 6.9 and has no Abilities API. It is the same code the abilities call, reached directly.
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AISA_Adapter_Service implements AISA_Adapter {
	const SERVICE = '\AIOSEO\Plugin\Common\Services\PostSeoService';

	public function id() {
		return 'service';
	}

	public function label() {
		return __( 'AIOSEO PostSeoService', 'ai-seo-autopilot' );
	}

	public function is_available() {
		return class_exists( self::SERVICE )
			&& method_exists( self::SERVICE, 'updateSeoData' )
			&& method_exists( self::SERVICE, 'getSeoData' );
	}

	public function read( $post_id ) {
		$class = self::SERVICE;
		$out   = ( new $class() )->getSeoData( (int) $post_id );
		if ( is_wp_error( $out ) ) {
			// No AIOSEO row yet means nothing has been set for this post.
			return 'not_found' === $out->get_error_code() && get_post( $post_id ) ? AISA_Adapter_Abilities::normalize_snapshot( [] ) : $out;
		}
		return AISA_Adapter_Abilities::normalize_snapshot( is_array( $out ) ? $out : [] );
	}

	public function write( $post_id, $fields ) {
		$input = [];
		foreach ( [ 'title', 'description', 'focus_keyphrase', 'additional_keyphrases' ] as $key ) {
			if ( array_key_exists( $key, $fields ) ) {
				$input[ $key ] = $fields[ $key ];
			}
		}
		foreach ( [ 'og_title', 'og_description', 'twitter_title', 'twitter_description' ] as $key ) {
			if ( array_key_exists( $key, $fields ) ) {
				$input['social'][ $key ] = $fields[ $key ];
			}
		}

		$class = self::SERVICE;
		$out   = ( new $class() )->updateSeoData( (int) $post_id, $input );
		if ( is_wp_error( $out ) && 'not_found' === $out->get_error_code() && AISA_AIOSEO_Bridge::prime_row( $post_id ) ) {
			$out = ( new $class() )->updateSeoData( (int) $post_id, $input );
		}
		return is_wp_error( $out ) ? $out : true;
	}
}
