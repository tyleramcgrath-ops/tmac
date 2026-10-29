<?php
/**
 * What visitors and search engines see: Product schema with the store's own
 * Comfy Meter review, the "Featured in our guides" box, and the search title
 * and description when All in One SEO can't hold them.
 *
 * @package comfy-product-seo
 */

defined( 'ABSPATH' ) || exit;

class CPS_Frontend {

	public static function init() {
		$s = cps_settings();
		if ( $s['schema'] ) {
			add_action( 'wp_head', array( __CLASS__, 'schema' ), 30 );
		}
		if ( $s['guides_box'] ) {
			add_action( 'woocommerce_after_single_product_summary', array( __CLASS__, 'guides_box' ), 12 );
		}
		if ( defined( 'AIOSEO_VERSION' ) ) {
			add_filter( 'aioseo_title', array( __CLASS__, 'aioseo_title' ) );
			add_filter( 'aioseo_description', array( __CLASS__, 'aioseo_description' ) );
		} else {
			add_filter( 'pre_get_document_title', array( __CLASS__, 'document_title' ), 20 );
			add_action( 'wp_head', array( __CLASS__, 'meta_description' ), 1 );
		}
	}

	/**
	 * Product schema. The review is the store's own Comfy Meter, never Amazon's star rating.
	 */
	public static function schema() {
		if ( ! is_singular( 'product' ) ) {
			return;
		}
		$product = wc_get_product( get_queried_object_id() );
		if ( ! $product ) {
			return;
		}
		list( $full ) = CPS_Data::names( $product );
		$url          = get_permalink( $product->get_id() );
		$site         = wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );
		$data         = array(
			'@context' => 'https://schema.org',
			'@type'    => 'Product',
			'@id'      => $url . '#product',
			'name'     => $full,
			'url'      => $url,
		);
		$summary = CPS_Data::summary( $product );
		if ( $summary ) {
			$data['description'] = $summary;
		}
		$image = CPS_Data::image( $product );
		if ( $image ) {
			$data['image'] = array( $image );
		}
		if ( $product->get_sku() ) {
			$data['sku'] = $product->get_sku();
		}
		$brand = CPS_Data::brand( $product );
		if ( $brand ) {
			$data['brand'] = array( '@type' => 'Brand', 'name' => $brand );
		}
		$category = CPS_Data::category_path( $product );
		if ( $category ) {
			$data['category'] = $category;
		}

		$meter = CPS_Data::meter( $product );
		if ( $meter ) {
			$review = array(
				'@type'         => 'Review',
				'name'          => trim( $full . ' review' ),
				'author'        => array( '@type' => 'Organization', 'name' => $site, 'url' => home_url( '/' ) ),
				'publisher'     => array( '@type' => 'Organization', 'name' => $site ),
				'datePublished' => get_the_date( 'c', $product->get_id() ),
				'reviewRating'  => array(
					'@type'       => 'Rating',
					'ratingValue' => $meter['score'],
					'bestRating'  => 10,
					'worstRating' => 1,
				),
			);
			if ( $meter['label'] ) {
				$review['reviewBody'] = sprintf( 'Comfy Meter %s/10 (%s).', number_format( $meter['score'], 1 ), $meter['label'] );
			}
			$loves = CPS_Data::loves( $product );
			if ( $loves ) {
				$review['positiveNotes'] = array(
					'@type'           => 'ItemList',
					'itemListElement' => array_map(
						function ( $text, $i ) {
							return array( '@type' => 'ListItem', 'position' => $i + 1, 'name' => $text );
						},
						$loves,
						array_keys( $loves )
					),
				);
			}
			$data['review'] = $review;
		}

		// Google needs a review, rating or offer to show a product result; without a Comfy Meter, skip it.
		if ( empty( $data['review'] ) ) {
			return;
		}
		echo "\n<script type=\"application/ld+json\" class=\"comfy-product-seo\">" . wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "</script>\n";
	}

	/**
	 * "Featured in our guides" under the product summary.
	 */
	public static function guides_box() {
		$ids = array_filter( array_map( 'intval', (array) get_post_meta( get_the_ID(), '_cps_guides', true ) ) );
		$ids = array_values( array_filter( $ids, function ( $id ) { return 'publish' === get_post_status( $id ); } ) );
		if ( ! $ids ) {
			return;
		}
		?>
		<section class="cps-guides" aria-labelledby="cps-guides-title">
			<h2 id="cps-guides-title"><?php esc_html_e( 'Featured in our guides', 'comfy-product-seo' ); ?></h2>
			<ul>
				<?php foreach ( array_slice( $ids, 0, 4 ) as $id ) : ?>
					<li><a href="<?php echo esc_url( get_permalink( $id ) ); ?>"><?php echo esc_html( get_the_title( $id ) ); ?></a></li>
				<?php endforeach; ?>
			</ul>
		</section>
		<style>.cps-guides{grid-column:1/-1;margin:28px 0;padding:22px 26px;border-radius:24px;background:rgba(255,255,255,.75)}.cps-guides h2{font-size:22px;margin:0 0 10px}.cps-guides ul{margin:0;padding-left:20px}.cps-guides li{margin:6px 0}</style>
		<?php
	}

	/**
	 * Values to apply ourselves (only when All in One SEO couldn't store them).
	 */
	private static function fallback( $key ) {
		if ( ! is_singular( 'product' ) ) {
			return '';
		}
		$id = get_queried_object_id();
		if ( defined( 'AIOSEO_VERSION' ) && ! get_post_meta( $id, '_cps_fallback', true ) ) {
			return '';
		}
		return (string) get_post_meta( $id, $key, true );
	}

	public static function aioseo_title( $title ) {
		$t = self::fallback( '_cps_title' );
		return $t ? $t : $title;
	}

	public static function aioseo_description( $desc ) {
		$d = self::fallback( '_cps_desc' );
		return $d ? $d : $desc;
	}

	public static function document_title( $title ) {
		$t = self::fallback( '_cps_title' );
		return $t ? $t : $title;
	}

	public static function meta_description() {
		$d = self::fallback( '_cps_desc' );
		if ( $d ) {
			echo '<meta name="description" content="' . esc_attr( $d ) . "\" />\n";
		}
	}
}
