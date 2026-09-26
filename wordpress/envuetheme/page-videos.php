<?php get_header(); ?>
<main id="main">

<section class="page-hero">
  <img class="page-hero-bg" src="https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&amp;fit=crop&amp;w=1920&amp;q=72" srcset="https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&amp;fit=crop&amp;w=768&amp;q=72 768w, https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&amp;fit=crop&amp;w=1280&amp;q=72 1280w, https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&amp;fit=crop&amp;w=1920&amp;q=72 1920w, https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&amp;fit=crop&amp;w=2560&amp;q=72 2560w" sizes="100vw" alt="Rows of empty conference seats under blue light" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url(home_url("/")); ?>">Home</a> / <a href="<?php echo esc_url(home_url("/videos/")); ?>">Videos</a></nav>
    <span class="eyebrow eyebrow--light">EnVue Video Hub</span>
    <h1>Interviews &bull; Podcasts &bull; Webinars</h1>
    <p>Partner webinars, event appearances, and interviews from the EnVue Telematics team on fleet safety, technology, and industry insights.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Get a Demo <span>&rarr;</span></a>
      <a class="button button-ghost button-lg" href="https://www.youtube.com/@Envue_Telematics" target="_blank" rel="noopener noreferrer">View YouTube Channel</a>
    </div>
  </div>
</section>

<style>
.vh-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
@media(max-width:1024px){.vh-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:680px){.vh-grid{grid-template-columns:1fr;}}
.vh-card{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden;display:flex;flex-direction:column;}
.vh-embed{position:relative;aspect-ratio:16/9;background:#000;}
.vh-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}
.vh-meta{padding:18px 20px 22px;}
.vh-tag{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--brand);background:var(--bg-soft);border-radius:999px;padding:5px 10px;}
.vh-meta h3{margin:10px 0 6px;font-size:1.1rem;color:var(--ink);}
.vh-meta p{margin:0;color:var(--slate);font-size:.95rem;line-height:1.6;}
</style>

<section class="section"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">Watch</span>
    <h2 class="reveal" style="--d:1">Fleet safety, technology, and industry insights on video.</h2>
  </div></div>

  <div class="vh-grid">
    <?php
    $envue_videos = [
        ['MgBGiJ0L7Zc', 'Webinar',   'Driving Smarter: Data-Driven Coaching & AI', 'Partner webinar with Predictive Coach & Greater Than on real-time coaching and AI for fleet safety.'],
        ['hL6b0NO6dDA', 'Event',     'EnVue at DRIVE Summit',                      'Talking customer expectations in the fleet industry from a partner perspective.'],
        ['IhM0_K3oj1Y', 'Interview', 'Making the Right Telematics Choice',         'Randy Read discusses how to evaluate telematics options and align with business goals.'],
        ['hcsOfE6Icv0', 'Webinar',   'Reduce Fleet Risk & CPM',                    'Sponsored session on lowering risk and cents-per-mile with smarter tech.'],
        ['zuDsE_c6IVg', 'Interview', 'Who is EnVue Telematics?',                   'A quick intro to our consultative approach and last-mile expertise.'],
        ['2f29VaXuDgY', 'Webinar',   'Driving Safety Forward',                     'Partner webinar on fleet safety & efficiency with OK Alone and LifeSaver Mobile.'],
    ];
    foreach ( $envue_videos as $i => $v ) :
        list( $yt, $tag, $title, $desc ) = $v;
    ?>
    <article class="vh-card reveal" style="--d:<?php echo (int) ( $i % 3 ); ?>">
      <div class="vh-embed">
        <iframe src="<?php echo esc_url( 'https://www.youtube.com/embed/' . $yt ); ?>" title="<?php echo esc_attr( $title ); ?>" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>
      <div class="vh-meta">
        <span class="vh-tag"><?php echo esc_html( $tag ); ?></span>
        <h3><?php echo esc_html( $title ); ?></h3>
        <p><?php echo esc_html( $desc ); ?></p>
      </div>
    </article>
    <?php endforeach; ?>
  </div>
</div></section>

<section class="section section--soft"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">More Videos</span>
    <h2 class="reveal" style="--d:1">Subscribe to EnVue Telematics on YouTube.</h2>
    <div class="hero-actions reveal" style="--d:2; justify-content:center;">
      <a class="button button-primary" href="https://www.youtube.com/@Envue_Telematics" target="_blank" rel="noopener noreferrer">View Channel <span>&rarr;</span></a>
    </div>
  </div></div>
</div></section>

</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">EnVue Telematics</span><h2>See the impact in your fleet.</h2></div>
  <div><p>Talk with an EnVue fleet expert about GPS tracking, AI dash cams, and Geotab-powered fleet management for your operation.</p>
  <div class="hero-actions">
    <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Get a Demo <span>&rarr;</span></a>
    <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
  </div></div>
</div></section>
<?php get_footer(); ?>
