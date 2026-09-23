<?php
/**
 * EnVue Telematics WordPress Theme
 * Ported from https://tyleramcgrath-ops.github.io/tmac/
 */

/* ── Styles & Scripts ────────────────────────────────────────── */
add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'envue-fonts',
        'https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap',
        [],
        null
    );
    wp_enqueue_style(
        'envue-style',
        get_template_directory_uri() . '/assets/css/envue.css',
        [ 'envue-fonts' ],
        '10'
    );
    wp_enqueue_script(
        'envue-script',
        get_template_directory_uri() . '/assets/js/envue.js',
        [],
        '10',
        true
    );
} );

/* ── Theme Support ───────────────────────────────────────────── */
add_action( 'after_setup_theme', function () {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', [ 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption' ] );
    register_nav_menus( [ 'primary' => 'Primary Navigation' ] );
} );

/* ── Elementor Pro Compatibility ─────────────────────────────── */
// Register Elementor theme locations so Elementor Pro's Theme Builder
// knows our theme owns header & footer — preventing it from auto-injecting
// its old Elementor header template via wp_body_open.
// We register the locations but never call do_location(), so the old
// Elementor header/footer simply never renders.
add_action( 'elementor/theme/register_locations', function ( $elementor_theme_manager ) {
    $elementor_theme_manager->register_all_core_location();
} );

/* ── Auto Template Routing ───────────────────────────────────── */
/*
 * Maps page slugs → template files automatically.
 * This means Tyler does NOT need to manually assign templates in
 * the WordPress admin — just create the page with the right slug.
 *
 * Also handles alternate slugs (e.g. the existing site uses
 * /about-envue/ instead of /company/).
 */
function envue_template_map() {
    return [
        // Solutions
        'solutions'               => 'page-solutions.php',
        'dash-cams'               => 'page-dash-cams.php',
        'dash-cam'                => 'page-dash-cams.php',
        'ai-dash-cams'            => 'page-dash-cams.php',
        'gps-tracking'            => 'page-gps-tracking.php',
        'gps'                     => 'page-gps-tracking.php',
        'equipment-management'    => 'page-equipment-management.php',
        'equipment'               => 'page-equipment-management.php',
        'asset-tracking'          => 'page-equipment-management.php',
        'maintenance'             => 'page-maintenance.php',
        'predictive-maintenance'  => 'page-maintenance.php',
        'fleet-maintenance'       => 'page-maintenance.php',
        'fuel-management'         => 'page-fuel-management.php',
        'fuel'                    => 'page-fuel-management.php',
        'fleet-fuel'              => 'page-fuel-management.php',
        'geotab'                  => 'page-geotab.php',
        'powered-by-geotab'       => 'page-geotab.php',
        'safety'                  => 'page-safety.php',
        'fleet-safety'            => 'page-safety.php',
        'driver-safety'           => 'page-safety.php',
        'compliance'              => 'page-compliance.php',
        'eld-compliance'          => 'page-compliance.php',
        'fleet-compliance'        => 'page-compliance.php',
        'productivity'            => 'page-productivity.php',
        'fleet-productivity'      => 'page-productivity.php',
        'dispatch'                => 'page-productivity.php',
        'optimization'            => 'page-optimization.php',
        'fleet-optimization'      => 'page-optimization.php',
        'cost-reduction'          => 'page-optimization.php',
        'sustainability'          => 'page-sustainability.php',
        'fleet-sustainability'    => 'page-sustainability.php',
        'electric-vehicles'       => 'page-electric-vehicles.php',
        'ev-fleet'                => 'page-electric-vehicles.php',
        'electric-fleet'          => 'page-electric-vehicles.php',
        'ev'                      => 'page-electric-vehicles.php',
        'expandability'           => 'page-expandability.php',
        'integrations'            => 'page-expandability.php',
        'marketplace'             => 'page-expandability.php',
        'geotab-marketplace'      => 'page-expandability.php',
        // Industries
        'industries'              => 'page-industries.php',
        'construction'            => 'page-construction.php',
        'trucking-transportation' => 'page-trucking-transportation.php',
        'trucking'                => 'page-trucking-transportation.php',
        'transportation'          => 'page-trucking-transportation.php',
        'field-services'          => 'page-field-services.php',
        'field-service'           => 'page-field-services.php',
        'oil-gas'                 => 'page-oil-gas.php',
        'oil-and-gas'             => 'page-oil-gas.php',
        'oil'                     => 'page-oil-gas.php',
        'government'              => 'page-government.php',
        'municipal'               => 'page-government.php',
        'government-fleet'        => 'page-government.php',
        'leasing-rental'          => 'page-leasing-rental.php',
        'leasing'                 => 'page-leasing-rental.php',
        'rental'                  => 'page-leasing-rental.php',
        // Partners / Technology
        'our-partners'            => 'page-partners.php',
        'partners'                => 'page-partners.php',
        'technology-partners'     => 'page-partners.php',
        // Partner / Comparison pages
        'lytx'                    => 'page-lytx.php',
        'netradyne'               => 'page-netradyne.php',
        'surfsight'               => 'page-surfsight.php',
        'samsara'                 => 'page-samsara.php',
        'azuga'                   => 'page-azuga.php',
        'mobileye'                => 'page-mobileye.php',
        'fleetio'                 => 'page-fleetio.php',
        'fleetcor'                => 'page-fleetcor.php',
        'promiles'                => 'page-promiles.php',
        'drivewyze'               => 'page-drivewyze.php',
        'route4me'                => 'page-route4me.php',
        'elite-extra'             => 'page-elite-extra.php',
        'coast-pay'               => 'page-coast-pay.php',
        'coastpay'                => 'page-coast-pay.php',
        'car-advise'              => 'page-car-advise.php',
        'caradvise'               => 'page-car-advise.php',
        'origo'                   => 'page-origo.php',
        'xtract'                  => 'page-xtract.php',
        'ok-alone'                => 'page-ok-alone.php',
        'okalone'                 => 'page-ok-alone.php',
        'greater-than'            => 'page-greater-than.php',
        'moveev'                  => 'page-moveev.php',
        'whip-around'             => 'page-whip-around.php',
        'whi-paround'             => 'page-whip-around.php',
        'speedgauge'              => 'page-speedgauge.php',
        'lifesaver-mobile'        => 'page-lifesaver-mobile.php',
        'lifesaver'               => 'page-lifesaver-mobile.php',
        'phillips-connect'        => 'page-phillips-connect.php',
        'phillips'                => 'page-phillips-connect.php',
        'smith-system'            => 'page-smith-system.php',
        'predictive-coach'        => 'page-predictive-coach.php',
        'craig-safety-technologies' => 'page-craig-safety-technologies.php',
        'craig-safety'            => 'page-craig-safety-technologies.php',
        'sensata-technologies'    => 'page-sensata-technologies.php',
        'sensata'                 => 'page-sensata-technologies.php',
        'safety-first'            => 'page-safety-first.php',
        // Top-level
        'results'                 => 'page-results.php',
        'customer-results'        => 'page-results.php',
        'case-studies'            => 'page-results.php',
        'resources'               => 'page-resources.php',
        'news'                    => 'page-news.php',
        'newsroom'                => 'page-news.php',
        'press'                   => 'page-news.php',
        'press-room'              => 'page-news.php',
        'blog-articles'           => 'page-blog-articles.php',
        'articles'                => 'page-blog-articles.php',
        'events'                  => 'page-events.php',
        'events-calendar'         => 'page-events.php',
        'webinars'                => 'page-events.php',
        'trade-shows'             => 'page-events.php',
        'blog'                    => 'page-resources.php',
        'insights'                => 'page-resources.php',
        'faqs'                    => 'page-faqs.php',
        'faq'                     => 'page-faqs.php',
        'frequently-asked-questions' => 'page-faqs.php',
        'get-in-touch'            => 'page-get-in-touch.php',
        'contact'                 => 'page-get-in-touch.php',
        'contact-us'              => 'page-get-in-touch.php',
        'customer-journey'        => 'page-customer-journey.php',
        'how-it-works'            => 'page-customer-journey.php',
        'our-process'             => 'page-customer-journey.php',
        'company'                 => 'page-company.php',
        'our-team'                => 'page-company.php',
        'team'                    => 'page-company.php',
        'about-envue'             => 'page-about-envue.php',
        'about'                   => 'page-about-envue.php',
        'about-us'                => 'page-about-envue.php',
    ];
}

/**
 * Template file for a slug: the explicit map first, then page-{slug}.php.
 * Returns '' when the theme has no template for it.
 */
function envue_template_for_slug( $slug ) {
    if ( ! $slug ) return '';
    $map  = envue_template_map();
    $file = $map[ $slug ] ?? 'page-' . $slug . '.php';
    $tpl  = get_template_directory() . '/' . $file;
    return file_exists( $tpl ) ? $tpl : '';
}

/**
 * Request path relative to the site root, e.g. "solutions" for /solutions/.
 */
function envue_request_path() {
    $path = trim( (string) wp_parse_url( $_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH ), '/' );
    $base = trim( (string) wp_parse_url( home_url(), PHP_URL_PATH ), '/' );
    if ( $base && strpos( $path, $base ) === 0 ) {
        $path = trim( substr( $path, strlen( $base ) ), '/' );
    }
    return $path;
}

/* ── Fallback routes for theme pages that have no WP page yet ─────
 * The nav links to a few URLs that don't exist as pages on the live site
 * (e.g. /solutions/). Rather than 404, serve the theme template with a 200.
 * Creating a real WP page with the same slug takes over automatically
 * (and lets AIOSEO manage its meta + sitemap entry).
 */
add_filter( 'pre_handle_404', function ( $preempt, $wp_query ) {
    if ( $preempt || is_admin() || ! empty( $wp_query->posts ) ) return $preempt;
    $slug = envue_request_path();
    if ( ! $slug || strpos( $slug, '/' ) !== false ) return $preempt;
    if ( ! envue_template_for_slug( $slug ) ) return $preempt;
    $GLOBALS['envue_virtual_slug'] = $slug;
    // Clear the "single post" flags WP set while looking for a post with this
    // name, so core (body_class, titles) doesn't expect a post object.
    foreach ( [ 'is_404', 'is_single', 'is_singular', 'is_page', 'is_home', 'is_archive' ] as $flag ) {
        $wp_query->$flag = false;
    }
    status_header( 200 );
    return true;
}, 10, 2 );

/* The slug the current request is rendering, for pages and fallback routes. */
function envue_current_slug() {
    if ( ! empty( $GLOBALS['envue_virtual_slug'] ) ) return $GLOBALS['envue_virtual_slug'];
    if ( is_front_page() ) return '';
    if ( is_page() ) return get_post_field( 'post_name', get_queried_object_id() );
    if ( is_home() && get_option( 'page_for_posts' ) ) return get_post_field( 'post_name', (int) get_option( 'page_for_posts' ) );
    return '';
}

add_filter( 'template_include', function ( $template ) {
    // Fallback route (see pre_handle_404 above)
    if ( ! empty( $GLOBALS['envue_virtual_slug'] ) ) {
        $tpl = envue_template_for_slug( $GLOBALS['envue_virtual_slug'] );
        if ( $tpl ) $template = $tpl;
    }
    // Page slugs and the "Posts page" (Settings → Reading), if it's /news/ or /blog-articles/
    elseif ( is_page() || ( is_home() && ! is_front_page() ) ) {
        $map  = envue_template_map();
        $slug = envue_current_slug();
        if ( isset( $map[ $slug ] ) ) {
            $tpl = envue_template_for_slug( $slug );
            if ( $tpl ) $template = $tpl;
        }
    }
    $GLOBALS['envue_template'] = basename( $template );
    return $template;
} );

/* ── Strip Elementor front-end CSS ───────────────────────────── */
// Our custom templates control every pixel of layout and typography.
// Elementor's front-end stylesheet (elementor-kit-6, elementor-frontend,
// elementor-pro) loads AFTER our CSS and overrides font-family, headings,
// and button colors — making the site look wrong.
// Since none of our templates render Elementor content, its CSS is pure
// noise. Dequeue it all at priority 999 (after plugins enqueue).
// Exception: content still rendered through the_content() (blog posts,
// and any page without a theme template) keeps Elementor's CSS when that
// post was built with Elementor, so it doesn't render unstyled.
function envue_needs_elementor_css() {
    $generic = [ 'single.php', 'page.php', 'index.php', 'singular.php' ];
    if ( ! in_array( $GLOBALS['envue_template'] ?? '', $generic, true ) ) return false;
    if ( ! is_singular() ) return false;
    return 'builder' === get_post_meta( get_queried_object_id(), '_elementor_edit_mode', true );
}
add_action( 'wp_enqueue_scripts', function () {
    if ( envue_needs_elementor_css() ) return;
    $kill = [
        'elementor-frontend',
        'elementor-pro',
        'elementor-icons',
        'elementor-icons-shared-0',
        'elementor-icons-fa-brands',
        'elementor-icons-fa-solid',
        'elementor-icons-fa-regular',
        'e-animations',
        'e-kit-frontend',
    ];
    foreach ( $kill as $handle ) {
        wp_dequeue_style( $handle );
        wp_deregister_style( $handle );
    }
    // Per-page Elementor stylesheet (e.g. elementor-post-7 on the homepage)
    if ( is_singular() ) {
        $pid = 'elementor-post-' . get_queried_object_id();
        wp_dequeue_style( $pid );
        wp_deregister_style( $pid );
    }
}, 999 );

/* ── Clean wp_head ───────────────────────────────────────────── */
remove_action( 'wp_head', 'wp_generator' );
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wlwmanifest_link' );

// ── EnVue image helper ─────────────────────────────────────────────────────
// Images served from Unsplash CDN — free, no hotlink protection, any domain.
// No media library upload or plugin needed.
function envue_img( $filename ) {
    static $map = null;
    if ( $map === null ) {
        $map = [
        "award-geotab.jpg" => "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1260&h=750&fit=crop&q=80&auto=format",
        "construction-2026.jpg" => "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1260&h=750&fit=crop&q=80&auto=format",
        "construction.jpg" => "https://images.unsplash.com/photo-1578894513086-5a61a815a341?w=1260&h=750&fit=crop&q=80&auto=format",
        "dc-coaching.webp" => "https://images.unsplash.com/photo-1578496479939-722d9dd1cc5b?w=1260&h=750&fit=crop&q=80&auto=format",
        "dc-insurance.webp" => "https://images.unsplash.com/photo-1580795479225-c50ab8c3348d?w=1260&h=750&fit=crop&q=80&auto=format",
        "dc-section1.webp" => "https://images.unsplash.com/photo-1694813646391-4c505039c2ee?w=1260&h=750&fit=crop&q=80&auto=format",
        "dc-visibility.webp" => "https://images.unsplash.com/photo-1501799668029-f7be2fcfc261?w=1260&h=750&fit=crop&q=80&auto=format",
        "field-connectivity.jpg" => "https://images.unsplash.com/photo-1775865937358-c7d2972e78ec?w=1260&h=750&fit=crop&q=80&auto=format",
        "field-section2.webp" => "https://images.unsplash.com/photo-1692681157014-2f7ee75c0ea0?w=1260&h=750&fit=crop&q=80&auto=format",
        "field.jpg" => "https://images.unsplash.com/photo-1775865937358-c7d2972e78ec?w=1260&h=750&fit=crop&q=80&auto=format",
        "fuel-card.webp" => "https://images.unsplash.com/photo-1610985725707-bb0766bf123b?w=1260&h=750&fit=crop&q=80&auto=format",
        "fuel-collect.webp" => "https://images.unsplash.com/photo-1625217527288-93919c99650a?w=1260&h=750&fit=crop&q=80&auto=format",
        "fuel-waste.webp" => "https://images.unsplash.com/photo-1562993610-121a6b465200?w=1260&h=750&fit=crop&q=80&auto=format",
        "geotab-badge.png" => "https://images.unsplash.com/photo-1593465678160-f99a8371fcf6?w=1260&h=750&fit=crop&q=80&auto=format",
        "go9-device.webp" => "https://images.unsplash.com/photo-1634743556192-d19f0c69ff3a?w=1260&h=750&fit=crop&q=80&auto=format",
        "gov-ev.webp" => "https://images.unsplash.com/photo-1603638725135-928baf863eff?w=1260&h=750&fit=crop&q=80&auto=format",
        "gov-section1.webp" => "https://images.unsplash.com/photo-1638636206910-49cdd0af6d3c?w=1260&h=750&fit=crop&q=80&auto=format",
        "gov-visibility.webp" => "https://images.unsplash.com/photo-1759256243611-502772ac391b?w=1260&h=750&fit=crop&q=80&auto=format",
        "gps-1.webp" => "https://images.unsplash.com/photo-1621948535633-544972f1b944?w=1260&h=750&fit=crop&q=80&auto=format",
        "gps-6.webp" => "https://images.unsplash.com/photo-1604357209793-fca5dca89f97?w=1260&h=750&fit=crop&q=80&auto=format",
        "hqdefault.jpg" => "https://images.unsplash.com/photo-1627666260660-812e4684a600?w=1260&h=750&fit=crop&q=80&auto=format",
        "integrated-workflows.webp" => "https://images.unsplash.com/photo-1603638725135-928baf863eff?w=1260&h=750&fit=crop&q=80&auto=format",
        "leasing.jpg" => "https://images.unsplash.com/photo-1777907156394-1227b4c87149?w=1260&h=750&fit=crop&q=80&auto=format",
        "many-more.jpg" => "https://images.unsplash.com/photo-1772440222970-c1a9d5d38a19?w=1260&h=750&fit=crop&q=80&auto=format",
        "non-powered-assets.webp" => "https://images.unsplash.com/photo-1775865937358-c7d2972e78ec?w=1260&h=750&fit=crop&q=80&auto=format",
        "oil-gas-1.webp" => "https://images.unsplash.com/photo-1776988038414-29a4a1869275?w=1260&h=750&fit=crop&q=80&auto=format",
        "oil-gas-2.webp" => "https://images.unsplash.com/photo-1772440222970-c1a9d5d38a19?w=1260&h=750&fit=crop&q=80&auto=format",
        "oil-gas-3.webp" => "https://images.unsplash.com/photo-1579616043939-95d87a6e8512?w=1260&h=750&fit=crop&q=80&auto=format",
        "oil.jpg" => "https://images.unsplash.com/photo-1593465678160-f99a8371fcf6?w=1260&h=750&fit=crop&q=80&auto=format",
        "preventive-maint.webp" => "https://images.unsplash.com/photo-1627666260660-812e4684a600?w=1260&h=750&fit=crop&q=80&auto=format",
        "security-1.webp" => "https://images.unsplash.com/photo-1587813369290-091c9d432daf?w=1260&h=750&fit=crop&q=80&auto=format",
        "simplified-fleet.webp" => "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1260&h=750&fit=crop&q=80&auto=format",
        "smarter-fleet.jpg" => "https://images.unsplash.com/photo-1616432043562-3671ea2e5242?w=1260&h=750&fit=crop&q=80&auto=format",
        "students.jpg" => "https://images.unsplash.com/photo-1580795479225-c50ab8c3348d?w=1260&h=750&fit=crop&q=80&auto=format",
        "trailer-tracking.webp" => "https://images.unsplash.com/photo-1619302820124-e3b9d8a7f686?w=1260&h=750&fit=crop&q=80&auto=format",
        "trucking-comply.webp" => "https://images.unsplash.com/photo-1591419478162-a4dd21b7ec0a?w=1260&h=750&fit=crop&q=80&auto=format",
        "trucking-efficiency.webp" => "https://images.unsplash.com/photo-1776988038414-29a4a1869275?w=1260&h=750&fit=crop&q=80&auto=format",
        "trucking-risky.webp" => "https://images.unsplash.com/photo-1694813646391-4c505039c2ee?w=1260&h=750&fit=crop&q=80&auto=format",
        "trucking.jpg" => "https://images.unsplash.com/photo-1778163778182-7d07216dc157?w=1260&h=750&fit=crop&q=80&auto=format",
        "visibility-1.webp" => "https://images.unsplash.com/photo-1638636206910-49cdd0af6d3c?w=1260&h=750&fit=crop&q=80&auto=format",
        "v-interior" => "https://images.unsplash.com/photo-1501799668029-f7be2fcfc261?w=1260&h=750&fit=crop&q=80&auto=format",
        "driver" => "https://images.unsplash.com/photo-1694813646391-4c505039c2ee?w=1260&h=750&fit=crop&q=80&auto=format",
        "gps-dash" => "https://images.unsplash.com/photo-1621948535633-544972f1b944?w=1260&h=750&fit=crop&q=80&auto=format",
        "gps-phone" => "https://images.unsplash.com/photo-1604357209793-fca5dca89f97?w=1260&h=750&fit=crop&q=80&auto=format",
        "nav-car" => "https://images.unsplash.com/photo-1759256243611-502772ac391b?w=1260&h=750&fit=crop&q=80&auto=format",
        "freight" => "https://images.unsplash.com/photo-1616432043562-3671ea2e5242?w=1260&h=750&fit=crop&q=80&auto=format",
        "trucks-hwy" => "https://images.unsplash.com/photo-1591419478162-a4dd21b7ec0a?w=1260&h=750&fit=crop&q=80&auto=format",
        "vans-lot" => "https://images.unsplash.com/photo-1587813369290-091c9d432daf?w=1260&h=750&fit=crop&q=80&auto=format",
        "tablet" => "https://images.unsplash.com/photo-1627666260660-812e4684a600?w=1260&h=750&fit=crop&q=80&auto=format",
        "fleet-plan" => "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1260&h=750&fit=crop&q=80&auto=format",
        "fleet-tech" => "https://images.unsplash.com/photo-1578496479939-722d9dd1cc5b?w=1260&h=750&fit=crop&q=80&auto=format",
        "aerial" => "https://images.unsplash.com/photo-1638636206910-49cdd0af6d3c?w=1260&h=750&fit=crop&q=80&auto=format",
        "ipad-car" => "https://images.unsplash.com/photo-1603638725135-928baf863eff?w=1260&h=750&fit=crop&q=80&auto=format",
        "trucks-pkd" => "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1260&h=750&fit=crop&q=80&auto=format",
        "vans-aer" => "https://images.unsplash.com/photo-1775865937358-c7d2972e78ec?w=1260&h=750&fit=crop&q=80&auto=format",
        "truck-marks" => "https://images.unsplash.com/photo-1778163778182-7d07216dc157?w=1260&h=750&fit=crop&q=80&auto=format",
        "mobile" => "https://images.unsplash.com/photo-1692681157014-2f7ee75c0ea0?w=1260&h=750&fit=crop&q=80&auto=format",
        "trailer" => "https://images.unsplash.com/photo-1619302820124-e3b9d8a7f686?w=1260&h=750&fit=crop&q=80&auto=format",
        "fleet-line" => "https://images.unsplash.com/photo-1578894513086-5a61a815a341?w=1260&h=750&fit=crop&q=80&auto=format",
        "aerial-cars" => "https://images.unsplash.com/photo-1772440222970-c1a9d5d38a19?w=1260&h=750&fit=crop&q=80&auto=format",
        "truck-logo" => "https://images.unsplash.com/photo-1777907156394-1227b4c87149?w=1260&h=750&fit=crop&q=80&auto=format",
        "gps-ipad" => "https://images.unsplash.com/photo-1579616043939-95d87a6e8512?w=1260&h=750&fit=crop&q=80&auto=format",
        "tech-work" => "https://images.unsplash.com/photo-1580795479225-c50ab8c3348d?w=1260&h=750&fit=crop&q=80&auto=format",
        ];
    }
    return isset( $map[ $filename ] ) ? esc_url( $map[ $filename ] ) : '';
}


/* ══════════════════════════════════════════════════════════════════════
   PARTNER LOGO HELPER
   Logo URLs pulled directly from envuetelematics.com/wp-content/uploads/
   These load from the same domain on the live site — no hotlink issues.
   onerror fallback shows the partner name as styled text if logo fails.
══════════════════════════════════════════════════════════════════════ */
function envue_partner_logo( $slug, $name, $size = 'normal' ) {
    $BASE = 'https://envuetelematics.com/wp-content/uploads';
    $logos = [
        'lytx'                      => "$BASE/2024/12/lytx-1-1.png.webp",
        'netradyne'                 => "$BASE/2024/12/Netradyne-logo-300x51-1.webp",
        'mobileye'                  => "$BASE/2024/12/Mobileye-1.png.webp",
        'surfsight'                 => "$BASE/2024/12/Surfsight.png.webp",
        'samsara'                   => "$BASE/2024/12/Samsara.png.webp",
        'azuga'                     => "$BASE/2024/12/Azuga-2.png.webp",
        'elite-extra'               => "$BASE/2024/12/Elite-Extra-1.png.webp",
        'route4me'                  => "$BASE/2024/12/Route4Me-1.png.webp",
        'drivewyze'                 => "$BASE/2024/12/DriveWyze-1.png.webp",
        'fleetcor'                  => "$BASE/2024/12/Fleetcor.png.webp",
        'fleetio'                   => "$BASE/2024/12/Fleetio-1.png.webp",
        'whip-around'               => "$BASE/2024/12/Whip-Around.png.webp",
        'smith-system'              => "$BASE/2024/12/Smith-System.png.webp",
        'speedgauge'                => "$BASE/2024/12/SpeedGauge.png.webp",
        'safety-first'              => "$BASE/2024/12/Safety-First.png.webp",
        'lifesaver-mobile'          => "$BASE/2024/12/Lifesaver-Mobile.png.webp",
        'predictive-coach'          => "$BASE/2026/06/predictive-coach-logo.svg",
        'phillips-connect'          => "$BASE/2024/12/Phillips-Connect-1.png.webp",
        'sensata-technologies'      => "$BASE/2024/12/Sensata.png-1.webp",
        'origo'                     => "$BASE/2024/12/ORIGO.png.webp",
        'promiles'                  => "$BASE/2024/12/ProMiles-1.png.webp",
        'craig-safety-technologies' => "$BASE/2024/12/Craig-Safety-Technologies.png.webp",
        'geotab'                    => "$BASE/2024/12/Geotab-1.png",
        // These partners are not on the envuetelematics.com partners page but
        // have individual pages — using clean name display as fallback
        'coast-pay'        => '',
        'car-advise'       => '',
        'ok-alone'         => '',
        'moveev'           => '',
        'greater-than'     => '',
        'xtract'           => '',
    ];

    $src = $logos[$slug] ?? '';
    ob_start();
    echo '<div class="partner-logo-block">';
    if ( $src ) {
        $alt = esc_attr( $name . ' official logo' );
        $esc = esc_url( $src );
        $fallback = esc_js( $name );
        echo "<img src=\"{$esc}\" alt=\"{$alt}\" loading=\"eager\" onerror=\"this.style.display='none';this.nextElementSibling.style.display='block';\"><span class=\"partner-logo-name\" style=\"display:none\">{$name}</span>";
    } else {
        echo "<span class=\"partner-logo-name\">{$name}</span>";
    }
    echo '</div>';
    return ob_get_clean();
}

/* ══════════════════════════════════════════════════════════════════════
   FAQ SECTION HELPER
   Outputs: JSON-LD FAQPage schema + accessible HTML accordion
══════════════════════════════════════════════════════════════════════ */
function envue_faq_section( array $faqs, string $heading = 'Frequently Asked Questions' ): string {
    if ( empty($faqs) ) return '';

    // JSON-LD
    $entities = [];
    foreach ( $faqs as $q => $a ) {
        $entities[] = [
            '@type'          => 'Question',
            'name'           => $q,
            'acceptedAnswer' => [ '@type' => 'Answer', 'text' => wp_strip_all_tags($a) ],
        ];
    }
    $schema = [
        '@context'   => 'https://schema.org',
        '@type'      => 'FAQPage',
        'mainEntity' => $entities,
    ];
    $json = wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );

    $chevron = '<svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5l5 5 5-5" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    ob_start();
    echo "<script type=\"application/ld+json\">{$json}</script>\n";
    echo '<section class="section faq-section"><div class="wrap">';
    echo '<div class="section-head section-head--center"><div>';
    echo '<span class="eyebrow reveal">FAQ</span>';
    echo '<h2 class="reveal" style="--d:1">' . esc_html($heading) . '</h2>';
    echo '</div></div>';
    echo '<div class="faq-list">';
    foreach ( $faqs as $q => $a ) {
        echo '<div class="faq-item">';
        echo '<button class="faq-q">' . esc_html($q) . '<span class="faq-chevron">' . $chevron . '</span></button>';
        echo '<div class="faq-a">' . wp_kses_post($a) . '</div>';
        echo '</div>';
    }
    echo '</div></div></section>';
    return ob_get_clean();
}

/* ══════════════════════════════════════════════════════════════════════
   SEO META TAGS + PAGE-LEVEL SCHEMA
   Hooks into wp_head — outputs meta description, OG tags, and
   Organization + BreadcrumbList JSON-LD on every page.
══════════════════════════════════════════════════════════════════════ */
// Only run our built-in SEO output when AIOSEO Pro is NOT active.
// If AIOSEO is active it already outputs <title>, meta description, OG tags
// and JSON-LD — running ours too would produce duplicate tags that hurt rankings.
// Deactivate AIOSEO on this site to let our leaner, page-specific SEO take over,
// OR keep AIOSEO active and let it handle all meta (this block stays silent).
// AIOSEO is plugin-agnostic here: we check at runtime (plugins load after the
// theme's functions.php is parsed, so a load-time defined() check is unreliable).
add_action( 'wp', function () {
    if ( defined( 'AIOSEO_VERSION' ) || is_admin() ) return;
    add_action( 'wp_head', 'envue_seo_head', 5 );
    add_filter( 'pre_get_document_title', 'envue_seo_title', 20 );
} );

/* Title for the current request from envue_seo_meta(), or '' to let WP decide. */
function envue_seo_title( $title = '' ) {
    $slug = envue_current_slug();
    $meta = envue_seo_meta();
    if ( is_front_page() || isset( $meta[ $slug ] ) ) return $meta[ $slug ][0];
    if ( ! empty( $GLOBALS['envue_virtual_slug'] ) ) return ucwords( str_replace( '-', ' ', $slug ) ) . ' | EnVue Telematics';
    return $title;
}

function envue_seo_head() {
    // is_front_page() must be checked first — static front page is also is_page()
    // and its slug ('home', 'homepage', etc.) won't match the '' key in $meta.
    $slug = envue_current_slug();
    if ( is_front_page() ) {
        $url = home_url('/');
    } elseif ( ! empty( $GLOBALS['envue_virtual_slug'] ) ) {
        $url = home_url( '/' . $slug . '/' );
    } else {
        $url = get_permalink() ?: home_url('/');
    }
    $url = esc_url( $url );

    // ── Per-page meta ───────────────────────────────────────────────
    $defaults = [ wp_get_document_title(), 'EnVue Telematics provides GPS fleet tracking, AI dash cams, and Geotab-powered fleet management solutions for commercial fleets of all sizes. US-based support 24/7.' ];
    $meta = envue_seo_meta();
    [$title, $desc] = $meta[$slug] ?? $defaults;
    if ( is_singular( 'post' ) ) {
        $title = wp_get_document_title();
        $desc  = wp_strip_all_tags( get_the_excerpt() ) ?: $desc;
    }
    // Use get_site_url() so og:image resolves to whatever domain the site runs on —
    // no manual update needed after switching from staging to production.
    $img = get_site_url() . '/wp-content/uploads/2024/12/EnVue-Telematics-Logo-large.png';
    envue_seo_output( $slug, $url, $title, $desc, $img );
}

function envue_seo_meta() {
    return [
        ''                          => [ 'Smarter Fleet Management | GPS Tracking, AI Dash Cams & Geotab Solutions | EnVue Telematics', 'EnVue Telematics delivers GPS fleet tracking, AI dash cams, Geotab-powered telematics, and fleet management consulting. Lower costs, reduce accidents, stay compliant.' ],
        'solutions'                 => [ 'Fleet Management Solutions: GPS, Dash Cams & Compliance | EnVue Telematics', 'Complete fleet management solutions powered by Geotab. GPS tracking, AI dash cams, equipment visibility, ELD compliance, and fuel management from one expert team.' ],
        'dash-cams'                 => [ 'AI Dash Cams for Fleet Safety & Driver Coaching | EnVue Telematics', 'AI-powered fleet dash cams with event-triggered HD video, real-time driver coaching, and insurance-grade evidence capture. Powered by Lytx, Netradyne, Mobileye & Geotab.' ],
        'gps-tracking'              => [ 'Real-Time GPS Fleet Tracking & Asset Visibility | EnVue Telematics', 'Live GPS fleet tracking with geofencing, trip history, and stolen vehicle recovery. 24/7 visibility into every vehicle and asset in your operation.' ],
        'equipment-management'      => [ 'Fleet Equipment & Asset Tracking Solutions | EnVue Telematics', 'Track powered and non-powered fleet assets on one platform. Trailers, generators, and heavy equipment alongside your vehicles with geofencing and theft recovery.' ],
        'maintenance'               => [ 'Predictive Fleet Maintenance & Vehicle Diagnostics | EnVue Telematics', 'Proactive fleet maintenance with real-time fault codes, automated PM reminders, and integrated work order management. Lower costs with predictive diagnostics.' ],
        'fuel-management'           => [ 'Fleet Fuel Management: Idle Reduction & Fuel Card Controls | EnVue Telematics', 'Reduce fleet fuel spend with idle alerts, fuel card integration, and fraud detection. GPS-matched transactions and automated IFTA reporting.' ],
        'geotab'                    => [ 'Powered by Geotab: #1 Fleet Telematics Platform | EnVue Telematics', "EnVue is a Geotab Elite Specialized Partner. Deploy the world's most powerful open fleet platform with expert implementation, training, and 24/7 support." ],
        'results'                   => [ 'Fleet Telematics ROI: Real Results from Real Fleets | EnVue Telematics', 'Verified results: 31% fewer reportable accidents, 21% fewer accidents per million miles, 7% better MPG. See what Geotab-powered telematics delivers for fleets like yours.' ],
        'industries'                => [ 'Fleet Management by Industry: Construction, Trucking & More | EnVue Telematics', 'Industry-specific fleet telematics for construction, trucking, field services, oil & gas, government, and leasing fleets. Tailored solutions and expert consulting.' ],
        'construction'              => [ 'Construction Fleet Management & Equipment Tracking | EnVue Telematics', 'GPS tracking, equipment management, and theft recovery for construction fleets. Monitor every machine across job sites from one Geotab-powered dashboard.' ],
        'trucking-transportation'   => [ 'Trucking & Transportation Fleet Management | ELD, HOS & Safety | EnVue Telematics', 'Complete fleet solution for trucking — ELD compliance, AI dash cams, HOS automation, and IFTA reporting from one platform. US-based support 24/7.' ],
        'field-services'            => [ 'Field Service Fleet Management: Dispatch & Technician Tracking | EnVue Telematics', 'Dynamic dispatch, real-time technician tracking, and proof-of-service for field service fleets. Cut response time and increase daily job completions.' ],
        'oil-gas'                   => [ 'Oil & Gas Fleet Management: Remote Tracking & Safety | EnVue Telematics', 'Remote asset tracking, lone worker safety, and ELD compliance for oil and gas fleets operating in demanding upstream and midstream environments.' ],
        'government'                => [ 'Government Fleet Management: Accountability & Compliance | EnVue Telematics', 'Public accountability dashboards, automated compliance reporting, and cost-per-asset tracking for municipal and government fleets.' ],
        'our-partners'              => [ 'Fleet Technology Partners: Video, Routing, Fuel & Safety | EnVue Telematics', 'EnVue partners with Geotab, Lytx, Netradyne, Samsara, Elite EXTRA, FleetCor, and 20+ leading fleet technology providers.' ],
        'resources'                 => [ 'Fleet Management Resources, Guides & Industry Insights | EnVue Telematics', 'Fleet management guides, safety checklists, ROI tools, and industry news from the EnVue Telematics team.' ],
        'company'                   => [ 'About EnVue Telematics: Fleet Technology Experts Since 2011 | EnVue', 'EnVue Telematics is a Geotab Elite Specialized Partner headquartered in Longview, Texas, serving commercial fleets in the US and Mexico since 2011.' ],
        'about-envue'               => [ 'About EnVue Telematics: Fleet Technology Experts Since 2011 | EnVue', 'EnVue Telematics is a Geotab Elite Specialized Partner headquartered in Longview, Texas, serving commercial fleets in the US and Mexico since 2011.' ],
        'about-us'                  => [ 'About EnVue Telematics: Fleet Technology Experts Since 2011 | EnVue', 'EnVue Telematics is a Geotab Elite Specialized Partner headquartered in Longview, Texas, serving commercial fleets in the US and Mexico since 2011.' ],
        'get-in-touch'              => [ 'Contact EnVue Telematics | Free Fleet Demo & Consultation', 'Contact EnVue Telematics for a free fleet demo. Call (800) 201-1169, email sales@et-envue.com, or fill out our form. Longview, Texas.' ],
        'faqs'                      => [ 'Fleet Telematics FAQs: GPS, ELD, Geotab & More | EnVue Telematics', 'Answers to common questions about fleet telematics, ELD compliance, Geotab deployment, and ROI from the EnVue Telematics expert team.' ],
        // Partner pages
        'lytx'                      => [ 'Lytx Video Telematics & Fleet Safety | EnVue Telematics Partner', 'Maximize fleet safety with Lytx AI-powered dash cams and video telematics. Deployed and supported by EnVue Telematics — Geotab Elite Specialized Partner.' ],
        'netradyne'                 => [ 'Netradyne Driver.i® Vision Safety Camera | EnVue Telematics Partner', 'Deploy Netradyne Driver.i® — the AI vision safety system that rewards positive driving. Integrated with Geotab by EnVue Telematics.' ],
        'mobileye'                  => [ 'Mobileye ADAS Collision Avoidance for Fleets | EnVue Telematics', 'Advanced collision avoidance for commercial fleets. Mobileye ADAS detects forward collisions, lane departures, and pedestrians. Deployed by EnVue.' ],
        'surfsight'                 => [ 'Surfsight AI Dash Cams & Cloud Video Telematics | EnVue Partner', 'AI-powered dash cams with cloud video access and real-time coaching. Surfsight fleet safety deployed and supported by EnVue Telematics.' ],
        'samsara'                   => [ 'Samsara Connected Fleet Management & Safety | EnVue Telematics', 'GPS tracking, AI dash cams, and ELD compliance from Samsara. Enhanced with EnVue Telematics consulting and 24/7 US-based support.' ],
        'azuga'                     => [ 'Azuga GPS Tracking, Dash Cams & Driver Rewards | EnVue Partner', 'Azuga fleet telematics with GPS tracking, AI cameras, and driver rewards program. Deployed and supported by EnVue Telematics.' ],
        'elite-extra'               => [ 'Elite EXTRA Route Optimization & Dispatch | EnVue Telematics', 'Smart dispatch and last-mile route optimization from Elite EXTRA, integrated with Geotab GPS fleet tracking by EnVue Telematics.' ],
        'route4me'                  => [ 'Route4Me Smart Routing & Fleet Optimization | EnVue Partner', 'Multi-stop route planning and optimization from Route4Me, integrated with Geotab fleet tracking by EnVue Telematics.' ],
        'drivewyze'                 => [ 'Drivewyze Weigh Station Bypass | EnVue Telematics Partner', 'Save time and fuel with Drivewyze PreClear — 900+ bypass sites across 47 states, available through Geotab Drive. Deployed by EnVue.' ],
        'fleetcor'                  => [ 'FleetCor Fuel Cards & Fleet Fuel Management | EnVue Partner', 'Control fleet fuel spend with FleetCor cards and GPS-matched transaction reconciliation. Configured by EnVue Telematics.' ],
        'coast-pay'                 => [ 'Coast Pay Fleet Fuel Card | EnVue Telematics Integration', 'Coast Pay fleet fuel card accepted anywhere Visa is accepted, integrated with Geotab GPS by EnVue Telematics for complete fuel visibility.' ],
        'fleetio'                   => [ 'Fleetio Fleet Maintenance Management | EnVue Telematics Partner', 'Streamline fleet maintenance with Fleetio and Geotab diagnostic integration. PM scheduling, DVIRs, and work orders configured by EnVue.' ],
        'whip-around'               => [ 'Whip Around Digital Vehicle Inspections | EnVue Telematics', 'Digital DVIR inspections that drivers actually complete. Whip Around integrated with Geotab and configured by EnVue Telematics.' ],
        'car-advise'                => [ 'CarAdvise Fleet Maintenance Marketplace | EnVue Telematics', 'Pre-negotiated fleet maintenance rates at 30,000+ shops. CarAdvise integrated with Geotab diagnostics by EnVue Telematics.' ],
        'promiles'                  => [ 'ProMiles IFTA Fuel Tax Reporting | EnVue Telematics Partner', 'Automate IFTA fuel tax reporting with ProMiles and Geotab GPS mileage data. Configured and supported by EnVue Telematics.' ],
        'smith-system'              => [ 'Smith System Defensive Driving Training | EnVue Fleet Safety', 'Smith System evidence-based driving training targeted with Geotab driver data by EnVue Telematics. Build a lasting safety culture.' ],
        'speedgauge'                => [ 'SpeedGauge Fleet Speed Management & Risk Scoring | EnVue', 'Accurate speed risk scoring relative to posted limits — not just absolute speed. SpeedGauge integrated with Geotab by EnVue Telematics.' ],
        'safety-first'              => [ 'SafetyFirst Fleet Risk Management Programs | EnVue Telematics', 'Fleet risk management and driver safety programs from SafetyFirst, integrated with Geotab driver behavior data by EnVue Telematics.' ],
        'lifesaver-mobile'          => [ 'LifeSaver Mobile Distracted Driving Prevention | EnVue', 'Block distracting apps while drivers are in motion. Software-only LifeSaver Mobile with a MyGeotab Add-in, deployed by EnVue Telematics.' ],
        'predictive-coach'          => [ 'Predictive Coach Behavior-Based Automated Driver Training | EnVue', 'Automated micro-lesson driver training triggered by real driving behavior — up to 73% less risky driving. Predictive Coach deployed by EnVue Telematics.' ],
        'phillips-connect'          => [ 'Phillips Connect Smart Trailer Tracking | EnVue Telematics', 'Real-time trailer GPS, door sensors, and cargo monitoring from Phillips Connect. Integrated with Geotab by EnVue Telematics.' ],
        'sensata-technologies'      => [ 'Sensata Technologies Trailer TPMS & Telematics | EnVue', 'Trailer tire pressure monitoring, cargo sensing, and location tracking from Sensata. Integrated with Geotab fleet data by EnVue Telematics.' ],
        'origo'                     => [ 'ORIGOInspect Digital Fleet Inspections | EnVue Telematics', 'Guided digital vehicle inspection checklists with photo capture and defect escalation. ORIGOInspect configured by EnVue Telematics.' ],
        'ok-alone'                  => [ 'Ok Alone Lone Worker Safety App | EnVue Telematics Partner', 'Protect field workers with automated check-ins and GPS tracking. Ok Alone integrated with Geotab fleet tracking by EnVue Telematics.' ],
        'moveev'                    => [ 'MoveEV ReimburseEV & Electric Fleet Management | EnVue', 'ReimburseEV home-charging reimbursement plus data-driven EV readiness and fleet electrification planning powered by Geotab vehicle usage data from EnVue Telematics.' ],
        'greater-than'              => [ 'Greater Than AI Fleet Risk & Sustainability Scoring | EnVue', 'AI-powered driver risk scoring and CO₂ emissions tracking powered by Geotab data from EnVue Telematics.' ],
        'craig-safety-technologies' => [ 'Craig Safety Technologies Compliance Safety Manager | EnVue', 'Compliance Safety Manager software for DQ file management, The Hiring Path®, and paperless drug screening. Craig Safety Technologies partner of EnVue Telematics.' ],
        'xtract'                    => [ 'Xtract Crash Data & Claims Platform with eFNOL | EnVue Telematics', 'Automated first notice of loss, crash data, and claims handling for fleets. Xtract partner of EnVue Telematics.' ],
        'leasing-rental'            => [ 'Leasing & Rental Fleet Management | Asset Tracking | EnVue', 'Utilization reporting, odometer tracking, and unauthorized-use alerts for leasing and rental fleet operations.' ],
        'safety'                    => [ 'Fleet Safety Programs: AI Cameras, Coaching & Risk Management | EnVue', 'Comprehensive fleet safety programs combining AI dash cams, GPS tracking, and driver coaching to reduce accidents and lower insurance costs.' ],
        'productivity'              => [ 'Fleet Productivity: Dispatch, Routing & Utilization | EnVue', 'Increase fleet productivity with real-time GPS dispatch, route optimization, and utilization reporting from Geotab-powered EnVue Telematics.' ],
        'optimization'              => [ 'Fleet Cost Optimization: Fuel, Maintenance & Right-Sizing | EnVue', 'Reduce fleet operating costs with fuel optimization, predictive maintenance, and data-driven right-sizing strategies.' ],
        'sustainability'            => [ 'Fleet Sustainability: EV Integration & Emissions Tracking | EnVue', 'Build sustainable fleet programs with emissions tracking, EV readiness analysis, and carbon footprint reporting.' ],
        'compliance'                => [ 'Fleet Compliance: ELD, HOS, IFTA & DOT Automation | EnVue', 'Automate HOS logging, IFTA fuel tax, DVIR inspections, and DOT compliance with Geotab-powered solutions from EnVue Telematics.' ],
        'electric-vehicles'         => [ 'Electric Fleet Management & EV Readiness Planning | EnVue', 'Plan your fleet electrification with real usage data. Identify EV candidates, model TCO, and manage EVs alongside ICE vehicles.' ],
        'customer-journey'          => [ 'The EnVue Customer Journey: From First Call to Full Deployment | EnVue', "Discover what fleet deployment with EnVue Telematics looks like — from discovery through implementation, training, and quarterly reviews." ],
        'expandability'             => [ '300+ Fleet Integrations via Geotab Marketplace | EnVue Telematics', 'Connect fleet telematics to payroll, ERP, dispatch, fuel cards, compliance tools, and safety platforms through 300+ vetted Geotab Marketplace integrations. Open API with no lock-in.' ],
        'integrations'              => [ '300+ Fleet Integrations via Geotab Marketplace | EnVue Telematics', 'Connect fleet telematics to payroll, ERP, dispatch, fuel cards, compliance tools, and safety platforms through 300+ vetted Geotab Marketplace integrations. Open API with no lock-in.' ],
        // Listings, events, fallback routes
        'news'                      => [ 'Latest Updates in Fleet Management: Stay Informed with Timely Industry News', 'Stay updated with the latest fleet industry insights and vital compliance updates from EnVue Telematics.' ],
        'blog-articles'             => [ 'Innovative Fleet Management Ideas: Bright Insights for Modern Operations', 'Explore innovative insights in fleet management with our comprehensive articles. Enhance efficiency and safety in your fleet operations today.' ],
        'events-calendar'           => [ 'Events - EnVue Telematics', 'Fleet technology webinars, trade shows, and industry events from EnVue Telematics and our technology partners.' ],
        'events'                    => [ 'Events - EnVue Telematics', 'Fleet technology webinars, trade shows, and industry events from EnVue Telematics and our technology partners.' ],
        'powered-by-geotab'         => [ 'Powered by Geotab: #1 Fleet Telematics Platform | EnVue Telematics', "EnVue is a Geotab Elite Specialized Partner. Deploy the world's most powerful open fleet platform with expert implementation, training, and 24/7 support." ],
    ];
}

function envue_seo_output( $slug, $url, $title, $desc, $img ) {
    echo "\n<!-- EnVue SEO -->\n";
    echo '<meta name="description" content="' . esc_attr($desc) . "\">\n";
    echo '<meta name="robots" content="index,follow,max-image-preview:large">' . "\n";
    echo '<link rel="canonical" href="' . $url . "\">\n";
    echo '<meta property="og:title" content="' . esc_attr($title) . "\">\n";
    echo '<meta property="og:description" content="' . esc_attr($desc) . "\">\n";
    echo '<meta property="og:type" content="website">' . "\n";
    echo '<meta property="og:url" content="' . $url . "\">\n";
    echo '<meta property="og:image" content="' . esc_url($img) . "\">\n";
    echo '<meta property="og:site_name" content="EnVue Telematics">' . "\n";
    echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
    echo '<meta name="twitter:site" content="@envueTelematics">' . "\n";

    // ── Organization schema (every page) ────────────────────────────
    $org = [
        '@context'     => 'https://schema.org',
        '@type'        => ['Organization','LocalBusiness'],
        '@id'          => home_url('/') . '#organization',
        'name'         => 'EnVue Telematics',
        'url'          => home_url('/'),
        'logo'         => ['@type'=>'ImageObject','url'=>$img],
        'description'  => 'EnVue Telematics is a Geotab Elite Specialized Partner providing GPS fleet tracking, AI dash cams, and fleet management solutions. US-based support 24/7.',
        'telephone'    => '+18002011169',
        'email'        => 'sales@et-envue.com',
        'foundingDate' => '2011',
        'areaServed'   => ['US','MX'],
        'address'      => ['@type'=>'PostalAddress','streetAddress'=>'119 West Tyler Street, Suite 100','addressLocality'=>'Longview','addressRegion'=>'TX','postalCode'=>'75601','addressCountry'=>'US'],
        'sameAs'       => ['https://www.facebook.com/EnVue-Telematics-2245144869080013','https://twitter.com/envuetelematics','https://www.linkedin.com/company/envue-telematics/'],
        'knowsAbout'   => ['Fleet Telematics','GPS Fleet Tracking','AI Dash Cams','Geotab','ELD Compliance','Fleet Management','Driver Safety'],
    ];
    echo '<script type="application/ld+json">' . wp_json_encode($org, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE) . "</script>\n";

    // ── WebSite schema + homepage FAQ (front page only) ──────────
    if ( is_front_page() ) {
        // WebSite schema — enables Google Sitelinks Search Box
        $website = [
            '@context'        => 'https://schema.org',
            '@type'           => 'WebSite',
            '@id'             => home_url('/') . '#website',
            'url'             => home_url('/'),
            'name'            => 'EnVue Telematics',
            'description'     => 'GPS fleet tracking, AI dash cams, and Geotab-powered fleet management solutions for commercial fleets.',
            'potentialAction' => [
                '@type'       => 'SearchAction',
                'target'      => [ '@type' => 'EntryPoint', 'urlTemplate' => home_url('/') . '?s={search_term_string}' ],
                'query-input' => 'required name=search_term_string',
            ],
        ];
        echo '<script type="application/ld+json">' . wp_json_encode($website, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE) . "</script>\n";

        // FAQPage schema on homepage — extends AEO coverage to highest-traffic page
        $hp_faqs = [
            [ 'name' => 'What is EnVue Telematics?', 'text' => 'EnVue Telematics is a Geotab Elite Specialized Partner providing GPS fleet tracking, AI dash cams, ELD compliance, and fleet management consulting for commercial fleets across the United States and Mexico. Founded in 2011 and headquartered in Longview, Texas, with 24/7 US-based support.' ],
            [ 'name' => 'What fleet sizes does EnVue Telematics serve?', 'text' => 'EnVue Telematics serves commercial fleets of all sizes, from small regional operators to large enterprise fleets with hundreds of vehicles. Solutions scale on the Geotab platform and are configured to the specific operational needs of each fleet.' ],
            [ 'name' => 'Is EnVue Telematics a Geotab authorized reseller?', 'text' => 'Yes. EnVue Telematics is a Geotab Elite Specialized Partner — the highest tier in the Geotab channel partner certification program. This reflects proven technical expertise, deployment volume, and customer satisfaction with the Geotab platform.' ],
            [ 'name' => 'What GPS fleet tracking solutions does EnVue offer?', 'text' => 'EnVue Telematics offers real-time GPS fleet tracking, AI dash cams (Lytx, Netradyne, Mobileye), equipment and asset tracking, ELD compliance, fuel management, predictive maintenance, driver safety programs, and 300+ Geotab Marketplace integrations through a single platform.' ],
            [ 'name' => 'How do I get started with EnVue Telematics?', 'text' => 'Contact EnVue Telematics at (800) 201-1169 or sales@et-envue.com to schedule a free fleet assessment. An EnVue fleet advisor will review your operation, identify high-impact opportunities, and demonstrate the relevant solutions. Most assessments are scheduled within 2-3 business days.' ],
        ];
        $hp_faq_schema = [
            '@context'   => 'https://schema.org',
            '@type'      => 'FAQPage',
            'mainEntity' => array_map( fn($f) => [
                '@type'          => 'Question',
                'name'           => $f['name'],
                'acceptedAnswer' => [ '@type' => 'Answer', 'text' => $f['text'] ],
            ], $hp_faqs ),
        ];
        echo '<script type="application/ld+json">' . wp_json_encode($hp_faq_schema, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE) . "</script>\n";
    }

    // ── BreadcrumbList (inner pages) ──────────────────────────────
    if ( $slug && !is_front_page() ) {
        $page_name = get_queried_object_id() ? get_the_title( get_queried_object_id() ) : ucwords( str_replace( '-', ' ', $slug ) );
        $partner_slugs = ['lytx','netradyne','mobileye','surfsight','samsara','azuga','elite-extra','route4me','drivewyze','fleetcor','coast-pay','fleetio','whip-around','car-advise','promiles','smith-system','speedgauge','safety-first','lifesaver-mobile','predictive-coach','phillips-connect','sensata-technologies','origo','ok-alone','moveev','greater-than','craig-safety-technologies','xtract'];
        $industry_slugs = ['construction','trucking-transportation','field-services','oil-gas','government','leasing-rental'];
        $solution_slugs = ['powered-by-geotab','expandability','dash-cams','gps-tracking','equipment-management','maintenance','fuel-management','geotab','safety','productivity','optimization','sustainability','compliance','electric-vehicles'];

        $crumbs = [['@type'=>'ListItem','position'=>1,'name'=>'Home','item'=>home_url('/')]];
        if ( in_array($slug, $partner_slugs) ) {
            $crumbs[] = ['@type'=>'ListItem','position'=>2,'name'=>'Partners','item'=>home_url('/our-partners/')];
            $crumbs[] = ['@type'=>'ListItem','position'=>3,'name'=>$page_name,'item'=>$url];
        } elseif ( in_array($slug, $industry_slugs) ) {
            $crumbs[] = ['@type'=>'ListItem','position'=>2,'name'=>'Industries','item'=>home_url('/industries/')];
            $crumbs[] = ['@type'=>'ListItem','position'=>3,'name'=>$page_name,'item'=>$url];
        } elseif ( in_array($slug, $solution_slugs) ) {
            $crumbs[] = ['@type'=>'ListItem','position'=>2,'name'=>'Solutions','item'=>home_url('/solutions/')];
            $crumbs[] = ['@type'=>'ListItem','position'=>3,'name'=>$page_name,'item'=>$url];
        } else {
            $crumbs[] = ['@type'=>'ListItem','position'=>2,'name'=>$page_name,'item'=>$url];
        }
        $bc = ['@context'=>'https://schema.org','@type'=>'BreadcrumbList','itemListElement'=>$crumbs];
        echo '<script type="application/ld+json">' . wp_json_encode($bc, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE) . "</script>\n";
    }
}

/* ══════════════════════════════════════════════════════════════════════
   CONTACT FORM HANDLER (no plugin required)
   Processes POST submissions from page-get-in-touch.php.
   Validates the nonce, sanitizes every field, sends via wp_mail(),
   then redirects with ?sent=1 to prevent double-submission on refresh.
══════════════════════════════════════════════════════════════════════ */
add_action( 'init', function () {
    if ( ! isset( $_POST['envue_contact_nonce'] ) ) return;
    if ( ! wp_verify_nonce( $_POST['envue_contact_nonce'], 'envue_contact_form' ) ) wp_die( 'Security check failed.' );

    $name       = sanitize_text_field( $_POST['contact_name']       ?? '' );
    $company    = sanitize_text_field( $_POST['contact_company']     ?? '' );
    $phone      = sanitize_text_field( $_POST['contact_phone']       ?? '' );
    $email      = sanitize_email(      $_POST['contact_email']       ?? '' );
    $fleet_size = sanitize_text_field( $_POST['contact_fleet_size']  ?? '' );
    $message    = sanitize_textarea_field( $_POST['contact_message'] ?? '' );

    if ( $name && is_email( $email ) ) {
        $to      = 'sales@et-envue.com';
        $subject = "Fleet Assessment Request — {$name}" . ( $company ? " ({$company})" : '' );
        $body    = implode( "\n", array_filter( [
            "Name:       {$name}",
            $company    ? "Company:    {$company}"    : '',
            $phone      ? "Phone:      {$phone}"      : '',
            "Email:      {$email}",
            $fleet_size ? "Fleet Size: {$fleet_size}" : '',
            $message    ? "\nMessage:\n{$message}"    : '',
        ] ) );
        $headers = [
            'Content-Type: text/plain; charset=UTF-8',
            "Reply-To: {$name} <{$email}>",
        ];
        wp_mail( $to, $subject, $body, $headers );
    }

    // Redirect regardless of mail success to avoid double-submit
    $redirect = add_query_arg( 'sent', '1', wp_get_referer() ?: home_url( '/get-in-touch/' ) );
    wp_safe_redirect( $redirect );
    exit;
} );
