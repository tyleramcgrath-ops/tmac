<?php
/**
 * Turns WooCommerce products into SP-API Listings Items payloads.
 *
 * Two listing modes:
 *  - "match":  sell against an existing Amazon catalog page (ASIN). Offer-only, product type PRODUCT.
 *  - "create": create a new catalog item under a chosen product type (e.g. SHIRT, TOY_FIGURE).
 */

defined( 'ABSPATH' ) || exit;

class OLA_Listing_Builder {

	const OFFER_PRODUCT_TYPE = 'PRODUCT';

	/* ---------------------------------------------------------------------
	 * Product settings (stored as post meta, inherited by variations)
	 * ------------------------------------------------------------------- */

	/**
	 * Reads a listing setting, falling back from variation to parent product.
	 */
	public static function meta( $product, $key, $inherit = true ) {
		$value = get_post_meta( $product->get_id(), '_ola_' . $key, true );
		if ( '' === $value && $inherit && $product->get_parent_id() ) {
			$value = get_post_meta( $product->get_parent_id(), '_ola_' . $key, true );
		}
		return $value;
	}

	public static function sku( $product ) {
		$sku = get_post_meta( $product->get_id(), '_ola_sku', true );
		return $sku ? $sku : $product->get_sku();
	}

	public static function mode( $product ) {
		$mode = self::meta( $product, 'mode' );
		return 'create' === $mode ? 'create' : 'match';
	}

	public static function is_fba( $product ) {
		return 'afn' === self::meta( $product, 'fulfillment' );
	}

	public static function price( $product ) {
		$override = get_post_meta( $product->get_id(), '_ola_price', true );
		if ( '' !== $override && is_numeric( $override ) ) {
			return round( (float) $override, 2 );
		}
		return OLA_Settings::adjust_price( $product->get_price() );
	}

	public static function quantity( $product ) {
		if ( ! $product->is_in_stock() ) {
			return 0;
		}
		if ( ! $product->managing_stock() ) {
			/**
			 * Quantity sent to Amazon for in-stock products that don't track stock.
			 */
			return (int) apply_filters( 'ola_unmanaged_stock_quantity', 10, $product );
		}
		return max( 0, (int) $product->get_stock_quantity() - (int) OLA_Settings::get( 'stock_buffer' ) );
	}

	/* ---------------------------------------------------------------------
	 * Attribute helpers
	 * ------------------------------------------------------------------- */

	private static function mp() {
		return OLA_Settings::get( 'marketplace_id' );
	}

	private static function text( $value ) {
		return array(
			array(
				'value'          => $value,
				'language_tag'   => OLA_Settings::language_tag(),
				'marketplace_id' => self::mp(),
			),
		);
	}

	private static function plain( $value ) {
		return array(
			array(
				'value'          => $value,
				'marketplace_id' => self::mp(),
			),
		);
	}

	public static function offer_attribute( $product ) {
		return array(
			array(
				'marketplace_id' => self::mp(),
				'currency'       => OLA_Settings::currency(),
				'our_price'      => array(
					array(
						'schedule' => array(
							array( 'value_with_tax' => self::price( $product ) ),
						),
					),
				),
			),
		);
	}

	public static function fulfillment_attribute( $product ) {
		if ( self::is_fba( $product ) ) {
			return array(
				array( 'fulfillment_channel_code' => 'AMAZON_' . strtoupper( OLA_Settings::region() ) ),
			);
		}
		return array(
			array(
				'fulfillment_channel_code'   => 'DEFAULT',
				'quantity'                   => self::quantity( $product ),
				'lead_time_to_ship_max_days' => (int) OLA_Settings::get( 'handling_time' ),
			),
		);
	}

	private static function offer_attributes( $product ) {
		$condition = self::meta( $product, 'condition' );
		return array(
			'condition_type'           => self::plain( $condition ? $condition : OLA_Settings::get( 'default_condition' ) ),
			'purchasable_offer'        => self::offer_attribute( $product ),
			'fulfillment_availability' => self::fulfillment_attribute( $product ),
		);
	}

	/**
	 * Catalog attributes shared by standalone products and variation parents.
	 */
	private static function catalog_attributes( $product ) {
		$source = $product->get_parent_id() ? wc_get_product( $product->get_parent_id() ) : $product;
		$attrs  = array();

		$title = self::meta( $product, 'title' );
		$attrs['item_name'] = self::text( $title ? $title : $product->get_name() );

		$brand = self::meta( $product, 'brand' );
		$brand = $brand ? $brand : OLA_Settings::get( 'default_brand' );
		if ( $brand ) {
			$attrs['brand'] = self::text( $brand );
		}

		$bullets = array_filter( array_map( 'trim', preg_split( '/\r\n|\n/', (string) self::meta( $product, 'bullets' ) ) ) );
		if ( ! $bullets ) {
			$bullets = array_filter( array_map( 'trim', preg_split( '/\r\n|\n|<\/li>|<br\s*\/?>/i', wp_strip_all_tags( $source->get_short_description(), false ) ) ) );
		}
		if ( $bullets ) {
			$attrs['bullet_point'] = array();
			foreach ( array_slice( array_values( $bullets ), 0, 5 ) as $bullet ) {
				$attrs['bullet_point'][] = self::text( wp_strip_all_tags( $bullet ) )[0];
			}
		}

		$description = trim( wp_strip_all_tags( $source->get_description() ) );
		if ( $description ) {
			$attrs['product_description'] = self::text( mb_substr( $description, 0, 2000 ) );
		}

		$attrs = array_merge( $attrs, self::image_attributes( $product, $source ) );

		return $attrs;
	}

	private static function image_attributes( $product, $source ) {
		$attrs     = array();
		$main_id   = $product->get_image_id() ? $product->get_image_id() : $source->get_image_id();
		$gallery   = array_diff( $source->get_gallery_image_ids(), array( $main_id ) );
		$main_url  = $main_id ? wp_get_attachment_url( $main_id ) : '';

		if ( $main_url ) {
			$attrs['main_product_image_locator'] = array(
				array(
					'media_location' => $main_url,
					'marketplace_id' => self::mp(),
				),
			);
		}

		$i = 1;
		foreach ( $gallery as $image_id ) {
			$url = wp_get_attachment_url( $image_id );
			if ( ! $url ) {
				continue;
			}
			$attrs[ 'other_product_image_locator_' . $i ] = array(
				array(
					'media_location' => $url,
					'marketplace_id' => self::mp(),
				),
			);
			if ( ++$i > 8 ) {
				break;
			}
		}

		return $attrs;
	}

	private static function identifier_attributes( $product ) {
		$type  = self::meta( $product, 'id_type' );
		$value = get_post_meta( $product->get_id(), '_ola_id_value', true );

		if ( ! $value && method_exists( $product, 'get_global_unique_id' ) ) {
			$value = $product->get_global_unique_id();
		}

		if ( 'exempt' === $type ) {
			return array( 'supplier_declared_has_product_identifier_exemption' => self::plain( true ) );
		}

		if ( ! $value ) {
			return array();
		}

		return array(
			'externally_assigned_product_identifier' => array(
				array(
					'type'           => $type ? strtolower( $type ) : self::guess_identifier_type( $value ),
					'value'          => $value,
					'marketplace_id' => self::mp(),
				),
			),
		);
	}

	private static function guess_identifier_type( $value ) {
		$digits = preg_replace( '/\D/', '', $value );
		switch ( strlen( $digits ) ) {
			case 12:
				return 'upc';
			case 13:
				return 0 === strpos( $digits, '978' ) || 0 === strpos( $digits, '979' ) ? 'isbn' : 'ean';
			default:
				return 'gtin';
		}
	}

	/**
	 * Extra attributes typed in by the user as JSON. Scalars become
	 * [{value, marketplace_id}]; arrays are passed through untouched.
	 */
	private static function extra_attributes( $product ) {
		$json = self::meta( $product, 'extra_attributes' );
		if ( ! $json ) {
			return array();
		}
		$decoded = json_decode( $json, true );
		if ( ! is_array( $decoded ) ) {
			return array();
		}
		$attrs = array();
		foreach ( $decoded as $name => $value ) {
			$attrs[ $name ] = is_array( $value ) ? $value : self::plain( $value );
		}
		return $attrs;
	}

	/* ---------------------------------------------------------------------
	 * Payload builders
	 * ------------------------------------------------------------------- */

	/**
	 * Builds the PUT payloads needed to list a product. Variable products
	 * produce a parent (when creating new catalog items) followed by children.
	 *
	 * @return array[]|WP_Error List of [product_id, sku, product_type, requirements, attributes].
	 */
	public static function build( $product ) {
		if ( $product->is_type( 'variable' ) ) {
			return self::build_family( $product );
		}
		$payload = self::build_single( $product );
		return is_wp_error( $payload ) ? $payload : array( $payload );
	}

	private static function build_single( $product, $parent_sku = null ) {
		$sku = self::sku( $product );
		if ( ! $sku ) {
			/* translators: %s: product name */
			return new WP_Error( 'ola_no_sku', sprintf( __( '"%s" needs a SKU before it can be listed on Amazon.', 'open-lister-amazon' ), $product->get_name() ) );
		}
		// WooCommerce variations fall back to the parent SKU; Amazon needs a unique one per variation.
		if ( $product->get_parent_id() && $sku === self::sku( wc_get_product( $product->get_parent_id() ) ) ) {
			/* translators: %s: variation name */
			return new WP_Error( 'ola_shared_sku', sprintf( __( 'Variation "%s" needs its own SKU (it currently shares the parent SKU).', 'open-lister-amazon' ), $product->get_name() ) );
		}

		if ( 'match' === self::mode( $product ) ) {
			$asin = get_post_meta( $product->get_id(), '_ola_asin', true );
			if ( ! $asin ) {
				/* translators: %s: product name */
				return new WP_Error( 'ola_no_asin', sprintf( __( '"%s" is set to match an existing Amazon product but has no ASIN.', 'open-lister-amazon' ), $product->get_name() ) );
			}
			$attributes = array_merge(
				array( 'merchant_suggested_asin' => self::plain( strtoupper( trim( $asin ) ) ) ),
				self::offer_attributes( $product )
			);
			return array( $product->get_id(), $sku, self::OFFER_PRODUCT_TYPE, 'LISTING_OFFER_ONLY', $attributes );
		}

		$product_type = strtoupper( (string) self::meta( $product, 'product_type' ) );
		if ( ! $product_type ) {
			return new WP_Error( 'ola_no_product_type', __( 'Choose an Amazon product type (for example SHIRT or HOME) before creating a new Amazon product.', 'open-lister-amazon' ) );
		}

		$attributes = array_merge(
			self::catalog_attributes( $product ),
			self::identifier_attributes( $product ),
			self::offer_attributes( $product )
		);

		if ( $parent_sku ) {
			$attributes = array_merge( $attributes, self::child_attributes( $product, $parent_sku ) );
		}

		$attributes = array_merge( $attributes, self::extra_attributes( $product ) );

		return array( $product->get_id(), $sku, $product_type, 'LISTING', $attributes );
	}

	private static function build_family( $parent ) {
		$payloads   = array();
		$variations = array_filter( array_map( 'wc_get_product', $parent->get_children() ) );

		if ( ! $variations ) {
			return new WP_Error( 'ola_no_variations', __( 'This variable product has no variations to list.', 'open-lister-amazon' ) );
		}

		$parent_sku = null;
		if ( 'create' === self::mode( $parent ) ) {
			$parent_sku   = self::sku( $parent );
			$product_type = strtoupper( (string) self::meta( $parent, 'product_type' ) );
			$theme        = self::meta( $parent, 'variation_theme' );

			if ( ! $parent_sku ) {
				return new WP_Error( 'ola_no_sku', __( 'The parent product needs a SKU to create an Amazon variation family.', 'open-lister-amazon' ) );
			}
			if ( ! $product_type || ! $theme ) {
				return new WP_Error( 'ola_no_theme', __( 'Set the Amazon product type and variation theme (for example SIZE/COLOR) on the parent product.', 'open-lister-amazon' ) );
			}

			$attributes = array_merge(
				self::catalog_attributes( $parent ),
				array(
					'parentage_level'  => self::plain( 'parent' ),
					'variation_theme'  => array( array( 'name' => strtoupper( $theme ) ) ),
					'supplier_declared_has_product_identifier_exemption' => self::plain( true ),
				),
				self::extra_attributes( $parent )
			);
			$payloads[] = array( $parent->get_id(), $parent_sku, $product_type, 'LISTING_PRODUCT_ONLY', $attributes );
		}

		foreach ( $variations as $variation ) {
			if ( 'no' === get_post_meta( $variation->get_id(), '_ola_enabled', true ) ) {
				continue;
			}
			$payload = self::build_single( $variation, $parent_sku );
			if ( is_wp_error( $payload ) ) {
				return $payload;
			}
			$payloads[] = $payload;
		}

		return $payloads;
	}

	private static function child_attributes( $variation, $parent_sku ) {
		$parent = wc_get_product( $variation->get_parent_id() );
		$theme  = strtoupper( (string) self::meta( $parent, 'variation_theme' ) );
		$map    = json_decode( (string) self::meta( $parent, 'attribute_map' ), true );
		$map    = is_array( $map ) ? $map : array();

		$attrs = array(
			'parentage_level'               => self::plain( 'child' ),
			'variation_theme'               => array( array( 'name' => $theme ) ),
			'child_parent_sku_relationship' => array(
				array(
					'child_relationship_type' => 'variation',
					'parent_sku'              => $parent_sku,
					'marketplace_id'          => self::mp(),
				),
			),
		);

		foreach ( $variation->get_attributes() as $taxonomy => $value ) {
			$clean_key = str_replace( 'attribute_', '', $taxonomy );
			$amazon    = isset( $map[ $clean_key ] ) ? $map[ $clean_key ] : self::default_amazon_attribute( $clean_key );
			if ( ! $amazon || '' === $value ) {
				continue;
			}
			if ( taxonomy_exists( $clean_key ) ) {
				$term  = get_term_by( 'slug', $value, $clean_key );
				$value = $term ? $term->name : $value;
			}
			$attrs[ $amazon ] = self::text( $value );
		}

		return $attrs;
	}

	/**
	 * Maps common WooCommerce attribute names (color, pa_colour, size...) to Amazon attributes.
	 */
	private static function default_amazon_attribute( $woo_attribute ) {
		$name = preg_replace( '/^pa_/', '', strtolower( $woo_attribute ) );
		$map  = array(
			'color'    => 'color',
			'colour'   => 'color',
			'size'     => 'size',
			'material' => 'material',
			'style'    => 'style',
			'pattern'  => 'pattern',
			'flavor'   => 'flavor',
			'flavour'  => 'flavor',
			'scent'    => 'scent',
		);
		return isset( $map[ $name ] ) ? $map[ $name ] : '';
	}
}
