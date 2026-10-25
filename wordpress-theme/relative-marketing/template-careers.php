<?php
/**
 * Template Name: RMA — Careers
 *
 * @package rma
 */

get_header();
?>

<section class="page-hero">
	<div class="container">
		<div class="breadcrumb"><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'rma' ); ?></a> / <?php esc_html_e( 'Careers', 'rma' ); ?></div>
		<h1><?php esc_html_e( 'Join Our Mission', 'rma' ); ?></h1>
		<p class="lead"><?php esc_html_e( "We're always looking for talented people who are passionate about growth and innovation.", 'rma' ); ?></p>
	</div>
</section>

<section class="section--tight">
	<div class="container">
		<div class="stats">
			<?php
			$stats = array(
				array( '10+', 'Open Positions' ),
				array( '50+', 'Team Members' ),
				array( '100%', 'Remote Friendly' ),
				array( '∞', 'Growth Opportunities' ),
			);
			foreach ( $stats as $s ) : ?>
				<div class="stat"><div class="num"><?php echo esc_html( $s[0] ); ?></div><div class="lbl"><?php echo esc_html( $s[1] ); ?></div></div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<section class="section">
	<div class="container">
		<div class="sec-head"><div><span class="eyebrow"><?php esc_html_e( 'Open Positions', 'rma' ); ?></span><h2><?php esc_html_e( 'Find your next role.', 'rma' ); ?></h2></div></div>
		<div class="job-list">
			<?php
			$jobs = array(
				array( 'SEO Strategist', 'Full-time', 'Remote' ),
				array( 'Paid Media Specialist', 'Full-time', 'Remote' ),
				array( 'Web Designer', 'Full-time', 'Remote' ),
				array( 'Content Marketer', 'Full-time', 'Hybrid — Tampa, FL' ),
				array( 'AI Search Analyst', 'Full-time', 'Remote' ),
			);
			foreach ( $jobs as $j ) : ?>
				<div class="job-card">
					<div>
						<h4><?php echo esc_html( $j[0] ); ?></h4>
						<div class="job-meta"><?php echo esc_html( $j[1] ); ?> &middot; <?php echo esc_html( $j[2] ); ?></div>
					</div>
					<a class="link-arrow" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'View Role', 'rma' ); ?><?php echo rma_icon( 'arrow', 16 ); ?></a>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<!-- blue CTA -->
<section class="section section--tight">
	<div class="container">
		<div class="cta-band" style="grid-template-columns:1fr">
			<div class="cta-left">
				<div style="display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;width:100%">
					<div>
						<h2 style="margin-bottom:6px"><?php esc_html_e( "Don't see the right role?", 'rma' ); ?></h2>
						<p style="margin:0"><?php esc_html_e( "We're always open to great talent.", 'rma' ); ?></p>
					</div>
					<a class="btn btn--light" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Send Your Resume', 'rma' ); ?></a>
				</div>
			</div>
		</div>
	</div>
</section>

<?php
get_footer();
