<?php
/**
 * Sanctuary profile.
 *
 * @package WeHaveRehabs
 */

get_header();

while ( have_posts() ) :
	the_post();
	if ( ! whr_has_full_profile() ) {
		get_template_part( 'template-parts/profile-unclaimed' ); // Public and Essential listings.
		continue;
	}
	$post_id  = get_the_ID();
	$gallery  = whr_gallery_ids();
	$dest     = whr_first_term( 'destination' );
	$care     = whr_first_term( 'care_level' );
	$schedule = whr_rows( whr_meta( 'schedule' ), 3 );
	$team     = whr_rows( whr_meta( 'team' ), 2 );
	$rooms    = whr_rows( whr_meta( 'rooms' ), 3 );
	$clinical = whr_rows( whr_meta( 'clinical' ), 1 );
	$comp     = whr_rows( whr_meta( 'complementary' ), 1 );
	$checked  = whr_meta( 'license_checked' );
	$whatsapp = whr_whatsapp_url( whr_meta( 'whatsapp' ), sprintf( /* translators: %s: sanctuary */ __( 'Hello, I found %s on We Have Rehabs and would like to ask about availability.', 'wehaverehabs' ), get_the_title() ) );
	?>

<section class="hero hero--md">
	<?php echo whr_post_image( null, 'whr-hero', array( 'class' => 'hero__img', 'alt' => '', 'loading' => 'eager', 'fetchpriority' => 'high' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	<?php echo whr_google_photo_slot(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helper. ?>
	<div class="hero__shade"></div>
	<div class="hero__body">
		<?php if ( $dest ) : ?>
			<nav class="breadcrumbs" aria-label="<?php esc_attr_e( 'Breadcrumb', 'wehaverehabs' ); ?>">
				<?php
				$trail = whr_destination_trail( $dest );
				echo $trail ? $trail . ' · ' : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helper.
				?>
				<a href="<?php echo esc_url( get_term_link( $dest ) ); ?>"><?php echo esc_html( $dest->name ); ?></a>
			</nav>
		<?php endif; ?>
		<h1 class="hero__title"><?php the_title(); ?></h1>
		<?php if ( whr_meta( 'tagline' ) ) : ?>
			<p class="hero__sub"><?php echo esc_html( whr_meta( 'tagline' ) ); ?></p>
		<?php endif; ?>
	</div>
</section>

<section class="facts-bar">
	<div class="wrap">
		<dl>
			<?php if ( $care ) : ?>
				<div><dt><?php esc_html_e( 'Care', 'wehaverehabs' ); ?></dt><dd><?php echo esc_html( $care->name ); ?></dd></div>
			<?php endif; ?>
			<?php if ( whr_stay_text() ) : ?>
				<div><dt><?php esc_html_e( 'Stay', 'wehaverehabs' ); ?></dt><dd><?php echo esc_html( whr_stay_text() ); ?></dd></div>
			<?php endif; ?>
			<?php if ( whr_meta( 'guests' ) ) : ?>
				<div><dt><?php esc_html_e( 'Guests', 'wehaverehabs' ); ?></dt><dd><?php echo esc_html( sprintf( /* translators: %d: guests */ __( 'Up to %d', 'wehaverehabs' ), (int) whr_meta( 'guests' ) ) ); ?></dd></div>
			<?php endif; ?>
			<?php if ( whr_meta( 'languages' ) ) : ?>
				<div><dt><?php esc_html_e( 'Language', 'wehaverehabs' ); ?></dt><dd><?php echo esc_html( whr_meta( 'languages' ) ); ?></dd></div>
			<?php endif; ?>
			<?php if ( $checked ) : ?>
				<div><dt><?php esc_html_e( 'License', 'wehaverehabs' ); ?></dt><dd><?php echo esc_html( sprintf( /* translators: %s: date */ __( 'Checked %s', 'wehaverehabs' ), date_i18n( get_option( 'date_format' ), strtotime( $checked ) ) ) ); ?></dd></div>
			<?php endif; ?>
		</dl>
		<a class="btn btn--primary" href="#inquire"><?php echo wp_strip_all_tags( whr_price_html() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- tags stripped from escaped helper output. ?> · <?php esc_html_e( 'Inquire', 'wehaverehabs' ); ?></a>
	</div>
</section>

<?php if ( get_the_content() || has_excerpt() || count( $gallery ) >= 2 ) : ?>
<section class="section">
	<div class="wrap two-col">
		<div>
			<div class="eyebrow"><?php esc_html_e( 'The sanctuary', 'wehaverehabs' ); ?></div>
			<h2 class="display display--md" style="margin-bottom:24px"><?php echo wp_kses_post( sprintf( /* translators: %s: sanctuary */ __( 'About <em>%s</em>', 'wehaverehabs' ), esc_html( get_the_title() ) ) ); ?></h2>
			<div class="entry-content" style="color:var(--text-soft)"><?php get_the_content() ? the_content() : the_excerpt(); ?></div>
		</div>
		<?php if ( count( $gallery ) >= 2 ) : ?>
			<div class="intro-collage">
				<?php echo whr_image( $gallery[0], 'whr-card', array( 'alt' => '' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<?php echo whr_image( $gallery[1], 'whr-square', array( 'alt' => '' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</div>
		<?php endif; ?>
	</div>
</section>
<?php endif; ?>

<?php
$facts = whr_listing_facts();
$phone = whr_meta( 'phone' );
$site  = whr_meta( 'website' );
$where = $phone || $site || whr_meta( 'address' );
if ( $where || count( $facts ) > 3 ) : // More than the care level, focus and languages already shown above.
	?>
<section class="section--tight">
	<div class="wrap listing-layout">
		<div>
			<div class="eyebrow"><?php esc_html_e( 'Details', 'wehaverehabs' ); ?></div>
			<dl class="listing-facts">
				<?php foreach ( $facts as $label => $value ) : ?>
					<div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( $value ); ?></dd></div>
				<?php endforeach; ?>
			</dl>
		</div>
		<?php if ( $where ) : ?>
		<aside class="side-card listing-contact">
			<h2><?php echo wp_kses_post( __( 'Find <em>us</em>', 'wehaverehabs' ) ); ?></h2>
			<ul class="contact-list">
				<?php if ( whr_meta( 'address' ) ) : ?>
					<li><span><?php esc_html_e( 'Address', 'wehaverehabs' ); ?></span><?php echo esc_html( whr_meta( 'address' ) ); ?></li>
				<?php endif; ?>
				<?php if ( $phone ) : ?>
					<li><span><?php esc_html_e( 'Phone', 'wehaverehabs' ); ?></span><a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $phone ) ); ?>"><?php echo esc_html( $phone ); ?></a></li>
				<?php endif; ?>
				<?php if ( $site ) : ?>
					<li><span><?php esc_html_e( 'Website', 'wehaverehabs' ); ?></span><a href="<?php echo esc_url( $site ); ?>" target="_blank" rel="noopener"><?php echo esc_html( preg_replace( '#^https?://(www\.)?#', '', untrailingslashit( $site ) ) ); ?></a></li>
				<?php endif; ?>
			</ul>
			<a class="btn btn--primary" href="#inquire"><?php esc_html_e( 'Send an inquiry', 'wehaverehabs' ); ?></a>
		</aside>
		<?php endif; ?>
	</div>
</section>
<?php endif; ?>

<?php if ( $schedule ) : ?>
<section class="section bg-sand">
	<div class="wrap">
		<div class="section-head center">
			<div class="eyebrow"><?php esc_html_e( 'The rhythm', 'wehaverehabs' ); ?></div>
			<h2 class="display"><?php echo wp_kses_post( sprintf( /* translators: %s: sanctuary */ __( 'A day at <em>%s</em>', 'wehaverehabs' ), esc_html( get_the_title() ) ) ); ?></h2>
		</div>
		<ol class="rhythm">
			<?php foreach ( $schedule as $row ) : ?>
				<li><div class="time"><?php echo esc_html( $row[0] ); ?></div><div class="what"><?php echo esc_html( $row[1] ); ?></div><?php if ( $row[2] ) : ?><div class="how"><?php echo esc_html( $row[2] ); ?></div><?php endif; ?></li>
			<?php endforeach; ?>
		</ol>
	</div>
</section>
<?php endif; ?>

<?php if ( count( $gallery ) > 2 ) : ?>
<section class="gallery-strip" aria-label="<?php esc_attr_e( 'Photos', 'wehaverehabs' ); ?>">
	<?php
	foreach ( array_slice( $gallery, 2, 5 ) as $i => $att ) {
		echo whr_image( $att, 0 === $i ? 'whr-wide' : 'whr-square', array( 'alt' => get_post_meta( $att, '_wp_attachment_image_alt', true ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
	?>
</section>
<?php endif; ?>

<?php if ( $clinical || $comp || $team ) : ?>
<section class="section">
	<div class="wrap two-col" style="align-items:flex-start">
		<div>
			<div class="eyebrow"><?php esc_html_e( 'How healing happens here', 'wehaverehabs' ); ?></div>
			<h2 class="display display--md" style="margin-bottom:30px"><?php echo wp_kses_post( __( 'Clinical care, <em>held gently</em>', 'wehaverehabs' ) ); ?></h2>
			<div class="therapy-cols">
				<?php if ( $clinical ) : ?>
					<div><h3><?php esc_html_e( 'Led by licensed clinicians', 'wehaverehabs' ); ?></h3><ul><?php foreach ( $clinical as $c ) { echo '<li>' . esc_html( $c[0] ) . '</li>'; } ?></ul></div>
				<?php endif; ?>
				<?php if ( $comp ) : ?>
					<div><h3><?php esc_html_e( 'Complementary rituals', 'wehaverehabs' ); ?></h3><ul><?php foreach ( $comp as $c ) { echo '<li>' . esc_html( $c[0] ) . '</li>'; } ?></ul></div>
				<?php endif; ?>
			</div>
		</div>
		<?php if ( $team ) : ?>
			<div>
				<div class="eyebrow"><?php esc_html_e( 'The healers', 'wehaverehabs' ); ?></div>
				<ul class="team-list">
					<?php foreach ( $team as $member ) : ?>
						<li><span class="initial" aria-hidden="true"><?php echo esc_html( mb_substr( $member[0], 0, 1 ) ); ?></span><span><span class="name"><?php echo esc_html( $member[0] ); ?></span><span class="role"><?php echo esc_html( $member[1] ); ?></span></span></li>
					<?php endforeach; ?>
				</ul>
			</div>
		<?php endif; ?>
	</div>
</section>
<?php endif; ?>

<?php if ( $rooms || whr_meta( 'included' ) ) : ?>
<section class="section bg-dark">
	<div class="wrap">
		<div class="section-head center">
			<div class="eyebrow"><?php esc_html_e( 'Your stay', 'wehaverehabs' ); ?></div>
			<h2 class="display"><?php echo wp_kses_post( __( 'Rooms &amp; <em>rates</em>', 'wehaverehabs' ) ); ?></h2>
		</div>
		<?php if ( $rooms ) : ?>
			<div class="rooms">
				<?php foreach ( $rooms as $i => $room ) : ?>
					<div class="room">
						<?php
						$room_img = absint( $room[2] );
						if ( ! $room_img && isset( $gallery[ $i + 2 ] ) ) {
							$room_img = $gallery[ $i + 2 ];
						}
						echo whr_image( $room_img, 'whr-wide', array( 'alt' => '' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						?>
						<h3><?php echo esc_html( $room[0] ); ?></h3>
						<p><?php echo esc_html( $room[1] ); ?></p>
					</div>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
		<div class="inclusions">
			<?php if ( whr_meta( 'included' ) ) : ?>
				<div><h3><?php esc_html_e( 'Included', 'wehaverehabs' ); ?></h3><?php echo nl2br( esc_html( whr_meta( 'included' ) ) ); ?></div>
			<?php endif; ?>
			<?php if ( whr_meta( 'not_included' ) ) : ?>
				<div><h3><?php esc_html_e( 'Not included', 'wehaverehabs' ); ?></h3><?php echo nl2br( esc_html( whr_meta( 'not_included' ) ) ); ?></div>
			<?php endif; ?>
			<div><h3><?php esc_html_e( 'Insurance', 'wehaverehabs' ); ?></h3><?php esc_html_e( 'Most health plans don’t cover care abroad. Ask the sanctuary for itemized receipts for out-of-network claims.', 'wehaverehabs' ); ?></div>
		</div>
	</div>
</section>
<?php endif; ?>

<section class="section" id="inquire">
	<div class="wrap inquiry-layout">
		<div>
			<?php if ( whr_meta( 'guest_quote' ) ) : ?>
				<div class="eyebrow"><?php esc_html_e( 'In their words', 'wehaverehabs' ); ?></div>
				<blockquote style="margin:0">
					<p class="pullquote">“<?php echo esc_html( whr_meta( 'guest_quote' ) ); ?>”</p>
					<?php if ( whr_meta( 'guest_attribution' ) ) : ?>
						<footer style="font-size:14px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:50px"><?php echo esc_html( whr_meta( 'guest_attribution' ) ); ?></footer>
					<?php endif; ?>
				</blockquote>
			<?php endif; ?>
			<?php if ( isset( $gallery[2] ) ) : // Only the sanctuary's own photos, never a stock fallback. ?>
				<?php echo whr_image( $gallery[2], 'whr-wide', array( 'alt' => '', 'style' => 'width:100%;height:440px;object-fit:cover' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<?php endif; ?>
			<?php if ( whr_meta( 'airport' ) ) : ?>
				<p style="font-size:15px;color:var(--muted)"><strong style="font-weight:500"><?php esc_html_e( 'Getting here:', 'wehaverehabs' ); ?></strong> <?php echo esc_html( whr_meta( 'airport' ) ); ?></p>
			<?php endif; ?>
		</div>

		<div class="inquiry-card">
			<h2><?php echo wp_kses_post( __( 'Begin a <em>conversation</em>', 'wehaverehabs' ) ); ?></h2>
			<p class="form-note" style="margin-top:10px">
				<?php
				/* translators: %s: sanctuary */
				echo esc_html( sprintf( __( 'No commitment, no payment. Your note goes only to %s.', 'wehaverehabs' ), get_the_title() ) );
				?>
			</p>
			<?php get_template_part( 'template-parts/inquiry-form', null, array( 'whatsapp' => $whatsapp ) ); ?>
			<?php if ( $care ) : ?>
				<p class="trust-note">
					<strong style="font-weight:500"><?php echo esc_html( $care->name ); ?>:</strong>
					<?php echo esc_html( $care->description ); ?>
					<?php if ( whr_meta( 'license_authority' ) ) : ?>
						<?php
						echo esc_html(
							sprintf(
								/* translators: 1: authority 2: license number */
								__( 'Licensed by %1$s%2$s.', 'wehaverehabs' ),
								whr_meta( 'license_authority' ),
								whr_meta( 'license_number' ) ? ' · #' . whr_meta( 'license_number' ) : ''
							)
						);
						?>
					<?php endif; ?>
				</p>
			<?php endif; ?>
		</div>
	</div>
</section>

	<?php
	// Other full profiles nearby first, then any full profile, then anything.
	$related_base = array(
		'post_type'      => 'sanctuary',
		'posts_per_page' => 3,
		'post__not_in'   => array( $post_id ),
		'no_found_rows'  => true,
		'meta_query'     => array( array( 'key' => 'whr_claimed_sort', 'value' => 2, 'compare' => '>=', 'type' => 'NUMERIC' ) ), // phpcs:ignore WordPress.DB.SlowDBQuery
	);
	$related      = new WP_Query( $related_base + array( 'tax_query' => $dest ? array( array( 'taxonomy' => 'destination', 'terms' => $dest->parent ? $dest->parent : $dest->term_id ) ) : array() ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	if ( $related->post_count < 3 ) {
		$related = new WP_Query( $related_base );
	}
	if ( $related->post_count < 3 ) {
		$related = new WP_Query( array( 'post_type' => 'sanctuary', 'posts_per_page' => 3, 'post__not_in' => array( $post_id ), 'no_found_rows' => true ) );
	}
	if ( $related->have_posts() ) :
		?>
<section class="section--tight bg-sand">
	<div class="wrap">
		<h2 class="display center" style="margin:0 0 40px"><?php echo wp_kses_post( __( 'You may <em>also love</em>', 'wehaverehabs' ) ); ?></h2>
		<div class="card-grid">
			<?php
			while ( $related->have_posts() ) {
				$related->the_post();
				get_template_part( 'template-parts/card-sanctuary' );
			}
			wp_reset_postdata();
			?>
		</div>
	</div>
</section>
		<?php
	endif;
endwhile;

get_footer();
