<?php
/**
 * SEO: meta output, and cooperation with All in One SEO.
 *
 * The theme emits its own titles, descriptions, canonical, Open Graph and
 * JSON-LD when no SEO plugin is present. When AIOSEO (or Yoast, or Rank Math)
 * is active it steps aside, because two plugins emitting the same schema node
 * or two canonical tags is worse for ranking than either alone.
 *
 * What it keeps doing under AIOSEO is supply better *defaults*: AIOSEO free
 * has no idea an experience has a price, duration or skill level, so the
 * filters below build titles and descriptions from the real fields. Anything
 * typed by hand in AIOSEO still wins.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Whether a dedicated SEO plugin is handling output.
 *
 * @return bool
 */
function pt_seo_plugin_active() {
	return defined( 'AIOSEO_VERSION' )
		|| defined( 'WPSEO_VERSION' )
		|| defined( 'RANK_MATH_VERSION' )
		|| class_exists( 'AIOSEO\\Plugin\\AIOSEO' );
}

/**
 * Specifically AIOSEO.
 *
 * @return bool
 */
function pt_aioseo_active() {
	return defined( 'AIOSEO_VERSION' ) || class_exists( 'AIOSEO\\Plugin\\AIOSEO' );
}

/**
 * A description for the current object, built from real content.
 *
 * @param int $post_id Optional post ID.
 * @return string
 */
function pt_meta_description( $post_id = 0 ) {
	if ( is_front_page() ) {
		$hero = pt_filled( 'pt_hero_text' );
		return $hero ? $hero : get_bloginfo( 'description' );
	}

	if ( is_post_type_archive( PT_EXPERIENCE_POST_TYPE ) ) {
		return __( 'Book surf lessons, fishing charters, boat tours and wildlife trips in Tamarindo, Costa Rica with local certified guides.', 'palmtreesurf' );
	}

	if ( is_tax( array( 'experience_type', 'skill_level' ) ) ) {
		$term = get_queried_object();

		if ( $term && ! empty( $term->description ) ) {
			return $term->description;
		}

		if ( $term ) {
			return sprintf(
				/* translators: %s: category name. */
				__( '%s in Tamarindo, Costa Rica. Small groups, local certified guides, gear included. Check dates and book online.', 'palmtreesurf' ),
				$term->name
			);
		}
	}

	$post_id = $post_id ? $post_id : get_queried_object_id();

	if ( ! $post_id ) {
		return get_bloginfo( 'description' );
	}

	$excerpt = get_the_excerpt( $post_id );

	if ( $excerpt ) {
		// Enrich an experience excerpt with the facts a searcher scans for.
		if ( PT_EXPERIENCE_POST_TYPE === get_post_type( $post_id ) ) {
			$bits = array_filter(
				array(
					pt_field( $post_id, 'duration' ),
					pt_field( $post_id, 'group_size' ),
				)
			);

			if ( $bits ) {
				$excerpt = rtrim( $excerpt, '. ' ) . '. ' . implode( ' · ', $bits ) . '.';
			}
		}

		return wp_trim_words( $excerpt, 30, '' );
	}

	return wp_trim_words( wp_strip_all_tags( get_post_field( 'post_content', $post_id ) ), 30, '' );
}

/**
 * The social sharing image for the current view.
 *
 * @return string
 */
function pt_share_image() {
	if ( is_singular() && has_post_thumbnail() ) {
		$url = get_the_post_thumbnail_url( get_queried_object_id(), 'pt-hero' );
		if ( $url ) {
			return $url;
		}
	}

	$hero = (int) get_theme_mod( 'pt_hero_image', 0 );
	if ( $hero ) {
		$url = wp_get_attachment_image_url( $hero, 'pt-hero' );
		if ( $url ) {
			return $url;
		}
	}

	return function_exists( 'pt_hero_poster_url' ) ? pt_hero_poster_url() : '';
}

/**
 * Print description, canonical, Open Graph and Twitter tags.
 *
 * Skipped entirely when an SEO plugin is active — it owns these.
 */
function pt_print_meta_tags() {
	if ( pt_seo_plugin_active() ) {
		return;
	}

	$description = pt_meta_description();

	if ( $description ) {
		printf( '<meta name="description" content="%s" />' . "\n", esc_attr( $description ) );
	}

	$canonical = '';

	if ( is_singular() ) {
		$canonical = get_permalink();
	} elseif ( is_post_type_archive() ) {
		$canonical = get_post_type_archive_link( get_query_var( 'post_type' ) );
	} elseif ( is_tax() || is_category() || is_tag() ) {
		$term = get_queried_object();
		if ( $term ) {
			$link = get_term_link( $term );
			$canonical = is_wp_error( $link ) ? '' : $link;
		}
	} elseif ( is_front_page() ) {
		$canonical = home_url( '/' );
	}

	if ( $canonical ) {
		printf( '<link rel="canonical" href="%s" />' . "\n", esc_url( $canonical ) );
	}

	$title = wp_get_document_title();
	$image = pt_share_image();

	printf( '<meta property="og:site_name" content="%s" />' . "\n", esc_attr( get_bloginfo( 'name' ) ) );
	printf( '<meta property="og:type" content="%s" />' . "\n", esc_attr( is_singular() ? 'article' : 'website' ) );
	printf( '<meta property="og:title" content="%s" />' . "\n", esc_attr( $title ) );

	if ( $description ) {
		printf( '<meta property="og:description" content="%s" />' . "\n", esc_attr( $description ) );
	}

	if ( $canonical ) {
		printf( '<meta property="og:url" content="%s" />' . "\n", esc_url( $canonical ) );
	}

	if ( $image ) {
		printf( '<meta property="og:image" content="%s" />' . "\n", esc_url( $image ) );
		echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";
	} else {
		echo '<meta name="twitter:card" content="summary" />' . "\n";
	}

	printf( '<meta name="twitter:title" content="%s" />' . "\n", esc_attr( $title ) );

	if ( $description ) {
		printf( '<meta name="twitter:description" content="%s" />' . "\n", esc_attr( $description ) );
	}
}
add_action( 'wp_head', 'pt_print_meta_tags', 5 );

/* -------------------------------------------------------------------------
 * All in One SEO cooperation
 * ---------------------------------------------------------------------- */

/**
 * Give AIOSEO a better default title for an experience.
 *
 * Only applies when nothing has been typed in AIOSEO for that post.
 *
 * @param string $title Title AIOSEO computed.
 * @return string
 */
function pt_aioseo_title( $title ) {
	if ( ! is_singular( PT_EXPERIENCE_POST_TYPE ) ) {
		return $title;
	}

	$post_id  = get_queried_object_id();
	$duration = pt_field( $post_id, 'duration' );

	// A title that answers "what, where, how long" reads better in results.
	$parts = array_filter(
		array(
			get_the_title( $post_id ),
			$duration ? $duration : '',
			__( 'Tamarindo, Costa Rica', 'palmtreesurf' ),
		)
	);

	return implode( ' | ', $parts ) . ' - ' . get_bloginfo( 'name' );
}
add_filter( 'aioseo_title', 'pt_aioseo_title' );

/**
 * Give AIOSEO a better default description.
 *
 * @param string $description Description AIOSEO computed.
 * @return string
 */
function pt_aioseo_description( $description ) {
	$ours = pt_meta_description();

	// Never override something a human typed in AIOSEO.
	if ( $description && strlen( $description ) > 20 ) {
		return $description;
	}

	return $ours ? $ours : $description;
}
add_filter( 'aioseo_description', 'pt_aioseo_description' );

/**
 * Make sure experiences are in the AIOSEO sitemap.
 *
 * @param array $types Included post types.
 * @return array
 */
function pt_aioseo_sitemap_types( $types ) {
	if ( is_array( $types ) && ! in_array( PT_EXPERIENCE_POST_TYPE, $types, true ) ) {
		$types[] = PT_EXPERIENCE_POST_TYPE;
	}

	return $types;
}
add_filter( 'aioseo_sitemap_post_types', 'pt_aioseo_sitemap_types' );

add_filter( 'wp_sitemaps_post_types', 'pt_filter_core_sitemap_types' );

/**
 * Disable core sitemaps entirely while an SEO plugin owns them.
 *
 * @param array $post_types Core sitemap post types.
 * @return array
 */
function pt_filter_core_sitemap_types( $post_types ) {
	if ( pt_seo_plugin_active() ) {
		return array();
	}

	return $post_types;
}
