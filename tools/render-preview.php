<?php
/**
 * Local preview shim — NOT part of the theme.
 *
 * Defines just enough of the WordPress API to render the theme's templates to
 * static HTML so they can be reviewed and screenshotted without a WordPress
 * install:
 *
 *     php tools/render-preview.php            # writes envue-theme/_preview-*.html
 *
 * The generated files are ignored by git.
 */

define( 'PREVIEW', true );

$theme = __DIR__ . '/../envue-theme';

// ── No-op plumbing ───────────────────────────────────────────────────
function add_action( ...$a ) {}
function add_filter( ...$a ) {}
function add_theme_support( ...$a ) {}
function register_nav_menus( ...$a ) {}
function register_sidebar( ...$a ) {}
function wp_enqueue_style( ...$a ) {}
function wp_enqueue_script( ...$a ) {}
function wp_script_add_data( ...$a ) {}
function wp_body_open() {}
function language_attributes() { echo 'lang="en-US"'; }
function bloginfo( $k ) { echo $k === 'charset' ? 'UTF-8' : 'EnVue Telematics'; }
function get_bloginfo( $k = '' ) { return 'EnVue Telematics'; }
function body_class( $extra = '' ) { echo 'class="envue ' . $extra . '"'; }

function wp_head() {
    echo '<title>EnVue Telematics — preview</title>' . "\n";
    echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
    echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
    echo '<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">' . "\n";
    echo '<link rel="stylesheet" href="assets/css/envue.css">' . "\n";
}
function wp_footer() { echo '<script src="assets/js/envue.js"></script>' . "\n"; }

// ── Escaping / i18n ──────────────────────────────────────────────────
function esc_url( $u )   { return htmlspecialchars( $u, ENT_QUOTES ); }
function esc_attr( $s )  { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function esc_html( $s )  { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function esc_textarea( $s ) { return esc_html( $s ); }
function __( $s, $d = '' )          { return $s; }
function esc_html__( $s, $d = '' )  { return esc_html( $s ); }
function esc_attr__( $s, $d = '' )  { return esc_attr( $s ); }
function esc_html_e( $s, $d = '' )  { echo esc_html( $s ); }
function esc_attr_e( $s, $d = '' )  { echo esc_attr( $s ); }
function _e( $s, $d = '' )          { echo $s; }

// ── URLs / theme ─────────────────────────────────────────────────────
function home_url( $path = '/' ) {
    $map = [
        '/' => 'index.html', '/solutions/' => 'solutions.html', '/results/' => 'results.html',
        '/industries/' => 'industries.html', '/partners/' => 'partners.html',
        '/resources/' => 'resources.html', '/company/' => 'company.html',
        '/dash-cams/' => 'dash-cams.html', '/gps-tracking/' => 'gps-tracking.html',
        '/equipment-management/' => 'equipment-management.html', '/maintenance/' => 'maintenance.html',
        '/fuel-management/' => 'fuel-management.html', '/geotab/' => 'geotab.html',
        '/construction/' => 'construction.html', '/trucking/' => 'trucking.html',
        '/field-services/' => 'field-services.html', '/oil-gas/' => 'oil-gas.html',
        '/government/' => 'government.html', '/logistics/' => 'logistics.html',
    ];
    $anchor = '';
    if ( str_contains( $path, '#' ) ) {
        [ $path, $anchor ] = explode( '#', $path, 2 );
        $anchor = '#' . $anchor;
    }
    return ( $map[ $path ] ?? ltrim( $path, '/' ) ) . $anchor;
}
function get_template_directory_uri() { return '.'; }
function get_theme_mod( $k, $default = false ) { return $default; }
function wp_get_attachment_image( ...$a ) { return ''; }
function wp_get_theme() { return new class { public function get( $k ) { return '2.0.0'; } }; }

// ── The loop (single empty page) ─────────────────────────────────────
$GLOBALS['__posts'] = 1;
function have_posts() { return $GLOBALS['__posts']-- > 0; }
function the_post() {}
function get_the_content() { return ''; }
function the_content() {}
function get_the_title() { return 'Preview page'; }
function the_title() { echo get_the_title(); }
function the_permalink() { echo '#'; }
function has_excerpt() { return false; }
function get_the_excerpt() { return ''; }
function has_post_thumbnail() { return false; }
function get_the_post_thumbnail_url( ...$a ) { return ''; }
function get_the_date() { return 'January 2026'; }
function wp_trim_words( $t, $n = 20 ) { return $t; }
function the_posts_pagination( ...$a ) {}
function is_home() { return true; }
function is_front_page() { return true; }
function get_the_archive_title() { return 'Resources'; }

// ── Template rendering ───────────────────────────────────────────────
$current = null;
function get_header() { global $theme; include $theme . '/header.php'; }
function get_footer() { global $theme; include $theme . '/footer.php'; }

require $theme . '/functions.php';

$templates = [
    'front-page'        => 'front-page.php',
    'gps-tracking'      => 'page-gps-tracking.php',
    'solutions'         => 'page-solutions.php',
    'company'           => 'page-company.php',
];

foreach ( $templates as $name => $file ) {
    $GLOBALS['__posts'] = 1;
    ob_start();
    include $theme . '/' . $file;
    $html = ob_get_clean();
    file_put_contents( $theme . "/_preview-$name.html", $html );
    printf( "rendered %-22s -> envue-theme/_preview-%s.html (%d bytes)\n", $file, $name, strlen( $html ) );
}
