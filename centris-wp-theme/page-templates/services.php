<?php
/**
 * Template Name: Services — Listing
 */

require_once locate_template( 'inc/data.php' );
$services = centris_services();

get_header();
?>

<section class="hero" style="min-height:auto;padding:120px 0 40px;">
    <div class="wrap">
        <div class="hero-copy" style="padding:0;max-width:760px;">
            <p class="h1-line"><span class="live-dot"></span> Services</p>
            <h1>Bilingual support teams,<br/><span class="accent-serif">across every channel.</span></h1>
            <p class="lead">Human expertise and AI-driven efficiency in one package — built to improve service quality, reduce costs, and scale without compromise.</p>
        </div>
    </div>
</section>

<section class="section border-t">
    <div class="wrap">
        <div class="services">
            <?php foreach ( $services as $slug => $svc ) : ?>
                <a class="service-card" href="<?php echo esc_url( home_url( '/' . $slug ) ); ?>">
                    <span class="badge"><?php echo esc_html( $svc['tag'] ); ?></span>
                    <h5><?php echo esc_html( $svc['title'] ); ?></h5>
                    <p><?php echo esc_html( $svc['lede'] ); ?></p>
                    <span>Explore service →</span>
                </a>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<?php get_footer();
