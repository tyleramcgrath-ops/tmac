<?php
/**
 * Template Name: RMA — About
 *
 * @package rma
 */

get_header();
?>

<section class="page-hero">
	<div class="container grid-2">
		<div>
			<div class="breadcrumb"><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'rma' ); ?></a> / <?php esc_html_e( 'About', 'rma' ); ?></div>
			<h1><?php echo wp_kses_post( __( "We're a team of strategists, creators, and technologists <span class=\"text-blue\">obsessed with growth.</span>", 'rma' ) ); ?></h1>
			<p class="lead"><?php esc_html_e( 'We combine data, creativity, and technology to build marketing systems that drive measurable growth and long-term value.', 'rma' ); ?></p>
			<div class="hero-cta"><a class="btn btn--primary" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Our Story', 'rma' ); ?></a></div>
		</div>
		<div class="dash-img"></div>
	</div>
</section>

<!-- Stats -->
<section class="section--tight">
	<div class="container">
		<div class="stats">
			<?php
			$stats = array(
				array( '10+', 'Years of Experience' ),
				array( '250+', 'Happy Clients' ),
				array( '$100M+', 'Revenue Generated' ),
				array( '98%', 'Client Retention' ),
			);
			foreach ( $stats as $s ) : ?>
				<div class="stat"><div class="num"><?php echo esc_html( $s[0] ); ?></div><div class="lbl"><?php echo esc_html( $s[1] ); ?></div></div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<!-- Values -->
<section class="section bg-alt">
	<div class="container">
		<div class="sec-head"><div><span class="eyebrow"><?php esc_html_e( 'Our Values', 'rma' ); ?></span><h2><?php esc_html_e( 'What drives everything we do.', 'rma' ); ?></h2></div></div>
		<div class="feature-grid">
			<?php
			$values = array(
				array( 'gauge',  'Data-Driven Decisions', 'We let data, not opinions, drive every decision.' ),
				array( 'compass','Relentless Curiosity', 'We never stop learning, testing, and improving.' ),
				array( 'users',  'Transparent Partnerships', 'No vanity metrics. Just honest, clear reporting.' ),
				array( 'target', 'Results Obsessed', 'Strategic thinking that drives real impact.' ),
			);
			foreach ( $values as $v ) : ?>
				<div class="feature"><span class="f-ic"><?php echo rma_icon( $v[0], 22 ); ?></span><h4><?php echo esc_html( $v[1] ); ?></h4><p><?php echo esc_html( $v[2] ); ?></p></div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<!-- Leadership -->
<section class="section">
	<div class="container">
		<div class="sec-head"><div><span class="eyebrow"><?php esc_html_e( 'Leadership', 'rma' ); ?></span><h2><?php esc_html_e( 'Meet the team behind the growth.', 'rma' ); ?></h2></div></div>
		<div class="team-grid">
			<?php
			$team = array(
				array( 'Michael Chen', 'Founder &amp; CEO' ),
				array( 'Sarah Johnson', 'Head of Growth' ),
				array( 'David Lee', 'Head of Strategy' ),
				array( 'Jessica Martinez', 'Head of Creative' ),
			);
			foreach ( $team as $m ) : ?>
				<div class="team-card"><div class="photo"></div><h4><?php echo esc_html( $m[0] ); ?></h4><div class="role"><?php echo wp_kses_post( $m[1] ); ?></div></div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<?php get_template_part( 'template-parts/cta' ); ?>

<?php
get_footer();
