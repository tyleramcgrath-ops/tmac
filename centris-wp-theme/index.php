<?php
/**
 * Default fallback — blog/archive view.
 */
get_header();
?>

<section class="hero" style="min-height:auto;padding:120px 0 40px;">
    <div class="wrap">
        <div class="hero-copy" style="padding:0;max-width:780px;">
            <p class="h1-line"><span class="live-dot"></span> <?php echo esc_html( is_archive() ? get_the_archive_title() : 'Latest' ); ?></p>
            <h1><?php echo esc_html( is_archive() ? get_the_archive_title() : 'Posts' ); ?></h1>
        </div>
    </div>
</section>

<section class="section border-t">
    <div class="wrap">
        <?php if ( have_posts() ) : ?>
            <div class="ai-grid">
                <?php while ( have_posts() ) : the_post(); ?>
                    <article class="ai-card">
                        <h4><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h4>
                        <p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 28 ) ); ?></p>
                        <div class="footer"><?php echo esc_html( get_the_date() ); ?></div>
                    </article>
                <?php endwhile; ?>
            </div>
            <div style="margin-top:48px;"><?php the_posts_pagination(); ?></div>
        <?php else : ?>
            <p class="lead">Nothing here yet.</p>
        <?php endif; ?>
    </div>
</section>

<?php get_footer();
