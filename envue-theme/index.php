<?php
/**
 * Fallback template — post archives and anything without a more specific match.
 */
get_header();

envue_page_hero(
    is_home() ? __( 'Fleet intelligence, written down', 'envue' ) : get_the_archive_title(),
    __( 'Guides, deployment notes and reporting templates from the EnVue team.', 'envue' ),
    __( 'Resources', 'envue' ),
    '',
    [ __( 'Resources', 'envue' ) => '' ]
);
?>

<main id="main">
  <section class="section">
    <div class="wrap">
      <?php if ( have_posts() ) : ?>
        <div class="post-grid">
          <?php while ( have_posts() ) : the_post(); ?>
            <article class="post-card">
              <span><?php echo esc_html( get_the_date() ); ?></span>
              <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
              <p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 24 ) ); ?></p>
              <a class="read" href="<?php the_permalink(); ?>"><?php esc_html_e( 'Read article', 'envue' ); ?> &rarr;</a>
            </article>
          <?php endwhile; ?>
        </div>

        <div style="margin-top:48px">
          <?php the_posts_pagination( [ 'mid_size' => 2 ] ); ?>
        </div>
      <?php else : ?>
        <p class="lede"><?php esc_html_e( 'Nothing published here yet.', 'envue' ); ?></p>
      <?php endif; ?>
    </div>
  </section>
</main>

<?php
envue_final_cta();
get_footer();
