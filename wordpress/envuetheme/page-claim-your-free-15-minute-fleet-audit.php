<?php get_header(); ?>
<main id="main">

<section class="page-hero">
  <img class="page-hero-bg" src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&amp;fit=crop&amp;w=1920&amp;q=72" srcset="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&amp;fit=crop&amp;w=768&amp;q=72 768w, https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&amp;fit=crop&amp;w=1280&amp;q=72 1280w, https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&amp;fit=crop&amp;w=1920&amp;q=72 1920w, https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&amp;fit=crop&amp;w=2560&amp;q=72 2560w" sizes="100vw" alt="Analytics dashboard with charts on a dark laptop screen" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url(home_url("/")); ?>">Home</a> / <a href="<?php echo esc_url(home_url("/claim-your-free-15-minute-fleet-audit/")); ?>">Free Fleet Audit</a></nav>
    <span class="eyebrow eyebrow--light">Claim Your Free 15-Minute Fleet Audit</span>
    <h1>Stop Guessing. Start Saving.</h1>
    <p>Request your personalized 15-minute ROI Audit and discover exactly where your fleet is leaking revenue.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="#audit-form">Request My Audit <span>&rarr;</span></a>
      <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
    </div>
  </div>
</section>

<style>
.cfa-form-card{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:36px;}
</style>

<section class="section" id="audit-form"><div class="wrap">
  <div class="feature-split">
    <div class="reveal">
      <span class="eyebrow">Your 15-Minute ROI Audit</span>
      <h2>What you&rsquo;ll get in 15 minutes:</h2>
      <ul class="check-list">
        <li><strong>Fuel Waste Analysis:</strong> We&rsquo;ll identify idling and routing inefficiencies that could save you 7-10% on fuel.</li>
        <li><strong>Safety Risk Score:</strong> See how AI dash cams can lower your liability and accident-related costs by 30%.</li>
        <li><strong>Maintenance Roadmap:</strong> A plan to transition from reactive to predictive maintenance to maximize uptime.</li>
        <li><strong>Hardware Compatibility:</strong> A check of your current devices to see how they integrate with Geotab.</li>
      </ul>
    </div>
    <div class="cfa-form-card reveal" style="--d:1">
      <p style="margin-top:0;">Fill out the form below and one of our fleet experts will reach out to schedule your audit.</p>
      <?php echo do_shortcode('[wpforms id="2958" title="false"]'); ?>
    </div>
  </div>
</div></section>

</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">Free Fleet Audit</span><h2>Discover where your fleet is leaking revenue.</h2></div>
  <div><p>Request your personalized 15-minute ROI Audit and one of our fleet experts will reach out to schedule it.</p>
  <div class="hero-actions">
    <a class="button button-primary button-lg" href="#audit-form">Claim My Free Audit <span>&rarr;</span></a>
    <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
  </div></div>
</div></section>
<?php get_footer(); ?>
