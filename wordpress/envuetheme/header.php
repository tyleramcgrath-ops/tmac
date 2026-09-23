<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php if ( function_exists( "wp_body_open" ) ) wp_body_open(); ?>

<!-- ── HEADER ────────────────────────────────────────────────── -->
<header class="site-header">
  <div class="topbar">
    <div class="topbar-inner">
      <p class="topbar-note">Geotab Elite Specialized Partner <span aria-hidden="true">&middot;</span> 24/7 US-based support</p>
      <div class="topbar-right">
        <a class="topbar-phone" href="tel:8002011169"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>(800) 201-1169</a>
        <?php echo envue_social_links( 'social-links--header' ); ?>
      </div>
    </div>
  </div>
  <div class="nav-shell">
    <a class="site-brand" href="<?php echo esc_url(home_url('/')); ?>" aria-label="EnVue Telematics">
      <img src="<?php echo get_template_directory_uri(); ?>/assets/images/envue-logo.png" alt="EnVue Telematics" width="200" height="58">
    </a>

    <nav class="primary-nav" aria-label="Primary">
      <ul class="menu">
        <li class="has-menu">
          <a href="<?php echo esc_url(home_url('/solutions/')); ?>">Solutions</a>
          <div class="dropdown dropdown--wide">
            <a href="<?php echo esc_url(home_url('/dash-cams/')); ?>"><strong>AI Dash Cams</strong><small>Event-triggered video and driver coaching.</small></a>
            <a href="<?php echo esc_url(home_url('/gps-tracking/')); ?>"><strong>GPS Tracking</strong><small>Live location, geofencing and trip history.</small></a>
            <a href="<?php echo esc_url(home_url('/equipment-management/')); ?>"><strong>Equipment &amp; Assets</strong><small>Powered and non-powered asset visibility.</small></a>
            <a href="<?php echo esc_url(home_url('/maintenance/')); ?>"><strong>Predictive Maintenance</strong><small>Fault alerts before a truck comes off the road.</small></a>
            <a href="<?php echo esc_url(home_url('/fuel-management/')); ?>"><strong>Fuel Management</strong><small>Idle reduction, MPG and fuel card controls.</small></a>
            <a href="<?php echo esc_url(home_url('/powered-by-geotab/')); ?>"><strong>Powered by Geotab</strong><small>300+ integrations on an open platform.</small></a>
            <a href="<?php echo esc_url(home_url('/electric-vehicles/')); ?>"><strong>Electric Vehicles</strong><small>EV readiness and mixed-fleet management.</small></a>
            <a href="<?php echo esc_url(home_url('/safety/')); ?>"><strong>Safety</strong><small>Coaching, risk scoring and safer drivers.</small></a>
            <a href="<?php echo esc_url(home_url('/productivity/')); ?>"><strong>Productivity</strong><small>Dispatch, routing and utilization.</small></a>
            <a href="<?php echo esc_url(home_url('/optimization/')); ?>"><strong>Optimization</strong><small>Right-sizing and lower operating costs.</small></a>
            <a href="<?php echo esc_url(home_url('/sustainability/')); ?>"><strong>Sustainability</strong><small>Emissions tracking and greener fleets.</small></a>
            <a href="<?php echo esc_url(home_url('/compliance/')); ?>"><strong>Compliance</strong><small>ELD, HOS, IFTA and DVIR automation.</small></a>
            <a href="<?php echo esc_url(home_url('/expandability/')); ?>"><strong>Expandability</strong><small>Marketplace integrations and open API.</small></a>
          </div>
        </li>
        <li><a href="<?php echo esc_url(home_url('/results/')); ?>">Results</a></li>
        <li class="has-menu">
          <a href="<?php echo esc_url(home_url('/industries/')); ?>">Industries</a>
          <div class="dropdown">
            <a href="<?php echo esc_url(home_url('/construction/')); ?>"><strong>Construction</strong><small>Machines, yards and high-value assets.</small></a>
            <a href="<?php echo esc_url(home_url('/trucking-transportation/')); ?>"><strong>Trucking</strong><small>HOS, compliance and video liability defense.</small></a>
            <a href="<?php echo esc_url(home_url('/field-services/')); ?>"><strong>Field Services</strong><small>Dispatch accuracy and technician productivity.</small></a>
            <a href="<?php echo esc_url(home_url('/oil-gas/')); ?>"><strong>Oil &amp; Gas</strong><small>Remote tracking and lone worker safety.</small></a>
            <a href="<?php echo esc_url(home_url('/government/')); ?>"><strong>Government</strong><small>Public accountability and compliance reporting.</small></a>
            <a href="<?php echo esc_url(home_url('/leasing-rental/')); ?>"><strong>Leasing &amp; Rental</strong><small>Utilization, odometer and unauthorized-use alerts.</small></a>
          </div>
        </li>
<li class="has-menu">
          <a href="<?php echo esc_url(home_url("/our-partners/")); ?>">Partners</a>
          <div class="dropdown dropdown--mega">
            <div class="dropdown-col">
              <span class="dropdown-cat">Video Safety</span>
              <a href="<?php echo esc_url(home_url("/lytx/")); ?>"><strong>Lytx</strong><small>Video telematics &amp; AI dash cams.</small></a>
              <a href="<?php echo esc_url(home_url("/netradyne/")); ?>"><strong>Netradyne</strong><small>Driver.i® vision-based safety.</small></a>
              <a href="<?php echo esc_url(home_url("/mobileye/")); ?>"><strong>Mobileye</strong><small>Advanced collision avoidance.</small></a>
              <a href="<?php echo esc_url(home_url("/surfsight/")); ?>"><strong>Surfsight</strong><small>AI-powered dash cam platform.</small></a>
              <a href="<?php echo esc_url(home_url("/samsara/")); ?>"><strong>Samsara</strong><small>Connected fleet management.</small></a>
              <a href="<?php echo esc_url(home_url("/azuga/")); ?>"><strong>Azuga</strong><small>GPS tracking &amp; safety cameras.</small></a>
            </div>
            <div class="dropdown-col">
              <span class="dropdown-cat">Routing &amp; Dispatch</span>
              <a href="<?php echo esc_url(home_url("/elite-extra/")); ?>"><strong>Elite EXTRA</strong><small>Route optimization &amp; dispatch.</small></a>
              <a href="<?php echo esc_url(home_url("/route4me/")); ?>"><strong>Route4Me</strong><small>Smart multi-stop routing.</small></a>
              <a href="<?php echo esc_url(home_url("/drivewyze/")); ?>"><strong>Drivewyze</strong><small>Weigh station bypass service.</small></a>
              <span class="dropdown-cat" style="margin-top:1.25rem">Fuel &amp; Maintenance</span>
              <a href="<?php echo esc_url(home_url("/fleetcor/")); ?>"><strong>FleetCor</strong><small>Fleet fuel card management.</small></a>
              <a href="<?php echo esc_url(home_url("/coast-pay/")); ?>"><strong>Coast Pay</strong><small>Modern fleet fuel payments.</small></a>
              <a href="<?php echo esc_url(home_url("/fleetio/")); ?>"><strong>Fleetio</strong><small>Fleet maintenance software.</small></a>
              <a href="<?php echo esc_url(home_url("/whip-around/")); ?>"><strong>Whip Around</strong><small>Digital vehicle inspections.</small></a>
              <a href="<?php echo esc_url(home_url("/car-advise/")); ?>"><strong>CarAdvise</strong><small>Fleet maintenance marketplace.</small></a>
              <a href="<?php echo esc_url(home_url("/promiles/")); ?>"><strong>ProMiles</strong><small>IFTA fuel tax reporting.</small></a>
            </div>
            <div class="dropdown-col">
              <span class="dropdown-cat">Safety &amp; Compliance</span>
              <a href="<?php echo esc_url(home_url("/smith-system/")); ?>"><strong>Smith System</strong><small>Defensive driving training.</small></a>
              <a href="<?php echo esc_url(home_url("/speedgauge/")); ?>"><strong>SpeedGauge</strong><small>Speed management &amp; scoring.</small></a>
              <a href="<?php echo esc_url(home_url("/safety-first/")); ?>"><strong>SafetyFirst</strong><small>Fleet risk management.</small></a>
              <a href="<?php echo esc_url(home_url("/lifesaver-mobile/")); ?>"><strong>LifeSaver Mobile</strong><small>Mobile phone distraction prevention.</small></a>
              <a href="<?php echo esc_url(home_url("/predictive-coach/")); ?>"><strong>Predictive Coach</strong><small>Automated driver training.</small></a>
              <a href="<?php echo esc_url(home_url("/craig-safety-technologies/")); ?>"><strong>Craig Safety Technologies</strong><small>DQ files &amp; compliance management.</small></a>
              <span class="dropdown-cat" style="margin-top:1.25rem">Assets &amp; Equipment</span>
              <a href="<?php echo esc_url(home_url("/phillips-connect/")); ?>"><strong>Phillips Connect</strong><small>Smart trailer tracking.</small></a>
              <a href="<?php echo esc_url(home_url("/sensata-technologies/")); ?>"><strong>Sensata Technologies</strong><small>Trailer TPMS &amp; telematics.</small></a>
              <a href="<?php echo esc_url(home_url("/origo/")); ?>"><strong>ORIGOInspect</strong><small>Digital vehicle inspections.</small></a>
              <a href="<?php echo esc_url(home_url("/ok-alone/")); ?>"><strong>Ok Alone</strong><small>Lone worker safety app.</small></a>
            </div>
            <div class="dropdown-col">
              <span class="dropdown-cat">EV &amp; Sustainability</span>
              <a href="<?php echo esc_url(home_url("/moveev/")); ?>"><strong>MoveEV</strong><small>EV fleet readiness &amp; management.</small></a>
              <a href="<?php echo esc_url(home_url("/greater-than/")); ?>"><strong>Greater Than</strong><small>AI risk &amp; sustainability scoring.</small></a>
              <span class="dropdown-cat" style="margin-top:1.25rem">Data &amp; More</span>
              <a href="<?php echo esc_url(home_url("/xtract/")); ?>"><strong>Xtract</strong><small>Crash data &amp; claims (eFNOL).</small></a>
              <a href="<?php echo esc_url(home_url("/our-partners/")); ?>"><strong>View All Partners →</strong><small>Complete partner directory.</small></a>
            </div>
          </div>
        </li>
        <li class="has-menu">
          <a href="<?php echo esc_url(home_url('/resources/')); ?>">Resources</a>
          <div class="dropdown">
            <a href="<?php echo esc_url(home_url('/blog-articles/')); ?>"><strong>Blog Articles</strong><small>Fleet management insights, guides and tips.</small></a>
            <a href="<?php echo esc_url(home_url('/news/')); ?>"><strong>News</strong><small>Latest EnVue announcements and updates.</small></a>
            <a href="<?php echo esc_url(home_url('/faqs/')); ?>"><strong>FAQs</strong><small>Common questions about telematics and EnVue.</small></a>
          </div>
        </li>
        <li class="has-menu">
          <a href="<?php echo esc_url(home_url('/about-envue/')); ?>">Company</a>
          <div class="dropdown">
            <a href="<?php echo esc_url(home_url('/about-envue/')); ?>"><strong>About EnVue</strong><small>Our story, mission and the team behind the platform.</small></a>
            <a href="<?php echo esc_url(home_url('/customer-journey/')); ?>"><strong>Customer Journey</strong><small>How we deploy and stay with your fleet.</small></a>
            <a href="<?php echo esc_url(home_url('/get-in-touch/')); ?>"><strong>Get In Touch</strong><small>Talk to our team — no pressure, real answers.</small></a>
            <a href="<?php echo esc_url(home_url('/events-calendar/')); ?>"><strong>Events</strong><small>Conferences and trade shows we attend.</small></a>
          </div>
        </li>
      </ul>
    </nav>

    <div class="header-actions">
      <a class="button button-primary" href="<?php echo esc_url(home_url('/get-in-touch/')); ?>">Get a Demo</a>
      <button class="mobile-toggle" id="mobileToggle" type="button" aria-controls="mobileMenu" aria-expanded="false" aria-label="Open menu">
        <span></span><span></span>
      </button>
    </div>
  </div>

  <div class="mobile-menu" id="mobileMenu" hidden>
    <ul class="menu">
      <li><a href="<?php echo esc_url(home_url('/solutions/')); ?>">Solutions</a></li>
    </ul>
    <div class="mobile-sub">
      <a href="<?php echo esc_url(home_url('/dash-cams/')); ?>">AI Dash Cams</a>
      <a href="<?php echo esc_url(home_url('/gps-tracking/')); ?>">GPS Tracking</a>
      <a href="<?php echo esc_url(home_url('/equipment-management/')); ?>">Equipment &amp; Assets</a>
      <a href="<?php echo esc_url(home_url('/maintenance/')); ?>">Maintenance</a>
      <a href="<?php echo esc_url(home_url('/fuel-management/')); ?>">Fuel Management</a>
      <a href="<?php echo esc_url(home_url('/powered-by-geotab/')); ?>">Powered by Geotab</a>
      <a href="<?php echo esc_url(home_url('/electric-vehicles/')); ?>">Electric Vehicles</a>
      <a href="<?php echo esc_url(home_url('/safety/')); ?>">Safety</a>
      <a href="<?php echo esc_url(home_url('/productivity/')); ?>">Productivity</a>
      <a href="<?php echo esc_url(home_url('/optimization/')); ?>">Optimization</a>
      <a href="<?php echo esc_url(home_url('/sustainability/')); ?>">Sustainability</a>
      <a href="<?php echo esc_url(home_url('/compliance/')); ?>">Compliance</a>
      <a href="<?php echo esc_url(home_url('/expandability/')); ?>">Expandability</a>
    </div>
    <ul class="menu">
      <li><a href="<?php echo esc_url(home_url('/results/')); ?>">Results</a></li>
      <li><a href="<?php echo esc_url(home_url('/industries/')); ?>">Industries</a></li>
    </ul>
    <div class="mobile-sub">
      <a href="<?php echo esc_url(home_url('/construction/')); ?>">Construction</a>
      <a href="<?php echo esc_url(home_url('/trucking-transportation/')); ?>">Trucking</a>
      <a href="<?php echo esc_url(home_url('/field-services/')); ?>">Field Services</a>
      <a href="<?php echo esc_url(home_url('/oil-gas/')); ?>">Oil &amp; Gas</a>
      <a href="<?php echo esc_url(home_url('/government/')); ?>">Government</a>
      <a href="<?php echo esc_url(home_url('/leasing-rental/')); ?>">Leasing &amp; Rental</a>
    </div>
    <ul class="menu">
      <li><a href="<?php echo esc_url(home_url("/our-partners/")); ?>">Partners</a></li>
    </ul>
    <div class="mobile-sub">
      <span class="mobile-sub-label">Video Safety</span>
      <a href="<?php echo esc_url(home_url("/lytx/")); ?>">Lytx</a>
      <a href="<?php echo esc_url(home_url("/netradyne/")); ?>">Netradyne</a>
      <a href="<?php echo esc_url(home_url("/mobileye/")); ?>">Mobileye</a>
      <a href="<?php echo esc_url(home_url("/surfsight/")); ?>">Surfsight</a>
      <a href="<?php echo esc_url(home_url("/samsara/")); ?>">Samsara</a>
      <span class="mobile-sub-label">Routing &amp; Dispatch</span>
      <a href="<?php echo esc_url(home_url("/elite-extra/")); ?>">Elite EXTRA</a>
      <a href="<?php echo esc_url(home_url("/route4me/")); ?>">Route4Me</a>
      <a href="<?php echo esc_url(home_url("/drivewyze/")); ?>">Drivewyze</a>
      <span class="mobile-sub-label">Fuel &amp; Maintenance</span>
      <a href="<?php echo esc_url(home_url("/fleetcor/")); ?>">FleetCor</a>
      <a href="<?php echo esc_url(home_url("/coast-pay/")); ?>">Coast Pay</a>
      <a href="<?php echo esc_url(home_url("/fleetio/")); ?>">Fleetio</a>
      <a href="<?php echo esc_url(home_url("/whip-around/")); ?>">Whip Around</a>
      <a href="<?php echo esc_url(home_url("/car-advise/")); ?>">CarAdvise</a>
      <span class="mobile-sub-label">Safety &amp; Compliance</span>
      <a href="<?php echo esc_url(home_url("/smith-system/")); ?>">Smith System</a>
      <a href="<?php echo esc_url(home_url("/speedgauge/")); ?>">SpeedGauge</a>
      <a href="<?php echo esc_url(home_url("/safety-first/")); ?>">SafetyFirst</a>
      <a href="<?php echo esc_url(home_url("/lifesaver-mobile/")); ?>">LifeSaver Mobile</a>
      <a href="<?php echo esc_url(home_url("/predictive-coach/")); ?>">Predictive Coach</a>
      <a href="<?php echo esc_url(home_url("/craig-safety-technologies/")); ?>">Craig Safety Technologies</a>
      <span class="mobile-sub-label">Assets &amp; Equipment</span>
      <a href="<?php echo esc_url(home_url("/phillips-connect/")); ?>">Phillips Connect</a>
      <a href="<?php echo esc_url(home_url("/sensata-technologies/")); ?>">Sensata Technologies</a>
      <a href="<?php echo esc_url(home_url("/origo/")); ?>">ORIGOInspect</a>
      <a href="<?php echo esc_url(home_url("/ok-alone/")); ?>">Ok Alone</a>
      <span class="mobile-sub-label">EV &amp; Sustainability</span>
      <a href="<?php echo esc_url(home_url("/moveev/")); ?>">MoveEV</a>
      <a href="<?php echo esc_url(home_url("/greater-than/")); ?>">Greater Than</a>
      <span class="mobile-sub-label">Other</span>
      <a href="<?php echo esc_url(home_url("/azuga/")); ?>">Azuga</a>
      <a href="<?php echo esc_url(home_url("/promiles/")); ?>">ProMiles</a>
      <a href="<?php echo esc_url(home_url("/xtract/")); ?>">Xtract</a>
    </div>
    <ul class="menu">
      <li><a href="<?php echo esc_url(home_url('/resources/')); ?>">Resources</a></li>
    </ul>
    <div class="mobile-sub">
      <a href="<?php echo esc_url(home_url('/blog-articles/')); ?>">Blog Articles</a>
      <a href="<?php echo esc_url(home_url('/news/')); ?>">News</a>
      <a href="<?php echo esc_url(home_url('/faqs/')); ?>">FAQs</a>
    </div>
    <ul class="menu">
      <li><a href="<?php echo esc_url(home_url('/about-envue/')); ?>">Company</a></li>
    </ul>
    <div class="mobile-sub">
      <a href="<?php echo esc_url(home_url('/about-envue/')); ?>">About EnVue</a>
      <a href="<?php echo esc_url(home_url('/customer-journey/')); ?>">Customer Journey</a>
      <a href="<?php echo esc_url(home_url('/get-in-touch/')); ?>">Get In Touch</a>
      <a href="<?php echo esc_url(home_url('/events-calendar/')); ?>">Events</a>
    </div>
    <a class="button button-primary" href="<?php echo esc_url(home_url('/get-in-touch/')); ?>">Get a Demo</a>
    <a class="header-phone" href="tel:8002011169">(800) 201-1169</a>
    <?php echo envue_social_links( 'social-links--mobile' ); ?>
  </div>
</header>
<script>
(function(){
  var h = document.querySelector('.site-header');
  function onScroll(){ h.classList.toggle('scrolled', window.scrollY > 50); }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();
</script>
