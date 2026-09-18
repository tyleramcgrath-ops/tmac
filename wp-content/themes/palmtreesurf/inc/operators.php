<?php
/**
 * Operator sign-up.
 *
 * Tour companies apply to be listed. Applications are stored as a private
 * custom post type rather than emailed and forgotten, so the client gets a
 * reviewable pipeline in wp-admin with a status on each one, and can turn an
 * approved application into a real experience without retyping anything.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * The post type holding applications.
 */
const PT_OPERATOR_POST_TYPE = 'pt_operator';

/**
 * Register the applications post type.
 *
 * Private: not public, not queryable, never in a sitemap. These are business
 * records, not content.
 */
function pt_register_operator_post_type() {
	register_post_type(
		PT_OPERATOR_POST_TYPE,
		array(
			'labels'          => array(
				'name'          => __( 'Operator Applications', 'palmtreesurf' ),
				'singular_name' => __( 'Operator Application', 'palmtreesurf' ),
				'menu_name'     => __( 'Operators', 'palmtreesurf' ),
				'all_items'     => __( 'Applications', 'palmtreesurf' ),
				'edit_item'     => __( 'Review Application', 'palmtreesurf' ),
				'not_found'     => __( 'No applications yet.', 'palmtreesurf' ),
			),
			'public'          => false,
			'show_ui'         => true,
			'show_in_menu'    => true,
			'menu_icon'       => 'dashicons-businessperson',
			'menu_position'   => 26,
			'supports'        => array( 'title' ),
			'capability_type' => 'post',
			'map_meta_cap'    => true,
			'has_archive'     => false,
			'rewrite'         => false,
			'exclude_from_search' => true,
		)
	);

	register_post_status(
		'pt_approved',
		array(
			'label'                     => __( 'Approved', 'palmtreesurf' ),
			'public'                    => false,
			'internal'                  => true,
			'show_in_admin_all_list'    => true,
			'show_in_admin_status_list' => true,
			/* translators: %s: number of approved applications. */
			'label_count'               => _n_noop( 'Approved <span class="count">(%s)</span>', 'Approved <span class="count">(%s)</span>', 'palmtreesurf' ),
		)
	);
}
add_action( 'init', 'pt_register_operator_post_type', 10 );

/**
 * The application form's fields.
 *
 * Grouped so the form can be rendered in readable sections rather than as one
 * long column of inputs.
 *
 * @return array<string, array<string, mixed>>
 */
function pt_operator_fields() {
	return array(
		__( 'About your business', 'palmtreesurf' ) => array(
			'company'   => array(
				'label'    => __( 'Company name', 'palmtreesurf' ),
				'type'     => 'text',
				'required' => true,
			),
			'contact'   => array(
				'label'    => __( 'Contact name', 'palmtreesurf' ),
				'type'     => 'text',
				'required' => true,
			),
			'email'     => array(
				'label'    => __( 'Email', 'palmtreesurf' ),
				'type'     => 'email',
				'required' => true,
			),
			'phone'     => array(
				'label'    => __( 'Phone or WhatsApp', 'palmtreesurf' ),
				'type'     => 'tel',
				'required' => true,
			),
			'website'   => array(
				'label' => __( 'Website or social profile', 'palmtreesurf' ),
				'type'  => 'url',
			),
			'location'  => array(
				'label'       => __( 'Where you operate', 'palmtreesurf' ),
				'type'        => 'text',
				'placeholder' => __( 'Tamarindo, Playa Grande, Nosara…', 'palmtreesurf' ),
				'required'    => true,
			),
			'years'     => array(
				'label' => __( 'Years operating', 'palmtreesurf' ),
				'type'  => 'number',
			),
		),

		__( 'What you run', 'palmtreesurf' ) => array(
			'categories' => array(
				'label'    => __( 'Categories', 'palmtreesurf' ),
				'type'     => 'checkboxes',
				'options'  => 'terms',
				'required' => true,
			),
			'tours'      => array(
				'label'       => __( 'Your tours', 'palmtreesurf' ),
				'type'        => 'textarea',
				'required'    => true,
				'hint'        => __( 'One per line: name, how long it runs, and roughly what you charge.', 'palmtreesurf' ),
				'placeholder' => __( "Beginner surf lesson — 2 hours — $60 per person\nSunset catamaran — 2.5 hours — $95 per person", 'palmtreesurf' ),
			),
			'capacity'   => array(
				'label'       => __( 'Typical group size', 'palmtreesurf' ),
				'type'        => 'text',
				'placeholder' => __( 'e.g. 1-6 guests', 'palmtreesurf' ),
			),
			'languages'  => array(
				'label'       => __( 'Languages your guides speak', 'palmtreesurf' ),
				'type'        => 'text',
				'placeholder' => __( 'English, Spanish…', 'palmtreesurf' ),
			),
			'seasonal'   => array(
				'label' => __( 'Months you do not operate', 'palmtreesurf' ),
				'type'  => 'text',
			),
		),

		__( 'Insurance, permits and safety', 'palmtreesurf' ) => array(
			'insured'       => array(
				'label'   => __( 'Do you carry liability insurance?', 'palmtreesurf' ),
				'type'    => 'select',
				'options' => array(
					''            => __( 'Select…', 'palmtreesurf' ),
					'yes'         => __( 'Yes', 'palmtreesurf' ),
					'no'          => __( 'No', 'palmtreesurf' ),
					'in-progress' => __( 'Applying for it', 'palmtreesurf' ),
				),
				'required' => true,
			),
			'permits'       => array(
				'label' => __( 'Permits, licences or registrations you hold', 'palmtreesurf' ),
				'type'  => 'textarea',
				'hint'  => __( 'For example ICT tourism registration, boat licence, or a guide certification.', 'palmtreesurf' ),
			),
			'certifications' => array(
				'label' => __( 'Guide certifications', 'palmtreesurf' ),
				'type'  => 'text',
				'hint'  => __( 'Lifeguard, first aid, naturalist guide, captain licence, and so on.', 'palmtreesurf' ),
			),
		),

		__( 'Anything else', 'palmtreesurf' ) => array(
			'notes' => array(
				'label' => __( 'What makes your tours worth listing?', 'palmtreesurf' ),
				'type'  => 'textarea',
			),
			'photos' => array(
				'label' => __( 'Link to your photos', 'palmtreesurf' ),
				'type'  => 'url',
				'hint'  => __( 'A shared folder or album is easiest. Please do not send attachments by email.', 'palmtreesurf' ),
			),
		),
	);
}

/**
 * Flatten the grouped fields into name => definition.
 *
 * @return array<string, array<string, mixed>>
 */
function pt_operator_fields_flat() {
	$flat = array();

	foreach ( pt_operator_fields() as $fields ) {
		foreach ( $fields as $name => $field ) {
			$flat[ $name ] = $field;
		}
	}

	return $flat;
}

/**
 * Handle an application before any output is sent.
 */
function pt_handle_operator_application() {
	if ( ! isset( $_POST['pt_operator_submit'] ) ) {
		return;
	}

	$redirect = pt_current_url();

	$nonce = isset( $_POST['pt_operator_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['pt_operator_nonce'] ) ) : '';

	if ( ! wp_verify_nonce( $nonce, 'pt_operator' ) ) {
		wp_safe_redirect( add_query_arg( 'operator', 'error', $redirect ) );
		exit;
	}

	// Honeypot: real applicants never fill this in.
	if ( ! empty( $_POST['pt_operator_url'] ) ) {
		wp_safe_redirect( add_query_arg( 'operator', 'sent', $redirect ) );
		exit;
	}

	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$key = 'pt_operator_' . md5( $ip );

	if ( $ip && get_transient( $key ) ) {
		wp_safe_redirect( add_query_arg( 'operator', 'throttled', $redirect ) );
		exit;
	}

	$values = array();

	foreach ( pt_operator_fields_flat() as $name => $field ) {
		$raw = isset( $_POST[ 'pt_op_' . $name ] ) ? wp_unslash( $_POST[ 'pt_op_' . $name ] ) : '';

		if ( 'checkboxes' === $field['type'] ) {
			$value = is_array( $raw ) ? array_map( 'sanitize_text_field', $raw ) : array();
			$value = implode( ', ', $value );
		} elseif ( 'textarea' === $field['type'] ) {
			$value = sanitize_textarea_field( $raw );
		} elseif ( 'email' === $field['type'] ) {
			$value = sanitize_email( $raw );
		} elseif ( 'url' === $field['type'] ) {
			$value = esc_url_raw( $raw );
		} else {
			$value = sanitize_text_field( $raw );
		}

		if ( ! empty( $field['required'] ) && '' === (string) $value ) {
			wp_safe_redirect( add_query_arg( 'operator', 'invalid', $redirect ) );
			exit;
		}

		$values[ $name ] = $value;
	}

	if ( ! is_email( $values['email'] ) ) {
		wp_safe_redirect( add_query_arg( 'operator', 'invalid', $redirect ) );
		exit;
	}

	$post_id = wp_insert_post(
		array(
			'post_type'   => PT_OPERATOR_POST_TYPE,
			'post_title'  => $values['company'],
			'post_status' => 'pending',
		)
	);

	if ( is_wp_error( $post_id ) || ! $post_id ) {
		wp_safe_redirect( add_query_arg( 'operator', 'error', $redirect ) );
		exit;
	}

	foreach ( $values as $name => $value ) {
		update_post_meta( $post_id, 'pt_op_' . $name, $value );
	}

	update_post_meta( $post_id, 'pt_op_submitted', current_time( 'mysql' ) );

	if ( $ip ) {
		set_transient( $key, 1, MINUTE_IN_SECONDS * 5 );
	}

	pt_notify_operator_application( $post_id, $values );

	wp_safe_redirect( add_query_arg( 'operator', 'sent', $redirect ) );
	exit;
}
add_action( 'template_redirect', 'pt_handle_operator_application' );

/**
 * Email the owner, and acknowledge the applicant.
 *
 * @param int   $post_id Application ID.
 * @param array $values  Submitted values.
 */
function pt_notify_operator_application( $post_id, $values ) {
	$to = pt_filled( 'pt_email' );

	if ( ! $to || ! is_email( $to ) ) {
		$to = get_option( 'admin_email' );
	}

	$lines = array();

	foreach ( pt_operator_fields_flat() as $name => $field ) {
		if ( '' === (string) $values[ $name ] ) {
			continue;
		}

		$lines[] = $field['label'] . ': ' . $values[ $name ];
	}

	$lines[] = '';
	$lines[] = __( 'Review it here:', 'palmtreesurf' ) . ' ' . get_edit_post_link( $post_id, '' );

	wp_mail(
		$to,
		sprintf(
			/* translators: %s: company name. */
			__( 'Operator application: %s', 'palmtreesurf' ),
			$values['company']
		),
		implode( "\n", $lines )
	);

	// Acknowledge, so an applicant is not left wondering.
	wp_mail(
		$values['email'],
		sprintf(
			/* translators: %s: site name. */
			__( 'We have your application — %s', 'palmtreesurf' ),
			get_bloginfo( 'name' )
		),
		sprintf(
			/* translators: 1: contact name, 2: site name. */
			__( "Hi %1\$s,\n\nThanks for applying to list your tours with %2\$s. A real person reads every application — we will come back to you once we have been through it.\n\nIf anything changes in the meantime, just reply to this email.", 'palmtreesurf' ),
			$values['contact'],
			get_bloginfo( 'name' )
		)
	);
}

/**
 * Show the submitted details on the application edit screen.
 */
function pt_operator_meta_box() {
	add_meta_box(
		'pt-operator-details',
		__( 'Application', 'palmtreesurf' ),
		'pt_render_operator_meta_box',
		PT_OPERATOR_POST_TYPE,
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'pt_operator_meta_box' );

/**
 * Render the submitted details, read-only.
 *
 * @param WP_Post $post Application.
 */
function pt_render_operator_meta_box( $post ) {
	echo '<table class="widefat striped"><tbody>';

	$submitted = get_post_meta( $post->ID, 'pt_op_submitted', true );

	if ( $submitted ) {
		printf(
			'<tr><th style="width:220px">%s</th><td>%s</td></tr>',
			esc_html__( 'Submitted', 'palmtreesurf' ),
			esc_html( $submitted )
		);
	}

	foreach ( pt_operator_fields_flat() as $name => $field ) {
		$value = get_post_meta( $post->ID, 'pt_op_' . $name, true );

		if ( '' === (string) $value ) {
			continue;
		}

		$display = esc_html( $value );

		if ( 'url' === $field['type'] ) {
			$display = '<a href="' . esc_url( $value ) . '" target="_blank" rel="noopener noreferrer">' . esc_html( $value ) . '</a>';
		} elseif ( 'email' === $field['type'] ) {
			$display = '<a href="mailto:' . esc_attr( $value ) . '">' . esc_html( $value ) . '</a>';
		} elseif ( 'textarea' === $field['type'] ) {
			$display = nl2br( esc_html( $value ) );
		}

		printf(
			'<tr><th style="width:220px">%s</th><td>%s</td></tr>',
			esc_html( $field['label'] ),
			$display // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped per branch above.
		);
	}

	echo '</tbody></table>';
	echo '<p class="description">' . esc_html__( 'Set the status to Approved once you have checked them out. Nothing here is published on the site.', 'palmtreesurf' ) . '</p>';
}

/**
 * Useful columns on the applications list.
 *
 * @param array<string, string> $columns Columns.
 * @return array<string, string>
 */
function pt_operator_columns( $columns ) {
	return array(
		'cb'         => isset( $columns['cb'] ) ? $columns['cb'] : '',
		'title'      => __( 'Company', 'palmtreesurf' ),
		'pt_contact' => __( 'Contact', 'palmtreesurf' ),
		'pt_cats'    => __( 'Categories', 'palmtreesurf' ),
		'pt_where'   => __( 'Where', 'palmtreesurf' ),
		'date'       => __( 'Received', 'palmtreesurf' ),
	);
}
add_filter( 'manage_' . PT_OPERATOR_POST_TYPE . '_posts_columns', 'pt_operator_columns' );

/**
 * Fill the application columns.
 *
 * @param string $column  Column key.
 * @param int    $post_id Application ID.
 */
function pt_operator_column( $column, $post_id ) {
	$map = array(
		'pt_contact' => 'pt_op_email',
		'pt_cats'    => 'pt_op_categories',
		'pt_where'   => 'pt_op_location',
	);

	if ( ! isset( $map[ $column ] ) ) {
		return;
	}

	echo esc_html( (string) get_post_meta( $post_id, $map[ $column ], true ) );
}
add_action( 'manage_' . PT_OPERATOR_POST_TYPE . '_posts_custom_column', 'pt_operator_column', 10, 2 );

/**
 * Keep applications out of search engines and sitemaps entirely.
 *
 * @param array<int, string> $types Post types.
 * @return array<int, string>
 */
function pt_operator_not_in_sitemap( $types ) {
	unset( $types[ PT_OPERATOR_POST_TYPE ] );

	return $types;
}
add_filter( 'wp_sitemaps_post_types', 'pt_operator_not_in_sitemap' );
add_filter( 'aioseo_sitemap_post_types', 'pt_operator_not_in_sitemap' );

/**
 * Why an operator would want to be listed.
 *
 * Deliberately free of traffic numbers, commission rates and audience sizes —
 * the theme does not know any of those, and inventing them to persuade a
 * business partner would be worse than inventing them for a visitor.
 *
 * @return array<int, array<int, string>>
 */
function pt_operator_benefits() {
	return apply_filters(
		'pt_operator_benefits',
		array(
			array(
				__( 'Visitors already looking', 'palmtreesurf' ),
				__( 'People arrive here searching for surf lessons, charters and wildlife trips in Tamarindo specifically. You are not competing for attention — you are answering a question someone already asked.', 'palmtreesurf' ),
			),
			array(
				__( 'Your own page, properly written', 'palmtreesurf' ),
				__( 'Each listing gets a real page with photos, what is included, how long it runs and its own booking form, built to be found in search rather than buried in a directory.', 'palmtreesurf' ),
			),
			array(
				__( 'Enquiries straight to you', 'palmtreesurf' ),
				__( 'Booking requests come through with dates, group size and contact details already filled in, so you are answering a real enquiry rather than chasing one.', 'palmtreesurf' ),
			),
			array(
				__( 'Reviews that are actually yours', 'palmtreesurf' ),
				__( 'Guests leave a star rating on the experience they booked. Every review is read before it publishes, and the score is only ever built from real ones.', 'palmtreesurf' ),
			),
			array(
				__( 'Vetted, not a free-for-all', 'palmtreesurf' ),
				__( 'We ask about insurance, permits and certifications because visitors are trusting this list. A directory anyone can join is worth nothing to the operators already doing it properly.', 'palmtreesurf' ),
			),
			array(
				__( 'Local, not a global platform', 'palmtreesurf' ),
				__( 'You will be dealing with people in Tamarindo who know your beach, your season and your business, not a support queue in another timezone.', 'palmtreesurf' ),
			),
		)
	);
}

/**
 * The application process, start to finish.
 *
 * @return array<int, array<int, string>>
 */
function pt_operator_steps() {
	return apply_filters(
		'pt_operator_steps',
		array(
			array(
				__( 'Send the form', 'palmtreesurf' ),
				__( 'Tell us who you are, what you run, and how you handle insurance and safety. Five minutes, and you can leave the optional parts blank.', 'palmtreesurf' ),
			),
			array(
				__( 'We check and talk', 'palmtreesurf' ),
				__( 'A real person reads it. We will usually come back with a few questions, and if we have not worked with you before we will want to meet.', 'palmtreesurf' ),
			),
			array(
				__( 'Your tours go live', 'palmtreesurf' ),
				__( 'We build the pages with you — photos, descriptions, times and capacity — and enquiries start arriving with everything you need to answer them.', 'palmtreesurf' ),
			),
		)
	);
}

/**
 * Questions operators ask before applying.
 *
 * Commercial terms are deliberately not answered here: the theme does not know
 * this business's commission, fees or contract, and a wrong answer to an
 * operator is a dispute rather than a disappointment.
 *
 * @return array<int, array<int, string>>
 */
function pt_operator_faq() {
	return apply_filters(
		'pt_operator_faq',
		array(
			array(
				__( 'What does it cost to be listed?', 'palmtreesurf' ),
				__( 'We will set out the commercial terms in writing when we come back to you, before anything is agreed. Send the application first — there is no cost to apply and no obligation either way.', 'palmtreesurf' ),
			),
			array(
				__( 'Do I need liability insurance?', 'palmtreesurf' ),
				__( 'It is the first thing we ask about. If you are in the process of arranging it, say so on the form rather than leaving it blank — we would rather have the real picture.', 'palmtreesurf' ),
			),
			array(
				__( 'I am a one-person operation. Is that a problem?', 'palmtreesurf' ),
				__( 'Not at all. Small local operators are exactly who this is for. What matters is that you run a safe, well-organised trip, not how many boats you own.', 'palmtreesurf' ),
			),
			array(
				__( 'Can I list tours outside Tamarindo?', 'palmtreesurf' ),
				__( 'Yes, if they are within reasonable reach of visitors staying here — the wider Guanacaste coast and inland. Tell us where you operate on the form.', 'palmtreesurf' ),
			),
			array(
				__( 'How do bookings and payment work?', 'palmtreesurf' ),
				__( 'Enquiries come to you with the dates, group size and contact details attached. How payment is handled is part of the terms we agree with you, and it is settled in writing before you are listed.', 'palmtreesurf' ),
			),
			array(
				__( 'What if I only run tours part of the year?', 'palmtreesurf' ),
				__( 'That is normal on this coast. There is a field on the form for the months you do not operate, and listings can be set to show availability accordingly.', 'palmtreesurf' ),
			),
			array(
				__( 'How long does it take to hear back?', 'palmtreesurf' ),
				__( 'You will get an automatic acknowledgement immediately so you know it arrived. A real reply follows once we have been through the application properly.', 'palmtreesurf' ),
			),
		)
	);
}
