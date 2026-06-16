<?php
/**
 * EnVue Telematics Theme Functions
 */

// ── Theme Setup
add_action('after_setup_theme', function() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo', [
        'height'      => 80,
        'width'       => 200,
        'flex-height' => true,
        'flex-width'  => true,
    ]);
    add_theme_support('html5', [
        'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script',
    ]);
    add_theme_support('menus');
    add_theme_support('elementor');

    // Register nav menus
    register_nav_menus([
        'primary' => __('Primary Navigation', 'envue'),
        'footer'  => __('Footer Links', 'envue'),
    ]);
});

// ── Elementor Support
add_action('elementor/init', function() {});
add_filter('elementor/editor/localize_settings', function($settings) { return $settings; });

// ── Enqueue Scripts & Styles
add_action('wp_enqueue_scripts', function() {
    // Google Fonts
    wp_enqueue_style(
        'envue-google-fonts',
        'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap',
        [],
        null
    );

    // Homepage CSS (front page only)
    if (is_front_page()) {
        wp_enqueue_style(
            'envue-theme',
            get_template_directory_uri() . '/assets/css/theme.css',
            ['envue-google-fonts'],
            '1.0.0'
        );
    } else {
        // Inner pages CSS
        wp_enqueue_style(
            'envue-inner',
            get_template_directory_uri() . '/assets/css/inner.css',
            ['envue-google-fonts'],
            '1.0.0'
        );
    }

    // Main JS (footer, defer)
    wp_enqueue_script(
        'envue-theme-js',
        get_template_directory_uri() . '/assets/js/theme.js',
        [],
        '1.0.0',
        true
    );
    wp_script_add_data('envue-theme-js', 'defer', true);
});

// ── Register Widget Area
add_action('widgets_init', function() {
    register_sidebar([
        'name'          => __('Main Sidebar', 'envue'),
        'id'            => 'main-sidebar',
        'description'   => __('Add widgets here to appear in the sidebar.', 'envue'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2 class="widget-title">',
        'after_title'   => '</h2>',
    ]);
});

// ── Helper: Page Hero
function envue_page_hero($title = '', $subtitle = '', $eyebrow = '', $bg_image = '') {
    $bg_style = '';
    if ($bg_image) {
        $bg_style = ' style="background-image: url(\'' . esc_url($bg_image) . '\');"';
    }
    ?>
    <section class="page-hero">
        <?php if ($bg_image) : ?>
        <div class="page-hero-bg">
            <img src="<?php echo esc_url($bg_image); ?>" alt="<?php echo esc_attr($title); ?>">
        </div>
        <?php else : ?>
        <div class="page-hero-bg">
            <img src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=80&fit=crop" alt="<?php echo esc_attr($title); ?>">
        </div>
        <?php endif; ?>
        <div class="page-hero-scrim"></div>
        <div class="page-hero-grid"></div>
        <div class="page-hero-content fade-up" style="--i:0">
            <?php if ($eyebrow) : ?>
            <div class="eyebrow"><?php echo esc_html($eyebrow); ?></div>
            <?php endif; ?>
            <h1><?php echo esc_html($title); ?></h1>
            <?php if ($subtitle) : ?>
            <p><?php echo esc_html($subtitle); ?></p>
            <?php endif; ?>
        </div>
    </section>
    <?php
}
