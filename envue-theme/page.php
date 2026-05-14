<?php get_header(); ?>
<main class="site-main">
  <?php if (have_posts()): while (have_posts()): the_post(); ?>
    <?php if (function_exists('elementor_theme_do_location') && elementor_theme_do_location('single')): ?>
      <!-- Elementor renders content -->
    <?php else: ?>
      <div class="page-hero">
        <?php envue_page_hero(get_the_title(), get_field('subtitle'), 'Page', ''); ?>
      </div>
      <div class="container section">
        <?php the_content(); ?>
      </div>
    <?php endif; ?>
  <?php endwhile; endif; ?>
</main>
<?php get_footer(); ?>
