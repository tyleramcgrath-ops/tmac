<?php
/*
 * Template Name: Company
 */
get_header();

envue_page_hero(
    'A telematics partner, not a hardware vendor.',
    'EnVue Telematics deploys connected fleet technology for operations leaders across the United States — and stays through adoption, training and quarterly optimization.',
    'About EnVue',
    'https://images.unsplash.com/photo-1703194531119-e8b98a555cb6?auto=format&fit=crop&w=2000&q=80',
    [ 'Company' => '' ]
);
?>

<main id="main">
  <section class="section">
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="eyebrow">How we work</span>
          <h2>The rollout is the product.</h2>
        </div>
        <p>Anyone can ship you a device. The difference is whether dispatch, safety and maintenance are still using it in month six — which is what our deployment process is built around.</p>
      </div>

      <div class="feature-trio">
        <div class="reveal">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </div>
          <h3>Assessment first</h3>
          <p>We review vehicles, routes, risk and reporting gaps before a single device is ordered.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/company/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:1">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </div>
          <h3>Trained, not just installed</h3>
          <p>Role-based training for the people who use the platform daily, not a PDF handed to the fleet manager.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/company/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
        </div>
        <div class="reveal" style="--d:2">
          <div class="feature-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          </div>
          <h3>Quarterly reviews</h3>
          <p>Cost per mile, idle, safety events and utilization benchmarked against your baseline, every quarter.</p>
          <p style="margin-top:14px"><a class="text-link" href="<?php echo esc_url( home_url( '/company/' ) ); ?>">Learn more <span>&rarr;</span></a></p>
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
