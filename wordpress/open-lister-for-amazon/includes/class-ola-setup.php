<?php
/**
 * Guided setup: walks the seller through creating a free private SP-API app,
 * accepts everything they copied pasted in one box, then detects the region
 * and marketplace and tests the connection in a single click.
 */

defined( 'ABSPATH' ) || exit;

class OLA_Setup {

	const REDIRECT_OPTION = 'ola_activation_redirect';
	const RESULT_KEY      = 'ola_setup_result_';

	/** Seller Central domain per marketplace. */
	const SELLER_CENTRAL = array(
		'ATVPDKIKX0DER'  => 'sellercentral.amazon.com',
		'A2EUQ1WTGCTBG2' => 'sellercentral.amazon.ca',
		'A1AM78C64UM0Y8' => 'sellercentral.amazon.com.mx',
		'A2Q3Y263D00KWC' => 'sellercentral.amazon.com.br',
		'A1F83G8C2ARO7P' => 'sellercentral.amazon.co.uk',
		'A28R8C7NBKEWEA' => 'sellercentral.amazon.ie',
		'A1PA6795UKMFR9' => 'sellercentral.amazon.de',
		'A13V1IB3VIYZZH' => 'sellercentral.amazon.fr',
		'APJ6JRA9NG5V4'  => 'sellercentral.amazon.it',
		'A1RKKUPIHCS9HS' => 'sellercentral.amazon.es',
		'A1805IZSGTT6HS' => 'sellercentral.amazon.nl',
		'AMEN7PMS3EDWL'  => 'sellercentral.amazon.com.be',
		'A2NODRKZP88ZB9' => 'sellercentral.amazon.se',
		'A1C3SOZRARQ6R3' => 'sellercentral.amazon.pl',
		'A33AVAJ2PDY3EV' => 'sellercentral.amazon.com.tr',
		'A2VIGQ35RCS4UG' => 'sellercentral.amazon.ae',
		'A17E79C6D8DWNP' => 'sellercentral.amazon.sa',
		'ARBP9OOSHTCHU'  => 'sellercentral.amazon.eg',
		'A21TJRUUN4KGV'  => 'sellercentral.amazon.in',
		'A1VC38T7YXB528' => 'sellercentral.amazon.co.jp',
		'A39IBJ37TRP1C6' => 'sellercentral.amazon.com.au',
		'A19VAU5U5O7RUS' => 'sellercentral.amazon.sg',
	);

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ), 20 );
		add_action( 'admin_init', array( __CLASS__, 'activation_redirect' ) );
		add_action( 'admin_post_ola_setup_connect', array( __CLASS__, 'connect' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );
	}

	public static function url() {
		return admin_url( 'admin.php?page=ola-setup' );
	}

	public static function menu() {
		add_submenu_page( 'ola-listings', __( 'Connect to Amazon', 'open-lister-amazon' ), __( 'Setup', 'open-lister-amazon' ), OLA_Admin_Pages::CAP, 'ola-setup', array( __CLASS__, 'page' ) );
	}

	/** After activation, land on the setup page instead of the plugins list. */
	public static function activation_redirect() {
		if ( ! get_option( self::REDIRECT_OPTION ) ) {
			return;
		}
		delete_option( self::REDIRECT_OPTION );
		if ( wp_doing_ajax() || isset( $_GET['activate-multi'] ) || ! current_user_can( OLA_Admin_Pages::CAP ) || OLA_Settings::get( 'refresh_token' ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		wp_safe_redirect( self::url() );
		exit;
	}

	public static function assets( $hook ) {
		if ( false === strpos( $hook, 'ola-setup' ) ) {
			return;
		}
		wp_enqueue_style( 'ola-admin', OLA_URL . 'assets/admin.css', array(), OLA_VERSION );
		wp_enqueue_script( 'ola-setup', OLA_URL . 'assets/setup.js', array(), OLA_VERSION, true );
	}

	/* ---------------------------------------------------------------------
	 * Parsing what the seller pasted
	 * ------------------------------------------------------------------- */

	/**
	 * Pulls credentials out of free text, in any order. Mirrors assets/setup.js.
	 *
	 * @return array client_id, client_secret, refresh_token, seller_id (any may be '').
	 */
	public static function parse( $text ) {
		$found = array(
			'client_id'     => '',
			'client_secret' => '',
			'refresh_token' => '',
			'seller_id'     => '',
		);
		$patterns = array(
			'client_id'     => '/amzn1\.application-oa2-client\.[a-z0-9]+/i',
			'client_secret' => '/amzn1\.oa2-cs\.v1\.[a-z0-9]+/i',
			'refresh_token' => '/Atzr\|[^\s"\',;]+/',
		);
		foreach ( $patterns as $key => $pattern ) {
			if ( preg_match( $pattern, $text, $m ) ) {
				$found[ $key ] = $m[0];
				$text          = str_replace( $m[0], ' ', $text );
			}
		}

		// Merchant tokens look like A1B2C3D4E5F6G7; skip marketplace IDs, which look similar.
		if ( preg_match_all( '/\bA[0-9A-Z]{9,16}\b/', $text, $matches ) ) {
			foreach ( $matches[0] as $candidate ) {
				if ( ! isset( OLA_Settings::marketplaces()[ $candidate ] ) && preg_match( '/\d/', $candidate ) ) {
					$found['seller_id'] = $candidate;
					break;
				}
			}
		}
		return $found;
	}

	/* ---------------------------------------------------------------------
	 * Connect
	 * ------------------------------------------------------------------- */

	public static function connect() {
		if ( ! current_user_can( OLA_Admin_Pages::CAP ) ) {
			wp_die( esc_html__( 'Not allowed.', 'open-lister-amazon' ) );
		}
		check_admin_referer( 'ola_setup_connect' );

		$marketplace = isset( $_POST['marketplace_id'] ) ? sanitize_text_field( wp_unslash( $_POST['marketplace_id'] ) ) : '';
		$pasted      = isset( $_POST['pasted'] ) ? sanitize_textarea_field( wp_unslash( $_POST['pasted'] ) ) : '';
		$parsed      = self::parse( $pasted );

		// Fields win over the paste box; empty fields keep what is already saved.
		$creds = array();
		foreach ( array_keys( $parsed ) as $key ) {
			$field         = isset( $_POST[ $key ] ) ? trim( sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) ) : '';
			$creds[ $key ] = $field ? $field : $parsed[ $key ];
		}

		$current = OLA_Settings::all();
		$new     = array(
			'marketplace_id'    => isset( OLA_Settings::marketplaces()[ $marketplace ] ) ? $marketplace : $current['marketplace_id'],
			'lwa_client_id'     => $creds['client_id'] ? $creds['client_id'] : $current['lwa_client_id'],
			'lwa_client_secret' => $creds['client_secret'],
			'refresh_token'     => $creds['refresh_token'],
			'seller_id'         => $creds['seller_id'] ? $creds['seller_id'] : $current['seller_id'],
		);
		update_option( OLA_Settings::OPTION, array_merge( $current, $new ) );
		OLA_Settings::flush_cache();

		$result = self::test_and_detect();
		set_transient( self::RESULT_KEY . get_current_user_id(), $result, 10 * MINUTE_IN_SECONDS );

		wp_safe_redirect( add_query_arg( 'done', 1, self::url() ) );
		exit;
	}

	/**
	 * Gets a token, finds which region the account is in, and picks a marketplace
	 * the account actually sells on.
	 *
	 * @return array ok, message, marketplaces, missing.
	 */
	public static function test_and_detect() {
		$missing = array();
		foreach ( array(
			'lwa_client_id'     => __( 'Client ID', 'open-lister-amazon' ),
			'lwa_client_secret' => __( 'Client Secret', 'open-lister-amazon' ),
			'refresh_token'     => __( 'Refresh token', 'open-lister-amazon' ),
		) as $key => $label ) {
			if ( ! OLA_Settings::get( $key ) ) {
				$missing[] = $label;
			}
		}
		if ( $missing ) {
			return array(
				'ok'      => false,
				/* translators: %s: list of missing items */
				'message' => sprintf( __( 'Still needed: %s. Paste them in the box and try again.', 'open-lister-amazon' ), implode( ', ', $missing ) ),
			);
		}

		delete_transient( OLA_API::TOKEN_TRANSIENT );
		$token = OLA_API::access_token( true );
		if ( is_wp_error( $token ) ) {
			return array(
				'ok'      => false,
				'message' => $token->get_error_message(),
			);
		}

		$preferred = OLA_Settings::region();
		$regions   = array_unique( array( $preferred, 'na', 'eu', 'fe' ) );
		$found     = array();
		$last      = null;

		foreach ( $regions as $region ) {
			OLA_API::$region_override = $region;
			$response                 = OLA_API::marketplace_participations();
			OLA_API::$region_override = null;

			if ( is_wp_error( $response ) ) {
				$last = $response;
				continue;
			}
			foreach ( isset( $response['payload'] ) ? $response['payload'] : array() as $row ) {
				if ( ! empty( $row['participation']['isParticipating'] ) || ! isset( $row['participation'] ) ) {
					$found[ $row['marketplace']['id'] ] = $row['marketplace']['name'];
				}
			}
			if ( $found ) {
				break;
			}
		}

		if ( ! $found ) {
			return array(
				'ok'      => false,
				'message' => $last ? $last->get_error_message() : __( 'Connected to Amazon, but this account does not sell on any marketplace yet.', 'open-lister-amazon' ),
			);
		}

		// Keep the seller's choice if they sell there; otherwise use their first known marketplace.
		$chosen = OLA_Settings::get( 'marketplace_id' );
		if ( ! isset( $found[ $chosen ] ) ) {
			foreach ( array_keys( $found ) as $id ) {
				if ( isset( OLA_Settings::marketplaces()[ $id ] ) ) {
					$settings                   = OLA_Settings::all();
					$settings['marketplace_id'] = $id;
					update_option( OLA_Settings::OPTION, $settings );
					OLA_Settings::flush_cache();
					$chosen = $id;
					break;
				}
			}
		}

		return array(
			'ok'           => true,
			'marketplace'  => OLA_Settings::marketplace()[0],
			'marketplaces' => array_values( $found ),
			'seller_id'    => OLA_Settings::get( 'seller_id' ),
		);
	}

	/* ---------------------------------------------------------------------
	 * Page
	 * ------------------------------------------------------------------- */

	public static function page() {
		$result    = get_transient( self::RESULT_KEY . get_current_user_id() );
		$show      = $result && isset( $_GET['done'] ); // phpcs:ignore WordPress.Security.NonceVerification
		$connected = OLA_Settings::is_connected();
		$selected  = OLA_Settings::get( 'marketplace_id' );
		?>
		<div class="wrap ola-wrap ola-setup">
			<h1><?php esc_html_e( 'Connect your Amazon store', 'open-lister-amazon' ); ?></h1>

			<?php if ( $show && $result['ok'] ) : ?>
				<div class="ola-card ola-success">
					<h2>✓ <?php esc_html_e( 'You are connected to Amazon', 'open-lister-amazon' ); ?></h2>
					<p>
						<?php
						/* translators: 1: marketplace name, 2: list of marketplaces */
						echo esc_html( sprintf( __( 'Using %1$s. Your account sells on: %2$s.', 'open-lister-amazon' ), $result['marketplace'], implode( ', ', $result['marketplaces'] ) ) );
						?>
					</p>
					<?php if ( ! $result['seller_id'] ) : ?>
						<p class="ola-error-text"><?php esc_html_e( 'One thing left: add your Merchant Token (step 2e) to list products and import orders. Product research already works.', 'open-lister-amazon' ); ?></p>
					<?php endif; ?>
					<p>
						<a class="button button-primary button-hero" href="<?php echo esc_url( admin_url( 'admin.php?page=ola-research' ) ); ?>"><?php esc_html_e( 'Find products to sell', 'open-lister-amazon' ); ?></a>
						<a class="button button-hero" href="<?php echo esc_url( admin_url( 'edit.php?post_type=product' ) ); ?>"><?php esc_html_e( 'List my products', 'open-lister-amazon' ); ?></a>
					</p>
				</div>
				<?php delete_transient( self::RESULT_KEY . get_current_user_id() ); ?>
			<?php elseif ( $show ) : ?>
				<div class="notice notice-error inline"><p><strong><?php esc_html_e( 'Not connected yet:', 'open-lister-amazon' ); ?></strong> <?php echo esc_html( $result['message'] ); ?></p></div>
			<?php elseif ( $connected ) : ?>
				<div class="notice notice-success inline"><p><?php esc_html_e( 'Already connected. Run the steps again only if you want to switch accounts.', 'open-lister-amazon' ); ?></p></div>
			<?php endif; ?>

			<p class="ola-lead"><?php esc_html_e( 'About 5 minutes, completely free. Amazon needs you to create a private "app" for your own store; these steps open the right pages for you.', 'open-lister-amazon' ); ?></p>

			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" id="ola-setup-form">
				<input type="hidden" name="action" value="ola_setup_connect">
				<?php wp_nonce_field( 'ola_setup_connect' ); ?>

				<div class="ola-card">
					<h2><span class="ola-step">1</span> <?php esc_html_e( 'Where do you sell?', 'open-lister-amazon' ); ?></h2>
					<select name="marketplace_id" id="ola-setup-marketplace">
						<?php foreach ( OLA_Settings::marketplaces() as $id => $mp ) : ?>
							<option value="<?php echo esc_attr( $id ); ?>" data-domain="<?php echo esc_attr( self::SELLER_CENTRAL[ $id ] ); ?>" <?php selected( $selected, $id ); ?>><?php echo esc_html( $mp[0] ); ?></option>
						<?php endforeach; ?>
					</select>
				</div>

				<div class="ola-card">
					<h2><span class="ola-step">2</span> <?php esc_html_e( 'Create your free app on Amazon', 'open-lister-amazon' ); ?></h2>
					<ol class="ola-steps">
						<li>
							<a class="button button-primary ola-sc-link" target="_blank" rel="noopener" data-path="/sellingpartner/developerconsole" href="https://<?php echo esc_attr( self::SELLER_CENTRAL[ $selected ] ?? 'sellercentral.amazon.com' ); ?>/sellingpartner/developerconsole"><?php esc_html_e( 'Open Amazon Developer Central ↗', 'open-lister-amazon' ); ?></a>
							<p><?php esc_html_e( 'If Amazon asks you to register as a developer, choose "Private developer" (building for your own business) and tick these roles:', 'open-lister-amazon' ); ?>
							<strong><?php esc_html_e( 'Product Listing, Pricing, Inventory and Order Tracking', 'open-lister-amazon' ); ?></strong>
							<?php esc_html_e( '(plus Amazon Fulfillment if you use FBA, and Direct-to-Consumer Shipping if you want buyer addresses on orders). Approval for a private developer is usually quick.', 'open-lister-amazon' ); ?></p>
						</li>
						<li><?php esc_html_e( 'Click "Add new app client". Name it anything (for example "My store"), choose API type "SP API", tick the same roles, and save.', 'open-lister-amazon' ); ?></li>
						<li><?php esc_html_e( 'Next to your app, click "View" under LWA credentials. Copy the Client identifier and Client secret.', 'open-lister-amazon' ); ?></li>
						<li><?php esc_html_e( 'Click the arrow next to "Edit App", choose "Authorize", then "Authorize app". Copy the refresh token.', 'open-lister-amazon' ); ?></li>
						<li>
							<a class="button ola-sc-link" target="_blank" rel="noopener" data-path="/sw/AccountInfo/MerchantToken/step/MerchantToken" href="https://<?php echo esc_attr( self::SELLER_CENTRAL[ $selected ] ?? 'sellercentral.amazon.com' ); ?>/sw/AccountInfo/MerchantToken/step/MerchantToken"><?php esc_html_e( 'Open my Merchant Token ↗', 'open-lister-amazon' ); ?></a>
							<p><?php esc_html_e( 'Copy your Merchant Token (it starts with A). If the link does not open it, go to Settings > Account Info > Your Merchant Token.', 'open-lister-amazon' ); ?></p>
						</li>
					</ol>
				</div>

				<div class="ola-card">
					<h2><span class="ola-step">3</span> <?php esc_html_e( 'Paste and connect', 'open-lister-amazon' ); ?></h2>
					<p><?php esc_html_e( 'Paste everything you copied into this box, in any order, all at once or one at a time. The plugin picks out each value.', 'open-lister-amazon' ); ?></p>
					<textarea name="pasted" id="ola-setup-paste" rows="5" class="large-text code" autocomplete="off" spellcheck="false" placeholder="amzn1.application-oa2-client.…&#10;amzn1.oa2-cs.v1.…&#10;Atzr|…&#10;A1B2C3D4E5F6G7"></textarea>

					<table class="ola-detected">
						<?php
						$fields = array(
							'client_id'     => array( __( 'Client ID', 'open-lister-amazon' ), OLA_Settings::get( 'lwa_client_id' ) ),
							'client_secret' => array( __( 'Client Secret', 'open-lister-amazon' ), '' ),
							'refresh_token' => array( __( 'Refresh token', 'open-lister-amazon' ), '' ),
							'seller_id'     => array( __( 'Merchant Token', 'open-lister-amazon' ), OLA_Settings::get( 'seller_id' ) ),
						);
						$saved  = array(
							'client_secret' => (bool) OLA_Settings::get( 'lwa_client_secret' ),
							'refresh_token' => (bool) OLA_Settings::get( 'refresh_token' ),
						);
						foreach ( $fields as $key => $field ) :
							$is_secret = isset( $saved[ $key ] );
							?>
							<tr>
								<th><label for="ola-f-<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $field[0] ); ?></label></th>
								<td>
									<input type="<?php echo $is_secret ? 'password' : 'text'; ?>" id="ola-f-<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $key ); ?>" class="regular-text code" value="<?php echo esc_attr( $field[1] ); ?>" autocomplete="off" data-saved="<?php echo $is_secret && $saved[ $key ] ? '1' : ''; ?>" placeholder="<?php echo $is_secret && $saved[ $key ] ? esc_attr__( 'Saved', 'open-lister-amazon' ) : esc_attr__( 'Not found yet', 'open-lister-amazon' ); ?>">
									<span class="ola-tick" data-for="<?php echo esc_attr( $key ); ?>" aria-hidden="true"></span>
								</td>
							</tr>
						<?php endforeach; ?>
					</table>

					<p><button type="submit" class="button button-primary button-hero"><?php esc_html_e( 'Connect to Amazon', 'open-lister-amazon' ); ?></button></p>
					<p class="description"><?php esc_html_e( 'Your keys are stored only in this WordPress site and are sent only to Amazon.', 'open-lister-amazon' ); ?></p>
				</div>
			</form>
		</div>
		<?php
	}
}
