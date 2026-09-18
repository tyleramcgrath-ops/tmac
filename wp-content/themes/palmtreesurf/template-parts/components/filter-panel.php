<?php
/**
 * Experience finder panel.
 *
 * Not in VISUAL-SPEC.md, but it is the conversion device on the live site, so
 * section 2 says keep it. Submits to the experiences archive as a plain GET
 * form, so it works with no JavaScript.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

$pt_types = get_terms(
	array(
		'taxonomy'   => 'experience_type',
		'hide_empty' => false,
	)
);

// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Read-only archive filters.
$pt_sel_type  = isset( $_GET['experience_type'] ) ? sanitize_text_field( wp_unslash( $_GET['experience_type'] ) ) : '';
$pt_sel_date  = isset( $_GET['when'] ) ? sanitize_text_field( wp_unslash( $_GET['when'] ) ) : '';
$pt_sel_party = isset( $_GET['guests'] ) ? absint( $_GET['guests'] ) : 2;
// phpcs:enable
?>
<form class="finder" method="get" action="<?php echo esc_url( get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ) ); ?>">
	<div class="finder__head">
		<h2 class="finder__title"><?php esc_html_e( 'Find Your Experience', 'palmtreesurf' ); ?></h2>
		<span class="finder__badge"><?php esc_html_e( 'Instant enquiry', 'palmtreesurf' ); ?></span>
	</div>

	<div class="finder__fields">
		<p class="finder__field">
			<label for="finder-type"><?php esc_html_e( 'Category', 'palmtreesurf' ); ?></label>
			<select id="finder-type" name="experience_type">
				<option value=""><?php esc_html_e( 'All categories', 'palmtreesurf' ); ?></option>
				<?php if ( $pt_types && ! is_wp_error( $pt_types ) ) : ?>
					<?php foreach ( $pt_types as $pt_type ) : ?>
						<option value="<?php echo esc_attr( $pt_type->slug ); ?>" <?php selected( $pt_sel_type, $pt_type->slug ); ?>>
							<?php echo esc_html( $pt_type->name ); ?>
						</option>
					<?php endforeach; ?>
				<?php endif; ?>
			</select>
		</p>

		<p class="finder__field">
			<label for="finder-when"><?php esc_html_e( 'When', 'palmtreesurf' ); ?></label>
			<input type="date" id="finder-when" name="when" value="<?php echo esc_attr( $pt_sel_date ); ?>" min="<?php echo esc_attr( wp_date( 'Y-m-d' ) ); ?>" />
		</p>

		<p class="finder__field">
			<label for="finder-guests"><?php esc_html_e( 'Guests', 'palmtreesurf' ); ?></label>
			<select id="finder-guests" name="guests">
				<?php for ( $pt_i = 1; $pt_i <= 12; $pt_i++ ) : ?>
					<option value="<?php echo esc_attr( $pt_i ); ?>" <?php selected( $pt_sel_party, $pt_i ); ?>>
						<?php
						printf(
							/* translators: %d: number of guests. */
							esc_html( _n( '%d guest', '%d guests', $pt_i, 'palmtreesurf' ) ),
							(int) $pt_i
						);
						?>
					</option>
				<?php endfor; ?>
			</select>
		</p>

		<p class="finder__submit">
			<button type="submit" class="btn btn--action"><?php esc_html_e( 'Find Experiences', 'palmtreesurf' ); ?></button>
		</p>
	</div>

	<ul class="finder__trust">
		<li><?php esc_html_e( 'Fast reply', 'palmtreesurf' ); ?></li>
		<li><?php esc_html_e( 'Free cancellation 24h', 'palmtreesurf' ); ?></li>
		<li><?php esc_html_e( 'Local certified guides', 'palmtreesurf' ); ?></li>
	</ul>
</form>
