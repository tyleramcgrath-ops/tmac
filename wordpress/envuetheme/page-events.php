<?php
/**
 * Events — webinars (hosted on WebinarGeek) + trade shows.
 * Serves /events-calendar/ (live URL) and /events/.
 *
 * To add a webinar: append to $webinars below. Past webinars hide themselves
 * automatically once their start time has passed.
 */
$webinar_channel = 'https://envue-telematics.webinargeek.com/';
$webinars = [
    [
        'title' => 'Clearing the Air in Your Fleet: How to Detect Smoking & Vaping in Company Vehicles',
        'start' => '2026-10-28 14:00:00 America/New_York',
        'label' => 'Wednesday, October 28, 2026 · 2:00 pm EDT',
        'len'   => '60 minutes',
        'desc'  => 'Smoking and vaping in company vehicles can create more than an unpleasant ride. They can lead to vehicle damage, lingering odors, and more. Join this session to learn how fleets can detect smoking and vaping in company vehicles.',
        'img'   => 'https://static.webinargeek.com/uploads/banner/28030699/8b7a757c-e169-46dc-a1b0-60b97aaf36ba.jpeg',
        'url'   => 'https://envue-telematics.webinargeek.com/clearing-the-air-in-your-fleet-how-to-detect-smoking-vaping-in-company-vehicles?cst=channel',
    ],
];
$now      = time();
$upcoming = array_values( array_filter( $webinars, function ( $w ) use ( $now ) {
    $t = strtotime( $w['start'] );
    return $t && $t > $now;
} ) );

$shows = [
    [ 'Geotab Connect', 'Geotab&rsquo;s annual partner and customer conference', 'Winter', 'The flagship event of the Geotab ecosystem, where EnVue — a Geotab Elite Specialized Partner and Geotab Innovation Award winner — meets with customers, partners, and the Geotab product teams shaping what comes next.', 'https://www.geotab.com/connect/' ],
    [ 'Mid-America Trucking Show (MATS)', 'Louisville, Kentucky', 'Spring', 'The largest annual heavy-duty trucking event in North America, bringing together owner-operators, fleet executives, and the technology providers that keep trucks moving.', 'https://www.truckingshow.com/' ],
    [ 'Work Truck Week', 'NTEA &middot; Indianapolis, Indiana', 'Spring', 'The work truck industry&rsquo;s largest event, focused on vocational trucks, upfitting, and the fleet technology that supports construction, utility, and field service operations.', 'https://www.worktruckweek.com/' ],
    [ 'NPTC Annual Institute &amp; Expo', 'National Private Truck Council', 'Spring', 'The premier event for private fleet professionals, covering safety, compliance, driver retention, and the operational practices of best-in-class private fleets.', 'https://www.nptc.org/' ],
    [ 'Texas Trucking Show', 'Texas Trucking Association', 'Summer', 'EnVue&rsquo;s home-state trucking event. As a member of the Texas Trucking Association, EnVue exhibits alongside the carriers and suppliers that power Texas freight.', 'https://www.texastrucking.com/' ],
    [ 'ATA Management Conference &amp; Exhibition', 'American Trucking Associations', 'Fall', 'The trucking industry&rsquo;s premier gathering of executives and decision-makers, covering policy, safety, technology, and the future of freight.', 'https://www.trucking.org/' ],
];

get_header();
?>
<main id="main">

<section class="page-hero">
  <img class="page-hero-bg" src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&amp;fit=crop&amp;w=1920&amp;q=72" srcset="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&amp;fit=crop&amp;w=768&amp;q=72 768w, https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&amp;fit=crop&amp;w=1280&amp;q=72 1280w, https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&amp;fit=crop&amp;w=1920&amp;q=72 1920w, https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&amp;fit=crop&amp;w=2560&amp;q=72 2560w" sizes="100vw" alt="Audience seated at a business conference" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url(home_url("/")); ?>">Home</a> / <a href="<?php echo esc_url(home_url("/about-envue/")); ?>">Company</a> / <a href="<?php echo esc_url(home_url("/events-calendar/")); ?>">Events</a></nav>
    <span class="eyebrow eyebrow--light">Webinars &amp; Events</span>
    <h1>Fleet Intelligence Events: Webinars, Trade Shows &amp; Conferences.</h1>
    <p>Throughout the year, EnVue Telematics partners with leading fleet technology providers to deliver educational webinars focused on industry trends, operational challenges, and innovative solutions — and meets fleet leaders in person at the industry&rsquo;s top trade shows.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="#webinars">Upcoming Webinars <span>&rarr;</span></a>
      <a class="button button-ghost button-lg" href="<?php echo esc_url( $webinar_channel ); ?>" target="_blank" rel="noopener">Sign up for updates</a>
    </div>
  </div>
</section>

<!-- Intro -->
<section class="section"><div class="wrap">
  <div class="section-head"><div>
    <span class="eyebrow reveal">Collective Intelligence</span>
    <h2 class="reveal" style="--d:1">Stay connected with the people shaping fleet technology.</h2>
  </div><div class="reveal" style="--d:2">
    <p>In the rapidly accelerating world of fleet telematics, staying connected with industry leaders, technical innovators, and regulatory experts is more than a networking opportunity — it is a strategic necessity. Sign up to stay up to date on the latest fleet technology, industry insights, and tools designed to help improve safety, efficiency, compliance, and overall fleet performance.</p>
  </div></div>
  <ul class="check-list check-list--2col reveal">
    <li><strong>Partner webinars</strong> &mdash; Live sessions with EnVue and leading fleet technology providers</li>
    <li><strong>Industry trends</strong> &mdash; Regulatory changes, safety data, and what they mean for your fleet</li>
    <li><strong>Trade shows</strong> &mdash; Meet the EnVue team in person at national and regional events</li>
    <li><strong>On-demand learning</strong> &mdash; Missed a session? Recordings are available on our webinar channel</li>
  </ul>
</div></section>

<!-- Webinars -->
<section class="section section--soft" id="webinars"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">Upcoming Webinars</span>
    <h2 class="reveal" style="--d:1">Free educational webinars for fleet leaders.</h2>
  </div></div>

  <?php if ( $upcoming ) : ?>
    <div class="event-list">
      <?php foreach ( $upcoming as $i => $w ) : ?>
      <article class="event-card reveal"<?php echo $i % 3 ? ' style="--d:' . ( $i % 3 ) . '"' : ''; ?>>
        <div class="event-card-media">
          <img src="<?php echo esc_url( $w['img'] ); ?>" alt="<?php echo esc_attr( $w['title'] ); ?>" loading="lazy">
        </div>
        <div class="event-card-body">
          <span class="event-meta"><?php echo esc_html( $w['label'] ); ?> &middot; <?php echo esc_html( $w['len'] ); ?></span>
          <h3><?php echo esc_html( $w['title'] ); ?></h3>
          <p><?php echo esc_html( $w['desc'] ); ?></p>
          <a class="button button-primary" href="<?php echo esc_url( $w['url'] ); ?>" target="_blank" rel="noopener">Register now <span>&rarr;</span></a>
        </div>
      </article>
      <?php endforeach; ?>
    </div>
  <?php else : ?>
    <div class="news-empty reveal">
      <h3>New webinars are announced throughout the year.</h3>
      <p>Visit our webinar channel to see what&rsquo;s coming up, watch past sessions on demand, and subscribe to be notified when new events are scheduled.</p>
    </div>
  <?php endif; ?>

  <p class="event-channel reveal"><a class="button button-outline" href="<?php echo esc_url( $webinar_channel ); ?>" target="_blank" rel="noopener">View all webinars &amp; recordings <span>&rarr;</span></a></p>
</div></section>

<!-- Trade shows -->
<section class="section"><div class="wrap">
  <div class="section-head"><div>
    <span class="eyebrow reveal">Trade Shows &amp; Conferences</span>
    <h2 class="reveal" style="--d:1">Where to find EnVue on the road.</h2>
  </div><div class="reveal" style="--d:2">
    <p>The EnVue team regularly attends the fleet and trucking industry&rsquo;s leading events. Dates and locations change year to year, so check each event&rsquo;s official site for the current schedule — and contact us to book time with an EnVue fleet expert at the show.</p>
  </div></div>
  <div class="show-grid">
    <?php foreach ( $shows as $i => $s ) : ?>
    <article class="show-card reveal"<?php echo $i % 3 ? ' style="--d:' . ( $i % 3 ) . '"' : ''; ?>>
      <span class="show-season"><?php echo esc_html( $s[2] ); ?></span>
      <h3><?php echo $s[0]; ?></h3>
      <span class="show-where"><?php echo $s[1]; ?></span>
      <p><?php echo $s[3]; ?></p>
      <a class="resource-card-link" href="<?php echo esc_url( $s[4] ); ?>" target="_blank" rel="noopener">Event website <span>&rarr;</span></a>
    </article>
    <?php endforeach; ?>
  </div>
</div></section>

<?php
echo envue_faq_section([
    'Are EnVue Telematics webinars free?' => '<p>Yes. EnVue webinars are free to attend. Register on our webinar channel to reserve your seat and receive reminders, and recordings are typically available on demand for registrants who can&rsquo;t attend live.</p>',
    'How do I find out about upcoming EnVue events?' => '<p>Sign up for updates on the EnVue webinar channel to be notified when new webinars are scheduled, or follow EnVue Telematics on LinkedIn for trade show and conference announcements.</p>',
    'Can I schedule a meeting with EnVue at a trade show?' => '<p>Yes. Contact EnVue Telematics at (800) 201-1169 or sales@et-envue.com before the event and we&rsquo;ll arrange time with a fleet expert at the show.</p>',
], 'Events FAQ');
?>

</main>
<section class="final-cta final-cta--form" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">Meet EnVue</span><h2>Can&rsquo;t wait for the next event?</h2>
    <p>Talk to an EnVue fleet expert today about GPS tracking, AI dash cams, compliance, and the Geotab platform — and get a free assessment of your fleet&rsquo;s biggest opportunities.</p>
    <p class="demo-call">Prefer to talk? Call <a href="tel:8002011169">(800) 201-1169</a> &mdash; US-based fleet experts, 24/7.</p>
  </div>
  <div><?php echo envue_demo_form(); ?></div>
</div></section>
<?php get_footer(); ?>
