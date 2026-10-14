<?php
/**
 * Template Name: For sanctuaries (listing & plans)
 *
 * @package WeHaveRehabs
 */

get_header();
the_post();
?>

<section class="owners-hero">
	<div class="owners-hero__body">
		<div class="eyebrow"><?php esc_html_e( 'Retreats · clinics · treatment centers', 'wehaverehabs' ); ?></div>
		<h1><?php echo wp_kses_post( __( 'Be found by the people <em>looking for you</em>', 'wehaverehabs' ) ); ?></h1>
		<p class="lede" style="font-size:19px;margin:0 0 32px;max-width:560px"><?php esc_html_e( 'Share your sanctuary with guests from around the world who are ready to travel for healing. Listing is free; inquiries come straight to you.', 'wehaverehabs' ); ?></p>
		<div class="btn-row">
			<a class="btn btn--primary" href="#list"><?php esc_html_e( 'List your sanctuary', 'wehaverehabs' ); ?></a>
			<a class="btn btn--outline" href="#plans"><?php esc_html_e( 'See plans', 'wehaverehabs' ); ?></a>
		</div>
	</div>
	<div class="owners-hero__media">
		<?php echo has_post_thumbnail() ? whr_post_image( null, 'whr-wide', array( 'alt' => '' ) ) : whr_image( 0, 'whr-wide', array( 'alt' => '' ), 'hacienda.jpg' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	</div>
</section>

<section class="section">
	<div class="wrap promises">
		<div><div class="n">i.</div><h3><?php esc_html_e( 'Told beautifully', 'wehaverehabs' ); ?></h3><p><?php esc_html_e( 'Large photography, your daily rhythm, your healers and rooms — a profile that feels like you.', 'wehaverehabs' ); ?></p></div>
		<div><div class="n">ii.</div><h3><?php esc_html_e( 'Labeled honestly', 'wehaverehabs' ); ?></h3><p><?php esc_html_e( 'Retreat, clinical or medically supervised. We check licenses for clinical care, so guests can trust you.', 'wehaverehabs' ); ?></p></div>
		<div><div class="n">iii.</div><h3><?php esc_html_e( 'Direct to you', 'wehaverehabs' ); ?></h3><p><?php esc_html_e( 'Inquiries by email or WhatsApp, in any language. No commission on stays.', 'wehaverehabs' ); ?></p></div>
	</div>
</section>

<?php if ( get_the_content() ) : ?>
<section class="section--tight bg-sand">
	<div class="narrow entry-content"><?php the_content(); ?></div>
</section>
<?php endif; ?>

<section class="section bg-dark" id="plans">
	<div class="wrap">
		<div class="section-head center">
			<div class="eyebrow"><?php esc_html_e( 'Plans', 'wehaverehabs' ); ?></div>
			<h2 class="display"><?php echo wp_kses_post( __( 'Simple, <em>and fair</em>', 'wehaverehabs' ) ); ?></h2>
		</div>
		<div class="plans">
			<div class="plan">
				<div class="plan__name"><?php esc_html_e( 'Essential', 'wehaverehabs' ); ?></div>
				<div class="plan__price"><?php esc_html_e( 'Free', 'wehaverehabs' ); ?></div>
				<ul><li><?php esc_html_e( 'Full sanctuary profile', 'wehaverehabs' ); ?></li><li><?php esc_html_e( 'Care-level label after review', 'wehaverehabs' ); ?></li><li><?php esc_html_e( 'Up to 8 photographs', 'wehaverehabs' ); ?></li><li><?php esc_html_e( 'Email inquiries', 'wehaverehabs' ); ?></li></ul>
				<a class="btn btn--light" href="#list"><?php esc_html_e( 'Begin free', 'wehaverehabs' ); ?></a>
			</div>
			<div class="plan plan--featured">
				<div class="plan__name"><?php esc_html_e( 'Signature · most chosen', 'wehaverehabs' ); ?></div>
				<div class="plan__price"><?php echo esc_html( whr_option( 'price_signature', __( 'Ask us', 'wehaverehabs' ) ) ); ?></div>
				<ul><li><?php esc_html_e( 'Everything in Essential', 'wehaverehabs' ); ?></li><li><?php esc_html_e( 'Unlimited photography & film', 'wehaverehabs' ); ?></li><li><?php esc_html_e( 'WhatsApp inquiry button', 'wehaverehabs' ); ?></li><li><?php esc_html_e( 'Profile in several languages', 'wehaverehabs' ); ?></li><li><?php esc_html_e( 'Inquiry reports by country', 'wehaverehabs' ); ?></li></ul>
				<a class="btn btn--primary" href="#list"><?php esc_html_e( 'Choose Signature', 'wehaverehabs' ); ?></a>
			</div>
			<div class="plan">
				<div class="plan__name"><?php esc_html_e( 'Featured', 'wehaverehabs' ); ?></div>
				<div class="plan__price"><?php echo esc_html( whr_option( 'price_featured', __( 'Ask us', 'wehaverehabs' ) ) ); ?></div>
				<ul><li><?php esc_html_e( 'Everything in Signature', 'wehaverehabs' ); ?></li><li><?php esc_html_e( 'Top placement on your destination page', 'wehaverehabs' ); ?></li><li><?php esc_html_e( 'Homepage “Places we love” rotation', 'wehaverehabs' ); ?></li><li><?php esc_html_e( 'Always marked “Sponsored”', 'wehaverehabs' ); ?></li></ul>
				<a class="btn btn--light" href="#list"><?php esc_html_e( 'Speak with us', 'wehaverehabs' ); ?></a>
			</div>
		</div>
		<p class="center lede" style="margin-top:30px;font-size:14px"><?php esc_html_e( 'Paid plans never change your care-level label, license check or guest reviews.', 'wehaverehabs' ); ?></p>
	</div>
</section>

<section class="section" id="list">
	<div class="wrap inquiry-layout">
		<div>
			<div class="eyebrow"><?php esc_html_e( 'Join the directory', 'wehaverehabs' ); ?></div>
			<h2 class="display display--md" style="margin-bottom:24px"><?php echo wp_kses_post( __( 'Tell us about <em>your sanctuary</em>', 'wehaverehabs' ) ); ?></h2>
			<p class="lede"><?php esc_html_e( 'We review every request personally. Clinical programs will be asked for their license and clinician credentials before going live.', 'wehaverehabs' ); ?></p>
			<?php echo whr_image( 0, 'whr-wide', array( 'alt' => '', 'style' => 'margin-top:30px;width:100%;height:420px;object-fit:cover' ), 'daybed.jpg' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		</div>
		<div class="inquiry-card">
			<h2><?php echo wp_kses_post( __( 'Request a <em>listing</em>', 'wehaverehabs' ) ); ?></h2>
			<?php whr_form_notice( __( 'Thank you — we’ve received your request and will be in touch within a few working days.', 'wehaverehabs' ) ); ?>
			<form class="form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="whr_listing">
				<input type="hidden" name="return_to" value="<?php the_permalink(); ?>">
				<?php wp_nonce_field( 'whr_listing', '_whr_nonce' ); ?>
				<label class="hp" aria-hidden="true">Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
				<label><?php esc_html_e( 'Sanctuary name', 'wehaverehabs' ); ?><input type="text" name="sanctuary_name" required></label>
				<div class="row">
					<label><?php esc_html_e( 'Your name', 'wehaverehabs' ); ?><input type="text" name="contact_name" autocomplete="name"></label>
					<label><?php esc_html_e( 'Country', 'wehaverehabs' ); ?><input type="text" name="country"></label>
				</div>
				<label><?php esc_html_e( 'Email', 'wehaverehabs' ); ?><input type="email" name="email" required autocomplete="email"></label>
				<label><?php esc_html_e( 'Website', 'wehaverehabs' ); ?><input type="url" name="site" placeholder="https://"></label>
				<label><?php esc_html_e( 'Kind of care', 'wehaverehabs' ); ?>
					<select name="care">
						<?php
						$levels = get_terms( array( 'taxonomy' => 'care_level', 'hide_empty' => false ) );
						foreach ( is_wp_error( $levels ) ? array() : $levels as $level ) {
							printf( '<option>%s</option>', esc_html( $level->name ) );
						}
						?>
					</select>
				</label>
				<label><?php esc_html_e( 'Anything else', 'wehaverehabs' ); ?><textarea name="message" rows="3"></textarea></label>
				<button type="submit" class="btn btn--primary"><?php esc_html_e( 'Send request', 'wehaverehabs' ); ?></button>
			</form>
		</div>
	</div>
</section>

<?php
get_footer();
