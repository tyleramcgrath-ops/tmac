<?php
/**
 * Public booking form rendering.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Render one field control.
 *
 * @param string $key    Field key.
 * @param array  $field  Field definition.
 * @param array  $values Previously submitted values, preserved after an error.
 */
function ptb_render_field( $key, $field, $values = array() ) {
	$id       = 'ptb-' . sanitize_key( $key );
	$name     = 'ptb[' . $key . ']';
	$value    = isset( $values[ $key ] ) ? $values[ $key ] : ( isset( $field['default'] ) ? $field['default'] : '' );
	$required = ! empty( $field['required'] );
	$type     = $field['type'];
	$describe = ! empty( $field['hint'] ) ? $id . '-hint' : '';

	$classes = array( 'ptb-field', 'ptb-field--' . sanitize_html_class( $type ) );
	printf( '<div class="%s">', esc_attr( implode( ' ', $classes ) ) );

	if ( 'checkbox' !== $type ) {
		printf(
			'<label class="ptb-field__label" for="%1$s">%2$s%3$s</label>',
			esc_attr( $id ),
			esc_html( $field['label'] ),
			$required ? '<span class="ptb-req" aria-hidden="true">*</span>' : ''
		);
	}

	$common = sprintf(
		'id="%1$s" name="%2$s"%3$s%4$s',
		esc_attr( $id ),
		esc_attr( $name ),
		$required ? ' required' : '',
		$describe ? ' aria-describedby="' . esc_attr( $describe ) . '"' : ''
	);

	switch ( $type ) {
		case 'textarea':
			printf(
				'<textarea %1$s rows="%2$d" placeholder="%3$s" class="ptb-input">%4$s</textarea>',
				$common, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above.
				isset( $field['rows'] ) ? (int) $field['rows'] : 4,
				esc_attr( isset( $field['placeholder'] ) ? $field['placeholder'] : '' ),
				esc_textarea( $value )
			);
			break;

		case 'select':
			printf( '<select %s class="ptb-input">', $common ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above.
			foreach ( $field['options'] as $opt_value => $opt_label ) {
				printf(
					'<option value="%1$s"%2$s>%3$s</option>',
					esc_attr( $opt_value ),
					selected( $value, $opt_value, false ),
					esc_html( $opt_label )
				);
			}
			echo '</select>';
			break;

		case 'experience':
			ptb_render_experience_field( $id, $name, $value, $required );
			break;

		case 'checkbox':
			printf(
				'<label class="ptb-check"><input type="checkbox" id="%1$s" name="%2$s" value="1"%3$s /> <span>%4$s</span></label>',
				esc_attr( $id ),
				esc_attr( $name ),
				checked( $value, '1', false ),
				esc_html( $field['label'] )
			);
			break;

		case 'number':
			printf(
				'<input type="number" %1$s value="%2$s" class="ptb-input" min="%3$d" max="%4$d" inputmode="numeric" />',
				$common, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above.
				esc_attr( $value ),
				isset( $field['min'] ) ? (int) $field['min'] : 0,
				isset( $field['max'] ) ? (int) $field['max'] : 99
			);
			break;

		default:
			printf(
				'<input type="%1$s" %2$s value="%3$s" class="ptb-input"%4$s />',
				esc_attr( $type ),
				$common, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above.
				esc_attr( $value ),
				! empty( $field['autocomplete'] ) ? ' autocomplete="' . esc_attr( $field['autocomplete'] ) . '"' : ''
			);
	}

	if ( $describe ) {
		printf( '<p class="ptb-hint" id="%1$s">%2$s</p>', esc_attr( $describe ), esc_html( $field['hint'] ) );
	}

	echo '</div>';
}

/**
 * Render the experience picker.
 *
 * Uses the theme's experience post type when it exists, and degrades to a text
 * input when the plugin runs on a theme that has none.
 *
 * @param string $id       Control ID.
 * @param string $name     Control name.
 * @param string $value    Current value.
 * @param bool   $required Whether the field is required.
 */
function ptb_render_experience_field( $id, $name, $value, $required ) {
	$post_type = apply_filters( 'ptb_experience_post_type', 'experience' );

	if ( ! post_type_exists( $post_type ) ) {
		printf(
			'<input type="text" id="%1$s" name="%2$s" value="%3$s" class="ptb-input"%4$s />',
			esc_attr( $id ),
			esc_attr( $name ),
			esc_attr( $value ),
			$required ? ' required' : ''
		);
		return;
	}

	$items = get_posts(
		array(
			'post_type'      => $post_type,
			'posts_per_page' => 100,
			'orderby'        => 'menu_order title',
			'order'          => 'ASC',
			'post_status'    => 'publish',
		)
	);

	printf(
		'<select id="%1$s" name="%2$s" class="ptb-input"%3$s>',
		esc_attr( $id ),
		esc_attr( $name ),
		$required ? ' required' : ''
	);
	printf( '<option value="">%s</option>', esc_html__( 'Select an experience…', 'palm-tree-bookings' ) );

	foreach ( $items as $item ) {
		printf(
			'<option value="%1$d"%2$s>%3$s</option>',
			(int) $item->ID,
			selected( (string) $value, (string) $item->ID, false ),
			esc_html( $item->post_title )
		);
	}

	printf( '<option value="not_sure"%s>%s</option>', selected( $value, 'not_sure', false ), esc_html__( 'Not sure yet — help me choose', 'palm-tree-bookings' ) );
	echo '</select>';
}

/**
 * Render the booking form.
 *
 * @param array $atts Shortcode attributes.
 * @return string
 */
function ptb_render_form( $atts = array() ) {
	$atts = shortcode_atts(
		array(
			'experience' => '',
			'title'      => __( 'Request your booking', 'palm-tree-bookings' ),
			'location'   => 'page',
		),
		$atts,
		'palm_tree_booking_form'
	);

	$state  = ptb_get_form_state();
	$values = $state['values'];

	if ( $atts['experience'] && empty( $values['experience'] ) ) {
		$values['experience'] = $atts['experience'];
	}

	ob_start();
	?>
	<section class="ptb" id="booking">
		<?php if ( $atts['title'] ) : ?>
			<h2 class="ptb__title"><?php echo esc_html( $atts['title'] ); ?></h2>
		<?php endif; ?>

		<div class="ptb__status" aria-live="polite">
			<?php if ( 'success' === $state['status'] ) : ?>
				<div class="ptb-notice ptb-notice--success">
					<h3><?php esc_html_e( 'Request received', 'palm-tree-bookings' ); ?></h3>
					<p><?php echo esc_html( ptb_confirmation_message() ); ?></p>
				</div>
			<?php elseif ( $state['errors'] ) : ?>
				<div class="ptb-notice ptb-notice--error">
					<p><?php esc_html_e( 'Please check the fields below.', 'palm-tree-bookings' ); ?></p>
					<ul>
						<?php foreach ( $state['errors'] as $error ) : ?>
							<li><?php echo esc_html( $error ); ?></li>
						<?php endforeach; ?>
					</ul>
				</div>
			<?php endif; ?>
		</div>

		<?php if ( 'success' !== $state['status'] ) : ?>
			<form class="ptb__form" method="post" action="<?php echo esc_url( ptb_form_action() ); ?>" novalidate>
				<?php wp_nonce_field( 'ptb_submit', 'ptb_nonce' ); ?>
				<input type="hidden" name="ptb_submit" value="1" />
				<input type="hidden" name="ptb_ts" value="<?php echo esc_attr( time() ); ?>" />
				<input type="hidden" name="ptb_meta[source_section]" value="<?php echo esc_attr( $atts['location'] ); ?>" />
				<input type="hidden" name="ptb_meta[page_url]" value="<?php echo esc_attr( ptb_current_url() ); ?>" />
				<?php foreach ( array( 'utm_source', 'utm_medium', 'utm_campaign' ) as $utm ) : ?>
					<input type="hidden" name="ptb_meta[<?php echo esc_attr( $utm ); ?>]" value="<?php echo esc_attr( ptb_query_param( $utm ) ); ?>" />
				<?php endforeach; ?>

				<div class="ptb-hp" aria-hidden="true">
					<label for="ptb-company"><?php esc_html_e( 'Company', 'palm-tree-bookings' ); ?></label>
					<input type="text" id="ptb-company" name="ptb_company" tabindex="-1" autocomplete="off" />
				</div>

				<?php foreach ( ptb_field_groups() as $group_key => $group ) : ?>
					<fieldset class="ptb-group ptb-group--<?php echo esc_attr( $group_key ); ?>">
						<legend class="ptb-group__legend"><?php echo esc_html( $group['label'] ); ?></legend>
						<div class="ptb-group__fields">
							<?php foreach ( $group['fields'] as $key => $field ) : ?>
								<?php ptb_render_field( $key, $field, $values ); ?>
							<?php endforeach; ?>
						</div>
					</fieldset>
				<?php endforeach; ?>

				<div class="ptb__actions">
					<button type="submit" class="ptb-btn">
						<span class="ptb-btn__label"><?php esc_html_e( 'Send booking request', 'palm-tree-bookings' ); ?></span>
						<span class="ptb-btn__spinner" aria-hidden="true"></span>
					</button>
					<p class="ptb__smallprint"><?php esc_html_e( 'This sends a request, not a confirmed booking. We reply to confirm availability.', 'palm-tree-bookings' ); ?></p>
				</div>
			</form>
		<?php endif; ?>
	</section>
	<?php
	return (string) ob_get_clean();
}
add_shortcode( 'palm_tree_booking_form', 'ptb_render_form' );

/**
 * The URL the form posts back to.
 *
 * @return string
 */
function ptb_form_action() {
	return esc_url_raw( ptb_current_url() ) . '#booking';
}

/**
 * Current request URL, without the query string.
 *
 * @return string
 */
function ptb_current_url() {
	$path = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '/';

	return home_url( strtok( $path, '?' ) );
}

/**
 * Read a query parameter safely.
 *
 * @param string $key Parameter name.
 * @return string
 */
function ptb_query_param( $key ) {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only attribution value.
	return isset( $_GET[ $key ] ) ? sanitize_text_field( wp_unslash( $_GET[ $key ] ) ) : '';
}

/**
 * Enqueue the form styles and script only where the form renders.
 */
function ptb_enqueue() {
	wp_enqueue_style( 'ptb-form', PTB_URL . 'assets/css/form.css', array(), PTB_VERSION );
	wp_enqueue_script( 'ptb-form', PTB_URL . 'assets/js/form.js', array(), PTB_VERSION, true );
}
add_action( 'wp_enqueue_scripts', 'ptb_enqueue' );
