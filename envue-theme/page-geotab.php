<?php
/*
 * Template Name: Geotab
 */
get_header();

envue_page_hero(
    'The open platform underneath everything.',
    'EnVue deploys, configures and supports Geotab — the world&rsquo;s largest open telematics platform — for fleets that want the data without running the integration themselves.',
    'Powered by Geotab',
    'https://images.unsplash.com/photo-1643686978040-beac9782e58b?auto=format&fit=crop&w=2000&q=80',
    [ 'Geotab' => '' ]
);
?>

<main id="main">
  <section class="section">
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="eyebrow">Why it matters</span>
          <h2>Open beats proprietary.</h2>
        </div>
        <p>A closed platform decides what you are allowed to know about your own fleet. Geotab&rsquo;s open API means your data connects to the dispatch, ERP and fuel systems you already run.</p>
      </div>

      <div class="feature-trio">
        <div class="reveal">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </div>
          <h3>The GO device</h3>
          <p>Plugs into the OBD port in under five minutes per vehicle and reports from the moment it powers up.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/geotab/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:1">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </div>
          <h3>MyGeotab</h3>
          <p>One map, one set of reports and role-based views for dispatch, safety, maintenance and leadership.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/geotab/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:2">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          </div>
          <h3>300+ integrations</h3>
          <p>Cameras, sensors, fuel cards and software add on without a second platform or a second login.</p>
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
