<?php
/**
 * Elevate Dinner 2026 RSVP page (/elevate-dinner2026/).
 * Embeds the event's Google Form; responses go straight to that form.
 */
get_header();
$ed_form = 'https://docs.google.com/forms/d/e/1FAIpQLSfqALiDBavZ9_CsO9Tw5zPAPJkQBhuG22yk4syxQxOOGwzuAw/viewform';
?>
<main id="main">

<section class="page-hero page-hero--post">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Home</a> / <a href="<?php echo esc_url( home_url( '/elevate-dinner2026/' ) ); ?>">Elevate Dinner 2026</a></nav>
    <span class="eyebrow eyebrow--light">EnVue Telematics</span>
    <h1>Elevate Dinner 2026</h1>
    <p>Please complete the form below to register.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="#rsvp">Register <span>&rarr;</span></a>
    </div>
  </div>
</section>

<style>
.ed-form-card{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:24px;max-width:720px;margin:0 auto;}
.ed-form-card iframe{display:block;width:100%;height:2738px;border:0;}
.ed-form-alt{text-align:center;font-size:.875rem;color:var(--slate);margin-top:1rem;}
@media(max-width:760px){.ed-form-card{padding:8px;}}
</style>

<section class="section section--soft" id="rsvp"><div class="wrap">
  <div class="ed-form-card">
    <?php // skip-lazy / data-skip-lazy keep EWWW's lazy loader from swapping src to data-src, which left the form blank. ?>
    <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSfqALiDBavZ9_CsO9Tw5zPAPJkQBhuG22yk4syxQxOOGwzuAw/viewform?embedded=true" width="640" height="2738" frameborder="0" marginheight="0" marginwidth="0" class="skip-lazy" data-skip-lazy="1" data-no-lazy="1" title="Elevate Dinner 2026 registration form">Loading…</iframe>
  </div>
  <p class="ed-form-alt">Having trouble with the form? <a href="<?php echo esc_url( $ed_form ); ?>" target="_blank" rel="noopener">Open it in a new tab</a>.</p>
</div></section>

</main>
<?php get_footer(); ?>
