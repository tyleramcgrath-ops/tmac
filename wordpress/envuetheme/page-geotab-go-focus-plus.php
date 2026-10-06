<?php
/**
 * Geotab GO Focus Plus product page (/geotab-go-focus-plus/).
 *
 * Built from Geotab's AI/LLM-optimized "single product" page template
 * (Partner AI Toolkit, GO Focus family). Copy, heading levels and the ten
 * Q&As are Geotab-verified; keep them word-for-word. The Q&A arrays below
 * feed both the visible page and the FAQPage schema, so the schema always
 * matches what visitors see (a Google requirement).
 */

$gfp_url  = home_url( '/geotab-go-focus-plus/' );
$gfp_img  = get_template_directory_uri() . '/assets/images/go-focus-plus-camera.png';

$gfp_qa = [
	'What is GO Focus Plus?'                          => 'GO Focus Plus is a dual-facing AI dash cam that combines road-facing video, driver monitoring, real-time coaching alerts and automated safety workflows to help fleets improve safety and reduce risk.',
	'What behaviors can GO Focus Plus detect?'        => 'GO Focus Plus can identify behaviors including phone use, distraction, drowsiness, seatbelt violations, tailgating, rolling stops, swerving and other risky driving events.',
	'Does GO Focus Plus provide real-time coaching?'   => 'Yes. GO Focus Plus delivers real-time verbal alerts in the cab, helping drivers self-correct unsafe behaviors as they occur.',
	'How is GO Focus Plus different from GO Focus?'   => 'GO Focus is a privacy-focused road-facing camera that captures event-based video. GO Focus Plus adds driver monitoring, real-time coaching, live streaming, automated coaching workflows and expanded AI detection capabilities.',
	'Which fleets are a good fit for GO Focus Plus?'  => 'GO Focus Plus is ideal for fleets seeking proactive driver coaching, improved behavior visibility, enhanced safety programs and AI-powered risk reduction.',
];
$gfp_faq = [
	'Is GO Focus Plus always recording?'                 => 'GO Focus Plus supports continuous recording and live streaming capabilities while also generating AI-powered safety events and coaching opportunities.',
	'Does GO Focus Plus include a driver-facing camera?' => 'Yes. GO Focus Plus includes both road-facing and driver-facing cameras to support Driver Monitoring System functionality and driver coaching programs.',
	'Can GO Focus Plus help improve driver behavior?'    => 'Yes. GO Focus Plus provides real-time verbal alerts, driver coaching workflows, risk scoring and behavior prioritization to support safer driving habits.',
	'Does GO Focus Plus integrate with MyGeotab?'        => 'Yes. GO Focus Plus integrates with MyGeotab and the Geotab Video platform, allowing fleets to review video events, coaching opportunities and safety trends.',
	'Does GO Focus Plus support driver privacy?'         => 'Yes. GO Focus Plus includes privacy-focused design options that help fleets balance safety visibility with driver acceptance and privacy.',
];

// FAQPage schema: all ten Q&As, printed once in the footer by the theme.
foreach ( $gfp_qa + $gfp_faq as $q => $a ) {
	$GLOBALS['envue_faq_entities'][] = [
		'@type'          => 'Question',
		'name'           => $q,
		'acceptedAnswer' => [ '@type' => 'Answer', 'text' => $a ],
	];
}
// This page prints its own BreadcrumbList (below), so the theme skips its generic one.
$GLOBALS['envue_own_breadcrumb'] = true;

get_header(); ?>
<main id="main">

<style>
.gfp-hero{background:radial-gradient(900px 520px at 85% 10%,#1d3f63 0%,transparent 65%),var(--bg-deep-2);color:#fff;padding:calc(40px + var(--header-h) + var(--topbar-h)) 0 64px;overflow:hidden;}
.gfp-hero .breadcrumb,.gfp-hero .breadcrumb a{color:rgba(255,255,255,.7);}
.gfp-hero-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:40px;align-items:center;margin-top:20px;}
.gfp-hero h1{color:#fff;font-size:clamp(40px,5.4vw,68px);line-height:1.04;margin:0 0 20px;letter-spacing:-.02em;}
.gfp-hero h1 sup{font-size:.4em;vertical-align:super;}
.gfp-hero .gfp-sub{color:#fff;font-size:clamp(20px,2.1vw,26px);line-height:1.3;font-weight:700;margin:0 0 28px;max-width:30ch;}
.gfp-hero-media img{display:block;width:100%;max-width:560px;height:auto;margin-left:auto;filter:drop-shadow(0 30px 40px rgba(0,0,0,.35));}
@media(max-width:900px){.gfp-hero-grid{grid-template-columns:1fr;}.gfp-hero-media img{margin:0 auto;max-width:420px;}}

.gfp-glance{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:56px;align-items:start;}
.gfp-glance h2{margin:0 0 20px;}
.gfp-glance p{font-size:18px;line-height:1.6;color:var(--ink-2);margin:0 0 16px;}
.gfp-ticks{list-style:none;margin:0;padding:0;}
.gfp-ticks li{position:relative;padding:11px 0 11px 34px;border-top:1px solid var(--line-2);font-size:15.5px;line-height:1.45;color:var(--ink);}
.gfp-ticks li:last-child{border-bottom:1px solid var(--line-2);}
.gfp-ticks li::before{content:"";position:absolute;left:0;top:12px;width:20px;height:20px;border-radius:50%;background:var(--bg-deep-2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M5.5 10.5l3 3 6-6.5' fill='none' stroke='%23fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/20px no-repeat;}
@media(max-width:900px){.gfp-glance{grid-template-columns:1fr;gap:32px;}}

.gfp-center{text-align:center;max-width:860px;margin:0 auto 40px;}
.gfp-center h2{margin:0;}
.gfp-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;}
.gfp-card{background:var(--bg-tint);border-radius:22px;padding:34px 32px;color:var(--ink);}
.gfp-card--dark{background:var(--bg-deep-2);color:#fff;}
.gfp-card h3{font-size:22px;line-height:1.25;margin:0 0 16px;color:inherit;}
.gfp-card h4{font-size:16px;margin:0 0 8px;color:inherit;}
.gfp-card p{margin:0;font-size:15.5px;line-height:1.6;color:var(--slate);}
.gfp-card--dark p{color:rgba(255,255,255,.82);}
.gfp-card hr{border:0;border-top:1px solid var(--line-2);margin:20px 0;}
.gfp-card--dark hr{border-top-color:rgba(255,255,255,.22);}
@media(max-width:760px){.gfp-cards{grid-template-columns:1fr;}.gfp-card{padding:28px 24px;}}

.gfp-photo{display:block;width:100%;height:clamp(240px,32vw,440px);object-fit:cover;object-position:center 40%;}

.gfp-steps{list-style:none;margin:0 auto 64px;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px;max-width:980px;counter-reset:s;}
.gfp-steps li{text-align:center;position:relative;font-size:15.5px;line-height:1.45;color:var(--ink-2);}
.gfp-steps li:not(:last-child)::after{content:"";position:absolute;top:34px;left:calc(50% + 46px);right:calc(-50% + 34px);border-top:2px dotted var(--line-2);}
.gfp-step-ico{width:68px;height:68px;border-radius:50%;background:var(--bg-deep-2);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}
.gfp-step-ico svg{width:32px;height:32px;stroke:#fff;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;}
@media(max-width:760px){.gfp-steps{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:32px;}.gfp-steps li::after{display:none;}}

.gfp-events{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px;max-width:980px;margin:0 auto;}
.gfp-events h4{font-size:16px;margin:0 0 6px;}
.gfp-events ul{list-style:none;margin:0;padding:0;}
.gfp-events li{padding:9px 0;border-bottom:1px solid var(--line-2);font-size:15px;color:var(--ink-2);}
@media(max-width:760px){.gfp-events{grid-template-columns:1fr;gap:24px;}}

.gfp-qa{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:48px;align-items:start;}
.gfp-qa > h2{margin:0;}
.gfp-qa-list{border-top:1px solid var(--line-2);}
.gfp-qa-item{padding:22px 0;border-bottom:1px solid var(--line-2);}
.gfp-qa-item h3{font-size:18px;line-height:1.35;margin:0 0 8px;color:var(--ink);}
.gfp-qa-item p{margin:0;font-size:15.5px;line-height:1.65;color:var(--slate);}
@media(max-width:900px){.gfp-qa{grid-template-columns:1fr;gap:20px;}}

.gfp-table{width:100%;border-collapse:collapse;background:#fff;font-size:15px;}
.gfp-table th{background:var(--bg-deep-2);color:#fff;text-align:left;padding:16px 18px;font-weight:700;}
.gfp-table td{padding:16px 18px;border-bottom:1px solid var(--line);color:var(--ink-2);}
.gfp-table td:first-child{font-weight:700;color:var(--ink);}
.gfp-table tr.is-current td{background:var(--brand-pale);}
.gfp-table-wrap{overflow-x:auto;border-radius:var(--r);box-shadow:0 1px 0 var(--line);}
.gfp-fit{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin-top:20px;}
.gfp-panel{background:#fff;border-radius:var(--r);padding:30px 28px;}
.gfp-panel h3{font-size:22px;line-height:1.25;margin:0 0 18px;}
.gfp-panel > p{margin:0 0 4px;font-size:15px;color:var(--slate);padding-bottom:10px;border-bottom:1px solid var(--line-2);}
.gfp-panel ul{list-style:none;margin:0;padding:0;}
.gfp-panel li{padding:10px 0;border-bottom:1px solid var(--line-2);font-size:15px;color:var(--ink-2);}
.gfp-caps{width:100%;border-collapse:collapse;font-size:15px;}
.gfp-caps th{text-align:left;padding:0 0 10px;border-bottom:1px solid var(--line-2);}
.gfp-caps td{padding:10px 0;border-bottom:1px solid var(--line-2);color:var(--ink-2);}
.gfp-caps td:last-child,.gfp-caps th:last-child{text-align:right;white-space:nowrap;padding-left:12px;}
@media(max-width:760px){.gfp-fit{grid-template-columns:1fr;}.gfp-panel{padding:26px 22px;}}

.gfp-envue{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:48px;align-items:center;}
.gfp-envue-logo{background:var(--bg-deep-2);border-radius:var(--r-lg);display:flex;align-items:center;justify-content:center;padding:48px;min-height:240px;}
.gfp-envue-logo img{max-width:220px;height:auto;filter:brightness(0) invert(1);}
@media(max-width:900px){.gfp-envue{grid-template-columns:1fr;gap:28px;}}
</style>

<!-- Block 1: page heading -->
<section class="gfp-hero">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Home</a> / <a href="<?php echo esc_url( home_url( '/dash-cams/' ) ); ?>">AI Dash Cams</a> / <a href="<?php echo esc_url( $gfp_url ); ?>">GO Focus Plus AI Dash Cam</a></nav>
    <div class="gfp-hero-grid">
      <div>
        <h1>GO Focus Plus<sup>&trade;</sup><br>AI Dash Cam</h1>
        <h2 class="gfp-sub">Dual-Facing Video Telematics and Driver Coaching for Safer Fleets</h2>
        <div class="hero-actions">
          <a class="button button-primary button-lg" href="<?php echo esc_url( home_url( '/get-in-touch/' ) ); ?>">Request a Demo <span>&rarr;</span></a>
          <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
        </div>
      </div>
      <div class="gfp-hero-media">
        <img src="<?php echo esc_url( $gfp_img ); ?>" width="991" height="717" alt="Geotab GO Focus Plus dual-facing AI dash cam with road-facing and driver-facing cameras" fetchpriority="high">
      </div>
    </div>
  </div>
</section>

<!-- Blocks 2 + 3: direct answer and at-a-glance list -->
<section class="section section--soft"><div class="wrap gfp-glance">
  <div>
    <h2>At-a-Glance</h2>
    <p>GO Focus Plus&trade; is a dual-facing AI dash cam that combines road-facing video, driver monitoring, real-time coaching alerts and automated safety workflows to help fleets reduce risk, improve driver behavior and gain visibility into critical safety events.</p>
    <p>By combining AI-powered video intelligence with Geotab telematics, GO Focus Plus helps fleets identify risky behaviors, coach drivers more effectively and create safer driving habits across their operations.</p>
  </div>
  <ul class="gfp-ticks">
    <li>Dual-facing AI dash cam for commercial fleets</li>
    <li>Driver-facing and road-facing cameras</li>
    <li>Real-time in-cab verbal coaching alerts</li>
    <li>Driver Monitoring System (DMS) and Advanced Driver Assistance Systems (ADAS)</li>
    <li>Automated coaching workflows and driver risk scoring</li>
    <li>Live streaming and continuous recording capabilities</li>
    <li>Auto-pairing with Geotab GO devices and self-calibration</li>
    <li>Supports driver coaching, incident review and safety improvement programs</li>
    <li>Integrated with MyGeotab and Geotab Video platform</li>
    <li>Privacy controls designed to support driver acceptance</li>
  </ul>
</div></section>

<!-- Block 4: problem > solution -->
<section class="section"><div class="wrap">
  <div class="gfp-center"><h2>How GO Focus Plus Helps Fleets Address Common Safety Challenges</h2></div>
  <div class="gfp-cards">
    <div class="gfp-card">
      <h3>Reduce distracted driving and risky driver behavior</h3>
      <p>Fleet managers often know when incidents happen but lack visibility into the behaviors that lead to collisions.</p>
      <hr>
      <h4>GO Focus Plus solution</h4>
      <p>GO Focus Plus uses AI-powered Driver Monitoring System (DMS) technology to detect behaviors such as phone use, distraction, drowsiness, seatbelt violations and other risky driving habits. Real-time verbal coaching alerts help drivers self-correct before incidents occur.</p>
    </div>
    <div class="gfp-card gfp-card--dark">
      <h3>Strengthen incident documentation and claims management</h3>
      <p>Without video evidence and context, fleets can struggle to investigate incidents and defend against disputed claims.</p>
      <hr>
      <h4>GO Focus Plus solution</h4>
      <p>GO Focus Plus captures video evidence, telematics data and behavioral context before, during and after safety events, helping fleets accelerate investigations and improve incident documentation.</p>
    </div>
    <div class="gfp-card gfp-card--dark">
      <h3>Improve driver coaching effectiveness</h3>
      <p>Traditional safety programs often rely on manual reviews and delayed coaching conversations.</p>
      <hr>
      <h4>GO Focus Plus solution</h4>
      <p>GO Focus Plus automatically prioritizes risky behaviors and drivers, helping managers focus coaching efforts where they can have the greatest impact. AI-generated recommendations and coaching workflows help streamline safety management.</p>
    </div>
    <div class="gfp-card">
      <h3>Simplify deployment of advanced video telematics</h3>
      <p>Many camera solutions require manual pairing, calibration and extensive setup.</p>
      <hr>
      <h4>GO Focus Plus solution</h4>
      <p>GO Focus Plus automatically pairs with compatible Geotab GO devices and self-calibrates during installation, helping fleets reduce deployment complexity and installation time.</p>
    </div>
  </div>
</div></section>

<img class="gfp-photo" src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/go-focus-plus-driver.jpg' ); ?>" width="1400" height="933" alt="Fleet driver in a work van reviewing a phone" loading="lazy">

<!-- Block 6: operational outcomes -->
<section class="section"><div class="wrap">
  <div class="gfp-center"><h2>Turn Safety Insights Into Operational Improvements</h2></div>
  <div class="gfp-cards">
    <div class="gfp-card">
      <h3>Improve driver safety performance</h3>
      <p>Many fleets struggle to proactively address unsafe behaviors before they contribute to incidents. GO Focus Plus delivers real-time coaching and behavior monitoring that helps drivers improve habits immediately instead of waiting for post-event review.</p>
    </div>
    <div class="gfp-card gfp-card--dark">
      <h3>Reduce collision-related costs</h3>
      <p>Collisions, claims and unsafe driving behaviors create significant operational expenses. GO Focus Plus helps fleets identify risk earlier, improve driver behavior and strengthen claims documentation with video and telematics evidence.</p>
    </div>
    <div class="gfp-card gfp-card--dark">
      <h3>Increase coaching efficiency</h3>
      <p>Manual review processes can make safety programs difficult to scale. GO Focus Plus automatically prioritizes risky drivers and behaviors, helping managers spend less time searching for events and more time coaching.</p>
    </div>
    <div class="gfp-card">
      <h3>Support a stronger safety culture</h3>
      <p>Safety programs are most effective when drivers receive clear, timely feedback. GO Focus Plus combines in-cab verbal coaching, driver-friendly mobile tools and transparent review workflows to encourage continuous improvement.</p>
    </div>
  </div>
</div></section>

<!-- Block 5: how it works + supported safety events -->
<section class="section section--soft"><div class="wrap">
  <div class="gfp-center"><h2>How GO Focus Plus Works</h2></div>
  <ol class="gfp-steps">
    <li><span class="gfp-step-ico"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="10" width="24" height="15" rx="3"/><circle cx="16" cy="17.5" r="4.5"/><path d="M11 10l2-4h6l2 4"/></svg></span>Cameras record when vehicles are in motion</li>
    <li><span class="gfp-step-ico"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5l12 21H4z"/><path d="M16 13v6M16 22.5v.5"/></svg></span>AI detects risky driving events such as collisions and unsafe behaviors</li>
    <li><span class="gfp-step-ico"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 23a6 6 0 0 1-.6-12A8 8 0 0 1 24 11.5 5.5 5.5 0 0 1 23 23"/><path d="M16 27V16M12 20l4-4 4 4"/></svg></span>Video and telematics data are uploaded to MyGeotab</li>
    <li><span class="gfp-step-ico"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="6" width="24" height="17" rx="2"/><path d="M11 28h10M16 23v5M9 18l4-4 3 3 6-6"/></svg></span>Fleet managers review events and coach drivers using actionable insights</li>
  </ol>
  <div class="gfp-center" style="margin-bottom:28px;"><h3 style="font-size:24px;margin:0;">Supported Safety Events</h3></div>
  <div class="gfp-events">
    <div>
      <h4>Driver Monitoring System (DMS)</h4>
      <ul><li>Phone use</li><li>Driver distraction</li><li>Drowsiness and fatigue indicators</li><li>Seatbelt violations</li><li>Eating and drinking detection</li></ul>
    </div>
    <div>
      <h4>Advanced Driver Assistance Systems (ADAS)</h4>
      <ul><li>Tailgating</li><li>Rolling stops</li><li>Swerving</li><li>Near-collision events</li><li>Collision events</li></ul>
    </div>
    <div>
      <h4>Driver-Initiated Events</h4>
      <ul><li>Event trigger button recordings</li><li>Manual incident capture</li></ul>
    </div>
  </div>
</div></section>

<!-- Block 7: structured Q&A -->
<section class="section"><div class="wrap gfp-qa">
  <h2>Structured Q&amp;A</h2>
  <div class="gfp-qa-list">
    <?php foreach ( $gfp_qa as $q => $a ) : ?>
      <div class="gfp-qa-item"><h3><?php echo esc_html( $q ); ?></h3><p><?php echo esc_html( $a ); ?></p></div>
    <?php endforeach; ?>
  </div>
</div></section>

<!-- Block 8: comparison / decision support -->
<section class="section section--soft"><div class="wrap">
  <div class="gfp-center"><h2>Where GO Focus Plus Fits Within the GO Focus Family</h2></div>
  <div class="gfp-table-wrap">
    <table class="gfp-table">
      <thead><tr><th scope="col">Product</th><th scope="col">Best For</th><th scope="col">Key Differentiator</th></tr></thead>
      <tbody>
        <tr><td>GO Focus</td><td>Privacy-focused fleets</td><td>Road-facing event-based video</td></tr>
        <tr class="is-current"><td>GO Focus Plus</td><td>Driver coaching and behavior improvement</td><td>Dual-facing AI camera with DMS and coaching</td></tr>
        <tr><td>GO Focus Pro</td><td>Advanced visibility and AI requirements</td><td>Expanded AI models and multi-camera support</td></tr>
      </tbody>
    </table>
  </div>
  <div class="gfp-fit">
    <div class="gfp-panel">
      <h3>When GO Focus Plus Is the Right Choice</h3>
      <p>GO Focus Plus is best suited for fleets that want:</p>
      <ul>
        <li>Driver behavior monitoring</li>
        <li>Real-time coaching alerts</li>
        <li>Dual-facing video visibility</li>
        <li>Live streaming and continuous recording</li>
        <li>Automated coaching workflows</li>
        <li>Driver risk scoring and prioritization</li>
        <li>Enhanced safety program performance</li>
        <li>AI-powered incident prevention</li>
      </ul>
    </div>
    <div class="gfp-panel">
      <h3>GO Focus Plus Capabilities</h3>
      <table class="gfp-caps">
        <thead><tr><th scope="col">Capability</th><th scope="col">GO Focus Plus</th></tr></thead>
        <tbody>
          <?php foreach ( [ 'AI event detection', 'Driver Monitoring System (DMS)', 'Advanced Driver Assistance Systems (ADAS)', 'MyGeotab integration', 'Road-facing video', 'Driver-facing video', 'Real-time verbal coaching', 'Live streaming', 'Continuous recording', 'Auto-pairing and self-calibration', 'Driver coaching workflows' ] as $cap ) : ?>
            <tr><td><?php echo esc_html( $cap ); ?></td><td>Yes</td></tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div></section>

<!-- Block 9: FAQ -->
<section class="section"><div class="wrap gfp-qa">
  <h2>Frequently Asked Questions</h2>
  <div class="gfp-qa-list">
    <?php foreach ( $gfp_faq as $q => $a ) : ?>
      <div class="gfp-qa-item"><h3><?php echo esc_html( $q ); ?></h3><p><?php echo esc_html( $a ); ?></p></div>
    <?php endforeach; ?>
  </div>
</div></section>

<!-- Partner block: why buy through EnVue -->
<section class="section section--soft"><div class="wrap gfp-envue">
  <div class="gfp-envue-logo"><img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/envue-logo.png' ); ?>" alt="EnVue Telematics logo" loading="lazy"></div>
  <div>
    <span class="eyebrow">The EnVue advantage</span>
    <h2>Why deploy GO Focus Plus with EnVue?</h2>
    <p>EnVue Telematics helps fleets choose the right camera configuration, align policies with driver privacy expectations, train teams, and turn video events into practical coaching workflows. We do more than ship hardware &mdash; we help you build a safer operating model.</p>
    <div class="hero-actions" style="margin-top:1.5rem;">
      <a class="button button-primary" href="<?php echo esc_url( home_url( '/get-in-touch/' ) ); ?>">Talk to an EnVue Expert <span>&rarr;</span></a>
    </div>
  </div>
</div></section>

</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">Geotab GO Focus Plus</span><h2>Ready to evaluate GO Focus Plus?</h2></div>
  <div><p>Let EnVue help you choose the right Geotab video configuration, plan your rollout, and create a safety program your drivers and managers can actually use.</p>
  <div class="hero-actions">
    <a class="button button-primary button-lg" href="<?php echo esc_url( home_url( '/get-in-touch/' ) ); ?>">Get a Custom Quote <span>&rarr;</span></a>
    <a class="button button-ghost button-lg" href="mailto:support@et-envue.com">Email EnVue</a>
  </div></div>
</div></section>

<?php
// Product + BreadcrumbList schema (Geotab toolkit Blocks 1 and 3, filled in for EnVue).
// Organization (Block 4) is already printed site-wide, so it is not repeated here.
$gfp_schema = [
	[
		'@context'    => 'https://schema.org',
		'@type'       => 'Product',
		'name'        => 'GO Focus Plus™ AI Dash Cam',
		'description' => 'A dual-facing AI dash cam that combines road-facing video, driver monitoring, real-time coaching alerts and automated safety workflows to help fleets reduce risk, improve driver behavior and gain visibility into critical safety events.',
		'brand'        => [ '@type' => 'Brand', 'name' => 'Geotab' ],
		'manufacturer' => [ '@type' => 'Organization', 'name' => 'Geotab', 'url' => 'https://www.geotab.com' ],
		'image'       => $gfp_img,
		'url'         => $gfp_url,
		'category'    => 'Fleet Safety Technology',
		'keywords'    => 'dual-facing AI dash cam, driver monitoring system, DMS, ADAS, real-time coaching, fleet safety camera, video telematics, driver behavior, MyGeotab',
		'offers'      => [
			'@type'         => 'Offer',
			'url'           => $gfp_url,
			'availability'  => 'https://schema.org/InStock',
			'priceCurrency' => 'USD',
			'seller'        => [ '@type' => 'Organization', 'name' => 'EnVue Telematics', 'url' => home_url( '/' ) ],
		],
		'additionalProperty' => array_map(
			function ( $name, $value ) { return [ '@type' => 'PropertyValue', 'name' => $name, 'value' => $value ]; },
			[ 'Camera Configuration', 'Driver Monitoring System (DMS)', 'Advanced Driver Assistance Systems (ADAS)', 'Real-Time Coaching', 'Recording Capabilities', 'Coaching Workflows', 'Platform Integration', 'Installation', 'Privacy' ],
			[
				'Dual-facing: road-facing and driver-facing cameras',
				'Detects phone use, driver distraction, drowsiness and fatigue indicators, seatbelt violations, eating and drinking',
				'Detects tailgating, rolling stops, swerving, near-collision events, collision events',
				'In-cab verbal coaching alerts that help drivers self-correct unsafe behaviors as they occur',
				'Continuous recording and live streaming, plus AI-powered safety event detection',
				'Automated driver risk scoring, behavior prioritization, and coaching workflow management',
				'MyGeotab and Geotab Video platform',
				'Auto-pairing with compatible Geotab GO devices and self-calibration during installation',
				'Privacy-focused design options to support driver acceptance',
			]
		),
	],
	[
		'@context'        => 'https://schema.org',
		'@type'           => 'BreadcrumbList',
		'itemListElement' => [
			[ '@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => home_url( '/' ) ],
			[ '@type' => 'ListItem', 'position' => 2, 'name' => 'AI Dash Cams', 'item' => home_url( '/dash-cams/' ) ],
			[ '@type' => 'ListItem', 'position' => 3, 'name' => 'GO Focus Plus AI Dash Cam', 'item' => $gfp_url ],
		],
	],
];
foreach ( $gfp_schema as $block ) {
	echo '<script type="application/ld+json">' . wp_json_encode( $block, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "</script>\n";
}
get_footer();
