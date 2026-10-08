<?php
/**
 * Editing trip options.
 *
 * A repeating set of rows rather than a pipe-separated text box. The rest of
 * this plugin uses "17:00 | 15" conventions for small lists, but an option
 * carries six values including a multi-line block, and asking someone to count
 * separators across that is how a price ends up in the duration column.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * The Options box on the experience edit screen.
 */
function ptb_options_meta_box() {
	add_meta_box(
		'ptb-options',
		__( 'Trip options', 'palm-tree-bookings' ),
		'ptb_options_meta_box_render',
		ptb_experience_post_type(),
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'ptb_options_meta_box' );

/**
 * Render the Options box.
 *
 * @param WP_Post $post Experience being edited.
 */
function ptb_options_meta_box_render( $post ) {
	wp_nonce_field( 'ptb_save_options', 'ptb_options_nonce' );

	$options = ptb_options( $post->ID );

	echo '<p>' . esc_html__( 'Use these when one tour is sold more than one way — a full day and a half day, or private and group rates. Each option can have its own price, length and inclusions, and the customer picks one when booking.', 'palm-tree-bookings' ) . '</p>';
	echo '<p>' . esc_html__( 'Leave this empty for a tour sold one way only. It is then priced by the adult and child rates in the Pricing box below.', 'palm-tree-bookings' ) . '</p>';

	echo '<div class="ptb-options" data-ptb-options>';

	if ( $options ) {
		foreach ( $options as $index => $option ) {
			ptb_options_row( $index, $option );
		}
	} else {
		ptb_options_row( 0, null );
	}

	echo '</div>';

	printf(
		'<p><button type="button" class="button" data-ptb-add-option>%s</button></p>',
		esc_html__( 'Add another option', 'palm-tree-bookings' )
	);

	// The blank row the Add button clones. __INDEX__ is swapped for a real
	// number on insert so each row posts under its own key.
	echo '<script type="text/template" data-ptb-option-template>';
	ptb_options_row( '__INDEX__', null );
	echo '</script>';

	ptb_options_admin_assets();
}

/**
 * One editable option row.
 *
 * @param int|string                 $index  Row index, or the template placeholder.
 * @param array<string, string>|null $option Existing values, or null for a blank row.
 * @param string                     $prefix Field name prefix, so the same row can be
 *                                           posted from the experience box or from the
 *                                           Pricing screen, where many tours share a form.
 */
function ptb_options_row( $index, $option, $prefix = 'ptb_options' ) {
	$option = $option ? $option : ptb_normalise_option( array() );
	$name   = $prefix . '[' . $index . ']';

	echo '<div class="ptb-option-row" style="border:1px solid #c3c4c7;border-left-width:4px;padding:12px 14px;margin:0 0 12px;background:#fff">';
	echo '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">';

	foreach ( ptb_option_fields() as $key => $field ) {
		if ( 'includes' === $field['type'] || 'textarea' === $field['type'] ) {
			continue;
		}

		$id    = 'ptb-option-' . sanitize_key( $prefix ) . '-' . sanitize_key( (string) $index ) . '-' . $key;
		$width = ( 'label' === $key ) ? '220px' : ( ( 'mode' === $key ) ? '180px' : '110px' );

		echo '<div style="flex:0 0 ' . esc_attr( $width ) . '">';
		printf(
			'<label for="%1$s" style="display:block;font-weight:600;margin-bottom:4px">%2$s</label>',
			esc_attr( $id ),
			esc_html( $field['label'] )
		);

		if ( 'mode' === $field['type'] ) {
			printf( '<select id="%1$s" name="%2$s[mode]" style="width:100%%">', esc_attr( $id ), esc_attr( $name ) );

			foreach ( ptb_option_modes() as $value => $text ) {
				printf(
					'<option value="%1$s"%2$s>%3$s</option>',
					esc_attr( $value ),
					selected( $option['mode'], $value, false ),
					esc_html( $text )
				);
			}

			echo '</select>';
		} else {
			printf(
				'<input id="%1$s" name="%2$s[%3$s]" type="%4$s"%5$s value="%6$s" style="width:100%%" />',
				esc_attr( $id ),
				esc_attr( $name ),
				esc_attr( $key ),
				'number' === $field['type'] ? 'number' : 'text',
				'number' === $field['type'] ? ' min="0" step="1"' : '',
				esc_attr( $option[ $key ] )
			);
		}

		echo '</div>';
	}

	echo '<div style="flex:1 1 auto;text-align:right">';
	printf(
		'<button type="button" class="button-link delete" data-ptb-remove-option>%s</button>',
		esc_html__( 'Remove', 'palm-tree-bookings' )
	);
	echo '</div>';
	echo '</div>';

	$includes_id = 'ptb-option-' . sanitize_key( $prefix ) . '-' . sanitize_key( (string) $index ) . '-includes';

	echo '<div style="margin-top:10px">';
	printf(
		'<label for="%1$s" style="display:block;font-weight:600;margin-bottom:4px">%2$s</label>',
		esc_attr( $includes_id ),
		esc_html__( 'What is included', 'palm-tree-bookings' )
	);
	printf(
		'<textarea id="%1$s" name="%2$s[includes]" rows="4" class="large-text" placeholder="%3$s">%4$s</textarea>',
		esc_attr( $includes_id ),
		esc_attr( $name ),
		esc_attr__( "Lunch\nFruit and water\nBeers", 'palm-tree-bookings' ),
		esc_textarea( $option['includes'] )
	);
	printf(
		'<p class="description">%s</p>',
		esc_html__( 'One per line. These show under the option on the tour page.', 'palm-tree-bookings' )
	);
	echo '</div>';

	echo '</div>';
}

/**
 * The add and remove behaviour.
 *
 * Bound per group rather than to the first one on the page: the Pricing screen
 * carries one set of rows for every tour, so a single querySelector would wire
 * up the top tour and leave every Add button below it dead.
 *
 * Guarded so that printing this twice on one screen cannot bind twice and add
 * two rows per click.
 */
function ptb_options_admin_assets() {
	static $printed = false;

	if ( $printed ) {
		return;
	}

	$printed = true;
	?>
	<script>
	( function () {
		document.querySelectorAll( '[data-ptb-options]' ).forEach( function ( wrap ) {
			// Each group keeps its own template and button, found by walking up
			// to the nearest shared parent.
			var scope = wrap.closest( 'details' ) || wrap.parentNode;

			if ( ! scope ) {
				return;
			}

			var add = scope.querySelector( '[data-ptb-add-option]' );
			var template = scope.querySelector( '[data-ptb-option-template]' );

			if ( ! add || ! template ) {
				return;
			}

			add.addEventListener( 'click', function () {
				// A counter that only goes up, so removing a row cannot make the
				// next one collide with a row still on screen.
				var next = parseInt( wrap.dataset.ptbNext || '0', 10 ) ||
					wrap.querySelectorAll( '.ptb-option-row' ).length;

				wrap.dataset.ptbNext = String( next + 1 );
				wrap.insertAdjacentHTML( 'beforeend', template.innerHTML.split( '__INDEX__' ).join( String( next ) ) );
			} );

			wrap.addEventListener( 'click', function ( event ) {
				if ( ! event.target.matches( '[data-ptb-remove-option]' ) ) {
					return;
				}

				var row = event.target.closest( '.ptb-option-row' );

				if ( ! row ) {
					return;
				}

				/*
				 * Clearing the fields is what removes the last row: a row with no
				 * name is skipped on save, and this leaves something to type into
				 * rather than an empty box.
				 */
				if ( wrap.querySelectorAll( '.ptb-option-row' ).length === 1 ) {
					row.querySelectorAll( 'input, textarea' ).forEach( function ( field ) {
						field.value = '';
					} );

					return;
				}

				row.parentNode.removeChild( row );
			} );
		} );
	}() );
	</script>
	<?php
}

/**
 * Persist the options when an experience is saved.
 *
 * @param int     $post_id Post ID.
 * @param WP_Post $post    Post.
 */
function ptb_save_options_box( $post_id, $post ) {
	if ( ! isset( $_POST['ptb_options_nonce'] ) ) {
		return;
	}

	if ( ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['ptb_options_nonce'] ) ), 'ptb_save_options' ) ) {
		return;
	}

	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) || ptb_experience_post_type() !== $post->post_type ) {
		return;
	}

	$rows = isset( $_POST['ptb_options'] ) ? (array) wp_unslash( $_POST['ptb_options'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitized in ptb_normalise_option().

	ptb_save_options( $post_id, $rows );
}
add_action( 'save_post', 'ptb_save_options_box', 10, 2 );
