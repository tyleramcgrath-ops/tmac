<?php
/**
 * The drop-list sign-up and the footer.
 *
 * @package drip
 */

$drip_cats = drip_shop_categories();
?>
<section class="join" id="join" aria-labelledby="join-title">
	<div class="join-art" aria-hidden="true"><?php echo drip_swell( array( 'lines' => 14, 'height' => 420, 'crest' => 0.7, 'seed' => 21, 'spray' => 70, 'class' => 'swell swell-join' ) ); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
	<div class="wrap join-inner">
		<div>
			<p class="eyebrow">The drop list</p>
			<h2 class="join-title" id="join-title">Catch the next swell.</h2>
			<p class="join-copy">One email when a new drop lands. Nothing in between.</p>
		</div>
		<form class="join-form" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<?php echo drip_form_fields( 'newsletter' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			<label class="sr-only" for="join-email">Email address</label>
			<input id="join-email" type="email" name="email" placeholder="you@email.com" required autocomplete="email">
			<button class="btn btn-foam" type="submit">Join <?php echo drip_icon( 'arrow', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			<?php echo drip_form_status( 'newsletter' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		</form>
	</div>
</section>

<footer class="site-footer">
	<div class="wrap footer-grid">
		<div class="footer-brand">
			<a class="brand brand-footer" href="<?php echo drip_url(); // phpcs:ignore WordPress.Security.EscapeOutput ?>" aria-label="DRIP home"><?php echo drip_logo( 'footer' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
			<p class="footer-line">Built for where you are.</p>
		</div>
		<nav class="footer-col" aria-label="Shop">
			<h2>Shop</h2>
			<a href="<?php echo drip_wc_url( 'shop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Shop all</a>
			<?php foreach ( $drip_cats as $drip_term ) : ?>
				<a href="<?php echo esc_url( get_term_link( $drip_term ) ); ?>"><?php echo esc_html( $drip_term->name ); ?></a>
			<?php endforeach; ?>
		</nav>
		<nav class="footer-col" aria-label="Brand">
			<h2>DRIP</h2>
			<a href="<?php echo drip_url( 'about' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Our story</a>
			<?php if ( get_option( 'page_for_posts' ) ) : ?>
				<a href="<?php echo esc_url( get_permalink( get_option( 'page_for_posts' ) ) ); ?>">Journal</a>
			<?php endif; ?>
			<a href="<?php echo drip_url( 'contact' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Contact</a>
		</nav>
		<nav class="footer-col" aria-label="Help">
			<h2>Help</h2>
			<a href="<?php echo drip_wc_url( 'cart' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Your bag</a>
			<a href="<?php echo drip_wc_url( 'myaccount' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Account &amp; orders</a>
			<a href="<?php echo drip_url( 'contact' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Order help</a>
		</nav>
	</div>
	<div class="footer-mark" aria-hidden="true">DRIP</div>
	<div class="wrap footer-base">
		<p>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> DRIP Clothing Co.</p>
		<p>Between tides and traffic.</p>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
