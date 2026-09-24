<?php
/**
 * Last-resort adapter that writes through AIOSEO's Post model (present since AIOSEO 4.0).
 *
 * It sets model properties directly and calls save(), which is the model's own persistence
 * path. It only touches columns the installed table actually has (checked with
 * getColumns()), so a dropped or renamed column is skipped instead of causing a DB error.
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AISA_Adapter_Model implements AISA_Adapter {
	const MODEL = '\AIOSEO\Plugin\Common\Models\Post';

	public function id() {
		return 'model';
	}

	public function label() {
		return __( 'AIOSEO Post model (legacy fallback)', 'ai-seo-autopilot' );
	}

	public function is_available() {
		return class_exists( self::MODEL ) && method_exists( self::MODEL, 'getPost' ) && method_exists( self::MODEL, 'save' );
	}

	public function read( $post_id ) {
		$class = self::MODEL;
		$post  = $class::getPost( (int) $post_id );
		$kp    = self::to_array( isset( $post->keyphrases ) ? $post->keyphrases : null );

		$additional = [];
		if ( isset( $kp['additional'] ) && is_array( $kp['additional'] ) ) {
			foreach ( $kp['additional'] as $row ) {
				if ( isset( $row['keyphrase'] ) && '' !== $row['keyphrase'] ) {
					$additional[] = (string) $row['keyphrase'];
				}
			}
		}

		$focus = isset( $kp['focus']['keyphrase'] ) ? (string) $kp['focus']['keyphrase'] : null;
		if ( ( null === $focus || '' === $focus ) && ! empty( $post->focus_keyword ) && is_string( $post->focus_keyword ) ) {
			$focus = $post->focus_keyword;
		}

		return [
			'title'                 => isset( $post->title ) ? $post->title : null,
			'description'           => isset( $post->description ) ? $post->description : null,
			'focus_keyphrase'       => '' === $focus ? null : $focus,
			'additional_keyphrases' => $additional,
			'og_title'              => isset( $post->og_title ) ? $post->og_title : null,
			'og_description'        => isset( $post->og_description ) ? $post->og_description : null,
			'twitter_title'         => isset( $post->twitter_title ) ? $post->twitter_title : null,
			'twitter_description'   => isset( $post->twitter_description ) ? $post->twitter_description : null,
		];
	}

	public function write( $post_id, $fields ) {
		$class   = self::MODEL;
		$post    = $class::getPost( (int) $post_id );
		$columns = method_exists( $post, 'getColumns' ) ? array_keys( (array) $post->getColumns() ) : [];
		$has     = function ( $col ) use ( $columns ) {
			return empty( $columns ) || in_array( $col, $columns, true );
		};

		$post->post_id = (int) $post_id;

		foreach ( [ 'title', 'description', 'og_title', 'og_description', 'twitter_title', 'twitter_description' ] as $col ) {
			if ( array_key_exists( $col, $fields ) && $has( $col ) ) {
				$post->$col = null === $fields[ $col ] ? null : sanitize_text_field( $fields[ $col ] );
			}
		}

		$touch_focus      = array_key_exists( 'focus_keyphrase', $fields );
		$touch_additional = array_key_exists( 'additional_keyphrases', $fields );
		if ( ( $touch_focus || $touch_additional ) && $has( 'keyphrases' ) ) {
			$kp = self::to_array( isset( $post->keyphrases ) ? $post->keyphrases : null );
			if ( ! isset( $kp['focus'] ) || ! is_array( $kp['focus'] ) ) {
				$kp['focus'] = [
					'keyphrase' => '',
					'score'     => 0,
					'analysis'  => new stdClass(),
				];
			}
			if ( ! isset( $kp['additional'] ) || ! is_array( $kp['additional'] ) ) {
				$kp['additional'] = [];
			}
			if ( $touch_focus ) {
				$kp['focus']['keyphrase'] = sanitize_text_field( (string) $fields['focus_keyphrase'] );
			}
			if ( $touch_additional ) {
				$kp['additional'] = array_map(
					function ( $k ) {
						return [
							'keyphrase' => sanitize_text_field( (string) $k ),
							'score'     => 0,
							'analysis'  => new stdClass(),
						];
					},
					(array) $fields['additional_keyphrases']
				);
			}
			$post->keyphrases = json_decode( wp_json_encode( $kp ) );

			// AIOSEO 5 reads dedicated keyword columns in the editor; keep them in sync when present.
			if ( method_exists( $class, 'getKeywordColumnsFromKeyphrases' ) ) {
				$cols = $class::getKeywordColumnsFromKeyphrases( $kp );
				foreach ( [ 'focus_keyword', 'additional_keywords' ] as $col ) {
					if ( isset( $cols[ $col ] ) && $has( $col ) ) {
						$post->$col = $cols[ $col ];
					}
				}
			}
		}

		$post->updated = gmdate( 'Y-m-d H:i:s' );
		if ( method_exists( $post, 'exists' ) && ! $post->exists() ) {
			$post->created = gmdate( 'Y-m-d H:i:s' );
		}

		$post->save();

		if ( ! empty( $post->lastError ) ) {
			return new WP_Error( 'aisa_model_save', (string) $post->lastError );
		}

		// Mirror to post meta for multilingual plugins, as AIOSEO's own save does.
		if ( method_exists( $class, 'updatePostMeta' ) ) {
			$meta = array_intersect_key( $fields, array_flip( [ 'title', 'description', 'og_title', 'og_description', 'twitter_title', 'twitter_description' ] ) );
			try {
				$class::updatePostMeta( (int) $post_id, $meta );
			} catch ( \Throwable $e ) {
				// Non-critical.
				unset( $e );
			}
		}

		if ( function_exists( 'aioseo' ) && isset( aioseo()->meta->metaData ) && method_exists( aioseo()->meta->metaData, 'bustPostCache' ) ) {
			aioseo()->meta->metaData->bustPostCache( (int) $post_id );
		}

		return true;
	}

	/**
	 * JSON column value (string, object or array) to array.
	 *
	 * @param mixed $value Value.
	 * @return array
	 */
	private static function to_array( $value ) {
		if ( is_string( $value ) ) {
			$value = json_decode( $value, true );
		} else {
			$value = json_decode( wp_json_encode( $value ), true );
		}
		return is_array( $value ) ? $value : [];
	}
}
