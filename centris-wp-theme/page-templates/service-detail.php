<?php
/**
 * Template Name: Service — Detail
 *
 * Renders one service page based on the page slug.
 */

require_once locate_template( 'inc/data.php' );

$slug     = get_post_field( 'post_name', get_the_ID() );
$services = centris_services();
$svc      = isset( $services[ $slug ] ) ? $services[ $slug ] : null;

get_header();

if ( ! $svc ) {
    echo '<section class="section"><div class="wrap"><h1>Service not found</h1></div></section>';
    get_footer();
    return;
}
?>

<section class="hero" style="min-height:auto;padding:120px 0 40px;">
    <div class="wrap">
        <div class="hero-copy" style="padding:0;max-width:780px;">
            <p class="h1-line"><span class="live-dot"></span> Service · <?php echo esc_html( $svc['num'] ); ?> · <?php echo esc_html( $svc['tag'] ); ?></p>
            <h1><?php echo esc_html( $svc['title'] ); ?></h1>
            <p class="lead"><?php echo esc_html( $svc['lede'] ); ?></p>
            <div class="ctas">
                <a class="btn lg" href="<?php echo esc_url( home_url( '/contact' ) ); ?>">Book a demo</a>
                <a class="cta-quiet" href="<?php echo esc_url( home_url( '/services' ) ); ?>">All services →</a>
            </div>
        </div>
    </div>
</section>

<section class="section border-t">
    <div class="wrap">
        <div class="sec-head">
            <div>
                <h6>What's included</h6>
                <h2>How <?php echo esc_html( $svc['title'] ); ?> <span class="clr-primary">actually runs.</span></h2>
            </div>
            <p>The day-one footprint, the playbooks behind it, and the reporting you'll see every Monday morning.</p>
        </div>

        <ul class="sophia-features" style="max-width:760px;">
            <?php foreach ( $svc['bullets'] as $b ) : ?>
                <li>
                    <span class="check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>
                    <div><span><?php echo esc_html( $b ); ?></span></div>
                </li>
            <?php endforeach; ?>
        </ul>
    </div>
</section>

<section class="section border-t">
    <div class="wrap">
        <div class="closing">
            <h6>Ready to scope this?</h6>
            <h2>Walk through <span class="clr-primary"><?php echo esc_html( $svc['title'] ); ?></span> with our team.</h2>
            <p>15-minute call. Fit, cost, staffing model, AI support, QA, and what your first 90 days look like.</p>
            <div class="ctas">
                <a class="btn lg" href="<?php echo esc_url( home_url( '/contact' ) ); ?>">Book a demo</a>
                <a class="btn lg btn-ghost" href="tel:18005304897">Call 1-800-530-4897</a>
            </div>
        </div>
    </div>
</section>

<?php get_footer();
