<?php
/**
 * Teddy catalog: the default products (used by the installer) and the
 * mapping from WooCommerce products to the shape site.js renders.
 */

defined( 'ABSPATH' ) || exit;

/** City monograms. */
function teddy_cities() {
	return array(
		't'  => array( 'mono' => 'T', 'place' => 'Texas' ),
		'f'  => array( 'mono' => 'F', 'place' => 'Florida' ),
		'ny' => array( 'mono' => 'NY', 'place' => 'New York' ),
		'la' => array( 'mono' => 'LA', 'place' => 'Los Angeles' ),
	);
}

/** Campaign photos shown on each hat's product page (theme image keys). */
function teddy_default_looks() {
	return array(
		'cowboy-t'  => array( 'noir-life-1', 'scene-texas-motel', 'scene-studio-duo' ),
		'cowboy-f'  => array( 'hero-noir', 'noir-cowboy-model', 'scene-jupiter-horse' ),
		'cowboy-ny' => array( 'noir-life-2', 'scene-nyc-night' ),
		'cowboy-la' => array( 'noir-life-3' ),
		'fedora-t'  => array( 'noir-life-4', 'scene-studio-duo' ),
		'fedora-f'  => array( 'noir-life-6' ),
		'fedora-ny' => array( 'noir-life-5' ),
		'fedora-la' => array( 'scene-la-convertible', 'life-7' ),
	);
}

/** The products the installer creates. Prices for apparel and accessories are proposals. */
function teddy_default_catalog() {
	$out    = array();
	$prices = array( 'cowboy' => 150, 'fedora' => 140 );
	foreach ( array( 'cowboy', 'fedora' ) as $type ) {
		foreach ( teddy_cities() as $m => $c ) {
			$out[] = array(
				'slug'  => "$type-$m",
				'kind'  => 'hat',
				'type'  => $type,
				'mono'  => $m,
				'name'  => $c['mono'] . ' ' . ( 'cowboy' === $type ? 'Cowboy' : 'Fedora' ) . ' Hat',
				'price' => $prices[ $type ],
				'cat'   => 'cowboy' === $type ? 'Cowboy Hats' : 'Fedoras',
				'desc'  => 'cowboy' === $type
					? "A classic Western cowboy hat in 100% wool felt, with the {$c['place']} {$c['mono']} monogram embroidered on the crown in original Teddy artwork."
					: "A traditional wide-brim fedora in 100% wool felt, finished with the {$c['place']} {$c['mono']} monogram embroidered on the crown.",
			);
		}
	}
	$sizes = array( 'S', 'M', 'L', 'XL', 'XXL' );
	$app   = array(
		array( 'tee-script', 'Teddy Script Tee', 45, 'Faded black', array( 'apparel-tee-black', 'apparel-tee-black-model' ), $sizes, 'Heavyweight boxy tee in faded black cotton with the oversized gold script T across the chest.', 'Apparel' ),
		array( 'tee-monogram', 'Monogram Tee', 45, 'Bone', array( 'apparel-tee-bone' ), $sizes, 'Garment-dyed bone cotton tee with the Teddy Headwear script printed in forest green.', 'Apparel' ),
		array( 'hoodie', 'Frontier Hoodie', 95, 'Forest green', array( 'apparel-hoodie', 'apparel-hoodie-model' ), $sizes, 'Heavyweight forest green fleece hoodie with the Teddy script embroidered across the chest in gold thread, the same gold as our silk lining.', 'Apparel' ),
		array( 'crew', 'Saddle Crewneck', 85, 'Saddle brown', array( 'apparel-crew' ), $sizes, 'Saddle brown fleece crewneck, the color of our leather hat band, with a cream script T embroidered on the chest.', 'Apparel' ),
		array( 'trucker', 'Teddy Trucker', 40, 'Forest / gold', array( 'apparel-trucker' ), array(), 'Forest green mesh trucker with the gold Teddy Headwear oval embroidered on the front. Snap closure.', 'Apparel' ),
		array( 'cord', 'Corduroy Trucker', 45, 'Cream cord', array( 'apparel-cord' ), array(), 'Wide-wale cream corduroy front with a mesh back and the gold Teddy oval embroidered on the crown.', 'Apparel' ),
		array( 'rag', 'Silk Wild Rag', 55, 'Silk gold', array( 'apparel-rag' ), array(), 'A gold silk wild rag cut from the same shade as our hat lining, with a tone-on-tone paisley and a small script T in the corner.', 'Apparel' ),
		array( 'tote', 'Canvas Tote', 35, 'Bone canvas', array( 'apparel-tote' ), array(), 'Heavy bone canvas tote with saddle leather handles and the Teddy script in forest green.', 'Apparel' ),
		array( 'bear-pin', 'Bear Hat Pin', 20, 'Gold + enamel', array( 'acc-bear-pin' ), array(), 'The Teddy bear in hard enamel and polished gold, made to ride on the band or brim of your hat.', 'Accessories' ),
		array( 'bear-patch', 'Bear Patch', 15, 'Embroidered', array( 'acc-bear-patch' ), array(), 'The Teddy bear, densely embroidered with a raised gold border. Iron it on a jacket, a tote or a cap.', 'Accessories' ),
	);
	foreach ( $app as $a ) {
		$out[] = array( 'slug' => $a[0], 'kind' => 'apparel', 'name' => $a[1], 'price' => $a[2], 'color' => $a[3], 'img' => $a[4], 'sizes' => $a[5], 'desc' => $a[6], 'cat' => $a[7] );
	}
	return $out;
}

/** Option values of a product attribute by name (case-insensitive), e.g. Color or Size. */
function teddy_attr_options( $product, $name ) {
	foreach ( $product->get_attributes() as $attr ) {
		$label = $attr->is_taxonomy() ? wc_attribute_label( $attr->get_name() ) : $attr->get_name();
		if ( strtolower( $label ) === strtolower( $name ) || strtolower( $attr->get_name() ) === 'pa_' . strtolower( $name ) ) {
			if ( $attr->is_taxonomy() ) {
				return wc_get_product_terms( $product->get_id(), $attr->get_name(), array( 'fields' => 'names' ) );
			}
			return $attr->get_options();
		}
	}
	return array();
}

/** Image URL for an attachment ID or a bundled theme image key. */
function teddy_image_url( $ref, $size = 'large' ) {
	if ( is_numeric( $ref ) ) {
		$url = wp_get_attachment_image_url( (int) $ref, $size );
		return $url ? $url : '';
	}
	return $ref ? teddy_asset( 'img/' . $ref . '.webp' ) : '';
}

/**
 * Every published product, shaped for site.js. Products the installer made carry
 * _teddy_* meta; products added by hand map from their attributes (Color → hat-style
 * swatches only when they are marked as hats, Size → size buttons).
 */
function teddy_catalog_json() {
	if ( ! teddy_has_wc() ) {
		return array();
	}
	$cache = get_transient( 'teddy_catalog' );
	if ( is_array( $cache ) ) {
		return $cache;
	}
	$cities = teddy_cities();
	$out    = array();
	$products = wc_get_products( array( 'status' => 'publish', 'limit' => -1, 'orderby' => array( 'menu_order' => 'ASC', 'date' => 'ASC' ), 'visibility' => 'visible' ) );
	foreach ( $products as $p ) {
		$kind = $p->get_meta( '_teddy_kind' );
		$kind = 'hat' === $kind ? 'hat' : 'apparel';
		$desc = wp_strip_all_tags( $p->get_short_description() ? $p->get_short_description() : $p->get_description() );
		$item = array(
			'id'    => $p->get_slug(),
			'wc'    => $p->get_id(),
			'kind'  => $kind,
			'name'  => $p->get_name(),
			'price' => (float) $p->get_price(),
			'url'   => get_permalink( $p->get_id() ),
			'desc'  => $desc,
		);
		$gallery = array_filter( array_merge( array( $p->get_image_id() ), $p->get_gallery_image_ids() ) );
		if ( 'hat' === $kind ) {
			$m             = $p->get_meta( '_teddy_mono' );
			$item['type']  = $p->get_meta( '_teddy_type' ) ? $p->get_meta( '_teddy_type' ) : 'cowboy';
			$item['mono']  = $m;
			$item['place'] = isset( $cities[ $m ] ) ? $cities[ $m ]['place'] : $p->get_meta( '_teddy_place' );
			$item['monoLabel'] = isset( $cities[ $m ] ) ? $cities[ $m ]['mono'] : strtoupper( (string) $m );
			$item['colors'] = array();
			$item['images'] = array();
			if ( $p->is_type( 'variable' ) ) {
				foreach ( $p->get_children() as $vid ) {
					$v = wc_get_product( $vid );
					if ( ! $v || ! $v->is_purchasable() ) {
						continue;
					}
					$c = strtolower( (string) current( $v->get_variation_attributes() ) );
					if ( $c && ! in_array( $c, $item['colors'], true ) ) {
						$item['colors'][]     = $c;
						$item['images'][ $c ] = teddy_image_url( $v->get_image_id() ? $v->get_image_id() : $p->get_image_id() );
					}
				}
			}
			$looks = array_filter( array_map( 'trim', explode( ',', (string) $p->get_meta( '_teddy_looks' ) ) ) );
			$item['looks'] = array_values( array_filter( array_map( 'teddy_image_url', $looks ) ) );
			if ( ! $item['looks'] && count( $gallery ) > 1 ) {
				$item['looks'] = array_map( 'teddy_image_url', array_slice( $gallery, 1 ) );
			}
			$item['images'] = (object) $item['images'];
		} else {
			$item['color']   = $p->get_meta( '_teddy_color_label' ) ? $p->get_meta( '_teddy_color_label' ) : implode( ' / ', teddy_attr_options( $p, 'Color' ) );
			$sizes           = teddy_attr_options( $p, 'Size' );
			$item['sizes']   = $sizes ? array_values( $sizes ) : array( 'One size' );
			$item['gallery'] = $gallery ? array_values( array_map( 'teddy_image_url', $gallery ) ) : array( wc_placeholder_img_src( 'large' ) );
		}
		$out[] = $item;
	}
	set_transient( 'teddy_catalog', $out, HOUR_IN_SECONDS );
	return $out;
}

/** Rebuild the cached catalog whenever products change. */
foreach ( array( 'save_post_product', 'woocommerce_update_product', 'woocommerce_update_product_variation', 'deleted_post', 'woocommerce_product_set_stock_status' ) as $teddy_hook ) {
	add_action( $teddy_hook, function () {
		delete_transient( 'teddy_catalog' );
	} );
}
