<?php
/**
 * Filtered sanctuary search: /sanctuaries/?dest=costa-rica&need=burnout&care=clinical-program&stay=14&budget=4000&setting=ocean&sort=price
 *
 * The same filters also apply on destination / condition archives.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

/**
 * Current filter values from the query string.
 *
 * @return array
 */
function whr_filters() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- read-only search filters.
	$get = function ( $key ) {
		return isset( $_GET[ $key ] ) ? sanitize_title( wp_unslash( $_GET[ $key ] ) ) : '';
	};
	$filters = array(
		'dest'    => $get( 'dest' ),
		'need'    => $get( 'need' ),
		'care'    => $get( 'care' ),
		'setting' => $get( 'setting' ),
		'stay'    => isset( $_GET['stay'] ) ? absint( $_GET['stay'] ) : 0,
		'budget'  => isset( $_GET['budget'] ) ? absint( $_GET['budget'] ) : 0,
		'sort'    => in_array( $get( 'sort' ), array( 'price', 'stay', 'name' ), true ) ? $get( 'sort' ) : '',
	);
	// phpcs:enable
	return $filters;
}

add_action(
	'pre_get_posts',
	function ( $query ) {
		if ( is_admin() || ! $query->is_main_query() ) {
			return;
		}
		$is_listing = $query->is_post_type_archive( 'sanctuary' ) || $query->is_tax( array( 'destination', 'condition', 'care_level', 'approach', 'setting' ) );
		if ( ! $is_listing ) {
			return;
		}

		$f = whr_filters();
		$query->set( 'post_type', 'sanctuary' );
		$query->set( 'posts_per_page', 12 );

		$tax_query = (array) $query->get( 'tax_query' );
		$map       = array( 'dest' => 'destination', 'need' => 'condition', 'care' => 'care_level', 'setting' => 'setting' );
		foreach ( $map as $param => $taxonomy ) {
			if ( $f[ $param ] ) {
				$tax_query[] = array( 'taxonomy' => $taxonomy, 'field' => 'slug', 'terms' => $f[ $param ], 'include_children' => true );
			}
		}
		if ( count( $tax_query ) > 1 ) {
			$tax_query['relation'] = 'AND';
		}
		$query->set( 'tax_query', $tax_query ); // phpcs:ignore WordPress.DB.SlowDBQuery

		$meta_query = array( 'relation' => 'AND' );
		if ( $f['stay'] ) {
			// Programs that offer a stay at least this long.
			$meta_query[] = array( 'key' => 'whr_stay_max', 'value' => $f['stay'], 'compare' => '>=', 'type' => 'NUMERIC' );
		}
		if ( $f['budget'] ) {
			$meta_query[] = array(
				'relation' => 'OR',
				array( 'key' => 'whr_price_from', 'value' => $f['budget'], 'compare' => '<=', 'type' => 'NUMERIC' ),
				// "Rates on request" listings stay visible: price saved empty, or never saved.
				array( 'key' => 'whr_price_from', 'value' => '', 'compare' => '=' ),
				array( 'key' => 'whr_price_from', 'compare' => 'NOT EXISTS' ),
			);
		}
		// Sponsored first, then the chosen order.
		// Every sanctuary carries whr_sponsored (see whr_ensure_sponsored_flag), so this clause excludes nothing.
		$meta_query['sponsored'] = array( 'key' => 'whr_sponsored', 'compare' => 'EXISTS', 'type' => 'NUMERIC' );

		$order = array( 'sponsored' => 'DESC' );
		if ( 'price' === $f['sort'] ) {
			$meta_query['price_sort'] = array( 'key' => 'whr_price_sort', 'compare' => 'EXISTS', 'type' => 'NUMERIC' );
			$order['price_sort']      = 'ASC';
		} elseif ( 'stay' === $f['sort'] ) {
			$meta_query['stay_sort'] = array( 'key' => 'whr_stay_sort', 'compare' => 'EXISTS', 'type' => 'NUMERIC' );
			$order['stay_sort']      = 'ASC';
		} elseif ( 'name' === $f['sort'] ) {
			$order['title'] = 'ASC';
		} else {
			$order['menu_order'] = 'ASC';
			$order['date']       = 'DESC';
		}
		$query->set( 'meta_query', $meta_query ); // phpcs:ignore WordPress.DB.SlowDBQuery
		$query->set( 'orderby', $order );
	}
);

/**
 * Keep the keys the results page sorts on present on every sanctuary, however it was
 * created (editor, REST, import), so sorting never drops a listing. Listings without a
 * price or stay sort last.
 *
 * @param int $post_id Post ID.
 */
function whr_sync_sort_keys( $post_id ) {
	if ( 'sanctuary' !== get_post_type( $post_id ) ) {
		return;
	}
	add_post_meta( $post_id, 'whr_sponsored', 0, true );
	$price = (int) get_post_meta( $post_id, 'whr_price_from', true );
	$stay  = (int) get_post_meta( $post_id, 'whr_stay_min', true );
	update_post_meta( $post_id, 'whr_price_sort', $price ? $price : 999999999 );
	update_post_meta( $post_id, 'whr_stay_sort', $stay ? $stay : 99999 );
}
add_action( 'save_post_sanctuary', 'whr_sync_sort_keys', 20 );
foreach ( array( 'added_post_meta', 'updated_post_meta' ) as $whr_meta_hook ) {
	add_action(
		$whr_meta_hook,
		function ( $meta_id, $post_id, $key ) {
			if ( in_array( $key, array( 'whr_price_from', 'whr_stay_min' ), true ) ) {
				whr_sync_sort_keys( $post_id );
			}
		},
		10,
		3
	);
}

/** Backfill sort keys once for sanctuaries created before this version. */
add_action(
	'admin_init',
	function () {
		if ( get_option( 'whr_sort_keys_version' ) === WHR_VERSION ) {
			return;
		}
		foreach ( get_posts( array( 'post_type' => 'sanctuary', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids' ) ) as $id ) {
			whr_sync_sort_keys( $id );
		}
		update_option( 'whr_sort_keys_version', WHR_VERSION );
	}
);

/**
 * Human heading for the current results, e.g. "Sanctuaries for burnout in Costa Rica".
 *
 * @return string HTML (escaped).
 */
function whr_results_heading() {
	$f    = whr_filters();
	$need = $f['need'] ? get_term_by( 'slug', $f['need'], 'condition' ) : null;
	$dest = $f['dest'] ? get_term_by( 'slug', $f['dest'], 'destination' ) : null;
	if ( is_tax( 'destination' ) ) {
		$dest = get_queried_object();
	}
	if ( is_tax( 'condition' ) ) {
		$need = get_queried_object();
	}
	$html = esc_html__( 'Sanctuaries', 'wehaverehabs' );
	if ( $need ) {
		$html .= ' ' . esc_html__( 'for', 'wehaverehabs' ) . ' <em>' . esc_html( mb_strtolower( $need->name ) ) . '</em>';
	}
	if ( $dest ) {
		$html .= ' ' . esc_html__( 'in', 'wehaverehabs' ) . ' <em>' . esc_html( $dest->name ) . '</em>';
	}
	return $html;
}
