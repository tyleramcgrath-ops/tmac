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

<section class="final-cta final-cta--form" id="demo"><div class="wrap final-grid">
  <div>
      <span class="eyebrow eyebrow--light">Next step</span>
      <h2>Ready to talk about your fleet?</h2>
    <p>Talk to an EnVue specialist about tracking, cameras, assets and deployment for your operation.</p>
    <p class="demo-call">Prefer to talk? Call <a href="tel:8002011169">(800) 201-1169</a> &mdash; US-based fleet experts, 24/7.</p>
  </div>
  <div><?php echo envue_demo_form(); ?></div>
</div></section>

<?php get_footer(); ?>
