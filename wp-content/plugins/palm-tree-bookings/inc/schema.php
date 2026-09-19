<?php
/**
 * The booking field schema.
 *
 * One definition drives the public form, the admin screen, the notification
 * emails and the CSV export. Add a field here and it appears in all four.
 *
 * @package PalmTreeBookings
 */

defined( 'ABSPATH' ) || exit;

/**
 * Customer-facing booking fields, grouped into form sections.
 *
 * Keys are stored as post meta prefixed with `_ptb_`.
 *
 * @return array<string, array{label: string, fields: array<string, array<string, mixed>>}>
 */
function ptb_field_groups() {
	$groups = array(
		'trip'      => array(
			'label'  => __( 'Your trip', 'palm-tree-bookings' ),
			'fields' => array(
				'experience'     => array(
					'label'    => __( 'Which experience?', 'palm-tree-bookings' ),
					'type'     => 'experience',
					'required' => true,
				),
				'date_primary'   => array(
					'label'    => __( 'Preferred date', 'palm-tree-bookings' ),
					'type'     => 'date',
					'required' => true,
				),
				'slot_time'      => array(
					'label'    => __( 'Start time', 'palm-tree-bookings' ),
					'type'     => 'slot',
					'hint'     => __( 'Times shown are the ones still open on your chosen date.', 'palm-tree-bookings' ),
				),
				'date_alt'       => array(
					'label' => __( 'Alternative date', 'palm-tree-bookings' ),
					'type'  => 'date',
					'hint'  => __( 'Helps us place you if your first choice is full.', 'palm-tree-bookings' ),
				),
				'time_pref'      => array(
					'label'   => __( 'Time of day', 'palm-tree-bookings' ),
					'type'    => 'select',
					'options' => array(
						'flexible'  => __( 'Flexible', 'palm-tree-bookings' ),
						'sunrise'   => __( 'Sunrise', 'palm-tree-bookings' ),
						'morning'   => __( 'Morning', 'palm-tree-bookings' ),
						'afternoon' => __( 'Afternoon', 'palm-tree-bookings' ),
						'sunset'    => __( 'Sunset', 'palm-tree-bookings' ),
					),
				),
				'party_adults'   => array(
					'label'    => __( 'Adults', 'palm-tree-bookings' ),
					'type'     => 'number',
					'required' => true,
					'min'      => 1,
					'max'      => 30,
					'default'  => 1,
				),
				'party_children' => array(
					'label' => __( 'Children under 12', 'palm-tree-bookings' ),
					'type'  => 'number',
					'min'   => 0,
					'max'   => 30,
				),
				'skill_level'    => array(
					'label'   => __( 'Surfing experience', 'palm-tree-bookings' ),
					'type'    => 'select',
					'options' => array(
						'first_time'   => __( 'Never surfed before', 'palm-tree-bookings' ),
						'beginner'     => __( 'Beginner', 'palm-tree-bookings' ),
						'intermediate' => __( 'Intermediate', 'palm-tree-bookings' ),
						'advanced'     => __( 'Advanced', 'palm-tree-bookings' ),
						'mixed'        => __( 'Mixed group', 'palm-tree-bookings' ),
					),
				),
			),
		),
		'surfers'   => array(
			'label'  => __( 'Who is surfing', 'palm-tree-bookings' ),
			'fields' => array(
				'participants' => array(
					'label'       => __( 'Surfer details', 'palm-tree-bookings' ),
					'type'        => 'textarea',
					'hint'        => __( 'One person per line: name, age, height, weight. We use this to size boards and wetsuits before you arrive.', 'palm-tree-bookings' ),
					'placeholder' => __( "Ana, 34, 165cm, 60kg\nSam, 11, 140cm, 35kg", 'palm-tree-bookings' ),
					'rows'        => 4,
				),
				'medical'      => array(
					'label' => __( 'Injuries, medical notes or non-swimmers', 'palm-tree-bookings' ),
					'type'  => 'textarea',
					'hint'  => __( 'Anything your instructor should know for safety.', 'palm-tree-bookings' ),
					'rows'  => 3,
				),
			),
		),
		'logistics' => array(
			'label'  => __( 'Logistics', 'palm-tree-bookings' ),
			'fields' => array(
				'accommodation'  => array(
					'label' => __( 'Where are you staying?', 'palm-tree-bookings' ),
					'type'  => 'text',
					'hint'  => __( 'Hotel or area in Tamarindo.', 'palm-tree-bookings' ),
				),
				'pickup_needed'  => array(
					'label' => __( 'I would like hotel pickup', 'palm-tree-bookings' ),
					'type'  => 'checkbox',
				),
				'arrival_date'   => array(
					'label' => __( 'Arriving in Tamarindo', 'palm-tree-bookings' ),
					'type'  => 'date',
				),
				'departure_date' => array(
					'label' => __( 'Leaving Tamarindo', 'palm-tree-bookings' ),
					'type'  => 'date',
				),
			),
		),
		'contact'   => array(
			'label'  => __( 'Contact details', 'palm-tree-bookings' ),
			'fields' => array(
				'name'              => array(
					'label'    => __( 'Full name', 'palm-tree-bookings' ),
					'type'     => 'text',
					'required' => true,
					'autocomplete' => 'name',
				),
				'email'             => array(
					'label'    => __( 'Email', 'palm-tree-bookings' ),
					'type'     => 'email',
					'required' => true,
					'autocomplete' => 'email',
				),
				'phone'             => array(
					'label'        => __( 'Phone / WhatsApp', 'palm-tree-bookings' ),
					'type'         => 'tel',
					'hint'         => __( 'Include your country code.', 'palm-tree-bookings' ),
					'autocomplete' => 'tel',
				),
				'country'           => array(
					'label'        => __( 'Country', 'palm-tree-bookings' ),
					'type'         => 'text',
					'autocomplete' => 'country-name',
				),
				'preferred_contact' => array(
					'label'   => __( 'Best way to reach you', 'palm-tree-bookings' ),
					'type'    => 'select',
					'options' => array(
						'whatsapp' => __( 'WhatsApp', 'palm-tree-bookings' ),
						'email'    => __( 'Email', 'palm-tree-bookings' ),
						'phone'    => __( 'Phone call', 'palm-tree-bookings' ),
					),
				),
			),
		),
		'extra'     => array(
			'label'  => __( 'Anything else', 'palm-tree-bookings' ),
			'fields' => array(
				'notes'              => array(
					'label' => __( 'Questions or special requests', 'palm-tree-bookings' ),
					'type'  => 'textarea',
					'rows'  => 4,
				),
				'heard_about'        => array(
					'label'   => __( 'How did you hear about us?', 'palm-tree-bookings' ),
					'type'    => 'select',
					'options' => array(
						''             => __( 'Select&hellip;', 'palm-tree-bookings' ),
						'google'       => __( 'Google', 'palm-tree-bookings' ),
						'instagram'    => __( 'Instagram', 'palm-tree-bookings' ),
						'tripadvisor'  => __( 'Tripadvisor', 'palm-tree-bookings' ),
						'friend'       => __( 'Friend or family', 'palm-tree-bookings' ),
						'hotel'        => __( 'Our hotel or host', 'palm-tree-bookings' ),
						'walk_by'      => __( 'Walked past the shop', 'palm-tree-bookings' ),
						'other'        => __( 'Other', 'palm-tree-bookings' ),
					),
				),
				'marketing_consent'  => array(
					'label' => __( 'Send me occasional surf reports and offers', 'palm-tree-bookings' ),
					'type'  => 'checkbox',
				),
			),
		),
	);

	/**
	 * Filter the customer-facing booking fields.
	 *
	 * @param array $groups Field groups.
	 */
	return apply_filters( 'ptb_field_groups', $groups );
}

/**
 * Flat map of every customer-facing field key to its definition.
 *
 * @return array<string, array<string, mixed>>
 */
function ptb_fields() {
	$fields = array();

	foreach ( ptb_field_groups() as $group ) {
		foreach ( $group['fields'] as $key => $field ) {
			$fields[ $key ] = $field;
		}
	}

	return $fields;
}

/**
 * Fields the business fills in, never the customer.
 *
 * @return array<string, array<string, mixed>>
 */
function ptb_internal_fields() {
	return array(
		'instructor'     => array(
			'label' => __( 'Assigned instructor', 'palm-tree-bookings' ),
			'type'  => 'text',
		),
		'price_quoted'   => array(
			'label' => __( 'Price quoted', 'palm-tree-bookings' ),
			'type'  => 'text',
		),
		'deposit_paid'   => array(
			'label' => __( 'Deposit received', 'palm-tree-bookings' ),
			'type'  => 'checkbox',
		),
		'internal_notes' => array(
			'label' => __( 'Internal notes', 'palm-tree-bookings' ),
			'type'  => 'textarea',
			'rows'  => 5,
		),
	);
}

/**
 * Attribution captured automatically, not typed by anyone.
 *
 * @return array<string, string>
 */
function ptb_attribution_fields() {
	return array(
		'source_section' => __( 'CTA section', 'palm-tree-bookings' ),
		'page_url'       => __( 'Submitted from', 'palm-tree-bookings' ),
		'utm_source'     => __( 'UTM source', 'palm-tree-bookings' ),
		'utm_medium'     => __( 'UTM medium', 'palm-tree-bookings' ),
		'utm_campaign'   => __( 'UTM campaign', 'palm-tree-bookings' ),
	);
}

/**
 * Booking workflow statuses.
 *
 * @return array<string, string>
 */
function ptb_statuses() {
	return array(
		'new'       => __( 'New', 'palm-tree-bookings' ),
		'contacted' => __( 'Contacted', 'palm-tree-bookings' ),
		'confirmed' => __( 'Confirmed', 'palm-tree-bookings' ),
		'completed' => __( 'Completed', 'palm-tree-bookings' ),
		'cancelled' => __( 'Cancelled', 'palm-tree-bookings' ),
	);
}

/**
 * Sanitise one submitted value according to its field definition.
 *
 * @param mixed $raw   Raw submitted value.
 * @param array $field Field definition.
 * @return string
 */
function ptb_sanitize_value( $raw, $field ) {
	$type = isset( $field['type'] ) ? $field['type'] : 'text';

	switch ( $type ) {
		case 'email':
			return sanitize_email( $raw );

		case 'number':
			return '' === $raw ? '' : (string) absint( $raw );

		case 'checkbox':
			return $raw ? '1' : '';

		case 'textarea':
			return sanitize_textarea_field( $raw );

		case 'date':
			$value = sanitize_text_field( $raw );
			return preg_match( '/^\d{4}-\d{2}-\d{2}$/', $value ) ? $value : '';

		case 'slot':
			$value = sanitize_text_field( $raw );
			return preg_match( '/^\d{2}:\d{2}$/', $value ) ? $value : '';

		case 'select':
			$value   = sanitize_text_field( $raw );
			$options = isset( $field['options'] ) ? $field['options'] : array();
			return array_key_exists( $value, $options ) ? $value : '';

		default:
			return sanitize_text_field( $raw );
	}
}

/**
 * Turn a stored value into something readable for admin, email and CSV.
 *
 * @param string $key   Field key.
 * @param string $value Stored value.
 * @return string
 */
function ptb_display_value( $key, $value ) {
	$fields = ptb_fields();

	if ( ! isset( $fields[ $key ] ) ) {
		return (string) $value;
	}

	$field = $fields[ $key ];

	if ( 'checkbox' === $field['type'] ) {
		return $value ? __( 'Yes', 'palm-tree-bookings' ) : __( 'No', 'palm-tree-bookings' );
	}

	if ( 'select' === $field['type'] && isset( $field['options'][ $value ] ) ) {
		return $field['options'][ $value ];
	}

	if ( 'slot' === $field['type'] && $value ) {
		return function_exists( 'ptb_format_time' ) ? ptb_format_time( $value ) : $value;
	}

	if ( 'experience' === $field['type'] && is_numeric( $value ) ) {
		$title = get_the_title( (int) $value );
		return $title ? $title : (string) $value;
	}

	return (string) $value;
}
