<?php
/**
 * Optimizes one product: search title, description and focus keyphrase in
 * All in One SEO, photo alt text, the photo itself when it is still missing,
 * and the list of guides that link to it.
 *
 * @package comfy-product-seo
 */

defined( 'ABSPATH' ) || exit;

class CPS_Optimizer {

	const TITLE_MAX = 60;
	const DESC_MAX  = 155;

	/** @var bool Guards against re-running on the saves we cause ourselves. */
	private static $running = false;

	public static function init() {
		$s = cps_settings();
		if ( $s['auto'] ) {
			add_action( 'save_post_product', array( __CLASS__, 'on_save_product' ), 99, 2 );
			add_action( 'woocommerce_product_import_inserted_product_object', array( __CLASS__, 'on_import' ), 99, 1 );
			add_action( 'save_post_post', array( __CLASS__, 'on_save_guide' ), 99, 2 );
		}
	}

	public static function on_save_product( $post_id, $post ) {
		if ( self::$running || wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) || 'publish' !== $post->post_status ) {
			return;
		}
		self::optimize( $post_id );
	}

	public static function on_import( $product ) {
		if ( $product instanceof WC_Product && 'publish' === $product->get_status() ) {
			self::optimize( $product->get_id() );
		}
	}

	/**
	 * When a guide is saved, refresh the guide list of every product it links to.
	 */
	public static function on_save_guide( $post_id, $post ) {
		if ( self::$running || wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}
		$ids = array_merge( self::linked_product_ids( $post->post_content ), (array) get_post_meta( $post_id, '_cps_linked_products', true ) );
		foreach ( array_unique( array_filter( array_map( 'intval', $ids ) ) ) as $product_id ) {
			update_post_meta( $product_id, '_cps_guides', self::guides_for( $product_id ) );
		}
		update_post_meta( $post_id, '_cps_linked_products', self::linked_product_ids( $post->post_content ) );
	}

	/**
	 * Optimize one product and report what happened.
	 *
	 * @return array Row for the results table.
	 */
	public static function optimize( $product_id ) {
		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return array( 'id' => $product_id, 'error' => 'Not a product.' );
		}
		self::$running = true;
		$notes         = array();

		list( $full, $short ) = CPS_Data::names( $product );
		$meter                = CPS_Data::meter( $product );
		$title                = self::make_title( $full, $short );
		$desc                 = self::make_description( $product, $short, $meter );

		// Search title, description and focus keyphrase in All in One SEO.
		$aioseo = self::write_aioseo( $product_id, $title, $desc, strtolower( $short ) );
		$notes  = array_merge( $notes, $aioseo['notes'] );

		// Photo: attach it now if the import left it unattached (same as clicking Update).
		$fifu_url = get_post_meta( $product_id, 'fifu_image_url', true );
		if ( $fifu_url && ! get_post_thumbnail_id( $product_id ) && function_exists( 'fifu_update_fake_attach_id' ) ) {
			fifu_update_fake_attach_id( $product_id );
			if ( get_post_thumbnail_id( $product_id ) ) {
				$notes[] = 'Photo attached';
			}
		}

		// Alt text for the photo.
		if ( $fifu_url && '' === trim( (string) get_post_meta( $product_id, 'fifu_image_alt', true ) ) ) {
			update_post_meta( $product_id, 'fifu_image_alt', $full );
			$notes[] = 'Photo alt text added';
		}
		$thumb = get_post_thumbnail_id( $product_id );
		if ( $thumb && '' === trim( (string) get_post_meta( $thumb, '_wp_attachment_image_alt', true ) ) ) {
			update_post_meta( $thumb, '_wp_attachment_image_alt', $full );
		}

		// Guides that link to this product.
		$guides = self::guides_for( $product_id );
		update_post_meta( $product_id, '_cps_guides', $guides );

		update_post_meta( $product_id, '_cps_optimized', time() );
		self::$running = false;

		if ( ! $meter ) {
			$notes[] = 'No Comfy Meter found, so no review rating in the schema';
		}
		return array(
			'id'       => $product_id,
			'name'     => $full,
			'title'    => $aioseo['title'],
			'desc'     => $aioseo['desc'],
			'schema'   => (bool) cps_settings()['schema'],
			'meter'    => $meter ? $meter['score'] : null,
			'guides'   => count( $guides ),
			'notes'    => $notes,
		);
	}

	/**
	 * Title under 60 characters, falling back to shorter forms of the name.
	 */
	public static function make_title( $full, $short ) {
		$site = wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );
		foreach ( array( "$full Review | $site", "$short Review | $site", "$full Review", "$short Review", $short ) as $candidate ) {
			if ( mb_strlen( $candidate ) <= self::TITLE_MAX ) {
				return $candidate;
			}
		}
		return CPS_Data::clip( $short, self::TITLE_MAX );
	}

	/**
	 * A description written from this product's own summary and score, under 155 characters.
	 */
	public static function make_description( WC_Product $product, $short, $meter ) {
		$summary = CPS_Data::summary( $product );
		if ( '' === $summary ) {
			$summary = sprintf( 'Our take on the %s.', $short );
		}
		$score = $meter ? sprintf( 'Comfy Meter: %s/10%s.', number_format( $meter['score'], 1 ), $meter['label'] ? ' (' . $meter['label'] . ')' : '' ) : '';
		$tail  = 'See pros and who it suits.';
		// A long summary gives way to its first sentence before anything gets cut mid-word.
		$first = preg_match( '/^(.+?[.!?])\s/u', $summary . ' ', $m ) ? $m[1] : $summary;
		foreach ( array( trim( "$summary $score $tail" ), trim( "$summary $score" ), trim( "$first $score $tail" ), trim( "$first $score" ) ) as $candidate ) {
			if ( mb_strlen( $candidate ) <= self::DESC_MAX ) {
				return $candidate;
			}
		}
		if ( $score && mb_strlen( $score ) < self::DESC_MAX - 40 ) {
			return CPS_Data::clip( $summary, self::DESC_MAX - mb_strlen( $score ) - 1 ) . ' ' . $score;
		}
		return CPS_Data::clip( $summary, self::DESC_MAX );
	}

	/**
	 * Save title, description and focus keyphrase in All in One SEO without
	 * touching anything someone wrote by hand (unless "overwrite" is on).
	 *
	 * @return array { title: string, desc: string, notes: string[] } what the page now uses.
	 */
	private static function write_aioseo( $product_id, $title, $desc, $keyphrase ) {
		$out = array( 'title' => $title, 'desc' => $desc, 'notes' => array() );
		$cls = '\AIOSEO\Plugin\Common\Models\Post';
		if ( ! class_exists( $cls ) || ! method_exists( $cls, 'getPost' ) ) {
			// Without All in One SEO the front-end filters still apply these.
			update_post_meta( $product_id, '_cps_title', $title );
			update_post_meta( $product_id, '_cps_desc', $desc );
			update_post_meta( $product_id, '_cps_fallback', 1 );
			$out['notes'][] = 'All in One SEO not found; title and description applied by this plugin';
			return $out;
		}

		$overwrite = (bool) cps_settings()['overwrite'];
		try {
			$row = $cls::getPost( $product_id );
			if ( ! $row->exists() ) {
				$row->post_id = $product_id;
			}
			$prev_title = (string) get_post_meta( $product_id, '_cps_title', true );
			$prev_desc  = (string) get_post_meta( $product_id, '_cps_desc', true );
			$cur_title  = (string) $row->title;
			$cur_desc   = (string) $row->description;

			if ( $overwrite || '' === trim( $cur_title ) || $cur_title === $prev_title ) {
				$row->title = $title;
				update_post_meta( $product_id, '_cps_title', $title );
				if ( $cur_title !== $title ) {
					$out['notes'][] = 'Search title set';
				}
			} else {
				$out['title']   = $cur_title;
				$out['notes'][] = 'Kept your own search title';
			}

			if ( $overwrite || '' === trim( $cur_desc ) || $cur_desc === $prev_desc ) {
				$row->description = $desc;
				update_post_meta( $product_id, '_cps_desc', $desc );
				if ( $cur_desc !== $desc ) {
					$out['notes'][] = 'Search description set';
				}
			} else {
				$out['desc']    = $cur_desc;
				$out['notes'][] = 'Kept your own search description';
			}

			$keys = is_string( $row->keyphrases ) ? json_decode( $row->keyphrases, true ) : json_decode( wp_json_encode( $row->keyphrases ), true );
			if ( empty( $keys['focus']['keyphrase'] ) ) {
				$keys = is_array( $keys ) ? $keys : array();
				$keys['focus']      = array( 'keyphrase' => $keyphrase, 'score' => 0, 'analysis' => new stdClass() );
				$keys['additional'] = isset( $keys['additional'] ) ? $keys['additional'] : array();
				$row->keyphrases    = wp_json_encode( $keys );
				$out['notes'][]     = 'Focus keyphrase set';
			}
			$row->save();
			delete_post_meta( $product_id, '_cps_fallback' );
		} catch ( \Throwable $e ) {
			update_post_meta( $product_id, '_cps_title', $title );
			update_post_meta( $product_id, '_cps_desc', $desc );
			update_post_meta( $product_id, '_cps_fallback', 1 );
			$out['notes'][] = 'Could not save to All in One SEO (' . $e->getMessage() . '); applied by this plugin instead';
		}
		return $out;
	}

	/**
	 * Published guides whose content links to this product, newest first.
	 *
	 * @return int[]
	 */
	public static function guides_for( $product_id ) {
		global $wpdb;
		$slug = get_post_field( 'post_name', $product_id );
		if ( ! $slug ) {
			return array();
		}
		$like = '%' . $wpdb->esc_like( '/product/' . $slug . '/' ) . '%';
		$ids  = $wpdb->get_col( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'post' AND post_status = 'publish' AND post_content LIKE %s ORDER BY post_date DESC LIMIT 6", $like ) );
		return array_map( 'intval', $ids );
	}

	/**
	 * Product IDs linked from a piece of content.
	 *
	 * @return int[]
	 */
	private static function linked_product_ids( $content ) {
		preg_match_all( '#/product/([a-z0-9-]+)/#', (string) $content, $m );
		$ids = array();
		foreach ( array_unique( $m[1] ) as $slug ) {
			$p = get_page_by_path( $slug, OBJECT, 'product' );
			if ( $p ) {
				$ids[] = (int) $p->ID;
			}
		}
		return $ids;
	}

	/**
	 * Published product IDs, for batch runs.
	 *
	 * @return int[]
	 */
	public static function product_ids( $offset, $limit ) {
		return array_map(
			'intval',
			get_posts(
				array(
					'post_type'      => 'product',
					'post_status'    => 'publish',
					'fields'         => 'ids',
					'orderby'        => 'ID',
					'order'          => 'ASC',
					'posts_per_page' => $limit,
					'offset'         => $offset,
					'no_found_rows'  => true,
				)
			)
		);
	}

	public static function product_count() {
		$c = wp_count_posts( 'product' );
		return isset( $c->publish ) ? (int) $c->publish : 0;
	}
}
