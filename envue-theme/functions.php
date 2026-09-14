<?php
/**
 * EnVue Telematics — theme functions.
 *
 * The design system lives in assets/css/envue.css, which is generated from the
 * repository root by tools/build-theme.py. Edit envue.css at the root, then
 * rebuild — do not hand-edit the copy in this theme.
 */

// ── Theme setup ──────────────────────────────────────────────────────
add_action( 'after_setup_theme', function () {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'custom-logo', [
        'height'      => 58,
        'width'       => 200,
        'flex-height' => true,
        'flex-width'  => true,
    ] );
    add_theme_support( 'html5', [
        'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script',
    ] );
    add_theme_support( 'menus' );
    add_theme_support( 'elementor' );
    add_theme_support( 'align-wide' );

    register_nav_menus( [
        'primary' => __( 'Primary Navigation', 'envue' ),
        'footer'  => __( 'Footer Links', 'envue' ),
    ] );
} );

// ── Elementor ────────────────────────────────────────────────────────
add_action( 'elementor/init', function () {} );
add_filter( 'elementor/editor/localize_settings', function ( $settings ) { return $settings; } );

// ── Assets ───────────────────────────────────────────────────────────
add_action( 'wp_enqueue_scripts', function () {
    $dir = get_template_directory_uri();
    $ver = wp_get_theme()->get( 'Version' );

    wp_enqueue_style(
        'envue-fonts',
        'https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap',
        [],
        null
    );

    wp_enqueue_style( 'envue', $dir . '/assets/css/envue.css', [ 'envue-fonts' ], $ver );

    wp_enqueue_script( 'envue', $dir . '/assets/js/envue.js', [], $ver, true );
} );

add_filter( 'script_loader_tag', function ( $tag, $handle ) {
    return 'envue' === $handle ? str_replace( ' src=', ' defer src=', $tag ) : $tag;
}, 10, 2 );

// Preconnect to the font hosts.
add_filter( 'wp_resource_hints', function ( $hints, $relation ) {
    if ( 'preconnect' === $relation ) {
        $hints[] = [ 'href' => 'https://fonts.googleapis.com' ];
        $hints[] = [ 'href' => 'https://fonts.gstatic.com', 'crossorigin' => 'anonymous' ];
    }
    return $hints;
}, 10, 2 );

// ── Widgets ──────────────────────────────────────────────────────────
add_action( 'widgets_init', function () {
    register_sidebar( [
        'name'          => __( 'Main Sidebar', 'envue' ),
        'id'            => 'main-sidebar',
        'description'   => __( 'Add widgets here to appear in the sidebar.', 'envue' ),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2 class="widget-title">',
        'after_title'   => '</h2>',
    ] );
} );

/**
 * Brand mark. Uses the WordPress custom logo when one is set, otherwise the
 * hosted EnVue wordmark so a fresh install still looks right.
 *
 * @param bool $footer Render the footer variant (lazy-loaded).
 */
function envue_brand_image( $footer = false ) {
    $custom = get_theme_mod( 'custom_logo' );

    if ( $custom ) {
        echo wp_get_attachment_image(
            $custom,
            'full',
            false,
            [
                'alt'     => esc_attr( get_bloginfo( 'name' ) ),
                'loading' => $footer ? 'lazy' : 'eager',
            ]
        );
        return;
    }

    printf(
        '<img src="%s" alt="%s" width="200" height="58"%s>',
        esc_url( 'https://eliteextra.com/wp-content/uploads/2023/06/EnVue2011-500x188-1-66904380e836a6105bae0e94a376d8ad.png' ),
        esc_attr__( 'EnVue Telematics', 'envue' ),
        $footer ? ' loading="lazy"' : ''
    );
}

/**
 * Inner-page hero.
 *
 * @param string $title    Page title.
 * @param string $subtitle Supporting sentence.
 * @param string $eyebrow  Small label above the title.
 * @param string $bg_image Background photograph.
 * @param array  $crumbs   Breadcrumb trail as label => url (url may be '').
 */
function envue_page_hero( $title = '', $subtitle = '', $eyebrow = '', $bg_image = '', $crumbs = [] ) {
    $bg_image = $bg_image ?: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=2000&q=80';
    ?>
    <section class="page-hero">
        <img class="page-hero-bg" src="<?php echo esc_url( $bg_image ); ?>" alt="" loading="eager" fetchpriority="high">
        <div class="wrap">
            <?php if ( $crumbs ) : ?>
            <nav class="breadcrumb" aria-label="<?php esc_attr_e( 'Breadcrumb', 'envue' ); ?>">
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'envue' ); ?></a>
                <?php foreach ( $crumbs as $label => $url ) : ?>
                    /
                    <?php if ( $url ) : ?>
                        <a href="<?php echo esc_url( $url ); ?>"><?php echo esc_html( $label ); ?></a>
                    <?php else : ?>
                        <?php echo esc_html( $label ); ?>
                    <?php endif; ?>
                <?php endforeach; ?>
            </nav>
            <?php endif; ?>

            <?php if ( $eyebrow ) : ?>
                <span class="eyebrow eyebrow--light"><?php echo esc_html( $eyebrow ); ?></span>
            <?php endif; ?>

            <h1><?php echo esc_html( $title ); ?></h1>

            <?php if ( $subtitle ) : ?>
                <p><?php echo esc_html( $subtitle ); ?></p>
            <?php endif; ?>

            <div class="hero-actions">
                <a class="button button-primary button-lg" href="<?php echo esc_url( home_url( '/company/#contact' ) ); ?>">
                    <?php esc_html_e( 'Get a Demo', 'envue' ); ?> <span>&rarr;</span>
                </a>
                <a class="button button-ghost button-lg" href="tel:8002011169"><?php esc_html_e( 'Call (800) 201-1169', 'envue' ); ?></a>
            </div>
        </div>
    </section>
    <?php
}

/**
 * Closing call to action, shared by the inner-page templates.
 */
function envue_final_cta( $heading = '', $copy = '' ) {
    $heading = $heading ?: __( 'A more visible fleet starts with one conversation.', 'envue' );
    $copy    = $copy ?: __( 'Talk to an EnVue specialist about tracking, cameras, assets and deployment for your operation.', 'envue' );
    ?>
    <section class="final-cta">
        <div class="wrap final-grid">
            <div>
                <span class="eyebrow eyebrow--light"><?php esc_html_e( 'Next route', 'envue' ); ?></span>
                <h2><?php echo esc_html( $heading ); ?></h2>
            </div>
            <div>
                <p><?php echo esc_html( $copy ); ?></p>
                <div class="hero-actions">
                    <a class="button button-primary button-lg" href="<?php echo esc_url( home_url( '/company/#contact' ) ); ?>">
                        <?php esc_html_e( 'Talk to a specialist', 'envue' ); ?> <span>&rarr;</span>
                    </a>
                    <a class="button button-ghost button-lg" href="tel:8002011169"><?php esc_html_e( 'Call (800) 201-1169', 'envue' ); ?></a>
                </div>
            </div>
        </div>
    </section>
    <?php
}
