<?php
/**
 * One page people can be sent to, to leave a review.
 *
 * Reviews already worked, but only on a tour's own page — a guest had to find
 * palmtreesurf.com, find the right tour, scroll past the booking form and know
 * that the thing at the bottom was a review form. For somebody who flew home
 * three days ago that is enough friction to lose the review.
 *
 * So this is a front door: one short URL, printable as a QR code, where the
 * guest picks their tour from a list and leaves the review in four fields.
 *
 * It is a front door and not a second system. Every submission goes through
 * the same WordPress comment pipeline as before, which means moderation, spam
 * filtering, the Comments screen, the per-tour average and the Schema.org
 * rating all keep working with nothing new to maintain.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * The page template that marks the reviews page.
 */
const PT_REVIEWS_TEMPLATE = 'page-templates/page-reviews.php';

/**
 * The reviews page, found by its template rather than by slug.
 *
 * Slug-based lookup breaks the moment somebody renames the page, which they
 * will, because "leave-a-review" is the sort of thing people tidy.
 *
 * @return int Page ID, or 0 when the page does not exist.
 */
function pt_reviews_page_id() {
	static $cached = null;

	if ( null !== $cached ) {
		return $cached;
	}

	$found = get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_key'       => '_wp_page_template', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_value'     => PT_REVIEWS_TEMPLATE, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
		)
	);

	$cached = $found ? (int) $found[0] : 0;

	return $cached;
}

/**
 * The reviews page URL, for sharing and for the QR code.
 *
 * @return string Empty when the page does not exist.
 */
function pt_reviews_page_url() {
	$id = pt_reviews_page_id();

	return $id ? (string) get_permalink( $id ) : '';
}

/**
 * Everything a review can be left against.
 *
 * @return array<int, string> Post ID => label, tours first.
 */
function pt_review_hosts() {
	$hosts = array();

	$experiences = get_posts(
		array(
			'post_type'      => PT_EXPERIENCE_POST_TYPE,
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'orderby'        => 'title',
			'order'          => 'ASC',
		)
	);

	foreach ( $experiences as $experience ) {
		$hosts[ (int) $experience->ID ] = pt_translate_seeded( $experience->post_title );
	}

	return $hosts;
}

/* -------------------------------------------------------------------------
 * Reading what has come in
 * ---------------------------------------------------------------------- */

/**
 * Approved reviews across the whole site, newest first.
 *
 * @param int $limit How many to return.
 * @return array<int, WP_Comment>
 */
function pt_recent_reviews( $limit = 30 ) {
	$comments = get_comments(
		array(
			'status'     => 'approve',
			'type'       => 'comment',
			'number'     => (int) $limit,
			'orderby'    => 'comment_date_gmt',
			'order'      => 'DESC',
			'meta_query' => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				array(
					'key'     => PT_RATING_META,
					'compare' => 'EXISTS',
				),
			),
		)
	);

	// A review on a post that is no longer a host — a retired tour — is not
	// shown, because the heading it would sit under no longer means anything.
	return array_values(
		array_filter(
			$comments,
			static function ( $comment ) {
				return pt_is_review_host( $comment->comment_post_ID );
			}
		)
	);
}

/**
 * The average and count across every tour, from approved reviews only.
 *
 * Counted from the reviews themselves rather than averaged from the per-tour
 * averages, because averaging averages weights a tour with two reviews the
 * same as one with twenty.
 *
 * Cached, and cleared whenever a review changes.
 *
 * @return array{average: float, count: int}
 */
function pt_site_rating_summary() {
	$cached = get_transient( 'pt_site_rating' );

	if ( is_array( $cached ) ) {
		return $cached;
	}

	$total = 0;
	$count = 0;

	foreach ( pt_recent_reviews( 500 ) as $comment ) {
		$rating = pt_review_rating( $comment->comment_ID );

		if ( $rating ) {
			$total += $rating;
			++$count;
		}
	}

	$summary = array(
		'average' => $count ? round( $total / $count, 1 ) : 0.0,
		'count'   => $count,
	);

	set_transient( 'pt_site_rating', $summary, DAY_IN_SECONDS );

	return $summary;
}

/**
 * Drop the cached site average when any review changes.
 */
function pt_clear_site_rating() {
	delete_transient( 'pt_site_rating' );
}
add_action( 'wp_insert_comment', 'pt_clear_site_rating' );
add_action( 'edit_comment', 'pt_clear_site_rating' );
add_action( 'deleted_comment', 'pt_clear_site_rating' );
add_action( 'trashed_comment', 'pt_clear_site_rating' );
add_action( 'untrashed_comment', 'pt_clear_site_rating' );
add_action( 'spammed_comment', 'pt_clear_site_rating' );
add_action( 'unspammed_comment', 'pt_clear_site_rating' );
add_action( 'transition_comment_status', 'pt_clear_site_rating' );

/* -------------------------------------------------------------------------
 * Sending them back somewhere sensible
 * ---------------------------------------------------------------------- */

/**
 * Return a review left on the reviews page to the reviews page.
 *
 * WordPress sends a commenter to the permalink of whatever they commented on.
 * For a review left here that is the tour page, which the guest never asked to
 * see and which — because the review is held for moderation — shows no sign
 * their review arrived at all.
 *
 * @param string     $location Where WordPress intends to send them.
 * @param WP_Comment $comment  The review just posted.
 * @return string
 */
function pt_review_redirect( $location, $comment ) {
	// phpcs:ignore WordPress.Security.NonceVerification.Missing -- WordPress verified the comment form before this runs.
	if ( empty( $_POST['pt_review_source'] ) ) {
		return $location;
	}

	$page = pt_reviews_page_url();

	if ( ! $page ) {
		return $location;
	}

	$state = ( '1' === (string) $comment->comment_approved ) ? 'published' : 'received';

	return add_query_arg( 'pt_review', $state, $page ) . '#review-status';
}
add_filter( 'comment_post_redirect', 'pt_review_redirect', 10, 2 );

/**
 * What to tell somebody arriving back from a submission.
 *
 * @return string 'published', 'received', or '' when they just arrived.
 */
function pt_review_state() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Chooses a message, nothing more.
	$state = isset( $_GET['pt_review'] ) ? sanitize_key( wp_unslash( $_GET['pt_review'] ) ) : '';

	return in_array( $state, array( 'published', 'received' ), true ) ? $state : '';
}

/* -------------------------------------------------------------------------
 * Keeping rubbish out of a form that anyone with the link can reach
 * ---------------------------------------------------------------------- */

/**
 * Check the review page's own guards before the comment is accepted.
 *
 * WordPress does not put a nonce on comment submission, which is reasonable
 * for a blog but thin for a form whose URL is printed on a card and left on a
 * counter. Two cheap guards: a nonce, so the form has to have been served by
 * us, and an input no human fills in.
 *
 * Only applies to submissions from the review page — the review form on a
 * tour's own page carries neither field and must keep working.
 *
 * @param array<string, mixed> $commentdata Comment being posted.
 * @return array<string, mixed>
 */
function pt_check_review_page_submission( $commentdata ) {
	// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Verified immediately below.
	if ( empty( $_POST['pt_review_source'] ) ) {
		return $commentdata;
	}

	$nonce = isset( $_POST['pt_review_nonce'] ) ? sanitize_key( wp_unslash( $_POST['pt_review_nonce'] ) ) : '';

	if ( ! wp_verify_nonce( $nonce, 'pt_review' ) ) {
		wp_die(
			esc_html__( 'That form had been open a while and has expired. Please go back, reload the page and send it again — your words are still in the box.', 'palmtreesurf' ),
			esc_html__( 'Form expired', 'palmtreesurf' ),
			array(
				'response'  => 403,
				'back_link' => true,
			)
		);
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified above.
	if ( ! empty( $_POST['pt_review_website'] ) ) {
		// Say nothing useful to whatever filled it in.
		wp_die(
			esc_html__( 'Thank you.', 'palmtreesurf' ),
			esc_html__( 'Thank you', 'palmtreesurf' ),
			array( 'response' => 200 )
		);
	}

	if ( ! pt_is_review_host( $commentdata['comment_post_ID'] ) ) {
		wp_die(
			esc_html__( 'Please choose which trip you went on.', 'palmtreesurf' ),
			esc_html__( 'Trip required', 'palmtreesurf' ),
			array(
				'response'  => 400,
				'back_link' => true,
			)
		);
	}

	return $commentdata;
}
add_filter( 'preprocess_comment', 'pt_check_review_page_submission', 5 );
