<?php
/**
 * Compatibility self-test.
 *
 * Runs automatically whenever the AIOSEO version (or this plugin's) changes, and on demand
 * from the Health tab. Each write path is tested with a real round trip on a temporary
 * draft post that is deleted afterwards, so "compatible" means "proven to work on this
 * site with this AIOSEO build", not "the class exists".
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AISA_Health_Check {
	const RESULT_OPTION = 'aisa_health';

	public static function init() {
		add_action( 'admin_init', [ __CLASS__, 'maybe_run' ] );
		add_action( 'admin_notices', [ __CLASS__, 'notice' ] );
		add_action( 'upgrader_process_complete', [ __CLASS__, 'on_upgrade' ], 10, 2 );
	}

	/**
	 * Last stored result.
	 *
	 * @return array
	 */
	public static function last() {
		$r = get_option( self::RESULT_OPTION, [] );
		return is_array( $r ) ? $r : [];
	}

	/**
	 * Fingerprint of what the test depends on.
	 *
	 * @return string
	 */
	public static function fingerprint() {
		global $wp_version;
		return implode( '|', [ AISA_VERSION, AISA_AIOSEO_Bridge::version(), AISA_AIOSEO_Bridge::is_pro() ? 'pro' : 'lite', $wp_version ] );
	}

	/**
	 * Forces a re-test after any plugin or core update.
	 */
	public static function on_upgrade() {
		delete_option( self::RESULT_OPTION );
	}

	/**
	 * Re-tests when something changed. Throttled so a persistent failure does not re-run
	 * the test on every admin page load.
	 */
	public static function maybe_run() {
		if ( wp_doing_ajax() || ! current_user_can( 'manage_options' ) || ! AISA_AIOSEO_Bridge::is_active() ) {
			return;
		}
		$last = self::last();
		if ( isset( $last['fingerprint'] ) && $last['fingerprint'] === self::fingerprint() ) {
			return;
		}
		if ( get_transient( 'aisa_health_running' ) ) {
			return;
		}
		set_transient( 'aisa_health_running', 1, 5 * MINUTE_IN_SECONDS );
		self::run();
		delete_transient( 'aisa_health_running' );
	}

	/**
	 * Runs every check and stores the result.
	 *
	 * @return array
	 */
	public static function run() {
		global $wp_version;
		AISA_AIOSEO_Bridge::reset();

		$result = [
			'fingerprint'    => self::fingerprint(),
			'ran_at'         => gmdate( 'c' ),
			'wp_version'     => $wp_version,
			'php_version'    => PHP_VERSION,
			'plugin_version' => AISA_VERSION,
			'aioseo_active'  => AISA_AIOSEO_Bridge::is_active(),
			'aioseo_version' => AISA_AIOSEO_Bridge::version(),
			'aioseo_pro'     => AISA_AIOSEO_Bridge::is_pro(),
			'abilities_api'  => function_exists( 'wp_get_ability' ),
			'adapters'       => [],
			'site_options'   => [],
			'terms'          => false,
			'ok'             => false,
		];

		if ( ! $result['aioseo_active'] ) {
			update_option( self::RESULT_OPTION, $result, false );
			return $result;
		}

		$working = '';
		foreach ( AISA_AIOSEO_Bridge::adapters() as $adapter ) {
			$row = [
				'id'        => $adapter->id(),
				'label'     => $adapter->label(),
				'available' => false,
				'passed'    => false,
				'error'     => '',
			];
			try {
				$row['available'] = (bool) $adapter->is_available();
				if ( $row['available'] ) {
					$test          = self::round_trip( $adapter );
					$row['passed'] = true === $test;
					$row['error']  = true === $test ? '' : $test;
				}
			} catch ( \Throwable $e ) {
				$row['error'] = get_class( $e ) . ': ' . $e->getMessage();
			}
			if ( $row['passed'] && '' === $working ) {
				$working = $adapter->id();
			}
			$result['adapters'][] = $row;
		}

		foreach ( AISA_AIOSEO_Bridge::site_option_map() as $key => $path ) {
			$value                           = AISA_AIOSEO_Bridge::get_option_path( $path );
			$result['site_options'][ $key ] = is_wp_error( $value ) ? $value->get_error_message() : 'ok';
		}

		$result['terms'] = AISA_AIOSEO_Bridge::supports_terms();
		$result['ok']    = '' !== $working;

		$broken = [];
		foreach ( $result['adapters'] as $row ) {
			if ( $row['available'] && ! $row['passed'] ) {
				$broken[] = $row['id'];
			}
		}
		AISA_AIOSEO_Bridge::update_compat(
			[
				'adapter' => $working,
				'broken'  => $broken,
			]
		);

		update_option( self::RESULT_OPTION, $result, false );
		return $result;
	}

	/**
	 * Writes, reads back and deletes a temporary draft.
	 *
	 * @param AISA_Adapter $adapter Adapter.
	 * @return true|string True or an error message.
	 */
	private static function round_trip( $adapter ) {
		$post_id = wp_insert_post(
			[
				'post_title'   => 'AI SEO Autopilot compatibility test (safe to delete)',
				'post_content' => 'Temporary post created by AI SEO Autopilot to test All in One SEO compatibility.',
				'post_status'  => 'draft',
				'post_type'    => 'post',
			],
			true
		);
		if ( is_wp_error( $post_id ) ) {
			return 'Could not create a test post: ' . $post_id->get_error_message();
		}

		try {
			$fields = [
				'title'           => 'AISA test title ' . wp_generate_password( 6, false ),
				'description'     => 'AISA test description ' . wp_generate_password( 6, false ),
				'focus_keyphrase' => 'aisa test keyphrase',
				'og_title'        => 'AISA test social title',
			];
			$write = $adapter->write( $post_id, $fields );
			if ( is_wp_error( $write ) ) {
				return 'Write failed: ' . $write->get_error_message();
			}
			$read = $adapter->read( $post_id );
			if ( is_wp_error( $read ) ) {
				return 'Read failed: ' . $read->get_error_message();
			}
			foreach ( $fields as $key => $value ) {
				$got = isset( $read[ $key ] ) ? (string) $read[ $key ] : '';
				if ( $got !== $value ) {
					return sprintf( 'Field "%s" did not persist (wrote "%s", read "%s").', $key, $value, $got );
				}
			}
			return true;
		} finally {
			wp_delete_post( $post_id, true );
		}
	}

	/**
	 * Admin notice when the last test found a problem.
	 */
	public static function notice() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$url = admin_url( 'admin.php?page=ai-seo-autopilot&tab=health' );
		if ( ! AISA_AIOSEO_Bridge::is_active() ) {
			echo '<div class="notice notice-warning"><p>' . esc_html__( 'AI SEO Autopilot needs All in One SEO (Lite or Pro) to be installed and active.', 'ai-seo-autopilot' ) . '</p></div>';
			return;
		}
		$last = self::last();
		if ( isset( $last['ok'] ) && ! $last['ok'] ) {
			printf(
				'<div class="notice notice-error"><p><strong>%s</strong> %s <a href="%s">%s</a></p></div>',
				esc_html__( 'AI SEO Autopilot:', 'ai-seo-autopilot' ),
				esc_html(
					sprintf(
						/* translators: %s: AIOSEO version */
						__( 'All in One SEO %s changed in a way this plugin cannot write to yet. Nothing has been changed on your site.', 'ai-seo-autopilot' ),
						AISA_AIOSEO_Bridge::version()
					)
				),
				esc_url( $url ),
				esc_html__( 'Open the Health tab and copy the diagnostic report.', 'ai-seo-autopilot' )
			);
		}
	}

	/**
	 * Plain-text report to paste into a support request or a Claude chat.
	 *
	 * @return string
	 */
	public static function report() {
		$r     = self::last();
		$c     = AISA_AIOSEO_Bridge::compat();
		$lines = [
			'AI SEO Autopilot diagnostic report',
			'Generated: ' . gmdate( 'c' ),
			'Plugin: ' . AISA_VERSION,
			'WordPress: ' . ( isset( $r['wp_version'] ) ? $r['wp_version'] : '' ),
			'PHP: ' . PHP_VERSION,
			'AIOSEO: ' . AISA_AIOSEO_Bridge::version() . ( AISA_AIOSEO_Bridge::is_pro() ? ' (Pro)' : ' (Lite)' ),
			'Abilities API: ' . ( function_exists( 'wp_get_ability' ) ? 'yes' : 'no' ),
			'Last test: ' . ( isset( $r['ran_at'] ) ? $r['ran_at'] : 'never' ) . ' → ' . ( ! empty( $r['ok'] ) ? 'OK' : 'FAILING' ),
			'Active adapter: ' . ( ! empty( $c['adapter'] ) ? $c['adapter'] : 'none' ),
			'',
			'Adapters:',
		];
		foreach ( isset( $r['adapters'] ) ? $r['adapters'] : [] as $a ) {
			$lines[] = sprintf( '  %s: available=%s passed=%s %s', $a['id'], $a['available'] ? 'yes' : 'no', $a['passed'] ? 'yes' : 'no', $a['error'] );
		}
		$lines[] = '';
		$lines[] = 'Site options:';
		foreach ( isset( $r['site_options'] ) ? $r['site_options'] : [] as $k => $v ) {
			$lines[] = '  ' . $k . ': ' . $v;
		}
		$lines[] = '';
		$lines[] = 'Term SEO (Pro): ' . ( ! empty( $r['terms'] ) ? 'supported' : 'not available' );
		$lines[] = 'Schema filter last seen: ' . get_option( 'aisa_schema_filter_seen', 'never' );
		if ( ! empty( $c['errors'] ) ) {
			$lines[] = '';
			$lines[] = 'Recent write errors:';
			foreach ( (array) $c['errors'] as $id => $err ) {
				$lines[] = '  ' . $id . ': ' . $err;
			}
		}

		// Class/method inventory helps write a fix adapter for a changed AIOSEO build.
		$lines[] = '';
		$lines[] = 'AIOSEO surface:';
		foreach (
			[
				'\AIOSEO\Plugin\Common\Services\PostSeoService' => [ 'getSeoData', 'updateSeoData' ],
				'\AIOSEO\Plugin\Common\Models\Post'             => [ 'getPost', 'savePost', 'save', 'getColumns', 'getKeywordColumnsFromKeyphrases' ],
			] as $class => $methods
		) {
			$exists  = class_exists( $class );
			$present = [];
			foreach ( $methods as $m ) {
				$present[] = $m . '=' . ( $exists && method_exists( $class, $m ) ? 'y' : 'n' );
			}
			$lines[] = '  ' . $class . ': ' . ( $exists ? 'exists' : 'MISSING' ) . ' ' . implode( ' ', $present );
		}
		if ( function_exists( 'wp_get_ability' ) ) {
			foreach ( [ AISA_Adapter_Abilities::GET, AISA_Adapter_Abilities::UPDATE ] as $name ) {
				$ab      = wp_get_ability( $name );
				$props   = $ab && method_exists( $ab, 'get_input_schema' ) ? array_keys( (array) ( $ab->get_input_schema()['properties'] ?? [] ) ) : [];
				$lines[] = '  ability ' . $name . ': ' . ( $ab ? 'registered, input=' . implode( ',', $props ) : 'MISSING' );
			}
		}
		if ( class_exists( '\AIOSEO\Plugin\Common\Models\Post' ) && function_exists( 'aioseo' ) ) {
			try {
				$model   = new \AIOSEO\Plugin\Common\Models\Post();
				$lines[] = '  aioseo_posts columns: ' . implode( ',', array_keys( (array) $model->getColumns() ) );
			} catch ( \Throwable $e ) {
				$lines[] = '  aioseo_posts columns: error ' . $e->getMessage();
			}
		}

		return implode( "\n", $lines );
	}
}
