<?php get_header(); ?>
<main id="main">

<section class="page-hero">
  <img class="page-hero-bg" src="https://images.unsplash.com/photo-1675889335425-a4af2d00154d?auto=format&amp;fit=crop&amp;w=1920&amp;q=72" srcset="https://images.unsplash.com/photo-1675889335425-a4af2d00154d?auto=format&amp;fit=crop&amp;w=768&amp;q=72 768w, https://images.unsplash.com/photo-1675889335425-a4af2d00154d?auto=format&amp;fit=crop&amp;w=1280&amp;q=72 1280w, https://images.unsplash.com/photo-1675889335425-a4af2d00154d?auto=format&amp;fit=crop&amp;w=1920&amp;q=72 1920w, https://images.unsplash.com/photo-1675889335425-a4af2d00154d?auto=format&amp;fit=crop&amp;w=2560&amp;q=72 2560w" sizes="100vw" alt="White semi-truck crossing a sunlit desert road" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url(home_url("/")); ?>">Home</a> / Page not found</nav>
    <span class="eyebrow eyebrow--light">404</span>
    <h1>We couldn&rsquo;t find that page.</h1>
    <p>The page may have moved or no longer exists. Try one of the links below, or search the site.</p>
    <form class="search-inline" role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
      <label class="screen-reader-text" for="s">Search</label>
      <input type="search" id="s" name="s" placeholder="Search EnVue Telematics">
      <button class="button button-primary" type="submit">Search</button>
    </form>
  </div>
</section>

<section class="section"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow">Popular Pages</span>
    <h2>Where would you like to go?</h2>
  </div></div>
  <ul class="check-list check-list--2col">
    <li><a href="<?php echo esc_url(home_url("/dash-cams/")); ?>"><strong>AI Dash Cams</strong></a> &mdash; Event-triggered video and driver coaching</li>
    <li><a href="<?php echo esc_url(home_url("/gps-tracking/")); ?>"><strong>GPS Tracking</strong></a> &mdash; Live location, geofencing and trip history</li>
    <li><a href="<?php echo esc_url(home_url("/industries/")); ?>"><strong>Industries</strong></a> &mdash; Construction, trucking, field services and more</li>
    <li><a href="<?php echo esc_url(home_url("/our-partners/")); ?>"><strong>Our Partners</strong></a> &mdash; 25+ fleet technology integrations</li>
    <li><a href="<?php echo esc_url(home_url("/blog-articles/")); ?>"><strong>Blog Articles</strong></a> &mdash; Fleet management insights and guides</li>
    <li><a href="<?php echo esc_url(home_url("/get-in-touch/")); ?>"><strong>Get In Touch</strong></a> &mdash; Talk to an EnVue fleet expert</li>
  </ul>
</div></section>

</main>
<section class="final-cta final-cta--form" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">Next Step</span><h2>Ready to talk about your fleet?</h2>
    <p>Call us at (800) 201-1169 or send a message — US-based fleet experts are available 24/7.</p>
    <p class="demo-call">Prefer to talk? Call <a href="tel:8002011169">(800) 201-1169</a> &mdash; US-based fleet experts, 24/7.</p>
  </div>
  <div><?php echo envue_demo_form(); ?></div>
</div></section>
<?php get_footer(); ?>
