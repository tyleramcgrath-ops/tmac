<?php
/**
 * Star ratings, from reviews people actually leave.
 *
 * Reviews ride on WordPress comments rather than a separate table, so they
 * arrive in the Comments screen with moderation, spam filtering, editing and
 * email notifications already working, and any anti-spam plugin the client
 * installs covers them for free.
 *
 * Nothing here ever invents a number. An average exists only once approved
 * reviews exist, and the manual rating fields stay available for a client who
 * is carrying an aggregate over from somewhere else.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Comment meta key holding the 1-5 star value.
 */
const PT_RATING_META = 'pt_rating';

/**
 * Open reviews on experiences even when the site's default is closed.
 *
 * A fresh WordPress with "allow comments" unticked would otherwise hide the
 * review form on every experience with no obvious cause.
 *
 * @param bool $open    Whether comments are open.
 * @param int  $post_id Post being asked about.
 * @return bool
 */
function pt_reviews_open( $open, $post_id ) {
	if ( PT_EXPERIENCE_POST_TYPE !== get_post_type( $post_id ) ) {
		return $open;
	}

	return (bool) apply_filters( 'pt_reviews_open', true, $post_id );
}
add_filter( 'comments_open', 'pt_reviews_open', 10, 2 );

/**
 * The stored rating on a single review.
 *
 * @param int $comment_id Comment ID.
 * @return int 1-5, or 0 when the comment carries no rating.
 */
function pt_review_rating( $comment_id ) {
	$rating = (int) get_comment_meta( $comment_id, PT_RATING_META, true );

	return ( $rating >= 1 && $rating <= 5 ) ? $rating : 0;
}

/**
 * The average and count for an experience, from approved reviews only.
 *
 * Reads the cached figures written by pt_recount_reviews(). Falls back to the
 * manual fields, which exist for an aggregate carried over from elsewhere.
 *
 * @param int $post_id Experience ID.
 * @return array{average: float, count: int, source: string}
 */
function pt_rating_summary( $post_id ) {
	$count = (int) get_post_meta( $post_id, '_pt_rating_count', true );

	if ( $count > 0 ) {
		return array(
			'average' => round( (float) get_post_meta( $post_id, '_pt_rating_average', true ), 1 ),
			'count'   => $count,
			'source'  => 'reviews',
		);
	}

	$manual_average = (float) pt_field( $post_id, 'rating' );
	$manual_count   = (int) pt_field( $post_id, 'review_count' );

	if ( $manual_average > 0 && $manual_count > 0 ) {
		return array(
			'average' => round( $manual_average, 1 ),
			'count'   => $manual_count,
			'source'  => 'manual',
		);
	}

	return array(
		'average' => 0.0,
		'count'   => 0,
		'source'  => '',
	);
}

/**
 * Recalculate and cache an experience's rating.
 *
 * Counting on every page view would mean a query per card; caching it in post
 * meta means the listing grid costs nothing extra.
 *
 * @param int $post_id Experience ID.
 */
function pt_recount_reviews( $post_id ) {
	$post_id = (int) $post_id;

	if ( ! $post_id || PT_EXPERIENCE_POST_TYPE !== get_post_type( $post_id ) ) {
		return;
	}

	$comments = get_comments(
		array(
			'post_id'    => $post_id,
			'status'     => 'approve',
			'type'       => 'comment',
			'meta_key'   => PT_RATING_META, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'fields'     => 'ids',
			'no_found_rows' => true,
		)
	);

	$total = 0;
	$count = 0;

	foreach ( $comments as $comment_id ) {
		$rating = pt_review_rating( $comment_id );

		if ( $rating ) {
			$total += $rating;
			++$count;
		}
	}

	if ( $count > 0 ) {
		update_post_meta( $post_id, '_pt_rating_average', round( $total / $count, 2 ) );
		update_post_meta( $post_id, '_pt_rating_count', $count );
	} else {
		delete_post_meta( $post_id, '_pt_rating_average' );
		delete_post_meta( $post_id, '_pt_rating_count' );
	}
}

/**
 * Keep the cache correct through every way a comment can change.
 *
 * @param int $comment_id Comment ID.
 */
function pt_review_changed( $comment_id ) {
	$comment = get_comment( $comment_id );

	if ( $comment ) {
		pt_recount_reviews( (int) $comment->comment_post_ID );
	}
}
add_action( 'wp_insert_comment', 'pt_review_changed' );
add_action( 'edit_comment', 'pt_review_changed' );
add_action( 'deleted_comment', 'pt_review_changed' );
add_action( 'trashed_comment', 'pt_review_changed' );
add_action( 'untrashed_comment', 'pt_review_changed' );
add_action( 'spammed_comment', 'pt_review_changed' );
add_action( 'unspammed_comment', 'pt_review_changed' );

/**
 * Recount when a comment's approval status changes.
 *
 * @param string     $new_status New status.
 * @param string     $old_status Old status.
 * @param WP_Comment $comment    Comment object.
 */
function pt_review_status_changed( $new_status, $old_status, $comment ) {
	unset( $new_status, $old_status );
	pt_recount_reviews( (int) $comment->comment_post_ID );
}
add_action( 'transition_comment_status', 'pt_review_status_changed', 10, 3 );

/**
 * Render a row of stars.
 *
 * Whole and half stars only — a fifth of a star is not legible at this size.
 *
 * @param float  $average Average rating.
 * @param string $class   Extra class.
 * @return string
 */
function pt_stars( $average, $class = '' ) {
	$average = max( 0, min( 5, (float) $average ) );
	$out     = '<span class="stars ' . esc_attr( $class ) . '" aria-hidden="true">';

	for ( $i = 1; $i <= 5; $i++ ) {
		if ( $average >= $i ) {
			$state = 'is-full';
		} elseif ( $average >= $i - 0.5 ) {
			$state = 'is-half';
		} else {
			$state = 'is-empty';
		}

		$out .= '<span class="stars__star ' . $state . '"></span>';
	}

	return $out . '</span>';
}

/**
 * The star row plus its accessible text, for a whole experience.
 *
 * @param int $post_id Experience ID.
 * @return string Empty when the experience has no rating at all.
 */
function pt_rating_badge( $post_id ) {
	$summary = pt_rating_summary( $post_id );

	if ( ! $summary['count'] ) {
		return '';
	}

	$label = sprintf(
		/* translators: 1: average rating out of five, 2: number of reviews. */
		_n( '%1$s out of 5 from %2$s review', '%1$s out of 5 from %2$s reviews', $summary['count'], 'palmtreesurf' ),
		number_format_i18n( $summary['average'], 1 ),
		number_format_i18n( $summary['count'] )
	);

	return '<span class="rating-badge">'
		. pt_stars( $summary['average'] )
		. '<strong>' . esc_html( number_format_i18n( $summary['average'], 1 ) ) . '</strong>'
		. '<span class="rating-badge__count">(' . esc_html( number_format_i18n( $summary['count'] ) ) . ')</span>'
		. '<span class="screen-reader-text">' . esc_html( $label ) . '</span>'
		. '</span>';
}

/**
 * The star selector on the review form.
 *
 * Radio inputs, so it works with a keyboard and without JavaScript. The CSS
 * paints them as stars.
 *
 * @param string $fields Comment form fields markup.
 * @return string
 */
function pt_review_rating_field( $fields ) {
	if ( PT_EXPERIENCE_POST_TYPE !== get_post_type() ) {
		return $fields;
	}

	$out = '<fieldset class="review-form__rating"><legend>' . esc_html__( 'Your rating', 'palmtreesurf' ) . ' <span class="required">*</span></legend><div class="review-form__stars">';

	// Reversed, so the CSS sibling selector can light up the stars to the left.
	for ( $i = 5; $i >= 1; $i-- ) {
		$id  = 'pt-rating-' . $i;
		$out .= '<input type="radio" id="' . esc_attr( $id ) . '" name="pt_rating" value="' . esc_attr( (string) $i ) . '" required />';
		$out .= '<label for="' . esc_attr( $id ) . '"><span class="screen-reader-text">'
			. esc_html(
				sprintf(
					/* translators: %s: number of stars. */
					_n( '%s star', '%s stars', $i, 'palmtreesurf' ),
					number_format_i18n( $i )
				)
			)
			. '</span></label>';
	}

	return $out . '</div></fieldset>' . $fields;
}
add_filter( 'comment_form_field_comment', 'pt_review_rating_field' );

/**
 * Reword the comment form for reviews.
 *
 * @param array<string, mixed> $defaults Comment form defaults.
 * @return array<string, mixed>
 */
function pt_review_form_labels( $defaults ) {
	if ( PT_EXPERIENCE_POST_TYPE !== get_post_type() ) {
		return $defaults;
	}

	$defaults['title_reply']          = __( 'Leave a review', 'palmtreesurf' );
	$defaults['label_submit']         = __( 'Submit review', 'palmtreesurf' );
	$defaults['comment_notes_before'] = '<p class="review-form__note">' . esc_html__( 'Reviews are read before they go live, so yours will not appear straight away. Your email address is never published.', 'palmtreesurf' ) . '</p>';
	$defaults['comment_field']        = str_replace(
		__( 'Comment' ),
		__( 'Your review', 'palmtreesurf' ),
		isset( $defaults['comment_field'] ) ? $defaults['comment_field'] : ''
	);
	$defaults['class_form']           = 'comment-form review-form';

	return $defaults;
}
add_filter( 'comment_form_defaults', 'pt_review_form_labels' );

/**
 * Require a star rating on an experience review.
 *
 * @param array<string, mixed> $commentdata Comment being posted.
 * @return array<string, mixed>
 */
function pt_require_review_rating( $commentdata ) {
	if ( PT_EXPERIENCE_POST_TYPE !== get_post_type( $commentdata['comment_post_ID'] ) ) {
		return $commentdata;
	}

	// The comment form's own nonce has already been checked by WordPress.
	$rating = isset( $_POST['pt_rating'] ) ? (int) $_POST['pt_rating'] : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing

	if ( $rating < 1 || $rating > 5 ) {
		wp_die(
			esc_html__( 'Please choose a star rating before submitting your review.', 'palmtreesurf' ),
			esc_html__( 'Rating required', 'palmtreesurf' ),
			array(
				'response'  => 400,
				'back_link' => true,
			)
		);
	}

	return $commentdata;
}
add_filter( 'preprocess_comment', 'pt_require_review_rating' );

/**
 * Store the rating against the new review.
 *
 * @param int $comment_id Comment ID.
 */
function pt_save_review_rating( $comment_id ) {
	$comment = get_comment( $comment_id );

	if ( ! $comment || PT_EXPERIENCE_POST_TYPE !== get_post_type( $comment->comment_post_ID ) ) {
		return;
	}

	// Validated in pt_require_review_rating(), which runs on the same request.
	$rating = isset( $_POST['pt_rating'] ) ? (int) $_POST['pt_rating'] : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing

	if ( $rating >= 1 && $rating <= 5 ) {
		add_comment_meta( $comment_id, PT_RATING_META, $rating, true );
	}

	pt_recount_reviews( (int) $comment->comment_post_ID );
}
add_action( 'comment_post', 'pt_save_review_rating' );

/**
 * Hold every review for moderation.
 *
 * A review that publishes itself is a review nobody checked. The client can
 * lift this with the filter if they would rather trust the spam plugin.
 *
 * @param int|string $approved    Approval decision so far.
 * @param array      $commentdata Comment being posted.
 * @return int|string
 */
function pt_moderate_reviews( $approved, $commentdata ) {
	if ( 'spam' === $approved || 'trash' === $approved ) {
		return $approved;
	}

	if ( PT_EXPERIENCE_POST_TYPE !== get_post_type( $commentdata['comment_post_ID'] ) ) {
		return $approved;
	}

	return apply_filters( 'pt_moderate_reviews', true ) ? 0 : $approved;
}
add_filter( 'pre_comment_approved', 'pt_moderate_reviews', 20, 2 );

/**
 * Show the rating in the Comments screen, so moderation has the context.
 *
 * @param array<string, string> $columns Column headings.
 * @return array<string, string>
 */
function pt_review_admin_column( $columns ) {
	$columns['pt_rating'] = __( 'Rating', 'palmtreesurf' );

	return $columns;
}
add_filter( 'manage_edit-comments_columns', 'pt_review_admin_column' );

/**
 * Fill the rating column.
 *
 * @param string $column     Column key.
 * @param int    $comment_id Comment ID.
 */
function pt_review_admin_cell( $column, $comment_id ) {
	if ( 'pt_rating' !== $column ) {
		return;
	}

	$rating = pt_review_rating( $comment_id );

	echo $rating ? esc_html( str_repeat( '★', $rating ) . str_repeat( '☆', 5 - $rating ) ) : '&mdash;';
}
add_action( 'manage_comments_custom_column', 'pt_review_admin_cell', 10, 2 );

/**
 * Render one review.
 *
 * @param WP_Comment $comment Comment object.
 * @param array      $args    wp_list_comments arguments.
 * @param int        $depth   Nesting depth.
 */
function pt_review_item( $comment, $args, $depth ) {
	unset( $args, $depth );

	$rating = pt_review_rating( $comment->comment_ID );
	?>
	<li <?php comment_class( 'review', $comment ); ?> id="comment-<?php comment_ID(); ?>">
		<article class="review__inner">
			<header class="review__head">
				<div>
					<p class="review__author"><?php echo esc_html( get_comment_author( $comment ) ); ?></p>
					<p class="review__date">
						<time datetime="<?php echo esc_attr( get_comment_date( 'c', $comment ) ); ?>">
							<?php echo esc_html( get_comment_date( '', $comment ) ); ?>
						</time>
					</p>
				</div>

				<?php if ( $rating ) : ?>
					<p class="review__rating">
						<?php echo pt_stars( $rating ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static markup. ?>
						<span class="screen-reader-text">
							<?php
							printf(
								/* translators: %s: number of stars. */
								esc_html__( '%s out of 5', 'palmtreesurf' ),
								esc_html( number_format_i18n( $rating ) )
							);
							?>
						</span>
					</p>
				<?php endif; ?>
			</header>

			<div class="review__body"><?php comment_text( $comment ); ?></div>

			<?php if ( '0' === $comment->comment_approved ) : ?>
				<p class="review__pending"><?php esc_html_e( 'Thanks — your review is with us and will appear once we have read it.', 'palmtreesurf' ); ?></p>
			<?php endif; ?>
		</article>
	</li>
	<?php
}

/**
 * The distribution bars in the review summary.
 *
 * @param int $post_id Experience ID.
 * @return array<int, int> Star value => number of reviews.
 */
function pt_rating_breakdown( $post_id ) {
	$breakdown = array( 5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0 );

	$comments = get_comments(
		array(
			'post_id'       => $post_id,
			'status'        => 'approve',
			'type'          => 'comment',
			'meta_key'      => PT_RATING_META, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'fields'        => 'ids',
			'no_found_rows' => true,
		)
	);

	foreach ( $comments as $comment_id ) {
		$rating = pt_review_rating( $comment_id );

		if ( $rating ) {
			++$breakdown[ $rating ];
		}
	}

	return $breakdown;
}

/**
 * Add AggregateRating and the individual Review nodes to an experience.
 *
 * Only ever from approved reviews that are actually on the page.
 *
 * @param array<string, mixed> $data    Product schema.
 * @param int                  $post_id Experience ID.
 * @return array<string, mixed>
 */
function pt_review_schema( $data, $post_id ) {
	$summary = pt_rating_summary( $post_id );

	if ( ! $summary['count'] ) {
		return $data;
	}

	$data['aggregateRating'] = array(
		'@type'       => 'AggregateRating',
		'ratingValue' => (string) $summary['average'],
		'reviewCount' => $summary['count'],
		'bestRating'  => '5',
		'worstRating' => '1',
	);

	if ( 'reviews' !== $summary['source'] ) {
		return $data;
	}

	$comments = get_comments(
		array(
			'post_id'       => $post_id,
			'status'        => 'approve',
			'type'          => 'comment',
			'meta_key'      => PT_RATING_META, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'number'        => 10,
			'no_found_rows' => true,
		)
	);

	$reviews = array();

	foreach ( $comments as $comment ) {
		$rating = pt_review_rating( $comment->comment_ID );

		if ( ! $rating ) {
			continue;
		}

		$reviews[] = array(
			'@type'         => 'Review',
			'author'        => array(
				'@type' => 'Person',
				'name'  => get_comment_author( $comment ),
			),
			'datePublished' => get_comment_date( 'Y-m-d', $comment ),
			'reviewBody'    => wp_strip_all_tags( $comment->comment_content ),
			'reviewRating'  => array(
				'@type'       => 'Rating',
				'ratingValue' => (string) $rating,
				'bestRating'  => '5',
				'worstRating' => '1',
			),
		);
	}

	if ( $reviews ) {
		$data['review'] = $reviews;
	}

	return $data;
}
add_filter( 'pt_experience_schema', 'pt_review_schema', 10, 2 );
