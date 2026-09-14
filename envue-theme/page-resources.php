<?php
/*
 * Template Name: Resources
 */
get_header();

envue_page_hero(
    'Tools and reading for fleet leaders.',
    'ROI calculators, deployment guides and the reporting templates our customers use to make the case internally.',
    'Resources',
    'https://images.unsplash.com/photo-1736134869393-bb43683d5d28?auto=format&fit=crop&w=2000&q=80',
    [ 'Resources' => '' ]
);
?>

<main id="main">
  <section class="section">
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="eyebrow">Start here</span>
          <h2>Build the business case.</h2>
        </div>
        <p>Most fleets know they need visibility. What they need on paper is the number. These are the tools we use with customers to get to it.</p>
      </div>

      <div class="feature-trio">
        <div class="reveal">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </div>
          <h3>Fleet ROI calculator</h3>
          <p>Estimate annual savings from idle control, routing and maintenance alerts against your own fuel spend.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/resources/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:1">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </div>
          <h3>Deployment guide</h3>
          <p>What the four-week rollout looks like, who needs to be involved and what to prepare before install day.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/resources/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:2">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          </div>
          <h3>Compliance checklist</h3>
          <p>HOS, IFTA, DVIR and DOT reporting requirements, and which are automated by the platform.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/resources/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
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
