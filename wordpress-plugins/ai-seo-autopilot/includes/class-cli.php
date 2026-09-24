<?php
/**
 * WP-CLI commands, for large sites where a browser tab is not practical.
 *
 * Run with a user who can edit posts, e.g.:
 *   wp aisa health --user=admin
 *   wp aisa run --user=admin            # generate everything, then apply
 *   wp aisa run --review --user=admin   # generate only; apply later in the admin
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AISA_CLI {
	/**
	 * Runs the compatibility self-test and prints the diagnostic report.
	 *
	 * @subcommand health
	 */
	public function health() {
		$r = AISA_Health_Check::run();
		WP_CLI::line( AISA_Health_Check::report() );
		if ( $r['ok'] ) {
			WP_CLI::success( 'Compatible.' );
		} else {
			WP_CLI::error( 'Not compatible. Paste the report above into a Claude chat to get a fix.' );
		}
	}

	/**
	 * Generates SEO for everything (and applies it unless --review).
	 *
	 * ## OPTIONS
	 *
	 * [--review]
	 * : Only generate proposals; do not write to AIOSEO.
	 *
	 * [--regenerate]
	 * : Regenerate items that already have a proposal.
	 *
	 * [--skip-profile]
	 * : Do not build or apply the site profile.
	 *
	 * @subcommand run
	 */
	public function run( $args, $assoc ) {
		if ( ! get_current_user_id() ) {
			WP_CLI::error( 'Pass --user=<admin> so All in One SEO permission checks pass.' );
		}
		$review     = ! empty( $assoc['review'] );
		$regenerate = ! empty( $assoc['regenerate'] );

		if ( empty( $assoc['skip-profile'] ) && ! get_option( AISA_Generator::PROFILE_OPTION . '_applied' ) ) {
			WP_CLI::line( 'Building site profile…' );
			$profile = AISA_Generator::generate_profile();
			if ( is_wp_error( $profile ) ) {
				WP_CLI::warning( 'Site profile skipped: ' . $profile->get_error_message() );
			} elseif ( $review ) {
				update_option( AISA_Generator::PROFILE_OPTION, $profile, false );
				WP_CLI::line( 'Site profile saved for review (not applied).' );
			} else {
				foreach ( AISA_Jobs::apply_profile( $profile ) as $k => $v ) {
					WP_CLI::line( "  {$k}: {$v}" );
				}
			}
		}

		$items    = AISA_Jobs::targets();
		$progress = \WP_CLI\Utils\make_progress_bar( 'Optimizing', count( $items ) );
		$errors   = 0;
		foreach ( $items as $item ) {
			if ( $regenerate || empty( $item['proposal'] ) ) {
				$gen = AISA_Jobs::generate( $item['type'], $item['id'] );
				if ( is_wp_error( $gen ) ) {
					$errors++;
					WP_CLI::warning( "{$item['type']} {$item['id']}: " . $gen->get_error_message() );
					$progress->tick();
					continue;
				}
			}
			if ( ! $review && 'applied' !== $item['status'] ) {
				$applied = AISA_Jobs::apply( $item['type'], $item['id'] );
				if ( is_wp_error( $applied ) ) {
					$errors++;
					WP_CLI::warning( "{$item['type']} {$item['id']}: " . $applied->get_error_message() );
				}
			}
			$progress->tick();
		}
		$progress->finish();

		if ( $errors ) {
			WP_CLI::warning( "{$errors} item(s) failed; run again to retry them." );
		} else {
			WP_CLI::success( $review ? 'Proposals ready for review in the admin.' : 'Done.' );
		}
	}

	/**
	 * Restores the previous SEO values for one item or everything.
	 *
	 * ## OPTIONS
	 *
	 * [<id>]
	 * : Post ID. Omit with --all.
	 *
	 * [--all]
	 * : Restore every item that has a backup, and the site settings.
	 *
	 * @subcommand restore
	 */
	public function restore( $args, $assoc ) {
		if ( ! get_current_user_id() ) {
			WP_CLI::error( 'Pass --user=<admin>.' );
		}
		if ( ! empty( $assoc['all'] ) ) {
			foreach ( AISA_Jobs::targets() as $item ) {
				if ( $item['history'] > 0 ) {
					$r = AISA_Jobs::restore( $item['type'], $item['id'] );
					WP_CLI::line( "{$item['type']} {$item['id']}: " . ( is_wp_error( $r ) ? $r->get_error_message() : 'restored' ) );
				}
			}
			AISA_Jobs::restore_profile();
			WP_CLI::success( 'Restored.' );
			return;
		}
		$id = isset( $args[0] ) ? absint( $args[0] ) : 0;
		if ( ! $id ) {
			WP_CLI::error( 'Give a post ID or --all.' );
		}
		$r = AISA_Jobs::restore( 'post', $id );
		is_wp_error( $r ) ? WP_CLI::error( $r->get_error_message() ) : WP_CLI::success( 'Restored.' );
	}
}
