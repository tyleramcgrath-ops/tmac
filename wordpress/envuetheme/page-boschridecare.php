<?php
/**
 * Bosch RideCare partner page (/boschridecare/).
 *
 * Copy, figures and images come from Bosch's RideCare Reseller Marketing Kit
 * (emails, social captions and visual elements). Images in
 * assets/images/ridecare/ are cropped from that kit. Keep the figures as Bosch
 * states them; don't add claims the kit doesn't make.
 */

$rc_img = get_template_directory_uri() . '/assets/images/ridecare/';
// Breadcrumb name while /boschridecare/ has no WP page behind it.
$GLOBALS['envue_page_name'] = 'Bosch RideCare';

get_header(); ?>
<main id="main">

<style>
.rc-hero{background:radial-gradient(900px 520px at 85% 10%,#1d3f63 0%,transparent 65%),var(--bg-deep-2);color:#fff;padding:calc(40px + var(--header-h) + var(--topbar-h)) 0 64px;overflow:hidden;}
.rc-hero .breadcrumb,.rc-hero .breadcrumb a{color:rgba(255,255,255,.7);}
.rc-hero-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:40px;align-items:center;margin-top:20px;}
.rc-hero h1{color:#fff;font-size:clamp(36px,4.8vw,60px);line-height:1.06;margin:0 0 20px;letter-spacing:-.02em;}
.rc-hero p{color:rgba(255,255,255,.85);font-size:clamp(17px,1.6vw,20px);line-height:1.55;margin:0 0 28px;max-width:56ch;}
.rc-hero-media img{display:block;width:100%;max-width:460px;height:auto;margin-left:auto;border-radius:var(--r-lg);box-shadow:0 30px 60px rgba(0,0,0,.35);}
@media(max-width:900px){.rc-hero-grid{grid-template-columns:1fr;}.rc-hero-media img{margin:0 auto;max-width:400px;}}

.rc-split .feature-split-media img{aspect-ratio:auto;object-fit:contain;width:100%;max-width:440px;height:auto;display:block;margin:0 auto;box-shadow:0 18px 40px rgba(16,24,40,.12);}
.rc-split .feature-split-media img.rc-wide{max-width:560px;}
.rc-split .check-list+p{margin-top:18px;}

.rc-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:8px;}
.rc-step{background:#fff;border:1px solid var(--line-2);border-radius:var(--r-lg);overflow:hidden;display:flex;flex-direction:column;}
.rc-step img{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;}
.rc-step div{padding:20px 22px 24px;}
.rc-step span{display:block;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--brand,#0b6fb8);margin-bottom:6px;}
.rc-step h3{font-size:20px;margin:0 0 8px;}
.rc-step p{margin:0;color:var(--ink-2);font-size:15.5px;line-height:1.55;}

.rc-video-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;max-width:1100px;margin:28px auto 0;}
.rc-video-card{display:block;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:var(--r-lg);overflow:hidden;color:#fff;text-decoration:none;transition:transform .2s ease,border-color .2s ease;}
.rc-video-card:hover,.rc-video-card:focus-visible{transform:translateY(-3px);border-color:rgba(255,255,255,.4);}
.rc-video-card img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#fff;}
.rc-video-card span{display:block;padding:14px 16px 16px;font-size:15px;font-weight:600;line-height:1.35;}
.rc-video-card small{display:block;margin-top:4px;font-weight:400;color:rgba(255,255,255,.7);}

.rc-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:8px;}
.rc-links a{display:block;padding:20px 22px;border:1px solid var(--line-2);border-radius:var(--r-lg);background:#fff;color:var(--ink);text-decoration:none;transition:border-color .2s ease;}
.rc-links a:hover,.rc-links a:focus-visible{border-color:var(--ink-2);}
.rc-links strong{display:block;font-size:17px;margin-bottom:4px;}
.rc-links small{color:var(--ink-2);font-size:14.5px;}
@media(max-width:900px){.rc-steps{grid-template-columns:1fr;}.rc-links{grid-template-columns:1fr;}}
</style>

<section class="rc-hero">
  <div class="wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="<?php echo esc_url(home_url("/")); ?>">Home</a> /
      <a href="<?php echo esc_url(home_url("/our-partners/")); ?>">Partners</a> /
      <a href="<?php echo esc_url(home_url("/boschridecare/")); ?>">Bosch RideCare</a>
    </nav>
    <div class="rc-hero-grid">
      <div>
        <span class="eyebrow eyebrow--light">Vehicle Condition Monitoring Partner</span>
        <h1>Bosch RideCare: Smoking, Vaping &amp; Damage Detection for Fleets.</h1>
        <p>A palm-sized Bosch sensor that installs in 15 minutes and alerts you in real time to smoking, vaping, damage impacts and harsh driving in your vehicles &mdash; with incident reports right inside MyGeotab, deployed by EnVue Telematics.</p>
        <div class="hero-actions">
          <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Get a Demo <span>&rarr;</span></a>
          <a class="button button-ghost button-lg" href="<?php echo esc_url(home_url("/our-partners/")); ?>">All Partners</a>
        </div>
      </div>
      <div class="rc-hero-media">
        <img src="<?php echo esc_url($rc_img . 'ridecare-awareness.webp'); ?>" width="459" height="444" alt="Bosch RideCare sensor mounted at the windshield, detecting smoking, vaping and damage impacts" loading="eager" fetchpriority="high">
      </div>
    </div>
  </div>
</section>

<section aria-label="Stats"><div class="wrap"><div class="stat-band">
  <div><strong>15 min</strong><span>Installation</span></div>
  <div><strong>Up to 60%</strong><span>Fewer smoking incidents</span></div>
  <div><strong>$300&ndash;$500</strong><span>Cleaning cost per incident</span></div>
  <div><strong>MyGeotab</strong><span>Built-in reporting</span></div>
</div></div></section>

<?php echo envue_partner_logo('boschridecare', 'Bosch RideCare'); ?>

<section class="section"><div class="wrap">
  <div class="section-head"><div>
    <span class="eyebrow reveal">About Bosch RideCare</span>
    <h2 class="reveal" style="--d:1">The smart way to protect your fleet.</h2>
  </div><div class="reveal" style="--d:2">
    <p>Bosch RideCare is transforming how fleets manage vehicle condition and accountability. The palm-sized sensor installs in 15 minutes and uses molecular detection technology to flag smoking and vaping, while also detecting damage impacts and harsh driving. Because it detects smoke at the molecular level, RideCare maintains privacy and helps you meet union and workplace standards. EnVue Telematics deploys RideCare alongside your Geotab telematics so every incident lands in the dashboard you already use.</p>
  </div></div>

  <div class="feature-split rc-split">
    <div class="feature-split-media"><img src="<?php echo esc_url($rc_img . 'ridecare-device-hand.webp'); ?>" width="338" height="228" alt="Palm-sized Bosch RideCare sensor held in one hand" loading="lazy"></div>
    <div class="reveal">
      <span class="eyebrow">What RideCare Detects</span>
      <h2>Know the moment smoking, vaping or damage happens.</h2>
      <p>RideCare sends real-time alerts when an incident occurs and builds a detailed report you can use as evidence &mdash; so you can detect risks before they become costs.</p>
      <ul class="check-list">
        <li><strong>Smoking &amp; vaping</strong> &mdash; real-time detection, plus which driver smoked</li>
        <li><strong>Damage impacts</strong> &mdash; automatic damage severity classification (cosmetic vs. severe)</li>
        <li><strong>Harsh driving behavior</strong> &mdash; flagged alongside your other driver data</li>
        <li><strong>Instant alerts</strong> &mdash; notified the moment an incident event occurs</li>
        <li><strong>Incident reports with GPS data</strong> &mdash; documentation for claims and policy enforcement</li>
      </ul>
    </div>
  </div>
  <div class="feature-split feature-split--flip rc-split">
    <div class="feature-split-media"><img src="<?php echo esc_url($rc_img . 'ridecare-post-2x.webp'); ?>" width="350" height="350" alt="2.2x higher risk of accidents was linked to smoking in vehicles" loading="lazy"></div>
    <div class="reveal">
      <span class="eyebrow">Why It Matters</span>
      <h2>Smoking at the wheel isn&rsquo;t just a health issue. It&rsquo;s a safety risk.</h2>
      <p>When a driver smokes while driving, they face three distractions at once:</p>
      <ul class="check-list">
        <li><strong>Visual</strong> &mdash; eyes off the road</li>
        <li><strong>Manual</strong> &mdash; hands off the wheel</li>
        <li><strong>Cognitive</strong> &mdash; mind off driving</li>
      </ul>
      <p>For fleet operators, the consequences go far beyond accidents: higher insurance claims, potential liability exposure and safety violations, $300&ndash;$500 in cleaning per smoking incident, $100&ndash;$500 in downtime per event, reduced resale value and a negative customer experience.</p>
    </div>
  </div>
  <div class="feature-split rc-split">
    <div class="feature-split-media"><img class="rc-wide" src="<?php echo esc_url($rc_img . 'ridecare-mygeotab.webp'); ?>" width="1078" height="607" alt="RideCare add-in in MyGeotab showing incident history for smoke, damage and harsh driving incidents" loading="lazy"></div>
    <div class="reveal">
      <span class="eyebrow">Built Into MyGeotab</span>
      <h2>Incident reports inside the dashboard you already use.</h2>
      <p>RideCare adds directly into your existing MyGeotab dashboard. Look up any vehicle by licence plate and review its incident history &mdash; smoke incidents, damage incidents and harsh driving incidents &mdash; next to the rest of your fleet data.</p>
      <p>No separate portal to learn, and EnVue configures the integration for you.</p>
    </div>
  </div>
  <div class="feature-split feature-split--flip rc-split">
    <div class="feature-split-media"><img src="<?php echo esc_url($rc_img . 'ridecare-post-1200.webp'); ?>" width="354" height="354" alt="Earn up to $1200+ for your fleet by enforcing no-smoking policies with RideCare" loading="lazy"></div>
    <div class="reveal">
      <span class="eyebrow">Accountability That Pays</span>
      <h2>Stop absorbing costs that aren&rsquo;t your responsibility.</h2>
      <p>No more negotiation over disputes. No more wondering what happened in your vehicles. RideCare gives you the data and evidence to hold drivers and customers accountable.</p>
      <ul class="check-list">
        <li>Immediate alerts when smoking or damage occurs</li>
        <li>Data-backed evidence for smoking and damage claims</li>
        <li>GPS location data for incident documentation</li>
        <li>Up to 90% claim recovery from smoking fine charges</li>
        <li>Up to 60% reduction in smoking incidents</li>
      </ul>
    </div>
  </div>
</div></section>

<section class="section section--soft"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">How It Works</span>
    <h2 class="reveal" style="--d:1">From install to action in three steps.</h2>
  </div></div>
  <div class="rc-steps">
    <div class="rc-step reveal">
      <img src="<?php echo esc_url($rc_img . 'ridecare-device-mirror.webp'); ?>" width="340" height="228" alt="Bosch RideCare sensor mounted behind the rear-view mirror" loading="lazy">
      <div><span>Step 1</span><h3>Install in 15 minutes</h3><p>The palm-sized sensor mounts at the windshield and is up and running in about 15 minutes.</p></div>
    </div>
    <div class="rc-step reveal" style="--d:1">
      <img src="<?php echo esc_url($rc_img . 'ridecare-dash-phone.webp'); ?>" width="444" height="304" alt="RideCare incident alert on a smartphone" loading="lazy">
      <div><span>Step 2</span><h3>Detect and alert</h3><p>RideCare detects smoking, vaping, damage impacts and harsh driving and sends a real-time alert when an incident occurs.</p></div>
    </div>
    <div class="rc-step reveal" style="--d:2">
      <img src="<?php echo esc_url($rc_img . 'ridecare-dash-desk.webp'); ?>" width="404" height="272" alt="Fleet manager reviewing RideCare incident reports on a desktop" loading="lazy">
      <div><span>Step 3</span><h3>Review and enforce</h3><p>Open the detailed incident report in MyGeotab, identify who was involved and enforce your no-smoking policy with data.</p></div>
    </div>
  </div>
</div></section>

<section class="video-section"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow eyebrow--light reveal">See It in Action</span>
    <h2 class="reveal" style="--d:1">Watch Bosch RideCare at work.</h2>
    <p class="reveal" style="--d:2">See how RideCare detects incidents, decides which events get reported and delivers the reports to MyGeotab.</p>
  </div></div>
  <div class="video-embed-wrap reveal">
    <iframe src="https://www.youtube.com/embed/f8qDrhPGCzE" title="Bosch RideCare overview video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
  </div>
  <div class="rc-video-grid">
    <a class="rc-video-card reveal" href="https://www.canva.com/design/DAG1Uo0rvWY/lVJr45L8yKtLpbYIMR0cDg/watch?utm_content=DAG1Uo0rvWY&amp;utm_campaign=designshare&amp;utm_medium=link2&amp;utm_source=uniquelinks&amp;utlId=he972769f51" target="_blank" rel="noopener">
      <img src="<?php echo esc_url($rc_img . 'ridecare-video-incar.webp'); ?>" width="516" height="290" alt="" loading="lazy">
      <span>RideCare in the vehicle<small>Watch video &rarr;</small></span>
    </a>
    <a class="rc-video-card reveal" href="https://www.canva.com/design/DAG1CdUgUWA/IUDpxa0AMraHWJIxBZRYIA/watch?utm_content=DAG1CdUgUWA&amp;utm_campaign=designshare&amp;utm_medium=link2&amp;utm_source=uniquelinks&amp;utlId=hffd2e819e2" target="_blank" rel="noopener">
      <img src="<?php echo esc_url($rc_img . 'ridecare-tile-smoke.webp'); ?>" width="519" height="295" alt="" loading="lazy">
      <span>Smoke detection example<small>Watch video &rarr;</small></span>
    </a>
    <a class="rc-video-card reveal" href="https://www.canva.com/design/DAG1CYu5ntQ/UUUvwIjeXkLbTkxjJXGr5g/watch?utm_content=DAG1CYu5ntQ&amp;utm_campaign=designshare&amp;utm_medium=link2&amp;utm_source=uniquelinks&amp;utlId=hf8e6927def" target="_blank" rel="noopener">
      <img src="<?php echo esc_url($rc_img . 'ridecare-tile-events.webp'); ?>" width="520" height="295" alt="" loading="lazy">
      <span>How RideCare decides which events get reported<small>Watch video &rarr;</small></span>
    </a>
    <a class="rc-video-card reveal" href="https://www.canva.com/design/DAG1CTWzJqs/GVNBBMjaOQLSnAdbc-P0kg/watch?utm_content=DAG1CTWzJqs&amp;utm_campaign=designshare&amp;utm_medium=link2&amp;utm_source=uniquelinks&amp;utlId=h78494681e3" target="_blank" rel="noopener">
      <img src="<?php echo esc_url($rc_img . 'ridecare-tile-damage.webp'); ?>" width="520" height="295" alt="" loading="lazy">
      <span>How RideCare classifies damage events<small>Watch video &rarr;</small></span>
    </a>
    <a class="rc-video-card reveal" href="https://www.canva.com/design/DAG1ZJT5BDg/JMdie7uvC-dHwJVZzRsy5w/watch?utm_content=DAG1ZJT5BDg&amp;utm_campaign=designshare&amp;utm_medium=link2&amp;utm_source=uniquelinks&amp;utlId=h1de503b97f" target="_blank" rel="noopener">
      <img src="<?php echo esc_url($rc_img . 'ridecare-mygeotab.webp'); ?>" width="1078" height="607" alt="" loading="lazy">
      <span>MyGeotab walk-through: accessing reports<small>Watch video &rarr;</small></span>
    </a>
  </div>
</div></section>

<section class="section section--soft"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">Benefits</span>
    <h2 class="reveal" style="--d:1">What leading fleets get from RideCare.</h2>
    <p class="reveal" style="--d:2">Leading fleets already use RideCare to detect smoking, vaping and damage in real time &mdash; and to stop paying for incidents they didn&rsquo;t cause.</p>
  </div></div>
  <ul class="check-list check-list--2col reveal">
      <li><strong>Up to 60% fewer smoking incidents</strong> &mdash; drivers know smoking and vaping get detected</li>
      <li><strong>$1,000 saved per prevented event</strong> &mdash; avoid cleaning, downtime and lost resale value</li>
      <li><strong>Higher customer satisfaction</strong> &mdash; cleaner vehicles and protected asset values</li>
      <li><strong>Data-backed policy enforcement</strong> &mdash; identify which driver smoked</li>
      <li><strong>Potential insurance savings</strong> &mdash; through proven safety measures</li>
      <li><strong>Up to 90% claim recovery</strong> &mdash; from smoking fine charges</li>
      <li><strong>15-minute installation</strong> &mdash; a palm-sized sensor per vehicle</li>
      <li><strong>MyGeotab integration</strong> &mdash; incident reports where you already work</li>
  </ul>
  <div class="cta-strip">
    <div>
      <h3>Don&rsquo;t wait for an accident to address the problem.</h3>
      <p>Talk to an EnVue fleet advisor about protecting your drivers and your business with RideCare.</p>
    </div>
    <a class="button-white" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Schedule a RideCare Demo &rarr;</a>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head"><div>
    <span class="eyebrow reveal">Learn More</span>
    <h2 class="reveal" style="--d:1">RideCare resources.</h2>
  </div><div class="reveal" style="--d:2">
    <p>Read more about Bosch RideCare from Bosch and Geotab, including customer reviews and a real-world case study.</p>
  </div></div>
  <div class="rc-links">
    <a href="https://us.bosch-press.com/pressportal/us/en/press-release-16000.html" target="_blank" rel="noopener"><strong>Bosch press release &rarr;</strong><small>Safe and sound from A to B: Bosch RideCare helps keep carsharing vehicles in impeccable condition.</small></a>
    <a href="https://marketplace.geotab.com/hub/post/this-one-habit-could-be-creating-a-safety-compliance-and-cost-risk-for-your-fleet/" target="_blank" rel="noopener"><strong>Geotab Marketplace article &rarr;</strong><small>This one habit could be creating a safety, compliance and cost risk for your fleet.</small></a>
    <a href="https://marketplace.geotab.com/solutions/ridecare/solution-reviews/" target="_blank" rel="noopener"><strong>RideCare customer reviews &rarr;</strong><small>What fleets say about RideCare on the Geotab Marketplace.</small></a>
    <a href="https://www.geotab.com/case-study/swiftride/" target="_blank" rel="noopener"><strong>Swift Ride case study &rarr;</strong><small>Swift Ride eliminates fleet theft and saves over $400K annually (includes RideCare).</small></a>
  </div>
</div></section>

<?php
echo envue_faq_section([
    'What is Bosch RideCare?' => '<p>Bosch RideCare is a palm-sized in-vehicle sensor that detects smoking and vaping, damage impacts and harsh driving in real time. It sends instant alerts when an incident occurs and creates detailed incident reports you can use as evidence.</p>',
    'What does RideCare detect?' => '<p>RideCare detects smoking and vaping events, damage impacts (with automatic severity classification, cosmetic vs. severe) and harsh driving behavior. Incident reports include GPS location data.</p>',
    'How long does RideCare take to install?' => '<p>RideCare can be installed in about 15 minutes per vehicle.</p>',
    'Does RideCare work with MyGeotab?' => '<p>Yes. RideCare adds directly into your existing MyGeotab dashboard, where you can look up a vehicle and review its smoke, damage and harsh driving incident history.</p>',
    'Can RideCare identify which driver smoked?' => '<p>Yes. RideCare identifies which driver smoked, giving you data-backed evidence to enforce no-smoking policies and recover cleaning or fine charges.</p>',
    'How does RideCare protect driver privacy?' => '<p>RideCare detects smoking through molecular detection technology, which maintains privacy and helps fleets meet union and workplace standards.</p>',
    'How much can RideCare save my fleet?' => '<p>Each smoking incident can cost $300&ndash;$500 in cleaning and $100&ndash;$500 in downtime, plus reduced resale value. Leading fleets using RideCare have cut smoking incidents by up to 60% and save about $1,000 per prevented event.</p>',
], 'Frequently Asked Questions About Bosch RideCare');
?>

</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div>
    <span class="eyebrow eyebrow--light">Bosch RideCare + EnVue</span>
    <h2>Protect your fleet with RideCare.</h2>
  </div>
  <div>
    <p>Contact our fleet advisors for a free consultation and a RideCare demo configured for your fleet and MyGeotab setup.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Get a Demo <span>&rarr;</span></a>
      <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
    </div>
  </div>
</div></section>
<?php get_footer(); ?>
