<?php
/**
 * Closing call to action, the footer, and wp_footer.
 *
 * @package rma
 */

$rma_slug = is_page() ? get_post_field( 'post_name', get_queried_object_id() ) : '';
?>

<?php if ( 'contact' !== $rma_slug ) : ?>
	<section class="cta">
		<div class="cta-glow" aria-hidden="true"></div>
		<div class="wrap cta-inner">
			<p class="eyebrow">Next Step</p>
			<h2 class="cta-title">Build the plan <em>before</em> adding more spend.</h2>
			<p>Bring the channel, campaign, website, and reporting work into one coordinated system.</p>
			<a class="btn btn-glow btn-large" href="<?php echo rma_url( 'contact' ); ?>" data-magnetic>Let's Grow <?php echo rma_icon( 'arrow', 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
		</div>
	</section>
<?php endif; ?>

<footer class="footer">
	<div class="footer-inner wrap">
		<div class="footer-brand">
			<a class="brand" href="<?php echo rma_url(); ?>" aria-label="Relative Marketing Agency home"><?php echo rma_logo(); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
			<p>Full-service marketing support across search, social media, campaigns, websites, and reporting.</p>
		</div>
		<div class="footer-col">
			<h3>Services</h3>
			<?php foreach ( rma_services() as $slug => $service ) : ?>
				<a href="<?php echo rma_url( $slug ); ?>"><?php echo esc_html( $service['title'] ); ?></a>
			<?php endforeach; ?>
		</div>
		<div class="footer-col">
			<h3>Company</h3>
			<?php foreach ( array( 'about', 'case-studies', 'insights', 'contact' ) as $slug ) : ?>
				<a href="<?php echo rma_url( $slug ); ?>"><?php echo esc_html( rma_company_pages()[ $slug ]['title'] ); ?></a>
			<?php endforeach; ?>
		</div>
		<form class="footer-news" id="newsletter" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<h3>Stay Updated</h3>
			<p>Get practical notes on social media, search, campaigns, and clean reporting.</p>
			<?php echo rma_form_fields( 'newsletter' ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped inside. ?>
			<label class="news-field">
				<span class="sr-only">Email address</span>
				<input type="email" name="email" placeholder="you@company.com" required autocomplete="email">
				<button type="submit" aria-label="Subscribe"><?php echo rma_icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			</label>
			<?php
			if ( ! empty( $_GET['rma'] ) && 'contact' !== $rma_slug ) {
				echo rma_form_status(); // phpcs:ignore WordPress.Security.EscapeOutput
			}
			?>
		</form>
	</div>
	<div class="footer-base wrap">
		<small>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> Relative Marketing Agency. All rights reserved.</small>
		<p class="footer-word" aria-hidden="true">Relative</p>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
