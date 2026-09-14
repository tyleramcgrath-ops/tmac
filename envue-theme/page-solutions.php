<?php
/*
 * Template Name: Solutions
 */
get_header();

envue_page_hero(
    'Fleet solutions that pay for themselves.',
    'AI-powered tools that reduce risk, control costs and lift productivity across the whole operation — on one platform, with one team supporting it.',
    'Full platform',
    'https://images.unsplash.com/photo-1703194531119-e8b98a555cb6?auto=format&fit=crop&w=2000&q=80',
    [ 'Solutions' => '' ]
);
?>

<main id="main">
  <section class="section">
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="eyebrow">The platform</span>
          <h2>Every tool your fleet needs.</h2>
        </div>
        <p>Built on Geotab, the world&rsquo;s largest open telematics platform. It connects to the hardware and software you already run on day one, and grows with the fleet instead of being replaced by it.</p>
      </div>

      <div class="feature-trio">
        <div class="reveal">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </div>
          <h3>AI Dash Cams</h3>
          <p>Event-triggered recording, AI coaching and liability-proof footage that pays for itself on the first prevented claim.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/dash-cams/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:1">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </div>
          <h3>GPS Tracking</h3>
          <p>Live location, geofencing and trip history. Every vehicle documented, every mile accounted for.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/gps-tracking/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:2">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          </div>
          <h3>Equipment &amp; Assets</h3>
          <p>Powered and non-powered asset tracking with utilization reporting and theft prevention.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/equipment-management/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19"/></svg>
          </div>
          <h3>Predictive Maintenance</h3>
          <p>OBD fault alerts that stop a $12,000 breakdown before it pulls a truck off the road.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/maintenance/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:1">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18M7 15l4-4 3 3 5-6"/></svg>
          </div>
          <h3>Fuel Management</h3>
          <p>Idle reduction, MPG benchmarking and fuel card integration that makes fuel spend controllable.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/fuel-management/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:2">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0H5a2 2 0 0 1-2-2V9m6 12h10a2 2 0 0 0 2-2V9M3 9h18"/></svg>
          </div>
          <h3>Powered by Geotab</h3>
          <p>An open API and 300+ integrations, so your data stays yours and connects to what you already pay for.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/geotab/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
      </div>

      <?php
      while ( have_posts() ) :
          the_post();
          if ( trim( get_the_content() ) ) :
              ?><div class="lede" style="margin-top:56px;max-width:70ch"><?php the_content(); ?></div><?php
          endif;
      endwhile;
      ?>
    </div>
  </section>
</main>

<?php
envue_final_cta();
get_footer();
