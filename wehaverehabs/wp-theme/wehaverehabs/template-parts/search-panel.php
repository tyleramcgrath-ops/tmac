<?php
/**
 * Search form. Pass array( 'compact' => true ) for the results-page variant.
 *
 * @package WeHaveRehabs
 */

$compact = ! empty( $args['compact'] );
$f       = whr_filters();
if ( is_tax( 'destination' ) && ! $f['dest'] ) {
	$f['dest'] = get_queried_object()->slug;
}
if ( is_tax( 'condition' ) && ! $f['need'] ) {
	$f['need'] = get_queried_object()->slug;
}
?>
<div class="search-float<?php echo $compact ? ' search-float--sm' : ''; ?>">
	<form class="search-panel" method="get" action="<?php echo esc_url( get_post_type_archive_link( 'sanctuary' ) ); ?>" role="search">
		<label>
			<span><?php esc_html_e( 'Destination', 'wehaverehabs' ); ?></span>
			<select name="dest">
				<option value=""><?php esc_html_e( 'Anywhere', 'wehaverehabs' ); ?></option>
				<?php whr_term_options( 'destination', $f['dest'], true ); ?>
			</select>
		</label>
		<label>
			<span><?php echo $compact ? esc_html__( 'Help with', 'wehaverehabs' ) : esc_html__( 'Seeking help with', 'wehaverehabs' ); ?></span>
			<select name="need">
				<option value=""><?php echo $compact ? esc_html__( 'Anything', 'wehaverehabs' ) : esc_html__( 'Anything, gently', 'wehaverehabs' ); ?></option>
				<?php whr_term_options( 'condition', $f['need'] ); ?>
			</select>
		</label>
		<?php if ( $compact ) : ?>
			<label>
				<span><?php esc_html_e( 'Care', 'wehaverehabs' ); ?></span>
				<select name="care">
					<option value=""><?php esc_html_e( 'All kinds', 'wehaverehabs' ); ?></option>
					<?php whr_term_options( 'care_level', $f['care'] ); ?>
				</select>
			</label>
			<label>
				<span><?php esc_html_e( 'Setting', 'wehaverehabs' ); ?></span>
				<select name="setting">
					<option value=""><?php esc_html_e( 'Any setting', 'wehaverehabs' ); ?></option>
					<?php whr_term_options( 'setting', $f['setting'] ); ?>
				</select>
			</label>
			<label>
				<span><?php esc_html_e( 'Budget / week', 'wehaverehabs' ); ?></span>
				<select name="budget">
					<option value=""><?php esc_html_e( 'Any', 'wehaverehabs' ); ?></option>
					<?php
					foreach ( array( 2000, 4000, 6000, 10000 ) as $b ) {
						/* translators: %s: amount in US dollars */
						printf( '<option value="%1$d"%2$s>%3$s</option>', (int) $b, selected( $f['budget'], $b, false ), esc_html( sprintf( __( 'Up to $%s', 'wehaverehabs' ), number_format_i18n( $b ) ) ) );
					}
					?>
				</select>
			</label>
		<?php endif; ?>
		<label>
			<span><?php esc_html_e( 'Stay', 'wehaverehabs' ); ?></span>
			<select name="stay">
				<option value=""><?php esc_html_e( 'Any length', 'wehaverehabs' ); ?></option>
				<?php
				foreach ( array( 7 => __( 'One week', 'wehaverehabs' ), 14 => __( 'Two weeks', 'wehaverehabs' ), 30 => __( 'Thirty days', 'wehaverehabs' ), 60 => __( 'Longer', 'wehaverehabs' ) ) as $n => $label ) {
					printf( '<option value="%1$d"%2$s>%3$s</option>', (int) $n, selected( $f['stay'], $n, false ), esc_html( $label ) );
				}
				?>
			</select>
		</label>
		<button type="submit"><?php echo $compact ? esc_html__( 'Refine', 'wehaverehabs' ) : esc_html__( 'Find your sanctuary', 'wehaverehabs' ); ?></button>
	</form>
</div>
