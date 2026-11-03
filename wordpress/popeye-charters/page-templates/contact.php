<?php
/**
 * Template Name: Contact
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>

<section class="section section--ivory section--page-top">
	<div class="container">
		<header class="section-head">
			<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Contact', 'popeye-charters' ); ?></p>
			<h1 class="h-xl"><?php esc_html_e( 'Get in Touch', 'popeye-charters' ); ?></h1>
			<p class="lead"><?php esc_html_e( "Questions, special requests, or just want to say hello — we'd love to hear from you.", 'popeye-charters' ); ?></p>
		</header>

		<div class="contact-layout">
			<div class="form-card">
				<?php popeye_render_form( 'contact', __( 'Send Message', 'popeye-charters' ) ); ?>
			</div>
			<div class="contact-info">
				<div class="info-item">
					<span class="info-item__icon"><?php popeye_the_icon( 'phone' ); ?></span>
					<div><h3><?php esc_html_e( 'Call or Text', 'popeye-charters' ); ?></h3><p><a href="tel:<?php echo esc_attr( popeye_opt( 'phone_raw' ) ); ?>"><?php echo esc_html( popeye_opt( 'phone' ) ); ?></a></p></div>
				</div>
				<div class="info-item">
					<span class="info-item__icon"><?php popeye_the_icon( 'mail' ); ?></span>
					<div><h3><?php esc_html_e( 'Email', 'popeye-charters' ); ?></h3><p><a href="mailto:<?php echo esc_attr( antispambot( popeye_opt( 'email' ) ) ); ?>"><?php echo esc_html( antispambot( popeye_opt( 'email' ) ) ); ?></a></p></div>
				</div>
				<div class="info-item">
					<span class="info-item__icon"><?php popeye_the_icon( 'pin' ); ?></span>
					<div><h3><?php esc_html_e( 'Home Port', 'popeye-charters' ); ?></h3><p><?php esc_html_e( 'Charleston Harbor, South Carolina', 'popeye-charters' ); ?></p><p class="small"><?php esc_html_e( 'Exact slip details provided upon booking confirmation.', 'popeye-charters' ); ?></p></div>
				</div>
				<div class="side-card side-card--parchment">
					<h4><?php esc_html_e( 'Response Time', 'popeye-charters' ); ?></h4>
					<p><?php esc_html_e( 'We typically respond within 24 hours. For urgent inquiries, please call or text directly.', 'popeye-charters' ); ?></p>
				</div>
				<?php
				while ( have_posts() ) :
					the_post();
					if ( trim( get_the_content() ) ) :
						?>
						<div class="prose"><?php the_content(); ?></div>
						<?php
					endif;
				endwhile;
				?>
			</div>
		</div>
	</div>
</section>

<?php
get_footer();
