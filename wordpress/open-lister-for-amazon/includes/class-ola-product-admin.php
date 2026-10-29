<?php
/**
 * Product editor integration: the "Amazon" product data tab, variation
 * fields, the products list column, bulk actions and AJAX helpers.
 */

defined( 'ABSPATH' ) || exit;

class OLA_Product_Admin {

	/** Product-level fields: key => sanitizer. */
	const FIELDS = array(
		'mode'             => 'key',
		'asin'             => 'text',
		'sku'              => 'text',
		'condition'        => 'text',
		'fulfillment'      => 'key',
		'price'            => 'price',
		'product_type'     => 'text',
		'title'            => 'text',
		'brand'            => 'text',
		'bullets'          => 'textarea',
		'id_type'          => 'key',
		'id_value'         => 'text',
		'variation_theme'  => 'text',
		'attribute_map'    => 'json',
		'extra_attributes' => 'json',
	);

	const VARIATION_FIELDS = array( 'asin', 'sku', 'price', 'id_value' );

	public static function init() {
		add_filter( 'woocommerce_product_data_tabs', array( __CLASS__, 'add_tab' ) );
		add_action( 'woocommerce_product_data_panels', array( __CLASS__, 'render_panel' ) );
		add_action( 'woocommerce_admin_process_product_object', array( __CLASS__, 'save_product' ) );

		add_action( 'woocommerce_product_after_variable_attributes', array( __CLASS__, 'render_variation_fields' ), 10, 3 );
		add_action( 'woocommerce_save_product_variation', array( __CLASS__, 'save_variation' ), 10, 2 );

		add_filter( 'manage_edit-product_columns', array( __CLASS__, 'add_column' ) );
		add_action( 'manage_product_posts_custom_column', array( __CLASS__, 'render_column' ), 10, 2 );
		add_filter( 'bulk_actions-edit-product', array( __CLASS__, 'bulk_actions' ) );
		add_filter( 'handle_bulk_actions-edit-product', array( __CLASS__, 'handle_bulk' ), 10, 3 );
		add_action( 'admin_notices', array( __CLASS__, 'bulk_notice' ) );

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );
		add_action( 'wp_ajax_ola_product_types', array( __CLASS__, 'ajax_product_types' ) );
		add_action( 'wp_ajax_ola_find_asin', array( __CLASS__, 'ajax_find_asin' ) );
		add_action( 'wp_ajax_ola_validate', array( __CLASS__, 'ajax_validate' ) );
		add_action( 'wp_ajax_ola_action', array( __CLASS__, 'ajax_action' ) );
	}

	public static function assets( $hook ) {
		$screen = get_current_screen();
		if ( ! $screen || ( 'product' !== $screen->post_type && false === strpos( $hook, 'ola-' ) ) ) {
			return;
		}
		wp_enqueue_style( 'ola-admin', OLA_URL . 'assets/admin.css', array(), OLA_VERSION );
		wp_enqueue_script( 'ola-admin', OLA_URL . 'assets/admin.js', array( 'jquery' ), OLA_VERSION, true );
		wp_localize_script(
			'ola-admin',
			'OLA',
			array(
				'ajax'  => admin_url( 'admin-ajax.php' ),
				'nonce' => wp_create_nonce( 'ola_ajax' ),
			)
		);
	}

	/* ---------------------------------------------------------------------
	 * Product data tab
	 * ------------------------------------------------------------------- */

	public static function add_tab( $tabs ) {
		$tabs['ola_amazon'] = array(
			'label'    => __( 'Amazon', 'open-lister-amazon' ),
			'target'   => 'ola_amazon_panel',
			'class'    => array(),
			'priority' => 80,
		);
		return $tabs;
	}

	private static function val( $post_id, $key ) {
		return get_post_meta( $post_id, '_ola_' . $key, true );
	}

	public static function render_panel() {
		global $post;
		$id     = $post->ID;
		$mode   = self::val( $id, 'mode' ) ? self::val( $id, 'mode' ) : 'match';
		$status = OLA_Listings::status( $id );
		?>
		<div id="ola_amazon_panel" class="panel woocommerce_options_panel hidden" data-product-id="<?php echo esc_attr( $id ); ?>">
			<?php wp_nonce_field( 'ola_product', 'ola_product_nonce' ); ?>

			<div class="ola-status-bar">
				<?php self::render_status( $id ); ?>
				<span class="ola-actions">
					<button type="button" class="button ola-action" data-action="submit"><?php echo $status && 'ended' !== $status ? esc_html__( 'Update on Amazon', 'open-lister-amazon' ) : esc_html__( 'List on Amazon', 'open-lister-amazon' ); ?></button>
					<button type="button" class="button ola-validate"><?php esc_html_e( 'Check with Amazon', 'open-lister-amazon' ); ?></button>
					<?php if ( OLA_Listings::is_listed( $id ) ) : ?>
						<button type="button" class="button ola-action" data-action="refresh"><?php esc_html_e( 'Refresh status', 'open-lister-amazon' ); ?></button>
						<button type="button" class="button ola-action ola-danger" data-action="end"><?php esc_html_e( 'End listing', 'open-lister-amazon' ); ?></button>
					<?php endif; ?>
				</span>
				<p class="description"><?php esc_html_e( 'Save the product first so Amazon gets your latest changes.', 'open-lister-amazon' ); ?></p>
				<div class="ola-result"></div>
			</div>

			<div class="options_group">
				<?php
				woocommerce_wp_radio(
					array(
						'id'      => 'ola_mode',
						'label'   => __( 'How to list', 'open-lister-amazon' ),
						'value'   => $mode,
						'options' => array(
							'match'  => __( 'Sell on an existing Amazon product page (match by ASIN)', 'open-lister-amazon' ),
							'create' => __( 'Create a new Amazon product (your own brand or a product not on Amazon yet)', 'open-lister-amazon' ),
						),
					)
				);
				?>
				<p class="form-field">
					<label for="ola_asin"><?php esc_html_e( 'ASIN', 'open-lister-amazon' ); ?></label>
					<input type="text" class="short" id="ola_asin" name="ola_asin" value="<?php echo esc_attr( self::val( $id, 'asin' ) ); ?>" placeholder="B0XXXXXXXX">
					<button type="button" class="button ola-find-asin"><?php esc_html_e( 'Find on Amazon', 'open-lister-amazon' ); ?></button>
				</p>
				<div class="ola-asin-results"></div>
				<?php
				woocommerce_wp_text_input(
					array(
						'id'          => 'ola_sku',
						'label'       => __( 'Amazon SKU', 'open-lister-amazon' ),
						'value'       => self::val( $id, 'sku' ),
						'placeholder' => __( 'Same as WooCommerce SKU', 'open-lister-amazon' ),
					)
				);
				woocommerce_wp_select(
					array(
						'id'      => 'ola_condition',
						'label'   => __( 'Condition', 'open-lister-amazon' ),
						'value'   => self::val( $id, 'condition' ),
						'options' => array_merge( array( '' => __( 'Store default', 'open-lister-amazon' ) ), self::conditions() ),
					)
				);
				woocommerce_wp_select(
					array(
						'id'      => 'ola_fulfillment',
						'label'   => __( 'Fulfillment', 'open-lister-amazon' ),
						'value'   => self::val( $id, 'fulfillment' ),
						'options' => array(
							'mfn' => __( 'I ship it (merchant fulfilled)', 'open-lister-amazon' ),
							'afn' => __( 'Fulfilled by Amazon (FBA)', 'open-lister-amazon' ),
						),
					)
				);
				woocommerce_wp_text_input(
					array(
						'id'          => 'ola_price',
						'label'       => __( 'Amazon price', 'open-lister-amazon' ) . ' (' . OLA_Settings::currency() . ')',
						'value'       => self::val( $id, 'price' ),
						'data_type'   => 'price',
						'placeholder' => __( 'WooCommerce price + store price rule', 'open-lister-amazon' ),
					)
				);
				?>
			</div>

			<div class="options_group ola-create-only">
				<p class="form-field">
					<label for="ola_product_type"><?php esc_html_e( 'Amazon product type', 'open-lister-amazon' ); ?></label>
					<input type="text" class="short" id="ola_product_type" name="ola_product_type" value="<?php echo esc_attr( self::val( $id, 'product_type' ) ); ?>" placeholder="SHIRT">
					<button type="button" class="button ola-search-types"><?php esc_html_e( 'Search types', 'open-lister-amazon' ); ?></button>
				</p>
				<div class="ola-type-results"></div>
				<?php
				woocommerce_wp_text_input(
					array(
						'id'          => 'ola_title',
						'label'       => __( 'Amazon title', 'open-lister-amazon' ),
						'value'       => self::val( $id, 'title' ),
						'placeholder' => __( 'Product name', 'open-lister-amazon' ),
					)
				);
				woocommerce_wp_text_input(
					array(
						'id'          => 'ola_brand',
						'label'       => __( 'Brand', 'open-lister-amazon' ),
						'value'       => self::val( $id, 'brand' ),
						'placeholder' => OLA_Settings::get( 'default_brand' ),
					)
				);
				woocommerce_wp_textarea_input(
					array(
						'id'          => 'ola_bullets',
						'label'       => __( 'Bullet points', 'open-lister-amazon' ),
						'value'       => self::val( $id, 'bullets' ),
						'description' => __( 'One per line, up to five. Defaults to the short description.', 'open-lister-amazon' ),
						'desc_tip'    => true,
					)
				);
				woocommerce_wp_select(
					array(
						'id'      => 'ola_id_type',
						'label'   => __( 'Product ID type', 'open-lister-amazon' ),
						'value'   => self::val( $id, 'id_type' ),
						'options' => array(
							''       => __( 'Detect from the number', 'open-lister-amazon' ),
							'upc'    => 'UPC',
							'ean'    => 'EAN',
							'gtin'   => 'GTIN',
							'isbn'   => 'ISBN',
							'exempt' => __( 'GTIN exemption (approved brands)', 'open-lister-amazon' ),
						),
					)
				);
				woocommerce_wp_text_input(
					array(
						'id'          => 'ola_id_value',
						'label'       => __( 'UPC / EAN / GTIN', 'open-lister-amazon' ),
						'value'       => self::val( $id, 'id_value' ),
						'placeholder' => __( 'Uses the WooCommerce GTIN field when empty', 'open-lister-amazon' ),
					)
				);
				woocommerce_wp_text_input(
					array(
						'id'          => 'ola_variation_theme',
						'label'       => __( 'Variation theme', 'open-lister-amazon' ),
						'value'       => self::val( $id, 'variation_theme' ),
						'placeholder' => 'SIZE/COLOR',
						'description' => __( 'Variable products only. Must be a theme your product type allows.', 'open-lister-amazon' ),
						'desc_tip'    => true,
					)
				);
				woocommerce_wp_textarea_input(
					array(
						'id'          => 'ola_attribute_map',
						'label'       => __( 'Attribute mapping (JSON)', 'open-lister-amazon' ),
						'value'       => self::val( $id, 'attribute_map' ),
						'placeholder' => '{"pa_color": "color", "pa_size": "size"}',
						'description' => __( 'Which WooCommerce attribute fills which Amazon attribute. Color and size are mapped automatically.', 'open-lister-amazon' ),
						'desc_tip'    => true,
					)
				);
				woocommerce_wp_textarea_input(
					array(
						'id'          => 'ola_extra_attributes',
						'label'       => __( 'More Amazon attributes (JSON)', 'open-lister-amazon' ),
						'value'       => self::val( $id, 'extra_attributes' ),
						'placeholder' => '{"manufacturer": [{"value": "Acme", "language_tag": "en_US"}], "country_of_origin": "US"}',
						'description' => __( 'Anything else your product type requires. Use "Check with Amazon" to see what is missing.', 'open-lister-amazon' ),
						'desc_tip'    => true,
					)
				);
				?>
			</div>
		</div>
		<?php
	}

	public static function render_status( $id ) {
		$status = OLA_Listings::status( $id );
		$issues = get_post_meta( $id, '_ola_issues', true );
		$asin   = self::val( $id, 'asin' );
		$label  = $status && isset( OLA_Listings::STATUS_LABELS[ $status ] ) ? OLA_Listings::STATUS_LABELS[ $status ] : __( 'Not listed', 'open-lister-amazon' );

		echo '<span class="ola-badge ola-' . esc_attr( $status ? $status : 'none' ) . '">' . esc_html( $label ) . '</span>';
		if ( $asin && in_array( $status, array( 'active', 'inactive', 'submitted' ), true ) ) {
			echo ' <a href="' . esc_url( self::amazon_url( $asin ) ) . '" target="_blank" rel="noopener">' . esc_html( $asin ) . '</a>';
		}
		if ( is_array( $issues ) && $issues ) {
			echo '<ul class="ola-issues">';
			foreach ( array_slice( $issues, 0, 10 ) as $issue ) {
				$severity = isset( $issue['severity'] ) ? $issue['severity'] : 'INFO';
				$attrs    = ! empty( $issue['attributeNames'] ) ? ' [' . implode( ', ', $issue['attributeNames'] ) . ']' : '';
				echo '<li class="ola-sev-' . esc_attr( strtolower( $severity ) ) . '">' . esc_html( $severity . ': ' . ( isset( $issue['message'] ) ? $issue['message'] : '' ) . $attrs ) . '</li>';
			}
			echo '</ul>';
		}
	}

	public static function amazon_url( $asin ) {
		$domains = array(
			'ATVPDKIKX0DER'  => 'amazon.com',
			'A2EUQ1WTGCTBG2' => 'amazon.ca',
			'A1AM78C64UM0Y8' => 'amazon.com.mx',
			'A2Q3Y263D00KWC' => 'amazon.com.br',
			'A1F83G8C2ARO7P' => 'amazon.co.uk',
			'A28R8C7NBKEWEA' => 'amazon.ie',
			'A1PA6795UKMFR9' => 'amazon.de',
			'A13V1IB3VIYZZH' => 'amazon.fr',
			'APJ6JRA9NG5V4'  => 'amazon.it',
			'A1RKKUPIHCS9HS' => 'amazon.es',
			'A1805IZSGTT6HS' => 'amazon.nl',
			'AMEN7PMS3EDWL'  => 'amazon.com.be',
			'A2NODRKZP88ZB9' => 'amazon.se',
			'A1C3SOZRARQ6R3' => 'amazon.pl',
			'A33AVAJ2PDY3EV' => 'amazon.com.tr',
			'A2VIGQ35RCS4UG' => 'amazon.ae',
			'A17E79C6D8DWNP' => 'amazon.sa',
			'ARBP9OOSHTCHU'  => 'amazon.eg',
			'A21TJRUUN4KGV'  => 'amazon.in',
			'A1VC38T7YXB528' => 'amazon.co.jp',
			'A39IBJ37TRP1C6' => 'amazon.com.au',
			'A19VAU5U5O7RUS' => 'amazon.sg',
		);
		$id = OLA_Settings::get( 'marketplace_id' );
		return 'https://www.' . ( isset( $domains[ $id ] ) ? $domains[ $id ] : 'amazon.com' ) . '/dp/' . rawurlencode( $asin );
	}

	public static function conditions() {
		return array(
			'new_new'                      => __( 'New', 'open-lister-amazon' ),
			'new_open_box'                 => __( 'New – open box', 'open-lister-amazon' ),
			'used_like_new'                => __( 'Used – like new', 'open-lister-amazon' ),
			'used_very_good'               => __( 'Used – very good', 'open-lister-amazon' ),
			'used_good'                    => __( 'Used – good', 'open-lister-amazon' ),
			'used_acceptable'              => __( 'Used – acceptable', 'open-lister-amazon' ),
			'refurbished_refurbished'      => __( 'Refurbished', 'open-lister-amazon' ),
			'collectible_like_new'         => __( 'Collectible – like new', 'open-lister-amazon' ),
			'collectible_very_good'        => __( 'Collectible – very good', 'open-lister-amazon' ),
			'collectible_good'             => __( 'Collectible – good', 'open-lister-amazon' ),
			'collectible_acceptable'       => __( 'Collectible – acceptable', 'open-lister-amazon' ),
		);
	}

	private static function sanitize( $type, $raw ) {
		$raw = wp_unslash( $raw );
		switch ( $type ) {
			case 'key':
				return sanitize_key( $raw );
			case 'price':
				return '' === trim( $raw ) ? '' : wc_format_decimal( $raw );
			case 'textarea':
				return sanitize_textarea_field( $raw );
			case 'json':
				$raw = trim( $raw );
				return ( '' === $raw || is_array( json_decode( $raw, true ) ) ) ? $raw : null;
			default:
				return sanitize_text_field( $raw );
		}
	}

	public static function save_product( $product ) {
		if ( ! isset( $_POST['ola_product_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['ola_product_nonce'] ), 'ola_product' ) ) {
			return;
		}
		foreach ( self::FIELDS as $key => $type ) {
			if ( ! isset( $_POST[ 'ola_' . $key ] ) ) {
				continue;
			}
			$value = self::sanitize( $type, $_POST[ 'ola_' . $key ] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- sanitized in self::sanitize().
			if ( null === $value ) {
				WC_Admin_Meta_Boxes::add_error( __( 'Amazon: one of the JSON fields is not valid JSON and was not saved.', 'open-lister-amazon' ) );
				continue;
			}
			$product->update_meta_data( '_ola_' . $key, $value );
		}
	}

	/* ---------------------------------------------------------------------
	 * Variations
	 * ------------------------------------------------------------------- */

	public static function render_variation_fields( $loop, $variation_data, $variation ) {
		$id = $variation->ID;
		echo '<div class="ola-variation-fields"><p><strong>' . esc_html__( 'Amazon', 'open-lister-amazon' ) . '</strong> ';
		self::render_status( $id );
		echo '</p>';

		woocommerce_wp_checkbox(
			array(
				'id'            => "ola_var_enabled_{$loop}",
				'name'          => "ola_var_enabled[{$loop}]",
				'label'         => __( 'List this variation', 'open-lister-amazon' ),
				'value'         => 'no' === get_post_meta( $id, '_ola_enabled', true ) ? 'no' : 'yes',
				'cbvalue'       => 'yes',
				'wrapper_class' => 'form-row form-row-full',
			)
		);

		$labels = array(
			'asin'     => __( 'Amazon ASIN', 'open-lister-amazon' ),
			'sku'      => __( 'Amazon SKU', 'open-lister-amazon' ),
			'price'    => __( 'Amazon price', 'open-lister-amazon' ),
			'id_value' => __( 'UPC / EAN / GTIN', 'open-lister-amazon' ),
		);
		$i = 0;
		foreach ( $labels as $key => $label ) {
			woocommerce_wp_text_input(
				array(
					'id'            => "ola_var_{$key}_{$loop}",
					'name'          => "ola_var_{$key}[{$loop}]",
					'label'         => $label,
					'value'         => get_post_meta( $id, '_ola_' . $key, true ),
					'wrapper_class' => 'form-row ' . ( 0 === $i++ % 2 ? 'form-row-first' : 'form-row-last' ),
				)
			);
		}
		echo '</div>';
	}

	public static function save_variation( $variation_id, $loop ) {
		check_ajax_referer( 'save-variations', 'security' );
		foreach ( self::VARIATION_FIELDS as $key ) {
			if ( isset( $_POST[ 'ola_var_' . $key ][ $loop ] ) ) {
				$value = self::sanitize( 'price' === $key ? 'price' : 'text', $_POST[ 'ola_var_' . $key ][ $loop ] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
				update_post_meta( $variation_id, '_ola_' . $key, $value );
			}
		}
		update_post_meta( $variation_id, '_ola_enabled', isset( $_POST['ola_var_enabled'][ $loop ] ) ? 'yes' : 'no' );
	}

	/* ---------------------------------------------------------------------
	 * Products list
	 * ------------------------------------------------------------------- */

	public static function add_column( $columns ) {
		$columns['ola_amazon'] = __( 'Amazon', 'open-lister-amazon' );
		return $columns;
	}

	public static function render_column( $column, $post_id ) {
		if ( 'ola_amazon' !== $column ) {
			return;
		}
		$status = OLA_Listings::status( $post_id );
		if ( ! $status ) {
			echo '<span class="ola-muted">—</span>';
			return;
		}
		echo '<span class="ola-badge ola-' . esc_attr( $status ) . '">' . esc_html( OLA_Listings::STATUS_LABELS[ $status ] ?? $status ) . '</span>';
	}

	public static function bulk_actions( $actions ) {
		$actions['ola_list']    = __( 'List on Amazon', 'open-lister-amazon' );
		$actions['ola_sync']    = __( 'Sync price & stock to Amazon', 'open-lister-amazon' );
		$actions['ola_refresh'] = __( 'Refresh Amazon status', 'open-lister-amazon' );
		$actions['ola_end']     = __( 'End Amazon listing', 'open-lister-amazon' );
		return $actions;
	}

	public static function handle_bulk( $redirect, $action, $ids ) {
		$map = array(
			'ola_list'    => 'queue_submit',
			'ola_sync'    => 'queue_sync',
			'ola_refresh' => 'queue_refresh',
			'ola_end'     => 'queue_end',
		);
		if ( ! isset( $map[ $action ] ) || ! current_user_can( 'edit_products' ) ) {
			return $redirect;
		}
		foreach ( $ids as $id ) {
			call_user_func( array( 'OLA_Listings', $map[ $action ] ), (int) $id );
		}
		return add_query_arg( 'ola_queued', count( $ids ), $redirect );
	}

	public static function bulk_notice() {
		if ( empty( $_GET['ola_queued'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		$count = absint( $_GET['ola_queued'] ); // phpcs:ignore WordPress.Security.NonceVerification
		/* translators: %d: number of products */
		echo '<div class="notice notice-success is-dismissible"><p>' . esc_html( sprintf( _n( '%d product queued for Amazon. It runs in the background within a minute or two.', '%d products queued for Amazon. They run in the background within a minute or two.', $count, 'open-lister-amazon' ), $count ) ) . '</p></div>';
	}

	/* ---------------------------------------------------------------------
	 * AJAX
	 * ------------------------------------------------------------------- */

	private static function ajax_guard() {
		check_ajax_referer( 'ola_ajax', 'nonce' );
		if ( ! current_user_can( 'edit_products' ) ) {
			wp_send_json_error( array( 'message' => __( 'Not allowed.', 'open-lister-amazon' ) ), 403 );
		}
		if ( ! OLA_Settings::is_connected() ) {
			wp_send_json_error( array( 'message' => __( 'Connect your Amazon account under Amazon > Settings first.', 'open-lister-amazon' ) ) );
		}
	}

	public static function ajax_product_types() {
		self::ajax_guard();
		$keywords = isset( $_POST['keywords'] ) ? sanitize_text_field( wp_unslash( $_POST['keywords'] ) ) : '';
		$response = OLA_API::search_product_types( $keywords );
		if ( is_wp_error( $response ) ) {
			wp_send_json_error( array( 'message' => $response->get_error_message() ) );
		}
		$types = array();
		foreach ( isset( $response['productTypes'] ) ? $response['productTypes'] : array() as $type ) {
			$types[] = array(
				'name'  => $type['name'],
				'label' => isset( $type['displayName'] ) ? $type['displayName'] : $type['name'],
			);
		}
		wp_send_json_success( array( 'types' => array_slice( $types, 0, 20 ) ) );
	}

	public static function ajax_find_asin() {
		self::ajax_guard();
		$product_id = isset( $_POST['product_id'] ) ? absint( $_POST['product_id'] ) : 0;
		$term       = isset( $_POST['term'] ) ? sanitize_text_field( wp_unslash( $_POST['term'] ) ) : '';
		$product    = wc_get_product( $product_id );

		$id_type = '';
		if ( ! $term && $product ) {
			$gtin = method_exists( $product, 'get_global_unique_id' ) ? $product->get_global_unique_id() : '';
			$gtin = $gtin ? $gtin : get_post_meta( $product_id, '_ola_id_value', true );
			$term = $gtin ? $gtin : $product->get_name();
		}
		if ( preg_match( '/^\d{12,14}$/', $term ) ) {
			$id_type = 12 === strlen( $term ) ? 'UPC' : 'EAN';
		}

		$response = OLA_API::search_catalog( $term, $id_type );
		if ( is_wp_error( $response ) ) {
			wp_send_json_error( array( 'message' => $response->get_error_message() ) );
		}
		wp_send_json_success( array( 'items' => OLA_Research::simplify_items( isset( $response['items'] ) ? $response['items'] : array() ) ) );
	}

	public static function ajax_validate() {
		self::ajax_guard();
		$product_id = isset( $_POST['product_id'] ) ? absint( $_POST['product_id'] ) : 0;
		$results    = OLA_Listings::validate( $product_id );
		if ( is_wp_error( $results ) ) {
			wp_send_json_error( array( 'message' => $results->get_error_message() ) );
		}
		wp_send_json_success( array( 'results' => $results ) );
	}

	public static function ajax_action() {
		self::ajax_guard();
		$product_id = isset( $_POST['product_id'] ) ? absint( $_POST['product_id'] ) : 0;
		$action     = isset( $_POST['ola_action'] ) ? sanitize_key( $_POST['ola_action'] ) : '';
		$map        = array(
			'submit'  => 'queue_submit',
			'refresh' => 'queue_refresh',
			'end'     => 'queue_end',
		);
		if ( ! $product_id || ! isset( $map[ $action ] ) ) {
			wp_send_json_error( array( 'message' => __( 'Unknown action.', 'open-lister-amazon' ) ) );
		}
		call_user_func( array( 'OLA_Listings', $map[ $action ] ), $product_id );
		wp_send_json_success( array( 'message' => __( 'Queued. Amazon usually responds within a few minutes; reload this page to see the result.', 'open-lister-amazon' ) ) );
	}
}
