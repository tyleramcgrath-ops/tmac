<?php
/**
 * GO Focus Plus $50 demo offer page (/gofocusplus-demo50/).
 * The QR code on the trade-show flyer points here. The page is not tied to one
 * show: add ?event=Show+Name to the QR link to tag leads from a given event.
 */
$pw_event = isset( $_GET['event'] ) ? sanitize_text_field( wp_unslash( $_GET['event'] ) ) : '';
get_header(); ?>
<main id="main">

<style>
.gf{--gf-ink:#071330;--gf-ink-2:#0b1d45;--gf-cyan:#22c3f3;--gf-violet:#5b3df5;--gf-blue:#2d6bff;}
.gf-display{font-family:"Bebas Neue","Oswald",Impact,"Arial Narrow",sans-serif;font-weight:400;letter-spacing:.005em;line-height:.9;text-transform:uppercase;}

/* Hero: flyer on the left, offer + form on the right */
.gf-hero{background:radial-gradient(1100px 600px at 90% -10%,#1a3a78 0%,transparent 60%),var(--gf-ink);color:#fff;padding:calc(40px + var(--header-h) + var(--topbar-h)) 0 72px;}
.gf-hero .breadcrumb,.gf-hero .breadcrumb a{color:rgba(255,255,255,.7);}
.gf-hero-grid{display:grid;grid-template-columns:minmax(0,500px) minmax(0,1fr);gap:56px;align-items:start;margin-top:24px;}
@media(max-width:960px){.gf-hero-grid{grid-template-columns:1fr;gap:40px;}.gf-intro{order:-1;}}

/* The flyer (8.5x11 proportions); sizes scale with the flyer's width */
.gf-flyer{background:var(--gf-ink);border-radius:6px;overflow:hidden;box-shadow:0 30px 60px -20px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.07);display:flex;flex-direction:column;width:100%;max-width:500px;margin-inline:auto;container-type:inline-size;}
.gf-f-top{position:relative;min-height:84cqw;background:linear-gradient(90deg,var(--gf-ink) 34%,rgba(7,19,48,.55) 50%,rgba(7,19,48,0) 64%),url("<?php echo esc_url( get_template_directory_uri() . '/assets/images/gofocus-demo-technician.jpg' ); ?>") right bottom/auto 100% no-repeat,var(--gf-ink);padding:4.4cqw 4.4cqw 0;}
.gf-f-logo{height:8.6cqw;width:auto;filter:brightness(0) invert(1);}
.gf-f-tag{position:absolute;top:3.6cqw;right:3cqw;text-shadow:0 1px 6px rgba(0,0,0,.75);border-left:2px solid var(--gf-cyan);padding-left:2cqw;font-size:2.1cqw;letter-spacing:.14em;line-height:1.55;text-transform:uppercase;color:#fff;}
.gf-f-head{margin:3cqw 0 0;padding-bottom:4cqw;font-size:12.4cqw;color:#fff;}
.gf-f-head em{font-style:normal;color:var(--gf-cyan);}
.gf-f-head span{display:block;}
.gf-f-bar{background:var(--gf-cyan);color:#fff;text-align:center;font-weight:700;letter-spacing:.2em;font-size:2.9cqw;padding:1.3cqw 2cqw;text-transform:uppercase;}
.gf-f-prod{display:grid;grid-template-columns:1.3fr .85fr .75fr;align-items:center;gap:2cqw;padding:2cqw 4cqw 2.6cqw;}
.gf-f-geo{font-size:3cqw;letter-spacing:.06em;font-weight:500;}
.gf-f-go{display:flex;align-items:baseline;gap:1.4cqw;line-height:1;margin:.6cqw 0 1.4cqw;}
.gf-f-go b{font-size:8.6cqw;font-weight:300;color:transparent;-webkit-text-stroke:.45cqw var(--gf-cyan);letter-spacing:.02em;}
.gf-f-go span{font-size:5.4cqw;font-weight:500;}
.gf-f-prod p{margin:0;font-size:2.55cqw;line-height:1.3;color:#fff;}
.gf-f-cam{width:100%;height:auto;}
.gf-f-ins{font-size:2.5cqw;letter-spacing:.16em;line-height:1.55;text-transform:uppercase;}
.gf-f-ins::after{content:"";display:block;width:6cqw;height:2px;background:var(--gf-cyan);margin-top:1.4cqw;}
.gf-f-offer{margin:0 1cqw;border:2px solid var(--gf-violet);border-radius:3.4cqw;background:linear-gradient(90deg,#0a1a52,#13127a);display:flex;align-items:center;gap:2.4cqw;padding:1.8cqw 3cqw;}
.gf-f-lim{font-size:4.1cqw;color:var(--gf-cyan);line-height:.95;}
.gf-f-amt{font-size:17cqw;line-height:.85;background:linear-gradient(180deg,#36d4ff,#6a4dff);-webkit-background-clip:text;background-clip:text;color:transparent;}
.gf-f-gc b{display:block;font-size:6.6cqw;color:transparent;background:linear-gradient(90deg,#36d4ff,#8a6bff);-webkit-background-clip:text;background-clip:text;line-height:1;}
.gf-f-gc span{display:block;font-size:2.2cqw;line-height:1.35;margin-top:1.2cqw;}
.gf-f-foot{display:flex;align-items:center;gap:4cqw;padding:2.6cqw 6cqw 3cqw;}
.gf-f-foot img{height:6.6cqw;width:auto;filter:brightness(0) invert(1);}
.gf-f-foot span{border-left:2px solid var(--gf-cyan);padding-left:4cqw;font-size:2cqw;font-weight:700;letter-spacing:.12em;line-height:1.5;text-transform:uppercase;}

/* Offer + form */
.gf-intro .eyebrow{color:var(--gf-cyan);}
.gf-intro h1{color:#fff;font-size:clamp(2.8rem,6vw,4.8rem);margin:.3rem 0 1rem;}
.gf-intro h1 em{font-style:normal;color:var(--gf-cyan);}
.gf-intro > p{color:rgba(255,255,255,.82);font-size:1.125rem;max-width:560px;}
.gf-badge{display:flex;align-items:center;gap:18px;background:linear-gradient(90deg,#0a1a52,#13127a);border:2px solid var(--gf-violet);border-radius:18px;padding:16px 22px;margin:1.5rem 0;}
.gf-badge strong{font-size:3.5rem;font-weight:800;line-height:1;letter-spacing:-.02em;background:linear-gradient(180deg,#36d4ff,#7a5cff);-webkit-background-clip:text;background-clip:text;color:transparent;}
.gf-badge span{font-weight:800;text-transform:uppercase;font-size:1.125rem;line-height:1.2;}
.gf-badge small{display:block;font-weight:400;text-transform:none;font-size:.9375rem;color:rgba(255,255,255,.8);margin-top:4px;}
.gf-includes{display:flex;gap:12px;align-items:flex-start;background:rgba(34,195,243,.1);border:1px solid rgba(34,195,243,.35);border-radius:12px;padding:12px 16px;margin:-.5rem 0 1.5rem;color:#fff;font-size:.9375rem;}
.gf-includes svg{flex:none;width:22px;height:22px;color:var(--gf-cyan);margin-top:1px;}
.gf-form-card{background:#fff;color:var(--ink);border-radius:16px;padding:28px;box-shadow:0 20px 40px -20px rgba(0,0,0,.5);}
.gf-form-card h2{font-size:1.375rem;margin:0 0 1rem;}
.gf .lead-form{display:flex;flex-direction:column;gap:.875rem;}
.gf .lead-form .form-row{display:grid;grid-template-columns:1fr 1fr;gap:.875rem;}
@media(max-width:560px){.gf .lead-form .form-row{grid-template-columns:1fr;}.gf-form-card{padding:22px;}}
.gf .lead-form label{display:flex;flex-direction:column;gap:6px;font-size:.875rem;font-weight:600;color:var(--ink);}
.gf .lead-form input,.gf .lead-form select{font:inherit;font-weight:400;padding:12px 14px;border:1px solid var(--line-2);border-radius:10px;background:#fff;color:var(--ink);width:100%;min-width:0;}
.gf .lead-form input:focus,.gf .lead-form select:focus{outline:2px solid var(--brand);outline-offset:1px;}
.gf .lead-form button{border:0;cursor:pointer;align-self:stretch;justify-content:center;}
.gf .form-note{font-size:.8125rem;color:var(--slate);margin:0;}

/* Below the hero */
.gf-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;}
@media(max-width:900px){.gf-cards{grid-template-columns:1fr;}}
.gf-cards article{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:28px;}
.gf-ico{width:52px;height:52px;border-radius:14px;background:var(--brand-lt);color:var(--brand);display:grid;place-items:center;margin-bottom:1rem;}
.gf-ico svg{width:28px;height:28px;}
.gf-cards h3{margin:0 0 .5rem;}
.gf-cards p{color:var(--slate);margin:0;}
.gf-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;counter-reset:gf;padding:0;margin:0;}
@media(max-width:900px){.gf-steps{grid-template-columns:1fr;}}
.gf-steps li{list-style:none;background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:24px;color:var(--slate);}
.gf-steps li::before{counter-increment:gf;content:counter(gf);display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--gf-blue),var(--gf-violet));color:#fff;font-weight:800;margin-bottom:.75rem;}
.gf-steps strong{display:block;color:var(--ink);margin-bottom:4px;}
</style>

<div class="gf">

<section class="gf-hero" aria-labelledby="gf-title"><div class="wrap">
  <nav class="breadcrumb"><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Home</a> / <a href="<?php echo esc_url( home_url( '/dash-cams/' ) ); ?>">AI Dash Cams</a> / <a href="<?php echo esc_url( home_url( '/gofocusplus-demo50/' ) ); ?>">GO Focus Plus Demo Offer</a></nav>

  <div class="gf-hero-grid">
    <!-- The flyer -->
    <figure class="gf-flyer" aria-label="EnVue flyer: Catch the risks. Protect your routes. $50 Amazon gift card for a Geotab GO Focus Plus camera demo">
      <div class="gf-f-top" role="img" aria-label="Fleet technician in an EnVue shirt checking a tablet beside his service van">
        <img class="gf-f-logo" src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/envue-logo.png' ); ?>" alt="EnVue Telematics" width="200" height="58">
        <div class="gf-f-tag">Safer drivers.<br>Smarter operations.<br>Stronger businesses.</div>
        <h2 class="gf-f-head gf-display"><span>Catch</span><span>the risks.</span><em><span>Protect</span></em><span>your</span><span>routes.</span></h2>
      </div>
      <div class="gf-f-bar">Real visibility. Real safety. Real results.</div>
      <div class="gf-f-prod">
        <div>
          <div class="gf-f-geo">GEOTAB</div>
          <div class="gf-f-go"><b>GO</b><span>Focus Plus</span></div>
          <p>Real-time video safety and driver coaching to reduce risk and keep your fleet moving.</p>
        </div>
        <img class="gf-f-cam" src="https://envuetelematics.com/wp-content/uploads/2026/07/geotab-go-focus-plus-product-1536x1181.png" alt="Geotab GO Focus Plus AI dash camera" loading="lazy" onerror="this.style.visibility='hidden'">
        <div class="gf-f-ins">Video<br>insights.<br>Safer<br>tomorrow.</div>
      </div>
      <div class="gf-f-offer">
        <div class="gf-f-lim gf-display">Limited<br>time<br>demo<br>offer</div>
        <div class="gf-f-amt gf-display">$50</div>
        <div class="gf-f-gc"><b class="gf-display">Amazon gift card</b><span>Schedule and complete a qualifying Geotab GO Focus Plus camera demo.</span></div>
      </div>
      <div class="gf-f-foot">
        <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/envue-logo.png' ); ?>" alt="" width="200" height="58">
        <span>People, vehicles, communities.<br>For a safer tomorrow.</span>
      </div>
    </figure>

    <!-- Offer + form -->
    <div class="gf-intro" id="request-demo">
      <span class="eyebrow eyebrow--light">Limited time demo offer</span>
      <h1 id="gf-title" class="gf-display">Catch the risks. <em>Protect</em> your routes.</h1>
      <p>See how Geotab GO Focus Plus pairs AI video with real-time driver coaching to reduce risk and keep your fleet moving.</p>
      <div class="gf-badge">
        <strong>$50</strong>
        <span>Amazon gift card<small>Schedule and complete a qualifying Geotab GO Focus Plus camera demo.</small></span>
      </div>
      <p class="gf-includes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg><span>Your demo includes the <strong>Geotab GO Focus Plus</strong> AI dash camera, shown live by the EnVue team.</span></p>
      <div class="gf-form-card">
        <h2>Schedule your demo</h2>
        <form class="lead-form" action="<?php echo esc_url( home_url( '/get-in-touch/' ) ); ?>" method="get">
          <input type="hidden" name="source" value="gofocusplus-demo50">
          <input type="hidden" name="offer" value="amazon-50">
          <div class="form-row">
            <label>First name<input type="text" autocomplete="given-name" required name="first_name"></label>
            <label>Last name<input type="text" autocomplete="family-name" required name="last_name"></label>
          </div>
          <div class="form-row">
            <label>Work email<input type="email" autocomplete="email" required name="email"></label>
            <label>Phone<input type="tel" autocomplete="tel" name="phone"></label>
          </div>
          <div class="form-row">
            <label>Company<input type="text" autocomplete="organization" required name="company"></label>
            <label>Fleet size
              <select name="fleet_size" required>
                <option value="" disabled selected>Select</option>
                <option>1&ndash;10 vehicles</option>
                <option>11&ndash;25 vehicles</option>
                <option>26&ndash;50 vehicles</option>
                <option>51&ndash;100 vehicles</option>
                <option>100+ vehicles</option>
              </select>
            </label>
          </div>
          <label>Where did you meet us? <input type="text" name="event" placeholder="Trade show or event (optional)" value="<?php echo esc_attr( $pw_event ); ?>"></label>
          <button type="submit" class="button button-primary button-lg">Schedule my demo <span>&rarr;</span></button>
          <p class="form-note">By submitting, you agree to be contacted by EnVue Telematics about your demo.</p>
        </form>
      </div>
    </div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head"><div>
    <span class="eyebrow reveal">What you&rsquo;ll see in your demo</span>
    <h2 class="reveal" style="--d:1">Geotab GO Focus Plus, shown on a real fleet workflow.</h2>
  </div><div class="reveal" style="--d:2">
    <p>Your EnVue team walks you through the camera, the in-cab coaching and the review tools in MyGeotab, then answers questions about your own vehicles and drivers.</p>
  </div></div>

  <div class="gf-cards">
    <article class="reveal">
      <div class="gf-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3M18 12h3M16.3 7.7l2.1-2.1"/><circle cx="12" cy="14" r="5"/><path d="M12 12v2.5l1.5 1"/></svg></div>
      <h3>Real-time driver coaching</h3>
      <p>In-cab feedback lets drivers correct risky behavior as it happens, not days later.</p>
    </article>
    <article class="reveal" style="--d:1">
      <div class="gf-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M17 9h.01"/></svg></div>
      <h3>AI video safety</h3>
      <p>Video of high-risk events helps you see what happened and protect drivers from false claims.</p>
    </article>
    <article class="reveal" style="--d:2">
      <div class="gf-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg></div>
      <h3>One view in MyGeotab</h3>
      <p>Video, telematics and coaching sit together, so your team reviews the events that matter first.</p>
    </article>
  </div>
</div></section>

<section class="section section--soft"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">How the offer works</span>
    <h2 class="reveal" style="--d:1">Three steps to your $50 Amazon gift card.</h2>
  </div></div>
  <ol class="gf-steps">
    <li class="reveal"><strong>Schedule your demo</strong>Fill out the form above or call <a href="tel:+18002011169">(800) 201-1169</a>.</li>
    <li class="reveal" style="--d:1"><strong>See GO Focus Plus</strong>Complete a qualifying Geotab GO Focus Plus camera demo with the EnVue team.</li>
    <li class="reveal" style="--d:2"><strong>Get your gift card</strong>Your $50 Amazon gift card follows your completed qualifying demo.</li>
  </ol>
</div></section>

</div>
</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">EnVue Telematics</span><h2>People, vehicles, communities. For a safer tomorrow.</h2></div>
  <div><p>Schedule and complete a qualifying Geotab GO Focus Plus camera demo to get a $50 Amazon gift card.</p>
  <div class="hero-actions">
    <a class="button button-primary button-lg" href="#request-demo">Schedule my demo <span>&rarr;</span></a>
    <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
  </div></div>
</div></section>
<?php get_footer(); ?>
