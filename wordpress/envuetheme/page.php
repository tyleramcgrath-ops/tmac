<?php get_header(); ?>

<main id="main">
  <section class="page-hero">
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="<?php echo esc_url(home_url('/')); ?>">Home</a> /
        <?php the_title(); ?>
      </nav>
      <h1><?php the_title(); ?></h1>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <?php if (have_posts()): while (have_posts()): the_post(); ?>
        <div class="lede" style="max-width:72ch">
          <?php the_content(); ?>
        </div>
      <?php endwhile; endif; ?>
    </div>
  </section>
</main>

<section class="final-cta" id="demo">
  <div class="wrap final-grid">
    <div>
      <span class="eyebrow eyebrow--light">Next step</span>
      <h2>Ready to talk about your fleet?</h2>
    </div>
    <div>
      <p>Talk to an EnVue specialist about tracking, cameras, assets and deployment for your operation.</p>
      <div class="hero-actions">
        <a class="button button-primary button-lg" href="<?php echo esc_url(home_url('/get-in-touch/')); ?>">Talk to a specialist <span>→</span></a>
        <a class="button button-ghost button-lg" href="tel:8002011169">Call (800) 201-1169</a>
      </div>
    </div>
  </div>
</section>

<?php get_footer(); ?>
