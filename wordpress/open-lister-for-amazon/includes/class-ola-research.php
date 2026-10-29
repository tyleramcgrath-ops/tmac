<?php
/**
 * Product research: saved keyword searches that find Amazon's best-selling
 * items for a keyword, rank them, and suggest related categories to explore.
 * Each search can run on its own schedule.
 *
 * Data comes from the SP-API Catalog Items and Product Pricing APIs:
 * Best Sellers Rank, category, brand, image, price and number of sellers.
 * SP-API does not expose star ratings or review counts.
 */

defined( 'ABSPATH' ) || exit;

class OLA_Research {

	const OPTION      = 'ola_research_searches';
	const RESULT_KEY  = 'ola_research_result_';
	const RUN_HOOK    = 'ola_run_research';
	const PAGE_SIZE   = 20;
	const INCLUDED    = 'summaries,images,salesRanks,classifications';

	public static function init() {
		add_action( self::RUN_HOOK, array( __CLASS__, 'run' ) );
	}

	public static function schedules() {
		return array(
			'manual'     => __( 'Only when I click Run', 'open-lister-amazon' ),
			'hourly'     => __( 'Every hour', 'open-lister-amazon' ),
			'twicedaily' => __( 'Twice a day', 'open-lister-amazon' ),
			'daily'      => __( 'Every day', 'open-lister-amazon' ),
			'weekly'     => __( 'Every week', 'open-lister-amazon' ),
		);
	}

	/* ---------------------------------------------------------------------
	 * Saved searches
	 * ------------------------------------------------------------------- */

	public static function all() {
		$searches = get_option( self::OPTION, array() );
		return is_array( $searches ) ? $searches : array();
	}

	public static function get( $id ) {
		$all = self::all();
		return isset( $all[ $id ] ) ? $all[ $id ] : null;
	}

	public static function save( $search ) {
		$all = self::all();
		$id  = ! empty( $search['id'] ) ? $search['id'] : 'r' . strtolower( wp_generate_password( 10, false, false ) );

		$search = array(
			'id'          => $id,
			'keywords'    => sanitize_text_field( $search['keywords'] ),
			'max_results' => min( 40, max( 5, (int) $search['max_results'] ) ),
			'min_price'   => '' === $search['min_price'] ? '' : (float) $search['min_price'],
			'max_price'   => '' === $search['max_price'] ? '' : (float) $search['max_price'],
			'related'     => empty( $search['related'] ) ? 0 : 1,
			'schedule'    => isset( self::schedules()[ $search['schedule'] ] ) ? $search['schedule'] : 'manual',
			'start_time'  => preg_match( '/^\d{2}:\d{2}$/', $search['start_time'] ) ? $search['start_time'] : '08:00',
			'email'       => sanitize_email( $search['email'] ),
		);

		$all[ $id ] = $search;
		update_option( self::OPTION, $all, false );
		self::reschedule( $search );

		return $id;
	}

	public static function delete( $id ) {
		$all = self::all();
		unset( $all[ $id ] );
		update_option( self::OPTION, $all, false );
		delete_option( self::RESULT_KEY . $id );
		wp_clear_scheduled_hook( self::RUN_HOOK, array( $id ) );
	}

	/**
	 * Schedules the search to start at its chosen local time, then repeat.
	 */
	private static function reschedule( $search ) {
		wp_clear_scheduled_hook( self::RUN_HOOK, array( $search['id'] ) );
		if ( 'manual' === $search['schedule'] ) {
			return;
		}

		$first = new DateTime( 'today ' . $search['start_time'], wp_timezone() );
		if ( $first->getTimestamp() <= time() ) {
			$first->modify( '+1 day' );
		}
		if ( 'hourly' === $search['schedule'] ) {
			$first = new DateTime( '@' . ( time() + 5 * MINUTE_IN_SECONDS ) );
		}

		wp_schedule_event( $first->getTimestamp(), $search['schedule'], self::RUN_HOOK, array( $search['id'] ) );
	}

	public static function next_run( $id ) {
		return wp_next_scheduled( self::RUN_HOOK, array( $id ) );
	}

	public static function result( $id ) {
		return get_option( self::RESULT_KEY . $id, null );
	}

	/* ---------------------------------------------------------------------
	 * Running a search
	 * ------------------------------------------------------------------- */

	/**
	 * @return array|WP_Error The stored result.
	 */
	public static function run( $id ) {
		$search = self::get( $id );
		if ( ! $search ) {
			return new WP_Error( 'ola_research_missing', __( 'That search no longer exists.', 'open-lister-amazon' ) );
		}
		if ( ! OLA_Settings::get( 'lwa_client_id' ) || ! OLA_Settings::get( 'refresh_token' ) ) {
			return new WP_Error( 'ola_not_configured', __( 'Connect your Amazon account under Amazon > Settings first.', 'open-lister-amazon' ) );
		}

		$keyword_search = self::search( $search['keywords'], array(), (int) ceil( $search['max_results'] * 1.5 ) );
		if ( is_wp_error( $keyword_search ) ) {
			self::store_error( $id, $keyword_search );
			return $keyword_search;
		}

		$items = self::attach_prices( $keyword_search['items'] );
		$items = self::filter_price( $items, $search['min_price'], $search['max_price'] );
		$items = self::rank( $items );
		$items = array_slice( $items, 0, $search['max_results'] );

		$result = array(
			'ran_at'     => time(),
			'keywords'   => $search['keywords'],
			'total'      => $keyword_search['total'],
			'items'      => $items,
			'categories' => self::category_summary( $keyword_search['refinements'], $items ),
			'ideas'      => $search['related'] ? self::category_ideas( $items ) : array(),
			'error'      => '',
		);

		update_option( self::RESULT_KEY . $id, $result, false );
		OLA_Logger::info( "Research '{$search['keywords']}' found " . count( $items ) . ' items' );

		if ( $search['email'] ) {
			self::email( $search, $result );
		}

		return $result;
	}

	private static function store_error( $id, $error ) {
		$previous          = self::result( $id );
		$previous          = is_array( $previous ) ? $previous : array( 'items' => array(), 'categories' => array(), 'ideas' => array() );
		$previous['error'] = $error->get_error_message();
		$previous['ran_at'] = time();
		update_option( self::RESULT_KEY . $id, $previous, false );
	}

	/**
	 * Catalog keyword search, following pages up to $limit items.
	 *
	 * @return array|WP_Error [items, refinements, total]
	 */
	private static function search( $keywords, $classification_ids, $limit ) {
		$query = array(
			'marketplaceIds' => OLA_Settings::get( 'marketplace_id' ),
			'keywords'       => $keywords,
			'includedData'   => self::INCLUDED,
			'pageSize'       => self::PAGE_SIZE,
		);
		if ( $classification_ids ) {
			$query['classificationIds'] = implode( ',', (array) $classification_ids );
		}

		$items       = array();
		$refinements = array();
		$total       = 0;

		do {
			$response = OLA_API::request( 'GET', '/catalog/2022-04-01/items', $query );
			if ( is_wp_error( $response ) ) {
				if ( $items ) {
					break; // Keep what we have if a later page fails.
				}
				return $response;
			}
			if ( ! $refinements && isset( $response['refinements'] ) ) {
				$refinements = $response['refinements'];
				$total       = isset( $response['numberOfResults'] ) ? (int) $response['numberOfResults'] : 0;
			}
			$items = array_merge( $items, self::simplify_items( isset( $response['items'] ) ? $response['items'] : array() ) );

			$next = isset( $response['pagination']['nextToken'] ) ? $response['pagination']['nextToken'] : '';
			if ( $next ) {
				$query['pageToken'] = $next;
				usleep( 600000 ); // Catalog search allows ~2 requests per second.
			}
		} while ( $next && count( $items ) < $limit );

		return array(
			'items'       => $items,
			'refinements' => $refinements,
			'total'       => $total,
		);
	}

	/**
	 * Flattens catalog items into what the research screens need.
	 */
	public static function simplify_items( $raw_items ) {
		$out = array();
		foreach ( $raw_items as $item ) {
			$summary = self::for_marketplace( isset( $item['summaries'] ) ? $item['summaries'] : array() );
			$images  = self::for_marketplace( isset( $item['images'] ) ? $item['images'] : array() );
			$ranks   = self::for_marketplace( isset( $item['salesRanks'] ) ? $item['salesRanks'] : array() );
			$classes = self::for_marketplace( isset( $item['classifications'] ) ? $item['classifications'] : array() );

			$image = '';
			foreach ( isset( $images['images'] ) ? $images['images'] : array() as $img ) {
				if ( 'MAIN' === $img['variant'] ) {
					$image = $img['link'];
					break;
				}
			}

			// Best (lowest) category rank is the most specific "how well it sells" signal.
			$category_rank = null;
			$category      = '';
			$category_id   = '';
			foreach ( isset( $ranks['classificationRanks'] ) ? $ranks['classificationRanks'] : array() as $rank ) {
				if ( null === $category_rank || $rank['rank'] < $category_rank ) {
					$category_rank = (int) $rank['rank'];
					$category      = $rank['title'];
					$category_id   = $rank['classificationId'];
				}
			}
			$group_rank = null;
			$group      = '';
			foreach ( isset( $ranks['displayGroupRanks'] ) ? $ranks['displayGroupRanks'] : array() as $rank ) {
				if ( null === $group_rank || $rank['rank'] < $group_rank ) {
					$group_rank = (int) $rank['rank'];
					$group      = $rank['title'];
				}
			}

			// Parent of the item's browse category, for finding neighbouring categories.
			$parent = array();
			if ( ! empty( $classes['classifications'][0]['parent'] ) ) {
				$p      = $classes['classifications'][0]['parent'];
				$parent = array(
					'id'   => $p['classificationId'],
					'name' => $p['displayName'],
				);
			}
			if ( ! $category && ! empty( $summary['browseClassification']['displayName'] ) ) {
				$category    = $summary['browseClassification']['displayName'];
				$category_id = $summary['browseClassification']['classificationId'];
			}

			$out[] = array(
				'asin'          => $item['asin'],
				'title'         => isset( $summary['itemName'] ) ? $summary['itemName'] : $item['asin'],
				'brand'         => isset( $summary['brand'] ) ? $summary['brand'] : '',
				'image'         => $image,
				'url'           => OLA_Product_Admin::amazon_url( $item['asin'] ),
				'category'      => $category,
				'category_id'   => $category_id,
				'category_rank' => $category_rank,
				'group'         => $group,
				'group_rank'    => $group_rank,
				'parent'        => $parent,
				'price'         => null,
				'offers'        => null,
			);
		}
		return $out;
	}

	private static function for_marketplace( $list ) {
		foreach ( (array) $list as $entry ) {
			if ( isset( $entry['marketplaceId'] ) && OLA_Settings::get( 'marketplace_id' ) === $entry['marketplaceId'] ) {
				return $entry;
			}
		}
		return $list ? reset( $list ) : array();
	}

	/**
	 * Adds the Buy Box (or lowest) price and number of sellers, 20 ASINs per call.
	 * Pricing is best-effort: items keep a null price if the call is throttled.
	 */
	private static function attach_prices( $items ) {
		foreach ( array_chunk( array_keys( $items ), 20 ) as $chunk_index => $keys ) {
			if ( $chunk_index > 0 ) {
				sleep( 10 ); // getItemOffersBatch allows one call every ten seconds.
			}
			$requests = array();
			foreach ( $keys as $key ) {
				$requests[] = array(
					'uri'           => '/products/pricing/v0/items/' . $items[ $key ]['asin'] . '/offers',
					'method'        => 'GET',
					'MarketplaceId' => OLA_Settings::get( 'marketplace_id' ),
					'ItemCondition' => 'New',
				);
			}
			$response = OLA_API::request( 'POST', '/batches/products/pricing/v0/itemOffers', array(), array( 'requests' => $requests ) );
			if ( is_wp_error( $response ) || empty( $response['responses'] ) ) {
				continue;
			}
			$by_asin = array();
			foreach ( $keys as $key ) {
				$by_asin[ $items[ $key ]['asin'] ] = $key;
			}
			foreach ( $response['responses'] as $offer_response ) {
				$payload = isset( $offer_response['body']['payload'] ) ? $offer_response['body']['payload'] : array();
				if ( empty( $payload['Summary'] ) || empty( $payload['ASIN'] ) || ! isset( $by_asin[ $payload['ASIN'] ] ) ) {
					continue;
				}
				$key     = $by_asin[ $payload['ASIN'] ];
				$summary = $payload['Summary'];
				$price   = null;
				if ( ! empty( $summary['BuyBoxPrices'][0]['LandedPrice']['Amount'] ) ) {
					$price = (float) $summary['BuyBoxPrices'][0]['LandedPrice']['Amount'];
				} elseif ( ! empty( $summary['LowestPrices'][0]['LandedPrice']['Amount'] ) ) {
					$price = (float) $summary['LowestPrices'][0]['LandedPrice']['Amount'];
				}
				$items[ $key ]['price']  = $price;
				$items[ $key ]['offers'] = isset( $summary['TotalOfferCount'] ) ? (int) $summary['TotalOfferCount'] : null;
			}
		}
		return $items;
	}

	private static function filter_price( $items, $min, $max ) {
		if ( '' === $min && '' === $max ) {
			return $items;
		}
		return array_values(
			array_filter(
				$items,
				function ( $item ) use ( $min, $max ) {
					if ( null === $item['price'] ) {
						return true; // Unknown price: keep it rather than hide a possible winner.
					}
					return ( '' === $min || $item['price'] >= $min ) && ( '' === $max || $item['price'] <= $max );
				}
			)
		);
	}

	/**
	 * Orders items best-selling first and gives each a 0-100 score.
	 * Score is mostly sales rank (log scale), with a small bonus for fewer competing sellers.
	 */
	private static function rank( $items ) {
		foreach ( $items as &$item ) {
			$rank = null !== $item['category_rank'] ? $item['category_rank'] : ( null !== $item['group_rank'] ? $item['group_rank'] * 10 : null );
			if ( null === $rank ) {
				$item['score'] = 0;
				continue;
			}
			// Rank 1 scores 90, rank 1,000 about 50, rank 1,000,000 about 10.
			$score = 90 - 13.3 * log10( max( 1, $rank ) );
			if ( null !== $item['offers'] ) {
				$score += $item['offers'] <= 3 ? 10 : ( $item['offers'] <= 10 ? 5 : 0 );
			}
			$item['score'] = (int) round( max( 0, min( 100, $score ) ) );
		}
		unset( $item );

		usort(
			$items,
			function ( $a, $b ) {
				return $b['score'] <=> $a['score'];
			}
		);
		return $items;
	}

	/**
	 * Categories the keyword shows up in (from Amazon's search refinements),
	 * plus where the top items actually rank.
	 */
	private static function category_summary( $refinements, $items ) {
		$categories = array();
		foreach ( isset( $refinements['classifications'] ) ? $refinements['classifications'] : array() as $class ) {
			$categories[ $class['classificationId'] ] = array(
				'id'      => $class['classificationId'],
				'name'    => $class['displayName'],
				'results' => (int) $class['numberOfResults'],
				'top'     => 0,
			);
		}
		foreach ( $items as $item ) {
			if ( ! $item['category_id'] ) {
				continue;
			}
			if ( ! isset( $categories[ $item['category_id'] ] ) ) {
				$categories[ $item['category_id'] ] = array(
					'id'      => $item['category_id'],
					'name'    => $item['category'],
					'results' => 0,
					'top'     => 0,
				);
			}
			++$categories[ $item['category_id'] ]['top'];
		}

		uasort(
			$categories,
			function ( $a, $b ) {
				return array( $b['top'], $b['results'] ) <=> array( $a['top'], $a['results'] );
			}
		);
		return array_slice( array_values( $categories ), 0, 12 );
	}

	/**
	 * "People shopping here also buy": best sellers from neighbouring categories.
	 * Takes the parent category of the top results (e.g. Men's Clothing for
	 * Men's T-Shirts) and finds the best-ranked item in each sibling category.
	 */
	private static function category_ideas( $items ) {
		$parents = array();
		foreach ( array_slice( $items, 0, 10 ) as $item ) {
			if ( ! empty( $item['parent']['id'] ) ) {
				$parents[ $item['parent']['id'] ] = $item['parent']['name'];
			}
		}
		$own_categories = wp_list_pluck( $items, 'category_id' );

		$ideas = array();
		foreach ( array_slice( $parents, 0, 2, true ) as $parent_id => $parent_name ) {
			usleep( 600000 );
			$found = self::search( $parent_name, array( $parent_id ), self::PAGE_SIZE * 2 );
			if ( is_wp_error( $found ) ) {
				continue;
			}
			foreach ( self::rank( $found['items'] ) as $candidate ) {
				$cat = $candidate['category_id'];
				if ( ! $cat || in_array( $cat, $own_categories, true ) ) {
					continue;
				}
				if ( ! isset( $ideas[ $cat ] ) ) {
					$ideas[ $cat ] = array(
						'category' => $candidate['category'],
						'parent'   => $parent_name,
						'items'    => array(),
					);
				}
				if ( count( $ideas[ $cat ]['items'] ) < 3 ) {
					$ideas[ $cat ]['items'][] = $candidate;
				}
			}
		}

		uasort(
			$ideas,
			function ( $a, $b ) {
				return $b['items'][0]['score'] <=> $a['items'][0]['score'];
			}
		);
		return array_slice( array_values( $ideas ), 0, 8 );
	}

	private static function email( $search, $result ) {
		$lines = array();
		foreach ( array_slice( $result['items'], 0, 10 ) as $i => $item ) {
			$lines[] = sprintf(
				'%d. %s — score %d, #%s in %s%s — %s',
				$i + 1,
				$item['title'],
				$item['score'],
				null !== $item['category_rank'] ? number_format_i18n( $item['category_rank'] ) : '?',
				$item['category'],
				null !== $item['price'] ? ', ' . OLA_Settings::currency() . ' ' . number_format_i18n( $item['price'], 2 ) : '',
				$item['url']
			);
		}
		if ( $result['ideas'] ) {
			$lines[] = '';
			$lines[] = __( 'Ideas from similar categories:', 'open-lister-amazon' );
			foreach ( $result['ideas'] as $idea ) {
				$lines[] = '- ' . $idea['category'] . ': ' . $idea['items'][0]['title'] . ' — ' . $idea['items'][0]['url'];
			}
		}
		$lines[] = '';
		$lines[] = admin_url( 'admin.php?page=ola-research&search=' . rawurlencode( $search['id'] ) );

		/* translators: %s: search keywords */
		wp_mail( $search['email'], sprintf( __( 'Amazon research: %s', 'open-lister-amazon' ), $search['keywords'] ), implode( "\n", $lines ) );
	}

	/**
	 * Creates a draft WooCommerce product set up to sell against this ASIN.
	 */
	public static function create_draft_product( $item ) {
		$product = new WC_Product_Simple();
		$product->set_name( $item['title'] );
		$product->set_status( 'draft' );
		if ( null !== $item['price'] ) {
			$product->set_regular_price( (string) $item['price'] );
		}
		$product->update_meta_data( '_ola_mode', 'match' );
		$product->update_meta_data( '_ola_asin', $item['asin'] );
		$product->update_meta_data( '_ola_research_source', $item['url'] );
		return $product->save();
	}
}
