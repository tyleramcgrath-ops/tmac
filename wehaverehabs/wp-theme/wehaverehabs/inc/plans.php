<?php
/**
 * Listing tiers, facility owner accounts and Stripe billing.
 *
 *   public     Imported listing nobody has claimed: source facts only, plus a claim form.
 *   essential  Free. Claimed and verified: owner edits the facts and a short description,
 *              shows a "Verified" badge and receives inquiries directly.
 *   signature  Paid. The full profile: photos, story, rates, rooms, team, daily rhythm, WhatsApp.
 *   featured   Paid. Signature plus top placement, the homepage rotation and a "Sponsored" label.
 *
 * Paid plans are bought through Stripe Payment Links (Customizer → We Have Rehabs → Plans).
 * The Stripe webhook turns a plan on when a payment succeeds, extends it on each renewal and
 * ends it when the subscription is cancelled. Admins can also set a plan by hand.
 *
 * @package WeHaveRehabs
 */

defined( 'ABSPATH' ) || exit;

/**
 * Plan definitions.
 *
 * @return array slug => [name, rank]
 */
function whr_plans() {
	return array(
		'public'    => array( __( 'Public listing', 'wehaverehabs' ), 0 ),
		'essential' => array( __( 'Essential', 'wehaverehabs' ), 1 ),
		'signature' => array( __( 'Signature', 'wehaverehabs' ), 2 ),
		'featured'  => array( __( 'Featured', 'wehaverehabs' ), 3 ),
	);
}

/**
 * The plan a listing is on right now.
 *
 * Listings the site team created by hand (no import source) get the full profile by default.
 *
 * @param int|null $post_id Post ID.
 * @return string Plan slug.
 */
function whr_plan( $post_id = null ) {
	$post_id = $post_id ? $post_id : get_the_ID();
	$plan    = (string) whr_meta( 'plan', $post_id );
	$until   = (string) whr_meta( 'plan_until', $post_id );
	$paid    = in_array( $plan, array( 'signature', 'featured' ), true ) && ( '' === $until || $until >= current_time( 'Y-m-d' ) );
	if ( $paid ) {
		return $plan;
	}
	$source = (string) whr_meta( 'source', $post_id );
	if ( '' === $source || 'manual' === $source ) {
		return '' === $plan ? 'signature' : ( 'essential' === $plan ? 'essential' : 'signature' );
	}
	return whr_meta( 'claimed', $post_id ) ? 'essential' : 'public';
}

/**
 * Plan rank: 0 public … 3 featured.
 *
 * @param int|null $post_id Post ID.
 * @return int
 */
function whr_plan_rank( $post_id = null ) {
	return whr_plans()[ whr_plan( $post_id ) ][1];
}

/**
 * Whether the listing shows the full, photo-led profile.
 *
 * @param int|null $post_id Post ID.
 * @return bool
 */
function whr_has_full_profile( $post_id = null ) {
	return whr_plan_rank( $post_id ) >= 2;
}

/**
 * Whether the listing is marked and ranked as sponsored (Featured plan or set by hand).
 *
 * @param int|null $post_id Post ID.
 * @return bool
 */
function whr_is_sponsored( $post_id = null ) {
	return (bool) whr_meta( 'sponsored', $post_id ) || 'featured' === whr_plan( $post_id );
}

/**
 * Stripe Payment Link for a plan, tied to one listing so the webhook knows what was bought.
 *
 * @param string   $plan    signature|featured.
 * @param int|null $post_id Post ID.
 * @return string URL or ''.
 */
function whr_plan_checkout_url( $plan, $post_id = null ) {
	$link = whr_option( 'stripe_' . $plan );
	if ( ! $link ) {
		return '';
	}
	$post_id = $post_id ? $post_id : get_the_ID();
	$args    = array( 'client_reference_id' => $post_id . '-' . $plan );
	$email   = whr_meta( 'inquiry_email', $post_id );
	if ( is_email( $email ) ) {
		$args['prefilled_email'] = $email;
	}
	return add_query_arg( array_map( 'rawurlencode', $args ), $link );
}

/** Admin- and owner-facing plan fields (shown in the "Plan & billing" box, not the field groups). */
function whr_plan_fields() {
	return array(
		'whr_plan'       => array( __( 'Plan', 'wehaverehabs' ), 'select', '', 'plan' ),
		'whr_plan_until' => array( __( 'Paid until', 'wehaverehabs' ), 'date', __( 'Leave empty for no end date. Set automatically by Stripe renewals.', 'wehaverehabs' ), 'plan' ),
	);
}

/**
 * Fields only the site team may change.
 *
 * @return string[]
 */
function whr_staff_only_fields() {
	return array( 'whr_sponsored', 'whr_featured', 'whr_license_checked', 'whr_claimed', 'whr_source', 'whr_source_id', 'whr_source_url', 'whr_source_date', 'whr_lat', 'whr_lng', 'whr_plan', 'whr_plan_until' );
}

/**
 * Fields that only appear on the page with a paid plan.
 *
 * @return string[]
 */
function whr_paid_fields() {
	return array( 'whr_tagline', 'whr_price_from', 'whr_currency', 'whr_stay_min', 'whr_stay_max', 'whr_guests', 'whr_whatsapp', 'whr_airport', 'whr_gallery', 'whr_schedule', 'whr_clinical', 'whr_complementary', 'whr_team', 'whr_rooms', 'whr_included', 'whr_not_included', 'whr_guest_quote', 'whr_guest_attribution' );
}

/** Whether the current user is site staff (rather than a facility owner). */
function whr_is_staff() {
	return current_user_can( 'edit_others_sanctuaries' );
}

/* ---------------------------------------------------------------------------
 * Owner accounts
 * ------------------------------------------------------------------------- */

/** Capabilities for the sanctuary post type. */
function whr_sanctuary_caps() {
	return array( 'edit_sanctuaries', 'edit_others_sanctuaries', 'edit_published_sanctuaries', 'edit_private_sanctuaries', 'publish_sanctuaries', 'read_private_sanctuaries', 'delete_sanctuaries', 'delete_others_sanctuaries', 'delete_published_sanctuaries', 'delete_private_sanctuaries', 'create_sanctuaries' );
}

/** Give staff the sanctuary capabilities and create the owner role. Runs once per theme version. */
function whr_setup_roles() {
	foreach ( array( 'administrator', 'editor' ) as $role_name ) {
		$role = get_role( $role_name );
		if ( $role ) {
			foreach ( whr_sanctuary_caps() as $cap ) {
				$role->add_cap( $cap );
			}
		}
	}
	remove_role( 'whr_owner' );
	add_role(
		'whr_owner',
		__( 'Facility owner', 'wehaverehabs' ),
		array(
			'read'                       => true,
			'upload_files'               => true,
			'edit_sanctuaries'           => true,
			'edit_published_sanctuaries' => true,
		)
	);
	update_option( 'whr_roles_version', WHR_VERSION );
}
add_action( 'after_switch_theme', 'whr_setup_roles' );
add_action(
	'init',
	function () {
		if ( get_option( 'whr_roles_version' ) !== WHR_VERSION ) {
			whr_setup_roles();
		}
	},
	1
);

/** Owners only see their own listings and photos in wp-admin. */
add_action(
	'pre_get_posts',
	function ( $q ) {
		if ( is_admin() && $q->is_main_query() && 'sanctuary' === $q->get( 'post_type' ) && current_user_can( 'edit_sanctuaries' ) && ! whr_is_staff() ) {
			$q->set( 'author', get_current_user_id() );
		}
	}
);
add_filter(
	'ajax_query_attachments_args',
	function ( $args ) {
		if ( current_user_can( 'edit_sanctuaries' ) && ! whr_is_staff() ) {
			$args['author'] = get_current_user_id();
		}
		return $args;
	}
);

/** Owners land on their listing rather than the dashboard. */
add_filter(
	'login_redirect',
	function ( $redirect, $requested, $user ) {
		if ( $user instanceof WP_User && in_array( 'whr_owner', (array) $user->roles, true ) ) {
			return admin_url( 'edit.php?post_type=sanctuary' );
		}
		return $redirect;
	},
	10,
	3
);

/** Tell the site team when an owner edits a published listing. */
add_action(
	'post_updated',
	function ( $post_id, $after ) {
		if ( 'sanctuary' !== $after->post_type || ! is_user_logged_in() || whr_is_staff() || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		if ( get_transient( 'whr_owner_edit_' . $post_id ) ) {
			return; // One email per listing per hour.
		}
		set_transient( 'whr_owner_edit_' . $post_id, 1, HOUR_IN_SECONDS );
		wp_mail(
			get_option( 'admin_email' ),
			/* translators: %s: listing name */
			sprintf( __( 'Listing updated by its owner: %s', 'wehaverehabs' ), $after->post_title ),
			get_permalink( $post_id ) . "\n" . admin_url( 'post.php?action=edit&post=' . $post_id ) . "\n\n" . admin_url( 'revision.php?revision=' . $post_id )
		);
	},
	10,
	2
);

/**
 * Approve a claim: create (or reuse) the claimant's owner account, hand them the listing,
 * mark it claimed and send them a link to set their password.
 *
 * @param int $inquiry_id Claim request (whr_inquiry post).
 * @return int|WP_Error Owner user ID.
 */
function whr_approve_claim( $inquiry_id ) {
	$sanctuary_id = (int) get_post_meta( $inquiry_id, '_whr_sanctuary', true );
	$email        = sanitize_email( get_post_meta( $inquiry_id, '_whr_email', true ) );
	$name         = sanitize_text_field( get_post_meta( $inquiry_id, '_whr_name', true ) );
	if ( ! $sanctuary_id || 'sanctuary' !== get_post_type( $sanctuary_id ) || ! is_email( $email ) ) {
		return new WP_Error( 'whr_claim', __( 'This claim request is missing its listing or email.', 'wehaverehabs' ) );
	}
	$user = get_user_by( 'email', $email );
	$new  = false;
	if ( ! $user ) {
		$login = sanitize_user( strtolower( strtok( $email, '@' ) ), true );
		$base  = $login ? $login : 'owner';
		$i     = 1;
		while ( username_exists( $login ) || ! $login ) {
			$login = $base . ++$i;
		}
		$user_id = wp_insert_user(
			array(
				'user_login'   => $login,
				'user_email'   => $email,
				'user_pass'    => wp_generate_password( 24 ),
				'display_name' => $name ? $name : $login,
				'first_name'   => $name,
				'role'         => 'whr_owner',
			)
		);
		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}
		$user = get_user_by( 'id', $user_id );
		$new  = true;
	} elseif ( ! user_can( $user, 'edit_others_sanctuaries' ) && ! in_array( 'whr_owner', (array) $user->roles, true ) ) {
		$user->add_role( 'whr_owner' );
	}

	wp_update_post( array( 'ID' => $sanctuary_id, 'post_author' => $user->ID ) );
	update_post_meta( $sanctuary_id, 'whr_claimed', 1 );
	if ( ! is_email( whr_meta( 'inquiry_email', $sanctuary_id ) ) ) {
		update_post_meta( $sanctuary_id, 'whr_inquiry_email', $email );
	}
	update_post_meta( $inquiry_id, '_whr_approved', current_time( 'mysql' ) );

	$title = get_the_title( $sanctuary_id );
	$body  = sprintf(
		/* translators: 1: listing name 2: site name */
		__( "Good news — your claim for %1\$s on %2\$s has been approved.\n\nYou can now update your listing, and guest inquiries will come straight to you.", 'wehaverehabs' ),
		$title,
		get_bloginfo( 'name' )
	);
	if ( $new ) {
		$key   = get_password_reset_key( $user );
		$body .= "\n\n" . __( 'Set your password here:', 'wehaverehabs' ) . "\n" . network_site_url( 'wp-login.php?action=rp&key=' . rawurlencode( (string) $key ) . '&login=' . rawurlencode( $user->user_login ), 'login' );
	} else {
		$body .= "\n\n" . __( 'Log in here:', 'wehaverehabs' ) . "\n" . wp_login_url( admin_url( 'edit.php?post_type=sanctuary' ) );
	}
	$body .= "\n\n" . __( 'Want photos, your full story, rates and top placement? See the plans:', 'wehaverehabs' ) . "\n" . admin_url( 'post.php?action=edit&post=' . $sanctuary_id );
	/* translators: %s: listing name */
	wp_mail( $email, sprintf( __( 'Your listing is ready: %s', 'wehaverehabs' ), $title ), $body );

	return $user->ID;
}

/** "Approve claim" row action on claim requests. */
add_filter(
	'post_row_actions',
	function ( $actions, $post ) {
		if ( 'whr_inquiry' === $post->post_type && 'claim' === get_post_meta( $post->ID, '_whr_kind', true ) && current_user_can( 'edit_others_sanctuaries' ) ) {
			if ( get_post_meta( $post->ID, '_whr_approved', true ) ) {
				$actions['whr_approved'] = '<span style="color:#2f6b3a">' . esc_html__( 'Approved', 'wehaverehabs' ) . '</span>';
			} else {
				$url                    = wp_nonce_url( admin_url( 'admin-post.php?action=whr_approve_claim&inquiry=' . $post->ID ), 'whr_approve_claim_' . $post->ID );
				$actions['whr_approve'] = '<a href="' . esc_url( $url ) . '" onclick="return confirm(\'' . esc_js( __( 'Approve this claim? The claimant gets an owner account for this listing.', 'wehaverehabs' ) ) . '\')">' . esc_html__( 'Approve claim', 'wehaverehabs' ) . '</a>';
			}
		}
		return $actions;
	},
	10,
	2
);
add_action(
	'admin_post_whr_approve_claim',
	function () {
		$id = isset( $_GET['inquiry'] ) ? absint( $_GET['inquiry'] ) : 0;
		check_admin_referer( 'whr_approve_claim_' . $id );
		if ( ! current_user_can( 'edit_others_sanctuaries' ) ) {
			wp_die( esc_html__( 'Sorry, you cannot approve claims.', 'wehaverehabs' ) );
		}
		$result = whr_approve_claim( $id );
		$status = is_wp_error( $result ) ? 'error' : 'approved';
		wp_safe_redirect( add_query_arg( 'whr_claim', $status, admin_url( 'edit.php?post_type=whr_inquiry' ) ) );
		exit;
	}
);
add_action(
	'admin_notices',
	function () {
		$status = isset( $_GET['whr_claim'] ) ? sanitize_key( $_GET['whr_claim'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( 'approved' === $status ) {
			echo '<div class="notice notice-success"><p>' . esc_html__( 'Claim approved. The owner has been emailed a login link.', 'wehaverehabs' ) . '</p></div>';
		} elseif ( 'error' === $status ) {
			echo '<div class="notice notice-error"><p>' . esc_html__( 'That claim could not be approved: it has no listing or email.', 'wehaverehabs' ) . '</p></div>';
		}
	}
);

/* ---------------------------------------------------------------------------
 * "Plan & billing" box on the listing edit screen
 * ------------------------------------------------------------------------- */

add_action(
	'add_meta_boxes_sanctuary',
	function () {
		add_meta_box( 'whr_plan', __( 'Plan & billing', 'wehaverehabs' ), 'whr_render_plan_box', 'sanctuary', 'side', 'high' );
	}
);

/**
 * Render the plan box.
 *
 * @param WP_Post $post Listing.
 */
function whr_render_plan_box( $post ) {
	$plans   = whr_plans();
	$current = whr_plan( $post->ID );
	$until   = whr_meta( 'plan_until', $post->ID );
	echo '<p><strong>' . esc_html( $plans[ $current ][0] ) . '</strong>';
	if ( $until && whr_plan_rank( $post->ID ) >= 2 ) {
		/* translators: %s: date */
		echo '<br><span class="description">' . esc_html( sprintf( __( 'Paid until %s', 'wehaverehabs' ), date_i18n( get_option( 'date_format' ), strtotime( $until ) ) ) ) . '</span>';
	}
	echo '</p>';

	if ( whr_plan_rank( $post->ID ) < 2 ) {
		echo '<p class="description">' . esc_html__( 'Photos, your full story, rates, rooms, team and the WhatsApp button appear on your page with Signature. Featured adds top placement and the homepage.', 'wehaverehabs' ) . '</p>';
	}
	foreach ( array( 'signature', 'featured' ) as $plan ) {
		if ( whr_plan_rank( $post->ID ) >= $plans[ $plan ][1] ) {
			continue;
		}
		$url   = whr_plan_checkout_url( $plan, $post->ID );
		$price = whr_option( 'price_' . $plan );
		$label = sprintf( /* translators: %s: plan name */ __( 'Upgrade to %s', 'wehaverehabs' ), $plans[ $plan ][0] ) . ( $price ? ' · ' . $price : '' );
		if ( $url ) {
			echo '<p><a class="button ' . ( 'signature' === $plan ? 'button-primary' : '' ) . '" href="' . esc_url( $url ) . '" target="_blank" rel="noopener">' . esc_html( $label ) . '</a></p>';
		} elseif ( whr_is_staff() ) {
			echo '<p class="description">' . esc_html__( 'Add the Stripe payment links in Appearance → Customize → We Have Rehabs to show upgrade buttons here.', 'wehaverehabs' ) . '</p>';
			break;
		} else {
			$contact = whr_option( 'contact_email', get_option( 'admin_email' ) );
			echo '<p><a class="button" href="' . esc_url( 'mailto:' . $contact . '?subject=' . rawurlencode( $label . ' — ' . $post->post_title ) ) . '">' . esc_html( $label ) . '</a></p>';
		}
	}

	if ( whr_is_staff() ) {
		echo '<hr><p><label for="whr_plan_field"><strong>' . esc_html__( 'Set plan (staff)', 'wehaverehabs' ) . '</strong></label><br><select id="whr_plan_field" name="whr_plan" class="widefat">';
		$stored = whr_meta( 'plan', $post->ID );
		echo '<option value="">' . esc_html__( 'Automatic (claim status)', 'wehaverehabs' ) . '</option>';
		foreach ( array( 'essential', 'signature', 'featured' ) as $slug ) {
			printf( '<option value="%s" %s>%s</option>', esc_attr( $slug ), selected( $stored, $slug, false ), esc_html( $plans[ $slug ][0] ) );
		}
		echo '</select></p>';
		printf( '<p><label for="whr_plan_until_field"><strong>%s</strong></label><br><input type="date" id="whr_plan_until_field" name="whr_plan_until" value="%s" class="widefat"></p>', esc_html__( 'Paid until', 'wehaverehabs' ), esc_attr( $until ) );
		$sub = whr_meta( 'stripe_subscription', $post->ID );
		if ( $sub ) {
			echo '<p class="description">Stripe: ' . esc_html( $sub ) . '</p>';
		}
		$author = get_userdata( (int) $post->post_author );
		if ( $author && in_array( 'whr_owner', (array) $author->roles, true ) ) {
			/* translators: %s: owner email */
			echo '<p class="description">' . esc_html( sprintf( __( 'Owner account: %s', 'wehaverehabs' ), $author->user_email ) ) . '</p>';
		}
	}
}

/* ---------------------------------------------------------------------------
 * Stripe webhook: POST /wp-json/whr/v1/stripe
 * ------------------------------------------------------------------------- */

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'whr/v1',
			'/stripe',
			array(
				'methods'             => 'POST',
				'callback'            => 'whr_stripe_webhook',
				'permission_callback' => '__return_true', // Authenticated by the Stripe signature below.
			)
		);
	}
);

/**
 * Verify a Stripe-Signature header.
 *
 * @param string $payload Raw body.
 * @param string $header  Stripe-Signature header.
 * @param string $secret  Webhook signing secret.
 * @return bool
 */
function whr_stripe_signature_ok( $payload, $header, $secret ) {
	if ( ! $secret || ! $header ) {
		return false;
	}
	$t   = null;
	$sig = array();
	foreach ( explode( ',', $header ) as $part ) {
		$kv = explode( '=', trim( $part ), 2 );
		if ( 2 !== count( $kv ) ) {
			continue;
		}
		if ( 't' === $kv[0] ) {
			$t = (int) $kv[1];
		} elseif ( 'v1' === $kv[0] ) {
			$sig[] = $kv[1];
		}
	}
	if ( ! $t || ! $sig || abs( time() - $t ) > 300 ) {
		return false;
	}
	$expected = hash_hmac( 'sha256', $t . '.' . $payload, $secret );
	foreach ( $sig as $s ) {
		if ( hash_equals( $expected, $s ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Listing that holds a Stripe subscription.
 *
 * @param string $subscription Subscription ID.
 * @return int
 */
function whr_listing_by_subscription( $subscription ) {
	if ( ! $subscription ) {
		return 0;
	}
	$ids = get_posts( array( 'post_type' => 'sanctuary', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => 'whr_stripe_subscription', 'meta_value' => $subscription ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	return $ids ? (int) $ids[0] : 0;
}

/**
 * Handle Stripe events.
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response
 */
function whr_stripe_webhook( WP_REST_Request $request ) {
	$payload = $request->get_body();
	if ( ! whr_stripe_signature_ok( $payload, (string) $request->get_header( 'stripe_signature' ), (string) whr_option( 'stripe_webhook_secret' ) ) ) {
		return new WP_REST_Response( array( 'error' => 'bad signature' ), 400 );
	}
	$event = json_decode( $payload, true );
	$obj   = isset( $event['data']['object'] ) ? $event['data']['object'] : array();
	$grace = 3 * DAY_IN_SECONDS;

	switch ( isset( $event['type'] ) ? $event['type'] : '' ) {
		case 'checkout.session.completed':
			if ( ! preg_match( '/^(\d+)-(signature|featured)$/', (string) ( $obj['client_reference_id'] ?? '' ), $m ) || 'sanctuary' !== get_post_type( (int) $m[1] ) ) {
				break;
			}
			$id = (int) $m[1];
			update_post_meta( $id, 'whr_plan', $m[2] );
			// Subscriptions are extended by invoice.paid; a one-off payment buys a year.
			$until = ! empty( $obj['subscription'] ) ? time() + 31 * DAY_IN_SECONDS + $grace : time() + YEAR_IN_SECONDS + $grace;
			update_post_meta( $id, 'whr_plan_until', gmdate( 'Y-m-d', $until ) );
			if ( ! empty( $obj['subscription'] ) ) {
				update_post_meta( $id, 'whr_stripe_subscription', sanitize_text_field( $obj['subscription'] ) );
			}
			if ( ! empty( $obj['customer'] ) ) {
				update_post_meta( $id, 'whr_stripe_customer', sanitize_text_field( $obj['customer'] ) );
			}
			wp_mail(
				get_option( 'admin_email' ),
				/* translators: 1: plan 2: listing */
				sprintf( __( 'New %1$s plan: %2$s', 'wehaverehabs' ), ucfirst( $m[2] ), get_the_title( $id ) ),
				get_permalink( $id ) . "\n" . admin_url( 'post.php?action=edit&post=' . $id )
			);
			break;

		case 'invoice.paid':
			$id  = whr_listing_by_subscription( (string) ( $obj['subscription'] ?? '' ) );
			$end = isset( $obj['lines']['data'][0]['period']['end'] ) ? (int) $obj['lines']['data'][0]['period']['end'] : 0;
			if ( $id && $end ) {
				update_post_meta( $id, 'whr_plan_until', gmdate( 'Y-m-d', $end + $grace ) );
			}
			break;

		case 'customer.subscription.deleted':
			$id = whr_listing_by_subscription( (string) ( $obj['id'] ?? '' ) );
			if ( $id ) {
				update_post_meta( $id, 'whr_plan_until', gmdate( 'Y-m-d', time() - DAY_IN_SECONDS ) );
			}
			break;
	}
	return new WP_REST_Response( array( 'received' => true ), 200 );
}

/** Re-rank listings whose paid plan has lapsed (daily). */
add_action(
	'init',
	function () {
		if ( ! wp_next_scheduled( 'whr_plan_expiry' ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'whr_plan_expiry' );
		}
	}
);
add_action(
	'whr_plan_expiry',
	function () {
		$ids = get_posts(
			array(
				'post_type'   => 'sanctuary',
				'numberposts' => -1,
				'fields'      => 'ids',
				'meta_query'  => array( array( 'key' => 'whr_plan_until', 'value' => current_time( 'Y-m-d' ), 'compare' => '<', 'type' => 'DATE' ) ), // phpcs:ignore WordPress.DB.SlowDBQuery
			)
		);
		foreach ( $ids as $id ) {
			whr_sync_sort_keys( $id );
		}
		update_option( 'whr_count_gen', (int) get_option( 'whr_count_gen', 0 ) + 1 );
	}
);

/*
 * Sanctuaries → Plans & upgrades. Owners see their listings with upgrade buttons; staff see the
 * Stripe setup. (It also keeps the Sanctuaries menu reachable for owners: WordPress collapses a
 * post-type menu whose only other item, "Add new", the user cannot use.)
 */
add_action(
	'admin_menu',
	function () {
		add_submenu_page( 'edit.php?post_type=sanctuary', __( 'Plans & upgrades', 'wehaverehabs' ), __( 'Plans & upgrades', 'wehaverehabs' ), 'edit_sanctuaries', 'whr-plans', 'whr_render_plans_page' );
	}
);

/** Render Plans & upgrades. */
function whr_render_plans_page() {
	$plans = whr_plans();
	echo '<div class="wrap"><h1>' . esc_html__( 'Plans & upgrades', 'wehaverehabs' ) . '</h1>';
	echo '<table class="widefat striped" style="max-width:900px;margin:18px 0"><thead><tr><th></th><th>' . esc_html__( 'Essential', 'wehaverehabs' ) . '</th><th>' . esc_html__( 'Signature', 'wehaverehabs' ) . '</th><th>' . esc_html__( 'Featured', 'wehaverehabs' ) . '</th></tr></thead><tbody>';
	$rows = array(
		__( 'Price', 'wehaverehabs' )                                 => array( __( 'Free', 'wehaverehabs' ), whr_option( 'price_signature', '—' ), whr_option( 'price_featured', '—' ) ),
		__( 'Verified badge, contact details, short description', 'wehaverehabs' ) => array( '✓', '✓', '✓' ),
		__( 'Guest inquiries to your inbox', 'wehaverehabs' )         => array( '✓', '✓', '✓' ),
		__( 'Photos: hero image and gallery', 'wehaverehabs' )        => array( '', '✓', '✓' ),
		__( 'Full story, daily rhythm, therapies, team', 'wehaverehabs' ) => array( '', '✓', '✓' ),
		__( 'Rooms, rates and stay lengths', 'wehaverehabs' )         => array( '', '✓', '✓' ),
		__( 'WhatsApp button', 'wehaverehabs' )                       => array( '', '✓', '✓' ),
		__( 'Ranked above free listings', 'wehaverehabs' )            => array( '', '✓', '✓' ),
		__( 'Top of search, homepage rotation, “Sponsored” label', 'wehaverehabs' ) => array( '', '', '✓' ),
	);
	foreach ( $rows as $label => $cells ) {
		echo '<tr><th>' . esc_html( $label ) . '</th><td>' . esc_html( $cells[0] ) . '</td><td>' . esc_html( $cells[1] ) . '</td><td>' . esc_html( $cells[2] ) . '</td></tr>';
	}
	echo '</tbody></table>';

	if ( whr_is_staff() ) {
		$ready = whr_option( 'stripe_signature' ) && whr_option( 'stripe_featured' ) && whr_option( 'stripe_webhook_secret' );
		echo '<h2>' . esc_html__( 'Payments', 'wehaverehabs' ) . '</h2>';
		echo '<p>' . ( $ready ? '✓ ' . esc_html__( 'Stripe payment links and webhook are set.', 'wehaverehabs' ) : esc_html__( 'Not set up yet. In Stripe, create a Payment Link for each paid plan (a monthly subscription), then paste both links and the webhook signing secret in Appearance → Customize → We Have Rehabs.', 'wehaverehabs' ) ) . '</p>';
		/* translators: %s: webhook URL */
		echo '<p>' . esc_html( sprintf( __( 'Webhook endpoint: %s — events: checkout.session.completed, invoice.paid, customer.subscription.deleted.', 'wehaverehabs' ), rest_url( 'whr/v1/stripe' ) ) ) . '</p>';
		$paid = get_posts( array( 'post_type' => 'sanctuary', 'numberposts' => 200, 'meta_query' => array( array( 'key' => 'whr_claimed_sort', 'value' => 2, 'compare' => '>=', 'type' => 'NUMERIC' ), array( 'key' => 'whr_plan', 'value' => array( 'signature', 'featured' ), 'compare' => 'IN' ) ) ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
		echo '<h2>' . esc_html__( 'Paying listings', 'wehaverehabs' ) . '</h2>';
		if ( ! $paid ) {
			echo '<p>' . esc_html__( 'None yet.', 'wehaverehabs' ) . '</p>';
		}
		foreach ( $paid as $p ) {
			echo '<p><a href="' . esc_url( get_edit_post_link( $p->ID ) ) . '">' . esc_html( $p->post_title ) . '</a> — ' . esc_html( $plans[ whr_plan( $p->ID ) ][0] ) . ( whr_meta( 'plan_until', $p->ID ) ? ' · ' . esc_html( whr_meta( 'plan_until', $p->ID ) ) : '' ) . '</p>';
		}
		echo '</div>';
		return;
	}

	$mine = get_posts( array( 'post_type' => 'sanctuary', 'author' => get_current_user_id(), 'numberposts' => 20 ) );
	foreach ( $mine as $p ) {
		echo '<div class="card" style="max-width:860px"><h2 style="margin-top:6px">' . esc_html( $p->post_title ) . '</h2>';
		/* translators: %s: plan */
		echo '<p>' . esc_html( sprintf( __( 'Current plan: %s', 'wehaverehabs' ), $plans[ whr_plan( $p->ID ) ][0] ) ) . '</p>';
		whr_render_plan_box( $p );
		echo '<p><a href="' . esc_url( get_edit_post_link( $p->ID ) ) . '">' . esc_html__( 'Edit listing', 'wehaverehabs' ) . '</a> · <a href="' . esc_url( get_permalink( $p ) ) . '">' . esc_html__( 'View page', 'wehaverehabs' ) . '</a></p></div>';
	}
	echo '</div>';
}

/** Owners: no site-wide counts or staff filters above their listings. */
add_filter(
	'views_edit-sanctuary',
	function ( $views ) {
		return whr_is_staff() ? $views : array();
	}
);
