<?php
/**
 * Bosch RideCare partner page (/boschridecare/).
 *
 * Copy, figures and images come from Bosch's RideCare Reseller Marketing Kit
 * (2025), checked against the Bosch press release and the Geotab Marketplace
 * listing (v6.19 audit, see wordpress/RIDECARE_CHANGELOG.md). Images in
 * assets/images/ridecare/ are cropped from that kit. Figures are Bosch-reported
 * and marked as such; don't add claims the sources don't make.
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
.rc-split p a{color:var(--brand);text-decoration:underline;text-underline-offset:2px;}

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
#how-it-works,#steps{scroll-margin-top:calc(var(--header-h) + 16px);}
.rc-note{max-width:820px;margin:20px auto 0;font-size:13.5px;line-height:1.55;color:var(--slate);text-align:center;}
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
        <span class="eyebrow eyebrow--light">Bosch RideCare &middot; Deployed by EnVue Telematics</span>
        <h1>Know What Happens in Your Vehicles. Even When You&rsquo;re Not There.</h1>
        <p>Bosch RideCare helps fleet operators detect smoking, vaping, and potential vehicle damage, providing actionable incident information to help protect vehicles, improve accountability, and reduce avoidable costs. EnVue Telematics installs it and connects it to MyGeotab for you.</p>
        <div class="hero-actions">
          <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Request a RideCare Demo <span>&rarr;</span></a>
          <a class="button button-ghost button-lg" href="#how-it-works">See How RideCare Works</a>
        </div>
      </div>
      <div class="rc-hero-media">
        <img src="<?php echo esc_url($rc_img . 'ridecare-awareness.webp'); ?>" width="459" height="444" alt="Bosch RideCare sensor mounted on the inside of a vehicle windshield" loading="eager" fetchpriority="high">
      </div>
    </div>
  </div>
</section>

<section aria-label="RideCare at a glance"><div class="wrap"><div class="stat-band">
  <div><strong>15 min</strong><span>Typical installation per vehicle</span></div>
  <div><strong>Up to 60%</strong><span>Fewer smoking incidents, as reported by Bosch*</span></div>
  <div><strong>$300&ndash;$500</strong><span>Estimated cleaning cost per smoking incident*</span></div>
  <div><strong>MyGeotab</strong><span>Incident reports in your existing dashboard</span></div>
</div></div></section>

<?php echo envue_partner_logo('boschridecare', 'Bosch RideCare'); ?>

<section class="video-section" id="how-it-works"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow eyebrow--light reveal">See How RideCare Works</span>
    <h2 class="reveal" style="--d:1">Watch Bosch RideCare at work.</h2>
    <p class="reveal" style="--d:2">Bosch&rsquo;s overview shows how the sensor detects incidents and how fleet operators receive and review them.</p>
  </div></div>
  <div class="video-embed-wrap reveal">
    <iframe src="https://www.youtube.com/embed/f8qDrhPGCzE" title="Bosch RideCare overview video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
  </div>
  <p class="reveal" style="text-align:center;color:rgba(255,255,255,.75);margin:28px 0 0;">More demonstrations from Bosch (open on Canva in a new tab):</p>
  <div class="rc-video-grid">
    <a class="rc-video-card reveal" href="https://www.canva.com/design/DAG1Uo0rvWY/lVJr45L8yKtLpbYIMR0cDg/watch?utm_content=DAG1Uo0rvWY&amp;utm_campaign=designshare&amp;utm_medium=link2&amp;utm_source=uniquelinks&amp;utlId=he972769f51" target="_blank" rel="noopener">
      <img src="<?php echo esc_url($rc_img . 'ridecare-video-incar.webp'); ?>" width="516" height="290" alt="" loading="lazy">
      <span>RideCare in the vehicle<small>Watch on Canva &rarr;</small></span>
    </a>
    <a class="rc-video-card reveal" href="https://www.canva.com/design/DAG1CdUgUWA/IUDpxa0AMraHWJIxBZRYIA/watch?utm_content=DAG1CdUgUWA&amp;utm_campaign=designshare&amp;utm_medium=link2&amp;utm_source=uniquelinks&amp;utlId=hffd2e819e2" target="_blank" rel="noopener">
      <img src="<?php echo esc_url($rc_img . 'ridecare-tile-smoke.webp'); ?>" width="519" height="295" alt="" loading="lazy">
      <span>Smoke detection example<small>Watch on Canva &rarr;</small></span>
    </a>
    <a class="rc-video-card reveal" href="https://www.canva.com/design/DAG1CYu5ntQ/UUUvwIjeXkLbTkxjJXGr5g/watch?utm_content=DAG1CYu5ntQ&amp;utm_campaign=designshare&amp;utm_medium=link2&amp;utm_source=uniquelinks&amp;utlId=hf8e6927def" target="_blank" rel="noopener">
      <img src="<?php echo esc_url($rc_img . 'ridecare-tile-events.webp'); ?>" width="520" height="295" alt="" loading="lazy">
      <span>How RideCare decides which events get reported<small>Watch on Canva &rarr;</small></span>
    </a>
    <a class="rc-video-card reveal" href="https://www.canva.com/design/DAG1CTWzJqs/GVNBBMjaOQLSnAdbc-P0kg/watch?utm_content=DAG1CTWzJqs&amp;utm_campaign=designshare&amp;utm_medium=link2&amp;utm_source=uniquelinks&amp;utlId=h78494681e3" target="_blank" rel="noopener">
      <img src="<?php echo esc_url($rc_img . 'ridecare-tile-damage.webp'); ?>" width="520" height="295" alt="" loading="lazy">
      <span>How RideCare classifies damage events<small>Watch on Canva &rarr;</small></span>
    </a>
    <a class="rc-video-card reveal" href="https://www.canva.com/design/DAG1ZJT5BDg/JMdie7uvC-dHwJVZzRsy5w/watch?utm_content=DAG1ZJT5BDg&amp;utm_campaign=designshare&amp;utm_medium=link2&amp;utm_source=uniquelinks&amp;utlId=h1de503b97f" target="_blank" rel="noopener">
      <img src="<?php echo esc_url($rc_img . 'ridecare-mygeotab.webp'); ?>" width="1078" height="607" alt="" loading="lazy">
      <span>MyGeotab walk-through: accessing reports<small>Watch on Canva &rarr;</small></span>
    </a>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head"><div>
    <span class="eyebrow reveal">About Bosch RideCare</span>
    <h2 class="reveal" style="--d:1">Fleet smoking detection and vehicle damage detection in one sensor.</h2>
  </div><div class="reveal" style="--d:2">
    <p>Bosch RideCare is a palm-sized sensor that mounts on the inside of the windshield and typically installs in about 15 minutes. It detects smoking and vaping, damage impacts, and harsh driving, and Bosch&rsquo;s cloud software turns that sensor data into incident reports with time and location. RideCare uses sensor-based detection to identify potential smoking events without relying on in-cabin video footage. EnVue Telematics deploys RideCare alongside your Geotab telematics so incidents show up in the MyGeotab dashboard you already use.</p>
  </div></div>

  <div class="feature-split rc-split">
    <div class="feature-split-media"><img src="<?php echo esc_url($rc_img . 'ridecare-device-hand.webp'); ?>" width="338" height="228" alt="Palm-sized Bosch RideCare sensor held in one hand" loading="lazy"></div>
    <div class="reveal">
      <span class="eyebrow">What RideCare Detects</span>
      <h2>Find out when smoking, vaping, or damage happens.</h2>
      <p>When RideCare detects an event, you get an alert and a detailed incident report you can use as documentation, so you can address problems before they turn into bigger costs.</p>
      <ul class="check-list">
        <li><strong>Smoking and vaping:</strong> sensor-based detection of potential smoking and vaping events</li>
        <li><strong>Damage impacts:</strong> Bosch classifies the intensity of an impact, helping separate cosmetic damage from damage that needs prompt attention</li>
        <li><strong>Harsh driving:</strong> flagged alongside your other driver data</li>
        <li><strong>Alerts:</strong> detected events are sent by email and appear in MyGeotab</li>
        <li><strong>Incident reports with GPS data:</strong> time and location for claims and policy enforcement</li>
      </ul>
      <p>Available features and alert settings depend on your RideCare plan and configuration. EnVue confirms what your fleet will get during setup.</p>
    </div>
  </div>
  <div class="feature-split feature-split--flip rc-split">
    <div class="feature-split-media"><img src="<?php echo esc_url($rc_img . 'ridecare-post-2x.webp'); ?>" width="350" height="350" alt="Bosch graphic: 2.2x higher risk of accidents was linked to smoking in vehicles" loading="lazy"></div>
    <div class="reveal">
      <span class="eyebrow">Why It Matters</span>
      <h2>Smoking at the wheel isn&rsquo;t just a health issue. It&rsquo;s a safety risk.</h2>
      <p>A driver who smokes while driving deals with three distractions at once:</p>
      <ul class="check-list">
        <li><strong>Visual:</strong> eyes off the road</li>
        <li><strong>Manual:</strong> hands off the wheel</li>
        <li><strong>Cognitive:</strong> mind off driving</li>
      </ul>
      <p>For fleet operators, the costs go beyond accidents: insurance claims, liability exposure, cleaning, downtime, lower resale value, and unhappy customers. Bosch estimates $300&ndash;$500 in cleaning and $100&ndash;$500 in downtime per smoking incident.</p>
    </div>
  </div>
  <div class="feature-split rc-split">
    <div class="feature-split-media"><img class="rc-wide" src="<?php echo esc_url($rc_img . 'ridecare-mygeotab.webp'); ?>" width="1078" height="607" alt="RideCare add-in in MyGeotab showing incident history for smoke, damage and harsh driving incidents" loading="lazy"></div>
    <div class="reveal">
      <span class="eyebrow">MyGeotab Integration</span>
      <h2>Incident reports inside the dashboard you already use.</h2>
      <p>RideCare adds into your existing MyGeotab dashboard. Look up a vehicle by license plate and review its incident history, including smoke, damage, and harsh driving incidents, next to the rest of your fleet data.</p>
      <p>There&rsquo;s no separate portal to learn, and EnVue configures the integration for you.</p>
    </div>
  </div>
  <div class="feature-split feature-split--flip rc-split">
    <div class="feature-split-media"><img src="<?php echo esc_url($rc_img . 'ridecare-post-smoke.webp'); ?>" width="431" height="431" alt="Bosch graphic: it costs about $500 to remove smoke residue and odors from vehicles" loading="lazy"></div>
    <div class="reveal">
      <span class="eyebrow">Accountability</span>
      <h2>Stop absorbing costs that aren&rsquo;t your responsibility.</h2>
      <p>RideCare helps strengthen incident documentation and support more informed dispute resolution, so you spend less time guessing what happened in your vehicles.</p>
      <ul class="check-list">
        <li>Alerts when a smoking or damage event is detected</li>
        <li>Incident data to support smoking and damage claims</li>
        <li>GPS location and time for incident documentation</li>
        <li>Associates detected smoking events with available vehicle and trip information to support driver accountability</li>
        <li>Bosch reports fleets recovering up to 90% of smoking fine charges<sup>*</sup></li>
      </ul>
    </div>
  </div>
  <div class="feature-split rc-split">
    <div class="feature-split-media"><img src="<?php echo esc_url($rc_img . 'ridecare-use-tablet.webp'); ?>" width="380" height="256" alt="Fleet operator checking a shared vehicle with a tablet" loading="lazy"></div>
    <div class="reveal">
      <span class="eyebrow">Limo, Rental &amp; Shared Fleets</span>
      <h2>Protect the Vehicle. Protect the Experience.</h2>
      <p>For limousine, chauffeured transportation, rental, and shared-vehicle operators, vehicle condition directly affects the customer experience and operating costs. Bosch RideCare helps provide visibility into potential smoking, vaping, and damage incidents so operators can respond with better information, protect their assets, and maintain high service standards.</p>
      <p>It also works for commercial and logistics fleets that want to keep vehicles smoke-free and assign responsibility for damage. See our <a href="<?php echo esc_url(home_url('/leasing-rental/')); ?>">leasing and rental fleet solutions</a>.</p>
    </div>
  </div>
</div></section>

<section class="section section--soft" id="steps"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">How It Works</span>
    <h2 class="reveal" style="--d:1">From install to action in three steps.</h2>
  </div></div>
  <div class="rc-steps">
    <div class="rc-step reveal">
      <img src="<?php echo esc_url($rc_img . 'ridecare-device-mirror.webp'); ?>" width="340" height="228" alt="Bosch RideCare sensor mounted behind the rear-view mirror" loading="lazy">
      <div><span>Step 1</span><h3>Install in about 15 minutes</h3><p>The palm-sized sensor mounts on the inside of the windshield and receives updates over the air.</p></div>
    </div>
    <div class="rc-step reveal" style="--d:1">
      <img src="<?php echo esc_url($rc_img . 'ridecare-dash-phone.webp'); ?>" width="444" height="304" alt="RideCare incident alert on a smartphone" loading="lazy">
      <div><span>Step 2</span><h3>Detect and alert</h3><p>RideCare detects smoking, vaping, damage impacts, and harsh driving, and sends an alert when an event is detected.</p></div>
    </div>
    <div class="rc-step reveal" style="--d:2">
      <img src="<?php echo esc_url($rc_img . 'ridecare-dash-desk.webp'); ?>" width="404" height="272" alt="Fleet manager reviewing RideCare incident reports on a desktop" loading="lazy">
      <div><span>Step 3</span><h3>Review and act</h3><p>Open the incident report in MyGeotab, match it to the vehicle and trip, and apply your no-smoking and damage policies with data.</p></div>
    </div>
  </div>
  <div class="cta-strip">
    <div>
      <h3>See RideCare on your own fleet.</h3>
      <p>An EnVue fleet advisor will walk you through RideCare and how it fits your vehicles and MyGeotab setup.</p>
    </div>
    <a class="button-white" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Request a RideCare Demo &rarr;</a>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">Benefits</span>
    <h2 class="reveal" style="--d:1">What fleets get from Bosch RideCare.</h2>
    <p class="reveal" style="--d:2">Fleets use RideCare to detect smoking, vaping, and damage, and to stop paying for incidents they didn&rsquo;t cause.</p>
  </div></div>
  <ul class="check-list check-list--2col reveal">
      <li><strong>Fewer smoking incidents:</strong> Bosch reports up to 60% fewer once drivers know smoking and vaping are detected<sup>*</sup></li>
      <li><strong>Lower cleanup costs:</strong> Bosch estimates about $1,000 saved per prevented event across cleaning, downtime, and resale value<sup>*</sup></li>
      <li><strong>A better customer experience:</strong> cleaner vehicles and better-protected assets</li>
      <li><strong>Data-backed policy enforcement:</strong> incident records tied to the vehicle, time, and location</li>
      <li><strong>Potential insurance savings:</strong> fewer incidents and better documentation may help; results depend on your insurer</li>
      <li><strong>Charge recovery:</strong> Bosch reports up to 90% recovery of smoking fine charges<sup>*</sup></li>
      <li><strong>Fast installation:</strong> one palm-sized sensor per vehicle, about 15 minutes</li>
      <li><strong>MyGeotab integration:</strong> incident reports where you already work</li>
  </ul>
  <p class="rc-note">* Figures come from Bosch&rsquo;s RideCare marketing materials (2025). They are Bosch-reported, &ldquo;up to&rdquo; results and estimates, not guarantees. Actual results depend on your fleet, policies, and how incidents are enforced.</p>
</div></section>

<section class="section section--soft"><div class="wrap">
  <div class="section-head"><div>
    <span class="eyebrow reveal">Learn More</span>
    <h2 class="reveal" style="--d:1">RideCare resources.</h2>
  </div><div class="reveal" style="--d:2">
    <p>Read more about Bosch RideCare from Bosch and Geotab, including customer reviews and a fleet that is piloting RideCare.</p>
  </div></div>
  <div class="rc-links">
    <a href="https://us.bosch-press.com/pressportal/us/en/press-release-16000.html" target="_blank" rel="noopener"><strong>Bosch press release &rarr;</strong><small>Safe and sound from A to B: Bosch RideCare helps keep carsharing vehicles in impeccable condition.</small></a>
    <a href="https://marketplace.geotab.com/hub/post/this-one-habit-could-be-creating-a-safety-compliance-and-cost-risk-for-your-fleet/" target="_blank" rel="noopener"><strong>Geotab Marketplace article &rarr;</strong><small>This one habit could be creating a safety, compliance and cost risk for your fleet.</small></a>
    <a href="https://marketplace.geotab.com/solutions/ridecare/solution-reviews/" target="_blank" rel="noopener"><strong>RideCare customer reviews &rarr;</strong><small>What fleets say about RideCare on the Geotab Marketplace.</small></a>
    <a href="https://www.geotab.com/case-study/swiftride/" target="_blank" rel="noopener"><strong>Swift Ride case study (Geotab) &rarr;</strong><small>Swift Ride is piloting RideCare to detect smoke and vape violations and apply a $25 fine per incident. The case study&rsquo;s $400K savings figure comes from its wider Geotab program.</small></a>
  </div>
</div></section>

<?php
echo envue_faq_section([
    'What is Bosch RideCare?' => '<p>Bosch RideCare is a palm-sized in-vehicle sensor that detects smoking and vaping, damage impacts, and harsh driving. When it detects an event, it sends an alert and creates an incident report with time and location that you can use as documentation.</p>',
    'What does RideCare detect?' => '<p>RideCare detects potential smoking and vaping events, damage impacts, and harsh driving. For damage, Bosch classifies the intensity of the impact to help separate cosmetic damage from damage that needs prompt attention. Incident reports include GPS location data. Available features depend on your plan and configuration.</p>',
    'How long does RideCare take to install?' => '<p>RideCare typically installs in about 15 minutes per vehicle, and the sensor receives updates over the air.</p>',
    'Does RideCare work with MyGeotab?' => '<p>Yes. RideCare adds into your existing MyGeotab dashboard, where you can look up a vehicle and review its smoke, damage, and harsh driving incident history. Detected events are also sent by email, and Bosch offers an API connection for other systems.</p>',
    'Can RideCare identify which driver smoked?' => '<p>RideCare detects the event in the vehicle. It associates detected smoking events with available vehicle and trip information, such as time and location, to support driver accountability. Matching an event to a specific person depends on your driver assignments or rental records.</p>',
    'Does RideCare use an in-cabin camera?' => '<p>RideCare uses sensor-based detection to identify potential smoking events without relying on in-cabin video footage. Fleets should still review their own privacy, labor, and workplace policies before deployment.</p>',
    'Is RideCare a good fit for limo, rental, and shared-vehicle fleets?' => '<p>Yes. Vehicle condition directly affects the customer experience in limousine, chauffeured, rental, and carsharing fleets. RideCare gives these operators visibility into potential smoking, vaping, and damage incidents. It also suits commercial fleets that want smoke-free vehicles and clear records of damage.</p>',
    'How much can RideCare save my fleet?' => '<p>Bosch estimates each smoking incident can cost $300&ndash;$500 in cleaning and $100&ndash;$500 in downtime, plus lower resale value. Bosch reports fleets cutting smoking incidents by up to 60% and estimates about $1,000 saved per prevented event. Results vary by fleet, policies, and enforcement.</p>',
], 'Frequently Asked Questions About Bosch RideCare');
?>

</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div>
    <span class="eyebrow eyebrow--light">Bosch RideCare + EnVue Telematics</span>
    <h2>Protect your fleet with Bosch RideCare.</h2>
  </div>
  <div>
    <p>Talk to an EnVue fleet advisor for a free consultation and a RideCare demo set up for your fleet and MyGeotab account.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Request a RideCare Demo <span>&rarr;</span></a>
      <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
    </div>
  </div>
</div></section>
<?php get_footer(); ?>
