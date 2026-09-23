<?php
/**
 * The contact page. The form emails the address in Settings > General.
 *
 * @package drip
 */

?>
<main id="main" class="contact light">
	<div class="wrap contact-grid">
		<div class="contact-intro">
			<p class="eyebrow">Contact</p>
			<h1 class="page-title">Say something.</h1>
			<p class="lede">Questions about an order, a print, or what drops next. Send it here and it lands with us directly.</p>
			<ul class="contact-points">
				<li><?php echo drip_icon( 'box', 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><span><b>Order help</b>Add your order number and we can find it faster.</span></li>
				<li><?php echo drip_icon( 'shirt', 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><span><b>Prints &amp; product</b>Ask about a design, a colorway, or a fit.</span></li>
				<li><?php echo drip_icon( 'wave', 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><span><b>Everything else</b>Collabs, press, or just saying hi.</span></li>
			</ul>
		</div>
		<form class="contact-form" id="contact-form" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<?php echo drip_form_fields( 'contact' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			<div class="field-row">
				<label class="field"><span>Name</span><input type="text" name="name" autocomplete="name" required></label>
				<label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" required></label>
			</div>
			<div class="field-row">
				<label class="field"><span>Order number <em>(optional)</em></span><input type="text" name="order" inputmode="numeric"></label>
				<label class="field"><span>Topic</span>
					<select name="topic">
						<option>Order help</option>
						<option>Prints &amp; product</option>
						<option>Something else</option>
					</select>
				</label>
			</div>
			<label class="field"><span>Message</span><textarea name="message" rows="6" required></textarea></label>
			<button class="btn btn-ink" type="submit">Send message <?php echo drip_icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			<?php echo drip_form_status( 'contact' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		</form>
	</div>
</main>
