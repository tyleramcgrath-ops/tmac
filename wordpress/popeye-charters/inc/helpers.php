<?php
/**
 * Small helpers used across templates.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

/**
 * Default values for every theme option (Customizer).
 *
 * @return array
 */
function popeye_defaults() {
	return array(
		'phone'          => '+1 (903) 539-6840',
		'phone_raw'      => '+19035396840',
		'email'          => 'sales@charlestonpopeyecharters.com',
		'inquiry_email'  => '',
		'location'       => 'Charleston, South Carolina',
		'hero_eyebrow'   => 'Charleston, SC · Young Brothers · Est. 1979',
		'hero_title'     => 'Come Aboard a',
		'hero_title_em'  => 'Living Legend',
		'hero_text'      => 'Charter Popeye through Charleston Harbor — a handcrafted 1979 classic with a storied past, a rumored movie career, and soul to match.',
		'hero_note'      => "Rumored to be Popeye's own boat from the 1980 film",
		'hero_image'     => '',
		'footer_about'   => 'A classic 1979 Young Brothers lobster boat calling Charleston Harbor home — with a storied past, a rumored movie career, and soul to match. Come aboard and make some history of your own.',
		'footer_quote'   => '"I yam what I yam."',
		'sticky_bar'     => 1,
		'sticky_text'    => 'Spots fill fast — especially at sunset',
		'ga_id'          => '',
	);
}

/**
 * Read a theme option with its default.
 *
 * @param string $key Option key.
 * @return mixed
 */
function popeye_opt( $key ) {
	$defaults = popeye_defaults();
	return get_theme_mod( 'popeye_' . $key, isset( $defaults[ $key ] ) ? $defaults[ $key ] : '' );
}

/**
 * Static content block from inc/data/content.php.
 *
 * @param string $key faqs|testimonials|gallery|gallery_cats|expect.
 * @return array
 */
function popeye_content( $key ) {
	static $content = null;
	if ( null === $content ) {
		$content = require POPEYE_DIR . '/inc/data/content.php';
	}
	return apply_filters( 'popeye_content_' . $key, isset( $content[ $key ] ) ? $content[ $key ] : array() );
}

/**
 * URL of an image bundled with the theme (assets/images), or pass-through for full URLs.
 *
 * @param string $name File stem (".jpg" assumed) or file name, or an absolute URL.
 * @return string
 */
function popeye_img( $name ) {
	$name = trim( (string) $name );
	if ( '' === $name ) {
		return '';
	}
	if ( preg_match( '#^(https?:)?//#', $name ) || 0 === strpos( $name, '/' ) ) {
		return $name;
	}
	if ( ! preg_match( '/\.(jpe?g|png|webp|gif|svg)$/i', $name ) ) {
		$name .= '.jpg';
	}
	return get_theme_file_uri( 'assets/images/' . $name );
}

/**
 * Permalink of the page that uses a given page template, with a fallback path.
 *
 * @param string $template Template file, e.g. page-templates/book.php.
 * @param string $fallback Fallback path relative to home.
 * @return string
 */
function popeye_template_url( $template, $fallback ) {
	static $cache = array();
	if ( ! isset( $cache[ $template ] ) ) {
		$pages = get_posts(
			array(
				'post_type'      => 'page',
				'post_status'    => 'publish',
				'posts_per_page' => 1,
				'meta_key'       => '_wp_page_template', // phpcs:ignore WordPress.DB.SlowDBQuery
				'meta_value'     => $template, // phpcs:ignore WordPress.DB.SlowDBQuery
				'fields'         => 'ids',
			)
		);
		$cache[ $template ] = $pages ? get_permalink( $pages[0] ) : home_url( $fallback );
	}
	return $cache[ $template ];
}

/** Shortcuts for the main destination pages. */
function popeye_book_url() {
	return popeye_template_url( 'page-templates/book.php', '/book/' );
}
function popeye_contact_url() {
	return popeye_template_url( 'page-templates/contact.php', '/contact/' );
}
function popeye_story_url() {
	return popeye_template_url( 'page-templates/story.php', '/story/' );
}
function popeye_gallery_url() {
	return popeye_template_url( 'page-templates/gallery.php', '/gallery/' );
}
function popeye_elite_url() {
	return popeye_template_url( 'page-templates/elite.php', '/elite-cruises/' );
}
function popeye_experiences_url() {
	$url = get_post_type_archive_link( 'experience' );
	return $url ? $url : home_url( '/experiences/' );
}
function popeye_blog_url() {
	$id = (int) get_option( 'page_for_posts' );
	return $id ? get_permalink( $id ) : home_url( '/blog/' );
}

/**
 * Split a "Title | text" per-line textarea value into rows.
 *
 * @param string $value Raw value.
 * @return array[] Each row is an array of trimmed columns.
 */
function popeye_lines( $value ) {
	$rows = array();
	foreach ( preg_split( '/\r\n|\r|\n/', (string) $value ) as $line ) {
		$line = trim( $line );
		if ( '' === $line ) {
			continue;
		}
		$rows[] = array_map( 'trim', explode( '|', $line, 2 ) );
	}
	return $rows;
}

/**
 * Estimated reading time for a post.
 *
 * @param int|WP_Post|null $post Post.
 * @return int Minutes.
 */
function popeye_reading_time( $post = null ) {
	$words = str_word_count( wp_strip_all_tags( get_post_field( 'post_content', $post ) ) );
	return max( 1, (int) ceil( $words / 225 ) );
}

/**
 * Inline SVG icon.
 *
 * @param string $name Icon name.
 * @return string
 */
function popeye_icon( $name ) {
	$icons = array(
		'arrow'  => '<path d="M5 12h14M13 6l6 6-6 6"/>',
		'clock'  => '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
		'phone'  => '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
		'mail'   => '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
		'pin'    => '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
		'star'   => '<path fill="currentColor" stroke="none" d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
		'check'  => '<path d="M20 6 9 17l-5-5"/>',
		'chev'   => '<path d="m6 9 6 6 6-6"/>',
		'up'     => '<path d="m18 15-6-6-6 6"/>',
		'menu'   => '<path d="M3 6h18M3 12h18M3 18h18"/>',
		'close'  => '<path d="M18 6 6 18M6 6l12 12"/>',
		'anchor' => '<circle cx="12" cy="5" r="3"/><path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3"/>',
	);
	if ( ! isset( $icons[ $name ] ) ) {
		return '';
	}
	return '<svg class="icon icon-' . esc_attr( $name ) . '" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $icons[ $name ] . '</svg>';
}

/**
 * Echo a sanitized icon.
 *
 * @param string $name Icon name.
 */
function popeye_the_icon( $name ) {
	echo popeye_icon( $name ); // phpcs:ignore WordPress.Security.EscapeOutput -- static markup.
}
