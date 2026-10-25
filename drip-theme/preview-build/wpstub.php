<?php
// A minimal WordPress + WooCommerce stand-in so the theme's own templates
// render to static HTML for the Vercel preview, using the live store's
// products (products.json, exported from the WooCommerce Store API).
// Usage: php wpstub.php <theme dir> <route>
//   route: '' | 404 | shop | product-category/<slug> | product/<slug> | <page slug>
define( 'ABSPATH', __DIR__ );
$THEME = $argv[1];
$ROUTE = $argv[2];
$GLOBALS['styles'] = array(); $GLOBALS['scripts'] = array(); $GLOBALS['hooks'] = array();

// ---- Data -----------------------------------------------------------------
class WooCommerce {}
define( 'OBJECT', 'OBJECT' );
$RAW = json_decode( file_get_contents( __DIR__ . '/products.json' ), true );
$GLOBALS['ATT'] = array(); $GLOBALS['PRODUCTS'] = array(); $GLOBALS['TERMS'] = array();
foreach ( $RAW as $p ) {
	$ids = array();
	foreach ( $p['images'] as $i => $img ) {
		$aid = $p['id'] * 10 + $i;
		$GLOBALS['ATT'][ $aid ] = $img;
		$ids[] = $aid;
	}
	$p['_img'] = $ids;
	$GLOBALS['PRODUCTS'][ $p['id'] ] = $p;
	foreach ( $p['categories'] as $c ) {
		if ( ! isset( $GLOBALS['TERMS'][ $c['slug'] ] ) ) {
			$GLOBALS['TERMS'][ $c['slug'] ] = (object) array( 'term_id' => $c['id'], 'name' => $c['name'], 'slug' => $c['slug'], 'count' => 0, 'description' => '', 'taxonomy' => 'product_cat' );
		}
		$GLOBALS['TERMS'][ $c['slug'] ]->count++;
	}
}
function stub_money( $cents ) { return '<span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">$</span>' . number_format( $cents / 100, 2 ) . '</bdi></span>'; }
function stub_text( $html ) { return trim( html_entity_decode( strip_tags( $html ), ENT_QUOTES, 'UTF-8' ) ); }

class Stub_Product {
	public $d;
	function __construct( $d ) { $this->d = $d; }
	function get_id() { return $this->d['id']; }
	function get_name() { return html_entity_decode( $this->d['name'], ENT_QUOTES, 'UTF-8' ); }
	function get_permalink() { return '/product/' . $this->d['slug'] . '/'; }
	function get_price() { return $this->d['is_purchasable'] ? (string) ( $this->d['prices']['price'] / 100 ) : ( '0' === $this->d['prices']['price'] ? '0' : '' ); }
	function get_regular_price() { return (string) ( $this->d['prices']['regular_price'] / 100 ); }
	function is_on_sale() { return (bool) $this->d['on_sale']; }
	function is_purchasable() { return (bool) $this->d['is_purchasable']; }
	function is_in_stock() { return (bool) $this->d['is_in_stock']; }
	function is_visible() { return true; }
	function is_type( $t ) { return $t === $this->d['type']; }
	function get_sku() { return $this->d['sku']; }
	function has_attributes() { return ! empty( $this->d['attributes'] ); }
	function get_image_id() { return $this->d['_img'] ? $this->d['_img'][0] : 0; }
	function get_gallery_image_ids() { return array_slice( $this->d['_img'], 1 ); }
	function get_short_description() { $t = stub_text( $this->d['short_description'] ); return $t ? '<p>' . htmlspecialchars( $t ) . '</p>' : ''; }
	function get_description() { $t = stub_text( $this->d['description'] ); return $t ? '<p>' . htmlspecialchars( $t ) . '</p>' : ''; }
	function add_to_cart_url() { return '?add-to-cart=' . $this->d['id']; }
	function get_price_html() {
		$pr = $this->d['prices'];
		if ( $this->d['on_sale'] ) {
			return '<del aria-hidden="true">' . stub_money( $pr['regular_price'] ) . '</del> <span class="screen-reader-text">Original price was: $' . number_format( $pr['regular_price'] / 100, 2 ) . '.</span><ins aria-hidden="true">' . stub_money( $pr['price'] ) . '</ins><span class="screen-reader-text">Current price is: $' . number_format( $pr['price'] / 100, 2 ) . '.</span>';
		}
		return stub_money( $pr['price'] );
	}
}

// ---- Routing state --------------------------------------------------------
$GLOBALS['CAT'] = null; $GLOBALS['PID'] = null; $GLOBALS['PAGE'] = null; $GLOBALS['KIND'] = 'home';
if ( '' === $ROUTE ) { $GLOBALS['KIND'] = 'home'; }
elseif ( '404' === $ROUTE ) { $GLOBALS['KIND'] = '404'; }
elseif ( 'shop' === $ROUTE ) { $GLOBALS['KIND'] = 'shop'; }
elseif ( 0 === strpos( $ROUTE, 'product-category/' ) ) { $GLOBALS['KIND'] = 'shop'; $GLOBALS['CAT'] = $GLOBALS['TERMS'][ substr( $ROUTE, 17 ) ]; }
elseif ( 0 === strpos( $ROUTE, 'product/' ) ) {
	$GLOBALS['KIND'] = 'product';
	foreach ( $GLOBALS['PRODUCTS'] as $p ) { if ( 'product/' . $p['slug'] === $ROUTE ) { $GLOBALS['PID'] = $p['id']; } }
}
else { $GLOBALS['KIND'] = 'page'; $GLOBALS['PAGE'] = $ROUTE; }

$GLOBALS['LOOP'] = array();
if ( 'shop' === $GLOBALS['KIND'] ) {
	foreach ( $GLOBALS['PRODUCTS'] as $p ) {
		if ( ! $GLOBALS['CAT'] || in_array( $GLOBALS['CAT']->slug, array_column( $p['categories'], 'slug' ), true ) ) { $GLOBALS['LOOP'][] = $p['id']; }
	}
} elseif ( 'product' === $GLOBALS['KIND'] ) { $GLOBALS['LOOP'] = array( $GLOBALS['PID'] ); }
else { $GLOBALS['LOOP'] = array( 7 ); }
$GLOBALS['CUR'] = null;

// ---- WordPress --------------------------------------------------------------
function add_action( $h, $cb, $p = 10 ) { $GLOBALS['hooks'][ $h ][ $p ][] = $cb; }
function add_filter( $h, $cb, $p = 10 ) { $GLOBALS['hooks'][ 'f:' . $h ][ $p ][] = $cb; }
function remove_action() {}
function do_action( $h ) { if ( empty( $GLOBALS['hooks'][ $h ] ) ) return; ksort( $GLOBALS['hooks'][ $h ] ); foreach ( $GLOBALS['hooks'][ $h ] as $cbs ) foreach ( $cbs as $cb ) $cb(); }
function apply_filters( $h, $v ) { return $v; }
function add_theme_support() {} function register_nav_menus() {}
function get_template_directory() { return $GLOBALS['THEME']; }
function get_template_directory_uri() { return ''; }
function wp_enqueue_style( $h, $src ) { $GLOBALS['styles'][] = $src; }
function wp_enqueue_script( $h, $src ) { $GLOBALS['scripts'][] = $src; }
function language_attributes() { echo 'lang="en-US"'; }
function bloginfo( $k ) { echo 'UTF-8'; }
function stub_title() {
	switch ( $GLOBALS['KIND'] ) {
		case 'home': return 'DRIP — Born from salt water';
		case '404': return 'Page not found — DRIP';
		case 'shop': return ( $GLOBALS['CAT'] ? $GLOBALS['CAT']->name : 'Shop' ) . ' — DRIP';
		case 'product': return wc_get_product( $GLOBALS['PID'] )->get_name() . ' — DRIP';
		default: return stub_page_title() . ' — DRIP';
	}
}
function stub_page_title() { $t = array( 'about' => 'About', 'contact' => 'Contact', 'cart' => 'Cart' ); return isset( $t[ $GLOBALS['PAGE'] ] ) ? $t[ $GLOBALS['PAGE'] ] : ucwords( str_replace( '-', ' ', $GLOBALS['PAGE'] ) ); }
function wp_head() {
	do_action( 'wp_enqueue_scripts' ); do_action( 'wp_head' );
	echo '<title>' . htmlspecialchars( stub_title() ) . "</title>\n<meta name=\"robots\" content=\"noindex, nofollow\">\n";
	foreach ( $GLOBALS['styles'] as $s ) echo '<link rel="stylesheet" href="' . htmlspecialchars( $s ) . "\">\n";
}
function wp_footer() { foreach ( $GLOBALS['scripts'] as $s ) echo '<script src="' . $s . "\"></script>\n"; echo "<script src=\"/assets/js/preview.js\"></script>\n"; }
function body_class() { $k = $GLOBALS['KIND']; echo 'class="' . ( 'home' === $k ? 'home' : $k ) . ( in_array( $k, array( 'shop', 'product' ), true ) ? ' woocommerce' : '' ) . ( 'cart' === $GLOBALS['PAGE'] ? ' woocommerce-cart woocommerce-page' : '' ) . '"'; }
function wp_body_open() {}
function is_front_page() { return 'home' === $GLOBALS['KIND']; }
function is_page() { return 'page' === $GLOBALS['KIND']; }
function is_home() { return false; } function is_search() { return false; } function is_archive() { return false; }
function get_queried_object() { return $GLOBALS['CAT']; }
function get_queried_object_id() { return 7; }
function get_the_ID() { return $GLOBALS['CUR']; }
function the_ID() { echo $GLOBALS['CUR']; }
function get_post_field( $f ) { return $GLOBALS['PAGE']; }
function get_post_meta() { return ''; }
function get_option( $k ) { return 'admin_email' === $k ? 'admin@example.com' : 0; }
function home_url( $p = '/' ) { $p = trim( $p, '/' ); return $p ? '/' . $p . '/' : '/'; }
function admin_url( $p = '' ) { return '#'; }
function esc_url( $u ) { return htmlspecialchars( $u, ENT_QUOTES ); }
function esc_html( $s ) { return htmlspecialchars( $s, ENT_QUOTES ); }
function esc_attr( $s ) { return htmlspecialchars( $s, ENT_QUOTES ); }
function wp_kses_post( $s ) { return $s; }
function wpautop( $s ) { return $s; }
function wp_strip_all_tags( $s ) { return trim( strip_tags( $s ) ); }
function add_query_arg( $k, $v, $url ) { return $url . ( false === strpos( $url, '?' ) ? '?' : '&' ) . $k . '=' . $v; }
function wp_referer_field() { return '<input type="hidden" name="_wp_http_referer" value="/">'; }
function has_custom_logo() { return false; } function get_theme_mod() { return 0; }
function has_nav_menu() { return false; }
function is_wp_error( $x ) { return false; }
function wp_list_pluck( $list, $field ) { return array_map( function ( $o ) use ( $field ) { return is_object( $o ) ? $o->$field : $o[ $field ]; }, $list ); }
function get_header() { include $GLOBALS['THEME'] . '/header.php'; }
function get_footer() { include $GLOBALS['THEME'] . '/footer.php'; }
function get_template_part( $slug, $name = null ) { include $GLOBALS['THEME'] . '/' . $slug . ( $name ? '-' . $name : '' ) . '.php'; }
function have_posts() { return count( $GLOBALS['LOOP'] ) > 0; }
function the_post() { $GLOBALS['CUR'] = array_shift( $GLOBALS['LOOP'] ); }
function the_title() { echo htmlspecialchars( stub_page_title() ); }
function the_content() {
	if ( 'cart' === $GLOBALS['PAGE'] ) {
		echo '<div class="bag-empty">' . drip_drop( 'empty-drop' ) . '<h2>Your bag is empty.</h2><p>Nothing in here yet. The drop is one click away.</p><a class="btn btn-ink" href="/shop/">Shop the drop</a></div>';
	}
}
function post_class( $c = '' ) { echo 'class="' . $c . '"'; }
function get_the_terms( $id, $tax ) {
	$p = $GLOBALS['PRODUCTS'][ $id ];
	if ( ! $p['categories'] ) return false;
	return array_map( function ( $c ) { return $GLOBALS['TERMS'][ $c['slug'] ]; }, $p['categories'] );
}
function get_terms( $args ) { $t = array_values( $GLOBALS['TERMS'] ); usort( $t, function ( $a, $b ) { return $b->count - $a->count; } ); return $t; }
function get_term_link( $term ) { return '/product-category/' . $term->slug . '/'; }
function get_page_by_path( $slug ) { foreach ( $GLOBALS['PRODUCTS'] as $p ) { if ( $p['slug'] === $slug ) return (object) array( 'ID' => $p['id'] ); } return null; }
function wp_get_attachment_image_url( $id ) { return $GLOBALS['ATT'][ $id ]['src']; }
function wp_get_attachment_image( $id, $size, $icon = false, $attr = array() ) {
	$img = $GLOBALS['ATT'][ $id ];
	$src = 'woocommerce_gallery_thumbnail' === $size ? $img['thumbnail'] : $img['src'];
	$out = '<img src="' . esc_url( $src ) . '"';
	if ( 'woocommerce_gallery_thumbnail' !== $size && ! empty( $img['srcset'] ) ) {
		$out .= ' srcset="' . esc_attr( $img['srcset'] ) . '" sizes="' . esc_attr( isset( $attr['sizes'] ) ? $attr['sizes'] : '100vw' ) . '"';
	}
	foreach ( array( 'class', 'alt', 'loading' ) as $k ) { if ( isset( $attr[ $k ] ) ) $out .= ' ' . $k . '="' . esc_attr( $attr[ $k ] ) . '"'; }
	if ( ! isset( $attr['alt'] ) ) $out .= ' alt=""';
	return $out . ' decoding="async" width="1024" height="1024">';
}

// ---- WooCommerce ------------------------------------------------------------
function WC() { return (object) array( 'cart' => null ); }
function wc_get_product( $id ) { return isset( $GLOBALS['PRODUCTS'][ $id ] ) ? new Stub_Product( $GLOBALS['PRODUCTS'][ $id ] ) : null; }
function wc_get_products( $args ) { return array_map( function ( $p ) { return new Stub_Product( $p ); }, array_values( $GLOBALS['PRODUCTS'] ) ); }
function wc_get_page_permalink( $page ) { $m = array( 'shop' => '/shop/', 'cart' => '/cart/', 'checkout' => '/cart/', 'myaccount' => '/cart/' ); return $m[ $page ]; }
function wc_placeholder_img() { return '<div class="card-img"></div>'; }
function is_cart() { return 'cart' === $GLOBALS['PAGE']; }
function is_checkout() { return false; } function is_account_page() { return false; }
function is_product_category() { return (bool) $GLOBALS['CAT']; }
function wc_product_class( $c ) { echo 'class="' . $c . ' product"'; }
function woocommerce_breadcrumb() {
	$c = array( '<a href="/">Home</a>' );
	if ( 'product' === $GLOBALS['KIND'] ) { $c[] = '<a href="/shop/">Shop</a>'; $c[] = esc_html( drip_split_name( wc_get_product( $GLOBALS['PID'] )->get_name() )['title'] ); }
	elseif ( $GLOBALS['CAT'] ) { $c[] = '<a href="/shop/">Shop</a>'; $c[] = esc_html( $GLOBALS['CAT']->name ); }
	else { $c[] = 'Shop'; }
	echo '<nav class="crumbs" aria-label="Breadcrumb">' . implode( '<span class="crumb-sep" aria-hidden="true">/</span>', $c ) . '</nav>';
}
function woocommerce_page_title() { echo esc_html( $GLOBALS['CAT'] ? $GLOBALS['CAT']->name : 'Shop' ); }
function woocommerce_catalog_ordering() { echo '<form class="woocommerce-ordering" method="get" action="#"><select name="orderby" class="orderby" aria-label="Shop order"><option>Default sorting</option><option>Sort by latest</option><option>Price: low to high</option><option>Price: high to low</option></select></form>'; }
function woocommerce_output_all_notices() {}
function woocommerce_product_loop() { return count( $GLOBALS['LOOP'] ) > 0; }
function woocommerce_result_count() { $n = count( $GLOBALS['LOOP'] ); echo '<p class="woocommerce-result-count">Showing all ' . $n . ' results</p>'; }
function woocommerce_pagination() {}
function wc_display_product_attributes() {}
function woocommerce_template_single_add_to_cart() {
	$p = wc_get_product( $GLOBALS['PID'] );
	if ( ! $p->is_purchasable() ) return;
	echo '<form class="cart" action="#" method="post"><div class="quantity"><label class="screen-reader-text" for="qty">Quantity</label><input type="number" id="qty" class="input-text qty text" name="quantity" value="1" min="1" step="1" inputmode="numeric" autocomplete="off"></div><button type="submit" name="add-to-cart" value="' . $p->get_id() . '" class="single_add_to_cart_button button alt">Add to bag</button></form>';
}
function wc_get_related_products( $id, $n ) {
	$me = $GLOBALS['PRODUCTS'][ $id ]; $cats = array_column( $me['categories'], 'slug' ); $out = array();
	foreach ( $GLOBALS['PRODUCTS'] as $p ) {
		if ( $p['id'] === $id || ! $p['is_purchasable'] ) continue;
		if ( ! $cats || array_intersect( $cats, array_column( $p['categories'], 'slug' ) ) ) $out[] = $p['id'];
	}
	if ( count( $out ) < $n ) { foreach ( $GLOBALS['PRODUCTS'] as $p ) { if ( $p['id'] !== $id && $p['is_purchasable'] && ! in_array( $p['id'], $out, true ) ) $out[] = $p['id']; } }
	return array_slice( $out, ( $id % 3 ), $n );
}

// ---- Render ---------------------------------------------------------------
require $THEME . '/functions.php';
$T = $THEME;
switch ( $GLOBALS['KIND'] ) {
	case 'home': include $T . '/front-page.php'; break;
	case '404': include $T . '/404.php'; break;
	case 'shop': include $T . '/woocommerce/archive-product.php'; break;
	case 'product': include $T . '/woocommerce/single-product.php'; break;
	default: $GLOBALS['CUR'] = 7; include $T . '/page.php';
}
