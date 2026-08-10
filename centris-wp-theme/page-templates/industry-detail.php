<?php
/**
 * Template Name: Industry — Detail
 *
 * Renders one industry page based on the page slug.
 */

require_once locate_template( 'inc/data.php' );

$slug       = get_post_field( 'post_name', get_the_ID() );
$industries = centris_industries();
$ind        = isset( $industries[ $slug ] ) ? $industries[ $slug ] : null;

get_header();

if ( ! $ind ) {
    echo '<section class="section"><div class="wrap"><h1>Industry not found</h1></div></section>';
    get_footer();
    return;
}
?>

<section class="hero" style="min-height:520px;">
    <div class="hero-bg">
        <img src="<?php echo esc_url( centris_image_url( $ind['image'] ) ); ?>" alt="<?php echo esc_attr( $ind['title'] ); ?>" />
    </div>
    <div class="wrap">
        <div class="hero-copy" style="max-width:720px;">
            <p class="h1-line"><span class="live-dot"></span> Industry · <?php echo esc_html( $ind['num'] ); ?> · <?php echo esc_html( $ind['tag'] ); ?></p>
            <h1><?php echo esc_html( $ind['title'] ); ?></h1>
            <p class="lead"><?php echo esc_html( $ind['lede'] ); ?></p>
            <div class="ctas">
                <a class="btn lg" href="<?php echo esc_url( home_url( '/contact' ) ); ?>">Book a demo</a>
                <a class="cta-quiet" href="<?php echo esc_url( home_url( '/industries' ) ); ?>">All industries →</a>
            </div>
        </div>
    </div>
</section>

<section class="section border-t">
    <div class="wrap">
        <div class="sec-head">
            <div>
                <h6>How we support it</h6>
                <h2>What <?php echo esc_html( $ind['title'] ); ?> teams <span class="clr-primary">actually get.</span></h2>
            </div>
            <p>Trained agents, the right Sophia tooling, and three decades of vertical playbooks compounded.</p>
        </div>

        <ul class="sophia-features" style="max-width:760px;">
            <?php foreach ( $ind['bullets'] as $b ) : ?>
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
            <h6>See it for your <?php echo esc_html( strtolower( $ind['title'] ) ); ?> program</h6>
            <h2>Walk through your call types,<br/><span class="clr-primary">together.</span></h2>
            <p>A 15-minute call. Bring a tough call type. We'll show you how Sophia handles it and what reporting looks like by Friday.</p>
            <div class="ctas">
                <a class="btn lg" href="<?php echo esc_url( home_url( '/contact' ) ); ?>">Book a demo</a>
                <a class="btn lg btn-ghost" href="tel:18005304897">Call 1-800-530-4897</a>
            </div>
        </div>
    </div>
</section>

<?php get_footer();
