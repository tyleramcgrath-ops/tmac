<?php get_header(); ?>
<main id="main">

<section class="page-hero">
  <img class="page-hero-bg" src="https://envuetelematics.com/wp-content/uploads/2026/06/smarter-fleet-management-hd-scaled.jpg" alt="Fleet ROI discovery request" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url(home_url("/")); ?>">Home</a> / <a href="<?php echo esc_url(home_url("/fleet-audit-discovery-request/")); ?>">Fleet Audit Discovery Request</a></nav>
    <span class="eyebrow eyebrow--light">Fleet Audit Discovery Request</span>
    <h1>Fleet ROI Discovery</h1>
    <p>Your custom roadmap is 60 seconds away.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="#discovery-form">Start My Discovery <span>&rarr;</span></a>
      <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
    </div>
  </div>
</section>

<style>
.fad-form-card{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:40px;max-width:760px;margin:0 auto;box-shadow:0 18px 50px rgba(15,23,42,.08);}
.fad-quotes{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:2rem;}
@media(max-width:760px){.fad-quotes{grid-template-columns:1fr;}}
.fad-quotes .quote-card{margin:0;}
</style>

<section class="section" id="discovery-form"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">Interactive Discovery Session</span>
    <h2 class="reveal" style="--d:1">Tell us about your fleet.</h2>
    <p class="reveal" style="--d:2">Your custom roadmap is 60 seconds away.</p>
  </div></div>
  <div class="fad-form-card reveal" style="--d:2">
    <?php echo do_shortcode('[wpforms id="2958" title="false"]'); ?>
  </div>
</div></section>

<section class="section section--soft"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">What Fleet Leaders Say</span>
    <h2 class="reveal" style="--d:1">Trusted by 1,000+ Fleet Professionals Nationwide</h2>
  </div></div>
  <div class="fad-quotes">
    <figure class="quote-card reveal">
      <blockquote>&ldquo;The ROI discovery pinpointed thousands in fuel waste in under 15 minutes.&rdquo;</blockquote>
      <cite><strong>Fleet Director</strong></cite>
    </figure>
    <figure class="quote-card reveal" style="--d:1">
      <blockquote>&ldquo;Clean, interactive, and gave us a roadmap we actually used to save on insurance.&rdquo;</blockquote>
      <cite><strong>Safety Manager</strong></cite>
    </figure>
  </div>
</div></section>

</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">Fleet ROI Discovery</span><h2>Get your custom fleet roadmap.</h2></div>
  <div><p>Share a few details about your fleet and an EnVue fleet expert will follow up with a roadmap of your highest-impact savings opportunities.</p>
  <div class="hero-actions">
    <a class="button button-primary button-lg" href="#discovery-form">Start My Discovery <span>&rarr;</span></a>
    <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
  </div></div>
</div></section>
<?php get_footer(); ?>
