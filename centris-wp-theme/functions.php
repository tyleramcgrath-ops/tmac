<?php
/**
 * Centris Combined — theme functions
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'CENTRIS_VERSION', '1.0.0' );
define( 'CENTRIS_THEME_DIR', get_template_directory() );
define( 'CENTRIS_THEME_URI', get_template_directory_uri() );

function centris_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', [ 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ] );
    add_theme_support( 'custom-logo' );
    add_theme_support( 'responsive-embeds' );

    register_nav_menus( [
        'primary' => __( 'Primary Menu', 'centris-combined' ),
        'footer'  => __( 'Footer Menu', 'centris-combined' ),
    ] );
}
add_action( 'after_setup_theme', 'centris_setup' );

function centris_assets() {
    wp_enqueue_style(
        'centris-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap',
        [],
        null
    );
    wp_enqueue_style(
        'centris-main',
        CENTRIS_THEME_URI . '/assets/css/main.css',
        [ 'centris-fonts' ],
        CENTRIS_VERSION
    );
    wp_enqueue_script(
        'centris-js',
        CENTRIS_THEME_URI . '/assets/js/centris.js',
        [],
        CENTRIS_VERSION,
        true
    );
}
add_action( 'wp_enqueue_scripts', 'centris_assets' );

/**
 * Page templates registered explicitly so they show up in the WP page editor.
 */
function centris_page_templates( $templates ) {
    $templates['page-templates/front.php']           = __( 'Home (Full)', 'centris-combined' );
    $templates['page-templates/services.php']        = __( 'Services — Listing', 'centris-combined' );
    $templates['page-templates/industries.php']      = __( 'Industries — Listing', 'centris-combined' );
    $templates['page-templates/case-studies.php']    = __( 'Case Studies', 'centris-combined' );
    $templates['page-templates/about.php']           = __( 'About', 'centris-combined' );
    $templates['page-templates/contact.php']         = __( 'Contact', 'centris-combined' );
    $templates['page-templates/resources.php']       = __( 'Resources / FAQ', 'centris-combined' );
    $templates['page-templates/service-detail.php']  = __( 'Service — Detail', 'centris-combined' );
    $templates['page-templates/industry-detail.php'] = __( 'Industry — Detail', 'centris-combined' );
    return $templates;
}
add_filter( 'theme_page_templates', 'centris_page_templates' );

/**
 * On theme activation, auto-create the WP pages that map to each template.
 * One-time bootstrap so the user doesn't have to manually create 20+ pages.
 */
function centris_bootstrap_pages() {
    if ( get_option( 'centris_bootstrap_done' ) ) return;

    $pages = [
        // [ slug, title, template ]
        [ 'services',                    'Services',                    'page-templates/services.php' ],
        [ 'industries',                  'Industries',                  'page-templates/industries.php' ],
        [ 'case-studies',                'Case Studies',                'page-templates/case-studies.php' ],
        [ 'about',                       'About',                       'page-templates/about.php' ],
        [ 'contact',                     'Contact',                     'page-templates/contact.php' ],
        [ 'resources',                   'Resources',                   'page-templates/resources.php' ],

        // Services
        [ 'service-ai-call-center',      'AI Call Center',              'page-templates/service-detail.php' ],
        [ 'service-customer-support',    'Customer Support',            'page-templates/service-detail.php' ],
        [ 'service-bpo',                 'Business Process Outsourcing','page-templates/service-detail.php' ],
        [ 'service-inbound-sales',       'Inbound Sales',               'page-templates/service-detail.php' ],
        [ 'service-live-chat',           'Live Chat',                   'page-templates/service-detail.php' ],
        [ 'service-marketing-surveys',   'Marketing Surveys',           'page-templates/service-detail.php' ],
        [ 'service-quality-assurance',   'Quality Assurance',           'page-templates/service-detail.php' ],
        [ 'service-soft-collections',    'Soft Collections',            'page-templates/service-detail.php' ],
        [ 'service-tier-1-tech',         'Tier 1 Tech Support',         'page-templates/service-detail.php' ],

        // Industries
        [ 'industry-insurance',          'Insurance',                   'page-templates/industry-detail.php' ],
        [ 'industry-healthcare',         'Healthcare',                  'page-templates/industry-detail.php' ],
        [ 'industry-retail',             'Retail & E-commerce',         'page-templates/industry-detail.php' ],
        [ 'industry-security',           'Security',                    'page-templates/industry-detail.php' ],
        [ 'industry-utilities',          'Utilities',                   'page-templates/industry-detail.php' ],
        [ 'industry-finance',            'Finance',                     'page-templates/industry-detail.php' ],
    ];

    foreach ( $pages as $p ) {
        list( $slug, $title, $template ) = $p;
        if ( ! get_page_by_path( $slug ) ) {
            $id = wp_insert_post( [
                'post_title'   => $title,
                'post_name'    => $slug,
                'post_status'  => 'publish',
                'post_type'    => 'page',
                'post_content' => '',
            ] );
            if ( $id && ! is_wp_error( $id ) ) {
                update_post_meta( $id, '_wp_page_template', $template );
            }
        }
    }

    // Set the home page to a "Home" page using front template
    $home_id = null;
    $existing = get_page_by_path( 'home' );
    if ( ! $existing ) {
        $home_id = wp_insert_post( [
            'post_title'  => 'Home',
            'post_name'   => 'home',
            'post_status' => 'publish',
            'post_type'   => 'page',
        ] );
        if ( $home_id && ! is_wp_error( $home_id ) ) {
            update_post_meta( $home_id, '_wp_page_template', 'page-templates/front.php' );
        }
    } else {
        $home_id = $existing->ID;
    }
    if ( $home_id ) {
        update_option( 'show_on_front', 'page' );
        update_option( 'page_on_front', $home_id );
    }

    update_option( 'centris_bootstrap_done', 1 );
}
add_action( 'after_switch_theme', 'centris_bootstrap_pages' );

/**
 * Provide a helper image URL. Falls back to gh-pages hosted assets so the
 * theme works out of the box without re-uploading media.
 */
function centris_image_url( $slug ) {
    return 'https://tyleramcgrath-ops.github.io/tmac/centris/' . $slug;
}

/**
 * Active page detection helpers for nav dropdowns.
 */
function centris_nav_active( $slug ) {
    $current = is_page( $slug ) ? ' active' : '';
    return $current;
}
