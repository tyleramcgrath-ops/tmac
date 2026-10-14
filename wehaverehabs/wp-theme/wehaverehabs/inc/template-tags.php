<?php
/**
 * Small helpers used by the templates.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

/**
 * URL of a file in the theme's assets folder.
 *
 * @param string $path Path inside assets/.
 * @return string
 */
function whr_asset( $path ) {
	return WHR_URI . '/assets/' . ltrim( $path, '/' );
}

/**
 * Get a sanctuary meta value.
 *
 * @param string   $key     Meta key without the whr_ prefix.
 * @param int|null $post_id Post ID.
 * @return mixed
 */
function whr_meta( $key, $post_id = null ) {
	return get_post_meta( $post_id ? $post_id : get_the_ID(), 'whr_' . $key, true );
}

/**
 * Split a "one per line, columns separated by |" field into rows.
 *
 * @param string $raw  Raw text.
 * @param int    $cols Columns to return per row (missing ones are '').
 * @return array[]
 */
function whr_rows( $raw, $cols = 2 ) {
	$rows = array();
	foreach ( preg_split( '/\r\n|\r|\n/', (string) $raw ) as $line ) {
		$line = trim( $line );
		if ( '' === $line ) {
			continue;
		}
		$parts = array_map( 'trim', explode( '|', $line ) );
		$rows[] = array_pad( array_slice( $parts, 0, $cols ), $cols, '' );
	}
	return $rows;
}

/**
 * Attachment IDs from a sanctuary's gallery field.
 *
 * @param int|null $post_id Post ID.
 * @return int[]
 */
function whr_gallery_ids( $post_id = null ) {
	return array_values( array_filter( array_map( 'absint', explode( ',', (string) whr_meta( 'gallery', $post_id ) ) ) ) );
}

/**
 * Image tag for an attachment, falling back to a bundled photo so layouts never collapse.
 *
 * @param int    $attachment_id Attachment ID (0 for fallback).
 * @param string $size          Image size.
 * @param array  $attr          Extra attributes.
 * @param string $fallback      Fallback file name in assets/img/.
 * @return string
 */
function whr_image( $attachment_id, $size = 'large', $attr = array(), $fallback = 'palapa.jpg' ) {
	$attr = wp_parse_args( $attr, array( 'loading' => 'lazy', 'decoding' => 'async' ) );
	if ( $attachment_id && wp_attachment_is_image( $attachment_id ) ) {
		return wp_get_attachment_image( $attachment_id, $size, false, $attr );
	}
	$html = '<img src="' . esc_url( whr_asset( 'img/' . $fallback ) ) . '"';
	foreach ( $attr as $k => $v ) {
		$html .= ' ' . esc_attr( $k ) . '="' . esc_attr( $v ) . '"';
	}
	if ( ! isset( $attr['alt'] ) ) {
		$html .= ' alt=""';
	}
	return $html . '>';
}

/**
 * Hero image of a post.
 *
 * @param int|null $post_id Post ID.
 * @param string   $size    Image size.
 * @param array    $attr    Attributes.
 * @return string
 */
function whr_post_image( $post_id = null, $size = 'whr-card', $attr = array() ) {
	$post_id = $post_id ? $post_id : get_the_ID();
	$thumb   = (int) get_post_thumbnail_id( $post_id );
	if ( ! $thumb && 'sanctuary' === get_post_type( $post_id ) ) {
		// No photos yet (e.g. an unclaimed public listing): a neutral brand panel, never a stock photo
		// that could be mistaken for the facility.
		$class = trim( 'whr-placeholder ' . ( isset( $attr['class'] ) ? $attr['class'] : '' ) );
		return '<img src="' . esc_url( whr_asset( 'brand/placeholder.svg' ) ) . '" alt="" class="' . esc_attr( $class ) . '" loading="lazy">';
	}
	return whr_image( $thumb, $size, $attr );
}

/**
 * Whether a listing is managed by the facility (or was created by the site team).
 * Imported public listings stay "unclaimed" until an admin approves a claim.
 *
 * @param int|null $post_id Post ID.
 * @return bool
 */
function whr_is_claimed( $post_id = null ) {
	$source = whr_meta( 'source', $post_id );
	return (bool) whr_meta( 'claimed', $post_id ) || '' === $source || 'manual' === $source;
}

/**
 * Attribution line for an imported listing.
 *
 * @param int|null $post_id Post ID.
 * @return string Escaped HTML.
 */
function whr_source_note( $post_id = null ) {
	$source = whr_meta( 'source', $post_id );
	$date   = whr_meta( 'source_date', $post_id );
	$when   = $date ? date_i18n( 'F Y', strtotime( $date ) ) : '';
	$url    = whr_meta( 'source_url', $post_id );
	switch ( $source ) {
		case 'samhsa':
			$text = sprintf(
				/* translators: %s: month and year */
				__( 'Details from the US government’s public FindTreatment.gov locator (SAMHSA), retrieved %s. SAMHSA does not endorse this site or this listing.', 'wehaverehabs' ),
				$when
			);
			break;
		case 'cqc':
			$text = sprintf(
				/* translators: %s: month and year */
				__( 'Details from the Care Quality Commission directory, retrieved %s. Contains public sector information licensed under the Open Government Licence v3.0.', 'wehaverehabs' ),
				$when
			);
			break;
		case 'web':
			$text = sprintf(
				/* translators: %s: month and year */
				__( 'Compiled from the facility’s public website, %s.', 'wehaverehabs' ),
				$when
			);
			break;
		default:
			return '';
	}
	$html = esc_html( $text );
	if ( $url ) {
		$html .= ' <a href="' . esc_url( $url ) . '" target="_blank" rel="noopener nofollow">' . esc_html__( 'Source', 'wehaverehabs' ) . '</a>';
	}
	return $html;
}

/**
 * Hero image of a destination (or other) term.
 *
 * @param WP_Term $term Term.
 * @param string  $size Size.
 * @param array   $attr Attributes.
 * @return string
 */
function whr_term_image( $term, $size = 'whr-card', $attr = array() ) {
	return whr_image( (int) get_term_meta( $term->term_id, 'whr_image', true ), $size, $attr );
}

/**
 * "From $X / week" or "Rates on request".
 *
 * @param int|null $post_id Post ID.
 * @return string Escaped HTML.
 */
function whr_price_html( $post_id = null ) {
	$price = (int) whr_meta( 'price_from', $post_id );
	if ( ! $price ) {
		return esc_html__( 'Rates on request', 'wehaverehabs' );
	}
	$currency = strtoupper( whr_meta( 'currency', $post_id ) ? whr_meta( 'currency', $post_id ) : 'USD' );
	$symbols  = array( 'USD' => '$', 'EUR' => '€', 'GBP' => '£', 'CAD' => 'CA$', 'AUD' => 'A$', 'CRC' => '₡', 'MXN' => 'MX$' );
	$amount   = isset( $symbols[ $currency ] ) ? $symbols[ $currency ] . number_format_i18n( $price ) : number_format_i18n( $price ) . ' ' . $currency;
	/* translators: %s: formatted price */
	return sprintf( esc_html__( 'from %s', 'wehaverehabs' ), '<strong>' . esc_html( $amount ) . '</strong>' ) . ' <span>/ ' . esc_html__( 'week', 'wehaverehabs' ) . '</span>';
}

/**
 * "14 – 30 nights".
 *
 * @param int|null $post_id Post ID.
 * @return string
 */
function whr_stay_text( $post_id = null ) {
	$min = (int) whr_meta( 'stay_min', $post_id );
	$max = (int) whr_meta( 'stay_max', $post_id );
	if ( $min && $max && $min !== $max ) {
		/* translators: 1: min nights 2: max nights */
		return sprintf( __( '%1$d – %2$d nights', 'wehaverehabs' ), $min, $max );
	}
	if ( $min || $max ) {
		/* translators: %d: nights */
		return sprintf( _n( '%d night', '%d nights', max( $min, $max ), 'wehaverehabs' ), max( $min, $max ) );
	}
	return '';
}

/**
 * First term of a taxonomy for a post.
 *
 * @param string   $taxonomy Taxonomy.
 * @param int|null $post_id  Post ID.
 * @return WP_Term|null
 */
function whr_first_term( $taxonomy, $post_id = null ) {
	$terms = get_the_terms( $post_id ? $post_id : get_the_ID(), $taxonomy );
	return ( $terms && ! is_wp_error( $terms ) ) ? $terms[0] : null;
}

/**
 * Comma list of term names.
 *
 * @param string   $taxonomy Taxonomy.
 * @param int|null $post_id  Post ID.
 * @param string   $sep      Separator.
 * @return string
 */
function whr_term_names( $taxonomy, $post_id = null, $sep = ' · ' ) {
	$terms = get_the_terms( $post_id ? $post_id : get_the_ID(), $taxonomy );
	if ( ! $terms || is_wp_error( $terms ) ) {
		return '';
	}
	return implode( $sep, wp_list_pluck( $terms, 'name' ) );
}

/**
 * Care-level badge.
 *
 * @param int|null $post_id Post ID.
 * @return string
 */
function whr_care_badge( $post_id = null ) {
	$care = whr_first_term( 'care_level', $post_id );
	if ( ! $care ) {
		return '';
	}
	$class = 'retreat' === $care->slug ? 'badge badge--retreat' : 'badge';
	return '<span class="' . esc_attr( $class ) . '">' . esc_html( $care->name ) . '</span>';
}

/**
 * Location label, falling back to the destination terms.
 *
 * @param int|null $post_id Post ID.
 * @return string
 */
function whr_location( $post_id = null ) {
	$label = whr_meta( 'location', $post_id );
	return $label ? $label : whr_term_names( 'destination', $post_id );
}

/**
 * Number of published sanctuaries in a term, including child terms.
 *
 * @param WP_Term $term Term.
 * @return int
 */
function whr_term_count( $term ) {
	$cache_key = 'whr_count_' . $term->term_id . '_' . (int) get_option( 'whr_count_gen', 0 );
	$cached    = get_transient( $cache_key );
	if ( false !== $cached ) {
		return (int) $cached;
	}
	$q = new WP_Query(
		array(
			'post_type'      => 'sanctuary',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'no_found_rows'  => false,
			'tax_query'      => array( array( 'taxonomy' => $term->taxonomy, 'terms' => $term->term_id, 'include_children' => true ) ), // phpcs:ignore WordPress.DB.SlowDBQuery
		)
	);
	set_transient( $cache_key, (int) $q->found_posts, 12 * HOUR_IN_SECONDS );
	return (int) $q->found_posts;
}

/** Invalidate cached counts whenever a sanctuary changes. */
function whr_bump_count_generation() {
	update_option( 'whr_count_gen', (int) get_option( 'whr_count_gen', 0 ) + 1, false );
}
add_action( 'save_post_sanctuary', 'whr_bump_count_generation' );
add_action( 'before_delete_post', function ( $post_id ) {
	if ( 'sanctuary' === get_post_type( $post_id ) ) {
		whr_bump_count_generation();
	}
} );

/**
 * "3 sanctuaries".
 *
 * @param WP_Term $term Term.
 * @return string
 */
function whr_count_label( $term ) {
	$n = whr_term_count( $term );
	/* translators: %s: number of sanctuaries */
	return sprintf( _n( '%s sanctuary', '%s sanctuaries', $n, 'wehaverehabs' ), number_format_i18n( $n ) );
}

/**
 * Link to the search results page with filters applied.
 *
 * @param array $args Query args (dest, need, care, stay, budget, setting).
 * @return string
 */
function whr_search_url( $args = array() ) {
	return add_query_arg( array_filter( $args ), get_post_type_archive_link( 'sanctuary' ) );
}

/**
 * Site-wide setting from the Customizer.
 *
 * @param string $key     Setting name without prefix.
 * @param string $default Default.
 * @return string
 */
function whr_option( $key, $default = '' ) {
	$value = get_theme_mod( 'whr_' . $key, $default );
	return '' === $value ? $default : $value;
}

/**
 * WhatsApp link for a number.
 *
 * @param string $number Digits.
 * @param string $text   Prefilled message.
 * @return string
 */
function whr_whatsapp_url( $number, $text = '' ) {
	$digits = preg_replace( '/\D+/', '', (string) $number );
	if ( ! $digits ) {
		return '';
	}
	return 'https://wa.me/' . $digits . ( $text ? '?text=' . rawurlencode( $text ) : '' );
}

/**
 * Logo image tags for the header (light and dark variants; CSS shows one).
 */
function whr_header_logo() {
	printf(
		'<a class="site-logo" href="%1$s" rel="home"><img class="logo-light" src="%2$s" alt="%4$s" width="243" height="84"><img class="logo-dark" src="%3$s" alt="%4$s" width="580" height="64"></a>',
		esc_url( home_url( '/' ) ),
		esc_url( whr_asset( 'brand/logo-primary-reversed.svg' ) ),
		esc_url( whr_asset( 'brand/logo-horizontal.svg' ) ),
		esc_attr( get_bloginfo( 'name' ) )
	);
}

/**
 * Render the term options for a filter <select>.
 *
 * @param string $taxonomy Taxonomy.
 * @param string $selected Selected slug.
 * @param bool   $nested   Indent child terms.
 */
function whr_term_options( $taxonomy, $selected = '', $nested = false ) {
	$terms = get_terms( array( 'taxonomy' => $taxonomy, 'hide_empty' => false, 'parent' => $nested ? 0 : '' ) );
	if ( is_wp_error( $terms ) ) {
		return;
	}
	foreach ( $terms as $term ) {
		printf( '<option value="%s"%s>%s</option>', esc_attr( $term->slug ), selected( $selected, $term->slug, false ), esc_html( $term->name ) );
		if ( $nested ) {
			$children = get_terms( array( 'taxonomy' => $taxonomy, 'hide_empty' => false, 'parent' => $term->term_id ) );
			foreach ( (array) $children as $child ) {
				printf( '<option value="%s"%s>&nbsp;&nbsp;— %s</option>', esc_attr( $child->slug ), selected( $selected, $child->slug, false ), esc_html( $child->name ) );
			}
		}
	}
}

/**
 * Breadcrumb links for a destination term.
 *
 * @param WP_Term $term Term.
 * @return string
 */
function whr_destination_trail( $term ) {
	$links = array();
	foreach ( array_reverse( get_ancestors( $term->term_id, 'destination', 'taxonomy' ) ) as $ancestor_id ) {
		$a       = get_term( $ancestor_id, 'destination' );
		$links[] = '<a href="' . esc_url( get_term_link( $a ) ) . '">' . esc_html( $a->name ) . '</a>';
	}
	return implode( ' · ', $links );
}
