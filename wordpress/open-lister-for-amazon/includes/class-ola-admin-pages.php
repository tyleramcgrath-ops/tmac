<?php
/**
 * The "Amazon" admin menu: Listings, Product Research, Orders and Settings.
 */

defined( 'ABSPATH' ) || exit;

class OLA_Admin_Pages {

	const CAP = 'manage_woocommerce';

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_post_ola_test_connection', array( __CLASS__, 'test_connection' ) );
		add_action( 'admin_post_ola_import_orders', array( __CLASS__, 'import_orders_now' ) );
		add_action( 'admin_post_ola_save_research', array( __CLASS__, 'save_research' ) );
		add_action( 'admin_post_ola_run_research', array( __CLASS__, 'run_research' ) );
		add_action( 'admin_post_ola_delete_research', array( __CLASS__, 'delete_research' ) );
		add_action( 'admin_post_ola_research_draft', array( __CLASS__, 'research_draft' ) );
		add_action( 'admin_notices', array( __CLASS__, 'notices' ) );
	}

	public static function menu() {
		add_menu_page( __( 'Amazon', 'open-lister-amazon' ), __( 'Amazon', 'open-lister-amazon' ), self::CAP, 'ola-listings', array( __CLASS__, 'page_listings' ), 'dashicons-cart', 56 );
		add_submenu_page( 'ola-listings', __( 'Amazon listings', 'open-lister-amazon' ), __( 'Listings', 'open-lister-amazon' ), self::CAP, 'ola-listings', array( __CLASS__, 'page_listings' ) );
		add_submenu_page( 'ola-listings', __( 'Product research', 'open-lister-amazon' ), __( 'Product Research', 'open-lister-amazon' ), self::CAP, 'ola-research', array( __CLASS__, 'page_research' ) );
		add_submenu_page( 'ola-listings', __( 'Amazon orders', 'open-lister-amazon' ), __( 'Orders', 'open-lister-amazon' ), self::CAP, 'ola-orders', array( __CLASS__, 'page_orders' ) );
		add_submenu_page( 'ola-listings', __( 'Amazon settings', 'open-lister-amazon' ), __( 'Settings', 'open-lister-amazon' ), self::CAP, 'ola-settings', array( __CLASS__, 'page_settings' ) );
	}

	private static function redirect( $page, $args = array() ) {
		wp_safe_redirect( add_query_arg( array_merge( array( 'page' => $page ), $args ), admin_url( 'admin.php' ) ) );
		exit;
	}

	private static function guard( $action ) {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'Not allowed.', 'open-lister-amazon' ) );
		}
		check_admin_referer( $action );
	}

	public static function notices() {
		// phpcs:disable WordPress.Security.NonceVerification
		if ( empty( $_GET['page'] ) || 0 !== strpos( sanitize_key( $_GET['page'] ), 'ola-' ) ) {
			return;
		}
		if ( ! empty( $_GET['ola_msg'] ) ) {
			$type = ! empty( $_GET['ola_err'] ) ? 'error' : 'success';
			echo '<div class="notice notice-' . esc_attr( $type ) . ' is-dismissible"><p>' . esc_html( sanitize_text_field( wp_unslash( $_GET['ola_msg'] ) ) ) . '</p></div>';
		}
		if ( 'ola-settings' !== $_GET['page'] && ! OLA_Settings::get( 'refresh_token' ) ) {
			echo '<div class="notice notice-warning"><p>' . wp_kses_post( sprintf( __( 'Connect your Amazon seller account on the <a href="%s">Settings</a> page to get started.', 'open-lister-amazon' ), esc_url( admin_url( 'admin.php?page=ola-settings' ) ) ) ) . '</p></div>';
		}
		// phpcs:enable
	}

	/* ---------------------------------------------------------------------
	 * Listings
	 * ------------------------------------------------------------------- */

	public static function page_listings() {
		$filter = isset( $_GET['status'] ) ? sanitize_key( $_GET['status'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		$paged  = isset( $_GET['paged'] ) ? max( 1, absint( $_GET['paged'] ) ) : 1; // phpcs:ignore WordPress.Security.NonceVerification

		$query = new WP_Query(
			array(
				'post_type'      => array( 'product', 'product_variation' ),
				'post_status'    => 'any',
				'posts_per_page' => 50,
				'paged'          => $paged,
				'orderby'        => 'modified',
				'meta_query'     => array(
					$filter
						? array(
							'key'   => '_ola_status',
							'value' => $filter,
						)
						: array(
							'key'     => '_ola_status',
							'compare' => 'EXISTS',
						),
				),
			)
		);
		?>
		<div class="wrap ola-wrap">
			<h1><?php esc_html_e( 'Amazon listings', 'open-lister-amazon' ); ?></h1>
			<p><?php esc_html_e( 'To list products, select them under Products > All Products and choose "List on Amazon" from Bulk actions, or use the Amazon tab when editing a product.', 'open-lister-amazon' ); ?></p>
			<ul class="subsubsub">
				<li><a href="<?php echo esc_url( admin_url( 'admin.php?page=ola-listings' ) ); ?>" class="<?php echo $filter ? '' : 'current'; ?>"><?php esc_html_e( 'All', 'open-lister-amazon' ); ?></a></li>
				<?php foreach ( OLA_Listings::STATUS_LABELS as $key => $label ) : ?>
					<li>| <a href="<?php echo esc_url( admin_url( 'admin.php?page=ola-listings&status=' . $key ) ); ?>" class="<?php echo $filter === $key ? 'current' : ''; ?>"><?php echo esc_html( $label ); ?></a></li>
				<?php endforeach; ?>
			</ul>
			<table class="widefat striped">
				<thead><tr>
					<th><?php esc_html_e( 'Product', 'open-lister-amazon' ); ?></th>
					<th><?php esc_html_e( 'Amazon SKU', 'open-lister-amazon' ); ?></th>
					<th><?php esc_html_e( 'Status', 'open-lister-amazon' ); ?></th>
					<th><?php esc_html_e( 'Amazon price', 'open-lister-amazon' ); ?></th>
					<th><?php esc_html_e( 'Qty sent', 'open-lister-amazon' ); ?></th>
					<th><?php esc_html_e( 'Last sync', 'open-lister-amazon' ); ?></th>
				</tr></thead>
				<tbody>
				<?php if ( ! $query->have_posts() ) : ?>
					<tr><td colspan="6"><?php esc_html_e( 'Nothing here yet.', 'open-lister-amazon' ); ?></td></tr>
				<?php endif; ?>
				<?php
				foreach ( $query->posts as $post ) :
					$product = wc_get_product( $post->ID );
					if ( ! $product ) {
						continue;
					}
					$edit_id = $product->get_parent_id() ? $product->get_parent_id() : $product->get_id();
					$last    = get_post_meta( $post->ID, '_ola_last_sync', true );
					$is_parent = $product->is_type( 'variable' );
					?>
					<tr>
						<td><a href="<?php echo esc_url( get_edit_post_link( $edit_id ) ); ?>"><?php echo esc_html( $product->get_name() ); ?></a></td>
						<td><?php echo esc_html( get_post_meta( $post->ID, '_ola_listed_sku', true ) ); ?></td>
						<td><?php OLA_Product_Admin::render_status( $post->ID ); ?></td>
						<td><?php echo $is_parent ? '—' : esc_html( OLA_Settings::currency() . ' ' . number_format_i18n( OLA_Listing_Builder::price( $product ), 2 ) ); ?></td>
						<td><?php echo $is_parent ? '—' : ( OLA_Listing_Builder::is_fba( $product ) ? esc_html__( 'FBA', 'open-lister-amazon' ) : esc_html( OLA_Listing_Builder::quantity( $product ) ) ); ?></td>
						<td><?php echo $last ? esc_html( human_time_diff( (int) $last ) . ' ' . __( 'ago', 'open-lister-amazon' ) ) : '—'; ?></td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>
			<?php
			echo '<div class="tablenav"><div class="tablenav-pages">' . wp_kses_post(
				paginate_links(
					array(
						'base'    => add_query_arg( 'paged', '%#%' ),
						'current' => $paged,
						'total'   => $query->max_num_pages,
					)
				)
			) . '</div></div>';
			?>
		</div>
		<?php
	}

	/* ---------------------------------------------------------------------
	 * Product research
	 * ------------------------------------------------------------------- */

	public static function page_research() {
		$view    = isset( $_GET['search'] ) ? sanitize_key( $_GET['search'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		$editing = isset( $_GET['edit'] ) ? OLA_Research::get( sanitize_key( $_GET['edit'] ) ) : null; // phpcs:ignore WordPress.Security.NonceVerification

		echo '<div class="wrap ola-wrap"><h1>' . esc_html__( 'Product research', 'open-lister-amazon' ) . '</h1>';

		if ( $view && OLA_Research::get( $view ) ) {
			self::render_research_result( OLA_Research::get( $view ) );
			echo '</div>';
			return;
		}

		$searches = OLA_Research::all();
		$form     = wp_parse_args(
			$editing ? $editing : array(),
			array(
				'id'          => '',
				'keywords'    => isset( $_GET['prefill'] ) ? sanitize_text_field( wp_unslash( $_GET['prefill'] ) ) : '', // phpcs:ignore WordPress.Security.NonceVerification
				'max_results' => 20,
				'min_price'   => '',
				'max_price'   => '',
				'related'     => 1,
				'schedule'    => 'daily',
				'start_time'  => '08:00',
				'email'       => get_option( 'admin_email' ),
			)
		);
		?>
		<p class="description"><?php esc_html_e( 'Find the best-selling Amazon products for a keyword, see which categories they sit in, and get ideas from similar categories. Ranking uses Amazon Best Sellers Rank, price and how many sellers compete. Amazon\'s seller API does not share star ratings, so open an item on Amazon to check its reviews.', 'open-lister-amazon' ); ?></p>

		<?php if ( $searches ) : ?>
			<h2><?php esc_html_e( 'Saved searches', 'open-lister-amazon' ); ?></h2>
			<table class="widefat striped">
				<thead><tr>
					<th><?php esc_html_e( 'Keywords', 'open-lister-amazon' ); ?></th>
					<th><?php esc_html_e( 'Runs', 'open-lister-amazon' ); ?></th>
					<th><?php esc_html_e( 'Next run', 'open-lister-amazon' ); ?></th>
					<th><?php esc_html_e( 'Last run', 'open-lister-amazon' ); ?></th>
					<th></th>
				</tr></thead>
				<tbody>
				<?php
				foreach ( $searches as $search ) :
					$result = OLA_Research::result( $search['id'] );
					$next   = OLA_Research::next_run( $search['id'] );
					?>
					<tr>
						<td><strong><a href="<?php echo esc_url( admin_url( 'admin.php?page=ola-research&search=' . $search['id'] ) ); ?>"><?php echo esc_html( $search['keywords'] ); ?></a></strong></td>
						<td><?php echo esc_html( OLA_Research::schedules()[ $search['schedule'] ] ); ?></td>
						<td><?php echo $next ? esc_html( wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $next ) ) : '—'; ?></td>
						<td>
							<?php
							if ( $result ) {
								echo esc_html( human_time_diff( $result['ran_at'] ) . ' ' . __( 'ago', 'open-lister-amazon' ) );
								echo $result['error'] ? ' <span class="ola-error-text">' . esc_html__( '(failed)', 'open-lister-amazon' ) . '</span>' : ' (' . esc_html( count( $result['items'] ) ) . ')';
							} else {
								esc_html_e( 'Never', 'open-lister-amazon' );
							}
							?>
						</td>
						<td class="ola-row-actions">
							<?php self::post_button( 'ola_run_research', array( 'id' => $search['id'] ), __( 'Run now', 'open-lister-amazon' ), 'button button-primary' ); ?>
							<a class="button" href="<?php echo esc_url( admin_url( 'admin.php?page=ola-research&search=' . $search['id'] ) ); ?>"><?php esc_html_e( 'Results', 'open-lister-amazon' ); ?></a>
							<a class="button" href="<?php echo esc_url( admin_url( 'admin.php?page=ola-research&edit=' . $search['id'] ) ); ?>"><?php esc_html_e( 'Edit', 'open-lister-amazon' ); ?></a>
							<?php self::post_button( 'ola_delete_research', array( 'id' => $search['id'] ), __( 'Delete', 'open-lister-amazon' ), 'button-link ola-danger' ); ?>
						</td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>
		<?php endif; ?>

		<h2><?php echo $editing ? esc_html__( 'Edit search', 'open-lister-amazon' ) : esc_html__( 'New search', 'open-lister-amazon' ); ?></h2>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="ola_save_research">
			<input type="hidden" name="id" value="<?php echo esc_attr( $form['id'] ); ?>">
			<?php wp_nonce_field( 'ola_save_research' ); ?>
			<table class="form-table">
				<tr>
					<th><label for="ola-keywords"><?php esc_html_e( 'Keywords', 'open-lister-amazon' ); ?></label></th>
					<td><input type="text" id="ola-keywords" name="keywords" class="regular-text" required value="<?php echo esc_attr( $form['keywords'] ); ?>" placeholder="comfy shirts"></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Price range', 'open-lister-amazon' ); ?></th>
					<td>
						<input type="number" step="0.01" min="0" name="min_price" class="small-text" value="<?php echo esc_attr( $form['min_price'] ); ?>" placeholder="<?php esc_attr_e( 'min', 'open-lister-amazon' ); ?>">
						–
						<input type="number" step="0.01" min="0" name="max_price" class="small-text" value="<?php echo esc_attr( $form['max_price'] ); ?>" placeholder="<?php esc_attr_e( 'max', 'open-lister-amazon' ); ?>">
						<?php echo esc_html( OLA_Settings::currency() ); ?>
					</td>
				</tr>
				<tr>
					<th><label for="ola-max"><?php esc_html_e( 'How many results', 'open-lister-amazon' ); ?></label></th>
					<td><input type="number" id="ola-max" name="max_results" min="5" max="40" class="small-text" value="<?php echo esc_attr( $form['max_results'] ); ?>"></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Similar categories', 'open-lister-amazon' ); ?></th>
					<td><label><input type="checkbox" name="related" value="1" <?php checked( $form['related'] ); ?>> <?php esc_html_e( 'Also suggest best sellers from similar categories (ideas for other products to sell)', 'open-lister-amazon' ); ?></label></td>
				</tr>
				<tr>
					<th><label for="ola-schedule"><?php esc_html_e( 'Run', 'open-lister-amazon' ); ?></label></th>
					<td>
						<select id="ola-schedule" name="schedule">
							<?php foreach ( OLA_Research::schedules() as $key => $label ) : ?>
								<option value="<?php echo esc_attr( $key ); ?>" <?php selected( $form['schedule'], $key ); ?>><?php echo esc_html( $label ); ?></option>
							<?php endforeach; ?>
						</select>
						<?php esc_html_e( 'starting at', 'open-lister-amazon' ); ?>
						<input type="time" name="start_time" value="<?php echo esc_attr( $form['start_time'] ); ?>">
						<p class="description"><?php echo esc_html( sprintf( /* translators: %s: timezone */ __( 'Site time zone: %s. WordPress runs scheduled tasks when someone visits the site, so set up a real server cron for exact timing on quiet sites.', 'open-lister-amazon' ), wp_timezone_string() ) ); ?></p>
					</td>
				</tr>
				<tr>
					<th><label for="ola-email"><?php esc_html_e( 'Email results to', 'open-lister-amazon' ); ?></label></th>
					<td><input type="email" id="ola-email" name="email" class="regular-text" value="<?php echo esc_attr( $form['email'] ); ?>" placeholder="<?php esc_attr_e( 'Leave empty for no email', 'open-lister-amazon' ); ?>"></td>
				</tr>
			</table>
			<p>
				<button type="submit" name="run_now" value="0" class="button"><?php esc_html_e( 'Save search', 'open-lister-amazon' ); ?></button>
				<button type="submit" name="run_now" value="1" class="button button-primary"><?php esc_html_e( 'Save and run now', 'open-lister-amazon' ); ?></button>
			</p>
		</form>
		</div>
		<?php
	}

	private static function render_research_result( $search ) {
		$result = OLA_Research::result( $search['id'] );
		$cur    = OLA_Settings::currency();
		?>
		<p><a href="<?php echo esc_url( admin_url( 'admin.php?page=ola-research' ) ); ?>">&larr; <?php esc_html_e( 'All searches', 'open-lister-amazon' ); ?></a></p>
		<h2>
			<?php echo esc_html( sprintf( /* translators: %s: keywords */ __( 'Best sellers for "%s"', 'open-lister-amazon' ), $search['keywords'] ) ); ?>
			<?php self::post_button( 'ola_run_research', array( 'id' => $search['id'] ), __( 'Run now', 'open-lister-amazon' ), 'button button-primary' ); ?>
		</h2>
		<?php
		if ( ! $result ) {
			echo '<p>' . esc_html__( 'This search has not run yet. Click Run now.', 'open-lister-amazon' ) . '</p>';
			return;
		}
		if ( $result['error'] ) {
			echo '<div class="notice notice-error inline"><p>' . esc_html( $result['error'] ) . '</p></div>';
		}
		echo '<p class="description">' . esc_html(
			sprintf(
				/* translators: 1: time ago, 2: number of Amazon results */
				__( 'Last run %1$s ago. Amazon has %2$s results for this keyword; these are the best sellers among the top results.', 'open-lister-amazon' ),
				human_time_diff( $result['ran_at'] ),
				number_format_i18n( isset( $result['total'] ) ? $result['total'] : 0 )
			)
		) . '</p>';
		?>
		<table class="widefat striped ola-research-table">
			<thead><tr>
				<th>#</th>
				<th></th>
				<th><?php esc_html_e( 'Product', 'open-lister-amazon' ); ?></th>
				<th><?php esc_html_e( 'Best Sellers Rank', 'open-lister-amazon' ); ?></th>
				<th><?php esc_html_e( 'Price', 'open-lister-amazon' ); ?></th>
				<th><?php esc_html_e( 'Sellers', 'open-lister-amazon' ); ?></th>
				<th><?php esc_html_e( 'Score', 'open-lister-amazon' ); ?></th>
				<th></th>
			</tr></thead>
			<tbody>
			<?php foreach ( $result['items'] as $i => $item ) : ?>
				<tr>
					<td><?php echo esc_html( $i + 1 ); ?></td>
					<td><?php if ( $item['image'] ) : ?><img src="<?php echo esc_url( $item['image'] ); ?>" alt="" class="ola-thumb" loading="lazy"><?php endif; ?></td>
					<td>
						<a href="<?php echo esc_url( $item['url'] ); ?>" target="_blank" rel="noopener"><?php echo esc_html( $item['title'] ); ?></a>
						<br><span class="ola-muted"><?php echo esc_html( trim( $item['brand'] . ' · ' . $item['asin'], ' ·' ) ); ?></span>
					</td>
					<td>
						<?php
						if ( null !== $item['category_rank'] ) {
							echo '#' . esc_html( number_format_i18n( $item['category_rank'] ) ) . ' ' . esc_html__( 'in', 'open-lister-amazon' ) . ' ' . esc_html( $item['category'] );
						}
						if ( null !== $item['group_rank'] ) {
							echo '<br><span class="ola-muted">#' . esc_html( number_format_i18n( $item['group_rank'] ) ) . ' ' . esc_html__( 'in', 'open-lister-amazon' ) . ' ' . esc_html( $item['group'] ) . '</span>';
						}
						?>
					</td>
					<td><?php echo null !== $item['price'] ? esc_html( $cur . ' ' . number_format_i18n( $item['price'], 2 ) ) : '—'; ?></td>
					<td><?php echo null !== $item['offers'] ? esc_html( $item['offers'] ) : '—'; ?></td>
					<td><span class="ola-score" style="--score: <?php echo esc_attr( $item['score'] ); ?>"><?php echo esc_html( $item['score'] ); ?></span></td>
					<td><?php self::post_button( 'ola_research_draft', array( 'id' => $search['id'], 'asin' => $item['asin'] ), __( 'Add to my store', 'open-lister-amazon' ), 'button button-small' ); ?></td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>

		<?php if ( ! empty( $result['categories'] ) ) : ?>
			<h2><?php esc_html_e( 'Categories for this keyword', 'open-lister-amazon' ); ?></h2>
			<p class="description"><?php esc_html_e( 'Where Amazon files products matching your keyword. Categories with more top sellers are listed first.', 'open-lister-amazon' ); ?></p>
			<div class="ola-chips">
				<?php foreach ( $result['categories'] as $category ) : ?>
					<span class="ola-chip">
						<?php echo esc_html( $category['name'] ); ?>
						<?php if ( $category['top'] ) : ?><strong><?php echo esc_html( sprintf( /* translators: %d: count */ _n( '%d top seller', '%d top sellers', $category['top'], 'open-lister-amazon' ), $category['top'] ) ); ?></strong><?php endif; ?>
						<?php if ( $category['results'] ) : ?><em><?php echo esc_html( number_format_i18n( $category['results'] ) ); ?></em><?php endif; ?>
					</span>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>

		<?php if ( ! empty( $result['ideas'] ) ) : ?>
			<h2><?php esc_html_e( 'Ideas from similar categories', 'open-lister-amazon' ); ?></h2>
			<p class="description"><?php esc_html_e( 'Best sellers in neighbouring categories — other things shoppers in this space buy.', 'open-lister-amazon' ); ?></p>
			<div class="ola-ideas">
				<?php foreach ( $result['ideas'] as $idea ) : ?>
					<div class="ola-idea">
						<h3><?php echo esc_html( $idea['category'] ); ?> <span class="ola-muted"><?php echo esc_html( sprintf( /* translators: %s: parent category */ __( 'in %s', 'open-lister-amazon' ), $idea['parent'] ) ); ?></span></h3>
						<?php foreach ( $idea['items'] as $item ) : ?>
							<div class="ola-idea-item">
								<?php if ( $item['image'] ) : ?><img src="<?php echo esc_url( $item['image'] ); ?>" alt="" class="ola-thumb" loading="lazy"><?php endif; ?>
								<div>
									<a href="<?php echo esc_url( $item['url'] ); ?>" target="_blank" rel="noopener"><?php echo esc_html( wp_trim_words( $item['title'], 14 ) ); ?></a>
									<br><span class="ola-muted">
										<?php
										echo null !== $item['category_rank'] ? '#' . esc_html( number_format_i18n( $item['category_rank'] ) ) . ' · ' : '';
										echo esc_html( sprintf( /* translators: %d: score */ __( 'score %d', 'open-lister-amazon' ), $item['score'] ) );
										?>
									</span>
								</div>
							</div>
						<?php endforeach; ?>
						<a class="button button-small" href="<?php echo esc_url( admin_url( 'admin.php?page=ola-research&prefill=' . rawurlencode( $idea['category'] ) ) ); ?>"><?php esc_html_e( 'Research this category', 'open-lister-amazon' ); ?></a>
					</div>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
		<?php
	}

	private static function post_button( $action, $fields, $label, $class ) {
		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="ola-inline-form">';
		echo '<input type="hidden" name="action" value="' . esc_attr( $action ) . '">';
		foreach ( $fields as $name => $value ) {
			echo '<input type="hidden" name="' . esc_attr( $name ) . '" value="' . esc_attr( $value ) . '">';
		}
		wp_nonce_field( $action );
		echo '<button type="submit" class="' . esc_attr( $class ) . '">' . esc_html( $label ) . '</button></form>';
	}

	public static function save_research() {
		self::guard( 'ola_save_research' );
		// phpcs:disable WordPress.Security.ValidatedSanitizedInput -- sanitized in OLA_Research::save().
		$id = OLA_Research::save(
			array(
				'id'          => isset( $_POST['id'] ) ? sanitize_key( $_POST['id'] ) : '',
				'keywords'    => isset( $_POST['keywords'] ) ? wp_unslash( $_POST['keywords'] ) : '',
				'max_results' => isset( $_POST['max_results'] ) ? wp_unslash( $_POST['max_results'] ) : 20,
				'min_price'   => isset( $_POST['min_price'] ) ? wp_unslash( $_POST['min_price'] ) : '',
				'max_price'   => isset( $_POST['max_price'] ) ? wp_unslash( $_POST['max_price'] ) : '',
				'related'     => ! empty( $_POST['related'] ),
				'schedule'    => isset( $_POST['schedule'] ) ? sanitize_key( $_POST['schedule'] ) : 'manual',
				'start_time'  => isset( $_POST['start_time'] ) ? sanitize_text_field( wp_unslash( $_POST['start_time'] ) ) : '08:00',
				'email'       => isset( $_POST['email'] ) ? wp_unslash( $_POST['email'] ) : '',
			)
		);
		// phpcs:enable

		if ( ! empty( $_POST['run_now'] ) ) {
			self::run_and_redirect( $id );
		}
		self::redirect( 'ola-research', array( 'ola_msg' => __( 'Search saved.', 'open-lister-amazon' ) ) );
	}

	public static function run_research() {
		self::guard( 'ola_run_research' );
		self::run_and_redirect( isset( $_POST['id'] ) ? sanitize_key( $_POST['id'] ) : '' );
	}

	private static function run_and_redirect( $id ) {
		if ( function_exists( 'set_time_limit' ) ) {
			set_time_limit( 180 );
		}
		$result = OLA_Research::run( $id );
		if ( is_wp_error( $result ) ) {
			self::redirect(
				'ola-research',
				array(
					'search'  => $id,
					'ola_msg' => $result->get_error_message(),
					'ola_err' => 1,
				)
			);
		}
		self::redirect( 'ola-research', array( 'search' => $id ) );
	}

	public static function delete_research() {
		self::guard( 'ola_delete_research' );
		OLA_Research::delete( isset( $_POST['id'] ) ? sanitize_key( $_POST['id'] ) : '' );
		self::redirect( 'ola-research', array( 'ola_msg' => __( 'Search deleted.', 'open-lister-amazon' ) ) );
	}

	public static function research_draft() {
		self::guard( 'ola_research_draft' );
		$id     = isset( $_POST['id'] ) ? sanitize_key( $_POST['id'] ) : '';
		$asin   = isset( $_POST['asin'] ) ? sanitize_text_field( wp_unslash( $_POST['asin'] ) ) : '';
		$result = OLA_Research::result( $id );
		$found  = null;

		foreach ( $result ? array_merge( $result['items'], ...array_column( $result['ideas'], 'items' ) ) : array() as $item ) {
			if ( $item['asin'] === $asin ) {
				$found = $item;
				break;
			}
		}
		if ( ! $found ) {
			self::redirect(
				'ola-research',
				array(
					'search'  => $id,
					'ola_msg' => __( 'That item is no longer in the results.', 'open-lister-amazon' ),
					'ola_err' => 1,
				)
			);
		}

		$product_id = OLA_Research::create_draft_product( $found );
		wp_safe_redirect( get_edit_post_link( $product_id, 'url' ) );
		exit;
	}

	/* ---------------------------------------------------------------------
	 * Orders
	 * ------------------------------------------------------------------- */

	public static function page_orders() {
		$last   = get_option( OLA_Orders::LAST_RUN_OPTION );
		$next   = wp_next_scheduled( OLA_Plugin::ORDER_IMPORT_HOOK );
		$orders = wc_get_orders(
			array(
				'limit'       => 25,
				'created_via' => 'amazon',
				'orderby'     => 'date',
				'order'       => 'DESC',
			)
		);
		?>
		<div class="wrap ola-wrap">
			<h1><?php esc_html_e( 'Amazon orders', 'open-lister-amazon' ); ?></h1>
			<p>
				<?php
				echo esc_html(
					$last
						/* translators: %s: date */
						? sprintf( __( 'Orders checked up to %s.', 'open-lister-amazon' ), wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $last ) ) )
						: __( 'No orders imported yet.', 'open-lister-amazon' )
				);
				echo ' ';
				echo esc_html(
					$next
						/* translators: %s: date */
						? sprintf( __( 'Next automatic check: %s.', 'open-lister-amazon' ), wp_date( get_option( 'time_format' ), $next ) )
						: __( 'Automatic import is off (turn it on under Settings).', 'open-lister-amazon' )
				);
				?>
			</p>
			<?php self::post_button( 'ola_import_orders', array(), __( 'Import orders now', 'open-lister-amazon' ), 'button button-primary' ); ?>
			<table class="widefat striped" style="margin-top:1em">
				<thead><tr>
					<th><?php esc_html_e( 'Order', 'open-lister-amazon' ); ?></th>
					<th><?php esc_html_e( 'Amazon order', 'open-lister-amazon' ); ?></th>
					<th><?php esc_html_e( 'Date', 'open-lister-amazon' ); ?></th>
					<th><?php esc_html_e( 'Status', 'open-lister-amazon' ); ?></th>
					<th><?php esc_html_e( 'Total', 'open-lister-amazon' ); ?></th>
				</tr></thead>
				<tbody>
				<?php if ( ! $orders ) : ?>
					<tr><td colspan="5"><?php esc_html_e( 'No Amazon orders yet.', 'open-lister-amazon' ); ?></td></tr>
				<?php endif; ?>
				<?php foreach ( $orders as $order ) : ?>
					<tr>
						<td><a href="<?php echo esc_url( $order->get_edit_order_url() ); ?>">#<?php echo esc_html( $order->get_order_number() ); ?></a></td>
						<td><?php echo esc_html( $order->get_meta( '_ola_amazon_order_id' ) ); ?> <span class="ola-muted"><?php echo esc_html( $order->get_meta( '_ola_fulfillment_channel' ) ); ?></span></td>
						<td><?php echo esc_html( $order->get_date_created() ? $order->get_date_created()->date_i18n( get_option( 'date_format' ) ) : '' ); ?></td>
						<td><?php echo esc_html( wc_get_order_status_name( $order->get_status() ) ); ?></td>
						<td><?php echo wp_kses_post( $order->get_formatted_order_total() ); ?></td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>
		</div>
		<?php
	}

	public static function import_orders_now() {
		self::guard( 'ola_import_orders' );
		$count = OLA_Orders::import();
		if ( is_wp_error( $count ) ) {
			self::redirect(
				'ola-orders',
				array(
					'ola_msg' => $count->get_error_message(),
					'ola_err' => 1,
				)
			);
		}
		/* translators: %d: number of orders */
		self::redirect( 'ola-orders', array( 'ola_msg' => sprintf( _n( '%d order imported or updated.', '%d orders imported or updated.', $count, 'open-lister-amazon' ), $count ) ) );
	}

	/* ---------------------------------------------------------------------
	 * Settings
	 * ------------------------------------------------------------------- */

	public static function page_settings() {
		$s = OLA_Settings::all();
		$o = OLA_Settings::OPTION;
		?>
		<div class="wrap ola-wrap">
			<h1><?php esc_html_e( 'Amazon settings', 'open-lister-amazon' ); ?></h1>

			<form method="post" action="options.php">
				<?php settings_fields( 'ola_settings_group' ); ?>

				<h2><?php esc_html_e( '1. Connect your Amazon seller account', 'open-lister-amazon' ); ?></h2>
				<details class="ola-help">
					<summary><?php esc_html_e( 'How to get these (free, about 10 minutes)', 'open-lister-amazon' ); ?></summary>
					<ol>
						<li><?php esc_html_e( 'In Seller Central, open Apps and Services > Develop Apps and register as a private developer (you are building for your own store, so there is no fee).', 'open-lister-amazon' ); ?></li>
						<li><?php esc_html_e( 'Choose roles: Product Listing, Pricing, Inventory and Order Tracking, and Amazon Fulfillment if you use FBA. Add Direct-to-Consumer Shipping if you want buyer names and addresses on imported orders.', 'open-lister-amazon' ); ?></li>
						<li><?php esc_html_e( 'Create an app client (type: SP API). Copy the LWA Client ID and Client Secret.', 'open-lister-amazon' ); ?></li>
						<li><?php esc_html_e( 'Click Authorize next to the app to self-authorize, and copy the refresh token.', 'open-lister-amazon' ); ?></li>
						<li><?php esc_html_e( 'Your Seller ID (Merchant Token) is under Settings > Account Info > Your Merchant Token.', 'open-lister-amazon' ); ?></li>
					</ol>
				</details>
				<table class="form-table">
					<tr>
						<th><label for="ola-mp"><?php esc_html_e( 'Marketplace', 'open-lister-amazon' ); ?></label></th>
						<td><select id="ola-mp" name="<?php echo esc_attr( $o ); ?>[marketplace_id]">
							<?php foreach ( OLA_Settings::marketplaces() as $id => $mp ) : ?>
								<option value="<?php echo esc_attr( $id ); ?>" <?php selected( $s['marketplace_id'], $id ); ?>><?php echo esc_html( $mp[0] . ' (' . $mp[2] . ')' ); ?></option>
							<?php endforeach; ?>
						</select></td>
					</tr>
					<?php
					self::text_row( 'seller_id', __( 'Seller ID (Merchant Token)', 'open-lister-amazon' ), $s );
					self::text_row( 'lwa_client_id', __( 'LWA Client ID', 'open-lister-amazon' ), $s, 'amzn1.application-oa2-client…' );
					self::secret_row( 'lwa_client_secret', __( 'LWA Client Secret', 'open-lister-amazon' ), $s );
					self::secret_row( 'refresh_token', __( 'Refresh token', 'open-lister-amazon' ), $s );
					?>
				</table>

				<h2><?php esc_html_e( '2. Listing defaults', 'open-lister-amazon' ); ?></h2>
				<table class="form-table">
					<tr>
						<th><label for="ola-cond"><?php esc_html_e( 'Default condition', 'open-lister-amazon' ); ?></label></th>
						<td><select id="ola-cond" name="<?php echo esc_attr( $o ); ?>[default_condition]">
							<?php foreach ( OLA_Product_Admin::conditions() as $key => $label ) : ?>
								<option value="<?php echo esc_attr( $key ); ?>" <?php selected( $s['default_condition'], $key ); ?>><?php echo esc_html( $label ); ?></option>
							<?php endforeach; ?>
						</select></td>
					</tr>
					<?php
					self::text_row( 'default_brand', __( 'Default brand', 'open-lister-amazon' ), $s );
					self::text_row( 'handling_time', __( 'Handling time (days)', 'open-lister-amazon' ), $s, '', 'number' );
					self::text_row( 'language_tag', __( 'Listing language', 'open-lister-amazon' ), $s, OLA_Settings::marketplace()[3] );
					?>
					<tr>
						<th><?php esc_html_e( 'Amazon price rule', 'open-lister-amazon' ); ?></th>
						<td>
							<select name="<?php echo esc_attr( $o ); ?>[price_adjust_type]">
								<option value="none" <?php selected( $s['price_adjust_type'], 'none' ); ?>><?php esc_html_e( 'Same as WooCommerce', 'open-lister-amazon' ); ?></option>
								<option value="percent" <?php selected( $s['price_adjust_type'], 'percent' ); ?>><?php esc_html_e( 'Change by percent', 'open-lister-amazon' ); ?></option>
								<option value="fixed" <?php selected( $s['price_adjust_type'], 'fixed' ); ?>><?php esc_html_e( 'Change by fixed amount', 'open-lister-amazon' ); ?></option>
							</select>
							<input type="number" step="0.01" class="small-text" name="<?php echo esc_attr( $o ); ?>[price_adjust_value]" value="<?php echo esc_attr( $s['price_adjust_value'] ); ?>">
							<p class="description"><?php esc_html_e( 'For example 15 percent to cover Amazon fees. Use a negative number to discount.', 'open-lister-amazon' ); ?></p>
						</td>
					</tr>
				</table>

				<h2><?php esc_html_e( '3. Syncing', 'open-lister-amazon' ); ?></h2>
				<table class="form-table">
					<?php
					self::check_row( 'sync_price', __( 'Update Amazon when the WooCommerce price changes', 'open-lister-amazon' ), $s );
					self::check_row( 'sync_stock', __( 'Update Amazon when WooCommerce stock changes', 'open-lister-amazon' ), $s );
					self::text_row( 'stock_buffer', __( 'Stock buffer', 'open-lister-amazon' ), $s, '', 'number', __( 'Hold back this many units from Amazon to avoid overselling.', 'open-lister-amazon' ) );
					self::check_row( 'import_orders', __( 'Import Amazon orders every 15 minutes', 'open-lister-amazon' ), $s );
					self::text_row( 'order_days_back', __( 'First import: days back', 'open-lister-amazon' ), $s, '', 'number' );
					self::check_row( 'skip_pending_orders', __( 'Wait until Amazon orders are paid (skip Pending)', 'open-lister-amazon' ), $s );
					self::check_row( 'reduce_stock_fba', __( 'Reduce WooCommerce stock for FBA orders too', 'open-lister-amazon' ), $s );
					self::text_row( 'default_carrier', __( 'Default carrier', 'open-lister-amazon' ), $s, 'USPS, UPS, FedEx, DHL…' );
					self::check_row( 'debug_log', __( 'Log every Amazon request (WooCommerce > Status > Logs)', 'open-lister-amazon' ), $s );
					?>
				</table>

				<?php submit_button(); ?>
			</form>

			<h2><?php esc_html_e( 'Test the connection', 'open-lister-amazon' ); ?></h2>
			<?php self::post_button( 'ola_test_connection', array(), __( 'Test connection', 'open-lister-amazon' ), 'button' ); ?>
		</div>
		<?php
	}

	private static function text_row( $key, $label, $s, $placeholder = '', $type = 'text', $help = '' ) {
		echo '<tr><th><label for="ola-' . esc_attr( $key ) . '">' . esc_html( $label ) . '</label></th><td>';
		echo '<input type="' . esc_attr( $type ) . '" id="ola-' . esc_attr( $key ) . '" class="' . ( 'number' === $type ? 'small-text' : 'regular-text' ) . '" name="' . esc_attr( OLA_Settings::OPTION . '[' . $key . ']' ) . '" value="' . esc_attr( $s[ $key ] ) . '" placeholder="' . esc_attr( $placeholder ) . '">';
		if ( $help ) {
			echo '<p class="description">' . esc_html( $help ) . '</p>';
		}
		echo '</td></tr>';
	}

	private static function secret_row( $key, $label, $s ) {
		$placeholder = $s[ $key ] ? __( 'Saved — leave empty to keep', 'open-lister-amazon' ) : '';
		echo '<tr><th><label for="ola-' . esc_attr( $key ) . '">' . esc_html( $label ) . '</label></th><td>';
		echo '<input type="password" autocomplete="new-password" id="ola-' . esc_attr( $key ) . '" class="regular-text" name="' . esc_attr( OLA_Settings::OPTION . '[' . $key . ']' ) . '" value="" placeholder="' . esc_attr( $placeholder ) . '">';
		echo '</td></tr>';
	}

	private static function check_row( $key, $label, $s ) {
		echo '<tr><th></th><td><label><input type="checkbox" name="' . esc_attr( OLA_Settings::OPTION . '[' . $key . ']' ) . '" value="1" ' . checked( ! empty( $s[ $key ] ), true, false ) . '> ' . esc_html( $label ) . '</label></td></tr>';
	}

	public static function test_connection() {
		self::guard( 'ola_test_connection' );
		delete_transient( OLA_API::TOKEN_TRANSIENT );
		$response = OLA_API::marketplace_participations();

		if ( is_wp_error( $response ) ) {
			self::redirect(
				'ola-settings',
				array(
					'ola_msg' => __( 'Connection failed: ', 'open-lister-amazon' ) . $response->get_error_message(),
					'ola_err' => 1,
				)
			);
		}

		$names = array();
		$found = false;
		foreach ( isset( $response['payload'] ) ? $response['payload'] : array() as $row ) {
			$names[] = $row['marketplace']['name'];
			if ( $row['marketplace']['id'] === OLA_Settings::get( 'marketplace_id' ) ) {
				$found = true;
			}
		}

		$message = sprintf(
			/* translators: %s: marketplace names */
			__( 'Connected. Your account sells on: %s.', 'open-lister-amazon' ),
			implode( ', ', $names )
		);
		if ( ! $found ) {
			$message .= ' ' . __( 'Warning: the marketplace selected above is not one of them.', 'open-lister-amazon' );
		}
		if ( ! OLA_Settings::get( 'seller_id' ) ) {
			$message .= ' ' . __( 'Add your Seller ID to list products.', 'open-lister-amazon' );
		}
		self::redirect( 'ola-settings', array( 'ola_msg' => $message ) );
	}
}
