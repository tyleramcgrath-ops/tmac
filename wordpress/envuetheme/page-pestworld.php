<?php
/**
 * PestWorld flyer landing page (/pestworld/).
 * The QR code on the "Pestworld Flyer" points here: the flyer is recreated
 * on the page, next to the demo request that earns the $50 Amazon gift card.
 */
get_header(); ?>
<main id="main">

<style>
.pw{--pw-ink:#0b111c;--pw-cyan:#2fb4f0;--pw-sky:#dce7f6;--pw-violet:#2a1f6b;--pw-violet-2:#160f3f;font-family:inherit;}
.pw-display{font-family:"Bebas Neue","Oswald",Impact,"Arial Narrow",sans-serif;font-weight:400;letter-spacing:.01em;line-height:.92;text-transform:uppercase;}

/* Hero: flyer on the left, offer + form on the right */
.pw-hero{background:radial-gradient(1200px 600px at 85% -10%,#1b3a63 0%,transparent 60%),var(--pw-ink);color:#fff;padding:calc(40px + var(--header-h) + var(--topbar-h)) 0 72px;}
.pw-hero .breadcrumb,.pw-hero .breadcrumb a{color:rgba(255,255,255,.7);}
.pw-hero-grid{display:grid;grid-template-columns:minmax(0,520px) minmax(0,1fr);gap:56px;align-items:start;margin-top:24px;}
@media(max-width:960px){.pw-hero-grid{grid-template-columns:1fr;gap:40px;}.pw-intro{order:-1;}}

/* The flyer (8.5x11 proportions) */
.pw-flyer{background:var(--pw-ink);border-radius:6px;overflow:hidden;box-shadow:0 30px 60px -20px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.06);aspect-ratio:8.5/11;display:flex;flex-direction:column;width:100%;max-width:520px;margin-inline:auto;container-type:inline-size;}
.pw-f-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:3.2cqw 3.6cqw;}
.pw-f-top span{color:var(--pw-cyan);font-size:2.5cqw;font-weight:600;letter-spacing:.02em;text-transform:uppercase;}
.pw-f-top img{height:6.4cqw;width:auto;filter:brightness(0) invert(1);}
.pw-f-photo{position:relative;flex:1 1 auto;min-height:0;background:#20303f url("https://images.unsplash.com/photo-1574359134132-34647f92dbbc?auto=format&fit=crop&w=1100&q=72") 55% 30%/cover no-repeat;}
.pw-f-head{position:absolute;left:0;bottom:0;width:60%;background:var(--pw-ink);border-top-right-radius:4.5cqw;padding:3.6cqw 3.6cqw 4cqw 7.8cqw;}
.pw-f-head h2{margin:0;color:#fff;font-size:9.4cqw;}
.pw-f-head h2 em{font-style:normal;color:var(--pw-cyan);display:block;}
.pw-f-head p{margin:2.4cqw 0 0;color:#fff;font-size:2.4cqw;line-height:1.35;letter-spacing:.06em;}
.pw-f-why{position:absolute;right:0;bottom:0;width:40%;background:var(--pw-sky);padding:3cqw 3.6cqw 2.4cqw 2.4cqw;}
.pw-f-why h3{margin:0 0 1.6cqw;color:var(--pw-violet);font-size:5cqw;}
.pw-f-why li{display:flex;align-items:center;gap:1.6cqw;border-bottom:1px solid rgba(11,17,28,.25);padding:1.3cqw 0;font-size:3cqw;font-weight:700;color:var(--pw-ink);line-height:1.15;}
.pw-f-why svg{width:3.8cqw;height:3.8cqw;flex:none;color:var(--pw-violet);}
.pw-f-offer{display:flex;gap:3cqw;align-items:stretch;padding:3.4cqw 3cqw;background:linear-gradient(180deg,#e6ebf2,#c7d0dc);}
.pw-f-card{flex:1;background:linear-gradient(135deg,var(--pw-violet),var(--pw-violet-2));border-radius:2cqw;padding:2.8cqw 3cqw;color:#fff;}
.pw-f-card b{display:block;font-size:2.9cqw;font-weight:800;text-transform:uppercase;}
.pw-f-amt{display:flex;align-items:center;gap:1.8cqw;margin:1.2cqw 0;}
.pw-f-amt strong{font-size:11cqw;font-weight:800;color:var(--pw-cyan);line-height:1;letter-spacing:-.02em;}
.pw-f-amt span{font-size:3.4cqw;font-weight:800;text-transform:uppercase;line-height:1.1;}
.pw-f-amt small{display:block;font-size:1.9cqw;font-weight:500;text-transform:none;margin-top:.6cqw;}
.pw-f-card p{margin:0;font-size:2.9cqw;font-weight:700;}
.pw-f-qr{width:27%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.4cqw;}
.pw-f-qr div{background:#fff;border-radius:1cqw;padding:2cqw;width:100%;aspect-ratio:1;display:grid;place-items:center;}
.pw-f-qr svg{width:100%;height:100%;color:var(--pw-ink);}
.pw-f-qr span{font-size:4.2cqw;color:var(--pw-violet);}
.pw-f-foot{display:flex;align-items:center;justify-content:space-between;gap:2cqw;padding:3cqw 4.4cqw;color:#fff;}
.pw-f-logos{display:flex;align-items:center;gap:3cqw;}
.pw-f-bosch{font-size:3cqw;font-weight:800;line-height:1;}
.pw-f-bosch i{display:block;font-style:normal;color:#e2231a;font-weight:500;}
.pw-f-go{font-size:2cqw;line-height:1;border-left:1px solid rgba(255,255,255,.25);padding-left:3cqw;}
.pw-f-go strong{display:block;font-size:3.6cqw;font-weight:500;margin-top:.6cqw;}
.pw-f-go strong b{color:var(--pw-cyan);font-weight:700;}
.pw-f-site{text-align:right;font-size:2.2cqw;line-height:1.5;}
.pw-f-site b{display:block;font-size:2.5cqw;}

/* Offer + form */
.pw-intro .eyebrow{color:var(--pw-cyan);}
.pw-intro h1{color:#fff;font-size:clamp(2.6rem,5.5vw,4.4rem);margin:.3rem 0 1rem;}
.pw-intro h1 em{font-style:normal;color:var(--pw-cyan);}
.pw-intro > p{color:rgba(255,255,255,.82);font-size:1.125rem;max-width:560px;}
.pw-badge{display:flex;align-items:center;gap:18px;background:linear-gradient(135deg,var(--pw-violet),var(--pw-violet-2));border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px 22px;margin:1.5rem 0;}
.pw-badge strong{font-size:3.25rem;font-weight:800;color:var(--pw-cyan);line-height:1;letter-spacing:-.02em;}
.pw-badge span{font-weight:800;text-transform:uppercase;font-size:1.125rem;line-height:1.2;}
.pw-badge small{display:block;font-weight:400;text-transform:none;font-size:.875rem;color:rgba(255,255,255,.75);margin-top:4px;}
.pw-form-card{background:#fff;color:var(--ink);border-radius:16px;padding:28px;box-shadow:0 20px 40px -20px rgba(0,0,0,.5);}
.pw-form-card h2{font-size:1.375rem;margin:0 0 1rem;}
.pw .lead-form{display:flex;flex-direction:column;gap:.875rem;}
.pw .lead-form .form-row{display:grid;grid-template-columns:1fr 1fr;gap:.875rem;}
@media(max-width:560px){.pw .lead-form .form-row{grid-template-columns:1fr;}.pw-form-card{padding:22px;}}
.pw .lead-form label{display:flex;flex-direction:column;gap:6px;font-size:.875rem;font-weight:600;color:var(--ink);}
.pw .lead-form input,.pw .lead-form select{font:inherit;font-weight:400;padding:12px 14px;border:1px solid var(--line-2);border-radius:10px;background:#fff;color:var(--ink);width:100%;min-width:0;}
.pw .lead-form input:focus,.pw .lead-form select:focus{outline:2px solid var(--brand);outline-offset:1px;}
.pw .lead-form button{border:0;cursor:pointer;align-self:stretch;justify-content:center;}
.pw .form-note{font-size:.8125rem;color:var(--slate);margin:0;}

/* Why choose us */
.pw-why{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;}
@media(max-width:900px){.pw-why{grid-template-columns:1fr;}}
.pw-why article{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:28px;}
.pw-why .pw-ico{width:52px;height:52px;border-radius:14px;background:var(--pw-sky);color:var(--pw-violet);display:grid;place-items:center;margin-bottom:1rem;}
.pw-why .pw-ico svg{width:28px;height:28px;}
.pw-why h3{margin:0 0 .5rem;}
.pw-why p{color:var(--slate);margin:0 0 .75rem;}
.pw-why ul{margin:0;}

.pw-partners{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:16px;}
.pw-partner{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:18px 26px;text-align:center;min-width:220px;}
.pw-partner span{display:block;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--brand);font-weight:700;}
.pw-partner strong{display:block;font-size:1.125rem;color:var(--ink);margin-top:4px;}

.pw-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;counter-reset:pw;}
@media(max-width:900px){.pw-steps{grid-template-columns:1fr;}}
.pw-steps li{list-style:none;background:var(--bg-soft);border-radius:var(--r-lg);padding:24px;color:var(--slate);}
.pw-steps li::before{counter-increment:pw;content:counter(pw);display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--pw-violet);color:#fff;font-weight:800;margin-bottom:.75rem;}
.pw-steps strong{display:block;color:var(--ink);margin-bottom:4px;}
.pw-fine{font-size:.8125rem;color:var(--muted);text-align:center;margin-top:1.5rem;}
</style>

<div class="pw">

<section class="pw-hero" aria-labelledby="pw-title"><div class="wrap">
  <nav class="breadcrumb"><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Home</a> / <a href="<?php echo esc_url( home_url( '/field-services/' ) ); ?>">Field Services</a> / <a href="<?php echo esc_url( home_url( '/pestworld/' ) ); ?>">Pest Control Fleets</a></nav>

  <div class="pw-hero-grid">
    <!-- The flyer -->
    <figure class="pw-flyer" aria-label="EnVue fleet technology for pest control operations flyer">
      <div class="pw-f-top">
        <span>Fleet technology for pest control operations</span>
        <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/envue-logo.png' ); ?>" alt="EnVue Telematics" width="200" height="58">
      </div>
      <div class="pw-f-photo" role="img" aria-label="Pest control technician working from the back of a service van">
        <div class="pw-f-head">
          <h2 class="pw-display">We help <em>catch what</em> could cost you</h2>
          <p>Give your pest control fleet the visibility to protect what matters most.</p>
        </div>
        <div class="pw-f-why">
          <h3 class="pw-display">Why choose us</h3>
          <ul class="plain">
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 16V7h11v9"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>Fleet Intelligence</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M17 9h.01"/></svg>AI Cameras</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7l4 7H8z"/></svg>Smoke Detection</li>
          </ul>
        </div>
      </div>
      <div class="pw-f-offer">
        <div class="pw-f-card">
          <b>Request a fleet technology demo</b>
          <div class="pw-f-amt"><strong>$50</strong><span>Amazon gift card<small>after your qualified demo.</small></span></div>
          <p>Scan to request your demo.</p>
        </div>
        <div class="pw-f-qr">
          <div><svg viewBox="0 0 29 29" role="img" aria-label="QR code linking to envuetelematics.com/pestworld" shape-rendering="crispEdges"><path fill="currentColor" d="M0 0h7v1h-7zM8 0h1v1h-1zM12 0h1v1h-1zM16 0h1v1h-1zM19 0h2v1h-2zM22 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h2v1h-2zM12 1h1v1h-1zM22 1h1v1h-1zM28 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM12 2h2v1h-2zM18 2h1v1h-1zM22 2h1v1h-1zM24 2h3v1h-3zM28 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h1v1h-1zM12 3h2v1h-2zM17 3h2v1h-2zM22 3h1v1h-1zM24 3h3v1h-3zM28 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM10 4h1v1h-1zM13 4h4v1h-4zM19 4h1v1h-1zM22 4h1v1h-1zM24 4h3v1h-3zM28 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM9 5h1v1h-1zM12 5h1v1h-1zM14 5h1v1h-1zM16 5h5v1h-5zM22 5h1v1h-1zM28 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h7v1h-7zM8 7h1v1h-1zM11 7h1v1h-1zM15 7h1v1h-1zM17 7h1v1h-1zM20 7h1v1h-1zM0 8h1v1h-1zM2 8h2v1h-2zM5 8h3v1h-3zM10 8h1v1h-1zM13 8h1v1h-1zM17 8h2v1h-2zM22 8h1v1h-1zM25 8h1v1h-1zM27 8h2v1h-2zM1 9h1v1h-1zM5 9h1v1h-1zM9 9h1v1h-1zM12 9h1v1h-1zM16 9h1v1h-1zM18 9h7v1h-7zM28 9h1v1h-1zM0 10h1v1h-1zM2 10h2v1h-2zM5 10h4v1h-4zM11 10h2v1h-2zM14 10h1v1h-1zM16 10h1v1h-1zM20 10h2v1h-2zM26 10h2v1h-2zM2 11h1v1h-1zM4 11h2v1h-2zM7 11h2v1h-2zM10 11h2v1h-2zM13 11h1v1h-1zM15 11h1v1h-1zM18 11h6v1h-6zM28 11h1v1h-1zM4 12h3v1h-3zM8 12h4v1h-4zM17 12h1v1h-1zM20 12h1v1h-1zM23 12h1v1h-1zM25 12h2v1h-2zM0 13h1v1h-1zM2 13h2v1h-2zM5 13h1v1h-1zM7 13h2v1h-2zM10 13h2v1h-2zM13 13h4v1h-4zM19 13h1v1h-1zM21 13h2v1h-2zM26 13h3v1h-3zM0 14h2v1h-2zM3 14h1v1h-1zM5 14h7v1h-7zM14 14h1v1h-1zM17 14h6v1h-6zM24 14h1v1h-1zM26 14h3v1h-3zM1 15h1v1h-1zM3 15h1v1h-1zM8 15h1v1h-1zM11 15h3v1h-3zM16 15h1v1h-1zM21 15h1v1h-1zM23 15h2v1h-2zM27 15h1v1h-1zM0 16h4v1h-4zM5 16h4v1h-4zM10 16h2v1h-2zM16 16h1v1h-1zM18 16h1v1h-1zM20 16h2v1h-2zM24 16h2v1h-2zM27 16h1v1h-1zM2 17h1v1h-1zM4 17h1v1h-1zM8 17h2v1h-2zM13 17h1v1h-1zM15 17h1v1h-1zM17 17h1v1h-1zM20 17h1v1h-1zM23 17h1v1h-1zM25 17h3v1h-3zM0 18h1v1h-1zM3 18h1v1h-1zM6 18h2v1h-2zM15 18h1v1h-1zM20 18h1v1h-1zM26 18h1v1h-1zM3 19h3v1h-3zM9 19h4v1h-4zM16 19h3v1h-3zM21 19h1v1h-1zM24 19h1v1h-1zM26 19h1v1h-1zM1 20h2v1h-2zM4 20h5v1h-5zM12 20h2v1h-2zM17 20h1v1h-1zM20 20h7v1h-7zM8 21h2v1h-2zM12 21h3v1h-3zM16 21h3v1h-3zM20 21h1v1h-1zM24 21h5v1h-5zM0 22h7v1h-7zM8 22h2v1h-2zM11 22h3v1h-3zM16 22h1v1h-1zM18 22h3v1h-3zM22 22h1v1h-1zM24 22h2v1h-2zM27 22h1v1h-1zM0 23h1v1h-1zM6 23h1v1h-1zM8 23h2v1h-2zM11 23h2v1h-2zM15 23h2v1h-2zM18 23h1v1h-1zM20 23h1v1h-1zM24 23h2v1h-2zM0 24h1v1h-1zM2 24h3v1h-3zM6 24h1v1h-1zM9 24h1v1h-1zM14 24h4v1h-4zM20 24h5v1h-5zM26 24h1v1h-1zM0 25h1v1h-1zM2 25h3v1h-3zM6 25h1v1h-1zM8 25h2v1h-2zM11 25h1v1h-1zM14 25h8v1h-8zM23 25h3v1h-3zM28 25h1v1h-1zM0 26h1v1h-1zM2 26h3v1h-3zM6 26h1v1h-1zM8 26h5v1h-5zM23 26h1v1h-1zM26 26h1v1h-1zM28 26h1v1h-1zM0 27h1v1h-1zM6 27h1v1h-1zM9 27h1v1h-1zM11 27h1v1h-1zM15 27h2v1h-2zM18 27h1v1h-1zM20 27h1v1h-1zM22 27h4v1h-4zM27 27h1v1h-1zM0 28h7v1h-7zM8 28h2v1h-2zM12 28h1v1h-1zM18 28h3v1h-3zM27 28h1v1h-1z"/></svg></div>
          <span class="pw-display">Scan to start</span>
        </div>
      </div>
      <div class="pw-f-foot">
        <div class="pw-f-logos">
          <div class="pw-f-bosch">BOSCH<i>RideCare</i></div>
          <div class="pw-f-go">GEOTAB<strong><b>GO</b> Focus Pro</strong></div>
        </div>
        <div class="pw-f-site"><b>envuetelematics.com</b>(800) 201-1169</div>
      </div>
    </figure>

    <!-- Offer + form -->
    <div class="pw-intro" id="request-demo">
      <span class="eyebrow eyebrow--light">Fleet technology for pest control operations</span>
      <h1 id="pw-title" class="pw-display">We help <em>catch what</em> could cost you</h1>
      <p>Give your pest control fleet the visibility to protect what matters most: your technicians, your vans and the chemicals they carry, and your reputation on every customer&rsquo;s street.</p>
      <div class="pw-badge">
        <strong>$50</strong>
        <span>Amazon gift card<small>after your qualified fleet technology demo.</small></span>
      </div>
      <div class="pw-form-card">
        <h2>Request your demo</h2>
        <form class="lead-form" action="<?php echo esc_url( home_url( '/get-in-touch/' ) ); ?>" method="get">
          <input type="hidden" name="source" value="pestworld-flyer">
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
          <button type="submit" class="button button-primary button-lg">Request my demo <span>&rarr;</span></button>
          <p class="form-note">By submitting, you agree to be contacted by EnVue Telematics about your demo.</p>
        </form>
      </div>
    </div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head"><div>
    <span class="eyebrow reveal">Why choose us</span>
    <h2 class="reveal" style="--d:1">Built for the way pest control fleets actually work.</h2>
  </div><div class="reveal" style="--d:2">
    <p>Your technicians spend the day on residential streets and in customers&rsquo; driveways, with a van full of product behind them. EnVue gives you one view of where they are, how they drive and what happens inside the vehicle.</p>
  </div></div>

  <div class="pw-why">
    <article class="reveal">
      <div class="pw-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 16V7h11v9"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div>
      <h3>Fleet Intelligence</h3>
      <p>Geotab-powered GPS tracking and reporting for every service vehicle.</p>
      <ul class="check-list">
        <li>Live location for faster routing and dispatch</li>
        <li>Proof of service time on site</li>
        <li>Idle, fuel and maintenance reporting</li>
      </ul>
    </article>
    <article class="reveal" style="--d:1">
      <div class="pw-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M17 9h.01"/></svg></div>
      <h3>AI Cameras</h3>
      <p>GO Focus Pro AI dash cameras that flag risky driving as it happens.</p>
      <ul class="check-list">
        <li>In-cab alerts for distraction and following distance</li>
        <li>Video evidence to protect drivers from false claims</li>
        <li>Review video alongside your fleet data</li>
      </ul>
    </article>
    <article class="reveal" style="--d:2">
      <div class="pw-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7l4 7H8z"/></svg></div>
      <h3>Smoke Detection</h3>
      <p>Bosch RideCare in-cabin sensing that alerts you to smoking in the vehicle.</p>
      <ul class="check-list">
        <li>Know when smoke is detected inside a vehicle</li>
        <li>Enforce no-smoking policies around product</li>
        <li>Keep vans clean for every technician</li>
      </ul>
    </article>
  </div>
</div></section>

<section class="section section--soft"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">How the offer works</span>
    <h2 class="reveal" style="--d:1">Three steps to your $50 Amazon gift card.</h2>
  </div></div>
  <ol class="pw-steps">
    <li class="reveal"><strong>Request your demo</strong>Fill out the form above or call (800) 201-1169.</li>
    <li class="reveal" style="--d:1"><strong>Meet with EnVue</strong>See fleet tracking, AI cameras and smoke detection set up for a pest control fleet.</li>
    <li class="reveal" style="--d:2"><strong>Get your gift card</strong>We send your $50 Amazon gift card after your qualified demo.</li>
  </ol>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">The technology on the flyer</span>
    <h2 class="reveal" style="--d:1">Proven hardware, supported by EnVue.</h2>
  </div></div>
  <div class="pw-partners reveal" style="--d:2">
    <div class="pw-partner"><span>Smoke detection</span><strong>Bosch RideCare</strong></div>
    <div class="pw-partner"><span>AI cameras</span><strong>Geotab GO Focus Pro</strong></div>
    <div class="pw-partner"><span>Fleet intelligence</span><strong>Geotab GO</strong></div>
  </div>
</div></section>

</div>
</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">EnVue Telematics</span><h2>Ready to see it on your own fleet?</h2></div>
  <div><p>Book a fleet technology demo and get a $50 Amazon gift card after your qualified demo.</p>
  <div class="hero-actions">
    <a class="button button-primary button-lg" href="#request-demo">Request my demo <span>&rarr;</span></a>
    <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
  </div></div>
</div></section>
<?php get_footer(); ?>
