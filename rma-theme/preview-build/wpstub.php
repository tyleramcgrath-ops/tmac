<?php
// Minimal WordPress stand-in so the theme's templates render to static HTML
// for the Vercel preview. Usage: php wpstub.php <theme dir> <page slug or ''>
define( 'ABSPATH', __DIR__ );
$THEME = $argv[1]; $ROUTE = $argv[2]; // '' for home, or a page slug
$GLOBALS['hooks'] = array(); $GLOBALS['styles'] = array(); $GLOBALS['scripts'] = array();
function add_action( $h, $cb, $p = 10 ) { $GLOBALS['hooks'][ $h ][ $p ][] = $cb; }
function add_filter( $h, $cb, $p = 10 ) { $GLOBALS['hooks'][ 'f:' . $h ][ $p ][] = $cb; }
function do_action( $h ) { if ( empty( $GLOBALS['hooks'][ $h ] ) ) return; ksort( $GLOBALS['hooks'][ $h ] ); foreach ( $GLOBALS['hooks'][ $h ] as $cbs ) foreach ( $cbs as $cb ) $cb(); }
function add_theme_support() {} function register_nav_menus() {}
function get_template_directory() { return $GLOBALS['THEME']; }
function get_template_directory_uri() { return ''; }
function wp_enqueue_style( $h, $src ) { $GLOBALS['styles'][] = $src; }
function wp_enqueue_script( $h, $src ) { $GLOBALS['scripts'][] = $src; }
function language_attributes() { echo 'lang="en-US"'; }
function bloginfo( $k ) { echo 'UTF-8'; }
function get_bloginfo( $k ) { return 'My WordPress'; }
function wp_head() { do_action( 'wp_enqueue_scripts' ); do_action( 'wp_head' ); $pages = rma_services() + rma_company_pages(); $r = $GLOBALS['ROUTE']; $t = isset( $pages[ $r ] ) ? $pages[ $r ]['title'] . ' — Relative Marketing Agency' : ( '404' === $r ? 'Page not found — Relative Marketing Agency' : 'Relative Marketing Agency — Strategy. Creativity. Real Growth.' ); echo "<title>$t</title>\n<meta name=\"robots\" content=\"noindex, nofollow\">\n"; foreach ( $GLOBALS['styles'] as $s ) echo '<link rel="stylesheet" href="' . htmlspecialchars( $s ) . "\">\n"; }
function wp_footer() { foreach ( $GLOBALS['scripts'] as $s ) echo '<script src="' . $s . "\"></script>\n"; }
function body_class() { echo 'class="' . ( $GLOBALS['ROUTE'] ? 'page' : 'home' ) . '"'; }
function wp_body_open() {}
function is_front_page() { return '' === $GLOBALS['ROUTE']; }
function is_page() { return '' !== $GLOBALS['ROUTE']; }
function is_home() { return false; } function is_search() { return false; }
function get_queried_object_id() { return 7; } function get_the_ID() { return 7; }
function get_post_field( $f ) { return $GLOBALS['ROUTE']; }
function get_post_meta() { return ''; }
function home_url( $p = '/' ) { $p = trim( $p, '/' ); return $p ? '/' . $p . '/' : '/'; }
function admin_url( $p ) { return '#'; }
function esc_url( $u ) { return htmlspecialchars( $u, ENT_QUOTES ); }
function esc_html( $s ) { return htmlspecialchars( $s, ENT_QUOTES ); }
function esc_attr( $s ) { return htmlspecialchars( $s, ENT_QUOTES ); }
function wp_kses_post( $s ) { return $s; }
function sanitize_key( $s ) { return $s; }
function wp_referer_field() { return '<input type="hidden" name="_wp_http_referer" value="/">'; }
function has_custom_logo() { return false; } function get_theme_mod() { return 0; }
function get_header() { include $GLOBALS['THEME'] . '/header.php'; }
function get_footer() { include $GLOBALS['THEME'] . '/footer.php'; }
function get_template_part( $slug, $name = null, $args = array() ) { include $GLOBALS['THEME'] . '/' . $slug . '.php'; }
$GLOBALS['posts_left'] = 1;
function have_posts() { return $GLOBALS['posts_left'] > 0; }
function the_post() { $GLOBALS['posts_left']--; }
function get_the_content() { return ''; } function the_content() {}
function the_title() { echo ucwords( str_replace( '-', ' ', $GLOBALS['ROUTE'] ) ); }
function post_class( $c = '' ) { echo 'class="' . $c . '"'; }
function __( $s ) { return $s; }
function wp_list_pluck( $list, $field ) { return array_column( $list, $field ); }
require $THEME . '/functions.php';
if ( '' === $ROUTE ) { include $THEME . '/front-page.php'; } elseif ( '404' === $ROUTE ) { include $THEME . '/404.php'; } else { include $THEME . '/page.php'; }
