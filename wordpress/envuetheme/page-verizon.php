<?php get_header(); ?>
<main id="main">

<section class="page-hero">
  <img class="page-hero-bg" src="https://envuetelematics.com/wp-content/uploads/2025/12/navigation-travel-and-technolo.jpg" alt="Fleet navigation and telematics technology with Verizon Connect" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="<?php echo esc_url(home_url("/")); ?>">Home</a> /
      <a href="<?php echo esc_url(home_url("/our-partners/")); ?>">Partners</a> /
      <a href="<?php echo esc_url(home_url("/verizon/")); ?>">Verizon Connect</a>
    </nav>
    <span class="eyebrow eyebrow--light">EnVue + Verizon Connect</span>
    <h1>A total fleet partner to move business forward.</h1>
    <p>Verizon Connect provides industry-leading fleet visibility, GPS tracking, and video intelligence. EnVue Telematics delivers the expertise, configuration, and ongoing support to help translate those capabilities into improved driver safety, lower operating costs, and sustainable ROI.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Get a Free Demo <span>&rarr;</span></a>
      <a class="button button-ghost button-lg" href="#verizon-contact">Contact Us</a>
    </div>
  </div>
</section>

<div class="partner-logo-block">
  <img src="https://envuetelematics.com/wp-content/uploads/2026/01/brand-logo-verizon.png" alt="Verizon official brand logo" loading="eager">
</div>

<style>
.vz-form-card{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:32px;box-shadow:0 12px 40px rgba(12,27,42,.06);}
.vz-form-card h3{margin:0 0 16px;font-size:1.35rem;color:var(--ink);}
.vz-table{width:100%;border-collapse:collapse;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;background:#fff;}
.vz-table th,.vz-table td{padding:16px 20px;text-align:left;border-bottom:1px solid var(--line);font-size:15.5px;}
.vz-table th{background:var(--brand);color:#fff;font-weight:700;width:50%;}
.vz-table td{color:var(--slate);}
.vz-table tr:last-child td{border-bottom:none;}
.vz-table td:first-child{border-right:1px solid var(--line);}
.vz-steps{list-style:none;counter-reset:vz;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin:2.5rem 0 0;padding:0;}
.vz-steps li{counter-increment:vz;background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:28px;}
.vz-steps li::before{content:counter(vz);display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:var(--brand-lt);color:var(--brand);font-weight:800;margin-bottom:14px;}
.vz-steps h3{font-size:1.1rem;margin:0 0 8px;color:var(--ink);}
.vz-steps p{margin:0;color:var(--slate);line-height:1.65;}
.vz-shots{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:2.5rem;}
.vz-shots img{width:100%;border-radius:var(--r-lg);border:1px solid var(--line);display:block;}
.vz-docs{grid-template-columns:repeat(4,1fr);}
@media(max-width:1024px){.vz-docs{grid-template-columns:repeat(2,1fr);}}
@media(max-width:860px){.vz-steps{grid-template-columns:1fr;}.vz-shots{grid-template-columns:1fr;}.vz-form-card{padding:22px;}}
@media(max-width:560px){.vz-docs{grid-template-columns:1fr;}}
</style>

<section class="section" id="verizon-contact"><div class="wrap">
  <div class="feature-split">
    <div class="reveal">
      <span class="eyebrow">About Verizon Connect</span>
      <h2>EnVue + Verizon Connect</h2>
      <p>Verizon Connect is a leading telematics and mobile resource management solution provider, serving a wide range of customer sizes and segments &ndash; from small businesses to Fortune 500 companies, including many local and federal government agencies. With over 2,000 employees from offices in 16 countries, our mission is to provide an easy-to-use, end-to-end solution that helps companies make more informed decisions and drive operational improvements across their business.</p>
      <p>You have many options when selecting connected vehicle technology &ndash; but choosing the right platform is only part of the equation. The difference comes from the service model and ongoing support behind the deployment.</p>
      <p>Verizon Connect provides industry-leading fleet visibility, GPS tracking, and video intelligence. EnVue Telematics delivers the expertise, configuration, and ongoing support to help translate those capabilities into improved driver safety, lower operating costs, and sustainable ROI.</p>
      <p>Together, they help private fleets move beyond data collection to measurable performance improvement.</p>
    </div>
    <div class="vz-form-card reveal" style="--d:1">
      <h3>Contact Us</h3>
      <?php echo do_shortcode('[wpforms id="3806" title="false"]'); ?>
    </div>
  </div>

  <div class="cta-strip" style="margin-top:3rem;">
    <div>
      <h3>Let&rsquo;s get started.</h3>
      <p>Contact one of our expert fleet advisors for a free demo and customized solution.</p>
    </div>
    <a class="button-white" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Get a Free Demo &rarr;</a>
  </div>
</div></section>

<section class="section section--soft"><div class="wrap">
  <div class="feature-split">
    <div class="feature-split-media"><img src="https://envuetelematics.com/wp-content/uploads/2026/01/Screenshot-2026-01-27-130106.jpg" alt="Interactive map showing real-time GPS fleet tracking and driver locations" loading="lazy"></div>
    <div class="reveal">
      <span class="eyebrow">Why EnVue + Verizon Connect</span>
      <h2>Why This Partnership Works</h2>
      <table class="vz-table">
        <thead><tr><th scope="col">Verizon Connect Enables</th><th scope="col">EnVue Delivers</th></tr></thead>
        <tbody>
          <tr><td>Fleet and driver visibility</td><td>Real-world configuration</td></tr>
          <tr><td>Telematics &amp; video data</td><td>Adoption and optimization</td></tr>
          <tr><td>Scalable platform</td><td>Measurable safety &amp; cost outcomes</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">Our Service Model</span>
    <h2 class="reveal" style="--d:1">Why This Partnership Works</h2>
  </div></div>
  <div class="feature-split">
    <div class="feature-split-media"><img src="https://envuetelematics.com/wp-content/uploads/2026/01/Screenshot-2026-01-27-123911.png" alt="Verizon Connect fleet management interface with customizable report scheduling" loading="lazy"></div>
    <div class="reveal">
      <h3>Service Model Built for Long-Term Support</h3>
      <p>Nearly two-thirds of EnVue&rsquo;s team is dedicated to onboarding, customer support, and ongoing optimization &ndash; so fleets get lasting value from Verizon Connect.</p>
      <h3 style="margin-top:1.5rem;">Consultative Partnership Beyond Go-Live</h3>
      <p>EnVue stays actively engaged after deployment &ndash; driving adoption, optimizing performance, and helping fleets realize ongoing value over time.</p>
    </div>
  </div>
</div></section>

<section class="section section--soft"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">Sustainable ROI</span>
    <h2 class="reveal" style="--d:1">How EnVue Delivers Sustainable ROI</h2>
  </div></div>
  <ol class="vz-steps reveal" style="--d:2">
    <li><h3>Reduce Risk Exposure</h3><p>Behavior-based insights that help to improve driver performance, reduce unsafe events, and lower overall risk.</p></li>
    <li><h3>Lower Cents-Per-Mile Costs</h3><p>Fuel, maintenance, and utilization optimization to drive meaningful operating savings.</p></li>
    <li><h3>Improve Daily Productivity</h3><p>Smarter routing, scheduling, and service execution to complete more work, more efficiently.</p></li>
  </ol>
  <div class="vz-shots reveal">
    <img src="https://envuetelematics.com/wp-content/uploads/2026/02/Screenshot-2026-02-04-115025.jpg" alt="Fleet manager dashboard showing vehicle health metrics and maintenance alerts" loading="lazy">
    <img src="https://envuetelematics.com/wp-content/uploads/2025/12/navigation-travel-and-technolo.jpg" alt="Unlock fleet efficiency: transform daily operations with telematics" loading="lazy">
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">Resources</span>
    <h2 class="reveal" style="--d:1">Downloadable Spec Sheets &amp; More</h2>
  </div></div>
  <div class="resources-grid vz-docs">
    <article class="resource-card reveal">
      <div class="resource-card-body">
        <span class="resource-category-tag">eBook</span>
        <h3>23 reports that can change your fleet business eBook</h3>
        <a class="resource-card-link" href="https://envuetelematics.com/wp-content/uploads/2026/01/23-reports-that-can-change-your-fleet-business-eBook.pdf" target="_blank" rel="noopener">Download PDF <span>&rarr;</span></a>
      </div>
    </article>
    <article class="resource-card reveal" style="--d:1">
      <div class="resource-card-body">
        <span class="resource-category-tag">Guide</span>
        <h3>8 Signs You&rsquo;re Ready for Vehicle Tracking</h3>
        <a class="resource-card-link" href="https://envuetelematics.com/wp-content/uploads/2026/01/8-Signs-Youre-Ready-for-Vehicle-Tracking.pdf" target="_blank" rel="noopener">Download PDF <span>&rarr;</span></a>
      </div>
    </article>
    <article class="resource-card reveal" style="--d:2">
      <div class="resource-card-body">
        <span class="resource-category-tag">Whitepaper</span>
        <h3>Fleet Safety Whitepaper</h3>
        <a class="resource-card-link" href="https://envuetelematics.com/wp-content/uploads/2026/01/Fleet-Safety-Whitepaper-1.pdf" target="_blank" rel="noopener">Download PDF <span>&rarr;</span></a>
      </div>
    </article>
    <article class="resource-card reveal" style="--d:3">
      <div class="resource-card-body">
        <span class="resource-category-tag">eBook</span>
        <h3>Improving driver retention with video-based coaching eBook</h3>
        <a class="resource-card-link" href="https://envuetelematics.com/wp-content/uploads/2026/01/Improving-driver-retention-with-video-based-coaching-eBook.pdf" target="_blank" rel="noopener">Download PDF <span>&rarr;</span></a>
      </div>
    </article>
  </div>
</div></section>

</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div>
    <span class="eyebrow eyebrow--light">Verizon Connect + EnVue</span>
    <h2>Let&rsquo;s get started.</h2>
  </div>
  <div>
    <p>Contact one of our expert fleet advisors for a free demo and customized solution.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Get a Free Demo <span>&rarr;</span></a>
      <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
    </div>
  </div>
</div></section>
<?php get_footer(); ?>
