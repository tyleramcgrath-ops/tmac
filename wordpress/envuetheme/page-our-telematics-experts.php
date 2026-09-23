<?php get_header(); ?>
<main id="main">

<section class="page-hero">
  <img class="page-hero-bg" src="https://images.unsplash.com/photo-1568992688065-536aad8a12f6?auto=format&amp;fit=crop&amp;w=1920&amp;q=72" srcset="https://images.unsplash.com/photo-1568992688065-536aad8a12f6?auto=format&amp;fit=crop&amp;w=768&amp;q=72 768w, https://images.unsplash.com/photo-1568992688065-536aad8a12f6?auto=format&amp;fit=crop&amp;w=1280&amp;q=72 1280w, https://images.unsplash.com/photo-1568992688065-536aad8a12f6?auto=format&amp;fit=crop&amp;w=1920&amp;q=72 1920w, https://images.unsplash.com/photo-1568992688065-536aad8a12f6?auto=format&amp;fit=crop&amp;w=2560&amp;q=72 2560w" sizes="100vw" alt="Team discussion at a table in an open loft office" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="<?php echo esc_url(home_url("/")); ?>">Home</a> /
      <a href="<?php echo esc_url(home_url("/our-telematics-experts/")); ?>">Fleet Optimization Hub &amp; Experts</a>
    </nav>
    <span class="eyebrow eyebrow--light">Optimize Your Fleet with Data</span>
    <h1>Fleet Optimization Hub &amp; Experts</h1>
    <p>Use our interactive tools below to discover your potential savings and find the perfect telematics configuration for your unique business needs.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="#roi-calculator">Generate Savings Report <span>&rarr;</span></a>
    </div>
  </div>
</section>

<style>
.fot-card{max-width:760px;margin:0 auto;}
.fot-card label{display:block;font-size:15px;font-weight:600;color:var(--ink);margin-bottom:10px;}
.fot-card .money-field input{width:100%;}
.fot-results{display:none;margin-top:24px;}
.fot-results.is-open{display:block;}
.fot-quiz-step{display:none;}
.fot-quiz-step.is-open{display:block;}
.fot-quiz-step h3{font-size:1.25rem;margin:0 0 18px;color:var(--ink);}
.fot-options{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.fot-options button{padding:14px 18px;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--bg-soft);font-size:15px;font-weight:600;color:var(--ink);text-align:left;cursor:pointer;transition:border-color .16s,background .16s;}
.fot-options button:hover,.fot-options button:focus-visible{border-color:var(--brand);background:var(--brand-lt);}
.fot-rec{background:var(--brand-pale);border:1px solid var(--brand-mid);border-radius:var(--r);padding:24px 26px;margin-bottom:20px;}
.fot-rec small{display:block;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--brand);margin-bottom:6px;}
.fot-rec strong{display:block;font-size:1.35rem;color:var(--ink);margin-bottom:8px;}
.fot-rec p{margin:0;color:var(--slate);line-height:1.65;}
.fot-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center;}
.fot-reset{background:none;border:none;color:var(--brand);font-weight:600;cursor:pointer;padding:8px 4px;}
.fot-library{display:grid;grid-template-columns:repeat(3,1fr);gap:8px 32px;margin-top:2rem;}
.fot-library a{color:var(--ink);text-decoration:none;font-weight:600;}
.fot-library a:hover{color:var(--brand);text-decoration:underline;}
@media(max-width:900px){.fot-library{grid-template-columns:1fr 1fr;}}
@media(max-width:600px){.fot-options,.fot-library{grid-template-columns:1fr;}}
</style>

<section class="section" id="roi-calculator"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">Tool 1</span>
    <h2 class="reveal" style="--d:1">1. Fleet ROI &amp; Savings Calculator</h2>
  </div></div>

  <div class="tool-card fot-card reveal" style="--d:2">
    <form onsubmit="return false;">
      <label for="fot-fleet-size">Total Fleet Size (Vehicles):</label>
      <div class="money-field"><input id="fot-fleet-size" type="number" min="0" step="1" placeholder="e.g. 50" inputmode="numeric"><small>vehicles</small></div>

      <label for="fot-fuel-spend">Avg. Monthly Fuel Cost Per Vehicle ($):</label>
      <div class="money-field"><span>$</span><input id="fot-fuel-spend" type="number" min="0" step="50" placeholder="e.g. 1200" inputmode="decimal"><small>USD</small></div>

      <label for="fot-accidents">Current Annual Accident Rate (Total):</label>
      <div class="money-field"><input id="fot-accidents" type="number" min="0" step="1" placeholder="e.g. 3" inputmode="numeric"><small>per year</small></div>

      <button type="button" class="button button-primary button-lg" id="fot-calc-btn">Generate Savings Report</button>
    </form>

    <div class="fot-results" id="fot-roi-results" aria-live="polite">
      <div class="saving-result">
        <small>Estimated Total Annual Savings</small>
        <strong>$<span id="fot-total">0</span></strong>
      </div>
      <div class="roi-breakdown">
        <div class="roi-row"><span>Fuel Efficiency</span><strong>$<span id="fot-fuel">0</span></strong></div>
        <div class="roi-row"><span>Safety &amp; Risk</span><strong>$<span id="fot-safety">0</span></strong></div>
        <div class="roi-row"><span><a href="<?php echo esc_url(home_url("/productivity/")); ?>">Productivity</a></span><strong>$<span id="fot-prod">0</span></strong></div>
      </div>
    </div>
    <p class="disclaimer">*Calculations based on average industry benchmarks of 12% fuel reduction, 30% accident reduction, and $50/mo productivity gain per vehicle.</p>
  </div>
</div></section>

<section class="section section--soft" id="solution-finder"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">Tool 2</span>
    <h2 class="reveal" style="--d:1">2. Fleet Solution Finder Quiz</h2>
  </div></div>

  <div class="tool-card fot-card reveal" style="--d:2">
    <div class="fot-quiz-step is-open" id="fot-quiz-1">
      <h3>Select Your Primary Industry</h3>
      <div class="fot-options">
        <button type="button" data-industry="Trucking">Trucking &amp; Logistics</button>
        <button type="button" data-industry="Construction">Construction</button>
        <button type="button" data-industry="Field Services">Field Services</button>
      </div>
    </div>
    <div class="fot-quiz-step" id="fot-quiz-2">
      <h3>What is your #1 operational goal?</h3>
      <div class="fot-options">
        <button type="button" data-goal="Safety">Reduce Accidents</button>
        <button type="button" data-goal="Compliance">ELD/DOT Compliance</button>
        <button type="button" data-goal="Fuel">Lower Fuel Costs</button>
        <button type="button" data-goal="Equipment">Equipment Tracking</button>
      </div>
    </div>
    <div class="fot-quiz-step" id="fot-quiz-result" aria-live="polite">
      <div class="fot-rec">
        <small>Your Recommended Solution:</small>
        <strong id="fot-rec-title"></strong>
        <p id="fot-rec-desc"></p>
      </div>
      <div class="fot-actions">
        <a class="button button-primary" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Get a Custom Quote <span>&rarr;</span></a>
        <button type="button" class="fot-reset" id="fot-quiz-reset">Start Over</button>
      </div>
    </div>
  </div>
</div></section>



<script>
(function(){
  function num(id){ var v = parseFloat(document.getElementById(id).value); return isNaN(v) ? 0 : v; }
  function fmt(n){ return Math.round(n).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0}); }
  var btn = document.getElementById('fot-calc-btn');
  if (btn) btn.addEventListener('click', function(){
    var size = num('fot-fleet-size'), fuel = num('fot-fuel-spend'), accidents = num('fot-accidents');
    var fuelSavings   = size * fuel * 0.12 * 12;
    var safetySavings = (accidents * 0.30 * 15000) + (size * 150); // $15k per accident + $150/unit insurance credit
    var prodSavings   = size * 50 * 12;
    document.getElementById('fot-total').textContent  = fmt(fuelSavings + safetySavings + prodSavings);
    document.getElementById('fot-fuel').textContent   = fmt(fuelSavings);
    document.getElementById('fot-safety').textContent = fmt(safetySavings);
    document.getElementById('fot-prod').textContent   = fmt(prodSavings);
    document.getElementById('fot-roi-results').classList.add('is-open');
  });

  var recs = {
    Safety:     ['AI Video Safety Suite', 'Based on your focus on safety, we recommend our AI-powered dash cam solution combined with Geotab driver scorecards.'],
    Compliance: ['Compliance Master Package', 'We recommend our fully certified ELD and automated DVIR solution to keep your trucking fleet 100% compliant.'],
    Fuel:       ['Fuel Optimization Bundle', 'Lower your costs with integrated fuel card tracking, route optimization, and engine diagnostics.'],
    Equipment:  ['Asset & Equipment Tracker', 'Our ruggedized Phillips Connect or solar-powered units are perfect for your equipment tracking needs.']
  };
  function show(id){
    ['fot-quiz-1','fot-quiz-2','fot-quiz-result'].forEach(function(s){
      document.getElementById(s).classList.toggle('is-open', s === id);
    });
  }
  document.querySelectorAll('#fot-quiz-1 [data-industry]').forEach(function(b){
    b.addEventListener('click', function(){ show('fot-quiz-2'); });
  });
  document.querySelectorAll('#fot-quiz-2 [data-goal]').forEach(function(b){
    b.addEventListener('click', function(){
      var r = recs[b.getAttribute('data-goal')] || recs.Equipment;
      document.getElementById('fot-rec-title').textContent = r[0];
      document.getElementById('fot-rec-desc').textContent  = r[1];
      show('fot-quiz-result');
    });
  });
  var reset = document.getElementById('fot-quiz-reset');
  if (reset) reset.addEventListener('click', function(){ show('fot-quiz-1'); });
})();
</script>

</main>
<section class="final-cta final-cta--form" id="demo"><div class="wrap final-grid">
  <div>
    <span class="eyebrow eyebrow--light">Talk to Our Experts</span>
    <h2>Put your fleet data to work.</h2>
    <p>Talk with an EnVue telematics expert to turn your savings estimate into a custom quote and a telematics configuration built for your fleet.</p>
    <p class="demo-call">Prefer to talk? Call <a href="tel:8002011169">(800) 201-1169</a> &mdash; US-based fleet experts, 24/7.</p>
  </div>
  <div><?php echo envue_demo_form(); ?></div>
</div></section>
<?php get_footer(); ?>
