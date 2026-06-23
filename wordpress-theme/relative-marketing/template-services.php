<?php
/**
 * Template Name: RMA — Services
 *
 * @package rma
 */

get_header();
?>

<section class="page-hero bg-alt">
	<div class="container grid-2">
		<div>
			<h1><?php esc_html_e( 'Services That Drive Growth', 'rma' ); ?></h1>
			<p class="lead"><?php esc_html_e( 'End-to-end marketing solutions powered by data, technology, and creative strategy.', 'rma' ); ?></p>
		</div>
		<div class="dash-img"></div>
	</div>
</section>

<section class="section">
	<div class="container">
		<div class="svc-cards">
			<?php
			$services = array(
				array( 'search',  'AI Search Optimization', 'Get visible across AI Overviews, ChatGPT, Perplexity, Gemini, and every answer engine.' ),
				array( 'gauge',   'SEO',                    'Technical, on-page, and off-page SEO built to drive sustainable organic growth.' ),
				array( 'send',    'Paid Media',             'Data-driven paid campaigns that maximize ROI across search, social, and display.' ),
				array( 'monitor', 'Web Design',             'High-converting, fast websites designed for performance and user experience.' ),
				array( 'shield',  'Branding',               'Strategic branding and identity systems that build trust and long-term value.' ),
				array( 'target',  'Automation & Analytics', 'Smart automation and real-time analytics so you can make confident decisions.' ),
			);
			foreach ( $services as $s ) : ?>
				<div class="svc-card">
					<span class="svc-icon"><?php echo rma_icon( $s[0], 24 ); ?></span>
					<h3><?php echo esc_html( $s[1] ); ?></h3>
					<p><?php echo esc_html( $s[2] ); ?></p>
					<a class="link-arrow" href="<?php echo esc_url( home_url( '/ai-search-optimization/' ) ); ?>"><?php esc_html_e( 'Learn More', 'rma' ); ?><?php echo rma_icon( 'arrow', 16 ); ?></a>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<!-- Not sure where to start band -->
<section class="section section--tight">
	<div class="container">
		<div class="cta-band" style="grid-template-columns:1fr;">
			<div class="cta-left" style="background:var(--navy);">
				<h2><?php esc_html_e( 'Not sure where to start?', 'rma' ); ?></h2>
				<p><?php esc_html_e( 'Get a custom strategy based on your goals, industry, and growth opportunities.', 'rma' ); ?></p>
				<div><a class="btn btn--primary" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Get My Strategy', 'rma' ); ?></a></div>
			</div>
		</div>
	</div>
</section>

<!-- How we help -->
<section class="section">
	<div class="container">
		<div class="sec-head"><div><span class="eyebrow"><?php esc_html_e( 'How We Help', 'rma' ); ?></span><h2><?php esc_html_e( 'A proven process for every engagement.', 'rma' ); ?></h2></div></div>
		<div class="feature-grid">
			<?php
			$steps = array(
				array( 'compass', 'Discover', 'We audit your brand, market, and competitors.' ),
				array( 'layers',  'Strategize', 'We build a data-backed growth roadmap.' ),
				array( 'rocket',  'Execute', 'We launch and scale with precision.' ),
				array( 'gauge',   'Optimize', 'We measure, learn, and scale what works.' ),
			);
			foreach ( $steps as $st ) : ?>
				<div class="feature">
					<span class="f-ic"><?php echo rma_icon( $st[0], 22 ); ?></span>
					<h4><?php echo esc_html( $st[1] ); ?></h4>
					<p><?php echo esc_html( $st[2] ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<!-- Trusted by -->
<section class="section section--tight bg-alt">
	<div class="container center">
		<h2 style="margin-bottom:30px"><?php esc_html_e( 'Trusted by innovative companies around the world.', 'rma' ); ?></h2>
		<div class="logos-row" style="justify-content:center;">
			<span class="logo-item"><?php echo rma_icon( 'spark', 18 ); ?>growthly</span>
			<span class="logo-item"><?php echo rma_icon( 'spark', 18 ); ?>Brightly</span>
			<span class="logo-item"><?php echo rma_icon( 'layers', 18 ); ?>aventa</span>
			<span class="logo-item"><?php echo rma_icon( 'gauge', 18 ); ?>scaleup</span>
			<span class="logo-item" style="letter-spacing:.3em;">LUMEN</span>
		</div>
	</div>
</section>

<?php
get_footer();
