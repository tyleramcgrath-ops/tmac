<?php
/**
 * Single blog post / news article.
 * Post bodies are rendered from the editor (the_content) inside the theme's
 * page chrome, with a share rail, a sidebar (contents, CTA, recent articles)
 * and a reading-progress bar. News-category posts breadcrumb to /news/,
 * everything else to /blog-articles/.
 */
get_header();

$envue_fallback_img = 'https://images.unsplash.com/photo-1509165131529-1a871efb4a6e?auto=format&fit=crop&w=%d&q=72';

while ( have_posts() ) : the_post();
    $post_id   = get_the_ID();
    $is_news   = has_category( 'news' );
    $list_path = $is_news ? '/news/' : '/blog-articles/';
    $list_name = $is_news ? 'News' : 'Blog Articles';
    $cats      = get_the_category();
    $badge     = $cats ? $cats[0]->name : $list_name;
    $hero      = has_post_thumbnail() ? get_the_post_thumbnail_url( null, 'full' ) : sprintf( $envue_fallback_img, 1920 );
    $words     = str_word_count( wp_strip_all_tags( get_post_field( 'post_content', $post_id ) ) );
    $minutes   = max( 1, (int) round( $words / 225 ) );
    $permalink = get_permalink();
    $title_txt = wp_strip_all_tags( get_the_title() );
    $modified  = get_the_modified_date( 'U' ) > get_the_date( 'U' ) + DAY_IN_SECONDS;

    $share = [
        'linkedin' => [ 'LinkedIn', 'https://www.linkedin.com/sharing/share-offsite/?url=' . rawurlencode( $permalink ) ],
        'facebook' => [ 'Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' . rawurlencode( $permalink ) ],
        'x'        => [ 'X', 'https://twitter.com/intent/tweet?url=' . rawurlencode( $permalink ) . '&text=' . rawurlencode( $title_txt ) ],
    ];
    $icons = envue_social_profiles();
    $mail_icon = '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.3V17h16V7.3l-8 5.6zM5.4 7l6.6 4.6L18.6 7z"/>';
    $link_icon = '<path d="M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0zM8.5 20a4.5 4.5 0 0 1-3.2-7.7l2.5-2.5a1 1 0 1 1 1.4 1.4l-2.5 2.5a2.5 2.5 0 0 0 3.5 3.5l2.5-2.5a1 1 0 1 1 1.4 1.4l-2.5 2.5A4.5 4.5 0 0 1 8.5 20zm7.7-5.8a1 1 0 0 1-.7-1.7l2.5-2.5a2.5 2.5 0 0 0-3.5-3.5L12 9a1 1 0 1 1-1.4-1.4l2.5-2.5a4.5 4.5 0 0 1 6.4 6.4L17 14a1 1 0 0 1-.8.2z"/>';
    $share_html = function ( $class ) use ( $share, $icons, $permalink, $title_txt, $mail_icon, $link_icon ) {
        $o = '<ul class="share-list ' . $class . '">';
        foreach ( $share as $k => $s ) {
            $o .= '<li><a class="share-btn share-btn--' . $k . '" href="' . esc_url( $s[1] ) . '" target="_blank" rel="noopener" aria-label="Share on ' . esc_attr( $s[0] ) . '"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">' . $icons[ $k ][2] . '</svg></a></li>';
        }
        $o .= '<li><a class="share-btn share-btn--mail" href="' . esc_url( 'mailto:?subject=' . rawurlencode( $title_txt ) . '&body=' . rawurlencode( $permalink ) ) . '" aria-label="Share by email"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">' . $mail_icon . '</svg></a></li>';
        $o .= '<li><button class="share-btn share-btn--copy" type="button" data-copy="' . esc_url( $permalink ) . '" aria-label="Copy link"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">' . $link_icon . '</svg><span class="share-copied" role="status"></span></button></li>';
        return $o . '</ul>';
    };

    $recent = new WP_Query( [
        'post_type'           => 'post',
        'posts_per_page'      => 4,
        'post__not_in'        => [ $post_id ],
        'ignore_sticky_posts' => true,
        'no_found_rows'       => true,
    ] );
    $related = new WP_Query( [
        'post_type'           => 'post',
        'posts_per_page'      => 3,
        'post__not_in'        => [ $post_id ],
        'category__in'        => wp_list_pluck( $cats, 'term_id' ),
        'ignore_sticky_posts' => true,
        'no_found_rows'       => true,
        'orderby'             => 'rand',
    ] );
    if ( ! $related->have_posts() ) $related = $recent;
?>
<div class="read-progress" aria-hidden="true"><span></span></div>
<main id="main">

<section class="page-hero page-hero--post">
  <img class="page-hero-bg" src="<?php echo esc_url( $hero ); ?>" alt="" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url(home_url("/")); ?>">Home</a> / <a href="<?php echo esc_url( home_url( $list_path ) ); ?>"><?php echo esc_html( $list_name ); ?></a></nav>
    <span class="eyebrow eyebrow--light"><?php echo esc_html( $badge ); ?></span>
    <h1><?php the_title(); ?></h1>
    <p class="post-meta">
      <span class="post-meta-by">By EnVue Telematics</span>
      <span><time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time></span>
      <?php if ( $modified ) : ?><span>Updated <time datetime="<?php echo esc_attr( get_the_modified_date( 'c' ) ); ?>"><?php echo esc_html( get_the_modified_date() ); ?></time></span><?php endif; ?>
      <span><?php echo esc_html( $minutes ); ?> min read</span>
    </p>
  </div>
</section>

<section class="section post-section"><div class="wrap post-layout">

  <aside class="post-share-rail" aria-label="Share this article">
    <span class="post-share-label">Share</span>
    <?php echo $share_html( 'share-list--rail' ); ?>
  </aside>

  <div class="post-main">
    <article <?php post_class( 'entry-content' ); ?> id="post-body">
      <?php the_content(); ?>
      <?php wp_link_pages(); ?>
    </article>

    <?php $tags = get_the_tags(); if ( $tags ) : ?>
    <ul class="post-tags" aria-label="Tags">
      <?php foreach ( $tags as $t ) : ?><li><a href="<?php echo esc_url( get_tag_link( $t ) ); ?>">#<?php echo esc_html( $t->name ); ?></a></li><?php endforeach; ?>
    </ul>
    <?php endif; ?>

    <div class="post-share-end">
      <strong>Found this useful? Share it with your team.</strong>
      <?php echo $share_html( 'share-list--end' ); ?>
    </div>

    <div class="post-author">
      <span class="post-author-mark" aria-hidden="true">EV</span>
      <div>
        <strong>EnVue Telematics</strong>
        <p>A Geotab Elite Specialized Partner helping commercial fleets across the US and Mexico cut costs, improve safety and stay compliant with GPS tracking, AI dash cams and expert fleet consulting.</p>
        <a href="<?php echo esc_url( home_url( '/about-envue/' ) ); ?>">About EnVue <span>&rarr;</span></a>
      </div>
    </div>

    <p class="post-back"><a class="button button-outline" href="<?php echo esc_url( home_url( $list_path ) ); ?>">&larr; All <?php echo esc_html( $list_name ); ?></a></p>
  </div>

  <aside class="post-sidebar" aria-label="Sidebar">
    <div class="side-card side-cta">
      <span class="eyebrow eyebrow--light">Free Fleet Assessment</span>
      <h2>See what your fleet could save.</h2>
      <p>Talk to an EnVue fleet expert about GPS tracking, AI dash cams and compliance &mdash; no pressure, real answers.</p>
      <a class="button button-primary" href="<?php echo esc_url( home_url( '/get-in-touch/' ) ); ?>">Get a Free Demo <span>&rarr;</span></a>
      <a class="side-cta-phone" href="tel:8002011169">or call (800) 201-1169</a>
    </div>

    <?php if ( $recent->have_posts() ) : ?>
    <div class="side-card side-recent">
      <span class="side-title">Recent articles</span>
      <ul>
        <?php while ( $recent->have_posts() ) : $recent->the_post(); ?>
        <li><a href="<?php the_permalink(); ?>">
          <img src="<?php echo esc_url( has_post_thumbnail() ? get_the_post_thumbnail_url( null, 'thumbnail' ) : sprintf( $envue_fallback_img, 200 ) ); ?>" alt="" loading="lazy" width="72" height="72">
          <span><strong><?php the_title(); ?></strong><small><?php echo esc_html( get_the_date() ); ?></small></span>
        </a></li>
        <?php endwhile; wp_reset_postdata(); ?>
      </ul>
    </div>
    <?php endif; ?>

    <div class="side-card side-follow">
      <span class="side-title">Follow EnVue</span>
      <?php echo envue_social_links( 'social-links--side' ); ?>
    </div>

    <div class="side-sticky">
      <nav class="side-card side-toc" aria-label="In this article" hidden>
        <span class="side-title">In this article</span>
        <ol></ol>
      </nav>
      <div class="side-card side-mini-cta">
        <strong>Ready to see it on your fleet?</strong>
        <a class="button button-primary" href="<?php echo esc_url( home_url( '/get-in-touch/' ) ); ?>">Get a Demo <span>&rarr;</span></a>
      </div>
    </div>
  </aside>

</div></section>

<?php if ( $related->have_posts() ) : ?>
<section class="section section--soft post-related"><div class="wrap">
  <div class="section-head"><div>
    <span class="eyebrow">Keep Reading</span>
    <h2>More fleet insights</h2>
  </div></div>
  <div class="related-grid">
    <?php $related->rewind_posts(); while ( $related->have_posts() ) : $related->the_post(); $rc = get_the_category(); ?>
    <article class="related-card">
      <a class="related-media" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
        <img src="<?php echo esc_url( has_post_thumbnail() ? get_the_post_thumbnail_url( null, 'medium_large' ) : sprintf( $envue_fallback_img, 800 ) ); ?>" alt="" loading="lazy">
      </a>
      <div class="related-body">
        <?php if ( $rc ) : ?><span class="related-cat"><?php echo esc_html( $rc[0]->name ); ?></span><?php endif; ?>
        <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
        <small><?php echo esc_html( get_the_date() ); ?></small>
      </div>
    </article>
    <?php endwhile; wp_reset_postdata(); ?>
  </div>
</div></section>
<?php endif; ?>

</main>
<?php endwhile; ?>

<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">Next Step</span><h2>Ready to talk about your fleet?</h2></div>
  <div><p>Talk to an EnVue fleet expert about GPS tracking, AI dash cams, compliance, and the Geotab platform — and get a free assessment of your fleet&rsquo;s biggest opportunities.</p>
  <div class="hero-actions">
    <a class="button button-primary button-lg" href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Talk to a Fleet Expert <span>&rarr;</span></a>
    <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
  </div></div>
</div></section>
<?php get_footer(); ?>
