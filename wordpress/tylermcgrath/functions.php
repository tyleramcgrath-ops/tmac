<?php
/**
 * Tyler McGrath — North Star theme.
 *
 * @package tylermcgrath
 */

defined( 'ABSPATH' ) || exit;

define( 'TM_VERSION', '1.0.0' );
define( 'TM_DIR', get_template_directory() );
define( 'TM_URI', get_template_directory_uri() );

require TM_DIR . '/inc/template-tags.php';
require TM_DIR . '/inc/projects.php';
require TM_DIR . '/inc/customizer.php';
require TM_DIR . '/inc/contact.php';

/**
 * Theme supports and menus.
 */
function tm_setup() {
	load_theme_textdomain( 'tylermcgrath', TM_DIR . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 80,
			'width'       => 80,
			'flex-width'  => true,
			'flex-height' => true,
		)
	);
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/editor.css' );

	add_image_size( 'tm-card', 960, 640, true );
	add_image_size( 'tm-wide', 1920, 1080, true );

	register_nav_menus(
		array(
			'primary' => __( 'Primary menu', 'tylermcgrath' ),
			'social'  => __( 'Social links', 'tylermcgrath' ),
		)
	);
}
add_action( 'after_setup_theme', 'tm_setup' );

/**
 * Fonts, styles and scripts.
 */
function tm_assets() {
	wp_enqueue_style(
		'tm-fonts',
		'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..800;1,6..96,400..700&family=Inter:wght@300..700&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'tm-theme', TM_URI . '/assets/css/theme.css', array( 'tm-fonts' ), TM_VERSION );

	wp_enqueue_script( 'tm-main', TM_URI . '/assets/js/main.js', array(), TM_VERSION, true );
	wp_localize_script(
		'tm-main',
		'TM',
		array(
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'compass' => TM_URI . '/assets/js/compass.js?ver=' . TM_VERSION,
			'isHome'  => is_front_page(),
			'i18n'    => array(
				'sending' => __( 'Plotting the course…', 'tylermcgrath' ),
				'sent'    => __( 'Message received. I will be in touch soon.', 'tylermcgrath' ),
				'error'   => __( 'Something went wrong. Please email me directly.', 'tylermcgrath' ),
			),
		)
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'tm_assets' );

/**
 * Preconnect to Google Fonts.
 *
 * @param array  $urls          URLs to print for resource hints.
 * @param string $relation_type The relation type the URLs are printed.
 * @return array
 */
function tm_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = 'https://fonts.googleapis.com';
		$urls[] = array(
			'href' => 'https://fonts.gstatic.com',
			'crossorigin',
		);
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'tm_resource_hints', 10, 2 );

/**
 * Pick the starting sky before first paint so there is no flash of the wrong hour.
 */
function tm_time_bootstrap() {
	?>
	<script>(function(){var d=document.documentElement;d.classList.add('js');try{var h=new Date().getHours(),t=h>=5&&h<8?'dawn':h>=8&&h<17?'day':h>=17&&h<20?'dusk':'night',s=localStorage.getItem('tm-time');d.setAttribute('data-time',s&&s!=='auto'?s:t);if(sessionStorage.getItem('tm-entered'))d.classList.add('tm-entered');}catch(e){d.setAttribute('data-time','night');d.classList.add('tm-entered');}})();</script>
	<?php
}
add_action( 'wp_head', 'tm_time_bootstrap', 1 );

/**
 * Body classes.
 *
 * @param array $classes Body classes.
 * @return array
 */
function tm_body_classes( $classes ) {
	if ( is_front_page() ) {
		$classes[] = 'tm-home';
	}
	return $classes;
}
add_filter( 'body_class', 'tm_body_classes' );

/**
 * Shorter excerpts with a quiet ellipsis.
 */
add_filter(
	'excerpt_length',
	function () {
		return 26;
	}
);
add_filter(
	'excerpt_more',
	function () {
		return '…';
	}
);
