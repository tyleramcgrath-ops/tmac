<?php
/**
 * News / Press Room — also serves /blog-articles/ via page-blog-articles.php,
 * which sets $envue_listing before including this file.
 *
 * News: posts in the "news" category (falls back to all recent posts if that
 * category is missing or empty). Blog Articles: all posts except news.
 */
$envue_listing = wp_parse_args( $envue_listing ?? [], [
    'mode'     => 'news',
    'path'     => '/news/',
    'crumb'    => 'News',
    'eyebrow'  => 'EnVue Newsroom',
    'h1'       => 'Timely Fleet-Focused Updates.',
    'lede'     => 'Company news, partnerships, award announcements, and industry updates from EnVue Telematics — the Geotab Elite Specialized Partner serving commercial fleets across the United States and Mexico.',
    'grid_eb'  => 'Latest News',
    'grid_h2'  => 'Announcements and updates.',
    'hero_img' => 'https://envuetelematics.com/wp-content/uploads/2025/01/EnVue-Telematics-Offers-Digital-Fleet-Resource-768x512.jpg',
] );

get_header();

$paged = max( 1, (int) get_query_var( 'paged' ), (int) get_query_var( 'page' ) );
$args  = [
    'post_type'           => 'post',
    'post_status'         => 'publish',
    'posts_per_page'      => 9,
    'paged'               => $paged,
    'ignore_sticky_posts' => true,
];
$news_cat = get_category_by_slug( 'news' );
if ( $news_cat && $news_cat->count > 0 ) {
    if ( 'news' === $envue_listing['mode'] ) {
        $args['cat'] = $news_cat->term_id;
    } else {
        $args['category__not_in'] = [ $news_cat->term_id ];
    }
}
$news = new WP_Query( $args );
?>
<main id="main">

<section class="page-hero">
  <img class="page-hero-bg" src="<?php echo esc_url( $envue_listing['hero_img'] ); ?>" alt="<?php echo esc_attr( $envue_listing['crumb'] ); ?> from EnVue Telematics" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url(home_url("/")); ?>">Home</a> / <a href="<?php echo esc_url(home_url("/resources/")); ?>">Resources</a> / <a href="<?php echo esc_url( home_url( $envue_listing['path'] ) ); ?>"><?php echo esc_html( $envue_listing['crumb'] ); ?></a></nav>
    <span class="eyebrow eyebrow--light"><?php echo esc_html( $envue_listing['eyebrow'] ); ?></span>
    <h1><?php echo esc_html( $envue_listing['h1'] ); ?></h1>
    <p><?php echo esc_html( $envue_listing['lede'] ); ?></p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="#latest-news">Read the Latest <span>&rarr;</span></a>
      <a class="button button-ghost button-lg" href="<?php echo esc_url(home_url("/events-calendar/")); ?>">Upcoming Events</a>
    </div>
  </div>
</section>

<?php if ( 'news' === $envue_listing['mode'] ) : ?>
<!-- Intro -->
<section class="section"><div class="wrap">
  <div class="section-head"><div>
    <span class="eyebrow reveal">About the Newsroom</span>
    <h2 class="reveal" style="--d:1">What&rsquo;s new at EnVue Telematics.</h2>
  </div><div class="reveal" style="--d:2">
    <p>This is where EnVue shares what&rsquo;s changing for our customers and the fleets we serve: new technology partnerships and Geotab Marketplace integrations, product and platform updates, company milestones and awards, and the FMCSA and industry changes that affect how commercial fleets operate. If it matters to your fleet, you&rsquo;ll find it here first.</p>
  </div></div>
  <div class="news-topics reveal" style="--d:2">
    <div><strong>Company News</strong><span>Milestones, awards, and team announcements</span></div>
    <div><strong>Partner Launches</strong><span>New integrations across the Geotab ecosystem</span></div>
    <div><strong>Product Updates</strong><span>Platform, dash cam, and hardware releases</span></div>
    <div><strong>Industry &amp; Regulatory</strong><span>ELD, HOS, and compliance changes for fleets</span></div>
  </div>
</div></section>

<?php endif; ?>

<!-- Post loop -->
<section class="section section--soft" id="latest-news"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal"><?php echo esc_html( $envue_listing['grid_eb'] ); ?></span>
    <h2 class="reveal" style="--d:1"><?php echo esc_html( $envue_listing['grid_h2'] ); ?></h2>
  </div></div>

  <?php if ( $news->have_posts() ) : ?>
    <div class="resources-grid">
      <?php $i = 0; while ( $news->have_posts() ) : $news->the_post(); $d = $i % 3; $i++;
        $cats  = get_the_category();
        $badge = $cats ? $cats[0]->name : 'News';
      ?>
      <article class="resource-card news-card reveal"<?php echo $d ? ' style="--d:' . $d . '"' : ''; ?>>
        <a class="resource-card-img" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
          <?php if ( has_post_thumbnail() ) : ?>
            <?php the_post_thumbnail( 'medium_large', [ 'loading' => 'lazy', 'alt' => esc_attr( get_the_title() ) ] ); ?>
          <?php else : ?>
            <span class="news-card-placeholder"><img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/envue-logo.png' ); ?>" alt="" loading="lazy"></span>
          <?php endif; ?>
          <span class="resource-category-badge"><?php echo esc_html( $badge ); ?></span>
        </a>
        <div class="resource-card-body">
          <time class="news-date" datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
          <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
          <p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 28, '…' ) ); ?></p>
          <a class="resource-card-link" href="<?php the_permalink(); ?>" aria-label="<?php echo esc_attr( 'Read more: ' . get_the_title() ); ?>">Read more <span>&rarr;</span></a>
        </div>
      </article>
      <?php endwhile; ?>
    </div>

    <?php
    $links = paginate_links( [
        'total'     => $news->max_num_pages,
        'current'   => $paged,
        'prev_text' => '&larr; Newer',
        'next_text' => 'Older &rarr;',
        'type'      => 'array',
    ] );
    if ( $links ) :
    ?>
      <nav class="news-pagination" aria-label="News pagination">
        <?php foreach ( $links as $link ) echo wp_kses_post( $link ); ?>
      </nav>
    <?php endif; ?>

  <?php else : ?>
    <div class="news-empty reveal">
      <h3>No announcements yet &mdash; check back soon.</h3>
      <p>In the meantime, browse our fleet management guides or talk to an EnVue fleet expert about what&rsquo;s new for your operation.</p>
      <div class="hero-actions">
        <a class="button button-primary" href="<?php echo esc_url(home_url("/resources/")); ?>">Browse Resources <span>&rarr;</span></a>
        <a class="button button-outline" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Contact Us</a>
      </div>
    </div>
  <?php endif; wp_reset_postdata(); ?>
</div></section>

<?php if ( 'news' === $envue_listing['mode'] ) : ?>
<!-- Media inquiries -->
<section class="section"><div class="wrap">
  <div class="news-media reveal">
    <div>
      <span class="eyebrow">Media &amp; Press</span>
      <h2>Press inquiries</h2>
      <p>Journalists, analysts, and partners looking for comment, company background, or information about EnVue Telematics deployments can reach our team directly. We respond to media requests within one business day.</p>
    </div>
    <ul class="check-list">
      <li><span><strong>Email:</strong>&nbsp;<a href="mailto:sales@et-envue.com">sales@et-envue.com</a></span></li>
      <li><span><strong>Phone:</strong>&nbsp;<a href="tel:8002011169">(800) 201-1169</a></span></li>
      <li><span><strong>Headquarters:</strong>&nbsp;119 West Tyler Street, Suite 100, Longview, Texas 75601</span></li>
      <li><span><strong>Company background:</strong>&nbsp;<a href="<?php echo esc_url(home_url("/company/")); ?>">About EnVue</a></span></li>
    </ul>
  </div>
</div></section>
<?php endif; ?>

</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">Stay Informed</span><h2>See what&rsquo;s new for your fleet.</h2></div>
  <div><p>Talk to an EnVue fleet expert about the latest Geotab platform capabilities, partner integrations, and compliance changes — and what they mean for your operation.</p>
  <div class="hero-actions">
    <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Talk to a Fleet Expert <span>&rarr;</span></a>
    <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
  </div></div>
</div></section>
<?php get_footer(); ?>
