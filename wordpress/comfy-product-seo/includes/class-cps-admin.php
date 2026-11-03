<?php
/**
 * Products > Product SEO: the "Optimize all products" button, settings and results.
 *
 * @package comfy-product-seo
 */

defined( 'ABSPATH' ) || exit;

class CPS_Admin {

	const BATCH = 15;

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_post_cps_save_settings', array( __CLASS__, 'save_settings' ) );
		add_action( 'wp_ajax_cps_batch', array( __CLASS__, 'ajax_batch' ) );
		add_filter( 'bulk_actions-edit-product', array( __CLASS__, 'bulk_action' ) );
		add_filter( 'handle_bulk_actions-edit-product', array( __CLASS__, 'handle_bulk' ), 10, 3 );
		add_action( 'admin_notices', array( __CLASS__, 'bulk_notice' ) );
	}

	public static function menu() {
		add_submenu_page( 'edit.php?post_type=product', __( 'Product SEO', 'comfy-product-seo' ), __( 'Product SEO', 'comfy-product-seo' ), 'manage_woocommerce', 'cps', array( __CLASS__, 'page' ) );
	}

	public static function page() {
		$s     = cps_settings();
		$total = CPS_Optimizer::product_count();
		$done  = count(
			get_posts(
				array(
					'post_type'      => 'product',
					'post_status'    => 'publish',
					'fields'         => 'ids',
					'posts_per_page' => -1,
					'meta_key'       => '_cps_optimized', // phpcs:ignore WordPress.DB.SlowDBQuery
					'no_found_rows'  => true,
				)
			)
		);
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Product SEO', 'comfy-product-seo' ); ?></h1>
			<?php if ( isset( $_GET['saved'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification ?>
				<div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'Settings saved.', 'comfy-product-seo' ); ?></p></div>
			<?php endif; ?>

			<div class="card" style="max-width:860px">
				<h2><?php esc_html_e( 'Optimize all products', 'comfy-product-seo' ); ?></h2>
				<p><?php esc_html_e( 'For every published product this writes a search title and description from the product\'s own summary and Comfy Meter, sets a focus keyphrase in All in One SEO, adds photo alt text, attaches a missing Featured Image from URL photo when it can, and finds the guides that link to the product. Titles and descriptions you wrote yourself are kept unless you turn on "Replace my own" below.', 'comfy-product-seo' ); ?></p>
				<p><strong><?php echo esc_html( sprintf( /* translators: 1: optimized, 2: total */ __( '%1$d of %2$d products optimized so far.', 'comfy-product-seo' ), $done, $total ) ); ?></strong></p>
				<p><button type="button" class="button button-primary button-hero" id="cps-run"><?php esc_html_e( 'Optimize all products', 'comfy-product-seo' ); ?></button></p>
				<div id="cps-progress" hidden>
					<progress id="cps-bar" max="<?php echo esc_attr( $total ); ?>" value="0" style="width:100%;height:18px"></progress>
					<p id="cps-status" aria-live="polite"></p>
				</div>
			</div>

			<div class="card" style="max-width:860px">
				<h2><?php esc_html_e( 'Settings', 'comfy-product-seo' ); ?></h2>
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<input type="hidden" name="action" value="cps_save_settings">
					<?php wp_nonce_field( 'cps_save_settings' ); ?>
					<?php
					$rows = array(
						'schema'     => __( 'Add Product schema to product pages, with the Comfy Meter as your own review score (lets Google show product results with your rating).', 'comfy-product-seo' ),
						'guides_box' => __( 'Show "Featured in our guides" on product pages, linking to the guides that mention the product.', 'comfy-product-seo' ),
						'auto'       => __( 'Optimize products automatically when they are imported or saved, and refresh guide links when a guide is saved.', 'comfy-product-seo' ),
						'overwrite'  => __( 'Replace my own: overwrite search titles and descriptions that someone wrote by hand.', 'comfy-product-seo' ),
					);
					foreach ( $rows as $key => $label ) :
						?>
						<p><label><input type="checkbox" name="cps[<?php echo esc_attr( $key ); ?>]" value="1" <?php checked( $s[ $key ] ); ?>> <?php echo esc_html( $label ); ?></label></p>
					<?php endforeach; ?>
					<?php submit_button( __( 'Save settings', 'comfy-product-seo' ), 'secondary' ); ?>
				</form>
			</div>

			<h2><?php esc_html_e( 'Results', 'comfy-product-seo' ); ?></h2>
			<table class="widefat striped" id="cps-results">
				<thead><tr><th><?php esc_html_e( 'Product', 'comfy-product-seo' ); ?></th><th><?php esc_html_e( 'Search title', 'comfy-product-seo' ); ?></th><th><?php esc_html_e( 'Search description', 'comfy-product-seo' ); ?></th><th><?php esc_html_e( 'Comfy Meter', 'comfy-product-seo' ); ?></th><th><?php esc_html_e( 'Guides', 'comfy-product-seo' ); ?></th><th><?php esc_html_e( 'Notes', 'comfy-product-seo' ); ?></th></tr></thead>
				<tbody><tr class="cps-empty"><td colspan="6"><?php esc_html_e( 'Click "Optimize all products" to see what changes for each product.', 'comfy-product-seo' ); ?></td></tr></tbody>
			</table>
		</div>
		<script>
		(function () {
			var btn = document.getElementById('cps-run'), bar = document.getElementById('cps-bar'), status = document.getElementById('cps-status');
			var tbody = document.querySelector('#cps-results tbody'), total = <?php echo (int) $total; ?>;
			var nonce = <?php echo wp_json_encode( wp_create_nonce( 'cps_batch' ) ); ?>, ajax = <?php echo wp_json_encode( admin_url( 'admin-ajax.php' ) ); ?>;
			function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
			function len(s, max) { var n = (s || '').length; return ' <span style="color:' + (n > max ? '#b32d2e' : '#646970') + '">(' + n + ')</span>'; }
			function run(offset) {
				var body = new FormData();
				body.append('action', 'cps_batch'); body.append('nonce', nonce); body.append('offset', offset);
				fetch(ajax, { method: 'POST', credentials: 'same-origin', body: body }).then(function (r) { return r.json(); }).then(function (res) {
					if (!res.success) { throw new Error(res.data || 'The server said no.'); }
					var empty = tbody.querySelector('.cps-empty'); if (empty) { empty.remove(); }
					res.data.rows.forEach(function (r) {
						var tr = document.createElement('tr');
						tr.innerHTML = '<td>' + esc(r.name || ('#' + r.id)) + '</td><td>' + esc(r.title) + len(r.title, 60) + '</td><td>' + esc(r.desc) + len(r.desc, 155) + '</td><td>' + (r.meter ? esc(r.meter) : '<span style="color:#b32d2e">none</span>') + '</td><td>' + esc(r.guides) + '</td><td>' + esc((r.notes || []).concat(r.error ? [r.error] : []).join('; ')) + '</td>';
						tbody.appendChild(tr);
					});
					var done = offset + res.data.rows.length;
					bar.value = done;
					status.textContent = 'Optimized ' + done + ' of ' + total + ' products…';
					if (res.data.more) { run(done); } else { status.textContent = 'Done. Optimized ' + done + ' products. Purge your page cache so visitors and search engines see the changes.'; btn.disabled = false; }
				}).catch(function (e) { status.textContent = 'Stopped at ' + offset + ': ' + e.message + ' Click the button to try again.'; btn.disabled = false; });
			}
			btn.addEventListener('click', function () {
				btn.disabled = true; document.getElementById('cps-progress').hidden = false;
				tbody.innerHTML = ''; status.textContent = 'Starting…'; run(0);
			});
		})();
		</script>
		<?php
	}

	public static function ajax_batch() {
		check_ajax_referer( 'cps_batch', 'nonce' );
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( 'You need permission to manage WooCommerce.' );
		}
		$offset = isset( $_POST['offset'] ) ? max( 0, (int) $_POST['offset'] ) : 0;
		$ids    = CPS_Optimizer::product_ids( $offset, self::BATCH );
		$rows   = array();
		foreach ( $ids as $id ) {
			$rows[] = CPS_Optimizer::optimize( $id );
		}
		wp_send_json_success( array( 'rows' => $rows, 'more' => count( $ids ) === self::BATCH ) );
	}

	public static function save_settings() {
		check_admin_referer( 'cps_save_settings' );
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( esc_html__( 'You need permission to manage WooCommerce.', 'comfy-product-seo' ) );
		}
		$in  = isset( $_POST['cps'] ) ? (array) wp_unslash( $_POST['cps'] ) : array();
		$out = array();
		foreach ( array( 'schema', 'guides_box', 'auto', 'overwrite' ) as $key ) {
			$out[ $key ] = empty( $in[ $key ] ) ? 0 : 1;
		}
		update_option( 'cps_settings', $out );
		wp_safe_redirect( add_query_arg( array( 'post_type' => 'product', 'page' => 'cps', 'saved' => 1 ), admin_url( 'edit.php' ) ) );
		exit;
	}

	public static function bulk_action( $actions ) {
		$actions['cps_optimize'] = __( 'Optimize for search', 'comfy-product-seo' );
		return $actions;
	}

	public static function handle_bulk( $redirect, $action, $ids ) {
		if ( 'cps_optimize' !== $action ) {
			return $redirect;
		}
		foreach ( $ids as $id ) {
			CPS_Optimizer::optimize( (int) $id );
		}
		return add_query_arg( 'cps_optimized', count( $ids ), $redirect );
	}

	public static function bulk_notice() {
		if ( empty( $_GET['cps_optimized'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		$n = (int) $_GET['cps_optimized']; // phpcs:ignore WordPress.Security.NonceVerification
		echo '<div class="notice notice-success is-dismissible"><p>' . esc_html( sprintf( /* translators: %d: products */ _n( 'Optimized %d product for search.', 'Optimized %d products for search.', $n, 'comfy-product-seo' ), $n ) ) . '</p></div>';
	}
}
