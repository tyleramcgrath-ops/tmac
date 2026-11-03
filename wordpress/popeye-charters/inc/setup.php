<?php
/**
 * Theme setup, assets, menus.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

add_action( 'after_setup_theme', 'popeye_setup' );
/**
 * Register theme supports and menus.
 */
function popeye_setup() {
	load_theme_textdomain( 'popeye-charters', POPEYE_DIR . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'editor-styles' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 120,
			'width'       => 240,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);
	add_editor_style( 'assets/css/editor.css' );

	add_image_size( 'popeye-card', 800, 1000, true );
	add_image_size( 'popeye-wide', 1200, 750, true );

	register_nav_menus(
		array(
			'primary' => __( 'Primary Menu', 'popeye-charters' ),
			'footer'  => __( 'Footer Menu', 'popeye-charters' ),
		)
	);

	if ( ! isset( $GLOBALS['content_width'] ) ) {
		$GLOBALS['content_width'] = 760;
	}
}

add_action( 'wp_enqueue_scripts', 'popeye_assets' );
/**
 * Front-end styles and scripts.
 */
function popeye_assets() {
	wp_enqueue_style(
		'popeye-fonts',
		'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'popeye-main', get_theme_file_uri( 'assets/css/main.css' ), array( 'popeye-fonts' ), POPEYE_VERSION );
	wp_enqueue_script( 'popeye-main', get_theme_file_uri( 'assets/js/main.js' ), array(), POPEYE_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}

add_action( 'wp_head', 'popeye_preconnect', 1 );
/**
 * Preconnect to Google Fonts.
 */
function popeye_preconnect() {
	echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
	echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
}

add_action( 'wp_head', 'popeye_favicon_fallback', 2 );
/**
 * Bundled favicon when no Site Icon is set.
 */
function popeye_favicon_fallback() {
	if ( ! has_site_icon() ) {
		echo '<link rel="icon" type="image/png" href="' . esc_url( popeye_img( 'favicon.png' ) ) . '">' . "\n";
	}
}

add_action( 'wp_head', 'popeye_analytics', 20 );
/**
 * Google Analytics 4, when a Measurement ID is set in the Customizer.
 */
function popeye_analytics() {
	$id = preg_replace( '/[^A-Z0-9-]/', '', strtoupper( (string) popeye_opt( 'ga_id' ) ) );
	if ( ! $id || is_user_logged_in() && current_user_can( 'edit_posts' ) ) {
		return;
	}
	?>
<script async src="https://www.googletagmanager.com/gtag/js?id=<?php echo esc_attr( $id ); ?>"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','<?php echo esc_js( $id ); ?>');</script>
	<?php
}

add_filter( 'excerpt_length', fn() => 28 );
add_filter( 'excerpt_more', fn() => '…' );

add_filter( 'body_class', 'popeye_body_class' );
/**
 * Mark pages whose first section is a dark full-bleed hero (header sits on top of it).
 *
 * @param string[] $classes Classes.
 * @return string[]
 */
function popeye_body_class( $classes ) {
	if ( popeye_opt( 'sticky_bar' ) ) {
		$classes[] = 'has-sticky-bar';
	}
	return $classes;
}

/**
 * Fallback primary navigation used until a menu is assigned.
 */
function popeye_fallback_menu() {
	$experiences = get_posts(
		array(
			'post_type'      => 'experience',
			'posts_per_page' => 20,
			'orderby'        => 'menu_order title',
			'order'          => 'ASC',
		)
	);
	$items = array(
		array( home_url( '/' ), __( 'Home', 'popeye-charters' ) ),
		array( popeye_story_url(), __( 'Our Story', 'popeye-charters' ) ),
		array( popeye_experiences_url(), __( 'Experiences', 'popeye-charters' ), $experiences ),
		array( popeye_elite_url(), __( 'Elite Cruises', 'popeye-charters' ), null, 'menu-item-elite' ),
		array( popeye_blog_url(), __( 'Blog', 'popeye-charters' ) ),
		array( popeye_gallery_url(), __( 'Gallery', 'popeye-charters' ) ),
		array( popeye_contact_url(), __( 'Contact', 'popeye-charters' ) ),
	);
	$current = home_url( add_query_arg( array() ) );
	echo '<ul id="primary-menu" class="menu">';
	foreach ( $items as $item ) {
		$classes = array( 'menu-item' );
		if ( ! empty( $item[3] ) ) {
			$classes[] = $item[3];
		}
		if ( untrailingslashit( $item[0] ) === untrailingslashit( $current ) ) {
			$classes[] = 'current-menu-item';
		}
		if ( ! empty( $item[2] ) ) {
			$classes[] = 'menu-item-has-children';
		}
		echo '<li class="' . esc_attr( implode( ' ', $classes ) ) . '"><a href="' . esc_url( $item[0] ) . '">' . esc_html( $item[1] ) . '</a>';
		if ( ! empty( $item[2] ) ) {
			echo '<button class="submenu-toggle" aria-expanded="false" aria-label="' . esc_attr__( 'Show submenu', 'popeye-charters' ) . '">' . popeye_icon( 'chev' ) . '</button>'; // phpcs:ignore WordPress.Security.EscapeOutput
			echo '<ul class="sub-menu"><li class="menu-item"><a href="' . esc_url( $item[0] ) . '">' . esc_html__( 'All Experiences', 'popeye-charters' ) . '</a></li>';
			foreach ( $item[2] as $exp ) {
				echo '<li class="menu-item"><a href="' . esc_url( get_permalink( $exp ) ) . '">' . esc_html( get_the_title( $exp ) ) . '</a></li>';
			}
			echo '</ul>';
		}
		echo '</li>';
	}
	echo '</ul>';
}

add_filter( 'nav_menu_item_args', 'popeye_submenu_toggle', 10, 3 );
/**
 * Add a dropdown toggle button after parent menu items in the primary menu.
 *
 * @param stdClass $args      Menu args.
 * @param WP_Post  $menu_item Item.
 * @param int      $depth     Depth.
 * @return stdClass
 */
function popeye_submenu_toggle( $args, $menu_item, $depth ) {
	if ( 'primary' === $args->theme_location ) {
		$args->after = in_array( 'menu-item-has-children', (array) $menu_item->classes, true )
			? '<button class="submenu-toggle" aria-expanded="false" aria-label="' . esc_attr__( 'Show submenu', 'popeye-charters' ) . '">' . popeye_icon( 'chev' ) . '</button>'
			: '';
	}
	return $args;
}

add_action( 'widgets_init', 'popeye_widgets' );
/**
 * Blog sidebar.
 */
function popeye_widgets() {
	register_sidebar(
		array(
			'name'          => __( 'Blog Sidebar', 'popeye-charters' ),
			'id'            => 'blog-sidebar',
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h3 class="widget-title">',
			'after_title'   => '</h3>',
		)
	);
}

add_action( 'pre_get_posts', 'popeye_blog_per_page' );
/**
 * Blog listings in rows of three.
 *
 * @param WP_Query $q Query.
 */
function popeye_blog_per_page( $q ) {
	if ( ! is_admin() && $q->is_main_query() && ( $q->is_home() || $q->is_category() || $q->is_tag() ) ) {
		$q->set( 'posts_per_page', 12 );
	}
}
