<?php
/**
 * Guest inquiry form for a sanctuary. Expects to run inside The Loop.
 *
 * @package WeHaveRehabs
 */

$post_id  = get_the_ID();
$whatsapp = isset( $args['whatsapp'] ) ? $args['whatsapp'] : '';
?>
	<?php whr_form_notice( __( 'Thank you — your message is on its way. The sanctuary usually replies within two working days.', 'wehaverehabs' ) ); ?>
	<form class="form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<input type="hidden" name="action" value="whr_inquiry">
		<input type="hidden" name="sanctuary_id" value="<?php echo esc_attr( $post_id ); ?>">
		<?php wp_nonce_field( 'whr_inquiry', '_whr_nonce' ); ?>
		<label class="hp" aria-hidden="true">Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
		<div class="row">
			<label><?php esc_html_e( 'Arriving', 'wehaverehabs' ); ?><input type="month" name="arriving"></label>
			<label><?php esc_html_e( 'Stay', 'wehaverehabs' ); ?>
				<select name="stay">
					<option value=""><?php esc_html_e( 'Not sure yet', 'wehaverehabs' ); ?></option>
					<option>7 nights</option><option>14 nights</option><option>21 nights</option><option>30 nights</option><option>Longer</option>
				</select>
			</label>
		</div>
		<label><?php esc_html_e( 'Your name', 'wehaverehabs' ); ?><input type="text" name="guest_name" required autocomplete="name"></label>
		<label><?php esc_html_e( 'Email or WhatsApp', 'wehaverehabs' ); ?><input type="text" name="guest_contact" required autocomplete="email"></label>
		<label><?php esc_html_e( 'Travelling from', 'wehaverehabs' ); ?><input type="text" name="country" autocomplete="country-name"></label>
		<label><?php esc_html_e( 'Anything you’d like them to know', 'wehaverehabs' ); ?><textarea name="message" rows="3"></textarea></label>
		<button type="submit" class="btn btn--primary"><?php esc_html_e( 'Send inquiry', 'wehaverehabs' ); ?></button>
		<?php if ( $whatsapp ) : ?>
			<a class="btn btn--outline" href="<?php echo esc_url( $whatsapp ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Message on WhatsApp', 'wehaverehabs' ); ?></a>
		<?php endif; ?>
	</form>
