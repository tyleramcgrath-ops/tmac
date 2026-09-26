<?php
/**
 * Contract every AIOSEO write path implements.
 *
 * All adapters speak the same normalized field shape, so the rest of the plugin never
 * touches AIOSEO internals. When an AIOSEO update changes how data is stored, only an
 * adapter needs to change, and a fix can ship as a tiny add-on plugin that registers a
 * new adapter through the `aisa_adapters` filter (see README).
 *
 * Normalized fields:
 *   title, description, focus_keyphrase  string|null
 *   additional_keyphrases                string[]
 *   og_title, og_description             string|null
 *   twitter_title, twitter_description   string|null
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

interface AISA_Adapter {
	/**
	 * Stable identifier, e.g. "abilities".
	 *
	 * @return string
	 */
	public function id();

	/**
	 * Human-readable name for the Health tab.
	 *
	 * @return string
	 */
	public function label();

	/**
	 * Cheap check that the AIOSEO surface this adapter needs exists.
	 *
	 * @return bool
	 */
	public function is_available();

	/**
	 * Reads the normalized SEO fields for a post.
	 *
	 * @param int $post_id Post ID.
	 * @return array|WP_Error
	 */
	public function read( $post_id );

	/**
	 * Writes a subset of the normalized fields. Fields not passed are left untouched.
	 *
	 * @param int   $post_id Post ID.
	 * @param array $fields  Normalized fields.
	 * @return true|WP_Error
	 */
	public function write( $post_id, $fields );
}
