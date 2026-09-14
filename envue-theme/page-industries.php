<?php
/*
 * Template Name: Industries
 */
get_header();

envue_page_hero(
    'Built for fleets that keep America moving.',
    'Construction, trucking, logistics, field services, energy and government fleets run on EnVue — each with the reporting their regulators and customers demand.',
    'Industries served',
    'https://images.unsplash.com/photo-1534097575056-ddba81f714c8?auto=format&fit=crop&w=2000&q=80',
    [ 'Industries' => '' ]
);
?>

<main id="main">
  <section class="section">
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="eyebrow">Operations</span>
          <h2>The same platform, tuned per sector.</h2>
        </div>
        <p>What a construction yard needs from telematics is not what a distribution fleet needs. The deployment is configured around your operation, not a generic template.</p>
      </div>

      <div class="feature-trio">
        <div class="reveal">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </div>
          <h3>Construction &amp; Heavy Equipment</h3>
          <p>Track every machine across sprawling job sites. Stop theft, cut idle, stay on schedule.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/industries/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:1">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </div>
          <h3>Trucking &amp; Transportation</h3>
          <p>HOS automation, DOT compliance and video-based liability protection for every haul.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/industries/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:2">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          </div>
          <h3>Logistics &amp; Distribution</h3>
          <p>Container-level tracking, dynamic dispatching and terminal visibility at scale.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/industries/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19"/></svg>
          </div>
          <h3>Field Service Operations</h3>
          <p>Dynamic dispatching and technician accountability that turn calls into competitive edge.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/industries/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:1">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18M7 15l4-4 3 3 5-6"/></svg>
          </div>
          <h3>Oil &amp; Gas / Energy</h3>
          <p>Remote tracking, lone worker safety and regulatory compliance for high-stakes field ops.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/industries/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:2">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0H5a2 2 0 0 1-2-2V9m6 12h10a2 2 0 0 0 2-2V9M3 9h18"/></svg>
          </div>
          <h3>Government &amp; Municipal</h3>
          <p>Public accountability dashboards and compliance automation for city and county fleets.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/industries/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
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
