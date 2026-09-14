<?php
/*
 * Template Name: Results
 */
get_header();

envue_page_hero(
    'Measurable ROI across every dimension.',
    'Six performance dimensions, tracked and benchmarked with data from real fleets across every major industry we serve.',
    'Proven results',
    'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=2000&q=80',
    [ 'Results' => '' ]
);
?>

<main id="main">
  <section class="section">
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="eyebrow">The numbers</span>
          <h2>What changes in the first year.</h2>
        </div>
        <p>These are the averages across deployed EnVue fleets. Your baseline decides where you land in the range — we set that baseline together during the assessment.</p>
      </div>

      <div class="feature-trio">
        <div class="reveal">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </div>
          <h3>31% fewer accidents</h3>
          <p>AI dash cams build a documented record that protects the company in litigation and coaches drivers before incidents happen.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/company/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:1">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </div>
          <h3>7% better fuel economy</h3>
          <p>Idle reduction, fuel card integration and MPG benchmarking turn fuel spend into a reportable, controllable cost.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/fuel-management/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:2">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          </div>
          <h3>40% dispatch efficiency</h3>
          <p>Live location and route adherence cut the time between a customer call and a truck arriving.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/gps-tracking/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19"/></svg>
          </div>
          <h3>15% lower emissions</h3>
          <p>Identify the highest-emitting vehicles, plan the EV transition with real utilization data, and report automatically.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/company/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:1">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18M7 15l4-4 3 3 5-6"/></svg>
          </div>
          <h3>100% audit ready</h3>
          <p>Automated HOS, DOT and FMCSA reporting plus electronic DVIR keep the fleet compliant without manual paperwork.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/company/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:2">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0H5a2 2 0 0 1-2-2V9m6 12h10a2 2 0 0 0 2-2V9M3 9h18"/></svg>
          </div>
          <h3>300+ integrations</h3>
          <p>Open API, plug-and-play hardware and consolidated reporting across every system the operation runs.</p>
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
