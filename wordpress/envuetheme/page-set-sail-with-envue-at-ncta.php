<?php get_header(); ?>
<main id="main">

<section class="page-hero">
  <img class="page-hero-bg" src="https://img.mailinblue.com/8092393/images/content_library/original/685adccb8c4bcdb84001ca71.png" alt="EnVue charter cruise at NCTA" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url(home_url("/")); ?>">Home</a> / <a href="<?php echo esc_url(home_url("/events-calendar/")); ?>">Events</a> / <a href="<?php echo esc_url(home_url("/set-sail-with-envue-at-ncta/")); ?>">Set Sail with EnVue at NCTA</a></nav>
    <span class="eyebrow eyebrow--light">RSVP &ndash; EnVue Charter Cruise at NCTA</span>
    <h1>Set Sail with EnVue at NCTA</h1>
    <p>Join EnVue Telematics, Geotab, and Lytx for an exclusive charter cruise focused on fleet video telematics, networking, and coastal views.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="#rsvp">Reserve Your Spot <span>&rarr;</span></a>
      <a class="button button-ghost button-lg" href="<?php echo esc_url(home_url("/events-calendar/")); ?>">All Events</a>
    </div>
  </div>
</section>

<style>
.ncta-details{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;margin-top:2rem;}
@media(max-width:760px){.ncta-details{grid-template-columns:1fr;}}
.ncta-detail{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:26px 24px;}
.ncta-detail strong{display:block;font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;color:var(--brand);margin-bottom:.5rem;}
.ncta-detail p{margin:0;color:var(--ink);line-height:1.6;}
.ncta-detail small{display:block;color:var(--slate);margin-top:.25rem;}
.ncta-sponsors{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:2rem;margin-top:1.5rem;}
.ncta-sponsors div{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:20px 28px;display:flex;align-items:center;justify-content:center;min-width:200px;height:100px;}
.ncta-sponsors img{max-height:56px;max-width:180px;width:auto;height:auto;object-fit:contain;}
.ncta-form-card{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:36px;max-width:760px;margin:0 auto;}
.ncta-note{margin-top:1.25rem;font-weight:700;color:var(--ink);}
</style>

<section class="section"><div class="wrap">
  <div class="section-head"><div>
    <span class="eyebrow reveal">Event Details</span>
    <h2 class="reveal" style="--d:1">An evening on the water with EnVue, Geotab, and Lytx.</h2>
  </div><div class="reveal" style="--d:2">
    <p>Join EnVue Telematics, Geotab, and Lytx for an exclusive charter cruise focused on fleet video telematics, networking, and coastal views.</p>
  </div></div>
  <div class="ncta-details">
    <div class="ncta-detail reveal"><strong>When</strong><p>Monday, July 21, 2025<br>6:00 &ndash; 8:00 PM</p></div>
    <div class="ncta-detail reveal" style="--d:1"><strong>Where</strong><p>Amelia Island, NC</p><small>(boarding details sent after RSVP)</small></div>
    <div class="ncta-detail reveal" style="--d:2"><strong>Who</strong><p>NCTA Annual Management Conference attendees</p></div>
  </div>

  <div class="section-head section-head--center" style="margin-top:3rem;"><div>
    <span class="eyebrow reveal">Event Sponsors</span>
  </div></div>
  <div class="ncta-sponsors reveal">
    <div><img src="https://img.mailinblue.com/8092393/images/content_library/original/67dac871e366016f2d09e03f.png" alt="EnVue Logo" loading="lazy"></div>
    <div><img src="https://img.mailinblue.com/8092393/images/content_library/original/685994091a359c68337c5a07.png" alt="Geotab Logo" loading="lazy"></div>
    <div><img src="https://img.mailinblue.com/8092393/images/content_library/original/6859948ebe4649e4cbee6172.png" alt="Lytx Logo" loading="lazy"></div>
  </div>
</div></section>

<section class="section section--soft" id="rsvp"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">RSVP</span>
    <h2 class="reveal" style="--d:1">Reserve Your Spot</h2>
  </div></div>
  <div class="ncta-form-card reveal" style="--d:1">
    <?php echo do_shortcode('[wpforms id="2846" title="false"]'); ?>
    <p class="ncta-note">*Please note space is limited and on a first come basis. If full, we can put you on a waiting list, thank you!</p>
  </div>
</div></section>

</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">EnVue Telematics</span><h2>Can&rsquo;t make the cruise? Let&rsquo;s still connect.</h2></div>
  <div><p>Talk with EnVue about fleet video telematics, Geotab, and Lytx solutions for your operation.</p>
  <div class="hero-actions">
    <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Contact Us <span>&rarr;</span></a>
    <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
  </div></div>
</div></section>
<?php get_footer(); ?>
