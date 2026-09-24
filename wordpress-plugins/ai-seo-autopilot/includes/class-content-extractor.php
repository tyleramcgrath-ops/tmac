<?php
/**
 * Turns a post into plain text Claude can read.
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Extracts readable text from posts and terms.
 */
class AISA_Content_Extractor {
	/**
	 * Set after a fetch of the site's own page fails, so one slow or blocked host doesn't
	 * make every page in a request wait for a timeout.
	 *
	 * @var bool
	 */
	private static $fetch_broken = false;
	/**
	 * Characters of page text sent per page. SEO metadata only needs the substance of a page,
	 * and a cap keeps cost predictable on very long pages. Token saver mode sends much less:
	 * the opening of a page says what it is about.
	 *
	 * @return int
	 */
	public static function max_chars() {
		return AISA_Settings::token_saver() ? 6000 : 24000;
	}

	/**
	 * Text for a post. Page builders (Elementor, Divi, etc.) often leave post_content empty,
	 * so when the stored content is thin, the published page is fetched and read instead.
	 *
	 * @param WP_Post $post The post.
	 * @return array{text:string,truncated:bool,source:string}
	 */
	public static function for_post( $post ) {
		$text   = self::clean_html( self::stored_content( $post ) );
		$source = 'content';

		if ( mb_strlen( $text ) < 400 && 'publish' === $post->post_status && ! self::$fetch_broken ) {
			$rendered = self::rendered_text( get_permalink( $post ) );
			if ( mb_strlen( $rendered ) > mb_strlen( $text ) ) {
				$text   = $rendered;
				$source = 'rendered';
			}
		}

		$text = apply_filters( 'aisa_post_text', $text, $post );

		$truncated = mb_strlen( $text ) > self::max_chars();
		if ( $truncated ) {
			$text = mb_substr( $text, 0, self::max_chars() );
		}

		return [
			'text'      => $text,
			'truncated' => $truncated,
			'source'    => $source,
		];
	}

	/**
	 * The post's stored content with blocks rendered and shortcodes removed.
	 *
	 * @param WP_Post $post The post.
	 * @return string
	 */
	private static function stored_content( $post ) {
		// Read the stored HTML directly instead of rendering blocks: rendering runs every
		// block's code (and WordPress's block parser has run out of memory on real sites with
		// very large or self-nesting posts). The first 300 KB is far more than SEO needs.
		$content = mb_strcut( (string) $post->post_content, 0, 300000, 'UTF-8' );
		return strip_shortcodes( $content );
	}

	/**
	 * Text of the published page, main content only when it can be found.
	 *
	 * @param string $url Page URL.
	 * @return string
	 */
	public static function rendered_text( $url ) {
		if ( ! $url ) {
			return '';
		}

		$response = wp_remote_get(
			$url,
			[
				'timeout'   => 8,
				'sslverify' => apply_filters( 'https_local_ssl_verify', false ),
			]
		);
		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			self::$fetch_broken = true;
			return '';
		}

		$html = (string) wp_remote_retrieve_body( $response );

		// Prefer <main>, then <article>, then <body>.
		foreach ( [ 'main', 'article', 'body' ] as $tag ) {
			if ( preg_match( '#<' . $tag . '\b[^>]*>(.*)</' . $tag . '>#is', $html, $m ) ) {
				$html = $m[1];
				break;
			}
		}

		return self::clean_html( $html );
	}

	/**
	 * HTML to compact text, keeping headings and list items on their own lines.
	 *
	 * @param string $html HTML.
	 * @return string
	 */
	public static function clean_html( $html ) {
		$html = preg_replace( '#<(script|style|noscript|svg|iframe|nav|header|footer|form)\b[^>]*>.*?</\1>#is', ' ', (string) $html );
		$html = preg_replace( '#<h([1-6])\b[^>]*>#i', "\n\n## ", $html );
		$html = preg_replace( '#<(br|/p|/div|/li|/h[1-6]|/tr|/section)\b[^>]*>#i', "\n", $html );
		$html = preg_replace( '#<li\b[^>]*>#i', "\n- ", $html );
		$text = wp_strip_all_tags( $html );
		$text = html_entity_decode( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		$text = preg_replace( "/[ \t\x{00A0}]+/u", ' ', $text );
		$text = preg_replace( "/\n\s*\n\s*\n+/", "\n\n", $text );
		return trim( $text );
	}
}
