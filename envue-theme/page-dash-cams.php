<?php
/*
 * Template Name: Dash Cams
 */
get_header();

envue_page_hero(
    'See every incident before it becomes a claim.',
    'Cameras that trigger automatically on hard braking, swerving and distracted driving — and put exonerating footage in your legal team&rsquo;s hands in seconds.',
    'AI dash cams',
    'https://images.unsplash.com/photo-1744884275743-4b075af04f62?auto=format&fit=crop&w=2000&q=80',
    [ 'Dash Cams' => '' ]
);
?>

<main id="main">
  <section class="section">
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="eyebrow">Video safety</span>
          <h2>Evidence, not arguments.</h2>
        </div>
        <p>When an incident happens, the question is who pays. Event-triggered video answers it with footage from both sides of the windshield, tagged and time-stamped.</p>
      </div>

      <div class="feature-trio">
        <div class="reveal">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </div>
          <h3>Automatic event capture</h3>
          <p>Eight seconds either side of every hard event, uploaded and tagged without anyone pressing a button.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/dash-cams/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:1">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </div>
          <h3>In-cab alerts</h3>
          <p>Real-time distracted driving warnings that correct behavior before it becomes an incident.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/dash-cams/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:2">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          </div>
          <h3>Driver coaching</h3>
          <p>Automated scorecards and a coaching queue that shows drivers the context, not just the score.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/dash-cams/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
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
