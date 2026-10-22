<?php
/**
 * Imports Amazon orders into WooCommerce and sends shipment confirmations back.
 */

defined( 'ABSPATH' ) || exit;

class OLA_Orders {

	const LAST_RUN_OPTION = 'ola_orders_last_updated_after';

	public static function init() {
		add_action( OLA_Plugin::ORDER_IMPORT_HOOK, array( __CLASS__, 'import' ) );
		add_action( 'add_meta_boxes', array( __CLASS__, 'add_meta_box' ) );
		add_action( 'woocommerce_process_shop_order_meta', array( __CLASS__, 'save_meta_box' ) );
		add_action( 'woocommerce_order_status_completed', array( __CLASS__, 'on_completed' ) );
		add_action( 'ola_confirm_shipment', array( __CLASS__, 'confirm_shipment' ) );
	}

	/* ---------------------------------------------------------------------
	 * Import
	 * ------------------------------------------------------------------- */

	/**
	 * Pulls orders updated since the last run. Safe to call repeatedly.
	 *
	 * @return int|WP_Error Number of orders created or updated.
	 */
	public static function import() {
		if ( ! OLA_Settings::is_connected() ) {
			return new WP_Error( 'ola_not_configured', __( 'Connect your Amazon account first.', 'open-lister-amazon' ) );
		}

		$since = get_option( self::LAST_RUN_OPTION );
		if ( ! $since ) {
			$since = gmdate( 'Y-m-d\TH:i:s\Z', time() - DAY_IN_SECONDS * max( 1, (int) OLA_Settings::get( 'order_days_back' ) ) );
		}
		// Amazon requires LastUpdatedAfter to be at least two minutes in the past.
		$started = gmdate( 'Y-m-d\TH:i:s\Z', time() - 3 * MINUTE_IN_SECONDS );

		$rdt = OLA_API::orders_rdt();
		if ( is_wp_error( $rdt ) ) {
			OLA_Logger::debug( 'No restricted data token; orders will import without buyer name and full address.' );
			$rdt = null;
		}

		$query = array(
			'MarketplaceIds'    => OLA_Settings::get( 'marketplace_id' ),
			'LastUpdatedAfter'  => $since,
			'MaxResultsPerPage' => 100,
		);
		$count = 0;

		do {
			$response = OLA_API::get_orders( $query, $rdt );
			if ( is_wp_error( $response ) ) {
				return $response;
			}
			$payload = isset( $response['payload'] ) ? $response['payload'] : array();

			foreach ( isset( $payload['Orders'] ) ? $payload['Orders'] : array() as $amazon_order ) {
				if ( self::upsert( $amazon_order ) ) {
					++$count;
				}
			}

			$query = ! empty( $payload['NextToken'] )
				? array(
					'MarketplaceIds' => OLA_Settings::get( 'marketplace_id' ),
					'NextToken'      => $payload['NextToken'],
				)
				: array();
		} while ( $query );

		update_option( self::LAST_RUN_OPTION, $started, false );
		if ( $count ) {
			OLA_Logger::info( "Imported or updated {$count} Amazon orders" );
		}
		return $count;
	}

	public static function find_order( $amazon_order_id ) {
		$orders = wc_get_orders(
			array(
				'limit'      => 1,
				'meta_query' => array(
					array(
						'key'   => '_ola_amazon_order_id',
						'value' => $amazon_order_id,
					),
				),
			)
		);
		return $orders ? $orders[0] : null;
	}

	private static function map_status( $amazon_status ) {
		switch ( $amazon_status ) {
			case 'Shipped':
			case 'InvoiceUnconfirmed':
				return 'completed';
			case 'Canceled':
				return 'cancelled';
			case 'Unfulfillable':
				return 'failed';
			case 'Pending':
			case 'PendingAvailability':
				return 'on-hold';
			default:
				return 'processing';
		}
	}

	/**
	 * Creates the WooCommerce order, or updates its status if it already exists.
	 */
	private static function upsert( $amazon_order ) {
		$amazon_id = $amazon_order['AmazonOrderId'];
		$status    = isset( $amazon_order['OrderStatus'] ) ? $amazon_order['OrderStatus'] : '';
		$existing  = self::find_order( $amazon_id );

		if ( $existing ) {
			$new_status = self::map_status( $status );
			if ( $existing->get_meta( '_ola_amazon_status' ) !== $status ) {
				$existing->update_meta_data( '_ola_amazon_status', $status );
				$existing->set_status( $new_status, __( 'Status updated from Amazon.', 'open-lister-amazon' ) );
				$existing->save();
				return true;
			}
			return false;
		}

		// Pending orders have no confirmed payment or prices yet; pick them up once they move on.
		if ( in_array( $status, array( 'Pending', 'PendingAvailability' ), true ) && OLA_Settings::get( 'skip_pending_orders' ) ) {
			return false;
		}
		if ( 'Canceled' === $status ) {
			return false;
		}

		$items = OLA_API::get_order_items( $amazon_id );
		if ( is_wp_error( $items ) ) {
			return false;
		}

		return (bool) self::create_order( $amazon_order, $items );
	}

	private static function create_order( $amazon_order, $items ) {
		$is_fba       = isset( $amazon_order['FulfillmentChannel'] ) && 'AFN' === $amazon_order['FulfillmentChannel'];
		$reduce_stock = ! $is_fba || OLA_Settings::get( 'reduce_stock_fba' );
		$currency     = isset( $amazon_order['OrderTotal']['CurrencyCode'] ) ? $amazon_order['OrderTotal']['CurrencyCode'] : OLA_Settings::currency();

		$order = wc_create_order( array( 'created_via' => 'amazon' ) );
		if ( is_wp_error( $order ) ) {
			OLA_Logger::error( 'Could not create WooCommerce order: ' . $order->get_error_message() );
			return null;
		}

		$order->set_currency( $currency );
		$order->set_payment_method( 'amazon' );
		$order->set_payment_method_title( 'Amazon' );
		$order->update_meta_data( '_ola_amazon_order_id', $amazon_order['AmazonOrderId'] );
		$order->update_meta_data( '_ola_amazon_status', $amazon_order['OrderStatus'] );
		$order->update_meta_data( '_ola_fulfillment_channel', $is_fba ? 'AFN' : 'MFN' );
		if ( ! empty( $amazon_order['PurchaseDate'] ) ) {
			$order->set_date_created( strtotime( $amazon_order['PurchaseDate'] ) );
		}

		self::set_addresses( $order, $amazon_order );

		$shipping_total = 0;
		$tax_total      = 0;

		foreach ( $items as $item ) {
			$qty     = max( 1, (int) $item['QuantityOrdered'] );
			$total   = isset( $item['ItemPrice']['Amount'] ) ? (float) $item['ItemPrice']['Amount'] : 0;
			$tax     = isset( $item['ItemTax']['Amount'] ) ? (float) $item['ItemTax']['Amount'] : 0;
			$product = self::product_by_sku( isset( $item['SellerSKU'] ) ? $item['SellerSKU'] : '' );

			$line = new WC_Order_Item_Product();
			$line->set_name( isset( $item['Title'] ) ? $item['Title'] : $item['SellerSKU'] );
			$line->set_quantity( $qty );
			$line->set_subtotal( $total );
			$line->set_total( $total );
			$line->set_subtotal_tax( $tax );
			$line->set_total_tax( $tax );
			if ( $product ) {
				$line->set_product( $product );
			}
			$line->add_meta_data( '_ola_order_item_id', $item['OrderItemId'], true );
			$line->add_meta_data( __( 'Amazon SKU', 'open-lister-amazon' ), $item['SellerSKU'], true );
			$order->add_item( $line );

			$shipping_total += isset( $item['ShippingPrice']['Amount'] ) ? (float) $item['ShippingPrice']['Amount'] : 0;
			$shipping_total -= isset( $item['ShippingDiscount']['Amount'] ) ? (float) $item['ShippingDiscount']['Amount'] : 0;
			$tax_total      += $tax + ( isset( $item['ShippingTax']['Amount'] ) ? (float) $item['ShippingTax']['Amount'] : 0 );
		}

		if ( $shipping_total > 0 ) {
			$shipping = new WC_Order_Item_Shipping();
			$shipping->set_method_title( isset( $amazon_order['ShipServiceLevel'] ) ? 'Amazon: ' . $amazon_order['ShipServiceLevel'] : 'Amazon shipping' );
			$shipping->set_total( $shipping_total );
			$order->add_item( $shipping );
		}

		$order->set_cart_tax( $tax_total );
		$order->set_total( isset( $amazon_order['OrderTotal']['Amount'] ) ? (float) $amazon_order['OrderTotal']['Amount'] : $order->calculate_totals( false ) );

		/* translators: 1: Amazon order ID, 2: fulfillment channel */
		$order->add_order_note( sprintf( __( 'Imported from Amazon order %1$s (%2$s).', 'open-lister-amazon' ), $amazon_order['AmazonOrderId'], $is_fba ? 'Fulfilled by Amazon' : 'Merchant fulfilled' ) );

		// Don't send WooCommerce customer emails for marketplace orders.
		add_filter( 'woocommerce_email_enabled_customer_processing_order', '__return_false' );
		add_filter( 'woocommerce_email_enabled_customer_completed_order', '__return_false' );

		$order->set_status( self::map_status( $amazon_order['OrderStatus'] ) );
		$order->save();

		if ( $reduce_stock ) {
			wc_reduce_stock_levels( $order->get_id() );
		} else {
			// Mark as handled so WooCommerce doesn't reduce FBA stock later.
			$order->get_data_store()->set_stock_reduced( $order->get_id(), true );
		}

		remove_filter( 'woocommerce_email_enabled_customer_processing_order', '__return_false' );
		remove_filter( 'woocommerce_email_enabled_customer_completed_order', '__return_false' );

		return $order;
	}

	private static function set_addresses( $order, $amazon_order ) {
		$address = isset( $amazon_order['ShippingAddress'] ) ? $amazon_order['ShippingAddress'] : array();
		$buyer   = isset( $amazon_order['BuyerInfo'] ) ? $amazon_order['BuyerInfo'] : array();

		$name  = isset( $address['Name'] ) ? $address['Name'] : ( isset( $buyer['BuyerName'] ) ? $buyer['BuyerName'] : __( 'Amazon customer', 'open-lister-amazon' ) );
		$parts = explode( ' ', trim( $name ), 2 );

		$fields = array(
			'first_name' => $parts[0],
			'last_name'  => isset( $parts[1] ) ? $parts[1] : '',
			'address_1'  => isset( $address['AddressLine1'] ) ? $address['AddressLine1'] : '',
			'address_2'  => trim( ( isset( $address['AddressLine2'] ) ? $address['AddressLine2'] : '' ) . ' ' . ( isset( $address['AddressLine3'] ) ? $address['AddressLine3'] : '' ) ),
			'city'       => isset( $address['City'] ) ? $address['City'] : '',
			'state'      => isset( $address['StateOrRegion'] ) ? $address['StateOrRegion'] : '',
			'postcode'   => isset( $address['PostalCode'] ) ? $address['PostalCode'] : '',
			'country'    => isset( $address['CountryCode'] ) ? $address['CountryCode'] : '',
		);

		foreach ( $fields as $key => $value ) {
			$order->{"set_shipping_{$key}"}( $value );
			$order->{"set_billing_{$key}"}( $value );
		}
		if ( ! empty( $address['Phone'] ) ) {
			$order->set_billing_phone( $address['Phone'] );
		}
		if ( ! empty( $buyer['BuyerEmail'] ) ) {
			$order->set_billing_email( $buyer['BuyerEmail'] );
		}
	}

	private static function product_by_sku( $sku ) {
		if ( ! $sku ) {
			return null;
		}
		$ids = get_posts(
			array(
				'post_type'      => array( 'product', 'product_variation' ),
				'post_status'    => 'any',
				'fields'         => 'ids',
				'posts_per_page' => 1,
				'meta_query'     => array(
					array(
						'key'   => '_ola_listed_sku',
						'value' => $sku,
					),
				),
			)
		);
		if ( $ids ) {
			return wc_get_product( $ids[0] );
		}
		$id = wc_get_product_id_by_sku( $sku );
		return $id ? wc_get_product( $id ) : null;
	}

	/* ---------------------------------------------------------------------
	 * Shipment confirmation
	 * ------------------------------------------------------------------- */

	public static function add_meta_box() {
		$screen = function_exists( 'wc_get_page_screen_id' ) ? wc_get_page_screen_id( 'shop-order' ) : 'shop_order';
		add_meta_box( 'ola-shipment', __( 'Amazon shipment', 'open-lister-amazon' ), array( __CLASS__, 'render_meta_box' ), $screen, 'side' );
	}

	public static function render_meta_box( $post_or_order ) {
		$order = $post_or_order instanceof WC_Order ? $post_or_order : wc_get_order( $post_or_order->ID );
		if ( ! $order || ! $order->get_meta( '_ola_amazon_order_id' ) ) {
			echo '<p>' . esc_html__( 'Not an Amazon order.', 'open-lister-amazon' ) . '</p>';
			return;
		}

		echo '<p><strong>' . esc_html__( 'Amazon order:', 'open-lister-amazon' ) . '</strong> ' . esc_html( $order->get_meta( '_ola_amazon_order_id' ) ) . '<br>';
		echo '<strong>' . esc_html__( 'Amazon status:', 'open-lister-amazon' ) . '</strong> ' . esc_html( $order->get_meta( '_ola_amazon_status' ) ) . '</p>';

		if ( 'AFN' === $order->get_meta( '_ola_fulfillment_channel' ) ) {
			echo '<p>' . esc_html__( 'Fulfilled by Amazon — nothing to ship.', 'open-lister-amazon' ) . '</p>';
			return;
		}

		$confirmed = $order->get_meta( '_ola_shipment_confirmed' );
		$carrier   = $order->get_meta( '_ola_carrier' );
		wp_nonce_field( 'ola_shipment', 'ola_shipment_nonce' );
		?>
		<p>
			<label for="ola_carrier"><?php esc_html_e( 'Carrier', 'open-lister-amazon' ); ?></label><br>
			<input type="text" id="ola_carrier" name="ola_carrier" class="widefat" value="<?php echo esc_attr( $carrier ? $carrier : OLA_Settings::get( 'default_carrier' ) ); ?>">
		</p>
		<p>
			<label for="ola_tracking"><?php esc_html_e( 'Tracking number', 'open-lister-amazon' ); ?></label><br>
			<input type="text" id="ola_tracking" name="ola_tracking" class="widefat" value="<?php echo esc_attr( $order->get_meta( '_ola_tracking' ) ); ?>">
		</p>
		<p class="description">
			<?php
			echo $confirmed
				? esc_html__( 'Shipment confirmed on Amazon.', 'open-lister-amazon' )
				: esc_html__( 'Tracking is sent to Amazon when the order is marked Completed.', 'open-lister-amazon' );
			?>
		</p>
		<?php
	}

	public static function save_meta_box( $order_id ) {
		if ( ! isset( $_POST['ola_shipment_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['ola_shipment_nonce'] ), 'ola_shipment' ) ) {
			return;
		}
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}
		$order->update_meta_data( '_ola_carrier', isset( $_POST['ola_carrier'] ) ? sanitize_text_field( wp_unslash( $_POST['ola_carrier'] ) ) : '' );
		$order->update_meta_data( '_ola_tracking', isset( $_POST['ola_tracking'] ) ? sanitize_text_field( wp_unslash( $_POST['ola_tracking'] ) ) : '' );
		$order->save_meta_data();
	}

	public static function on_completed( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order || ! $order->get_meta( '_ola_amazon_order_id' ) || 'AFN' === $order->get_meta( '_ola_fulfillment_channel' ) ) {
			return;
		}
		if ( $order->get_meta( '_ola_shipment_confirmed' ) || 'Shipped' === $order->get_meta( '_ola_amazon_status' ) ) {
			return;
		}
		as_enqueue_async_action( 'ola_confirm_shipment', array( (int) $order_id ), OLA_Listings::GROUP );
	}

	public static function confirm_shipment( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}

		$tracking = $order->get_meta( '_ola_tracking' );
		if ( ! $tracking ) {
			$order->add_order_note( __( 'Amazon shipment not confirmed: add a tracking number in the Amazon shipment box, then mark the order Completed again.', 'open-lister-amazon' ) );
			return;
		}

		$order_items = array();
		foreach ( $order->get_items() as $item ) {
			$amazon_item_id = $item->get_meta( '_ola_order_item_id' );
			if ( $amazon_item_id ) {
				$order_items[] = array(
					'orderItemId' => $amazon_item_id,
					'quantity'    => (int) $item->get_quantity(),
				);
			}
		}

		$carrier  = $order->get_meta( '_ola_carrier' );
		$response = OLA_API::confirm_shipment(
			$order->get_meta( '_ola_amazon_order_id' ),
			array(
				'marketplaceId' => OLA_Settings::get( 'marketplace_id' ),
				'packageDetail' => array(
					'packageReferenceId' => '1',
					'carrierCode'        => $carrier ? $carrier : OLA_Settings::get( 'default_carrier' ),
					'trackingNumber'     => $tracking,
					'shipDate'           => gmdate( 'Y-m-d\TH:i:s\Z' ),
					'orderItems'         => $order_items,
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			/* translators: %s: error message */
			$order->add_order_note( sprintf( __( 'Amazon shipment confirmation failed: %s', 'open-lister-amazon' ), $response->get_error_message() ) );
			return;
		}

		$order->update_meta_data( '_ola_shipment_confirmed', time() );
		$order->update_meta_data( '_ola_amazon_status', 'Shipped' );
		$order->save_meta_data();
		/* translators: %s: tracking number */
		$order->add_order_note( sprintf( __( 'Shipment confirmed on Amazon (tracking %s).', 'open-lister-amazon' ), $tracking ) );
	}
}
