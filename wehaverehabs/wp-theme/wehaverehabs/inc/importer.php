<?php
/**
 * Bulk import of public facility listings from a JSON Lines file (one facility per line),
 * as produced by wehaverehabs/data/build_listings.py.
 *
 *   wp whr-import bundled            (the 21,842 facilities shipped in data/listings.jsonl.gz)
 *   wp whr-import listings.jsonl [--limit=<n>] [--offset=<n>] [--update] [--source=<samhsa|cqc|web>] [--country=<name>]
 *   wp whr-import remove --source=<samhsa|cqc|web>
 *
 * Listings are matched on whr_source + whr_source_id, so re-running only adds new ones
 * (or refreshes existing unclaimed ones with --update). Claimed listings are never overwritten.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

/**
 * Find or create a term by name, cached for the run.
 *
 * @param string $taxonomy Taxonomy.
 * @param string $name     Term name.
 * @param int    $parent   Parent term ID.
 * @param string $desc     Description for new terms.
 * @return int Term ID or 0.
 */
function whr_import_term( $taxonomy, $name, $parent = 0, $desc = '' ) {
	static $cache = array();
	$name = trim( (string) $name );
	if ( '' === $name ) {
		return 0;
	}
	$key = $taxonomy . '|' . $parent . '|' . strtolower( $name );
	if ( isset( $cache[ $key ] ) ) {
		return $cache[ $key ];
	}
	$found = get_terms(
		array(
			'taxonomy'   => $taxonomy,
			'name'       => $name,
			'parent'     => $parent,
			'hide_empty' => false,
			'number'     => 1,
			'fields'     => 'ids',
		)
	);
	if ( ! is_wp_error( $found ) && $found ) {
		return $cache[ $key ] = (int) $found[0]; // phpcs:ignore Squiz.PHP.DisallowMultipleAssignments
	}
	$slug = sanitize_title( $name );
	if ( $parent && term_exists( $slug, $taxonomy ) ) {
		$parent_term = get_term( $parent, $taxonomy );
		$slug        = sanitize_title( $parent_term->slug . '-' . $name ); // Regions such as "Georgia" exist in several countries.
	}
	$made = wp_insert_term( $name, $taxonomy, array( 'slug' => $slug, 'parent' => $parent, 'description' => $desc ) );
	if ( is_wp_error( $made ) ) {
		$id = (int) $made->get_error_data( 'term_exists' );
		return $cache[ $key ] = $id; // phpcs:ignore Squiz.PHP.DisallowMultipleAssignments
	}
	return $cache[ $key ] = (int) $made['term_id']; // phpcs:ignore Squiz.PHP.DisallowMultipleAssignments
}

/** Care level descriptions shared with the demo content. */
function whr_import_care_descriptions() {
	$out = array();
	foreach ( whr_demo_data()['care'] as $c ) {
		$out[ $c[0] ] = $c[2];
	}
	return $out;
}

/**
 * Existing post ID for a source record. Loads every source ID once per run instead of
 * querying per record; pass $remember to record a listing created during the run.
 *
 * @param string $source    Source key.
 * @param string $source_id Source ID.
 * @param int    $remember  Post ID to record.
 * @return int
 */
function whr_import_find( $source, $source_id, $remember = 0 ) {
	global $wpdb;
	static $map = null;
	if ( null === $map ) {
		$map  = array();
		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			"SELECT a.post_id, a.meta_value AS sid, b.meta_value AS src FROM {$wpdb->postmeta} a
			 JOIN {$wpdb->postmeta} b ON b.post_id = a.post_id AND b.meta_key = 'whr_source'
			 WHERE a.meta_key = 'whr_source_id'"
		);
		foreach ( $rows as $row ) {
			$map[ $row->src . '|' . $row->sid ] = (int) $row->post_id;
		}
	}
	$key = $source . '|' . $source_id;
	if ( $remember ) {
		$map[ $key ] = (int) $remember;
	}
	return isset( $map[ $key ] ) ? $map[ $key ] : 0;
}

/**
 * Create or update one listing.
 *
 * @param array $r      Record.
 * @param bool  $update Refresh existing unclaimed listings.
 * @return string created|updated|skipped|error
 */
function whr_import_record( array $r, $update = false ) {
	if ( empty( $r['name'] ) || empty( $r['source'] ) || empty( $r['source_id'] ) || empty( $r['country'] ) ) {
		return 'error';
	}
	$existing = whr_import_find( $r['source'], $r['source_id'] );
	if ( $existing && ( ! $update || whr_meta( 'claimed', $existing ) ) ) {
		return 'skipped';
	}

	$care  = isset( $r['care_level'] ) ? (string) $r['care_level'] : '';
	$city  = isset( $r['city'] ) ? (string) $r['city'] : '';
	$where = implode( ', ', array_filter( array( $city, isset( $r['region'] ) ? $r['region'] : '', $r['country'] ) ) );
	$lead  = $care ? $care : __( 'Treatment provider', 'wehaverehabs' );
	/* translators: 1: care level 2: place */
	$excerpt = ! empty( $r['description'] ) ? $r['description'] : sprintf( __( '%1$s in %2$s.', 'wehaverehabs' ), $lead, $where );

	$postarr = array(
		'post_type'    => 'sanctuary',
		'post_status'  => 'publish',
		'post_title'   => wp_strip_all_tags( $r['name'] ),
		'post_excerpt' => wp_strip_all_tags( $excerpt ),
		'post_content' => '',
		'comment_status' => 'closed',
		'ping_status'  => 'closed',
	);
	if ( $existing ) {
		$postarr['ID'] = $existing;
		$id            = wp_update_post( wp_slash( $postarr ), true );
	} else {
		$id = wp_insert_post( wp_slash( $postarr ), true );
	}
	if ( is_wp_error( $id ) || ! $id ) {
		return 'error';
	}

	$meta = array(
		'whr_source'          => $r['source'],
		'whr_source_id'       => $r['source_id'],
		'whr_source_url'      => isset( $r['source_url'] ) ? esc_url_raw( $r['source_url'] ) : '',
		'whr_source_date'     => isset( $r['retrieved'] ) ? $r['retrieved'] : gmdate( 'Y-m-d' ),
		'whr_location'        => implode( ', ', array_filter( array( $city, isset( $r['region'] ) && $r['region'] !== $city ? $r['region'] : '' ) ) ),
		'whr_address'         => isset( $r['address'] ) ? $r['address'] : '',
		'whr_phone'           => isset( $r['phone'] ) ? $r['phone'] : '',
		'whr_intake_phone'    => isset( $r['intake_phone'] ) ? $r['intake_phone'] : '',
		'whr_website'         => isset( $r['website'] ) ? esc_url_raw( $r['website'] ) : '',
		'whr_lat'             => isset( $r['lat'] ) ? $r['lat'] : '',
		'whr_lng'             => isset( $r['lng'] ) ? $r['lng'] : '',
		'whr_operator'        => isset( $r['operator'] ) ? $r['operator'] : '',
		'whr_languages'       => isset( $r['languages'] ) ? $r['languages'] : '',
		'whr_service_setting' => isset( $r['service_setting'] ) ? $r['service_setting'] : '',
		'whr_approaches'      => isset( $r['approaches'] ) ? $r['approaches'] : '',
		'whr_programs'        => isset( $r['programs'] ) ? $r['programs'] : '',
		'whr_payment'         => isset( $r['payment'] ) ? $r['payment'] : '',
		'whr_license_text'    => isset( $r['license'] ) ? $r['license'] : '',
		'whr_ages'            => isset( $r['ages'] ) ? $r['ages'] : '',
	);
	foreach ( $meta as $key => $value ) {
		if ( null === $value || '' === $value ) {
			delete_post_meta( $id, $key );
		} else {
			update_post_meta( $id, $key, wp_slash( (string) $value ) );
		}
	}

	$country = whr_import_term( 'destination', $r['country'] );
	$dest    = $country;
	if ( $country && ! empty( $r['region'] ) && $r['region'] !== $r['country'] ) {
		$dest = whr_import_term( 'destination', $r['region'], $country );
	}
	wp_set_object_terms( $id, $dest ? array( $dest ) : array(), 'destination' );

	$descriptions = whr_import_care_descriptions();
	wp_set_object_terms( $id, $care ? array( whr_import_term( 'care_level', $care, 0, isset( $descriptions[ $care ] ) ? $descriptions[ $care ] : '' ) ) : array(), 'care_level' );
	$focus = array();
	foreach ( isset( $r['focus'] ) ? (array) $r['focus'] : array() as $f ) {
		$focus[] = whr_import_term( 'condition', $f );
	}
	wp_set_object_terms( $id, array_filter( $focus ), 'condition' );
	$settings = array();
	foreach ( isset( $r['setting'] ) ? (array) $r['setting'] : array() as $s ) {
		$settings[] = whr_import_term( 'setting', $s );
	}
	wp_set_object_terms( $id, array_filter( $settings ), 'setting' );

	whr_sync_sort_keys( $id );
	if ( ! $existing ) {
		whr_import_find( $r['source'], $r['source_id'], $id );
	}
	return $existing ? 'updated' : 'created';
}

/**
 * Import a JSONL file (optionally .gz).
 *
 * @param string $file    Path.
 * @param array  $opts    limit, offset, update, source, country.
 * @param callable|null $tick Progress callback.
 * @return array Counts.
 */
function whr_import_file( $file, array $opts = array(), $tick = null ) {
	$fh = gzopen( $file, 'rb' ); // Reads plain and gzipped files alike.
	if ( ! $fh ) {
		return array( 'error' => 1 );
	}
	$opts   = wp_parse_args( $opts, array( 'limit' => 0, 'offset' => 0, 'update' => false, 'source' => '', 'country' => '', 'seconds' => 0 ) );
	$start  = microtime( true );
	$counts = array( 'created' => 0, 'updated' => 0, 'skipped' => 0, 'error' => 0 );
	$seen   = 0;
	$done   = 0;

	wp_defer_term_counting( true );
	wp_suspend_cache_invalidation( true );
	remove_action( 'save_post_sanctuary', 'whr_sync_sort_keys', 20 );

	while ( ( $line = gzgets( $fh, 1 << 20 ) ) !== false ) { // phpcs:ignore WordPress.CodeAnalysis.AssignmentInCondition
		$r = json_decode( $line, true );
		if ( ! is_array( $r ) ) {
			continue;
		}
		if ( ( $opts['source'] && $opts['source'] !== $r['source'] ) || ( $opts['country'] && 0 !== strcasecmp( $opts['country'], (string) $r['country'] ) ) ) {
			continue;
		}
		if ( $seen++ < $opts['offset'] ) {
			continue;
		}
		$result = whr_import_record( $r, $opts['update'] );
		++$counts[ $result ];
		++$done;
		if ( 0 === $done % 200 ) {
			wp_cache_flush_runtime();
			if ( $tick ) {
				call_user_func( $tick, $done, $counts );
			}
		}
		if ( ( $opts['limit'] && $done >= $opts['limit'] ) || ( $opts['seconds'] && microtime( true ) - $start > $opts['seconds'] ) ) {
			break;
		}
	}
	$counts['eof'] = gzeof( $fh );
	gzclose( $fh );

	wp_suspend_cache_invalidation( false );
	wp_defer_term_counting( false );
	add_action( 'save_post_sanctuary', 'whr_sync_sort_keys', 20 );
	update_option( 'whr_count_gen', (int) get_option( 'whr_count_gen', 0 ) + 1 );
	foreach ( array( 'destination', 'condition', 'care_level', 'setting' ) as $tax ) {
		clean_taxonomy_cache( $tax );
	}
	return $counts;
}

/**
 * Delete every unclaimed listing from one source.
 *
 * @param string $source Source key.
 * @return int Deleted.
 */
function whr_import_remove( $source ) {
	$n = 0;
	do {
		$ids = get_posts(
			array(
				'post_type'      => 'sanctuary',
				'post_status'    => 'any',
				'posts_per_page' => 500,
				'fields'         => 'ids',
				'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery
					array( 'key' => 'whr_source', 'value' => $source ),
					array(
						'relation' => 'OR',
						array( 'key' => 'whr_claimed', 'compare' => 'NOT EXISTS' ),
						array( 'key' => 'whr_claimed', 'value' => '' ),
					),
				),
			)
		);
		foreach ( $ids as $id ) {
			wp_delete_post( $id, true );
			++$n;
		}
	} while ( $ids );
	update_option( 'whr_count_gen', (int) get_option( 'whr_count_gen', 0 ) + 1 );
	return $n;
}

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command(
		'whr-import',
		function ( $args, $assoc ) {
			if ( 'resync' === ( isset( $args[0] ) ? $args[0] : '' ) ) {
				delete_option( 'whr_sort_keys_version' );
				$n = 0;
				while ( ( $done = whr_backfill_sort_keys( 1000 ) ) > 0 ) { // phpcs:ignore WordPress.CodeAnalysis.AssignmentInCondition
					$n += $done;
					WP_CLI::log( $n . ' listings re-ranked' );
					wp_cache_flush_runtime();
				}
				WP_CLI::success( 'Sort keys are up to date.' );
				return;
			}
			if ( 'remove' === ( isset( $args[0] ) ? $args[0] : '' ) ) {
				if ( empty( $assoc['source'] ) ) {
					WP_CLI::error( 'Pass --source=<samhsa|cqc|web>.' );
				}
				WP_CLI::success( sprintf( 'Deleted %d unclaimed listings.', whr_import_remove( $assoc['source'] ) ) );
				return;
			}
			$file = isset( $args[0] ) ? $args[0] : '';
			if ( 'bundled' === $file ) {
				$file = whr_bundled_listings();
			}
			if ( ! $file || ! is_readable( $file ) ) {
				WP_CLI::error( 'Usage: wp whr-import <listings.jsonl> [--limit=<n>] [--offset=<n>] [--update] [--source=<s>] [--country=<c>]' );
			}
			$counts = whr_import_file(
				$file,
				array(
					'limit'   => isset( $assoc['limit'] ) ? absint( $assoc['limit'] ) : 0,
					'offset'  => isset( $assoc['offset'] ) ? absint( $assoc['offset'] ) : 0,
					'update'  => ! empty( $assoc['update'] ),
					'source'  => isset( $assoc['source'] ) ? $assoc['source'] : '',
					'country' => isset( $assoc['country'] ) ? $assoc['country'] : '',
				),
				function ( $done, $counts ) {
					WP_CLI::log( sprintf( '%d processed (%d new, %d updated, %d skipped)', $done, $counts['created'], $counts['updated'], $counts['skipped'] ) );
				}
			);
			unset( $counts['eof'] );
			WP_CLI::success( wp_json_encode( $counts ) );
		}
	);
}

/** Listing status column and filter in wp-admin → Sanctuaries. */
add_filter(
	'manage_sanctuary_posts_columns',
	function ( $cols ) {
		$cols['whr_status'] = __( 'Plan', 'wehaverehabs' );
		return $cols;
	}
);
add_action(
	'manage_sanctuary_posts_custom_column',
	function ( $col, $post_id ) {
		if ( 'whr_status' !== $col ) {
			return;
		}
		$source = whr_meta( 'source', $post_id );
		$label  = whr_plans()[ whr_plan( $post_id ) ][0];
		echo esc_html( $label . ( $source && 'manual' !== $source ? ' (' . $source . ')' : '' ) );
	},
	10,
	2
);
add_action(
	'restrict_manage_posts',
	function ( $post_type ) {
		if ( 'sanctuary' !== $post_type || ! whr_is_staff() ) {
			return;
		}
		$current = isset( $_GET['whr_status'] ) ? sanitize_key( $_GET['whr_status'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		echo '<select name="whr_status"><option value="">' . esc_html__( 'All listings', 'wehaverehabs' ) . '</option>';
		foreach ( array( 'paid' => __( 'Paid plans', 'wehaverehabs' ), 'claimed' => __( 'Claimed (any plan)', 'wehaverehabs' ), 'public' => __( 'Public · unclaimed', 'wehaverehabs' ) ) as $value => $label ) {
			printf( '<option value="%s" %s>%s</option>', esc_attr( $value ), selected( $current, $value, false ), esc_html( $label ) );
		}
		echo '</select>';
	}
);
add_action(
	'pre_get_posts',
	function ( $q ) {
		if ( ! is_admin() || ! $q->is_main_query() || 'sanctuary' !== $q->get( 'post_type' ) || empty( $_GET['whr_status'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}
		// whr_claimed_sort holds the plan rank, 0 public … 3 featured (kept in sync by whr_sync_sort_keys()).
		$status = sanitize_key( $_GET['whr_status'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$min    = array( 'paid' => 2, 'claimed' => 1 );
		$q->set( 'meta_query', array( isset( $min[ $status ] ) ? array( 'key' => 'whr_claimed_sort', 'value' => $min[ $status ], 'compare' => '>=', 'type' => 'NUMERIC' ) : array( 'key' => 'whr_claimed_sort', 'value' => 0, 'type' => 'NUMERIC' ) ) );
	}
);

/**
 * Tools → Import listings: import the bundled listings, or upload a .jsonl / .jsonl.gz file,
 * in batches (works on hosts without WP-CLI).
 */
add_action(
	'admin_menu',
	function () {
		add_management_page( __( 'Import listings', 'wehaverehabs' ), __( 'Import listings', 'wehaverehabs' ), 'manage_options', 'whr-import', 'whr_import_page' );
	}
);

/** The listings file that ships with the theme. */
function whr_bundled_listings() {
	return WHR_DIR . '/data/listings.jsonl.gz';
}

/** Point new sites at the import screen until some listings exist. */
add_action(
	'admin_notices',
	function () {
		if ( ! current_user_can( 'manage_options' ) || ( isset( $_GET['page'] ) && 'whr-import' === $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}
		$counts = wp_count_posts( 'sanctuary' );
		if ( (int) $counts->publish > 50 || get_option( 'whr_autoimport' ) ) {
			return;
		}
		echo '<div class="notice notice-info"><p><strong>We Have Rehabs:</strong> ' . esc_html__( 'Fill the directory with 21,842 real treatment facilities in 65 countries, ready for them to claim.', 'wehaverehabs' ) . ' <a class="button button-primary" href="' . esc_url( admin_url( 'tools.php?page=whr-import' ) ) . '">' . esc_html__( 'Import listings', 'wehaverehabs' ) . '</a></p></div>';
	}
);

/** Where uploaded listing files are kept. */
function whr_import_dir() {
	$dir = trailingslashit( wp_upload_dir()['basedir'] ) . 'whr-import';
	if ( ! is_dir( $dir ) ) {
		wp_mkdir_p( $dir );
		file_put_contents( $dir . '/index.php', '<?php // Silence.' ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		file_put_contents( $dir . '/.htaccess', 'Deny from all' ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	}
	return $dir;
}

/** Admin screen. */
function whr_import_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$file  = get_option( 'whr_import_file' );
	$batch = 150;
	echo '<div class="wrap"><h1>' . esc_html__( 'Import listings', 'wehaverehabs' ) . '</h1>';

	// Running: one batch per page load, then reload for the next.
	if ( isset( $_GET['run'], $_GET['_wpnonce'] ) && $file && wp_verify_nonce( sanitize_key( $_GET['_wpnonce'] ), 'whr_import_run' ) && is_readable( $file ) ) {
		$offset = isset( $_GET['offset'] ) ? absint( $_GET['offset'] ) : 0;
		$totals = get_option( 'whr_import_totals', array( 'created' => 0, 'updated' => 0, 'skipped' => 0, 'error' => 0 ) );
		if ( function_exists( 'set_time_limit' ) ) {
			set_time_limit( 120 ); // phpcs:ignore Squiz.PHP.DiscouragedFunctions.Discouraged
		}
		$counts = whr_import_file( $file, array( 'offset' => $offset, 'limit' => $batch, 'update' => ! empty( $_GET['update'] ) ) );
		foreach ( array( 'created', 'updated', 'skipped', 'error' ) as $k ) {
			$totals[ $k ] += isset( $counts[ $k ] ) ? $counts[ $k ] : 0;
		}
		update_option( 'whr_import_totals', $totals, false );
		$processed = $offset + $counts['created'] + $counts['updated'] + $counts['skipped'] + $counts['error'];
		/* translators: 1: processed 2: new 3: updated 4: skipped */
		echo '<p>' . esc_html( sprintf( __( '%1$s processed — %2$s new, %3$s updated, %4$s already there.', 'wehaverehabs' ), number_format_i18n( $processed ), number_format_i18n( $totals['created'] ), number_format_i18n( $totals['updated'] ), number_format_i18n( $totals['skipped'] ) ) ) . '</p>';
		if ( empty( $counts['eof'] ) && $processed > $offset ) {
			$next = wp_nonce_url( add_query_arg( array( 'page' => 'whr-import', 'run' => 1, 'offset' => $processed, 'update' => empty( $_GET['update'] ) ? 0 : 1 ), admin_url( 'tools.php' ) ), 'whr_import_run' );
			echo '<p>' . esc_html__( 'Working… keep this tab open.', 'wehaverehabs' ) . '</p><meta http-equiv="refresh" content="0;url=' . esc_url( $next ) . '">';
		} else {
			echo '<div class="notice notice-success"><p>' . esc_html__( 'Import finished.', 'wehaverehabs' ) . '</p></div>';
			delete_option( 'whr_import_totals' );
		}
		echo '</div>';
		return;
	}

	// Upload.
	if ( isset( $_POST['whr_import_upload'] ) && check_admin_referer( 'whr_import_upload' ) && ! empty( $_FILES['listings']['tmp_name'] ) ) {
		// Not sanitize_file_name(): it mangles the double ".jsonl.gz" extension.
		$name = sanitize_text_field( wp_unslash( $_FILES['listings']['name'] ) );
		$ext  = preg_match( '/\.jsonl(\.gz)?$/i', $name, $m ) ? strtolower( $m[0] ) : '';
		$name = sanitize_title( preg_replace( '/\.jsonl(\.gz)?$/i', '', $name ) ) . $ext;
		if ( ! $ext ) {
			echo '<div class="notice notice-error"><p>' . esc_html__( 'Please upload a .jsonl or .jsonl.gz file.', 'wehaverehabs' ) . '</p></div>';
		} else {
			$dest = whr_import_dir() . '/' . wp_generate_password( 12, false ) . '-' . $name;
			if ( move_uploaded_file( $_FILES['listings']['tmp_name'], $dest ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
				if ( $file && is_file( $file ) && whr_bundled_listings() !== $file ) {
					wp_delete_file( $file );
				}
				update_option( 'whr_import_file', $dest, false );
				delete_option( 'whr_import_totals' );
				$file = $dest;
			}
		}
	}

	// One click: the facilities bundled with the theme.
	if ( isset( $_POST['whr_import_bundled'] ) && check_admin_referer( 'whr_import_bundled' ) && is_readable( whr_bundled_listings() ) ) {
		update_option( 'whr_import_file', whr_bundled_listings(), false );
		delete_option( 'whr_import_totals' );
		$file = whr_bundled_listings();
	}
	if ( is_readable( whr_bundled_listings() ) ) {
		echo '<div class="card" style="max-width:720px"><h2>' . esc_html__( 'Real facilities included with the theme', 'wehaverehabs' ) . '</h2><p>' . esc_html__( '21,842 treatment facilities in 65 countries: the US government’s FindTreatment.gov locator, the UK Care Quality Commission directory, and 662 facilities checked on their own websites. Each one is published as an unclaimed public listing with its source shown, ready for the facility to claim.', 'wehaverehabs' ) . '</p><form method="post">';
		wp_nonce_field( 'whr_import_bundled' );
		echo '<p><button class="button button-primary" name="whr_import_bundled" value="1">' . esc_html__( 'Use the included listings', 'wehaverehabs' ) . '</button></p></form></div>';
	}

	echo '<h2>' . esc_html__( 'Or upload your own file', 'wehaverehabs' ) . '</h2>';
	echo '<p>' . esc_html__( 'A listings.jsonl or listings.jsonl.gz file in the same format. Listings already on the site are skipped, and claimed listings are never changed.', 'wehaverehabs' ) . '</p>';
	echo '<form method="post" enctype="multipart/form-data">';
	wp_nonce_field( 'whr_import_upload' );
	echo '<p><input type="file" name="listings" accept=".jsonl,.gz" required> <button class="button" name="whr_import_upload" value="1">' . esc_html__( 'Upload', 'wehaverehabs' ) . '</button></p></form>';
	if ( $file && is_readable( $file ) ) {
		$run = wp_nonce_url( add_query_arg( array( 'page' => 'whr-import', 'run' => 1, 'offset' => 0 ), admin_url( 'tools.php' ) ), 'whr_import_run' );
		/* translators: %s: file name */
		echo '<p><strong>' . esc_html( sprintf( __( 'Ready: %s', 'wehaverehabs' ), whr_bundled_listings() === $file ? __( 'the included listings', 'wehaverehabs' ) : preg_replace( '/^[A-Za-z0-9]{12}-/', '', basename( $file ) ) ) ) . '</strong></p>';
		echo '<p><a class="button button-primary" href="' . esc_url( $run ) . '">' . esc_html__( 'Start import', 'wehaverehabs' ) . '</a> ';
		echo '<a class="button" href="' . esc_url( add_query_arg( 'update', 1, $run ) ) . '">' . esc_html__( 'Import and refresh existing unclaimed listings', 'wehaverehabs' ) . '</a></p>';
	}
	echo '<p class="description">' . esc_html__( 'Large files take a while: about 150 listings per step. With WP-CLI you can run: wp whr-import listings.jsonl.gz', 'wehaverehabs' ) . '</p></div>';
}

/*
 * Automatic import of the bundled listings. A new install with (almost) no listings starts
 * importing in the background by itself: batches of about 20 seconds run on WP-Cron (visitor
 * traffic keeps it moving) and on admin page loads, until all 21,842 facilities are in.
 */

/** Total listings in the bundled file (counted once). */
function whr_bundled_total() {
	$total = (int) get_option( 'whr_bundled_total' );
	if ( ! $total && is_readable( whr_bundled_listings() ) ) {
		$fh = gzopen( whr_bundled_listings(), 'rb' );
		while ( gzgets( $fh, 1 << 20 ) !== false ) {
			++$total;
		}
		gzclose( $fh );
		update_option( 'whr_bundled_total', $total, false );
	}
	return $total;
}

/** Start the background import on sites that have (almost) no listings yet. */
function whr_autoimport_maybe_start() {
	if ( get_option( 'whr_autoimport' ) || ! is_readable( whr_bundled_listings() ) ) {
		return;
	}
	$counts = wp_count_posts( 'sanctuary' );
	if ( (int) $counts->publish > 50 && false === get_option( 'whr_autoimport_offset', false ) ) {
		update_option( 'whr_autoimport', 'done', false ); // The site already has its own listings.
		return;
	}
	update_option( 'whr_autoimport', 'running', false );
	add_option( 'whr_autoimport_offset', 0, '', false ); // Resumes where it stopped if restarted.
	wp_schedule_single_event( time(), 'whr_autoimport_batch' );
	whr_autoimport_kick();
}
add_action( 'after_switch_theme', 'whr_autoimport_maybe_start' );
add_action( 'admin_init', 'whr_autoimport_maybe_start' );
add_action(
	'init',
	function () {
		if ( ! get_option( 'whr_autoimport' ) ) {
			whr_autoimport_maybe_start();
		}
	},
	20
);

/**
 * Import one batch of the bundled listings.
 *
 * @param int $seconds Time budget.
 */
function whr_autoimport_batch( $seconds = 20 ) {
	if ( 'running' !== get_option( 'whr_autoimport' ) || get_transient( 'whr_autoimport_lock' ) ) {
		return;
	}
	set_transient( 'whr_autoimport_lock', 1, 90 );
	if ( function_exists( 'set_time_limit' ) ) {
		set_time_limit( 120 ); // phpcs:ignore Squiz.PHP.DiscouragedFunctions.Discouraged
	}
	$offset = (int) get_option( 'whr_autoimport_offset' );
	$counts = whr_import_file( whr_bundled_listings(), array( 'offset' => $offset, 'seconds' => $seconds ) );
	$did    = $counts['created'] + $counts['updated'] + $counts['skipped'] + $counts['error'];
	update_option( 'whr_autoimport_offset', $offset + $did, false );
	delete_transient( 'whr_autoimport_lock' );
	if ( ! empty( $counts['eof'] ) || 0 === $did ) {
		update_option( 'whr_autoimport', 'done', false );
		return;
	}
	wp_schedule_single_event( time() + 30, 'whr_autoimport_batch' ); // Backup if the chain below breaks.
	whr_autoimport_kick();
}

/**
 * Start the next batch at once with a background request to this site, so the import keeps
 * going without visitors. Protected by a random token only this site knows.
 */
function whr_autoimport_kick() {
	$token = get_option( 'whr_autoimport_token' );
	if ( ! $token ) {
		$token = wp_generate_password( 32, false );
		update_option( 'whr_autoimport_token', $token, false );
	}
	wp_remote_post(
		admin_url( 'admin-ajax.php' ),
		array(
			'timeout'   => 0.01,
			'blocking'  => false,
			'sslverify' => apply_filters( 'https_local_ssl_verify', false ), // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals -- core filter.
			'body'      => array( 'action' => 'whr_autoimport', 'token' => $token ),
		)
	);
}
foreach ( array( 'wp_ajax_whr_autoimport', 'wp_ajax_nopriv_whr_autoimport' ) as $whr_ajax_hook ) {
	add_action(
		$whr_ajax_hook,
		function () {
			$token = isset( $_POST['token'] ) ? sanitize_text_field( wp_unslash( $_POST['token'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- loopback request authenticated by token.
			if ( $token && hash_equals( (string) get_option( 'whr_autoimport_token' ), $token ) ) {
				ignore_user_abort( true );
				whr_autoimport_batch( 20 );
			}
			wp_die( '', '', array( 'response' => 200 ) );
		}
	);
}
add_action(
	'whr_autoimport_batch',
	function () {
		whr_autoimport_batch( 20 );
	}
);
/* Admin page loads also move it along, in case WP-Cron is slow or disabled on the host. */
add_action(
	'admin_init',
	function () {
		if ( 'running' === get_option( 'whr_autoimport' ) && current_user_can( 'manage_options' ) && ! wp_doing_ajax() ) {
			whr_autoimport_batch( 8 );
		}
	},
	30
);
add_action(
	'admin_notices',
	function () {
		if ( 'running' !== get_option( 'whr_autoimport' ) || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$total = whr_bundled_total();
		$done  = min( $total, (int) get_option( 'whr_autoimport_offset' ) );
		/* translators: 1: imported 2: total */
		echo '<div class="notice notice-info"><p><strong>We Have Rehabs:</strong> ' . esc_html( sprintf( __( 'Adding real treatment facilities to your directory in the background — %1$s of %2$s so far. This keeps going on its own; reloading any admin page speeds it up.', 'wehaverehabs' ), number_format_i18n( $done ), number_format_i18n( $total ) ) ) . '</p></div>';
	}
);
