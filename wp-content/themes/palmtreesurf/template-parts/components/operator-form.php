<?php
/**
 * Operator application form.
 *
 * Plain POST, nonce-protected, honeypot and throttle. Works with no JavaScript.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Read-only status flag.
$pt_status = isset( $_GET['operator'] ) ? sanitize_key( wp_unslash( $_GET['operator'] ) ) : '';
// phpcs:enable

$pt_messages = array(
	'sent'      => array( 'success', __( 'Thank you — your application is in. We read every one, and we will come back to you by email.', 'palmtreesurf' ) ),
	'invalid'   => array( 'error', __( 'Some required details were missing or an email address did not look right. Please check and send again.', 'palmtreesurf' ) ),
	'throttled' => array( 'error', __( 'That looks like a duplicate. Give it a few minutes before sending again.', 'palmtreesurf' ) ),
	'error'     => array( 'error', __( 'Something went wrong sending that. Please try again, or email us directly.', 'palmtreesurf' ) ),
);
?>
<div class="operator-form" id="apply">
	<?php if ( isset( $pt_messages[ $pt_status ] ) ) : ?>
		<p class="form-notice form-notice--<?php echo esc_attr( $pt_messages[ $pt_status ][0] ); ?>" role="status">
			<?php echo esc_html( $pt_messages[ $pt_status ][1] ); ?>
		</p>
	<?php endif; ?>

	<?php if ( 'sent' !== $pt_status ) : ?>
		<form method="post" action="">
			<?php wp_nonce_field( 'pt_operator', 'pt_operator_nonce' ); ?>

			<?php // Honeypot. Hidden from people, irresistible to bots. ?>
			<p class="pt-hp" aria-hidden="true">
				<label for="pt-operator-url"><?php esc_html_e( 'Leave this empty', 'palmtreesurf' ); ?></label>
				<input type="text" id="pt-operator-url" name="pt_operator_url" tabindex="-1" autocomplete="off" />
			</p>

			<?php foreach ( pt_operator_fields() as $pt_group => $pt_fields ) : ?>
				<fieldset class="operator-form__group">
					<legend><?php echo esc_html( $pt_group ); ?></legend>

					<div class="operator-form__fields">
						<?php foreach ( $pt_fields as $pt_name => $pt_field ) : ?>
							<?php
							$pt_id       = 'pt-op-' . $pt_name;
							$pt_input    = 'pt_op_' . $pt_name;
							$pt_required = ! empty( $pt_field['required'] );
							$pt_wide     = in_array( $pt_field['type'], array( 'textarea', 'checkboxes' ), true );
							?>
							<p class="operator-form__field<?php echo $pt_wide ? ' operator-form__field--wide' : ''; ?>">
								<label for="<?php echo esc_attr( $pt_id ); ?>">
									<?php echo esc_html( $pt_field['label'] ); ?>
									<?php if ( $pt_required ) : ?>
										<span class="required" aria-hidden="true">*</span>
									<?php endif; ?>
								</label>

								<?php if ( 'textarea' === $pt_field['type'] ) : ?>
									<textarea
										id="<?php echo esc_attr( $pt_id ); ?>"
										name="<?php echo esc_attr( $pt_input ); ?>"
										rows="5"
										<?php echo $pt_required ? 'required' : ''; ?>
										placeholder="<?php echo esc_attr( isset( $pt_field['placeholder'] ) ? $pt_field['placeholder'] : '' ); ?>"
									></textarea>

								<?php elseif ( 'select' === $pt_field['type'] ) : ?>
									<select id="<?php echo esc_attr( $pt_id ); ?>" name="<?php echo esc_attr( $pt_input ); ?>" <?php echo $pt_required ? 'required' : ''; ?>>
										<?php foreach ( $pt_field['options'] as $pt_value => $pt_label ) : ?>
											<option value="<?php echo esc_attr( $pt_value ); ?>"><?php echo esc_html( $pt_label ); ?></option>
										<?php endforeach; ?>
									</select>

								<?php elseif ( 'checkboxes' === $pt_field['type'] ) : ?>
									<?php
									$pt_terms = get_terms(
										array(
											'taxonomy'   => 'experience_type',
											'hide_empty' => false,
										)
									);
									?>
									<span class="operator-form__checks">
										<?php if ( $pt_terms && ! is_wp_error( $pt_terms ) ) : ?>
											<?php foreach ( $pt_terms as $pt_term ) : ?>
												<label class="operator-form__check">
													<input type="checkbox" name="<?php echo esc_attr( $pt_input ); ?>[]" value="<?php echo esc_attr( $pt_term->name ); ?>" />
													<span><?php echo esc_html( $pt_term->name ); ?></span>
												</label>
											<?php endforeach; ?>
										<?php endif; ?>
										<label class="operator-form__check">
											<input type="checkbox" name="<?php echo esc_attr( $pt_input ); ?>[]" value="<?php esc_attr_e( 'Something else', 'palmtreesurf' ); ?>" />
											<span><?php esc_html_e( 'Something else', 'palmtreesurf' ); ?></span>
										</label>
									</span>

								<?php else : ?>
									<input
										type="<?php echo esc_attr( $pt_field['type'] ); ?>"
										id="<?php echo esc_attr( $pt_id ); ?>"
										name="<?php echo esc_attr( $pt_input ); ?>"
										<?php echo $pt_required ? 'required' : ''; ?>
										placeholder="<?php echo esc_attr( isset( $pt_field['placeholder'] ) ? $pt_field['placeholder'] : '' ); ?>"
									/>
								<?php endif; ?>

								<?php if ( ! empty( $pt_field['hint'] ) ) : ?>
									<span class="operator-form__hint"><?php echo esc_html( $pt_field['hint'] ); ?></span>
								<?php endif; ?>
							</p>
						<?php endforeach; ?>
					</div>
				</fieldset>
			<?php endforeach; ?>

			<p class="operator-form__submit">
				<button class="btn btn--primary btn--lg" type="submit" name="pt_operator_submit" value="1">
					<?php esc_html_e( 'Send application', 'palmtreesurf' ); ?>
				</button>
			</p>

			<p class="operator-form__note">
				<?php esc_html_e( 'We read every application. Nothing you send here is published on the site, and we will not pass your details on.', 'palmtreesurf' ); ?>
			</p>
		</form>
	<?php endif; ?>
</div>
