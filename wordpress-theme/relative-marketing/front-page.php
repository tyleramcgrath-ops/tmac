<?php
/**
 * Front page — the RMA homepage.
 *
 * @package rma
 */

get_header();
?>

<!-- HERO -->
<section class="hero">
	<div class="container hero-grid">
		<div class="hero-copy">
			<span class="hero-badge"><?php esc_html_e( 'Welcome to Relative Marketing Agency', 'rma' ); ?></span>
			<h1><?php echo wp_kses_post( __( "We don't do marketing.<br>We engineer <span class=\"text-blue\">growth.</span>", 'rma' ) ); ?></h1>
			<p class="lead"><?php esc_html_e( 'AI-powered strategies. Human creativity. Real results. Built for the next era of search.', 'rma' ); ?></p>
			<div class="hero-cta">
				<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Start Your Growth Plan', 'rma' ); ?></a>
				<a class="btn btn--ghost" href="#process"><span class="play"><?php echo rma_icon( 'play', 14 ); ?></span><?php esc_html_e( 'See How It Works', 'rma' ); ?></a>
			</div>
		</div>
		<div class="hero-visual">
			<div class="hero-photo"></div>
			<svg class="hero-chevron" viewBox="0 0 200 260" fill="none" aria-hidden="true">
				<path d="M10 10 L100 150 L190 10 L150 10 L100 90 L50 10 Z" fill="currentColor"/>
				<path d="M40 120 L100 215 L160 120 L130 120 L100 168 L70 120 Z" fill="currentColor" opacity="0.85"/>
			</svg>
		</div>
	</div>
</section>

<!-- LOGOS -->
<section class="logos">
	<div class="container">
		<div class="logos-row">
			<span class="logos-label"><?php esc_html_e( 'Trusted by innovative brands', 'rma' ); ?></span>
			<span class="logo-item"><?php echo rma_icon( 'spark', 18 ); ?>growthly</span>
			<span class="logo-item"><?php echo rma_icon( 'spark', 18 ); ?>Brightly</span>
			<span class="logo-item"><?php echo rma_icon( 'layers', 18 ); ?>aventa</span>
			<span class="logo-item"><?php echo rma_icon( 'gauge', 18 ); ?>scaleup</span>
			<span class="logo-item" style="letter-spacing:.3em;">LUMEN</span>
		</div>
	</div>
</section>

<!-- CORE SERVICES -->
<section class="section" id="services">
	<div class="container">
		<div class="sec-head">
			<div>
				<span class="eyebrow"><?php esc_html_e( 'Our Core Services', 'rma' ); ?></span>
				<h2><?php esc_html_e( 'Integrated marketing systems that drive real business results.', 'rma' ); ?></h2>
			</div>
			<a class="link-arrow" href="<?php echo esc_url( home_url( '/services/' ) ); ?>"><?php esc_html_e( 'Explore All Services', 'rma' ); ?><?php echo rma_icon( 'arrow', 18 ); ?></a>
		</div>
		<div class="services-grid">
			<?php
			$services = array(
				array( 'search',  'AI Search Optimization', 'Be visible in AI Overviews, ChatGPT, Perplexity, and every answer engine.' ),
				array( 'gauge',   'SEO',                    'Technical, on-page, and off-page SEO that drives sustainable growth.' ),
				array( 'send',    'Paid Media',             'Data-driven campaigns that maximize ROI across every channel.' ),
				array( 'monitor', 'Web Design',             'High-converting websites designed for performance and user experience.' ),
				array( 'shield',  'Branding',               'Strategic branding that builds trust and drives long-term value.' ),
				array( 'target',  'Automation & Analytics', 'Smart automation and real-time analytics for smarter decisions.' ),
			);
			foreach ( $services as $s ) : ?>
				<div class="service-item">
					<span class="svc-icon"><?php echo rma_icon( $s[0], 22 ); ?></span>
					<h3><?php echo esc_html( $s[1] ); ?></h3>
					<p><?php echo esc_html( $s[2] ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<!-- PROCESS -->
<section class="process" id="process">
	<div class="container process-inner">
		<div>
			<span class="eyebrow eyebrow--blue" style="color:rgba(255,255,255,.7)"><?php esc_html_e( 'Our Process', 'rma' ); ?></span>
			<h2><?php esc_html_e( 'A proven system. Measurable growth.', 'rma' ); ?></h2>
			<a class="link-arrow" href="<?php echo esc_url( home_url( '/services/' ) ); ?>"><?php esc_html_e( 'View Our Process', 'rma' ); ?><?php echo rma_icon( 'arrow', 18 ); ?></a>
		</div>
		<div class="steps">
			<?php
			$steps = array(
				array( '01', 'Discover',   'We audit, research, and identify the biggest opportunities.' ),
				array( '02', 'Strategize', 'We build a custom growth strategy backed by data and insights.' ),
				array( '03', 'Execute',    'We implement, optimize, and scale with precision.' ),
				array( '04', 'Optimize',   'We analyze, learn, and continuously improve performance.' ),
			);
			foreach ( $steps as $st ) : ?>
				<div class="step">
					<div class="num"><?php echo esc_html( $st[0] ); ?></div>
					<h4><?php echo esc_html( $st[1] ); ?></h4>
					<p><?php echo esc_html( $st[2] ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<!-- CASE STUDIES -->
<section class="section" id="case-studies">
	<div class="container">
		<div class="sec-head">
			<div>
				<span class="eyebrow"><?php esc_html_e( 'Featured Case Studies', 'rma' ); ?></span>
				<h2><?php esc_html_e( 'Real results from real partnerships.', 'rma' ); ?></h2>
				<a class="link-arrow" href="<?php echo esc_url( home_url( '/case-studies/' ) ); ?>"><?php esc_html_e( 'View All Case Studies', 'rma' ); ?><?php echo rma_icon( 'arrow', 18 ); ?></a>
			</div>
		</div>
		<div class="case-grid">
			<?php
			$cases = array(
				array( 'Ecommerce Brand', '312% increase in revenue in 6 months.' ),
				array( 'SaaS Company',    '184% more pipelines with AI search visibility.' ),
				array( 'Local Business',  '220% more leads in under 6 months.' ),
			);
			foreach ( $cases as $c ) : ?>
				<div class="case-card">
					<span class="tag"><?php echo esc_html( $c[0] ); ?></span>
					<h3><?php echo esc_html( $c[1] ); ?></h3>
					<a class="link-arrow" href="<?php echo esc_url( home_url( '/case-studies/' ) ); ?>"><?php esc_html_e( 'View Case Study', 'rma' ); ?><?php echo rma_icon( 'arrow', 16 ); ?></a>
					<div class="case-thumb"></div>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<!-- AI VISIBILITY -->
<section class="ai-vis section">
	<div class="container ai-vis-grid">
		<div>
			<span class="eyebrow" style="color:#5b8cff"><?php esc_html_e( 'AI Visibility', 'rma' ); ?></span>
			<h2><?php esc_html_e( 'Be visible where your customers and AI are looking.', 'rma' ); ?></h2>
			<p><?php esc_html_e( 'We optimize your presence across the leading AI platforms and search engines so you get mentioned, recommended, and chosen.', 'rma' ); ?></p>
			<a class="btn btn--primary" href="<?php echo esc_url( home_url( '/services/' ) ); ?>" style="margin-top:8px"><?php esc_html_e( 'Learn More', 'rma' ); ?><?php echo rma_icon( 'arrow', 16 ); ?></a>
		</div>
		<div class="orbit">
			<div class="ring r1"></div>
			<div class="ring r2"></div>
			<div class="ring r3"></div>
			<div class="core"><?php echo rma_brand_mark( true ); // phpcs:ignore ?></div>
			<div class="chip c-google"><span class="dot" style="background:#ea4335"></span> Google AI Overviews</div>
			<div class="chip c-chatgpt"><span class="dot" style="background:#10a37f"></span> ChatGPT</div>
			<div class="chip c-claude"><span class="dot" style="background:#d97757"></span> Claude</div>
			<div class="chip c-perplexity"><span class="dot" style="background:#20808d"></span> Perplexity</div>
			<div class="chip c-gemini"><span class="dot" style="background:#4285f4"></span> Gemini</div>
		</div>
	</div>
</section>

<!-- INSIGHTS -->
<section class="section" id="insights">
	<div class="container">
		<div class="sec-head">
			<div>
				<span class="eyebrow"><?php esc_html_e( 'Insights & Strategies', 'rma' ); ?></span>
				<h2><?php esc_html_e( 'Insights that drive growth.', 'rma' ); ?></h2>
			</div>
			<a class="link-arrow" href="<?php echo esc_url( home_url( '/blog/' ) ); ?>"><?php esc_html_e( 'View All Insights', 'rma' ); ?><?php echo rma_icon( 'arrow', 18 ); ?></a>
		</div>
		<div class="insights-grid">
			<?php
			$posts = new WP_Query( array( 'posts_per_page' => 3, 'ignore_sticky_posts' => true ) );
			if ( $posts->have_posts() ) :
				while ( $posts->have_posts() ) : $posts->the_post();
					$cat = get_the_category();
					?>
					<a class="post-card" href="<?php the_permalink(); ?>">
						<div class="thumb"><?php if ( has_post_thumbnail() ) { the_post_thumbnail( 'medium_large' ); } ?></div>
						<div class="pc-body">
							<div class="meta">
								<?php if ( ! empty( $cat ) ) : ?><span class="cat"><?php echo esc_html( $cat[0]->name ); ?></span><?php endif; ?>
								<span><?php echo esc_html( get_the_date() ); ?></span>
								<span>&middot; <?php echo esc_html( rma_reading_time() ); ?></span>
							</div>
							<h3><?php the_title(); ?></h3>
							<p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 18 ) ); ?></p>
							<span class="link-arrow"><?php esc_html_e( 'Read More', 'rma' ); ?><?php echo rma_icon( 'arrow', 16 ); ?></span>
						</div>
					</a>
					<?php
				endwhile;
				wp_reset_postdata();
			else :
				// Demo cards when no posts exist yet.
				$demo = array(
					array( 'AI Search', 'May 12, 2024', '6 min read', 'Why AI Visibility Is The New SEO', 'The way people search is changing. Here\'s how to stay ahead.' ),
					array( 'SEO', 'May 8, 2024', '7 min read', '10 AI Search Optimization Tactics That Actually Work', 'Actionable tactics to improve your visibility in AI Overviews, ChatGPT, and beyond.' ),
					array( 'Paid Media', 'May 5, 2024', '5 min read', 'How We Increased Organic Traffic by 347% for a SaaS Brand', 'A breakdown of the strategy, content, and technical improvements that drove massive growth.' ),
				);
				foreach ( $demo as $d ) : ?>
					<a class="post-card" href="<?php echo esc_url( home_url( '/blog/' ) ); ?>">
						<div class="thumb"></div>
						<div class="pc-body">
							<div class="meta"><span class="cat"><?php echo esc_html( $d[0] ); ?></span><span><?php echo esc_html( $d[1] ); ?></span><span>&middot; <?php echo esc_html( $d[2] ); ?></span></div>
							<h3><?php echo esc_html( $d[3] ); ?></h3>
							<p><?php echo esc_html( $d[4] ); ?></p>
							<span class="link-arrow"><?php esc_html_e( 'Read More', 'rma' ); ?><?php echo rma_icon( 'arrow', 16 ); ?></span>
						</div>
					</a>
				<?php endforeach;
			endif;
			?>
		</div>
	</div>
</section>

<!-- CTA BAND -->
<section class="section section--tight">
	<div class="container">
		<div class="cta-band">
			<div class="cta-left">
				<h2><?php esc_html_e( 'Ready to build your growth engine?', 'rma' ); ?></h2>
				<p><?php esc_html_e( "Let's create a data-driven marketing system that attracts, converts, and scales your business.", 'rma' ); ?></p>
				<div><a class="btn btn--light" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Schedule Strategy Call', 'rma' ); ?></a></div>
			</div>
			<div class="cta-right"><?php echo rma_brand_mark( true ); // phpcs:ignore ?></div>
		</div>
	</div>
</section>

<?php
get_footer();
