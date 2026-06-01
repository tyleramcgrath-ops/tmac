<?php
/**
 * Default page template — used for any page that doesn't pick a custom template.
 */
get_header();

while ( have_posts() ) :
    the_post();
    ?>
    <section class="hero" style="min-height:auto;padding:120px 0 40px;">
        <div class="wrap">
            <div class="hero-copy" style="padding:0;max-width:780px;">
                <p class="h1-line"><span class="live-dot"></span> Centris</p>
                <h1><?php the_title(); ?></h1>
            </div>
        </div>
    </section>

    <section class="section border-t">
        <div class="wrap" style="max-width:780px;">
            <div class="lead"><?php the_content(); ?></div>
        </div>
    </section>
    <?php
endwhile;

get_footer();
