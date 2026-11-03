<?php
/**
 * Reads what the store already knows about a product: its Comfy Meter,
 * one-line summary, "What we love" list, photo and brand.
 *
 * @package comfy-product-seo
 */

defined( 'ABSPATH' ) || exit;

class CPS_Data {

	/**
	 * Comfy Meter from the product's short description (or the line at the end of the description).
	 *
	 * @return array|null { score: float, label: string, parts: array<string,float> }
	 */
	public static function meter( WC_Product $product ) {
		$short = (string) $product->get_short_description();
		$desc  = (string) $product->get_description();
		$score = null;
		$label = '';

		if ( preg_match( '/COMFY METER<\/span>\s*<span[^>]*>\s*([0-9]+(?:\.[0-9])?)\s*<\/span>/i', $short, $m ) ) {
			$score = (float) $m[1];
			if ( preg_match( '/☁\s*([^<]+)<\/span>/u', $short, $l ) ) {
				$label = trim( $l[1] );
			}
		} elseif ( preg_match( '/Comfy Meter:\s*<strong>\s*([0-9]+(?:\.[0-9])?)\/10\s*\(([^)]+)\)/i', $desc, $m ) ) {
			$score = (float) $m[1];
			$label = trim( $m[2] );
		}
		if ( null === $score || $score < 1 || $score > 10 ) {
			return null;
		}

		$parts = array();
		if ( preg_match( '/Softness ([0-9.]+), Support ([0-9.]+), Cozy Factor ([0-9.]+), Easy Care ([0-9.]+), Shopper Love ([0-9.]+)/', $desc, $p ) ) {
			$parts = array(
				'Softness'     => (float) $p[1],
				'Support'      => (float) $p[2],
				'Cozy Factor'  => (float) $p[3],
				'Easy Care'    => (float) $p[4],
				'Shopper Love' => (float) $p[5],
			);
		}
		return array( 'score' => $score, 'label' => $label, 'parts' => $parts );
	}

	/**
	 * The one-sentence summary: the first paragraph of the short description, as plain text.
	 */
	public static function summary( WC_Product $product ) {
		$short = (string) $product->get_short_description();
		if ( preg_match( '/<p>(.*?)<\/p>/s', $short, $m ) ) {
			$text = $m[1];
		} else {
			$text = $short;
		}
		$text = trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( html_entity_decode( $text, ENT_QUOTES, 'UTF-8' ) ) ) );
		// A summary that is really the meter or the affiliate note is no summary.
		if ( '' === $text || false !== stripos( $text, 'COMFY METER' ) || 0 === stripos( $text, 'As an Amazon Associate' ) ) {
			return '';
		}
		return $text;
	}

	/**
	 * The "What we love" bullets from the description.
	 *
	 * @return string[]
	 */
	public static function loves( WC_Product $product ) {
		$desc = (string) $product->get_description();
		if ( ! preg_match( '/What we love<\/h3>\s*<ul>(.*?)<\/ul>/is', $desc, $m ) ) {
			return array();
		}
		preg_match_all( '/<li>(.*?)<\/li>/s', $m[1], $items );
		return array_values( array_filter( array_map( array( __CLASS__, 'plain' ), $items[1] ) ) );
	}

	/**
	 * Main photo: the Featured Image from URL link if there is one, otherwise the featured image.
	 */
	public static function image( WC_Product $product ) {
		$url = get_post_meta( $product->get_id(), 'fifu_image_url', true );
		if ( $url ) {
			return esc_url_raw( $url );
		}
		$id = $product->get_image_id();
		return $id ? (string) wp_get_attachment_image_url( $id, 'full' ) : '';
	}

	/**
	 * Brand from a brand taxonomy if the store uses one. Never guessed from the name.
	 */
	public static function brand( WC_Product $product ) {
		foreach ( array( 'product_brand', 'pwb-brand', 'yith_product_brand' ) as $tax ) {
			if ( taxonomy_exists( $tax ) ) {
				$terms = get_the_terms( $product->get_id(), $tax );
				if ( $terms && ! is_wp_error( $terms ) ) {
					return html_entity_decode( $terms[0]->name, ENT_QUOTES, 'UTF-8' );
				}
			}
		}
		return '';
	}

	/**
	 * Product name as plain text, and a short form without the size or pack note in brackets.
	 */
	public static function names( WC_Product $product ) {
		$full  = self::plain( $product->get_name() );
		$short = trim( preg_replace( '/\s*\([^)]*\)\s*$/', '', $full ) );
		return array( $full, '' !== $short ? $short : $full );
	}

	/**
	 * Deepest category path, for example "Blankets & Throws > Weighted Blankets".
	 */
	public static function category_path( WC_Product $product ) {
		$best = '';
		foreach ( $product->get_category_ids() as $cat_id ) {
			$names = array();
			foreach ( array_reverse( get_ancestors( $cat_id, 'product_cat' ) ) as $anc ) {
				$t       = get_term( $anc, 'product_cat' );
				$names[] = $t && ! is_wp_error( $t ) ? $t->name : '';
			}
			$t       = get_term( $cat_id, 'product_cat' );
			$names[] = $t && ! is_wp_error( $t ) ? $t->name : '';
			$path    = html_entity_decode( implode( ' > ', array_filter( $names ) ), ENT_QUOTES, 'UTF-8' );
			if ( strlen( $path ) > strlen( $best ) ) {
				$best = $path;
			}
		}
		return $best;
	}

	/**
	 * HTML fragment to plain text.
	 */
	public static function plain( $html ) {
		return trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( html_entity_decode( (string) $html, ENT_QUOTES, 'UTF-8' ) ) ) );
	}

	/**
	 * Shorten text to a limit at a word boundary.
	 */
	public static function clip( $text, $limit ) {
		if ( mb_strlen( $text ) <= $limit ) {
			return $text;
		}
		$cut = mb_substr( $text, 0, $limit - 1 );
		$sp  = mb_strrpos( $cut, ' ' );
		if ( false !== $sp && $sp > $limit * 0.6 ) {
			$cut = mb_substr( $cut, 0, $sp );
		}
		return rtrim( $cut, " ,.;:-" ) . '…';
	}
}
