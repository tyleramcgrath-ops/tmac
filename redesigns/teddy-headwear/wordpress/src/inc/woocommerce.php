<?php
/**
 * WooCommerce integration: the slide-out cart talks to these endpoints,
 * and Monogram Studio designs ride along as cart item data with a fee.
 */

defined( 'ABSPATH' ) || exit;

/** Allowed Monogram Studio values (must match site.js). */
function teddy_monogram_options() {
	return array(
		'style'  => array( 'script' => 'Script', 'varsity' => 'Varsity', 'serif' => 'Serif', 'western' => 'Western' ),
		'thread' => array( 'white' => 'White', 'gold' => 'Gold', 'cream' => 'Cream', 'forest' => 'Forest', 'black' => 'Black', 'saddle' => 'Saddle' ),
	);
}

/** Validate a custom monogram sent from the studio. Returns null when absent or invalid. */
function teddy_clean_custom( $raw ) {
	if ( ! $raw ) {
		return null;
	}
	$c = is_array( $raw ) ? $raw : json_decode( wp_unslash( $raw ), true );
	if ( ! is_array( $c ) ) {
		return null;
	}
	$opts = teddy_monogram_options();
	$text = substr( preg_replace( '/[^A-Z0-9&.]/', '', strtoupper( (string) ( $c['text'] ?? '' ) ) ), 0, 3 );
	$style = $c['style'] ?? '';
	$thread = $c['thread'] ?? '';
	if ( '' === $text || ! isset( $opts['style'][ $style ], $opts['thread'][ $thread ] ) ) {
		return null;
	}
	return array( 'text' => $text, 'style' => $style, 'thread' => $thread, 'scale' => max( 0.7, min( 1.25, (float) ( $c['scale'] ?? 1 ) ) ) );
}

/** The cart as site.js renders it. */
function teddy_cart_payload() {
	$cart = WC()->cart;
	$cart->calculate_totals();
	$items = array();
	foreach ( $cart->get_cart() as $key => $item ) {
		$parent  = wc_get_product( $item['product_id'] );
		if ( ! $parent ) {
			continue;
		}
		$variant = '';
		if ( ! empty( $item['variation'] ) ) {
			$variant = (string) current( $item['variation'] );
		}
		if ( 'hat' === $parent->get_meta( '_teddy_kind' ) ) {
			$variant = strtolower( $variant );
		}
		$qty  = max( 1, (int) $item['quantity'] );
		$line = (float) $item['line_subtotal'] + ( 'incl' === get_option( 'woocommerce_tax_display_cart' ) ? (float) $item['line_subtotal_tax'] : 0 );
		$img_id = $item['data']->get_image_id() ? $item['data']->get_image_id() : $parent->get_image_id();
		$items[] = array(
			'key'     => $key,
			'id'      => $parent->get_slug(),
			'variant' => $variant,
			'qty'     => $qty,
			'custom'  => isset( $item['teddy_custom'] ) ? $item['teddy_custom'] : null,
			'unit'    => round( $line / $qty, 2 ),
			'name'    => $parent->get_name(),
			'img'     => $img_id ? wp_get_attachment_image_url( $img_id, 'thumbnail' ) : '',
		);
	}
	return array(
		'items'         => $items,
		'count'         => $cart->get_cart_contents_count(),
		'subtotal_text' => html_entity_decode( wp_strip_all_tags( $cart->get_cart_subtotal() ), ENT_QUOTES, 'UTF-8' ),
	);
}

function teddy_ajax_guard() {
	if ( ! teddy_has_wc() ) {
		wp_send_json_error( array( 'message' => __( 'The store is not set up yet.', 'teddy' ) ), 400 );
	}
	if ( ! check_ajax_referer( 'teddy', 'nonce', false ) ) {
		wp_send_json_error( array( 'message' => __( 'Your session expired. Refresh the page and try again.', 'teddy' ) ), 403 );
	}
	if ( null === WC()->cart && function_exists( 'wc_load_cart' ) ) {
		wc_load_cart();
	}
}

foreach ( array( 'teddy_cart_get', 'teddy_cart_add', 'teddy_cart_qty' ) as $teddy_action ) {
	add_action( "wp_ajax_$teddy_action", "{$teddy_action}_handler" );
	add_action( "wp_ajax_nopriv_$teddy_action", "{$teddy_action}_handler" );
}

function teddy_cart_get_handler() {
	teddy_ajax_guard();
	wp_send_json_success( teddy_cart_payload() );
}

function teddy_cart_add_handler() {
	teddy_ajax_guard();
	$product_id = absint( $_POST['product'] ?? 0 );
	$qty        = max( 1, min( 99, absint( $_POST['qty'] ?? 1 ) ) );
	$want       = strtolower( sanitize_text_field( wp_unslash( $_POST['variant'] ?? '' ) ) );
	$product    = $product_id ? wc_get_product( $product_id ) : null;
	if ( ! $product || ! $product->is_purchasable() ) {
		wp_send_json_error( array( 'message' => __( 'That item is not available right now.', 'teddy' ) ), 400 );
	}
	$data   = array();
	$custom = teddy_clean_custom( $_POST['custom'] ?? '' ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- validated in teddy_clean_custom().
	if ( $custom ) {
		$data['teddy_custom'] = $custom;
	}
	$variation_id = 0;
	$attributes   = array();
	if ( $product->is_type( 'variable' ) ) {
		foreach ( $product->get_children() as $vid ) {
			$v = wc_get_product( $vid );
			if ( ! $v || ! $v->is_purchasable() ) {
				continue;
			}
			$vals = array_map( 'strtolower', array_values( $v->get_variation_attributes() ) );
			if ( '' === $want || in_array( $want, $vals, true ) ) {
				$variation_id = $vid;
				$attributes   = $v->get_variation_attributes();
				break;
			}
		}
		if ( ! $variation_id ) {
			wp_send_json_error( array( 'message' => __( 'That option is sold out.', 'teddy' ) ), 400 );
		}
	}
	$ok = WC()->cart->add_to_cart( $product->get_id(), $qty, $variation_id, $attributes, $data );
	if ( ! $ok ) {
		$notices = wc_get_notices( 'error' );
		wc_clear_notices();
		$msg = $notices ? wp_strip_all_tags( is_array( $notices[0] ) ? $notices[0]['notice'] : $notices[0] ) : __( 'Could not add that to your cart.', 'teddy' );
		wp_send_json_error( array( 'message' => $msg ), 400 );
	}
	wc_clear_notices();
	wp_send_json_success( teddy_cart_payload() );
}

function teddy_cart_qty_handler() {
	teddy_ajax_guard();
	$key = sanitize_text_field( wp_unslash( $_POST['key'] ?? '' ) );
	$qty = absint( $_POST['qty'] ?? 0 );
	if ( $key && WC()->cart->get_cart_item( $key ) ) {
		$qty ? WC()->cart->set_quantity( $key, min( 99, $qty ) ) : WC()->cart->remove_cart_item( $key );
	}
	wp_send_json_success( teddy_cart_payload() );
}

/** Custom monograms cost the hat price plus the Customizer fee. */
add_action( 'woocommerce_before_calculate_totals', function ( $cart ) {
	if ( is_admin() && ! wp_doing_ajax() ) {
		return;
	}
	$fee = (float) get_theme_mod( 'teddy_monogram_fee', 25 );
	foreach ( $cart->get_cart() as $item ) {
		if ( empty( $item['teddy_custom'] ) ) {
			continue;
		}
		$base = wc_get_product( $item['variation_id'] ? $item['variation_id'] : $item['product_id'] );
		if ( $base ) {
			$item['data']->set_price( (float) $base->get_price( 'edit' ) + $fee );
		}
	}
}, 20 );

/** Keep the design when the cart is restored from the session. */
add_filter( 'woocommerce_get_cart_item_from_session', function ( $item, $values ) {
	if ( isset( $values['teddy_custom'] ) ) {
		$item['teddy_custom'] = $values['teddy_custom'];
	}
	return $item;
}, 10, 2 );

/** Show the design in the cart, checkout and mini-cart. */
add_filter( 'woocommerce_get_item_data', function ( $data, $item ) {
	if ( empty( $item['teddy_custom'] ) ) {
		return $data;
	}
	$o = teddy_monogram_options();
	$c = $item['teddy_custom'];
	$data[] = array( 'key' => __( 'Monogram', 'teddy' ), 'value' => esc_html( $c['text'] ) );
	$data[] = array( 'key' => __( 'Lettering', 'teddy' ), 'value' => esc_html( $o['style'][ $c['style'] ] ) );
	$data[] = array( 'key' => __( 'Thread', 'teddy' ), 'value' => esc_html( $o['thread'][ $c['thread'] ] ) );
	return $data;
}, 10, 2 );

/** Name custom lines "Custom … Hat". */
add_filter( 'woocommerce_cart_item_name', function ( $name, $item ) {
	return empty( $item['teddy_custom'] ) ? $name : sprintf( /* translators: %s: product name */ __( 'Custom %s', 'teddy' ), $name );
}, 10, 2 );

/** Save the design on the order so it can be stitched. */
add_action( 'woocommerce_checkout_create_order_line_item', function ( $line, $key, $values ) {
	if ( empty( $values['teddy_custom'] ) ) {
		return;
	}
	$o = teddy_monogram_options();
	$c = $values['teddy_custom'];
	$line->add_meta_data( __( 'Monogram', 'teddy' ), $c['text'] );
	$line->add_meta_data( __( 'Lettering', 'teddy' ), $o['style'][ $c['style'] ] );
	$line->add_meta_data( __( 'Thread', 'teddy' ), $o['thread'][ $c['thread'] ] );
	$line->add_meta_data( __( 'Letter size', 'teddy' ), round( $c['scale'] * 100 ) . '%' );
}, 10, 3 );
