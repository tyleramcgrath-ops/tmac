<?php
/**
 * The enquiry form on the contact page.
 *
 * Posts to admin-post.php so the submission is handled before any output,
 * then redirects back to the form with a result flag. Nonce, honeypot and a
 * hard reply-to on the sender's address, so nothing is taken on trust.
 *
 * @package mcgrath-chrome
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Where a submission should land when it is done. */
function mcg_contact_return( $state ) {
	$back = wp_get_referer();

	if ( ! $back ) {
		$page = get_page_by_path( mcg_slug( 'contact' ) );
		$back = $page ? get_permalink( $page ) : home_url( '/contact/' );
	}

	wp_safe_redirect( add_query_arg( 'enquiry', $state, remove_query_arg( 'enquiry', $back ) ) . '#enquiry' );
	exit;
}

/** Handle a posted enquiry. */
function mcg_handle_contact() {
	// A bot fills every field it is given; a person never sees this one.
	if ( ! empty( $_POST['mcg_hp'] ) ) {
		mcg_contact_return( 'sent' );
	}

	$nonce = isset( $_POST['mcg_contact_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['mcg_contact_nonce'] ) ) : '';
	if ( ! wp_verify_nonce( $nonce, 'mcg_contact' ) ) {
		mcg_contact_return( 'error' );
	}

	$name  = isset( $_POST['mcg_name'] ) ? sanitize_text_field( wp_unslash( $_POST['mcg_name'] ) ) : '';
	$email = isset( $_POST['mcg_email'] ) ? sanitize_email( wp_unslash( $_POST['mcg_email'] ) ) : '';
	$site  = isset( $_POST['mcg_site'] ) ? sanitize_text_field( wp_unslash( $_POST['mcg_site'] ) ) : '';
	$msg   = isset( $_POST['mcg_message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['mcg_message'] ) ) : '';

	if ( '' === $name || ! is_email( $email ) || '' === $msg ) {
		mcg_contact_return( 'error' );
	}

	$to = mcg_opt( 'mcg_email', '' );
	if ( ! is_email( $to ) ) {
		$to = get_option( 'admin_email' );
	}

	$body = sprintf(
		/* translators: 1: name, 2: email, 3: website, 4: message */
		__( "New enquiry from the website.\n\nName: %1\$s\nEmail: %2\$s\nWebsite: %3\$s\n\n%4\$s\n", 'mcgrath-chrome' ),
		$name,
		$email,
		'' === $site ? __( '(not given)', 'mcgrath-chrome' ) : $site,
		$msg
	);

	$sent = wp_mail(
		$to,
		sprintf( /* translators: %s: sender name */ __( 'Website enquiry from %s', 'mcgrath-chrome' ), $name ),
		$body,
		array( 'Reply-To: ' . $name . ' <' . $email . '>' )
	);

	mcg_contact_return( $sent ? 'sent' : 'error' );
}
add_action( 'admin_post_nopriv_mcg_contact', 'mcg_handle_contact' );
add_action( 'admin_post_mcg_contact', 'mcg_handle_contact' );

/**
 * Render the enquiry form.
 *
 * Kept here rather than in the template so the contact page and any future
 * landing page can drop the same form in with one call.
 */
function mcg_contact_form() {
	$state = isset( $_GET['enquiry'] ) ? sanitize_key( wp_unslash( $_GET['enquiry'] ) ) : '';
	?>
	<div class="enquiry" id="enquiry">
		<?php if ( 'sent' === $state ) : ?>
			<p class="enqNote ok" role="status">
				<?php esc_html_e( 'Thank you — that has come through. You will hear back within one business day.', 'mcgrath-chrome' ); ?>
			</p>
		<?php elseif ( 'error' === $state ) : ?>
			<p class="enqNote bad" role="alert">
				<?php esc_html_e( 'That did not send. Check your name, a valid email and a message, then try again — or email directly using the address below.', 'mcgrath-chrome' ); ?>
			</p>
		<?php endif; ?>

		<form class="enqForm" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="mcg_contact">
			<?php wp_nonce_field( 'mcg_contact', 'mcg_contact_nonce' ); ?>

			<p class="enqHp" aria-hidden="true">
				<label for="mcg_hp"><?php esc_html_e( 'Leave this field empty', 'mcgrath-chrome' ); ?></label>
				<input type="text" id="mcg_hp" name="mcg_hp" tabindex="-1" autocomplete="off">
			</p>

			<div class="enqRow">
				<p class="enqField">
					<label for="mcg_name"><?php esc_html_e( 'Name', 'mcgrath-chrome' ); ?></label>
					<input type="text" id="mcg_name" name="mcg_name" autocomplete="name" required>
				</p>
				<p class="enqField">
					<label for="mcg_email"><?php esc_html_e( 'Email', 'mcgrath-chrome' ); ?></label>
					<input type="email" id="mcg_email" name="mcg_email" autocomplete="email" required>
				</p>
			</div>

			<p class="enqField">
				<label for="mcg_site"><?php esc_html_e( 'Website', 'mcgrath-chrome' ); ?> <span><?php esc_html_e( 'optional', 'mcgrath-chrome' ); ?></span></label>
				<input type="text" id="mcg_site" name="mcg_site" inputmode="url" autocomplete="url"
					placeholder="<?php esc_attr_e( 'yourbusiness.com', 'mcgrath-chrome' ); ?>"
					value="<?php echo isset( $_GET['site'] ) ? esc_attr( sanitize_text_field( wp_unslash( $_GET['site'] ) ) ) : ''; ?>">
			</p>

			<p class="enqField">
				<label for="mcg_message"><?php esc_html_e( 'What do you need?', 'mcgrath-chrome' ); ?></label>
				<textarea id="mcg_message" name="mcg_message" rows="5" required
					placeholder="<?php esc_attr_e( 'The area you want customers from, and the one search term you wish you owned.', 'mcgrath-chrome' ); ?>"></textarea>
			</p>

			<button class="btn" type="submit">
				<?php esc_html_e( 'Send enquiry', 'mcgrath-chrome' ); ?> <span class="arw" aria-hidden="true">&rarr;</span>
			</button>
		</form>
	</div>
	<?php
}
