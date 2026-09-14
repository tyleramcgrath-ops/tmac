<?php
/**
 * Single post.
 */
get_header();

while ( have_posts() ) :
    the_post();

    envue_page_hero(
        get_the_title(),
        has_excerpt() ? get_the_excerpt() : '',
        get_the_date(),
        has_post_thumbnail() ? get_the_post_thumbnail_url( null, 'full' ) : '',
        [ __( 'Resources', 'envue' ) => home_url( '/resources/' ), get_the_title() => '' ]
    );
    ?>
    <main id="main">
      <section class="section">
        <div class="wrap">
          <div class="entry-content" style="max-width:72ch">
            <?php the_content(); ?>
          </div>
        </div>
      </section>
    </main>
    <?php
    envue_final_cta();

endwhile;

get_footer();
