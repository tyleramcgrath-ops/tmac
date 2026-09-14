<?php
/*
 * Template Name: Partners
 */
get_header();

envue_page_hero(
    'The ecosystem behind your fleet.',
    'Elite Extra, Lytx, Drivewyze, Fleetio, LifeSaver Mobile, Route4Me, Surfsight and more — integrated and supported through one relationship.',
    'Partners',
    'https://images.unsplash.com/photo-1745956983820-6e960f7e8472?auto=format&fit=crop&w=2000&q=80',
    [ 'Partners' => '' ]
);
?>

<main id="main">
  <section class="section">
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="eyebrow">Integrations</span>
          <h2>No rip-and-replace.</h2>
        </div>
        <p>EnVue plugs into the systems your team already uses. Where a partner tool does the job better, we integrate it rather than asking you to change how you dispatch.</p>
      </div>

      <div class="feature-trio">
        <div class="reveal">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </div>
          <h3>Dispatch &amp; routing</h3>
          <p>Elite Extra and Route4Me connect delivery routing to live vehicle data.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/partners/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:1">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </div>
          <h3>Safety &amp; video</h3>
          <p>Lytx, Surfsight and LifeSaver Mobile extend the camera and distracted-driving program.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/partners/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:2">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          </div>
          <h3>Compliance &amp; maintenance</h3>
          <p>Drivewyze weigh-station bypass and Fleetio maintenance records, on the same account.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/partners/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
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
