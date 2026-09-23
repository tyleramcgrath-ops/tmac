<?php
/**
 * Single blog post / news article.
 * Post bodies are rendered from the editor (the_content) inside the theme's
 * page chrome. News-category posts breadcrumb to /news/, everything else to
 * /blog-articles/.
 */
get_header();

while ( have_posts() ) : the_post();
    $is_news   = has_category( 'news' );
    $list_path = $is_news ? '/news/' : '/blog-articles/';
    $list_name = $is_news ? 'News' : 'Blog Articles';
    $cats      = get_the_category();
    $badge     = $cats ? $cats[0]->name : $list_name;
    $hero      = has_post_thumbnail() ? get_the_post_thumbnail_url( null, 'full' ) : 'https://images.unsplash.com/photo-1509165131529-1a871efb4a6e?auto=format&fit=crop&w=1920&q=72';
?>
<main id="main">

<section class="page-hero page-hero--post">
  <img class="page-hero-bg" src="<?php echo esc_url( $hero ); ?>" alt="<?php echo esc_attr( get_the_title() ); ?>" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url(home_url("/")); ?>">Home</a> / <a href="<?php echo esc_url( home_url( $list_path ) ); ?>"><?php echo esc_html( $list_name ); ?></a></nav>
    <span class="eyebrow eyebrow--light"><?php echo esc_html( $badge ); ?></span>
    <h1><?php the_title(); ?></h1>
    <p class="post-meta"><time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time> &middot; EnVue Telematics</p>
  </div>
</section>

<section class="section"><div class="wrap">
  <article <?php post_class( 'entry-content' ); ?>>
    <?php the_content(); ?>
    <?php wp_link_pages(); ?>
  </article>

  <nav class="post-nav" aria-label="More posts">
    <div><?php previous_post_link( '%link', '&larr; %title', true ); ?></div>
    <div><?php next_post_link( '%link', '%title &rarr;', true ); ?></div>
  </nav>
  <p class="post-back"><a class="button button-outline" href="<?php echo esc_url( home_url( $list_path ) ); ?>">&larr; All <?php echo esc_html( $list_name ); ?></a></p>
</div></section>

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
