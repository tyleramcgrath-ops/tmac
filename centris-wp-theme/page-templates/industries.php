<?php
/**
 * Template Name: Industries — Listing
 */

require_once locate_template( 'inc/data.php' );
$industries = centris_industries();

get_header();
?>

<section class="hero" style="min-height:auto;padding:120px 0 40px;">
    <div class="wrap">
        <div class="hero-copy" style="padding:0;max-width:760px;">
            <p class="h1-line"><span class="live-dot"></span> Industries</p>
            <h1>Designed for complex<br/><span class="accent-serif">customer moments.</span></h1>
            <p class="lead">From claims and billing to live chat and scheduling, Centris supports the conversations where response quality matters most.</p>
        </div>
    </div>
</section>

<section class="section border-t">
    <div class="wrap">
        <div class="industries">
            <?php foreach ( $industries as $slug => $ind ) : ?>
                <a class="ind-card" href="<?php echo esc_url( home_url( '/' . $slug ) ); ?>">
                    <div class="pic">
                        <img src="<?php echo esc_url( centris_image_url( $ind['image'] ) ); ?>" alt="<?php echo esc_attr( $ind['title'] ); ?>" loading="lazy" />
                        <span class="tag"><?php echo esc_html( $ind['tag'] ); ?></span>
                    </div>
                    <h5><?php echo esc_html( $ind['title'] ); ?></h5>
                    <p><?php echo esc_html( $ind['lede'] ); ?></p>
                    <span>View industry →</span>
                </a>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<?php get_footer();
