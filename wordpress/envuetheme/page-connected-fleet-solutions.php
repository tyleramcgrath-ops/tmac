<?php get_header(); ?>
<main id="main">

<section class="page-hero">
  <img class="page-hero-bg" src="https://images.unsplash.com/photo-1772440223098-cc23f6f01209?auto=format&amp;fit=crop&amp;w=1920&amp;q=72" srcset="https://images.unsplash.com/photo-1772440223098-cc23f6f01209?auto=format&amp;fit=crop&amp;w=768&amp;q=72 768w, https://images.unsplash.com/photo-1772440223098-cc23f6f01209?auto=format&amp;fit=crop&amp;w=1280&amp;q=72 1280w, https://images.unsplash.com/photo-1772440223098-cc23f6f01209?auto=format&amp;fit=crop&amp;w=1920&amp;q=72 1920w, https://images.unsplash.com/photo-1772440223098-cc23f6f01209?auto=format&amp;fit=crop&amp;w=2560&amp;q=72 2560w" sizes="100vw" alt="Aerial view of parked vans and cars in rows on a lot" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url(home_url("/")); ?>">Home</a> / <a href="<?php echo esc_url(home_url("/connected-fleet-solutions/")); ?>">Connected Fleet Solutions</a></nav>
    <span class="eyebrow eyebrow--light">Connected Fleet Solutions</span>
    <h1>Your fleet can do more.</h1>
    <p>Bring video intelligence, collision detection, driver coaching and vehicle security together with Geotab and EnVue. We&rsquo;ll help you choose, implement and support the right solutions for your fleet.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="#fleet-options">Explore Your Options <span>&rarr;</span></a>
      <a class="button button-ghost button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Talk to a Fleet Specialist</a>
    </div>
  </div>
</section>

<style>
.cfs-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.25rem;margin-top:2.5rem;}
@media(max-width:1000px){.cfs-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){.cfs-grid{grid-template-columns:1fr;}}
.cfs-card{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:28px 24px;display:flex;flex-direction:column;gap:.75rem;}
.cfs-card-brand{font-size:.75rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--brand);}
.cfs-card h3{font-size:1.25rem;margin:0;color:var(--ink);}
.cfs-card p{margin:0;color:var(--slate);line-height:1.6;flex:1;}
.cfs-card a{font-weight:700;color:var(--brand);text-decoration:none;}
.cfs-card a:hover{text-decoration:underline;}
.cfs-help{background:var(--bg-soft);border:1px solid var(--line);border-radius:var(--r-lg);padding:40px;text-align:center;max-width:820px;margin:0 auto;}
.cfs-help p{color:var(--slate);margin:1rem auto 1.5rem;max-width:620px;}
.cfs-help .hero-actions{justify-content:center;}
</style>

<section class="section" id="fleet-options"><div class="wrap">
  <div class="section-head"><div>
    <span class="eyebrow reveal">Fleet Options</span>
    <h2 class="reveal" style="--d:1">Build the right solution for your fleet.</h2>
  </div><div class="reveal" style="--d:2">
    <p>Whether you want to reduce risk, improve driver performance, protect vehicles or gain better visibility across your operation, EnVue can help you identify the right next step.</p>
  </div></div>

  <div class="cfs-grid">
    <div class="cfs-card reveal">
      <span class="cfs-card-brand">Geotab GO Focus Plus</span>
      <h3>Video Intelligence</h3>
      <p>Gain greater visibility with AI-powered video intelligence and in-cab coaching.</p>
      <a href="<?php echo esc_url(home_url("/geotab-go-focus-plus/")); ?>">Explore Video Intelligence &rarr;</a>
    </div>
    <div class="cfs-card reveal" style="--d:1">
      <span class="cfs-card-brand">Bosch</span>
      <h3>Collision Detection</h3>
      <p>Detect collisions quickly and help accelerate emergency response when every second matters.</p>
      <a href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Explore Collision Detection &rarr;</a>
    </div>
    <div class="cfs-card reveal" style="--d:2">
      <span class="cfs-card-brand">Predictive Coach</span>
      <h3>Driver Coaching</h3>
      <p>Turn fleet data into personalized driver coaching that supports safer, more efficient habits.</p>
      <a href="<?php echo esc_url(home_url("/predictive-coach/")); ?>">Explore Driver Coaching &rarr;</a>
    </div>
    <div class="cfs-card reveal" style="--d:3">
      <span class="cfs-card-brand">MAGTEC</span>
      <h3>Vehicle Security</h3>
      <p>Add another layer of vehicle security with technology designed to help prevent unauthorized use.</p>
      <a href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Explore Vehicle Security &rarr;</a>
    </div>
  </div>
</div></section>

<section class="section section--soft"><div class="wrap">
  <div class="cfs-help reveal" style="background:#fff;">
    <span class="eyebrow">Need Guidance?</span>
    <h2>Not sure which solution fits?</h2>
    <p>Tell us what you want to improve, and an EnVue fleet specialist will help you evaluate the right options for your vehicles, drivers and operation.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Find My Fleet Solution <span>&rarr;</span></a>
    </div>
  </div>
</div></section>

</main>
<section class="final-cta final-cta--form" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">Connected Fleet Solutions</span><h2>Talk to a fleet specialist.</h2>
    <p>We&rsquo;ll help you choose, implement and support the right video intelligence, collision detection, driver coaching and vehicle security solutions for your Geotab-powered fleet.</p>
    <p class="demo-call">Prefer to talk? Call <a href="tel:8002011169">(800) 201-1169</a> &mdash; US-based fleet experts, 24/7.</p>
  </div>
  <div><?php echo envue_demo_form(); ?></div>
</div></section>
<?php get_footer(); ?>
