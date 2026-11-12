<?php
/**
 * Fallback for archives (category, tag, date, author) and search results.
 */
get_header();

if ( is_search() ) {
    $eyebrow = 'Search';
    $heading = sprintf( 'Results for “%s”', get_search_query() );
} elseif ( is_archive() ) {
    $eyebrow = 'Archive';
    $heading = wp_strip_all_tags( get_the_archive_title() );
} else {
    $eyebrow = 'EnVue Telematics';
    $heading = 'Latest Articles';
}
?>
<main id="main">

<section class="page-hero">
  <img class="page-hero-bg" src="https://images.unsplash.com/photo-1543996991-51fe458abfbd?auto=format&amp;fit=crop&amp;w=1920&amp;q=72" srcset="https://images.unsplash.com/photo-1543996991-51fe458abfbd?auto=format&amp;fit=crop&amp;w=768&amp;q=72 768w, https://images.unsplash.com/photo-1543996991-51fe458abfbd?auto=format&amp;fit=crop&amp;w=1280&amp;q=72 1280w, https://images.unsplash.com/photo-1543996991-51fe458abfbd?auto=format&amp;fit=crop&amp;w=1920&amp;q=72 1920w, https://images.unsplash.com/photo-1543996991-51fe458abfbd?auto=format&amp;fit=crop&amp;w=2560&amp;q=72 2560w" sizes="100vw" alt="Aerial view of stacked freeway overpasses and interchange ramps" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url(home_url("/")); ?>">Home</a> / <a href="<?php echo esc_url(home_url("/blog-articles/")); ?>">Blog Articles</a></nav>
    <span class="eyebrow eyebrow--light"><?php echo esc_html( $eyebrow ); ?></span>
    <h1><?php echo esc_html( $heading ); ?></h1>
    <?php if ( is_search() ) : ?>
      <form class="search-inline" role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
        <label class="screen-reader-text" for="s">Search</label>
        <input type="search" id="s" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="Search EnVue Telematics">
        <button class="button button-primary" type="submit">Search</button>
      </form>
    <?php endif; ?>
  </div>
</section>

<section class="section section--soft"><div class="wrap">
  <?php if ( have_posts() ) : ?>
    <div class="resources-grid">
      <?php $i = 0; while ( have_posts() ) : the_post(); $d = $i % 3; $i++;
        $cats  = get_the_category();
        $badge = $cats ? $cats[0]->name : ucfirst( get_post_type() );
      ?>
      <article class="resource-card news-card"<?php echo $d ? ' style="--d:' . $d . '"' : ''; ?>>
        <a class="resource-card-img" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
          <?php if ( has_post_thumbnail() ) : ?>
            <?php the_post_thumbnail( 'medium_large', [ 'loading' => 'lazy', 'alt' => esc_attr( get_the_title() ) ] ); ?>
          <?php else : ?>
            <span class="news-card-placeholder"><img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/envue-logo.png' ); ?>" alt="" loading="lazy"></span>
          <?php endif; ?>
          <span class="resource-category-badge"><?php echo esc_html( $badge ); ?></span>
        </a>
        <div class="resource-card-body">
          <?php if ( 'post' === get_post_type() ) : ?>
            <time class="news-date" datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
          <?php endif; ?>
          <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
          <p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 28, '…' ) ); ?></p>
          <a class="resource-card-link" href="<?php the_permalink(); ?>" aria-label="<?php echo esc_attr( 'Read more: ' . get_the_title() ); ?>">Read more <span>&rarr;</span></a>
        </div>
      </article>
      <?php endwhile; ?>
    </div>
    <?php
    $links = paginate_links( [ 'prev_text' => '&larr; Newer', 'next_text' => 'Older &rarr;', 'type' => 'array' ] );
    if ( $links ) :
    ?>
      <nav class="news-pagination" aria-label="Pagination">
        <?php foreach ( $links as $link ) echo wp_kses_post( $link ); ?>
      </nav>
    <?php endif; ?>
  <?php else : ?>
    <div class="news-empty">
      <h3>Nothing found.</h3>
      <p>Try a different search, browse our fleet management articles, or talk to an EnVue fleet expert.</p>
      <div class="hero-actions">
        <a class="button button-primary" href="<?php echo esc_url(home_url("/blog-articles/")); ?>">Blog Articles <span>&rarr;</span></a>
        <a class="button button-outline" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Contact Us</a>
      </div>
    </div>
  <?php endif; ?>
</div></section>

</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">Next Step</span><h2>Ready to talk about your fleet?</h2></div>
  <div><p>Talk to an EnVue fleet expert about GPS tracking, AI dash cams, compliance, and the Geotab platform — and get a free assessment of your fleet&rsquo;s biggest opportunities.</p>
  <div class="hero-actions">
    <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Talk to a Fleet Expert <span>&rarr;</span></a>
    <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
  </div></div>
</div></section>
<?php get_footer(); ?>
