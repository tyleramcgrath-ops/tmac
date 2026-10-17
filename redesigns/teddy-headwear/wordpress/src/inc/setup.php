<?php
/**
 * One-click store setup: Appearance → Teddy Setup (or `wp teddy setup`).
 * Creates the 18 products with photos and variations, the Monogram Studio
 * and Campaign pages, and sets the home page. Safe to run again: anything
 * that already exists is left alone.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_menu', function () {
	add_theme_page( __( 'Teddy Setup', 'teddy' ), __( 'Teddy Setup', 'teddy' ), 'manage_options', 'teddy-setup', 'teddy_setup_screen' );
} );

add_action( 'after_switch_theme', function () {
	update_option( 'teddy_show_setup_notice', 1 );
} );

add_action( 'admin_notices', function () {
	if ( ! get_option( 'teddy_show_setup_notice' ) || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$screen = get_current_screen();
	if ( $screen && 'appearance_page_teddy-setup' === $screen->id ) {
		return;
	}
	echo '<div class="notice notice-success"><p><strong>Teddy Midnight is active.</strong> ' .
		'<a href="' . esc_url( admin_url( 'themes.php?page=teddy-setup' ) ) . '">' . esc_html__( 'Run Teddy Setup', 'teddy' ) . '</a> ' .
		esc_html__( 'to load the products, photos and pages.', 'teddy' ) . '</p></div>';
} );

function teddy_setup_screen() {
	$log = null;
	if ( isset( $_POST['teddy_setup'] ) && check_admin_referer( 'teddy_setup' ) ) {
		$log = teddy_run_setup();
	}
	echo '<div class="wrap"><h1>' . esc_html__( 'Teddy Setup', 'teddy' ) . '</h1>';
	if ( ! teddy_has_wc() ) {
		echo '<div class="notice notice-warning inline"><p>' . wp_kses_post( sprintf( __( 'Install and activate <a href="%s">WooCommerce</a> first. The storefront still works without it, but the cart is browser-only.', 'teddy' ), esc_url( admin_url( 'plugin-install.php?s=woocommerce&tab=search&type=term' ) ) ) ) . '</p></div>';
	}
	if ( is_array( $log ) ) {
		echo '<div class="notice notice-success inline"><p><strong>' . esc_html__( 'Done.', 'teddy' ) . '</strong></p><ul style="list-style:disc;margin-left:20px">';
		foreach ( $log as $line ) {
			echo '<li>' . esc_html( $line ) . '</li>';
		}
		echo '</ul><p><a class="button button-primary" href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'View the store', 'teddy' ) . '</a></p></div>';
	}
	echo '<p>' . esc_html__( 'This creates the Teddy catalog in WooCommerce (8 hats with Cream and Brown variations, 8 apparel pieces with sizes, the Bear Hat Pin and Bear Patch), uploads every product and campaign photo, creates the Monogram Studio and Campaign pages, and sets the home page. Products and pages that already exist are skipped, so it is safe to run again.', 'teddy' ) . '</p>';
	echo '<form method="post">';
	wp_nonce_field( 'teddy_setup' );
	submit_button( __( 'Install the Teddy store', 'teddy' ), 'primary', 'teddy_setup', false, teddy_has_wc() ? array() : array( 'disabled' => 'disabled' ) );
	echo '</form></div>';
}

/** Copy a bundled theme image into the media library once and return its attachment ID. */
function teddy_import_image( $key ) {
	$map = get_option( 'teddy_media', array() );
	if ( isset( $map[ $key ] ) && get_post( $map[ $key ] ) ) {
		return (int) $map[ $key ];
	}
	$src = TEDDY_DIR . '/assets/img/' . $key . '.webp';
	if ( ! file_exists( $src ) ) {
		return 0;
	}
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';
	$tmp = wp_tempnam( $key . '.webp' );
	copy( $src, $tmp );
	$id = media_handle_sideload( array( 'name' => 'teddy-' . $key . '.webp', 'tmp_name' => $tmp ), 0, ucwords( str_replace( '-', ' ', $key ) ) );
	if ( is_wp_error( $id ) ) {
		@unlink( $tmp ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
		return 0;
	}
	$map[ $key ] = $id;
	update_option( 'teddy_media', $map, false );
	return (int) $id;
}

function teddy_term_id( $name ) {
	$t = term_exists( $name, 'product_cat' );
	if ( ! $t ) {
		$t = wp_insert_term( $name, 'product_cat' );
	}
	return is_wp_error( $t ) ? 0 : (int) $t['term_id'];
}

function teddy_custom_attribute( $name, $options ) {
	$a = new WC_Product_Attribute();
	$a->set_name( $name );
	$a->set_options( $options );
	$a->set_visible( true );
	$a->set_variation( true );
	return $a;
}

/** Create one catalog product. Returns the product ID, or 0 if it already existed. */
function teddy_create_product( $d, $order ) {
	if ( get_page_by_path( $d['slug'], OBJECT, 'product' ) ) {
		return 0;
	}
	$hat   = 'hat' === $d['kind'];
	$sizes = $hat ? array() : $d['sizes'];
	$p     = ( $hat || $sizes ) ? new WC_Product_Variable() : new WC_Product_Simple();
	$p->set_name( $d['name'] );
	$p->set_slug( $d['slug'] );
	$p->set_status( 'publish' );
	$p->set_menu_order( $order );
	$p->set_short_description( $d['desc'] );
	$p->set_description( $d['desc'] );
	$p->set_category_ids( array_filter( array( teddy_term_id( $d['cat'] ) ) ) );
	if ( $hat ) {
		$cream = teddy_import_image( $d['slug'] . '-cream' );
		$brown = teddy_import_image( $d['slug'] . '-brown' );
		$looks = array_filter( array_map( 'teddy_import_image', teddy_default_looks()[ $d['slug'] ] ?? array() ) );
		$p->set_image_id( in_array( $d['mono'], array( 't', 'ny' ), true ) ? $brown : $cream );
		$p->set_gallery_image_ids( array_values( array_merge( array( in_array( $d['mono'], array( 't', 'ny' ), true ) ? $cream : $brown ), $looks ) ) );
		$p->set_attributes( array( teddy_custom_attribute( 'Color', array( 'Cream', 'Brown' ) ) ) );
		$p->update_meta_data( '_teddy_kind', 'hat' );
		$p->update_meta_data( '_teddy_type', $d['type'] );
		$p->update_meta_data( '_teddy_mono', $d['mono'] );
		$p->update_meta_data( '_teddy_looks', implode( ',', $looks ) );
	} else {
		$imgs = array_filter( array_map( 'teddy_import_image', $d['img'] ) );
		$p->set_image_id( $imgs ? array_shift( $imgs ) : 0 );
		$p->set_gallery_image_ids( array_values( $imgs ) );
		if ( $sizes ) {
			$p->set_attributes( array( teddy_custom_attribute( 'Size', $sizes ) ) );
		} else {
			$p->set_regular_price( (string) $d['price'] );
		}
		$p->update_meta_data( '_teddy_kind', 'apparel' );
		$p->update_meta_data( '_teddy_color_label', $d['color'] );
	}
	$id = $p->save();
	if ( $hat ) {
		foreach ( array( 'Cream' => $cream, 'Brown' => $brown ) as $color => $img ) {
			$v = new WC_Product_Variation();
			$v->set_parent_id( $id );
			$v->set_attributes( array( 'color' => $color ) );
			$v->set_regular_price( (string) $d['price'] );
			$v->set_image_id( $img );
			$v->set_status( 'publish' );
			$v->save();
		}
	} elseif ( $sizes ) {
		foreach ( $sizes as $size ) {
			$v = new WC_Product_Variation();
			$v->set_parent_id( $id );
			$v->set_attributes( array( 'size' => $size ) );
			$v->set_regular_price( (string) $d['price'] );
			$v->set_status( 'publish' );
			$v->save();
		}
	}
	if ( $p->is_type( 'variable' ) ) {
		WC_Product_Variable::sync( $id );
	}
	return $id;
}

/** Create a page if its slug is free. Returns [id, created]. */
function teddy_ensure_page( $slug, $title, $template = '', $content = '' ) {
	$page = get_page_by_path( $slug );
	if ( $page ) {
		return array( (int) $page->ID, false );
	}
	$id = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_name' => $slug, 'post_title' => $title, 'post_content' => $content ) );
	if ( $template ) {
		update_post_meta( $id, '_wp_page_template', $template );
	}
	return array( (int) $id, true );
}

function teddy_run_setup() {
	$log = array();
	if ( ! teddy_has_wc() ) {
		return array( __( 'WooCommerce is not active, so no products were created.', 'teddy' ) );
	}
	if ( function_exists( 'set_time_limit' ) ) {
		set_time_limit( 300 );
	}
	$made = 0;
	foreach ( teddy_default_catalog() as $i => $d ) {
		if ( teddy_create_product( $d, $i ) ) {
			$made++;
		}
	}
	$log[] = sprintf( __( '%d products created (existing ones skipped).', 'teddy' ), $made );

	list( $home, $new ) = teddy_ensure_page( 'home', 'Home' );
	teddy_ensure_page( 'monogram-studio', 'Monogram Studio', 'page-templates/studio.php' );
	teddy_ensure_page( 'campaign', 'Campaign 01', 'page-templates/campaign.php' );
	update_option( 'show_on_front', 'page' );
	update_option( 'page_on_front', $home );
	$log[] = __( 'Pages ready: Home (front page), Monogram Studio, Campaign 01.', 'teddy' );

	if ( class_exists( 'WC_Install' ) ) {
		WC_Install::create_pages();
	}
	// New WooCommerce stores start in "Coming soon" mode, which hides the shop from visitors.
	update_option( 'woocommerce_coming_soon', 'no' );
	$log[] = __( 'WooCommerce Shop, Cart, Checkout and My Account pages are in place.', 'teddy' );

	foreach ( array( 'hero-noir', 'blank-cowboy-cream', 'blank-cowboy-brown', 'blank-fedora-cream', 'blank-fedora-brown' ) as $k ) {
		teddy_import_image( $k );
	}
	delete_transient( 'teddy_catalog' );
	delete_option( 'teddy_show_setup_notice' );
	flush_rewrite_rules();
	$log[] = __( 'Photos uploaded to the Media Library. Edit any product in WooCommerce to change prices, stock or images; the storefront updates automatically.', 'teddy' );
	return $log;
}

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command( 'teddy setup', function () {
		foreach ( teddy_run_setup() as $line ) {
			WP_CLI::log( $line );
		}
		WP_CLI::success( 'Teddy store installed.' );
	} );
}
