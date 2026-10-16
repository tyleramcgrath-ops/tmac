<?php
/**
 * Minimal Claude Messages API client built on the WordPress HTTP API.
 *
 * The official PHP SDK is not bundled on purpose: a WordPress plugin that ships Composer
 * dependencies (Guzzle, PSR packages) can collide with other plugins that ship different
 * versions of the same packages. wp_remote_post() has no such risk.
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Sends one request to the Messages API and returns JSON that matches a schema.
 */
class AISA_Claude_Client {
	const ENDPOINT = 'https://api.anthropic.com/v1/messages';

	/**
	 * Asks Claude for JSON matching $schema.
	 *
	 * @param string $system System prompt.
	 * @param string $user   User message.
	 * @param array  $schema JSON schema the reply must match (structured outputs).
	 * @return array|WP_Error Decoded JSON or an error.
	 */
	public static function json( $system, $user, $schema ) {
		$key = AISA_Settings::api_key();
		if ( '' === $key ) {
			return new WP_Error( 'aisa_no_key', __( 'Add your Anthropic API key on the Settings tab first.', 'ai-seo-autopilot' ) );
		}

		$model  = (string) AISA_Settings::get( 'model' );
		$effort = (string) AISA_Settings::get( 'effort' );

		$output_config = [
			'format' => [
				'type'   => 'json_schema',
				'schema' => $schema,
			],
		];
		// Haiku 4.5 does not accept the effort parameter.
		if ( 0 !== strpos( $model, 'claude-haiku' ) ) {
			$output_config['effort'] = $effort;
		}

		$body = [
			'model'         => $model,
			'max_tokens'    => 16000,
			'system'        => $system,
			'messages'      => [
				[
					'role'    => 'user',
					'content' => $user,
				],
			],
			'output_config' => $output_config,
		];

		$headers = [
			'content-type'      => 'application/json',
			'x-api-key'         => $key,
			'anthropic-version' => '2023-06-01',
		];

		// Opus 5 can decline a request; let the API re-run a decline on its recommended fallback model.
		if ( 'claude-opus-5' === $model ) {
			$body['fallbacks']         = 'default';
			$headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
		}

		$body = apply_filters( 'aisa_claude_request_body', $body );

		if ( function_exists( 'set_time_limit' ) ) {
			@set_time_limit( 300 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		}

		$attempts = 0;
		do {
			$attempts++;
			$response = wp_remote_post(
				self::ENDPOINT,
				[
					'timeout' => 240,
					'headers' => $headers,
					'body'    => wp_json_encode( $body ),
				]
			);

			if ( is_wp_error( $response ) ) {
				$retry = $attempts < 3;
				$error = new WP_Error( 'aisa_http', sprintf( __( 'Could not reach the Claude API: %s', 'ai-seo-autopilot' ), $response->get_error_message() ) );
			} else {
				$code  = (int) wp_remote_retrieve_response_code( $response );
				$retry = ( 429 === $code || 529 === $code || $code >= 500 ) && $attempts < 3;
				$error = null;
				if ( 200 !== $code ) {
					$error = self::http_error( $code, wp_remote_retrieve_body( $response ) );
				}
			}

			if ( $error && $retry ) {
				$wait = 0;
				if ( ! is_wp_error( $response ) ) {
					$wait = (int) wp_remote_retrieve_header( $response, 'retry-after' );
				}
				sleep( min( 20, max( 2 * $attempts, $wait ) ) );
			}
		} while ( $error && $retry );

		if ( $error ) {
			return $error;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $data ) ) {
			return new WP_Error( 'aisa_bad_json', __( 'The Claude API returned an unreadable response.', 'ai-seo-autopilot' ) );
		}

		$stop = isset( $data['stop_reason'] ) ? $data['stop_reason'] : '';
		if ( 'refusal' === $stop ) {
			return new WP_Error( 'aisa_refusal', __( 'Claude declined to process this page. Edit it manually.', 'ai-seo-autopilot' ) );
		}
		if ( 'max_tokens' === $stop ) {
			return new WP_Error( 'aisa_truncated', __( 'The response was cut off. Try again, or choose a lower effort setting.', 'ai-seo-autopilot' ) );
		}

		$text = '';
		foreach ( (array) ( isset( $data['content'] ) ? $data['content'] : [] ) as $block ) {
			if ( isset( $block['type'] ) && 'text' === $block['type'] ) {
				$text .= $block['text'];
			}
		}

		$json = json_decode( $text, true );
		if ( ! is_array( $json ) ) {
			return new WP_Error( 'aisa_bad_output', __( 'Claude returned output that was not valid JSON.', 'ai-seo-autopilot' ) );
		}

		return $json;
	}

	/**
	 * Turns a non-200 response into a readable error.
	 *
	 * @param int    $code HTTP status.
	 * @param string $raw  Response body.
	 * @return WP_Error
	 */
	private static function http_error( $code, $raw ) {
		$data    = json_decode( (string) $raw, true );
		$message = isset( $data['error']['message'] ) ? $data['error']['message'] : 'HTTP ' . $code;

		if ( 401 === $code ) {
			$message = __( 'The Anthropic API key was rejected. Check it on the Settings tab.', 'ai-seo-autopilot' );
		} elseif ( 429 === $code ) {
			$message = __( 'Rate limited by the Claude API. Wait a minute and run it again; finished pages are kept.', 'ai-seo-autopilot' );
		}

		return new WP_Error( 'aisa_api_' . $code, $message );
	}
}
