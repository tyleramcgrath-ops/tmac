<?php
/**
 * Plugin settings.
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Reads and writes the plugin's own settings (never AIOSEO's).
 */
class AISA_Settings {
	const OPTION = 'aisa_settings';

	/**
	 * Models offered in the settings screen.
	 *
	 * @return array<string,string> Model ID => label.
	 */
	public static function models() {
		return [
			'claude-opus-5'    => 'Claude Opus 5 (best quality)',
			'claude-sonnet-5'  => 'Claude Sonnet 5 (faster, cheaper)',
			'claude-haiku-4-5' => 'Claude Haiku 4.5 (fastest, cheapest)',
		];
	}

	/**
	 * Default settings.
	 *
	 * @return array
	 */
	public static function defaults() {
		return [
			'api_key'        => '',
			'model'          => 'claude-opus-5',
			'effort'         => 'low',
			'post_types'     => [ 'post', 'page' ],
			'mode'           => 'fill_empty',
			'business_notes' => '',
			'language'       => '',
		];
	}

	/**
	 * All settings merged over defaults.
	 *
	 * @return array
	 */
	public static function all() {
		$saved = get_option( self::OPTION, [] );
		return array_merge( self::defaults(), is_array( $saved ) ? $saved : [] );
	}

	/**
	 * One setting.
	 *
	 * @param string $key Setting key.
	 * @return mixed
	 */
	public static function get( $key ) {
		$all = self::all();
		return isset( $all[ $key ] ) ? $all[ $key ] : null;
	}

	/**
	 * The Anthropic API key. A constant in wp-config.php wins over the stored value.
	 *
	 * @return string
	 */
	public static function api_key() {
		if ( defined( 'AISA_ANTHROPIC_API_KEY' ) && AISA_ANTHROPIC_API_KEY ) {
			return (string) AISA_ANTHROPIC_API_KEY;
		}
		return (string) self::get( 'api_key' );
	}

	/**
	 * Whether the key comes from wp-config.php.
	 *
	 * @return bool
	 */
	public static function api_key_is_constant() {
		return defined( 'AISA_ANTHROPIC_API_KEY' ) && AISA_ANTHROPIC_API_KEY;
	}

	/**
	 * Sanitizes and saves submitted settings.
	 *
	 * @param array $input Raw input.
	 * @return array Saved settings.
	 */
	public static function save( $input ) {
		$current = self::all();
		$clean   = $current;

		if ( isset( $input['api_key'] ) ) {
			$key = trim( sanitize_text_field( wp_unslash( $input['api_key'] ) ) );
			// The form shows a masked key; only replace it when a new one is typed.
			if ( '' !== $key && false === strpos( $key, '•' ) ) {
				$clean['api_key'] = $key;
			}
			if ( ! empty( $input['clear_api_key'] ) ) {
				$clean['api_key'] = '';
			}
		}

		if ( isset( $input['model'] ) ) {
			$model          = sanitize_text_field( wp_unslash( $input['model'] ) );
			$clean['model'] = array_key_exists( $model, self::models() ) ? $model : 'claude-opus-5';
		}

		if ( isset( $input['effort'] ) ) {
			$effort          = sanitize_key( $input['effort'] );
			$clean['effort'] = in_array( $effort, [ 'low', 'medium', 'high' ], true ) ? $effort : 'low';
		}

		if ( isset( $input['mode'] ) ) {
			$clean['mode'] = 'overwrite' === $input['mode'] ? 'overwrite' : 'fill_empty';
		}

		if ( isset( $input['post_types'] ) && is_array( $input['post_types'] ) ) {
			$types               = array_map( 'sanitize_key', wp_unslash( $input['post_types'] ) );
			$clean['post_types'] = array_values( array_intersect( $types, array_keys( self::available_post_types() ) ) );
		}

		if ( isset( $input['business_notes'] ) ) {
			$clean['business_notes'] = sanitize_textarea_field( wp_unslash( $input['business_notes'] ) );
		}

		if ( isset( $input['language'] ) ) {
			$clean['language'] = sanitize_text_field( wp_unslash( $input['language'] ) );
		}

		update_option( self::OPTION, $clean, false );
		return $clean;
	}

	/**
	 * Public post types that can be optimized.
	 *
	 * @return array<string,string> Slug => label.
	 */
	public static function available_post_types() {
		$types = [];
		foreach ( get_post_types( [ 'public' => true ], 'objects' ) as $slug => $type ) {
			if ( 'attachment' === $slug ) {
				continue;
			}
			$types[ $slug ] = $type->labels->name;
		}
		return $types;
	}
}
