<?php
/**
 * Default page template.
 */
get_header();

while ( have_posts() ) :
    the_post();

    if ( function_exists( 'elementor_theme_do_location' ) && elementor_theme_do_location( 'single' ) ) {
        // Elementor renders the whole page.
    } else {
        envue_page_hero(
            get_the_title(),
            has_excerpt() ? get_the_excerpt() : '',
            '',
            has_post_thumbnail() ? get_the_post_thumbnail_url( null, 'full' ) : '',
            [ get_the_title() => '' ]
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
    }

endwhile;

get_footer();
