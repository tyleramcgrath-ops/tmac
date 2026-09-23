<?php get_header(); ?>
<main id="main">
<style>
.gl-az{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 2.5rem;padding:14px;border:1px solid var(--line);border-radius:var(--r-lg);background:var(--bg-soft);}
.gl-az a,.gl-az span{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;font-weight:700;font-size:.9rem;text-decoration:none;}
.gl-az a{background:var(--brand);color:#fff;}
.gl-az a:hover{opacity:.88;}
.gl-az span{color:var(--slate);opacity:.45;}
.gl-letter{scroll-margin-top:110px;margin-bottom:2.5rem;}
.gl-letter h2{font-size:2rem;color:var(--brand);border-bottom:2px solid var(--line);padding-bottom:.5rem;margin-bottom:1.25rem;}
.gl-list{display:grid;gap:14px;margin:0;}
.gl-term{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:20px 24px;}
.gl-term dt{font-weight:800;color:var(--ink);font-size:1.1rem;margin-bottom:.35rem;}
.gl-term dd{margin:0;color:var(--slate);line-height:1.7;}
</style>

<section class="page-hero">
  <img class="page-hero-bg" src="https://images.unsplash.com/photo-1580584126903-c17d41830450?auto=format&amp;fit=crop&amp;w=1920&amp;q=72" srcset="https://images.unsplash.com/photo-1580584126903-c17d41830450?auto=format&amp;fit=crop&amp;w=768&amp;q=72 768w, https://images.unsplash.com/photo-1580584126903-c17d41830450?auto=format&amp;fit=crop&amp;w=1280&amp;q=72 1280w, https://images.unsplash.com/photo-1580584126903-c17d41830450?auto=format&amp;fit=crop&amp;w=1920&amp;q=72 1920w, https://images.unsplash.com/photo-1580584126903-c17d41830450?auto=format&amp;fit=crop&amp;w=2560&amp;q=72 2560w" sizes="100vw" alt="Red circuit board traces and solder points" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="<?php echo esc_url(home_url("/")); ?>">Home</a> / <a href="<?php echo esc_url(home_url("/resources/")); ?>">Resources</a></nav>
    <span class="eyebrow eyebrow--light">Glossary</span>
    <h1>Fleet Telematics Glossary</h1>
    <p>Welcome to the EnVue Telematics Glossary. This living document defines the most critical terms in the modern fleet management industry.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/claim-your-free-15-minute-fleet-audit/")); ?>">Book a Free Demo Now <span>&rarr;</span></a>
      <a class="button button-ghost button-lg" href="<?php echo esc_url(home_url("/faqs/")); ?>">Fleet FAQs</a>
    </div>
  </div>
</section>

<section class="section"><div class="wrap">
  <div class="cta-strip reveal" style="margin:0 0 3rem;">
    <div>
      <h3>Get Your Free Fleet ROI Audit</h3>
      <p>Book a free demo and see where your fleet can recover cost, time, and risk.</p>
    </div>
    <a class="button-white" href="<?php echo esc_url(home_url("/claim-your-free-15-minute-fleet-audit/")); ?>">Book a Free Demo Now &rarr;</a>
  </div>

  <?php
  // Glossary terms, grouped by letter. Add new terms here as the live glossary grows.
  $glossary = [
      'A' => [
          'AI Dash Cam' => 'A vehicle camera that uses onboard machine learning. Learn more about <a class="text-link" href="' . esc_url(home_url('/dash-cams/')) . '">AI Dash Cam Solutions</a>.',
          'Azuga'       => 'A full-stack telematics provider. See our <a class="text-link" href="' . esc_url(home_url('/azuga/')) . '">Azuga Solution Page</a>.',
      ],
  ];
  ?>
  <nav class="gl-az reveal" aria-label="Glossary A to Z">
    <?php foreach (range('A', 'Z') as $l) :
      if (isset($glossary[$l])) : ?>
        <a href="#glossary-<?php echo esc_attr(strtolower($l)); ?>"><?php echo esc_html($l); ?></a>
      <?php else : ?>
        <span aria-hidden="true"><?php echo esc_html($l); ?></span>
      <?php endif;
    endforeach; ?>
  </nav>

  <?php foreach ($glossary as $letter => $terms) : ?>
    <div class="gl-letter reveal" id="glossary-<?php echo esc_attr(strtolower($letter)); ?>">
      <h2><?php echo esc_html($letter); ?></h2>
      <dl class="gl-list">
        <?php foreach ($terms as $term => $def) : ?>
          <div class="gl-term">
            <dt><?php echo esc_html($term); ?></dt>
            <dd><?php echo wp_kses_post($def); ?></dd>
          </div>
        <?php endforeach; ?>
      </dl>
    </div>
  <?php endforeach; ?>
</div></section>

</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">Free Fleet ROI Audit</span><h2>Get your free fleet ROI audit.</h2></div>
  <div><p>Book a free demo with EnVue Telematics and our fleet advisors will review your operation and identify your highest-impact opportunities.</p>
  <div class="hero-actions">
    <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Book a Free Demo <span>&rarr;</span></a>
    <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
  </div></div>
</div></section>
<?php get_footer(); ?>
