<?php
/**
 * Template Name: RMA — Service Details
 *
 * @package rma
 */

get_header();
?>

<section class="page-hero">
	<div class="container ai-vis-grid" style="align-items:center;">
		<div>
			<div class="breadcrumb"><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'rma' ); ?></a> / <a href="<?php echo esc_url( home_url( '/services/' ) ); ?>"><?php esc_html_e( 'Services', 'rma' ); ?></a> / <?php esc_html_e( 'AI Search Optimization', 'rma' ); ?></div>
			<h1><?php esc_html_e( 'AI Search Optimization', 'rma' ); ?></h1>
			<p class="lead"><?php esc_html_e( 'Be the answer everywhere. We help brands get visible in AI Overviews, ChatGPT, Perplexity, Gemini, and every AI-powered search experience.', 'rma' ); ?></p>
			<div class="hero-cta"><a class="btn btn--primary" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Get Started', 'rma' ); ?></a></div>
		</div>
		<div class="orbit">
			<div class="ring r1" style="border-color:rgba(31,79,255,.18)"></div>
			<div class="ring r2" style="border-color:rgba(31,79,255,.16)"></div>
			<div class="ring r3" style="border-color:rgba(31,79,255,.12)"></div>
			<div class="core" style="background:radial-gradient(circle at 50% 40%,#eef2ff,#dbe6ff);border-color:rgba(31,79,255,.4);box-shadow:0 0 50px rgba(31,79,255,.2)"><?php echo rma_brand_mark(); // phpcs:ignore ?></div>
			<div class="chip c-google" style="background:#fff;border-color:var(--line);color:var(--ink)"><span class="dot" style="background:#10a37f"></span> ChatGPT</div>
			<div class="chip c-chatgpt" style="background:#fff;border-color:var(--line);color:var(--ink)"><span class="dot" style="background:#4285f4"></span> Copilot</div>
			<div class="chip c-claude" style="background:#fff;border-color:var(--line);color:var(--ink)"><span class="dot" style="background:#20808d"></span> Perplexity</div>
			<div class="chip c-gemini" style="background:#fff;border-color:var(--line);color:var(--ink)"><span class="dot" style="background:#ea4335"></span> AI Overviews</div>
		</div>
	</div>
</section>

<!-- benefit row -->
<section class="section--tight">
	<div class="container">
		<div class="feature-grid">
			<?php
			$benefits = array(
				array( 'search', 'AI Visibility', 'Present in AI answers' ),
				array( 'spark',  'Answer Engine Presence', 'Cited as a source' ),
				array( 'shield', 'Brand Authority', 'Trusted and recommended' ),
				array( 'gauge',  'More Traffic', 'Qualified, intent-driven' ),
			);
			foreach ( $benefits as $b ) : ?>
				<div class="feature"><span class="f-ic"><?php echo rma_icon( $b[0], 22 ); ?></span><h4><?php echo esc_html( $b[1] ); ?></h4><p><?php echo esc_html( $b[2] ); ?></p></div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<!-- what is it -->
<section class="section bg-alt">
	<div class="container grid-2">
		<div>
			<h2><?php esc_html_e( 'What Is AI Search Optimization?', 'rma' ); ?></h2>
			<p class="lead"><?php esc_html_e( 'AI Search Optimization (AISO) is the practice of optimizing your content, brand, and digital presence to be visible, cited, and recommended by AI engines and answer boxes.', 'rma' ); ?></p>
			<ul style="list-style:none;padding:0;margin-top:20px">
				<?php
				$points = array(
					'Rank in AI Overviews and answer boxes',
					'Get cited by ChatGPT, Perplexity, Gemini & more',
					'Build brand authority and entity presence',
					'Drive highly qualified, intent-driven traffic',
				);
				foreach ( $points as $p ) {
					echo '<li style="display:flex;gap:12px;margin-bottom:14px;align-items:center"><span style="color:var(--blue)">' . rma_icon( 'check', 20 ) . '</span>' . esc_html( $p ) . '</li>';
				}
				?>
			</ul>
		</div>
		<div class="dash-img"></div>
	</div>
</section>

<!-- process -->
<section class="section">
	<div class="container">
		<div class="sec-head"><div><span class="eyebrow"><?php esc_html_e( 'Our Process', 'rma' ); ?></span></div></div>
		<div class="feature-grid">
			<?php
			$steps = array(
				array( '01', 'Research & Audit', 'We analyze your brand signals, content, and competitors.' ),
				array( '02', 'Strategy & Content', 'We optimize your content for AI engines and user intent.' ),
				array( '03', 'Implementation', 'We structure, publish, and build authority signals.' ),
				array( '04', 'Monitor & Optimize', 'We track AI visibility and continuously improve.' ),
			);
			foreach ( $steps as $st ) : ?>
				<div class="feature"><div class="num" style="color:var(--blue);font-weight:800;font-size:14px;margin-bottom:8px"><?php echo esc_html( $st[0] ); ?></div><h4><?php echo esc_html( $st[1] ); ?></h4><p><?php echo esc_html( $st[2] ); ?></p></div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<!-- gradient cta -->
<section class="section section--tight">
	<div class="container">
		<div style="background:radial-gradient(120% 140% at 0% 0%,#6d28d9,#2a4cff 60%,#1733c9);border-radius:var(--radius-lg);padding:56px;color:#fff;text-align:center">
			<h2 style="color:#fff"><?php esc_html_e( 'Ready to dominate AI search?', 'rma' ); ?></h2>
			<p style="color:rgba(255,255,255,.85);max-width:520px;margin:0 auto 24px"><?php esc_html_e( "Let's make your brand the answer.", 'rma' ); ?></p>
			<a class="btn btn--light" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Start Your Growth Plan', 'rma' ); ?></a>
		</div>
	</div>
</section>

<!-- FAQ -->
<section class="section">
	<div class="container" style="max-width:840px">
		<div class="sec-head" style="justify-content:center"><div class="center" style="width:100%"><span class="eyebrow"><?php esc_html_e( 'FAQ', 'rma' ); ?></span><h2><?php esc_html_e( 'Frequently Asked Questions', 'rma' ); ?></h2></div></div>
		<?php
		$faqs = array(
			array( 'What is AI Search Optimization?', 'AI Search Optimization is the discipline of making your brand visible and citable inside AI-driven answer engines like ChatGPT, Google AI Overviews, Perplexity, and Gemini.' ),
			array( 'How is this different from SEO?', 'Traditional SEO targets blue-link rankings. AISO targets being the cited source inside generated answers, which requires entity authority, structured content, and answer-ready formatting.' ),
			array( 'How long does it take to see results?', 'Most clients see early visibility shifts within 60–90 days, with compounding authority gains over 6 months.' ),
			array( 'Which platforms do you optimize for?', 'ChatGPT, Google AI Overviews, Perplexity, Gemini, Copilot, and emerging answer engines.' ),
		);
		foreach ( $faqs as $f ) : ?>
			<div class="faq-item">
				<button class="faq-q"><?php echo esc_html( $f[0] ); ?><span class="ic">+</span></button>
				<div class="faq-a"><?php echo esc_html( $f[1] ); ?></div>
			</div>
		<?php endforeach; ?>
	</div>
</section>

<?php get_template_part( 'template-parts/cta' ); ?>

<?php
get_footer();
