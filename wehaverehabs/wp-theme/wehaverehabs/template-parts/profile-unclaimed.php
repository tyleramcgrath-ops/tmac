<?php
/**
 * Simple profile for public listings (facts from the source, attribution, claim form) and for
 * verified listings on the free Essential plan (facts kept by the facility, its short
 * description and the inquiry form). Paid plans use the full profile in single-sanctuary.php.
 * Expects to run inside The Loop.
 *
 * @package WeHaveRehabs
 */

$post_id = get_the_ID();
$claimed = whr_is_claimed();
$dest    = whr_first_term( 'destination' );
$site    = whr_meta( 'website' );
$phone   = whr_meta( 'phone' );
$intake  = whr_meta( 'intake_phone' );
$talk    = whr_option( 'advisor_url' ) ? whr_option( 'advisor_url' ) : whr_whatsapp_url( whr_option( 'whatsapp' ) );
$details = whr_listing_facts();
?>

<?php
$place_photo = whr_listing_place_photo(); // Region or country landscape, credited as such.
$gphoto      = whr_google_photo_slot();
?>
<section class="hero hero--sm hero--plain<?php echo $place_photo ? ' has-place-photo' : ''; ?>">
	<?php
	echo $place_photo . $gphoto; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helpers.
	if ( $gphoto || $place_photo ) {
		echo '<div class="hero__shade whr-gphoto-shade"></div>';
	}
	?>
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

<?php if ( current_user_can( 'edit_post', $post_id ) ) : ?>
	<div class="owner-bar">
		<div class="wrap">
			<p><strong><?php echo esc_html( whr_plans()[ whr_plan() ][0] ); ?></strong> · <?php esc_html_e( 'Add photos, your full story, rates and rooms with the Signature plan.', 'wehaverehabs' ); ?></p>
			<a class="btn btn--primary" href="<?php echo esc_url( get_edit_post_link( $post_id ) ); ?>"><?php esc_html_e( 'Edit listing & plans', 'wehaverehabs' ); ?></a>
		</div>
	</div>
<?php endif; ?>

<div class="claim-banner<?php echo $claimed ? ' claim-banner--verified' : ''; ?>">
	<div class="wrap">
		<?php if ( $claimed ) : ?>
			<p><strong><?php esc_html_e( 'Verified by the facility', 'wehaverehabs' ); ?></strong> · <?php esc_html_e( 'The details on this page are kept up to date by the facility itself. We have not visited it.', 'wehaverehabs' ); ?></p>
			<a class="btn btn--outline" href="#inquire"><?php esc_html_e( 'Send an inquiry', 'wehaverehabs' ); ?></a>
		<?php else : ?>
			<p><strong><?php esc_html_e( 'Public listing', 'wehaverehabs' ); ?></strong> · <?php esc_html_e( 'This facility has not claimed its page, so we only show the details published by the source below. We have not visited or vetted it.', 'wehaverehabs' ); ?></p>
			<a class="btn btn--outline" href="#claim"><?php esc_html_e( 'Is this yours? Claim this listing', 'wehaverehabs' ); ?></a>
		<?php endif; ?>
	</div>
</div>

<section class="section">
	<div class="wrap listing-layout">
		<div>
			<?php if ( has_excerpt() ) : ?>
				<div class="entry-content" style="color:var(--text-soft);margin-bottom:30px">
					<?php the_excerpt(); // The short description; the full story is a Signature feature. ?>
				</div>
			<?php endif; ?>
			<dl class="listing-facts">
				<?php foreach ( $details as $label => $value ) : ?>
					<div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( $value ); ?></dd></div>
				<?php endforeach; ?>
			</dl>
			<?php if ( ! $claimed ) : ?>
				<p class="source-note"><?php echo whr_source_note(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helper. ?></p>
			<?php endif; ?>
		</div>

		<aside class="side-card listing-contact">
			<h2><?php echo wp_kses_post( __( 'Contact <em>directly</em>', 'wehaverehabs' ) ); ?></h2>
			<p><?php echo esc_html( $claimed ? __( 'Call or write to the facility, or send an inquiry below — it goes straight to their team.', 'wehaverehabs' ) : __( 'Reach the facility yourself to ask about availability, cost and admission. Details can change — please confirm them with the facility.', 'wehaverehabs' ) ); ?></p>
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

<?php if ( $claimed ) : ?>
<section class="section bg-sand" id="inquire">
	<div class="wrap inquiry-layout">
		<div>
			<div class="eyebrow"><?php esc_html_e( 'Begin a conversation', 'wehaverehabs' ); ?></div>
			<h2 class="display display--md"><?php echo wp_kses_post( sprintf( /* translators: %s: facility */ __( 'Write to <em>%s</em>', 'wehaverehabs' ), esc_html( get_the_title() ) ) ); ?></h2>
			<p class="lede"><?php esc_html_e( 'No commitment and no payment. Your note goes only to the facility.', 'wehaverehabs' ); ?></p>
		</div>
		<div class="inquiry-card">
			<h2><?php echo wp_kses_post( __( 'Send an <em>inquiry</em>', 'wehaverehabs' ) ); ?></h2>
			<?php get_template_part( 'template-parts/inquiry-form' ); ?>
		</div>
	</div>
</section>
<?php else : ?>
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
<?php endif; ?>
