<?php
/**
 * Journal articles that ship with the theme (content/posts/*.html).
 *
 * Each file starts with a front-matter comment (title, slug, excerpt, category, tags, image) and
 * holds plain HTML with image placeholders: <!-- img: file.jpg | alt | caption -->. On the first
 * admin visit after the theme is installed or updated, the articles are published with their photos
 * (from assets/img) added to the media library. Articles you edit afterwards are never overwritten;
 * articles you delete stay deleted.
 *
 * Articles live at /<journal page>/<slug>/ (default /blog/<slug>/) and carry Article and FAQ
 * structured data.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

/** Bump when the files in content/posts change, so sites pick the changes up. */
define( 'WHR_BLOG_VERSION', 1 );

/**
 * Parse one article file.
 *
 * @param string $file Path.
 * @return array|null title, slug, excerpt, keyword, category, tags, image, alt, body.
 */
function whr_blog_parse( $file ) {
	$raw = file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local theme file.
	if ( ! $raw || ! preg_match( '/^\s*<!--(.*?)-->/s', $raw, $m ) ) {
		return null;
	}
	$meta = array();
	foreach ( preg_split( '/\R/', trim( $m[1] ) ) as $line ) {
		if ( preg_match( '/^([a-z]+):\s*(.*)$/i', trim( $line ), $kv ) ) {
			$meta[ strtolower( $kv[1] ) ] = trim( $kv[2] );
		}
	}
	if ( empty( $meta['title'] ) || empty( $meta['slug'] ) ) {
		return null;
	}
	$image       = isset( $meta['image'] ) ? array_map( 'trim', explode( '|', $meta['image'] ) ) : array( '' );
	$meta['image'] = $image[0];
	$meta['alt']   = isset( $image[1] ) ? $image[1] : '';
	$meta['body']  = trim( substr( $raw, strlen( $m[0] ) ) );
	$meta['file']  = basename( $file );
	return $meta + array( 'excerpt' => '', 'keyword' => '', 'category' => 'Guides', 'tags' => '' );
}

/**
 * All bundled articles, in file order.
 *
 * @return array
 */
function whr_blog_articles() {
	$out = array();
	foreach ( (array) glob( WHR_DIR . '/content/posts/*.html' ) as $file ) {
		$a = whr_blog_parse( $file );
		if ( $a ) {
			$out[] = $a;
		}
	}
	return $out;
}

/**
 * Add a theme photo to the media library once, and reuse it after that.
 *
 * @param string $file File name in assets/img.
 * @param string $alt  Alt text.
 * @return int Attachment ID or 0.
 */
function whr_blog_image( $file, $alt = '' ) {
	$file = sanitize_file_name( $file );
	$map  = get_option( 'whr_blog_media', array() );
	if ( ! empty( $map[ $file ] ) && get_post( $map[ $file ] ) ) {
		return (int) $map[ $file ];
	}
	$src = WHR_DIR . '/assets/img/' . $file;
	if ( ! $file || ! file_exists( $src ) ) {
		return 0;
	}
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$tmp = wp_tempnam( $file );
	copy( $src, $tmp );
	$id = media_handle_sideload( array( 'name' => $file, 'tmp_name' => $tmp ), 0 );
	if ( is_wp_error( $id ) ) {
		wp_delete_file( $tmp );
		return 0;
	}
	if ( $alt ) {
		update_post_meta( $id, '_wp_attachment_image_alt', $alt );
	}
	$map[ $file ] = $id;
	update_option( 'whr_blog_media', $map, false );
	return (int) $id;
}

/**
 * Turn the article's image placeholders into figures.
 *
 * @param string $body HTML.
 * @return string
 */
function whr_blog_render_images( $body ) {
	return preg_replace_callback(
		'/<!--\s*img:\s*(.*?)\s*-->/s',
		function ( $m ) {
			$parts = array_map( 'trim', explode( '|', $m[1] ) );
			$alt   = isset( $parts[1] ) ? $parts[1] : '';
			$cap   = isset( $parts[2] ) ? $parts[2] : '';
			$id    = whr_blog_image( $parts[0], $alt );
			if ( ! $id ) {
				return '';
			}
			$img = wp_get_attachment_image( $id, 'whr-wide', false, array( 'alt' => $alt, 'class' => 'wp-image-' . $id ) );
			return '<figure class="wp-block-image size-large entry-figure">' . $img . ( $cap ? '<figcaption>' . esc_html( $cap ) . '</figcaption>' : '' ) . '</figure>';
		},
		$body
	);
}

/**
 * The questions and answers under the article's "FAQ" heading.
 *
 * @param string $html Article HTML.
 * @return array[] question, answer.
 */
function whr_blog_faqs( $html ) {
	if ( ! preg_match( '/<h2[^>]*>[^<]*(?:FAQ|Frequently asked)[^<]*<\/h2>(.*?)(?=<h2|<aside|$)/is', $html, $m ) ) {
		return array();
	}
	$faqs = array();
	if ( preg_match_all( '/<h3[^>]*>(.*?)<\/h3>(.*?)(?=<h3|$)/is', $m[1], $qs, PREG_SET_ORDER ) ) {
		foreach ( $qs as $q ) {
			$answer = trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( $q[2] ) ) );
			if ( $answer ) {
				$faqs[] = array( 'question' => wp_strip_all_tags( $q[1] ), 'answer' => $answer );
			}
		}
	}
	return $faqs;
}

/**
 * Publish one article (or refresh it if nobody has edited it since we last wrote it).
 *
 * @param array $a Parsed article.
 * @return string created|updated|kept|skipped
 */
function whr_blog_publish( $a ) {
	$done = get_option( 'whr_blog_done', array() );
	$hash = md5( wp_json_encode( $a ) );
	if ( isset( $done[ $a['slug'] ] ) && $done[ $a['slug'] ]['hash'] === $hash ) {
		return 'kept';
	}

	$existing = get_posts( array( 'post_type' => 'post', 'name' => $a['slug'], 'post_status' => 'any', 'numberposts' => 1 ) );
	$post     = $existing ? $existing[0] : null;
	if ( ! $post && isset( $done[ $a['slug'] ] ) ) {
		return 'skipped'; // Deleted by the site owner: leave it deleted.
	}
	if ( $post && ( ! isset( $done[ $a['slug'] ] ) || md5( $post->post_content ) !== $done[ $a['slug'] ]['content'] ) ) {
		$done[ $a['slug'] ] = array( 'hash' => $hash, 'content' => '' );
		update_option( 'whr_blog_done', $done, false );
		return 'kept'; // A post of the owner's own, or edited since: never overwrite.
	}

	$cat = get_term_by( 'name', $a['category'], 'category' );
	if ( ! $cat ) {
		$made = wp_insert_term( $a['category'], 'category' );
		$cat  = is_wp_error( $made ) ? null : get_term( $made['term_id'], 'category' );
	}
	$content = whr_blog_render_images( $a['body'] );
	$data    = array(
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'post_title'     => $a['title'],
		'post_name'      => $a['slug'],
		'post_excerpt'   => $a['excerpt'],
		'post_content'   => $content,
		'post_category'  => $cat ? array( (int) $cat->term_id ) : array(),
		'tags_input'     => array_filter( array_map( 'trim', explode( ',', $a['tags'] ) ) ),
		'comment_status' => 'closed',
		'ping_status'    => 'closed',
	);
	if ( $post ) {
		$data['ID'] = $post->ID;
		$id         = wp_update_post( wp_slash( $data ), true );
	} else {
		// Stagger dates a day apart so the journal reads in order, newest last in the series.
		$data['post_date'] = gmdate( 'Y-m-d H:i:s', current_time( 'timestamp' ) - ( 11 - (int) $a['file'] ) * DAY_IN_SECONDS ); // phpcs:ignore WordPress.DateTime.CurrentTimeTimestamp.Requested
		$id                = wp_insert_post( wp_slash( $data ), true );
	}
	if ( is_wp_error( $id ) || ! $id ) {
		return 'skipped';
	}
	$thumb = whr_blog_image( $a['image'], $a['alt'] );
	if ( $thumb ) {
		set_post_thumbnail( $id, $thumb );
	}
	update_post_meta( $id, '_whr_blog', $a['file'] );
	update_post_meta( $id, '_whr_faq', whr_blog_faqs( $content ) );
	if ( $a['keyword'] ) {
		update_post_meta( $id, '_whr_keyword', $a['keyword'] );
	}

	$done[ $a['slug'] ] = array( 'hash' => $hash, 'content' => md5( get_post_field( 'post_content', $id, 'raw' ) ) );
	update_option( 'whr_blog_done', $done, false );
	return $post ? 'updated' : 'created';
}

/**
 * Make sure the journal has a page of its own at /blog/ and the homepage stays the theme's homepage.
 */
function whr_blog_setup_pages() {
	$journal = (int) get_option( 'page_for_posts' );
	if ( $journal && 'page' === get_post_type( $journal ) && 'publish' === get_post_status( $journal ) && 'page' === get_option( 'show_on_front' ) ) {
		return;
	}
	$page = get_page_by_path( 'blog' );
	if ( ! $page ) {
		$id   = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => __( 'Journal', 'wehaverehabs' ), 'post_name' => 'blog' ) );
		$page = $id ? get_post( $id ) : null;
	}
	if ( ! $page ) {
		return;
	}
	if ( 'page' !== get_option( 'show_on_front' ) || ! get_option( 'page_on_front' ) ) {
		$home = get_page_by_path( 'home' );
		if ( ! $home ) {
			$hid  = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => __( 'Home', 'wehaverehabs' ), 'post_name' => 'home' ) );
			$home = $hid ? get_post( $hid ) : null;
		}
		if ( ! $home ) {
			return;
		}
		update_option( 'page_on_front', $home->ID ); // front-page.php renders it, so the homepage looks the same.
		update_option( 'show_on_front', 'page' );
	}
	update_option( 'page_for_posts', $page->ID );
}

/**
 * Publish articles for up to $seconds; returns true when all are done.
 *
 * @param int $seconds Time box.
 * @return bool
 */
function whr_blog_sync( $seconds = 15 ) {
	if ( get_transient( 'whr_blog_lock' ) ) {
		return false;
	}
	set_transient( 'whr_blog_lock', 1, 60 );
	$start = microtime( true );
	whr_blog_setup_pages();
	$all_done = true;
	foreach ( whr_blog_articles() as $a ) {
		if ( microtime( true ) - $start > $seconds ) {
			$all_done = false;
			break;
		}
		whr_blog_publish( $a );
	}
	delete_transient( 'whr_blog_lock' );
	if ( $all_done ) {
		update_option( 'whr_blog_version', WHR_BLOG_VERSION );
		flush_rewrite_rules( false );
	}
	return $all_done;
}

add_action(
	'admin_init',
	function () {
		if ( (int) get_option( 'whr_blog_version' ) >= WHR_BLOG_VERSION || wp_doing_ajax() || ! current_user_can( 'publish_posts' ) ) {
			return;
		}
		if ( ! whr_blog_sync( 12 ) ) {
			whr_loopback_kick( 'whr_blog_sync' );
		}
	}
);
foreach ( array( 'wp_ajax_whr_blog_sync', 'wp_ajax_nopriv_whr_blog_sync' ) as $whr_blog_hook ) {
	add_action(
		$whr_blog_hook,
		function () {
			$token = isset( $_POST['token'] ) ? sanitize_text_field( wp_unslash( $_POST['token'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- loopback request authenticated by token.
			if ( $token && hash_equals( (string) get_option( 'whr_autoimport_token' ), $token ) ) {
				ignore_user_abort( true );
				if ( ! whr_blog_sync( 20 ) ) {
					whr_loopback_kick( 'whr_blog_sync' );
				}
			}
			wp_die( '', '', array( 'response' => 200 ) );
		}
	);
}

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command(
		'whr-blog',
		function () {
			delete_option( 'whr_blog_version' );
			while ( ! whr_blog_sync( 60 ) ) {
				WP_CLI::log( '…' );
			}
			WP_CLI::success( 'Journal articles are up to date.' );
		}
	);
}

/* ---------------------------------------------------------------------------
 * Pretty article URLs under the journal page: /blog/<slug>/
 * ------------------------------------------------------------------------- */

/**
 * The journal page's path (e.g. "blog"), or '' when articles keep WordPress's own URLs.
 *
 * @return string
 */
function whr_blog_base() {
	static $base = null;
	if ( null === $base ) {
		$base    = '';
		$journal = (int) get_option( 'page_for_posts' );
		if ( $journal && get_option( 'permalink_structure' ) && 'publish' === get_post_status( $journal ) ) {
			$base = get_page_uri( $journal );
		}
	}
	return $base;
}

add_action(
	'init',
	function () {
		$base = whr_blog_base();
		if ( $base ) {
			add_rewrite_rule( '^' . preg_quote( $base, '/' ) . '/([^/]+)/?$', 'index.php?name=$matches[1]', 'top' );
		}
	}
);
add_filter(
	'post_link',
	function ( $link, $post ) {
		$base = whr_blog_base();
		if ( $base && 'publish' === $post->post_status && $post->post_name ) {
			return home_url( user_trailingslashit( $base . '/' . $post->post_name ) );
		}
		return $link;
	},
	10,
	2
);
/* Rules change when the journal page or permalink setting changes. */
foreach ( array( 'update_option_page_for_posts', 'update_option_permalink_structure' ) as $whr_blog_opt ) {
	add_action(
		$whr_blog_opt,
		function () {
			update_option( 'whr_blog_flush', 1 );
		}
	);
}
add_action(
	'init',
	function () {
		if ( get_option( 'whr_blog_flush' ) ) {
			delete_option( 'whr_blog_flush' );
			flush_rewrite_rules( false );
		}
	},
	99
);

/* ---------------------------------------------------------------------------
 * Reading: links, headings, contents list, structured data.
 * ------------------------------------------------------------------------- */

/**
 * Site-relative links in bundled articles point at the right place even when WordPress lives in a
 * subfolder, and links between articles follow each article's real address.
 */
add_filter(
	'the_content',
	function ( $html ) {
		if ( ! is_singular( 'post' ) || ! get_post_meta( get_the_ID(), '_whr_blog', true ) ) {
			return $html;
		}
		$html = preg_replace_callback(
			'/href="\/(blog\/([a-z0-9-]+)\/|[a-z0-9\/-]*)"/',
			function ( $m ) {
				if ( ! empty( $m[2] ) ) {
					$target = get_posts( array( 'post_type' => 'post', 'name' => $m[2], 'numberposts' => 1, 'fields' => 'ids' ) );
					if ( $target ) {
						return 'href="' . esc_url( get_permalink( $target[0] ) ) . '"';
					}
					return 'href="' . esc_url( home_url( '/' ) ) . '"';
				}
				return 'href="' . esc_url( home_url( '/' . $m[1] ) ) . '"';
			},
			$html
		);
		// Anchors on the H2s for the contents list.
		$html = preg_replace_callback(
			'/<h2>(.*?)<\/h2>/s',
			function ( $m ) {
				return '<h2 id="' . esc_attr( sanitize_title( wp_strip_all_tags( $m[1] ) ) ) . '">' . $m[1] . '</h2>';
			},
			$html
		);
		return $html;
	},
	9
);

/**
 * Contents list for a long article.
 *
 * @param int $post_id Post.
 * @return string HTML.
 */
function whr_blog_toc( $post_id = 0 ) {
	$content = get_post_field( 'post_content', $post_id ? $post_id : get_the_ID() );
	if ( ! preg_match_all( '/<h2[^>]*>(.*?)<\/h2>/s', $content, $m ) || count( $m[1] ) < 4 ) {
		return '';
	}
	$out = '<nav class="entry-toc" aria-label="' . esc_attr__( 'In this article', 'wehaverehabs' ) . '"><p class="eyebrow">' . esc_html__( 'In this article', 'wehaverehabs' ) . '</p><ol>';
	foreach ( $m[1] as $h ) {
		$text = wp_strip_all_tags( $h );
		$out .= '<li><a href="#' . esc_attr( sanitize_title( $text ) ) . '">' . esc_html( $text ) . '</a></li>';
	}
	return $out . '</ol></nav>';
}

/**
 * Minutes to read.
 *
 * @param int $post_id Post.
 * @return int
 */
function whr_reading_minutes( $post_id = 0 ) {
	$words = str_word_count( wp_strip_all_tags( get_post_field( 'post_content', $post_id ? $post_id : get_the_ID() ) ) );
	return max( 1, (int) round( $words / 230 ) );
}

add_action(
	'wp_head',
	function () {
		if ( ! is_singular( 'post' ) ) {
			return;
		}
		$id    = get_the_ID();
		$graph = array();
		if ( ! defined( 'WPSEO_VERSION' ) && ! defined( 'RANK_MATH_VERSION' ) ) {
			printf( '<meta name="description" content="%s">' . "\n", esc_attr( wp_strip_all_tags( get_the_excerpt( $id ) ) ) );
			printf( '<link rel="canonical" href="%s">' . "\n", esc_url( get_permalink( $id ) ) );
			$graph[] = array(
				'@type'            => 'Article',
				'headline'         => get_the_title( $id ),
				'description'      => wp_strip_all_tags( get_the_excerpt( $id ) ),
				'image'            => get_the_post_thumbnail_url( $id, 'whr-wide' ),
				'datePublished'    => get_the_date( 'c', $id ),
				'dateModified'     => get_the_modified_date( 'c', $id ),
				'mainEntityOfPage' => get_permalink( $id ),
				'author'           => array( '@type' => 'Organization', 'name' => get_bloginfo( 'name' ), 'url' => home_url( '/' ) ),
				'publisher'        => array(
					'@type' => 'Organization',
					'name'  => get_bloginfo( 'name' ),
					'logo'  => array( '@type' => 'ImageObject', 'url' => WHR_URI . '/assets/brand/apple-touch-icon.png' ),
				),
			);
		}
		$faqs = get_post_meta( $id, '_whr_faq', true );
		if ( $faqs && is_array( $faqs ) ) {
			$graph[] = array(
				'@type'      => 'FAQPage',
				'mainEntity' => array_map(
					function ( $f ) {
						return array( '@type' => 'Question', 'name' => $f['question'], 'acceptedAnswer' => array( '@type' => 'Answer', 'text' => $f['answer'] ) );
					},
					$faqs
				),
			);
		}
		if ( $graph ) {
			echo '<script type="application/ld+json">' . wp_json_encode( array( '@context' => 'https://schema.org', '@graph' => $graph ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "</script>\n";
		}
	},
	6
);

/* The theme already prints a canonical link for single posts through core; avoid a duplicate. */
add_action(
	'wp',
	function () {
		if ( is_singular( 'post' ) && ! defined( 'WPSEO_VERSION' ) && ! defined( 'RANK_MATH_VERSION' ) ) {
			remove_action( 'wp_head', 'rel_canonical' );
		}
	}
);
