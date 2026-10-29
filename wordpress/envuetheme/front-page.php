<?php get_header(); ?>

<main id="main">

  <!-- ── HERO ─────────────────────────────────────────────────── -->
  <section class="hero" id="heroSlider" aria-label="EnVue Telematics highlights">
    <div class="hero-backgrounds" aria-hidden="true">
      <div class="hero-bg active">
        <img src="<?php echo get_template_directory_uri(); ?>/assets/images/hero-truck-sunset.webp" alt="Fleet truck on the highway at sunset" width="1672" height="941" loading="eager" fetchpriority="high">
      </div>
      <div class="hero-bg">
        <img src="<?php echo get_template_directory_uri(); ?>/assets/images/hero-network.webp" alt="Connected fleet network" width="1672" height="941" loading="lazy">
      </div>
      <div class="hero-bg">
        <img src="<?php echo get_template_directory_uri(); ?>/assets/images/hero-mixed-fleet.webp" alt="Mixed commercial fleet" width="1672" height="941" loading="lazy">
      </div>
    </div>
    <div class="hero-scrim" aria-hidden="true"></div>

    <div class="wrap hero-layout">
      <div class="hero-content">
        <div class="hero-slide active" data-slide="0">
          <span class="eyebrow eyebrow--light">Intelligence for every route</span>
          <h1>Every vehicle visible. <span>Every decision on time.</span></h1>
          <p>EnVue connects your fleet, your assets and your safety evidence through GPS tracking, AI dash cams and a team that deploys it with you — not a box shipped to your yard.</p>
        </div>
        <div class="hero-slide" data-slide="1" aria-hidden="true">
          <span class="eyebrow eyebrow--light">Command center</span>
          <h2 class="hero-h">Control the miles, <span>the risk and the margin.</span></h2>
          <p>Live telemetry from every vehicle turns the daily run into an operation you can measure: where the cost is, where the risk is, and what to do about both this week.</p>
        </div>
        <div class="hero-slide" data-slide="2" aria-hidden="true">
          <span class="eyebrow eyebrow--light">Local deployment</span>
          <h2 class="hero-h">Technology your team <span>actually uses.</span></h2>
          <p>From the first assessment through quarterly reviews, we stay with the rollout until dispatch, safety and maintenance are each working from the same picture.</p>
        </div>

        <div class="hero-actions">
          <a class="button button-primary button-lg" href="<?php echo esc_url(home_url('/get-in-touch/')); ?>">Get a Free Demo <span>→</span></a>
          <a class="button button-ghost button-lg" href="#platform">See the platform</a>
        </div>

        <div class="hero-controls" aria-label="Change highlighted slide">
          <button class="hero-arrow" id="heroPrevious" type="button" aria-label="Previous slide">←</button>
          <div class="hero-dots">
            <button class="hero-dot active" type="button" data-hero-go="0" aria-pressed="true" aria-label="Slide 1"></button>
            <button class="hero-dot" type="button" data-hero-go="1" aria-pressed="false" aria-label="Slide 2"></button>
            <button class="hero-dot" type="button" data-hero-go="2" aria-pressed="false" aria-label="Slide 3"></button>
          </div>
          <button class="hero-arrow" id="heroNext" type="button" aria-label="Next slide">→</button>
          <div class="hero-count" aria-live="polite"><strong id="heroCurrent">01</strong> / 03</div>
        </div>
      </div>
    </div>
    <div class="hero-fade" aria-hidden="true"></div>
  </section>

  <!-- ── PROOF NUMBERS ──────────────────────────────────────────── -->
  <section class="stat-float" aria-label="Fleet results at a glance">
    <div class="wrap">
      <div class="stat-band">
        <div><strong><span data-count="31">31</span>%</strong><span>Fewer reportable accidents</span></div>
        <div><strong><span data-count="7">7</span>%</strong><span>Fuel economy improvement</span></div>
        <div><strong><span data-count="21">21</span>%</strong><span>Fewer accidents per million miles</span></div>
        <div><strong><span data-count="300">300</span>+</strong><span>Software integrations</span></div>
      </div>
    </div>
  </section>

  <!-- ── CONNECTED OPERATIONS ───────────────────────────────────── -->
  <section class="section op-section">
    <div class="wrap">
      <div class="section-head section-head--center" style="margin-bottom:48px">
        <div>
          <span class="eyebrow">Connected Operations</span>
          <h2>One platform. A clearer, safer,<br>more profitable fleet.</h2>
          <p style="max-width:52ch; margin-inline:auto">Every vehicle visible. Every team aligned. GPS, cameras, diagnostics and driver data flowing into one operational picture.</p>
        </div>
      </div>

      <div class="op-diagram" id="opDiagram" role="img" aria-label="Data flows from Vehicle through GPS, AI Camera, Driver coaching, Maintenance, into the Operations Center">
        <div class="op-node" data-index="0">
          <div class="op-node-icon" aria-hidden="true">
            <div class="op-node-ring"></div>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <span class="op-node-label">Vehicle</span>
        </div>

        <div class="op-connector" aria-hidden="true">
          <span class="op-connector-dot"></span>
          <span class="op-connector-dot"></span>
          <span class="op-connector-dot"></span>
        </div>

        <div class="op-node" data-index="1">
          <div class="op-node-icon" aria-hidden="true">
            <div class="op-node-ring"></div>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <span class="op-node-label">GPS</span>
        </div>

        <div class="op-connector" aria-hidden="true">
          <span class="op-connector-dot"></span>
          <span class="op-connector-dot"></span>
          <span class="op-connector-dot"></span>
        </div>

        <div class="op-node" data-index="2">
          <div class="op-node-icon" aria-hidden="true">
            <div class="op-node-ring"></div>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
          <span class="op-node-label">AI Camera</span>
        </div>

        <div class="op-connector" aria-hidden="true">
          <span class="op-connector-dot"></span>
          <span class="op-connector-dot"></span>
          <span class="op-connector-dot"></span>
        </div>

        <div class="op-node" data-index="3">
          <div class="op-node-icon" aria-hidden="true">
            <div class="op-node-ring"></div>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span class="op-node-label">Driver</span>
        </div>

        <div class="op-connector" aria-hidden="true">
          <span class="op-connector-dot"></span>
          <span class="op-connector-dot"></span>
          <span class="op-connector-dot"></span>
        </div>

        <div class="op-node" data-index="4">
          <div class="op-node-icon" aria-hidden="true">
            <div class="op-node-ring"></div>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <span class="op-node-label">Maintenance</span>
        </div>

        <div class="op-connector" aria-hidden="true">
          <span class="op-connector-dot"></span>
          <span class="op-connector-dot"></span>
          <span class="op-connector-dot"></span>
        </div>

        <div class="op-node op-node--hub" data-index="5">
          <div class="op-node-icon" aria-hidden="true">
            <div class="op-node-ring"></div>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <span class="op-node-label">Operations</span>
        </div>
      </div>

      <div class="op-cta-row">
        <a class="button button-primary" href="<?php echo esc_url(home_url('/solutions/')); ?>">Explore How It Works <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>

  <!-- ── SOLUTIONS ──────────────────────────────────────────────── -->
  <section class="section solutions-overview" id="platform">
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="eyebrow">Solutions</span>
          <h2>Everything your fleet needs, on one platform.</h2>
        </div>
        <div>
          <p>GPS tracking, AI dash cams, asset visibility and fuel controls — all running on Geotab's open platform, deployed and supported by EnVue.</p>
          <a class="text-link" href="<?php echo esc_url(home_url('/solutions/')); ?>" style="margin-top:16px;display:inline-flex">Browse all solutions <span>→</span></a>
        </div>
      </div>

      <div class="solution-cards">
        <a class="solution-card sc--cam" href="<?php echo esc_url(home_url('/dash-cams/')); ?>">
          <div class="solution-card-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/></svg>
          </div>
          <h3>AI Dash Cams</h3>
          <p>Event-triggered video, driver coaching and instant liability protection for every vehicle in the fleet.</p>
          <span class="solution-card-link">Learn more <span>→</span></span>
        </a>

        <a class="solution-card sc--gps" href="<?php echo esc_url(home_url('/gps-tracking/')); ?>">
          <div class="solution-card-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <h3>GPS Tracking</h3>
          <p>Live location, trip history, geofencing and idle reports — every vehicle visible from one map.</p>
          <span class="solution-card-link">Learn more <span>→</span></span>
        </a>

        <a class="solution-card sc--asset" href="<?php echo esc_url(home_url('/equipment-management/')); ?>">
          <div class="solution-card-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
          </div>
          <h3>Equipment &amp; Assets</h3>
          <p>Powered and non-powered asset tracking — trailers, generators, tools — on the same platform as your trucks.</p>
          <span class="solution-card-link">Learn more <span>→</span></span>
        </a>

        <a class="solution-card sc--fuel" href="<?php echo esc_url(home_url('/fuel-management/')); ?>">
          <div class="solution-card-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V8l9-6 9 6v14"/><path d="M9 22V12h6v10"/></svg>
          </div>
          <h3>Fuel &amp; Maintenance</h3>
          <p>Fuel card reconciliation, idle cost tracking and predictive maintenance alerts before a truck goes down.</p>
          <span class="solution-card-link">Learn more <span>→</span></span>
        </a>
      </div>
    </div>
  </section>

  <!-- ── ENVUE DIFFERENCE ──────────────────────────────────────── -->
  <section class="section section--soft" id="envue-difference">
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="eyebrow">Safer Journeys. Informed Decisions.</span>
          <h2>The EnVue Telematics difference.</h2>
        </div>
        <div>
          <p>Our telematics solutions drive results:</p>
          <ul class="check-list" style="margin-top:14px">
            <li>Improve safety with dash cams, driver coaching, and customized reporting</li>
            <li>Boost productivity with driver tracking, optimized routes, and equipment optimization</li>
            <li>Optimize fuel and maintenance</li>
            <li>Check compliance boxes for HOS, DVIR, and IFTA</li>
            <li>Expand capabilities with hardware and software integrations</li>
            <li>Reduce your fleet&#8217;s carbon footprint</li>
          </ul>
        </div>
      </div>

      <div class="difference-grid">
        <div class="diff-card reveal" style="--d:0">
          <div class="diff-card-icon"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M8.6 12.2l2.4 2.4 4.6-4.8"/></svg></div>
          <h3>Safety</h3>
          <ul>
            <li>Protect your drivers and vehicles.</li>
            <li>Reduce accident-related costs.</li>
            <li>Detect distracted driving.</li>
            <li>Reward star performers.</li>
            <li>Lower liability.</li>
          </ul>
          <a class="text-link" href="<?php echo esc_url(home_url('/safety/')); ?>" style="margin-top:16px;display:inline-flex">Explore safety <span>&rarr;</span></a>
        </div>
        <div class="diff-card reveal" style="--d:1">
          <div class="diff-card-icon"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 16.5a8 8 0 1 1 15 0"/><path d="M12 12.5l4-4"/><circle cx="12" cy="13" r="1.4" fill="currentColor"/><path d="M3.5 20h17"/></svg></div>
          <h3>Productivity</h3>
          <ul>
            <li>Get real-time visibility.</li>
            <li>Plan and optimize routes.</li>
            <li>Dynamically dispatch technicians to new jobs.</li>
            <li>Access trip summary reports.</li>
            <li>Increase profitability.</li>
          </ul>
          <a class="text-link" href="<?php echo esc_url(home_url('/productivity/')); ?>" style="margin-top:16px;display:inline-flex">Explore productivity <span>&rarr;</span></a>
        </div>
        <div class="diff-card reveal" style="--d:2">
          <div class="diff-card-icon"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3.5 20h17"/><path d="M5 16l4.5-5 3.5 3 6-7"/><path d="M14.5 7H19v4.5"/></svg></div>
          <h3>Optimization</h3>
          <ul>
            <li>Lower operating costs.</li>
            <li>Reduce idling and other fuel waste.</li>
            <li>Ensure preventive maintenance compliance.</li>
            <li>Increase uptime.</li>
            <li>Triage diagnostic alerts.</li>
          </ul>
          <a class="text-link" href="<?php echo esc_url(home_url('/optimization/')); ?>" style="margin-top:16px;display:inline-flex">Explore optimization <span>&rarr;</span></a>
        </div>
        <div class="diff-card reveal" style="--d:0">
          <div class="diff-card-icon"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 19c0-8 5.5-13 15-14-1 9.5-6 15-14 15"/><path d="M5 19c3-4 6-6.5 9.5-8.5"/></svg></div>
          <h3>Sustainability</h3>
          <ul>
            <li>Reduce carbon footprint.</li>
            <li>Identify ways to lower emissions.</li>
            <li>Plan EV adoption.</li>
            <li>Receive data insights.</li>
            <li>Better manage recycling initiatives.</li>
          </ul>
          <a class="text-link" href="<?php echo esc_url(home_url('/sustainability/')); ?>" style="margin-top:16px;display:inline-flex">Explore sustainability <span>&rarr;</span></a>
        </div>
        <div class="diff-card reveal" style="--d:1">
          <div class="diff-card-icon"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="M8.8 12.8l2.2 2.2 4.2-4.4"/></svg></div>
          <h3>Compliance</h3>
          <ul>
            <li>Follow U.S. DOT, FMCSA, and FDA rules.</li>
            <li>Automate reporting of driver hours.</li>
            <li>Be ready for roadside inspections.</li>
            <li>Track state fuel taxes for reporting.</li>
            <li>Meet cold-chain custody requirements.</li>
          </ul>
          <a class="text-link" href="<?php echo esc_url(home_url('/compliance/')); ?>" style="margin-top:16px;display:inline-flex">Explore compliance <span>&rarr;</span></a>
        </div>
        <div class="diff-card reveal" style="--d:2">
          <div class="diff-card-icon"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><path d="M17 14v6M14 17h6"/></svg></div>
          <h3>Expandability</h3>
          <ul>
            <li>Utilize an advanced, secure device.</li>
            <li>Access 300+ software add-ons.</li>
            <li>Add seamlessly integrated solutions.</li>
            <li>Eliminate data siloes.</li>
            <li>Receive custom reporting.</li>
          </ul>
          <a class="text-link" href="<?php echo esc_url(home_url('/expandability/')); ?>" style="margin-top:16px;display:inline-flex">Explore expandability <span>&rarr;</span></a>
        </div>
      </div>
    </div>
  </section>

  <!-- ── VIDEO DEMO ──────────────────────────────────────────────── -->
  <section class="video-section">
    <div class="wrap">
      <div class="section-head section-head--center" style="margin-bottom:40px">
        <div>
          <span class="eyebrow eyebrow--light">See it in action</span>
          <h2>Watch EnVue Telematics in action.</h2>
          <p>A real look at how our platform helps fleet operators stay connected, reduce costs and keep drivers safer every day.</p>
        </div>
      </div>
      <div class="video-embed-wrap reveal">
        <iframe
          src="https://www.youtube.com/embed/vaH6A1NrQd0"
          title="EnVue Telematics — fleet management platform overview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy">
        </iframe>
      </div>
    </div>
  </section>

  <!-- ── GEOTAB + INNOVATION AWARD ─────────────────────────────── -->
  <section class="geotab-horizontal" id="geotab-platform">
    <div class="geotab-h-inner">

      <!-- LEFT: Navy / Geotab platform side -->
      <div class="geotab-h-left reveal">
        <div class="geotab-h-top">
          <span class="geotab-powered-label">Powered by the world&#8217;s leading fleet platform</span>
          <div class="geotab-wordmark">GEOTAB<sup class="geotab-reg">&reg;</sup></div>
          <p class="geotab-tagline">A trusted foundation. A stronger fleet.</p>
          <p class="geotab-copy-body">EnVue is an authorized Geotab reseller, combining the world&#8217;s most deployed fleet telematics platform with local expertise, dedicated implementation, and 24/7 US&#8209;based support.</p>
        </div>
        <div class="geotab-h-stats">
          <div class="geotab-h-stat">
            <div class="geotab-h-stat-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.2"/><ellipse cx="8" cy="8" rx="3.5" ry="6.5" stroke="currentColor" stroke-width="1.2"/><line x1="1.5" y1="6" x2="14.5" y2="6" stroke="currentColor" stroke-width="1.2"/><line x1="1.5" y1="10" x2="14.5" y2="10" stroke="currentColor" stroke-width="1.2"/></svg>
            </div>
            <strong>50K+</strong>
            <span>Fleets Worldwide</span>
          </div>
          <div class="geotab-h-stat-div" aria-hidden="true"></div>
          <div class="geotab-h-stat">
            <div class="geotab-h-stat-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="4.5" width="5" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="9.5" y="2.5" width="5" height="11" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 8h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            </div>
            <strong>300+</strong>
            <span>Integrations</span>
          </div>
          <div class="geotab-h-stat-div" aria-hidden="true"></div>
          <div class="geotab-h-stat">
            <div class="geotab-h-stat-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 10l3.5-4 2.5 2.5 2.5-4L14 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="14" cy="4" r="1.5" fill="currentColor"/></svg>
            </div>
            <strong>4.7B+</strong>
            <span>Data Records Daily</span>
          </div>
        </div>
      </div>

      <!-- RIGHT: White / Award side -->
      <div class="geotab-h-right reveal" style="--d:1">
        <div class="geotab-trophy-wrap">
          <img
            src="https://envuetelematics.com/wp-content/uploads/2024/12/Award-Winning-Geotab.jpg"
            alt="Geotab Innovation Award — presented to EnVue Telematics"
            loading="lazy"
            class="geotab-trophy-img">
        </div>
        <div class="geotab-award-copy">
          <span class="eyebrow">Recognized for Innovation</span>
          <h2 class="geotab-award-heading">Geotab Innovation Award</h2>
          <p>EnVue Telematics received a Geotab Innovation Award in the Small Business Partner category at Geotab Connect in Orlando, Florida. The Innovation Awards, announced by Colin Sutherland, Geotab&#8217;s Chief Customer Officer, were given to nine partners for their innovative performance in various categories.</p>
          <a class="button button-outline" href="<?php echo esc_url(home_url('/powered-by-geotab/')); ?>">Learn More About Our Partnership &rarr;</a>
        </div>
      </div>

    </div>
  </section>

  <!-- ── GEOTAB ELITE BADGES ────────────────────────────────────── -->
  <style>
    .fp-badges { padding: 48px 0 56px; }
    .fp-badges .section-head { margin-bottom: 28px; }
    .fp-badge-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px 32px; }
    .fp-badge-row img { width: clamp(150px, 15vw, 205px); height: auto; filter: drop-shadow(0 10px 18px rgba(12,27,42,0.14)); transition: transform 240ms ease; }
    .fp-badge-row img:hover { transform: translateY(-4px) scale(1.03); }
    @media (max-width: 600px) { .fp-badge-row { gap: 18px 14px; } .fp-badge-row img { width: calc(50% - 10px); max-width: 170px; } }
  </style>
  <section class="fp-badges" aria-label="Geotab Elite Specialized Partner recognition">
    <div class="wrap">
      <div class="section-head section-head--center">
        <div>
          <span class="eyebrow">Geotab Elite Specialized Partner</span>
          <h2>Specialized across the fleets we serve.</h2>
        </div>
      </div>
      <div class="fp-badge-row reveal">
        <img width="240" height="300" src="https://envuetelematics.com/wp-content/uploads/2026/06/geotab-elite-specialized-partner-768x960.png" srcset="https://envuetelematics.com/wp-content/uploads/2026/06/geotab-elite-specialized-partner-240x300.png 240w, https://envuetelematics.com/wp-content/uploads/2026/06/geotab-elite-specialized-partner-768x960.png 768w" sizes="(max-width: 600px) 45vw, 205px" alt="Geotab Elite Specialized Partner badge" loading="lazy">
        <img width="240" height="300" src="https://envuetelematics.com/wp-content/uploads/2026/06/geotab-rental-leasing-partner-768x960.png" srcset="https://envuetelematics.com/wp-content/uploads/2026/06/geotab-rental-leasing-partner-240x300.png 240w, https://envuetelematics.com/wp-content/uploads/2026/06/geotab-rental-leasing-partner-768x960.png 768w" sizes="(max-width: 600px) 45vw, 205px" alt="Geotab 2026 Elite Specialized Partner badge for Rental &amp; Leasing" loading="lazy">
        <img width="240" height="300" src="https://envuetelematics.com/wp-content/uploads/2026/06/geotab-transportation-logistics-partner-768x960.png" srcset="https://envuetelematics.com/wp-content/uploads/2026/06/geotab-transportation-logistics-partner-240x300.png 240w, https://envuetelematics.com/wp-content/uploads/2026/06/geotab-transportation-logistics-partner-768x960.png 768w" sizes="(max-width: 600px) 45vw, 205px" alt="Geotab Elite Specialized Partner badge for Transportation &amp; Logistics" loading="lazy">
        <img width="240" height="300" src="https://envuetelematics.com/wp-content/uploads/2026/06/geotab-field-service-partner-768x960.png" srcset="https://envuetelematics.com/wp-content/uploads/2026/06/geotab-field-service-partner-240x300.png 240w, https://envuetelematics.com/wp-content/uploads/2026/06/geotab-field-service-partner-768x960.png 768w" sizes="(max-width: 600px) 45vw, 205px" alt="Geotab Elite Specialized Partner badge for Field Service" loading="lazy">
        <img width="240" height="300" src="https://envuetelematics.com/wp-content/uploads/2026/06/geotab-vocational-partner-768x960.png" srcset="https://envuetelematics.com/wp-content/uploads/2026/06/geotab-vocational-partner-240x300.png 240w, https://envuetelematics.com/wp-content/uploads/2026/06/geotab-vocational-partner-768x960.png 768w" sizes="(max-width: 600px) 45vw, 205px" alt="Geotab Elite Specialized Partner badge for Vocational fleets" loading="lazy">
      </div>
    </div>
  </section>

  <!-- ── ROI + SAFETY TOOLS ─────────────────────────────────────── -->
  <section class="section section--soft">
    <div class="wrap tools-grid">
      <div class="tool-card reveal">
        <span class="eyebrow">Savings estimator</span>
        <h2>Estimate what a connected fleet returns.</h2>

        <label for="fleetRange">Vehicles in your fleet <output id="fleetOutput" for="fleetRange">50</output></label>
        <input id="fleetRange" type="range" min="10" max="500" step="10" value="50">

        <label for="fuelInput">Monthly fuel spend per vehicle</label>
        <div class="money-field">
          <span>$</span>
          <input id="fuelInput" type="number" min="100" step="50" value="1200" aria-label="Monthly fuel spend per vehicle in dollars">
          <small>USD</small>
        </div>

        <div class="saving-result">
          <small>Estimated annual savings</small>
          <strong id="savingTotal">$86,400</strong>
        </div>

        <div class="roi-breakdown">
          <div class="roi-row">
            <span>Fuel &amp; idle reduction</span>
            <strong id="roiFuel">$36,000</strong>
          </div>
          <div class="roi-row">
            <span>Maintenance savings</span>
            <strong id="roiMaint">$28,800</strong>
          </div>
          <div class="roi-row">
            <span>Productivity gains</span>
            <strong id="roiProd">$21,600</strong>
          </div>
        </div>

        <p class="disclaimer">*Illustrative only, based on a 12% operating reduction from idle control, routing and maintenance alerts. Your actual result depends on your routes, drivers and baseline.</p>
      </div>

      <div class="tool-card reveal" style="--d:1">
        <span class="eyebrow">Video safety</span>
        <h2>From alert to context in seconds.</h2>
        <div class="video-card">
          <div class="video-feed">
            <img src="<?php echo get_template_directory_uri(); ?>/assets/images/truck-driver.jpg" alt="Dash camera view of a night highway" loading="lazy">
            <span class="record">● REC</span>
            <span class="event" id="safetyEvent">Normal driving</span>
          </div>
          <div class="event-actions">
            <button type="button" class="active" data-event="safe">Normal route</button>
            <button type="button" data-event="brake">Hard brake</button>
            <button type="button" data-event="distracted">Distraction</button>
          </div>
          <p class="coaching" id="coachingMessage">No events. Following distance, speed and lane position are all inside policy — nothing reaches a reviewer.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ── INDUSTRIES ─────────────────────────────────────────────── -->
  <section class="section section--soft">
    <div class="wrap">
      <div class="section-head section-head--compact">
        <div>
          <span class="eyebrow">Industries</span>
          <h2>Built for fleets that keep America moving.</h2>
          <p style="max-width:60ch;margin-top:12px">Optimize your fleet with our customized telematics solutions, from world-class GPS fleet tracking to AI dash cams and advanced analytics. Our team will customize a solution based on your individual requirements.</p>
        </div>
        <a class="text-link" href="<?php echo esc_url(home_url('/industries/')); ?>">All industries <span>→</span></a>
      </div>

      <div class="sector-cards">
        <a href="<?php echo esc_url(home_url('/construction/')); ?>">
          <img src="https://envuetelematics.com/wp-content/uploads/2024/12/construction.jpg" alt="Telematics solutions for construction fleets" loading="lazy">
          <span>01</span>
          <h3>Construction &amp; Heavy Equipment</h3>
          <p>Track every machine across sprawling job sites. Stop theft, cut idle, stay on schedule.</p>
        </a>
        <a href="<?php echo esc_url(home_url('/trucking-transportation/')); ?>">
          <img src="https://envuetelematics.com/wp-content/uploads/2024/12/Trucking.jpg" alt="Telematics solutions for trucking and transportation fleets" loading="lazy">
          <span>02</span>
          <h3>Trucking &amp; Transportation</h3>
          <p>HOS automation, DOT compliance and video-based liability protection for every haul.</p>
        </a>
        <a href="<?php echo esc_url(home_url('/field-services/')); ?>">
          <img src="https://envuetelematics.com/wp-content/uploads/2024/12/Field.jpg" alt="Telematics solutions for field services fleets" loading="lazy">
          <span>03</span>
          <h3>Field Service Operations</h3>
          <p>Dynamic dispatching and technician accountability that turn calls into competitive edge.</p>
        </a>
        <a href="<?php echo esc_url(home_url('/oil-gas/')); ?>">
          <img src="https://envuetelematics.com/wp-content/uploads/2024/12/Oil.jpg" alt="Telematics solutions for oil and gas fleets" loading="lazy">
          <span>04</span>
          <h3>Oil &amp; Gas / Energy</h3>
          <p>Remote tracking, lone worker safety and regulatory compliance for high-stakes field ops.</p>
        </a>
        <a href="<?php echo esc_url(home_url('/leasing-rental/')); ?>">
          <img src="https://envuetelematics.com/wp-content/uploads/2024/12/leasing.jpg" alt="Telematics solutions for leasing and rental fleets" loading="lazy">
          <span>05</span>
          <h3>Leasing &amp; Rental</h3>
          <p>Protect every unit you hand over: location, utilization, mileage and condition data from rental to return.</p>
        </a>
        <a href="<?php echo esc_url(home_url('/government/')); ?>">
          <img src="<?php echo get_template_directory_uri(); ?>/assets/images/hero-mixed-fleet.webp" alt="Government and municipal fleet vehicles" loading="lazy">
          <span>06</span>
          <h3>Government &amp; Municipal</h3>
          <p>Public accountability dashboards and compliance automation for city and county fleets.</p>
        </a>
      </div>
    </div>
  </section>

  <!-- ── CUSTOMER PROOF ─────────────────────────────────────────── -->
  <section class="section stories-section">
    <div class="wrap">
      <div class="section-head section-head--compact">
        <div>
          <span class="eyebrow">Customer stories</span>
          <h2>What our customers are saying.</h2>
        </div>
        <a class="text-link" href="<?php echo esc_url(home_url('/results/')); ?>">See measurable results <span>→</span></a>
      </div>

      <div class="t-slider" data-slider>
        <div class="t-track" tabindex="0" role="region" aria-label="Customer testimonials">

        <div class="case-study case-study--featured">
          <span class="case-outcome-tag">Stolen Van Tracked Live</span>
          <div class="case-stat">Live GPS</div>
          <p class="case-sub">Police guided to a stolen company van in real time</p>
          <blockquote>&ldquo;We were watching this live on GPS and we informed the police. We were basically telling the police which way [the thief] was turning, where he was going, how fast he was going, what road he was taking, everything.&rdquo;</blockquote>
          <div class="case-footer">
            <div class="story-avatar">DS</div>
            <div>
              <strong>Don Siegel</strong>
              <span>Director of Transportation · Cooper Electric Supply Co.</span>
            </div>
          </div>
          <a class="case-link" href="<?php echo esc_url(home_url('/customer-success-stories/')); ?>">More customer stories <span>→</span></a>
        </div>

        <div class="case-study">
          <span class="case-outcome-tag">Engine Health Reporting</span>
          <div class="case-stat">Fault codes</div>
          <p class="case-sub">Granular diagnostic data handed straight to the repair shop</p>
          <blockquote>&ldquo;The engine health reports are first class. When our vehicles need repairs, we are able to instruct the dealership or repair facility of the fault codes and necessary repairs. They are usually shocked that we can extract that type of granular data from our telematics systems.&rdquo;</blockquote>
          <div class="case-footer">
            <div class="story-avatar">TF</div>
            <div>
              <strong>Thomas J Fenelon Jr.</strong>
              <span>Retired Co-founder · AGL Welding Supply Co.</span>
            </div>
          </div>
          <a class="case-link" href="<?php echo esc_url(home_url('/customer-success-stories/')); ?>">More customer stories <span>→</span></a>
        </div>

        <div class="case-study">
          <span class="case-outcome-tag">Hardware + Support Partnership</span>
          <div class="case-stat">End-to-end</div>
          <p class="case-sub">Hardware and hands-on support for the technology side of the business</p>
          <blockquote>&ldquo;At B-4 Transport, we had an unfulfilled need in the transportation technology side of our business. EnVue provided us with everything we needed from a hardware perspective and went above and beyond to work with us from a support side.&rdquo;</blockquote>
          <div class="case-footer">
            <div class="story-avatar">BB</div>
            <div>
              <strong>Brian Beamer</strong>
              <span>Retired President · B-4 Transport Company, Inc.</span>
            </div>
          </div>
          <a class="case-link" href="<?php echo esc_url(home_url('/customer-success-stories/')); ?>">More customer stories <span>→</span></a>
        </div>
        <div class="case-study case-study--quote">
          <blockquote>&ldquo;I would recommend EnVue to any fleet manager or business owner. They really get it.&rdquo;</blockquote>
          <div class="case-footer">
            <div class="story-avatar">JM</div>
            <div>
              <strong>James Mode</strong>
              <span>Director, Environmental, Health, and Safety · Nova Compression</span>
            </div>
          </div>
        </div>
        <div class="case-study case-study--quote">
          <blockquote>&ldquo;EnVue&rsquo;s program has revolutionized the way we do business. The dash cams alone have saved us thousands of dollars and the customer support is second to none.&rdquo;</blockquote>
          <div class="case-footer">
            <div class="story-avatar">CE</div>
            <div>
              <strong>Cline E. Everhart</strong>
              <span>President and Owner · Everhart Transportation Inc.</span>
            </div>
          </div>
        </div>
        <div class="case-study case-study--quote">
          <blockquote>&ldquo;Rhianna and James have been working with me on set up. They are both extremely helpful and don&rsquo;t waste any time getting the job done. I have to say, you and your team are off to a good start showing great support. Thank you for everything.&rdquo;</blockquote>
          <div class="case-footer">
            <div class="story-avatar">JM</div>
            <div>
              <strong>John McCall</strong>
              <span>Industrial Products Operations Manager · D&amp;W Diesel</span>
            </div>
          </div>
        </div>
        <div class="case-study case-study--quote">
          <blockquote>&ldquo;I just wanted to thank you and your team at EnVue Telematics for all the help with getting telematics units installed in A-Max&rsquo;s fleet. The GO9 units have been reliable and working with your company has been nothing short of a pleasure. Samantha was always helpful with any updates that were needed and we at A-Max look forward to continuing to work with EnVue in the future.&rdquo;</blockquote>
          <div class="case-footer">
            <div class="story-avatar">JC</div>
            <div>
              <strong>Jared Cortez</strong>
              <span>A-MAX Insurance Services, Inc.</span>
            </div>
          </div>
        </div>
        <div class="case-study case-study--quote">
          <blockquote>&ldquo;Please know the great service doesn&rsquo;t go unnoticed and is greatly appreciated!&rdquo;</blockquote>
          <div class="case-footer">
            <div class="story-avatar">CW</div>
            <div>
              <strong>Crista Wrenn</strong>
              <span>Accounting &amp; Operations · Morehead Pools</span>
            </div>
          </div>
        </div>
        </div>
        <div class="t-controls">
          <button class="t-btn t-prev" type="button" aria-label="Previous testimonials">&larr;</button>
          <div class="t-dots" aria-hidden="true"></div>
          <button class="t-btn t-next" type="button" aria-label="Next testimonials">&rarr;</button>
        </div>
      </div>
    </div>
  </section>

  <!-- ── TECHNOLOGY PARTNERS ────────────────────────────────────── -->
  <section class="section section--soft partners-section">
    <div class="wrap">
      <div class="section-head section-head--center">
        <div>
          <span class="eyebrow reveal">Technology partners</span>
          <h2 class="reveal" style="--d:1">Works with the tools your fleet already runs.</h2>
          <p class="reveal" style="--d:2">EnVue integrates with leading safety, routing, fuel and fleet management platforms — so you don't replace what's working, you make it smarter.</p>
        </div>
      </div>

      <div class="partner-logo-grid reveal" style="--d:3">
        <div class="partner-logo-tile">
          <span class="partner-logo-name">Geotab</span>
          <small>Fleet Platform</small>
        </div>
        <div class="partner-logo-tile">
          <span class="partner-logo-name">Lytx</span>
          <small>Video Safety</small>
        </div>
        <div class="partner-logo-tile">
          <span class="partner-logo-name">Netradyne</span>
          <small>AI Cameras</small>
        </div>
        <div class="partner-logo-tile">
          <span class="partner-logo-name">Mobileye</span>
          <small>ADAS Safety</small>
        </div>
        <div class="partner-logo-tile">
          <span class="partner-logo-name">Fleetio</span>
          <small>Fleet Maintenance</small>
        </div>
        <div class="partner-logo-tile">
          <span class="partner-logo-name">Route4Me</span>
          <small>Route Optimization</small>
        </div>
        <div class="partner-logo-tile">
          <span class="partner-logo-name">Drivewyze</span>
          <small>Weigh Station Bypass</small>
        </div>
        <div class="partner-logo-tile">
          <span class="partner-logo-name">FleetCor</span>
          <small>Fuel Cards</small>
        </div>
        <div class="partner-logo-tile">
          <span class="partner-logo-name">Phillips Connect</span>
          <small>Trailer Tracking</small>
        </div>
        <div class="partner-logo-tile">
          <span class="partner-logo-name">Samsara</span>
          <small>Connected Operations</small>
        </div>
      </div>

      <div class="partner-explore-cta reveal" style="--d:4">
        <a class="button button-outline" href="<?php echo esc_url(home_url('/our-partners/')); ?>">+ 300 integrations &rarr; Explore the ecosystem</a>
      </div>
    </div>
  </section>

  <!-- ── RESOURCES & INSIGHTS ───────────────────────────────────── -->
  <section class="section news-section">
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="eyebrow reveal">Recent Articles</span>
          <h2 class="reveal" style="--d:1">Insights for fleet decision-makers.</h2>
        </div>
        <a class="text-link reveal" href="<?php echo esc_url(home_url('/blog-articles/')); ?>" style="align-self:flex-end;white-space:nowrap;--d:2">See all articles <span>→</span></a>
      </div>

      <?php
      $envue_recent = new WP_Query( [
        'post_type'           => 'post',
        'post_status'         => 'publish',
        'posts_per_page'      => 3,
        'ignore_sticky_posts' => true,
        'no_found_rows'       => true,
      ] );
      ?>
      <?php if ( $envue_recent->have_posts() ) : ?>
      <div class="news-grid">
        <?php $envue_i = 0; while ( $envue_recent->have_posts() ) : $envue_recent->the_post(); $envue_cats = get_the_category(); ?>
        <article class="news-card reveal" style="--d:<?php echo (int) $envue_i++; ?>">
          <div class="news-card-img">
            <?php if ( has_post_thumbnail() ) : ?>
              <?php the_post_thumbnail( 'medium_large', [ 'loading' => 'lazy', 'alt' => esc_attr( get_the_title() ) ] ); ?>
            <?php else : ?>
              <img src="<?php echo get_template_directory_uri(); ?>/assets/images/truck-driver.jpg" alt="<?php echo esc_attr( get_the_title() ); ?>" loading="lazy">
            <?php endif; ?>
          </div>
          <div class="news-card-body">
            <div class="news-card-meta">
              <?php if ( ! empty( $envue_cats ) ) : ?><span class="news-card-cat"><?php echo esc_html( $envue_cats[0]->name ); ?></span><?php endif; ?>
              <span class="news-card-date"><?php echo esc_html( get_the_date() ); ?></span>
            </div>
            <h3><?php the_title(); ?></h3>
            <p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 26 ) ); ?></p>
            <a class="news-card-link" href="<?php the_permalink(); ?>">Read article <span>→</span></a>
          </div>
        </article>
        <?php endwhile; wp_reset_postdata(); ?>
      </div>
      <?php endif; ?>
    </div>
  </section>

</main>

<!-- ── FINAL CTA ─────────────────────────────────────────────── -->
<section class="final-cta" id="demo">
  <div class="wrap final-grid">
    <div>
      <span class="eyebrow eyebrow--light">Next route</span>
      <h2>A more visible fleet starts with one conversation.</h2>
    </div>
    <div>
      <p>Talk to an EnVue specialist about tracking, cameras, assets and deployment for your operation. No scripted pitch — a working session about your fleet.</p>
      <div class="hero-actions">
        <a class="button button-primary button-lg" href="<?php echo esc_url(home_url('/get-in-touch/')); ?>">Talk to a specialist <span>→</span></a>
        <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
      </div>
    </div>
  </div>
</section>

<?php get_footer(); ?>
