<?php
/**
 * Booking, contact and elite-cruise inquiry forms.
 *
 * Submissions are emailed (wp_mail) to the inquiry address from the Customizer
 * and saved as private "Inquiry" posts so nothing is lost if email fails.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', 'popeye_register_inquiries' );
/**
 * Private post type that keeps a copy of every inquiry.
 */
function popeye_register_inquiries() {
	register_post_type(
		'popeye_inquiry',
		array(
			'labels'          => array(
				'name'          => __( 'Inquiries', 'popeye-charters' ),
				'singular_name' => __( 'Inquiry', 'popeye-charters' ),
				'menu_name'     => __( 'Inquiries', 'popeye-charters' ),
			),
			'public'          => false,
			'show_ui'         => true,
			'show_in_menu'    => true,
			'menu_icon'       => 'dashicons-email-alt',
			'menu_position'   => 21,
			'supports'        => array( 'title', 'editor' ),
			'capability_type' => 'post',
			'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
			'map_meta_cap'    => true,
		)
	);
}

/**
 * Charter types offered in the booking form.
 *
 * @return string[]
 */
function popeye_charter_types() {
	$types = array();
	$posts = get_posts(
		array(
			'post_type'      => 'experience',
			'posts_per_page' => 50,
			'orderby'        => 'menu_order title',
			'order'          => 'ASC',
		)
	);
	foreach ( $posts as $p ) {
		$d       = popeye_exp( 'duration_short', $p->ID );
		$types[] = get_the_title( $p ) . ( $d ? ' (' . $d . ')' : '' );
	}
	if ( ! $types ) {
		$types = array( 'Sunset Cruise (2–3 hrs)', 'Charleston Harbor Tour (2–4 hrs)', 'Private Celebrations', 'Romance & Date Night', 'Family Day Charter', 'Corporate & Team Events', 'Historic Sightseeing', 'Custom Charter' );
	}
	$types[] = 'Half-Day Charter (4 hrs)';
	$types[] = 'Full-Day Charter (8 hrs)';
	$types[] = 'Lowcountry Notebook Cruise (Elite)';
	$types[] = 'Charleston to Georgetown Cruise (Elite)';
	return apply_filters( 'popeye_charter_types', $types );
}

/**
 * Field definitions per form: name => [label, type, required, placeholder, options].
 *
 * @param string $form booking|contact|elite.
 * @return array
 */
function popeye_form_fields( $form ) {
	$forms = array(
		'booking' => array(
			'name'       => array( __( 'Name', 'popeye-charters' ), 'text', true, __( 'Your full name', 'popeye-charters' ) ),
			'email'      => array( __( 'Email', 'popeye-charters' ), 'email', true, 'your@email.com' ),
			'phone'      => array( __( 'Phone', 'popeye-charters' ), 'tel', false, '(843) 000-0000', null, 'full' ),
			'date'       => array( __( 'Preferred Date', 'popeye-charters' ), 'date', true, '' ),
			'guests'     => array( __( 'Number of Guests', 'popeye-charters' ), 'number', true, '1–10' ),
			'experience' => array( __( 'Experience / Charter Type', 'popeye-charters' ), 'select', true, __( 'Select an experience…', 'popeye-charters' ), popeye_charter_types(), 'full' ),
			'notes'      => array( __( 'Additional Notes', 'popeye-charters' ), 'textarea', false, __( 'Anything special — occasion, questions, special requests…', 'popeye-charters' ), null, 'full' ),
		),
		'contact' => array(
			'name'    => array( __( 'Name', 'popeye-charters' ), 'text', true, __( 'Your full name', 'popeye-charters' ) ),
			'email'   => array( __( 'Email', 'popeye-charters' ), 'email', true, 'your@email.com' ),
			'phone'   => array( __( 'Phone', 'popeye-charters' ), 'tel', false, '(555) 123-4567', null, 'full' ),
			'message' => array( __( 'Message', 'popeye-charters' ), 'textarea', true, __( 'How can we help?', 'popeye-charters' ), null, 'full' ),
		),
		'elite'   => array(
			'name'       => array( __( 'Your Name', 'popeye-charters' ), 'text', true, __( 'Full name', 'popeye-charters' ) ),
			'phone'      => array( __( 'Phone', 'popeye-charters' ), 'tel', true, __( 'Best number to reach you', 'popeye-charters' ) ),
			'email'      => array( __( 'Email', 'popeye-charters' ), 'email', true, 'your@email.com', null, 'full' ),
			'experience' => array( __( 'Experience', 'popeye-charters' ), 'select', true, __( 'Select a cruise…', 'popeye-charters' ), array( 'Lowcountry Notebook Cruise', 'Charleston to Georgetown Cruise' ) ),
			'guests'     => array( __( 'Number of Guests', 'popeye-charters' ), 'select', true, __( 'Select…', 'popeye-charters' ), array_map( fn( $n ) => sprintf( _n( '%d guest', '%d guests', $n, 'popeye-charters' ), $n ), range( 1, 10 ) ) ),
			'notes'      => array( __( 'Additional Notes', 'popeye-charters' ), 'textarea', false, __( 'Preferred dates, special requests, questions…', 'popeye-charters' ), null, 'full' ),
		),
	);
	return isset( $forms[ $form ] ) ? $forms[ $form ] : array();
}

/**
 * Render an inquiry form.
 *
 * @param string $form   booking|contact|elite.
 * @param string $submit Button label.
 * @param string $preset Pre-selected experience value.
 */
function popeye_render_form( $form, $submit, $preset = '' ) {
	$status = isset( $_GET['inquiry'] ) ? sanitize_key( $_GET['inquiry'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
	$which  = isset( $_GET['form'] ) ? sanitize_key( $_GET['form'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
	if ( ! $preset && isset( $_GET['charter'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		$preset = sanitize_text_field( wp_unslash( $_GET['charter'] ) ); // phpcs:ignore WordPress.Security.NonceVerification
	}
	$anchor = 'popeye-form-' . $form;

	if ( 'sent' === $status && $which === $form ) {
		echo '<div class="form-notice form-notice--ok" id="' . esc_attr( $anchor ) . '" role="status"><h3>' . esc_html__( 'Thank you — your message is on its way!', 'popeye-charters' ) . '</h3><p>' . esc_html__( 'Stepp & Rocio will be in touch shortly, usually within 24 hours. For anything urgent, call or text us directly.', 'popeye-charters' ) . '</p></div>';
		return;
	}
	?>
	<form class="popeye-form" id="<?php echo esc_attr( $anchor ); ?>" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<?php if ( 'error' === $status && $which === $form ) : ?>
			<div class="form-notice form-notice--error" role="alert"><?php esc_html_e( 'Please fill in all required fields with a valid email address and try again.', 'popeye-charters' ); ?></div>
		<?php endif; ?>
		<input type="hidden" name="action" value="popeye_inquiry">
		<input type="hidden" name="popeye_form" value="<?php echo esc_attr( $form ); ?>">
		<input type="hidden" name="popeye_return" value="<?php echo esc_url( get_permalink() ); ?>">
		<?php wp_nonce_field( 'popeye_inquiry_' . $form, 'popeye_nonce' ); ?>
		<div class="hp-field" aria-hidden="true"><label>Website <input type="text" name="popeye_website" tabindex="-1" autocomplete="off"></label></div>
		<div class="form-grid">
			<?php
			foreach ( popeye_form_fields( $form ) as $name => $f ) :
				$label = $f[0];
				$type  = $f[1];
				$req   = $f[2];
				$ph    = isset( $f[3] ) ? $f[3] : '';
				$opts  = isset( $f[4] ) ? $f[4] : null;
				$wide  = isset( $f[5] ) && 'full' === $f[5];
				$id    = $form . '-' . $name;
				?>
				<div class="form-field<?php echo $wide ? ' form-field--full' : ''; ?>">
					<label for="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $label ); ?><?php echo $req ? ' <span class="req">*</span>' : ''; ?></label>
					<?php if ( 'textarea' === $type ) : ?>
						<textarea id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>" rows="4" placeholder="<?php echo esc_attr( $ph ); ?>"<?php echo $req ? ' required' : ''; ?>></textarea>
					<?php elseif ( 'select' === $type ) : ?>
						<select id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>"<?php echo $req ? ' required' : ''; ?>>
							<option value=""><?php echo esc_html( $ph ); ?></option>
							<?php foreach ( (array) $opts as $opt ) : ?>
								<option value="<?php echo esc_attr( $opt ); ?>"<?php selected( $preset && 0 === stripos( $opt, $preset ) ); ?>><?php echo esc_html( $opt ); ?></option>
							<?php endforeach; ?>
						</select>
					<?php else : ?>
						<input id="<?php echo esc_attr( $id ); ?>" type="<?php echo esc_attr( $type ); ?>" name="<?php echo esc_attr( $name ); ?>" placeholder="<?php echo esc_attr( $ph ); ?>"<?php echo 'number' === $type ? ' min="1" max="10"' : ''; ?><?php echo 'date' === $type ? ' min="' . esc_attr( wp_date( 'Y-m-d' ) ) . '"' : ''; ?><?php echo $req ? ' required' : ''; ?>>
					<?php endif; ?>
				</div>
			<?php endforeach; ?>
		</div>
		<button type="submit" class="btn btn--navy btn--block"><?php echo esc_html( $submit ); ?></button>
	</form>
	<?php
}

add_action( 'admin_post_popeye_inquiry', 'popeye_handle_inquiry' );
add_action( 'admin_post_nopriv_popeye_inquiry', 'popeye_handle_inquiry' );
/**
 * Process a submitted inquiry.
 */
function popeye_handle_inquiry() {
	$form   = isset( $_POST['popeye_form'] ) ? sanitize_key( $_POST['popeye_form'] ) : '';
	$return = isset( $_POST['popeye_return'] ) ? esc_url_raw( wp_unslash( $_POST['popeye_return'] ) ) : home_url( '/' );
	$return = wp_validate_redirect( $return, home_url( '/' ) );
	$fields = popeye_form_fields( $form );

	if ( ! $fields || ! isset( $_POST['popeye_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['popeye_nonce'] ) ), 'popeye_inquiry_' . $form ) ) {
		wp_safe_redirect( add_query_arg( array( 'inquiry' => 'error', 'form' => $form ), $return ) . '#popeye-form-' . $form );
		exit;
	}

	// Honeypot: bots fill the hidden field; pretend success.
	if ( ! empty( $_POST['popeye_website'] ) ) {
		wp_safe_redirect( add_query_arg( array( 'inquiry' => 'sent', 'form' => $form ), $return ) . '#popeye-form-' . $form );
		exit;
	}

	$data = array();
	$ok   = true;
	foreach ( $fields as $name => $f ) {
		$raw = isset( $_POST[ $name ] ) ? wp_unslash( $_POST[ $name ] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$val = 'textarea' === $f[1] ? sanitize_textarea_field( $raw ) : sanitize_text_field( $raw );
		if ( 'email' === $f[1] ) {
			$val = sanitize_email( $val );
			if ( $val && ! is_email( $val ) ) {
				$val = '';
			}
		}
		if ( 'select' === $f[1] && $val && ! in_array( $val, (array) $f[4], true ) ) {
			$val = '';
		}
		if ( $f[2] && '' === $val ) {
			$ok = false;
		}
		$data[ $name ] = array( $f[0], $val );
	}

	if ( ! $ok ) {
		wp_safe_redirect( add_query_arg( array( 'inquiry' => 'error', 'form' => $form ), $return ) . '#popeye-form-' . $form );
		exit;
	}

	$labels = array(
		'booking' => __( 'Charter booking inquiry', 'popeye-charters' ),
		'contact' => __( 'Contact message', 'popeye-charters' ),
		'elite'   => __( 'Elite cruise inquiry', 'popeye-charters' ),
	);
	$subject = sprintf( '[%s] %s — %s', wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ), $labels[ $form ], $data['name'][1] );

	$lines = array();
	foreach ( $data as $row ) {
		$lines[] = $row[0] . ': ' . ( '' !== $row[1] ? $row[1] : '—' );
	}
	$body = implode( "\n", $lines ) . "\n\n" . sprintf( __( 'Sent from %s', 'popeye-charters' ), $return );

	wp_insert_post(
		array(
			'post_type'    => 'popeye_inquiry',
			'post_status'  => 'private',
			'post_title'   => $labels[ $form ] . ' — ' . $data['name'][1],
			'post_content' => $body,
		)
	);

	$to = popeye_opt( 'inquiry_email' );
	if ( ! is_email( $to ) ) {
		$to = popeye_opt( 'email' );
	}
	if ( ! is_email( $to ) ) {
		$to = get_option( 'admin_email' );
	}
	$headers = array( 'Reply-To: ' . $data['name'][1] . ' <' . $data['email'][1] . '>' );
	wp_mail( $to, $subject, $body, $headers );

	do_action( 'popeye_inquiry_submitted', $form, $data );

	wp_safe_redirect( add_query_arg( array( 'inquiry' => 'sent', 'form' => $form ), $return ) . '#popeye-form-' . $form );
	exit;
}
