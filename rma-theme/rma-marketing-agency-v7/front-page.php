<?php
/**
 * Home page.
 *
 * @package rma
 */

get_header();

$rma_services = rma_services();
$rma_stages   = array(
	array( 'Strategy', 'Audience, offer, positioning, and campaign direction.', array( 'Audience map', 'Offer & positioning', 'Campaign brief' ) ),
	array( 'Creative', 'Messaging, visual concepts, content themes, and ad ideas.', array( 'Message architecture', 'Visual concepts', 'Content & ad ideas' ) ),
	array( 'Channels', 'Search, social, paid media, events, and website conversion.', array( 'Search & AI search', 'Social & paid', 'Events & website' ) ),
	array( 'Reporting', 'Readable dashboards, next-step decisions, and campaign reviews.', array( 'Readable dashboards', 'Channel notes', 'Next-step decisions' ) ),
);
?>

<main id="main">

	<section class="hero">
		<div class="hero-aurora" aria-hidden="true"><i></i><i></i><i></i></div>
		<div class="hero-grid-lines" aria-hidden="true"></div>

		<div class="hero-inner wrap">
			<div class="hero-copy">
				<p class="pill"><span class="pulse" aria-hidden="true"></span>Full-Service Marketing Agency</p>
				<h1 class="hero-title">
					<span class="line"><span>Strategy.</span></span>
					<span class="line"><span>Creativity.</span></span>
					<span class="line"><span><em>Real Growth.</em></span></span>
				</h1>
				<p class="lede">Full-service marketing for search, social media, campaigns, websites, branding, events, and reporting — planned as one system instead of eight disconnected vendors.</p>
				<div class="hero-actions">
					<a class="btn btn-glow" href="<?php echo rma_url( 'contact' ); ?>" data-magnetic>Let's Grow Your Business <?php echo rma_icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
					<a class="btn btn-ghost" href="<?php echo rma_url( 'services' ); ?>">See Our Work</a>
				</div>
			</div>

			<div class="orbit" aria-hidden="true">
				<div class="orbit-ring ring-1"></div>
				<div class="orbit-ring ring-2"></div>
				<div class="orbit-ring ring-3"></div>
				<div class="orbit-core">
					<?php echo rma_logo(); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				</div>
				<div class="orbit-track track-outer">
					<?php foreach ( array( 'seo', 'paid-media', 'social-media', 'web-design' ) as $i => $slug ) : ?>
						<span class="chip" style="--i:<?php echo (int) $i; ?>"><span><?php echo rma_icon( $slug, 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( $rma_services[ $slug ]['title'] ); ?></span></span>
					<?php endforeach; ?>
				</div>
				<div class="orbit-track track-inner">
					<?php foreach ( array( 'ai-search-optimization', 'branding', 'event-planning', 'analytics-reporting' ) as $i => $slug ) : ?>
						<span class="chip" style="--i:<?php echo (int) $i; ?>"><span><?php echo rma_icon( $slug, 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( $rma_services[ $slug ]['tag'] ); ?></span></span>
					<?php endforeach; ?>
				</div>
				<div class="pulse-card">
					<p class="pulse-card-label"><span class="dot"></span>Campaign pulse</p>
					<svg viewBox="0 0 200 56" preserveAspectRatio="none" class="spark">
						<defs><linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#b4cfe9" stop-opacity=".45"/><stop offset="1" stop-color="#b4cfe9" stop-opacity="0"/></linearGradient></defs>
						<path class="spark-area" d="M0 48 C20 44 30 40 45 41 S70 30 85 32 110 20 125 22 150 12 165 14 185 6 200 4 V56 H0Z" fill="url(#spark-fill)"/>
						<path class="spark-line" d="M0 48 C20 44 30 40 45 41 S70 30 85 32 110 20 125 22 150 12 165 14 185 6 200 4" fill="none" stroke="#b4cfe9" stroke-width="2"/>
					</svg>
					<p class="pulse-card-steps"><span>Plan</span><span>Create</span><span>Launch</span><span>Learn</span></p>
				</div>
			</div>
		</div>

		<div class="trust">
			<p class="trust-label">Trusted by ambitious brands worldwide</p>
			<div class="marquee" aria-label="growthly, Brightly, aventa, scaleup, LUMEN">
				<div class="marquee-track" aria-hidden="true">
					<?php for ( $rma_loop = 0; $rma_loop < 4; $rma_loop++ ) : ?>
						<span class="logo-a">growthly</span><span class="logo-b">Brightly</span><span class="logo-c">aventa</span><span class="logo-d">scaleup</span><span class="logo-e">LUMEN</span>
					<?php endfor; ?>
				</div>
			</div>
		</div>
	</section>

	<section class="statement wrap">
		<p class="eyebrow">Full-Service Marketing</p>
		<h2 class="statement-text" data-words>Strategy, creative, channels, and reporting under one roof.</h2>
		<div class="statement-foot">
			<p>RMA brings the moving pieces of modern marketing together: brand positioning, social media, SEO, paid media, website design, event campaigns, content planning, and analytics. One team plans them together, so every piece pushes the same way.</p>
			<dl class="facts">
				<div><dt>8</dt><dd>services</dd></div>
				<div><dt>1</dt><dd>plan</dd></div>
				<div><dt>1</dt><dd>reporting loop</dd></div>
			</dl>
		</div>
	</section>

	<section class="services wrap" id="services">
		<div class="section-head">
			<div>
				<p class="eyebrow">What we do</p>
				<h2>Eight services. <em>One</em> connected growth system.</h2>
			</div>
			<a class="link-arrow" href="<?php echo rma_url( 'services' ); ?>">All services <?php echo rma_icon( 'arrow-up-right', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
		</div>

		<div class="bento">
			<?php
			$rma_n = 0;
			foreach ( $rma_services as $slug => $service ) :
				++$rma_n;
				$rma_featured = 1 === $rma_n;
				?>
				<a class="card<?php echo $rma_featured ? ' card-featured' : ''; ?> reveal" href="<?php echo rma_url( $slug ); ?>" data-spotlight style="--d:<?php echo (int) $rma_n; ?>">
					<span class="card-top">
						<span class="card-icon"><?php echo rma_icon( $slug, $rma_featured ? 26 : 22 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
						<span class="card-num">0<?php echo (int) $rma_n; ?></span>
					</span>
					<?php if ( $rma_featured ) : ?>
						<span class="answer" aria-hidden="true">
							<span class="answer-q"><?php echo rma_icon( 'ai-search-optimization', 14 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>best marketing agency for a product launch</span>
							<span class="answer-a"><b>AI overview</b><span class="answer-lines"><i></i><i></i><i></i></span><span class="answer-cite">Cited source · your-brand.com</span></span>
						</span>
					<?php endif; ?>
					<span class="card-body">
						<span class="card-tag"><?php echo esc_html( $service['tag'] ); ?></span>
						<span class="card-title"><?php echo esc_html( $service['title'] ); ?></span>
						<span class="card-text"><?php echo esc_html( $service['summary'] ); ?></span>
					</span>
					<span class="card-go"><?php echo rma_icon( 'arrow-up-right', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
				</a>
			<?php endforeach; ?>
			<a class="card card-cta reveal" href="<?php echo rma_url( 'contact' ); ?>" style="--d:9">
				<span class="card-title">Not sure where to start?</span>
				<span class="card-text">Tell us the goal. We'll tell you which two or three of these move it first.</span>
				<span class="btn btn-small">Plan it with us <?php echo rma_icon( 'arrow', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
			</a>
		</div>
	</section>

	<section class="command" id="command-center">
		<div class="command-inner wrap">
			<div class="command-copy">
				<p class="eyebrow">Marketing Command Center</p>
				<h2>One operating view for campaigns, content, and channels.</h2>
				<p>Strategy turns into creative direction, creative feeds every channel, and reporting decides what happens next. Here is the loop every RMA engagement runs on.</p>
				<div class="stages" role="tablist" aria-label="Campaign engine stages" data-stages>
					<?php foreach ( $rma_stages as $i => $stage ) : ?>
						<button class="stage" role="tab" type="button" id="stage-tab-<?php echo (int) $i; ?>" aria-controls="stage-panel" aria-selected="<?php echo 0 === $i ? 'true' : 'false'; ?>" data-stage="<?php echo (int) $i; ?>">
							<span class="stage-num">0<?php echo (int) ( $i + 1 ); ?></span>
							<span class="stage-body"><b><?php echo esc_html( $stage[0] ); ?></b><small><?php echo esc_html( $stage[1] ); ?></small></span>
							<span class="stage-bar" aria-hidden="true"><i></i></span>
						</button>
					<?php endforeach; ?>
				</div>
			</div>

			<div class="engine" data-engine>
				<div class="engine-head">
					<span>Campaign Engine</span>
					<span class="engine-live"><i></i>Live</span>
				</div>
				<div class="engine-flow" aria-hidden="true">
					<span class="engine-wire"><i class="engine-wire-lit"></i></span>
					<?php foreach ( $rma_stages as $i => $stage ) : ?>
						<span class="node" data-node="<?php echo (int) $i; ?>"><i></i><small><?php echo esc_html( $stage[0] ); ?></small></span>
					<?php endforeach; ?>
				</div>
				<div class="engine-panel" id="stage-panel" role="tabpanel" aria-live="polite">
					<?php foreach ( $rma_stages as $i => $stage ) : ?>
						<div class="engine-out" data-out="<?php echo (int) $i; ?>" <?php echo 0 === $i ? '' : 'hidden'; ?>>
							<p class="engine-out-label">Output · <?php echo esc_html( $stage[0] ); ?></p>
							<ul>
								<?php foreach ( $stage[2] as $j => $item ) : ?>
									<li style="--j:<?php echo (int) $j; ?>"><span class="check" aria-hidden="true"></span><?php echo esc_html( $item ); ?></li>
								<?php endforeach; ?>
							</ul>
						</div>
					<?php endforeach; ?>
				</div>
			</div>
		</div>
	</section>

	<section class="split wrap">
		<div class="split-copy reveal">
			<p class="eyebrow">Social Media Studio</p>
			<h2>Content built for the places your audience already pays attention.</h2>
			<p>RMA plans social media around campaigns, proof, education, and community signals. The work can include content calendars, reels and short-form concepts, post templates, paid social creative, launch sequences, and platform-specific messaging.</p>
			<a class="link-arrow" href="<?php echo rma_url( 'social-media' ); ?>">View social media service <?php echo rma_icon( 'arrow-up-right', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
		</div>

		<div class="studio reveal" aria-hidden="true">
			<div class="cal">
				<div class="cal-head"><b>Content calendar</b><span>This month</span></div>
				<div class="cal-grid">
					<?php
					$rma_days = array( 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' );
					foreach ( $rma_days as $day ) {
						echo '<span class="cal-day">' . esc_html( $day ) . '</span>';
					}
					$rma_slots = array( 2 => 'reel', 4 => 'carousel', 7 => 'story', 9 => 'launch', 11 => 'reel', 13 => 'story', 15 => 'carousel', 16 => 'launch', 18 => 'reel', 20 => 'story', 23 => 'carousel', 25 => 'reel', 27 => 'launch' );
					for ( $d = 0; $d < 28; $d++ ) {
						echo '<span class="cal-cell">';
						if ( isset( $rma_slots[ $d ] ) ) {
							echo '<i class="tag-' . esc_attr( $rma_slots[ $d ] ) . '">' . esc_html( ucfirst( $rma_slots[ $d ] ) ) . '</i>';
						}
						echo '</span>';
					}
					?>
				</div>
			</div>
			<div class="phone">
				<div class="phone-notch"></div>
				<div class="post">
					<div class="post-head"><span class="avatar"></span><span><b>your.brand</b><small>Sponsored</small></span></div>
					<div class="post-media"><span>Launch<br>week.</span></div>
					<div class="post-actions"><i></i><i></i><i></i></div>
					<div class="post-lines"><i></i><i></i></div>
				</div>
			</div>
		</div>
	</section>

	<section class="split split-flip wrap">
		<div class="dash reveal" aria-hidden="true">
			<div class="dash-head">
				<div><b>Analytics Command Center</b><small>Traffic, leads, content, and next actions in one view</small></div>
				<span class="dash-badge">Sample report</span>
			</div>
			<div class="kpis">
				<div><small>Organic</small><b data-count="84" data-prefix="+" data-suffix="%">+84%</b><span class="bar" style="--v:.84"></span></div>
				<div><small>Paid ROAS</small><b data-count="3.8" data-decimals="1" data-suffix="x">3.8x</b><span class="bar" style="--v:.62"></span></div>
				<div><small>Social</small><b data-count="212" data-prefix="+" data-suffix="%">+212%</b><span class="bar" style="--v:.95"></span></div>
				<div><small>Leads</small><b data-count="147">147</b><span class="bar" style="--v:.7"></span></div>
			</div>
			<div class="chart">
				<svg viewBox="0 0 400 140" preserveAspectRatio="none">
					<g class="chart-grid"><path d="M0 35H400M0 70H400M0 105H400"/></g>
					<path class="chart-line a" d="M0 120 C40 110 60 100 90 96 S140 70 170 76 220 50 250 46 310 30 340 22 385 12 400 8"/>
					<path class="chart-line b" d="M0 126 C40 124 70 118 100 116 S150 104 180 106 230 92 260 94 320 82 350 80 390 72 400 70"/>
				</svg>
			</div>
			<div class="next-step"><span class="next-dot"></span><p><b>Next step</b> Move budget toward the audience that converts, and turn the top post into an ad.</p></div>
		</div>

		<div class="split-copy reveal">
			<p class="eyebrow">Reporting &amp; Analytics</p>
			<h2>Client reports that show what happened, what matters, and what to do next.</h2>
			<p>Reporting is presented as a decision tool, not a pile of numbers. Clients can see campaign movement, channel notes, content performance, website signals, and recommended next steps in a format that is easy to review.</p>
			<a class="link-arrow" href="<?php echo rma_url( 'analytics-reporting' ); ?>">View reporting service <?php echo rma_icon( 'arrow-up-right', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
		</div>
	</section>

	<section class="path wrap">
		<div class="section-head section-head-center reveal">
			<p class="eyebrow">Built Like An Agency System</p>
			<h2>Every channel has a job.<br><em>Every campaign has a path.</em></h2>
			<p>Strategy first, creative with purpose, channels working together, and reporting that guides what happens next.</p>
		</div>
		<ol class="path-steps">
			<?php foreach ( $rma_stages as $i => $stage ) : ?>
				<li class="reveal" style="--d:<?php echo (int) $i; ?>">
					<span class="path-num">0<?php echo (int) ( $i + 1 ); ?></span>
					<b><?php echo esc_html( $stage[0] ); ?></b>
					<p><?php echo esc_html( $stage[1] ); ?></p>
				</li>
			<?php endforeach; ?>
		</ol>
		<p class="path-loop reveal"><span aria-hidden="true">↺</span> Then again, smarter — each report sets the next plan.</p>
		<div class="center"><a class="link-arrow" href="<?php echo rma_url( 'services' ); ?>">Explore services <?php echo rma_icon( 'arrow-up-right', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a></div>
	</section>

</main>

<?php
get_footer();
