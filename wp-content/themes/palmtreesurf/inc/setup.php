<?php
/**
 * Theme setup: supports, menus, image sizes.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register theme features with WordPress.
 */
function pts_setup() {
	load_theme_textdomain( 'palmtreesurf', PTS_DIR . 'languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'editor-styles' );
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'customize-selective-refresh-widgets' );

	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
	);

	add_theme_support(
		'custom-logo',
		array(
			'height'      => 96,
			'width'       => 320,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);

	register_nav_menus(
		array(
			'primary' => __( 'Primary Menu', 'palmtreesurf' ),
			'footer'  => __( 'Footer Menu', 'palmtreesurf' ),
			'legal'   => __( 'Legal Menu', 'palmtreesurf' ),
		)
	);

	// Wide hero crop for the front page and package headers.
	add_image_size( 'pts-hero', 2000, 1100, true );
	// 3:2 card used by package grids and the blog index.
	add_image_size( 'pts-card', 800, 533, true );
}
add_action( 'after_setup_theme', 'pts_setup' );

/**
 * Set the content width used by oEmbeds and wide images.
 */
function pts_content_width() {
	$GLOBALS['content_width'] = apply_filters( 'pts_content_width', 760 );
}
add_action( 'after_setup_theme', 'pts_content_width', 0 );

/**
 * Register the widget areas used by the footer and the blog sidebar.
 */
function pts_widgets_init() {
	register_sidebar(
		array(
			'name'          => __( 'Blog Sidebar', 'palmtreesurf' ),
			'id'            => 'sidebar-1',
			'description'   => __( 'Shown beside posts and archives.', 'palmtreesurf' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget__title">',
			'after_title'   => '</h2>',
		)
	);

	register_sidebar(
		array(
			'name'          => __( 'Footer', 'palmtreesurf' ),
			'id'            => 'footer-1',
			'description'   => __( 'Shown in the footer, beside the contact details.', 'palmtreesurf' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget__title">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', 'pts_widgets_init' );
