<?php
/**
 * Pricing and categories, all on one screen.
 *
 * Editing a price one tour at a time means opening nine screens to answer
 * "what do we charge for everything?". This is that question as a single
 * table: every experience, the category it sits in, and every rate, editable
 * in place and saved in one go.
 *
 * It writes exactly the same meta the per-experience box writes, so the two
 * are views of one set of numbers rather than two places a price can live.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Add the Pricing screen.
 */
function ptb_pricing_menu() {
	add_menu_page(
		__( 'Pricing', 'palm-tree-bookings' ),
		__( 'Pricing', 'palm-tree-bookings' ),
		'edit_posts',
		'ptb-pricing',
		'ptb_pricing_screen',
		'dashicons-tickets-alt',
		26
	);
}
add_action( 'admin_menu', 'ptb_pricing_menu' );

/**
 * Every experience, grouped by the category it belongs to.
 *
 * @return array<string, array<int, WP_Post>>
 */
function ptb_pricing_grouped() {
	$posts = get_posts(
		array(
			'post_type'      => ptb_experience_post_type(),
			'post_status'    => array( 'publish', 'draft', 'pending', 'private' ),
			'posts_per_page' => -1,
			'orderby'        => 'menu_order title',
			'order'          => 'ASC',
		)
	);

	$grouped = array();

	foreach ( $posts as $post ) {
		$terms = get_the_terms( $post->ID, 'experience_type' );
		$name  = ( $terms && ! is_wp_error( $terms ) )
			? $terms[0]->name
			: __( 'No category', 'palm-tree-bookings' );

		$grouped[ $name ][] = $post;
	}

	ksort( $grouped );

	return $grouped;
}

/**
 * Save the grid.
 *
 * @return string|null A message key, or null when nothing was submitted.
 */
function ptb_pricing_handle_save() {
	if ( ! isset( $_POST['ptb_pricing_nonce'] ) ) {
		return null;
	}

	if ( ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['ptb_pricing_nonce'] ) ), 'ptb_save_pricing' ) ) {
		return 'nonce';
	}

	if ( ! current_user_can( 'edit_posts' ) ) {
		return 'denied';
	}

	$rows       = isset( $_POST['ptb_rates'] ) ? (array) wp_unslash( $_POST['ptb_rates'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitized per field below.
	$options_in = isset( $_POST['ptb_screen_options'] ) ? (array) wp_unslash( $_POST['ptb_screen_options'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitized in ptb_normalise_option().
	$saved      = 0;

	// A tour whose options were all cleared still needs its row visited.
	foreach ( array_keys( $options_in ) as $with_options ) {
		if ( ! isset( $rows[ $with_options ] ) ) {
			$rows[ $with_options ] = array();
		}
	}

	foreach ( $rows as $post_id => $values ) {
		$post_id = (int) $post_id;

		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
			continue;
		}

		$post = get_post( $post_id );

		if ( ! $post || ptb_experience_post_type() !== $post->post_type ) {
			continue;
		}

		$changed = false;

		foreach ( ptb_price_fields() as $key => $field ) {
			if ( ! array_key_exists( $key, (array) $values ) ) {
				continue;
			}

			$value = 'textarea' === $field['type']
				? sanitize_textarea_field( $values[ $key ] )
				: sanitize_text_field( $values[ $key ] );

			$existing = (string) get_post_meta( $post_id, '_pt_' . $key, true );

			if ( trim( $value ) !== trim( $existing ) ) {
				$changed = true;
			}

			if ( '' === trim( $value ) ) {
				delete_post_meta( $post_id, '_pt_' . $key );
			} else {
				update_post_meta( $post_id, '_pt_' . $key, $value );
			}
		}

		/*
		 * Options ride along in the same submit, so a tour sold three ways is
		 * edited on the same screen as one sold a single way.
		 */
		if ( isset( $options_in[ $post_id ] ) && function_exists( 'ptb_save_options' ) ) {
			ptb_save_options( $post_id, (array) $options_in[ $post_id ] );

			$changed = true;
		}

		/*
		 * Only the rows actually edited stop being placeholders. Saving the
		 * grid to change one price must not quietly vouch for every made-up
		 * figure still sitting in the other rows.
		 */
		if ( $changed ) {
			delete_post_meta( $post_id, '_pt_price_placeholder' );
			++$saved;
		}
	}

	return $saved ? 'saved' : 'none';
}

/**
 * The Pricing screen.
 */
function ptb_pricing_screen() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}

	$result  = ptb_pricing_handle_save();
	$grouped = ptb_pricing_grouped();
	$columns = ptb_price_fields();
	$money   = function_exists( 'ptb_currency' ) ? ptb_currency() : 'USD';
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Pricing', 'palm-tree-bookings' ); ?></h1>

		<?php if ( 'saved' === $result ) : ?>
			<div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'Prices saved.', 'palm-tree-bookings' ); ?></p></div>
		<?php elseif ( 'none' === $result ) : ?>
			<div class="notice notice-info is-dismissible"><p><?php esc_html_e( 'Nothing to save — no price was changed.', 'palm-tree-bookings' ); ?></p></div>
		<?php elseif ( 'nonce' === $result || 'denied' === $result ) : ?>
			<div class="notice notice-error"><p><?php esc_html_e( 'That did not save. Reload the page and try again.', 'palm-tree-bookings' ); ?></p></div>
		<?php endif; ?>

		<div class="card" style="max-width:none">
			<h2 style="margin-top:0"><?php esc_html_e( 'How a price is worked out', 'palm-tree-bookings' ); ?></h2>
			<p><?php esc_html_e( 'Every tour is priced one of two ways. Fill in one or the other, not both — if a flat rate is set it wins and the per-person rates are ignored.', 'palm-tree-bookings' ); ?></p>
			<ol>
				<li>
					<strong><?php esc_html_e( 'Per person.', 'palm-tree-bookings' ); ?></strong>
					<?php esc_html_e( 'An adult rate, and optionally a lower rate for children under 12. The booking form multiplies by how many of each are coming. This is how lessons and kayak tours are usually sold.', 'palm-tree-bookings' ); ?>
				</li>
				<li>
					<strong><?php esc_html_e( 'Flat rate.', 'palm-tree-bookings' ); ?></strong>
					<?php esc_html_e( 'One price for the whole booking covering a set number of people, plus a per-head charge for anyone beyond that. This is how a charter is usually sold.', 'palm-tree-bookings' ); ?>
				</li>
			</ol>
			<p>
				<strong><?php esc_html_e( 'Start time surcharges', 'palm-tree-bookings' ); ?></strong>
				<?php esc_html_e( 'are added once per booking, not per person, and only when the customer picks that time. Write one per line as the time, a vertical bar, then the amount — for example 17:00 | 15 to add 15 to a sunset departure.', 'palm-tree-bookings' ); ?>
			</p>
			<p>
				<?php
				printf(
					/* translators: %s: currency code, e.g. USD. */
					esc_html__( 'Enter whole numbers only, in %s. The customer sees a running total as they fill the form, and the same figure is what a Stripe payment would charge.', 'palm-tree-bookings' ),
					esc_html( $money )
				);
				?>
			</p>
		</div>

		<?php if ( ! $grouped ) : ?>
			<p><?php esc_html_e( 'No experiences yet. Add one first and it will appear here.', 'palm-tree-bookings' ); ?></p>
		<?php else : ?>
			<form method="post">
				<?php wp_nonce_field( 'ptb_save_pricing', 'ptb_pricing_nonce' ); ?>

				<?php foreach ( $grouped as $category => $posts ) : ?>
					<h2><?php echo esc_html( $category ); ?> <span class="count">(<?php echo (int) count( $posts ); ?>)</span></h2>

					<table class="wp-list-table widefat fixed striped">
						<thead>
							<tr>
								<th scope="col" style="width:20%"><?php esc_html_e( 'Experience', 'palm-tree-bookings' ); ?></th>
								<?php foreach ( $columns as $key => $field ) : ?>
									<th scope="col"><?php echo esc_html( $field['label'] ); ?></th>
								<?php endforeach; ?>
							</tr>
						</thead>
						<tbody>
							<?php foreach ( $posts as $post ) : ?>
								<tr>
									<td>
										<strong><a href="<?php echo esc_url( (string) get_edit_post_link( $post->ID ) ); ?>"><?php echo esc_html( $post->post_title ); ?></a></strong>
										<?php if ( get_post_meta( $post->ID, '_pt_price_placeholder', true ) ) : ?>
											<br /><span style="color:#b32d2e;font-weight:600"><?php esc_html_e( 'Made-up price', 'palm-tree-bookings' ); ?></span>
										<?php elseif ( ! ptb_has_price( $post->ID ) ) : ?>
											<br /><span style="color:#996800"><?php esc_html_e( 'No price set', 'palm-tree-bookings' ); ?></span>
										<?php endif; ?>
									</td>
									<?php foreach ( $columns as $key => $field ) : ?>
										<td>
											<?php
											$value = get_post_meta( $post->ID, '_pt_' . $key, true );
											$name  = 'ptb_rates[' . (int) $post->ID . '][' . $key . ']';

											if ( 'textarea' === $field['type'] ) {
												printf(
													'<textarea name="%1$s" rows="2" class="widefat code" placeholder="17:00 | 15">%2$s</textarea>',
													esc_attr( $name ),
													esc_textarea( (string) $value )
												);
											} else {
												printf(
													'<input name="%1$s" type="number" min="0" step="1" class="small-text" value="%2$s" />',
													esc_attr( $name ),
													esc_attr( (string) $value )
												);
											}
											?>
										</td>
									<?php endforeach; ?>
								</tr>
							<?php endforeach; ?>
						</tbody>
					</table>
				<?php endforeach; ?>

				<?php ptb_pricing_options_section( $grouped ); ?>

				<?php submit_button( __( 'Save all prices and options', 'palm-tree-bookings' ) ); ?>
			</form>
		<?php endif; ?>

		<div class="card" style="max-width:none">
			<h2 style="margin-top:0"><?php esc_html_e( 'Categories', 'palm-tree-bookings' ); ?></h2>
			<p><?php esc_html_e( 'Categories group the tours on the website and drive the filter on the experiences page. A tour with no category still works but will not appear under any of them.', 'palm-tree-bookings' ); ?></p>
			<ul>
				<?php
				$terms = get_terms(
					array(
						'taxonomy'   => 'experience_type',
						'hide_empty' => false,
					)
				);

				if ( $terms && ! is_wp_error( $terms ) ) :
					foreach ( $terms as $term ) :
						?>
						<li>
							<strong><?php echo esc_html( $term->name ); ?></strong>
							&mdash;
							<?php
							printf(
								/* translators: %d: number of experiences. */
								esc_html( _n( '%d experience', '%d experiences', (int) $term->count, 'palm-tree-bookings' ) ),
								(int) $term->count
							);
							?>
							<a href="<?php echo esc_url( (string) get_edit_term_link( $term->term_id, 'experience_type' ) ); ?>"><?php esc_html_e( 'Edit', 'palm-tree-bookings' ); ?></a>
						</li>
						<?php
					endforeach;
				endif;
				?>
			</ul>
			<p>
				<a class="button" href="<?php echo esc_url( admin_url( 'edit-tags.php?taxonomy=experience_type&post_type=' . ptb_experience_post_type() ) ); ?>">
					<?php esc_html_e( 'Add or edit categories', 'palm-tree-bookings' ); ?>
				</a>
				<a class="button button-primary" href="<?php echo esc_url( admin_url( 'post-new.php?post_type=' . ptb_experience_post_type() ) ); ?>">
					<?php esc_html_e( 'Add a new experience', 'palm-tree-bookings' ); ?>
				</a>
			</p>
		</div>
	</div>
	<?php
}

/**
 * The trip options, on the same screen as the rates.
 *
 * The per-experience box can do this too, but it lives in the block editor's
 * collapsed meta-box drawer — a poor home for the thing an operator changes
 * most often. Prices and the options that carry them belong together.
 *
 * @param array<string, array<int, WP_Post>> $grouped Experiences by category.
 */
function ptb_pricing_options_section( $grouped ) {
	if ( ! function_exists( 'ptb_options' ) ) {
		return;
	}

	$posts = array();

	foreach ( $grouped as $group ) {
		foreach ( $group as $post ) {
			$posts[] = $post;
		}
	}
	?>
	<h2><?php esc_html_e( 'Tours sold more than one way', 'palm-tree-bookings' ); ?></h2>

	<p>
		<?php esc_html_e( 'Use these when a tour has more than one price — a full day and a half day, or private and group rates. Each option carries its own price, length and inclusions, and the customer picks one when booking. A tour with no options is priced by the adult and child rates above.', 'palm-tree-bookings' ); ?>
	</p>

	<?php foreach ( $posts as $post ) : ?>
		<?php $options = ptb_options( $post->ID ); ?>

		<details<?php echo $options ? ' open' : ''; ?> style="margin:0 0 10px;border:1px solid #c3c4c7;border-radius:4px;background:#fff">
			<summary style="padding:10px 14px;cursor:pointer;font-weight:600">
				<?php echo esc_html( $post->post_title ); ?>
				<span style="font-weight:400;color:#646970">
					&mdash;
					<?php
					echo esc_html(
						$options
							? sprintf(
								/* translators: %d: number of options. */
								_n( '%d option', '%d options', count( $options ), 'palm-tree-bookings' ),
								count( $options )
							)
							: __( 'one price', 'palm-tree-bookings' )
					);
					?>
				</span>
			</summary>

			<div style="padding:0 14px" data-ptb-options>
				<?php
				if ( $options ) {
					foreach ( $options as $index => $option ) {
						ptb_options_row( $index, $option, 'ptb_screen_options[' . (int) $post->ID . ']' );
					}
				} else {
					ptb_options_row( 0, null, 'ptb_screen_options[' . (int) $post->ID . ']' );
				}
				?>
			</div>

			<p style="padding:0 14px 14px">
				<button type="button" class="button" data-ptb-add-option><?php esc_html_e( 'Add another option', 'palm-tree-bookings' ); ?></button>
			</p>

			<script type="text/template" data-ptb-option-template>
				<?php ptb_options_row( '__INDEX__', null, 'ptb_screen_options[' . (int) $post->ID . ']' ); ?>
			</script>
		</details>
	<?php endforeach; ?>

	<?php ptb_options_admin_assets(); ?>
	<?php
}
