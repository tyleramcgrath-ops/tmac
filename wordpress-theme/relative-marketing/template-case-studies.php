<?php
/**
 * Template Name: RMA — Case Studies
 *
 * @package rma
 */

get_header();
?>

<section class="page-hero">
	<div class="container">
		<div class="breadcrumb"><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'rma' ); ?></a> / <?php esc_html_e( 'Case Studies', 'rma' ); ?></div>
		<h1><?php echo wp_kses_post( __( 'Real results.<br>Real impact.', 'rma' ) ); ?></h1>
		<p class="lead"><?php esc_html_e( 'See how we help brands grow through smart strategies and relentless execution.', 'rma' ); ?></p>
	</div>
</section>

<section class="section--tight">
	<div class="container">
		<div class="filters">
			<button class="filter-pill active"><?php esc_html_e( 'All', 'rma' ); ?></button>
			<button class="filter-pill"><?php esc_html_e( 'Ecommerce', 'rma' ); ?></button>
			<button class="filter-pill"><?php esc_html_e( 'SaaS', 'rma' ); ?></button>
			<button class="filter-pill"><?php esc_html_e( 'Local Business', 'rma' ); ?></button>
			<button class="filter-pill"><?php esc_html_e( 'B2B', 'rma' ); ?></button>
		</div>
		<div class="case-grid">
			<?php
			$cases = array(
				array( 'Ecommerce Brand', '312% increase in revenue in 6 months', 'Paid Media + SEO' ),
				array( 'SaaS Company', '184% more pipelines with AI search visibility', 'SEO + AI Search Optimization' ),
				array( 'Local Business', '220% more leads in under 6 months', 'Local SEO + Paid Media' ),
				array( 'D2C Brand', '4.7x return on ad spend across channels', 'Paid Media' ),
				array( 'Fintech Startup', '290% growth in qualified demos booked', 'Web Design + SEO' ),
				array( 'Healthcare Group', '156% lift in organic patient inquiries', 'AI Search Optimization' ),
			);
			foreach ( $cases as $c ) : ?>
				<a class="case-card" href="<?php echo esc_url( home_url( '/case-studies/' ) ); ?>">
					<span class="tag"><?php echo esc_html( $c[0] ); ?></span>
					<h3><?php echo esc_html( $c[1] ); ?></h3>
					<p style="font-size:14px;color:var(--body)"><?php echo esc_html( $c[2] ); ?></p>
					<span class="link-arrow"><?php esc_html_e( 'View Case Study', 'rma' ); ?><?php echo rma_icon( 'arrow', 16 ); ?></span>
					<div class="case-thumb"></div>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<!-- dark CTA -->
<section class="section section--tight">
	<div class="container">
		<div style="background:var(--navy);border-radius:var(--radius-lg);padding:56px;color:#fff;text-align:center">
			<h2 style="color:#fff"><?php esc_html_e( 'Your success story could be next.', 'rma' ); ?></h2>
			<p style="color:rgba(255,255,255,.75);max-width:480px;margin:0 auto 24px"><?php esc_html_e( "Let's make it happen.", 'rma' ); ?></p>
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Start Your Growth Plan', 'rma' ); ?></a>
		</div>
	</div>
</section>

<?php
get_footer();
