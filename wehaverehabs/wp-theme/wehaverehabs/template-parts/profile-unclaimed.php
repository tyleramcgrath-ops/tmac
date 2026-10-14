<?php
/**
 * Profile for a public listing that its facility has not claimed yet.
 * Shows only the facts from the public source, with attribution, and a claim form.
 * Expects to run inside The Loop.
 *
 * @package WeHaveRehabs
 */

$post_id = get_the_ID();
$dest    = whr_first_term( 'destination' );
$care    = whr_first_term( 'care_level' );
$focus   = whr_term_names( 'condition' );
$site    = whr_meta( 'website' );
$phone   = whr_meta( 'phone' );
$intake  = whr_meta( 'intake_phone' );
$talk    = whr_option( 'advisor_url' ) ? whr_option( 'advisor_url' ) : whr_whatsapp_url( whr_option( 'whatsapp' ) );
$details = array(
	__( 'Care level', 'wehaverehabs' )       => $care ? $care->name : '',
	__( 'Helps with', 'wehaverehabs' )       => $focus,
	__( 'Service settings', 'wehaverehabs' ) => whr_meta( 'service_setting' ),
	__( 'Approaches', 'wehaverehabs' )       => whr_meta( 'approaches' ),
	__( 'Programs', 'wehaverehabs' )         => whr_meta( 'programs' ),
	__( 'Ages served', 'wehaverehabs' )      => whr_meta( 'ages' ),
	__( 'Languages', 'wehaverehabs' )        => whr_meta( 'languages' ),
	__( 'Payment', 'wehaverehabs' )          => whr_meta( 'payment' ),
	__( 'License', 'wehaverehabs' )          => whr_meta( 'license_text' ),
	__( 'Operated by', 'wehaverehabs' )      => whr_meta( 'operator' ),
);
?>

<section class="hero hero--sm hero--plain">
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
		<h1 class="hero__title" style="font-size:clamp(40px,5.5vw,70px);margin:14px auto 8px"><?php the_title(); ?></h1>
		<?php if ( whr_meta( 'location' ) || whr_meta( 'address' ) ) : ?>
			<p class="hero__sub"><?php echo esc_html( whr_meta( 'address' ) ? whr_meta( 'address' ) : whr_meta( 'location' ) ); ?></p>
		<?php endif; ?>
	</div>
</section>

<div class="claim-banner">
	<div class="wrap">
		<p><strong><?php esc_html_e( 'Public listing', 'wehaverehabs' ); ?></strong> · <?php esc_html_e( 'This facility has not claimed its page, so we only show the details published by the source below. We have not visited or vetted it.', 'wehaverehabs' ); ?></p>
		<a class="btn btn--outline" href="#claim"><?php esc_html_e( 'Is this yours? Claim this listing', 'wehaverehabs' ); ?></a>
	</div>
</div>

<section class="section">
	<div class="wrap listing-layout">
		<div>
			<?php if ( has_excerpt() || get_the_content() ) : ?>
				<div class="entry-content" style="color:var(--text-soft);margin-bottom:30px">
					<?php get_the_content() ? the_content() : the_excerpt(); ?>
				</div>
			<?php endif; ?>
			<dl class="listing-facts">
				<?php foreach ( $details as $label => $value ) : ?>
					<?php if ( $value ) : ?>
						<div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( $value ); ?></dd></div>
					<?php endif; ?>
				<?php endforeach; ?>
			</dl>
			<p class="source-note"><?php echo whr_source_note(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helper. ?></p>
		</div>

		<aside class="side-card listing-contact">
			<h2><?php echo wp_kses_post( __( 'Contact <em>directly</em>', 'wehaverehabs' ) ); ?></h2>
			<p><?php esc_html_e( 'Reach the facility yourself to ask about availability, cost and admission. Details can change — please confirm them with the facility.', 'wehaverehabs' ); ?></p>
			<ul class="contact-list">
				<?php if ( $phone ) : ?>
					<li><span><?php esc_html_e( 'Phone', 'wehaverehabs' ); ?></span><a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $phone ) ); ?>"><?php echo esc_html( $phone ); ?></a></li>
				<?php endif; ?>
				<?php if ( $intake && $intake !== $phone ) : ?>
					<li><span><?php esc_html_e( 'Intake', 'wehaverehabs' ); ?></span><a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $intake ) ); ?>"><?php echo esc_html( $intake ); ?></a></li>
				<?php endif; ?>
				<?php if ( $site ) : ?>
					<li><span><?php esc_html_e( 'Website', 'wehaverehabs' ); ?></span><a href="<?php echo esc_url( $site ); ?>" target="_blank" rel="noopener nofollow"><?php echo esc_html( preg_replace( '#^https?://(www\.)?#', '', untrailingslashit( $site ) ) ); ?></a></li>
				<?php endif; ?>
			</ul>
			<?php if ( $talk ) : ?>
				<p style="margin-bottom:14px"><?php esc_html_e( 'Not sure it’s right for you? An advisor can talk it through for free.', 'wehaverehabs' ); ?></p>
				<a class="btn btn--primary" href="<?php echo esc_url( $talk ); ?>"><?php esc_html_e( 'Talk to an advisor', 'wehaverehabs' ); ?></a>
			<?php endif; ?>
			<p class="trust-note"><?php echo esc_html( whr_option( 'crisis_text' ) ? whr_option( 'crisis_text' ) : __( 'In crisis? Call your local emergency number now.', 'wehaverehabs' ) ); ?></p>
		</aside>
	</div>
</section>

<section class="section bg-sand" id="claim">
	<div class="wrap inquiry-layout">
		<div>
			<div class="eyebrow"><?php esc_html_e( 'For the facility', 'wehaverehabs' ); ?></div>
			<h2 class="display display--md"><?php echo wp_kses_post( __( 'Claim this <em>listing</em>', 'wehaverehabs' ) ); ?></h2>
			<p class="lede"><?php esc_html_e( 'Work here? Claim the page for free to correct details, add photos, your story, rates and programs, and receive inquiries from guests directly.', 'wehaverehabs' ); ?></p>
			<ol class="claim-steps">
				<li><?php esc_html_e( 'Send the form with a work email on your facility’s domain.', 'wehaverehabs' ); ?></li>
				<li><?php esc_html_e( 'We verify you by email or a call to the number on your license.', 'wehaverehabs' ); ?></li>
				<li><?php esc_html_e( 'Your page switches to a full profile and guest inquiries go to you.', 'wehaverehabs' ); ?></li>
			</ol>
		</div>
		<div class="inquiry-card">
			<h2><?php echo wp_kses_post( __( 'Request <em>access</em>', 'wehaverehabs' ) ); ?></h2>
			<?php whr_form_notice( __( 'Thank you — we’ve received your claim and will be in touch to verify it, usually within two working days.', 'wehaverehabs' ) ); ?>
			<form class="form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="whr_claim">
				<input type="hidden" name="sanctuary_id" value="<?php echo esc_attr( $post_id ); ?>">
				<?php wp_nonce_field( 'whr_claim', '_whr_nonce' ); ?>
				<label class="hp" aria-hidden="true">Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
				<label><?php esc_html_e( 'Your name', 'wehaverehabs' ); ?><input type="text" name="claim_name" required autocomplete="name"></label>
				<label><?php esc_html_e( 'Your role', 'wehaverehabs' ); ?><input type="text" name="claim_role" required autocomplete="organization-title"></label>
				<label><?php esc_html_e( 'Work email', 'wehaverehabs' ); ?><input type="email" name="claim_email" required autocomplete="email"></label>
				<label><?php esc_html_e( 'Phone', 'wehaverehabs' ); ?><input type="tel" name="claim_phone" autocomplete="tel"></label>
				<label><?php esc_html_e( 'Anything to correct or add', 'wehaverehabs' ); ?><textarea name="message" rows="3"></textarea></label>
				<label class="check"><input type="checkbox" name="claim_confirm" value="1" required> <span><?php esc_html_e( 'I am authorised to manage this facility’s listing.', 'wehaverehabs' ); ?></span></label>
				<button type="submit" class="btn btn--primary"><?php esc_html_e( 'Send claim', 'wehaverehabs' ); ?></button>
			</form>
		</div>
	</div>
</section>
