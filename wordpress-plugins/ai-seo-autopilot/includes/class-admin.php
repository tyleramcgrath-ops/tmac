<?php
/**
 * Admin screen and AJAX endpoints.
 *
 * @package AISA
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class AISA_Admin {
	const SLUG = 'ai-seo-autopilot';

	public static function init() {
		add_action( 'admin_menu', [ __CLASS__, 'menu' ] );
		add_action( 'admin_enqueue_scripts', [ __CLASS__, 'assets' ] );
		add_action( 'admin_post_aisa_save_settings', [ __CLASS__, 'save_settings' ] );
		add_filter( 'plugin_action_links_' . plugin_basename( AISA_FILE ), [ __CLASS__, 'action_links' ] );

		foreach ( [ 'targets', 'generate', 'apply', 'restore', 'edit', 'profile_generate', 'profile_apply', 'profile_restore', 'health_run', 'test_api', 'export', 'import' ] as $action ) {
			add_action( 'wp_ajax_aisa_' . $action, [ __CLASS__, 'ajax_' . $action ] );
		}
	}

	public static function url( $tab = '' ) {
		return admin_url( 'admin.php?page=' . self::SLUG . ( $tab ? '&tab=' . $tab : '' ) );
	}

	public static function menu() {
		add_menu_page(
			__( 'AI SEO Autopilot', 'ai-seo-autopilot' ),
			__( 'SEO Autopilot', 'ai-seo-autopilot' ),
			'manage_options',
			self::SLUG,
			[ __CLASS__, 'render' ],
			'dashicons-superhero-alt',
			81
		);
	}

	public static function action_links( $links ) {
		array_unshift( $links, '<a href="' . esc_url( self::url() ) . '">' . esc_html__( 'Open', 'ai-seo-autopilot' ) . '</a>' );
		return $links;
	}

	public static function assets( $hook ) {
		if ( 'toplevel_page_' . self::SLUG !== $hook ) {
			return;
		}
		wp_enqueue_style( 'aisa-admin', AISA_URL . 'assets/admin.css', [], AISA_VERSION );
		wp_enqueue_script( 'aisa-admin', AISA_URL . 'assets/admin.js', [], AISA_VERSION, true );
		wp_localize_script(
			'aisa-admin',
			'AISA',
			[
				'ajax'           => admin_url( 'admin-ajax.php' ),
				'nonce'          => wp_create_nonce( 'aisa' ),
				'isPro'          => AISA_AIOSEO_Bridge::is_pro(),
				'hasKey'         => '' !== AISA_Settings::api_key(),
				'profileApplied' => (bool) get_option( AISA_Generator::PROFILE_OPTION . '_applied' ),
				'mode'           => AISA_Settings::get( 'mode' ),
				'concurrency'    => AISA_Settings::token_saver() ? 1 : 3,
				'i18n'           => [
					'confirmApplyAll' => __( 'Write the proposed SEO to every generated page now? Each page keeps a backup you can restore.', 'ai-seo-autopilot' ),
					'confirmRestore'  => __( 'Restore the previous SEO values for this item?', 'ai-seo-autopilot' ),
					'noKey'           => __( 'Add your Anthropic API key on the Settings tab first, or use the Import / Export tab to have Claude write the SEO in a chat with no API key.', 'ai-seo-autopilot' ),
				],
			]
		);
	}

	/* ---------------------------------------------------------------------
	 * Page
	 * ------------------------------------------------------------------- */

	public static function render() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$tab  = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'autopilot'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$tabs = [
			'autopilot' => __( 'Autopilot', 'ai-seo-autopilot' ),
			'profile'   => __( 'Site profile', 'ai-seo-autopilot' ),
			'exchange'  => __( 'Import / Export', 'ai-seo-autopilot' ),
			'settings'  => __( 'Settings', 'ai-seo-autopilot' ),
			'health'    => __( 'Health', 'ai-seo-autopilot' ),
		];
		if ( ! isset( $tabs[ $tab ] ) ) {
			$tab = 'autopilot';
		}
		echo '<div class="wrap aisa-wrap">';
		echo '<h1>' . esc_html__( 'AI SEO Autopilot for All in One SEO', 'ai-seo-autopilot' ) . '</h1>';
		self::status_bar();
		echo '<nav class="nav-tab-wrapper">';
		foreach ( $tabs as $slug => $label ) {
			printf( '<a class="nav-tab %s" href="%s">%s</a>', $slug === $tab ? 'nav-tab-active' : '', esc_url( self::url( $slug ) ), esc_html( $label ) );
		}
		echo '</nav>';
		call_user_func( [ __CLASS__, 'tab_' . $tab ] );
		echo '</div>';
	}

	private static function status_bar() {
		$active = AISA_AIOSEO_Bridge::is_active();
		$health = AISA_Health_Check::last();
		echo '<div class="aisa-status">';
		if ( ! $active ) {
			echo '<span class="aisa-pill aisa-bad">' . esc_html__( 'All in One SEO is not active', 'ai-seo-autopilot' ) . '</span>';
		} else {
			printf(
				'<span class="aisa-pill">%s %s</span>',
				AISA_AIOSEO_Bridge::is_pro() ? 'AIOSEO Pro' : 'AIOSEO Lite',
				esc_html( AISA_AIOSEO_Bridge::version() )
			);
			if ( isset( $health['ok'] ) ) {
				printf(
					'<span class="aisa-pill %s">%s</span>',
					$health['ok'] ? 'aisa-good' : 'aisa-bad',
					$health['ok'] ? esc_html__( 'Compatibility: OK', 'ai-seo-autopilot' ) : esc_html__( 'Compatibility: problem found (see Health)', 'ai-seo-autopilot' )
				);
			}
		}
		if ( '' === AISA_Settings::api_key() ) {
			echo '<span class="aisa-pill aisa-bad">' . esc_html__( 'No API key yet', 'ai-seo-autopilot' ) . '</span>';
		}
		echo '</div>';
	}

	private static function tab_autopilot() {
		$is_pro = AISA_AIOSEO_Bridge::is_pro();
		?>
		<div class="aisa-card aisa-hero">
			<h2><?php esc_html_e( 'Optimize the whole site', 'ai-seo-autopilot' ); ?></h2>
			<p><?php esc_html_e( 'Autopilot works out your business details, writes an SEO title, meta description, focus keyphrase, social tags and schema for every page, and saves them into All in One SEO. Every change is backed up and can be restored.', 'ai-seo-autopilot' ); ?></p>
			<p>
				<label><input type="checkbox" id="aisa-review" checked> <?php esc_html_e( 'Let me review before anything is saved to All in One SEO', 'ai-seo-autopilot' ); ?></label>
			</p>
			<p>
				<button class="button button-primary button-hero" id="aisa-run"><?php esc_html_e( 'Run Autopilot', 'ai-seo-autopilot' ); ?></button>
				<button class="button button-hero" id="aisa-apply-all" disabled><?php esc_html_e( 'Apply all proposals', 'ai-seo-autopilot' ); ?></button>
				<button class="button-link" id="aisa-stop" hidden><?php esc_html_e( 'Stop', 'ai-seo-autopilot' ); ?></button>
			</p>
			<div class="aisa-progress" hidden><div class="aisa-bar"><span></span></div><p class="aisa-progress-text"></p></div>
			<p class="description">
				<?php
				echo esc_html(
					'overwrite' === AISA_Settings::get( 'mode' )
						? __( 'Mode: replace existing SEO values. (Change on the Settings tab.)', 'ai-seo-autopilot' )
						: __( 'Mode: fill empty fields only. Anything you already wrote in All in One SEO is kept. (Change on the Settings tab.)', 'ai-seo-autopilot' )
				);
				?>
			</p>
		</div>

		<?php self::feature_table( $is_pro ); ?>

		<div class="aisa-card">
			<div class="aisa-toolbar">
				<h2><?php esc_html_e( 'Pages', 'ai-seo-autopilot' ); ?></h2>
				<input type="search" id="aisa-filter" placeholder="<?php esc_attr_e( 'Filter…', 'ai-seo-autopilot' ); ?>">
			</div>
			<div id="aisa-table"><p><?php esc_html_e( 'Loading…', 'ai-seo-autopilot' ); ?></p></div>
		</div>
		<?php
	}

	private static function feature_table( $is_pro ) {
		$pro_note = $is_pro ? __( 'Available', 'ai-seo-autopilot' ) : __( 'Needs AIOSEO Pro', 'ai-seo-autopilot' );
		$rows     = [
			[ __( 'SEO titles and meta descriptions', 'ai-seo-autopilot' ), true, __( 'Available', 'ai-seo-autopilot' ) ],
			[ __( 'Focus keyphrase', 'ai-seo-autopilot' ), true, __( 'Available', 'ai-seo-autopilot' ) ],
			[ __( 'Facebook / X social titles and descriptions', 'ai-seo-autopilot' ), true, __( 'Available', 'ai-seo-autopilot' ) ],
			[ __( 'Knowledge graph: business name, logo, phone, email, social profiles', 'ai-seo-autopilot' ), true, __( 'Available', 'ai-seo-autopilot' ) ],
			[ __( 'Per-page schema: page type, article type, Service, FAQ, local business details', 'ai-seo-autopilot' ), true, __( 'Available', 'ai-seo-autopilot' ) ],
			[ __( 'Additional keyphrases', 'ai-seo-autopilot' ), $is_pro, $pro_note ],
			[
				__( 'Category and tag archive SEO', 'ai-seo-autopilot' ),
				AISA_AIOSEO_Bridge::supports_terms(),
				$is_pro
					? ( AISA_AIOSEO_Bridge::supports_terms() ? __( 'Available', 'ai-seo-autopilot' ) : __( 'Your AIOSEO Pro build does not expose term abilities yet (needs WordPress 6.9+)', 'ai-seo-autopilot' ) )
					: __( 'Needs AIOSEO Pro', 'ai-seo-autopilot' ),
			],
		];
		echo '<details class="aisa-card aisa-features"' . ( $is_pro ? '' : ' open' ) . '><summary>' . esc_html__( 'What gets filled in', 'ai-seo-autopilot' ) . '</summary><table class="widefat striped"><tbody>';
		foreach ( $rows as $r ) {
			printf( '<tr><td>%s</td><td><span class="aisa-pill %s">%s</span></td></tr>', esc_html( $r[0] ), $r[1] ? 'aisa-good' : 'aisa-muted', esc_html( $r[2] ) );
		}
		echo '</tbody></table>';
		if ( ! $is_pro ) {
			echo '<p class="description">' . esc_html__( 'You are on All in One SEO Lite. Everything marked "Available" works fully; the Pro-only items are skipped and will switch on automatically if you upgrade.', 'ai-seo-autopilot' ) . '</p>';
		}
		echo '</details>';
	}

	private static function tab_profile() {
		$p = AISA_Generator::profile();
		?>
		<div class="aisa-card">
			<h2><?php esc_html_e( 'Site profile', 'ai-seo-autopilot' ); ?></h2>
			<p><?php esc_html_e( 'The facts about your business that go into All in One SEO\'s knowledge graph and into every page prompt. Claude fills this in from your homepage, About and Contact pages. Check it, especially phone, email and address, then apply.', 'ai-seo-autopilot' ); ?></p>
			<p>
				<button class="button" id="aisa-profile-generate"><?php esc_html_e( 'Analyze my site', 'ai-seo-autopilot' ); ?></button>
				<span class="aisa-inline-status" id="aisa-profile-status"></span>
			</p>
			<form id="aisa-profile-form">
				<table class="form-table" role="presentation"><tbody>
				<?php
				self::profile_row( 'site_represents', __( 'This site represents', 'ai-seo-autopilot' ), isset( $p['site_represents'] ) ? $p['site_represents'] : 'organization', [ 'organization' => __( 'An organization / business', 'ai-seo-autopilot' ), 'person' => __( 'A person', 'ai-seo-autopilot' ) ] );
				self::profile_row( 'name', __( 'Name', 'ai-seo-autopilot' ), isset( $p['name'] ) ? $p['name'] : '' );
				self::profile_row( 'description', __( 'Short description', 'ai-seo-autopilot' ), isset( $p['description'] ) ? $p['description'] : '', 'textarea' );
				self::profile_row( 'business_type', __( 'Schema.org business type', 'ai-seo-autopilot' ), isset( $p['business_type'] ) ? $p['business_type'] : '', null, __( 'e.g. Plumber, Dentist, LegalService, Restaurant, Organization', 'ai-seo-autopilot' ) );
				self::profile_row( 'logo', __( 'Logo URL', 'ai-seo-autopilot' ), isset( $p['logo'] ) ? $p['logo'] : AISA_Generator::site_logo_url() );
				self::profile_row( 'phone', __( 'Phone', 'ai-seo-autopilot' ), isset( $p['phone'] ) ? $p['phone'] : '', null, __( 'International format, e.g. +1-555-123-4567', 'ai-seo-autopilot' ) );
				self::profile_row( 'email', __( 'Email', 'ai-seo-autopilot' ), isset( $p['email'] ) ? $p['email'] : '' );
				self::profile_row( 'founding_date', __( 'Founding date', 'ai-seo-autopilot' ), isset( $p['founding_date'] ) ? $p['founding_date'] : '' );
				foreach ( [ 'street' => __( 'Street address', 'ai-seo-autopilot' ), 'city' => __( 'City', 'ai-seo-autopilot' ), 'region' => __( 'State / region', 'ai-seo-autopilot' ), 'postal_code' => __( 'Postal code', 'ai-seo-autopilot' ), 'country' => __( 'Country', 'ai-seo-autopilot' ) ] as $k => $label ) {
					self::profile_row( 'address[' . $k . ']', $label, isset( $p['address'][ $k ] ) ? $p['address'][ $k ] : '' );
				}
				self::profile_row( 'area_served', __( 'Area served', 'ai-seo-autopilot' ), isset( $p['area_served'] ) ? $p['area_served'] : '' );
				self::profile_row( 'price_range', __( 'Price range', 'ai-seo-autopilot' ), isset( $p['price_range'] ) ? $p['price_range'] : '', null, __( 'e.g. $$', 'ai-seo-autopilot' ) );
				self::profile_row( 'home_title', __( 'Homepage SEO title', 'ai-seo-autopilot' ), isset( $p['home_title'] ) ? $p['home_title'] : '', null, 'page' === get_option( 'show_on_front' ) ? __( 'Your homepage is a static page, so its title is set with the other pages on the Autopilot tab.', 'ai-seo-autopilot' ) : '' );
				self::profile_row( 'home_description', __( 'Homepage meta description', 'ai-seo-autopilot' ), isset( $p['home_description'] ) ? $p['home_description'] : '', 'textarea' );
				self::profile_row( 'primary_keyphrase', __( 'Main site keyphrase', 'ai-seo-autopilot' ), isset( $p['primary_keyphrase'] ) ? $p['primary_keyphrase'] : '' );
				self::profile_row( 'voice', __( 'Brand voice', 'ai-seo-autopilot' ), isset( $p['voice'] ) ? $p['voice'] : '', 'textarea' );
				foreach ( AISA_Generator::SOCIAL_KEYS as $k ) {
					self::profile_row( 'social[' . $k . ']', ucwords( str_replace( '_', ' ', $k ) ) . ' URL', isset( $p['social'][ $k ] ) ? $p['social'][ $k ] : '' );
				}
				?>
				</tbody></table>
				<p>
					<button type="submit" class="button button-primary"><?php esc_html_e( 'Save and apply to All in One SEO', 'ai-seo-autopilot' ); ?></button>
					<button type="button" class="button" id="aisa-profile-restore"><?php esc_html_e( 'Restore previous AIOSEO settings', 'ai-seo-autopilot' ); ?></button>
				</p>
				<div id="aisa-profile-report"></div>
			</form>
		</div>
		<?php
	}

	private static function profile_row( $name, $label, $value, $type = null, $help = '' ) {
		$id = 'aisa-p-' . preg_replace( '/[^a-z_]/', '-', $name );
		echo '<tr><th scope="row"><label for="' . esc_attr( $id ) . '">' . esc_html( $label ) . '</label></th><td>';
		if ( is_array( $type ) ) {
			echo '<select id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '">';
			foreach ( $type as $v => $l ) {
				printf( '<option value="%s" %s>%s</option>', esc_attr( $v ), selected( $value, $v, false ), esc_html( $l ) );
			}
			echo '</select>';
		} elseif ( 'textarea' === $type ) {
			echo '<textarea class="large-text" rows="2" id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '">' . esc_textarea( $value ) . '</textarea>';
		} else {
			echo '<input type="text" class="regular-text" id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $value ) . '">';
		}
		if ( $help ) {
			echo '<p class="description">' . esc_html( $help ) . '</p>';
		}
		echo '</td></tr>';
	}

	private static function tab_exchange() {
		$user = wp_get_current_user();
		?>
		<div class="aisa-card">
			<h2><?php esc_html_e( 'Write the SEO without an API key', 'ai-seo-autopilot' ); ?></h2>
			<p><?php esc_html_e( 'Claude can write your SEO in a normal Claude chat, using your Claude plan instead of Anthropic API credits. Use either option below. Everything imported lands as proposals on the Autopilot tab, where you review it and click Apply, with the usual backups and restore.', 'ai-seo-autopilot' ); ?></p>
		</div>

		<div class="aisa-card">
			<h2><?php esc_html_e( 'Option 1: let Claude connect to this site', 'ai-seo-autopilot' ); ?></h2>
			<ol>
				<li><?php echo wp_kses_post( sprintf( __( 'Go to <a href="%s">Users → Profile</a>, scroll to <strong>Application Passwords</strong>, type the name "Claude SEO" and click <strong>Add New Application Password</strong>.', 'ai-seo-autopilot' ), esc_url( admin_url( 'profile.php#application-passwords-section' ) ) ) ); ?></li>
				<li><?php esc_html_e( 'Give Claude these three things:', 'ai-seo-autopilot' ); ?>
					<ul class="aisa-list">
						<li><?php echo esc_html__( 'Site address:', 'ai-seo-autopilot' ) . ' <code>' . esc_html( home_url( '/' ) ) . '</code>'; ?></li>
						<li><?php echo esc_html__( 'Username:', 'ai-seo-autopilot' ) . ' <code>' . esc_html( $user->user_login ) . '</code>'; ?></li>
						<li><?php esc_html_e( 'The application password WordPress just showed you.', 'ai-seo-autopilot' ); ?></li>
					</ul>
				</li>
				<li><?php esc_html_e( 'When Claude is done, revoke the application password on the same screen. It is separate from your login password and cannot be used to sign in to wp-admin, but while it exists it has your account\'s access to the WordPress API, so treat it like a password.', 'ai-seo-autopilot' ); ?></li>
			</ol>
			<p class="description"><?php echo esc_html__( 'Endpoints Claude uses:', 'ai-seo-autopilot' ) . ' <code>' . esc_html( rest_url( AISA_Exchange::NS . '/export' ) ) . '</code>, <code>' . esc_html( rest_url( AISA_Exchange::NS . '/import' ) ) . '</code>'; ?></p>
		</div>

		<div class="aisa-card">
			<h2><?php esc_html_e( 'Option 2: swap files', 'ai-seo-autopilot' ); ?></h2>
			<p><strong>1.</strong> <button class="button" id="aisa-export"><?php esc_html_e( 'Download site content (.json)', 'ai-seo-autopilot' ); ?></button> <span class="aisa-inline-status" id="aisa-export-status"></span></p>
			<p class="description"><?php esc_html_e( 'Contains your page titles, addresses, current SEO and page text. Attach it in your Claude chat and ask for an AI SEO Autopilot import file.', 'ai-seo-autopilot' ); ?></p>
			<p><strong>2.</strong> <input type="file" id="aisa-import-file" accept=".json,application/json"> <label><input type="checkbox" id="aisa-import-apply"> <?php esc_html_e( 'Apply to All in One SEO immediately (otherwise review first)', 'ai-seo-autopilot' ); ?></label></p>
			<p><button class="button button-primary" id="aisa-import"><?php esc_html_e( 'Import SEO file', 'ai-seo-autopilot' ); ?></button></p>
			<div id="aisa-import-report"></div>
		</div>
		<?php
	}

	private static function tab_settings() {
		$s = AISA_Settings::all();
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['saved'] ) ) {
			echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Settings saved.', 'ai-seo-autopilot' ) . '</p></div>';
		}
		$key    = AISA_Settings::api_key();
		$masked = '' !== $key ? substr( $key, 0, 7 ) . str_repeat( '•', 12 ) . substr( $key, -4 ) : '';
		?>
		<form class="aisa-card" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="aisa_save_settings">
			<?php wp_nonce_field( 'aisa_save_settings' ); ?>
			<table class="form-table" role="presentation"><tbody>
				<tr>
					<th scope="row"><label for="aisa-key"><?php esc_html_e( 'Anthropic API key', 'ai-seo-autopilot' ); ?></label></th>
					<td>
						<?php if ( AISA_Settings::api_key_is_constant() ) : ?>
							<p><?php esc_html_e( 'Set in wp-config.php (AISA_ANTHROPIC_API_KEY).', 'ai-seo-autopilot' ); ?></p>
						<?php else : ?>
							<input type="password" class="regular-text" id="aisa-key" name="aisa[api_key]" value="<?php echo esc_attr( $masked ); ?>" autocomplete="off">
							<?php if ( $masked ) : ?>
								<label><input type="checkbox" name="aisa[clear_api_key]" value="1"> <?php esc_html_e( 'Remove key', 'ai-seo-autopilot' ); ?></label>
							<?php endif; ?>
							<p class="description"><?php esc_html_e( 'Create one at console.anthropic.com. For extra safety you can instead add define( \'AISA_ANTHROPIC_API_KEY\', \'sk-ant-…\' ); to wp-config.php.', 'ai-seo-autopilot' ); ?></p>
						<?php endif; ?>
						<p><button type="button" class="button" id="aisa-test-api"><?php esc_html_e( 'Test connection', 'ai-seo-autopilot' ); ?></button> <span class="aisa-inline-status" id="aisa-test-status"></span></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="aisa-model"><?php esc_html_e( 'Model', 'ai-seo-autopilot' ); ?></label></th>
					<td><select id="aisa-model" name="aisa[model]">
						<?php foreach ( AISA_Settings::models() as $id => $label ) : ?>
							<option value="<?php echo esc_attr( $id ); ?>" <?php selected( $s['model'], $id ); ?>><?php echo esc_html( $label ); ?></option>
						<?php endforeach; ?>
					</select></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Token saver', 'ai-seo-autopilot' ); ?></th>
					<td>
						<input type="hidden" name="aisa[token_saver]" value="0">
						<label><input type="checkbox" name="aisa[token_saver]" value="1" <?php checked( ! empty( $s['token_saver'] ) ); ?>> <?php esc_html_e( 'Use as few tokens as possible (recommended)', 'ai-seo-autopilot' ); ?></label>
						<p class="description"><?php esc_html_e( 'Sends only the first 6,000 characters of each page, shortens over-long titles in code instead of asking Claude again, skips pages whose title, description and keyphrase you already wrote, and works on one page at a time so you stay under rate limits. Combined with Haiku 4.5 this uses a small fraction of the tokens of Opus with token saver off.', 'ai-seo-autopilot' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="aisa-effort"><?php esc_html_e( 'Effort', 'ai-seo-autopilot' ); ?></label></th>
					<td><select id="aisa-effort" name="aisa[effort]">
						<?php foreach ( [ 'low' => __( 'Low (fast, recommended)', 'ai-seo-autopilot' ), 'medium' => __( 'Medium', 'ai-seo-autopilot' ), 'high' => __( 'High (slowest)', 'ai-seo-autopilot' ) ] as $v => $l ) : ?>
							<option value="<?php echo esc_attr( $v ); ?>" <?php selected( $s['effort'], $v ); ?>><?php echo esc_html( $l ); ?></option>
						<?php endforeach; ?>
					</select>
					<p class="description"><?php esc_html_e( 'How much Claude thinks per page. Higher effort costs more and takes longer. Low is plenty for metadata.', 'ai-seo-autopilot' ); ?></p></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Existing SEO values', 'ai-seo-autopilot' ); ?></th>
					<td>
						<label><input type="radio" name="aisa[mode]" value="fill_empty" <?php checked( $s['mode'], 'fill_empty' ); ?>> <?php esc_html_e( 'Only fill fields that are empty (keeps anything you wrote)', 'ai-seo-autopilot' ); ?></label><br>
						<label><input type="radio" name="aisa[mode]" value="overwrite" <?php checked( $s['mode'], 'overwrite' ); ?>> <?php esc_html_e( 'Replace everything with the new values', 'ai-seo-autopilot' ); ?></label>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Content types', 'ai-seo-autopilot' ); ?></th>
					<td>
						<input type="hidden" name="aisa[post_types][]" value="">
						<?php foreach ( AISA_Settings::available_post_types() as $slug => $label ) : ?>
							<label><input type="checkbox" name="aisa[post_types][]" value="<?php echo esc_attr( $slug ); ?>" <?php checked( in_array( $slug, (array) $s['post_types'], true ) ); ?>> <?php echo esc_html( $label ); ?></label><br>
						<?php endforeach; ?>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="aisa-notes"><?php esc_html_e( 'Notes about the business', 'ai-seo-autopilot' ); ?></label></th>
					<td><textarea id="aisa-notes" class="large-text" rows="4" name="aisa[business_notes]"><?php echo esc_textarea( $s['business_notes'] ); ?></textarea>
					<p class="description"><?php esc_html_e( 'Optional. Anything Claude should know: target city, main services, keywords you want to rank for, words to avoid.', 'ai-seo-autopilot' ); ?></p></td>
				</tr>
				<tr>
					<th scope="row"><label for="aisa-lang"><?php esc_html_e( 'Language', 'ai-seo-autopilot' ); ?></label></th>
					<td><input type="text" id="aisa-lang" name="aisa[language]" value="<?php echo esc_attr( $s['language'] ); ?>" placeholder="<?php echo esc_attr( get_locale() ); ?>">
					<p class="description"><?php esc_html_e( 'Leave empty to use the site language.', 'ai-seo-autopilot' ); ?></p></td>
				</tr>
			</tbody></table>
			<?php submit_button(); ?>
		</form>
		<?php
	}

	private static function tab_health() {
		$h = AISA_Health_Check::last();
		?>
		<div class="aisa-card">
			<h2><?php esc_html_e( 'Compatibility with All in One SEO', 'ai-seo-autopilot' ); ?></h2>
			<p><?php esc_html_e( 'This test runs by itself whenever All in One SEO, WordPress or this plugin updates. It saves test values on a temporary draft post, reads them back, and deletes the draft. If a write path stops working, the plugin switches to the next one that still works. If none work, nothing is written and you see a notice.', 'ai-seo-autopilot' ); ?></p>
			<p><button class="button" id="aisa-health-run"><?php esc_html_e( 'Run the test now', 'ai-seo-autopilot' ); ?></button> <span class="aisa-inline-status" id="aisa-health-status"></span></p>
			<?php if ( $h ) : ?>
				<table class="widefat striped"><thead><tr><th><?php esc_html_e( 'Write path', 'ai-seo-autopilot' ); ?></th><th><?php esc_html_e( 'Found', 'ai-seo-autopilot' ); ?></th><th><?php esc_html_e( 'Round-trip test', 'ai-seo-autopilot' ); ?></th></tr></thead><tbody>
				<?php foreach ( (array) ( isset( $h['adapters'] ) ? $h['adapters'] : [] ) as $a ) : ?>
					<tr>
						<td><?php echo esc_html( $a['label'] ); ?></td>
						<td><?php echo $a['available'] ? '✓' : '—'; ?></td>
						<td><?php echo $a['available'] ? ( $a['passed'] ? '<span class="aisa-pill aisa-good">' . esc_html__( 'Passed', 'ai-seo-autopilot' ) . '</span>' : '<span class="aisa-pill aisa-bad">' . esc_html__( 'Failed', 'ai-seo-autopilot' ) . '</span> ' . esc_html( $a['error'] ) ) : '—'; ?></td>
					</tr>
				<?php endforeach; ?>
				</tbody></table>
				<p><?php echo esc_html( sprintf( __( 'Last run: %s', 'ai-seo-autopilot' ), isset( $h['ran_at'] ) ? $h['ran_at'] : '' ) ); ?></p>
			<?php endif; ?>
		</div>
		<div class="aisa-card">
			<h2><?php esc_html_e( 'Diagnostic report', 'ai-seo-autopilot' ); ?></h2>
			<p><?php esc_html_e( 'If an AIOSEO update breaks something, copy this and paste it to Claude. It lists exactly what changed, so a small fix plugin can be written without guessing. It contains no API keys or content.', 'ai-seo-autopilot' ); ?></p>
			<textarea class="large-text code" rows="16" readonly id="aisa-report"><?php echo esc_textarea( AISA_Health_Check::report() ); ?></textarea>
			<p><button class="button" id="aisa-copy-report"><?php esc_html_e( 'Copy report', 'ai-seo-autopilot' ); ?></button></p>
		</div>
		<?php
	}

	public static function save_settings() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Not allowed.', 'ai-seo-autopilot' ) );
		}
		check_admin_referer( 'aisa_save_settings' );
		$input = isset( $_POST['aisa'] ) && is_array( $_POST['aisa'] ) ? $_POST['aisa'] : []; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized in save().
		if ( isset( $input['post_types'] ) ) {
			$input['post_types'] = array_filter( (array) $input['post_types'] );
		}
		AISA_Settings::save( $input );
		wp_safe_redirect( add_query_arg( 'saved', '1', self::url( 'settings' ) ) );
		exit;
	}

	/* ---------------------------------------------------------------------
	 * AJAX
	 * ------------------------------------------------------------------- */

	private static function guard() {
		check_ajax_referer( 'aisa', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( [ 'message' => __( 'Not allowed.', 'ai-seo-autopilot' ) ], 403 );
		}
	}

	/**
	 * Validated type/id from the request, with a per-item capability check.
	 *
	 * @return array{0:string,1:int}
	 */
	private static function item() {
		$type = isset( $_POST['type'] ) && 'term' === $_POST['type'] ? 'term' : 'post'; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$id   = isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		if ( ! $id ) {
			wp_send_json_error( [ 'message' => 'Missing id.' ], 400 );
		}
		if ( 'post' === $type && ! current_user_can( 'edit_post', $id ) ) {
			wp_send_json_error( [ 'message' => __( 'You cannot edit this item.', 'ai-seo-autopilot' ) ], 403 );
		}
		if ( 'term' === $type && ! current_user_can( 'edit_term', $id ) ) {
			wp_send_json_error( [ 'message' => __( 'You cannot edit this item.', 'ai-seo-autopilot' ) ], 403 );
		}
		return [ $type, $id ];
	}

	private static function respond( $result ) {
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( [ 'message' => $result->get_error_message() ] );
		}
		wp_send_json_success( $result );
	}

	public static function ajax_targets() {
		self::guard();
		$rows = AISA_Jobs::targets();
		foreach ( $rows as &$row ) {
			$current        = 'term' === $row['type'] ? AISA_AIOSEO_Bridge::read_term( $row['id'] ) : AISA_AIOSEO_Bridge::read( $row['id'] );
			$row['current'] = is_wp_error( $current ) ? null : $current;
		}
		wp_send_json_success( $rows );
	}

	public static function ajax_generate() {
		self::guard();
		list( $type, $id ) = self::item();
		self::respond( AISA_Jobs::generate( $type, $id ) );
	}

	public static function ajax_apply() {
		self::guard();
		list( $type, $id ) = self::item();
		$row               = AISA_Jobs::apply( $type, $id );
		if ( ! is_wp_error( $row ) ) {
			$current        = 'term' === $type ? AISA_AIOSEO_Bridge::read_term( $id ) : AISA_AIOSEO_Bridge::read( $id );
			$row['current'] = is_wp_error( $current ) ? null : $current;
		}
		self::respond( $row );
	}

	public static function ajax_restore() {
		self::guard();
		list( $type, $id ) = self::item();
		$row               = AISA_Jobs::restore( $type, $id );
		if ( ! is_wp_error( $row ) ) {
			$current        = 'term' === $type ? AISA_AIOSEO_Bridge::read_term( $id ) : AISA_AIOSEO_Bridge::read( $id );
			$row['current'] = is_wp_error( $current ) ? null : $current;
		}
		self::respond( $row );
	}

	public static function ajax_edit() {
		self::guard();
		list( $type, $id ) = self::item();
		$fields            = isset( $_POST['fields'] ) && is_array( $_POST['fields'] ) ? $_POST['fields'] : []; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.NonceVerification.Missing -- sanitized in edit().
		self::respond( AISA_Jobs::edit( $type, $id, $fields ) );
	}

	public static function ajax_profile_generate() {
		self::guard();
		self::respond( AISA_Generator::generate_profile() );
	}

	public static function ajax_profile_apply() {
		self::guard();
		$raw     = isset( $_POST['profile'] ) && is_array( $_POST['profile'] ) ? wp_unslash( $_POST['profile'] ) : []; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.NonceVerification.Missing -- sanitized below.
		$profile = AISA_Generator::sanitize_profile( $raw );
		wp_send_json_success(
			[
				'profile' => $profile,
				'report'  => AISA_Jobs::apply_profile( $profile ),
			]
		);
	}

	public static function ajax_profile_restore() {
		self::guard();
		wp_send_json_success( [ 'report' => AISA_Jobs::restore_profile() ] );
	}

	public static function ajax_health_run() {
		self::guard();
		$result = AISA_Health_Check::run();
		wp_send_json_success(
			[
				'ok'     => $result['ok'],
				'report' => AISA_Health_Check::report(),
			]
		);
	}

	public static function ajax_export() {
		self::guard();
		if ( function_exists( 'set_time_limit' ) ) {
			@set_time_limit( 120 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		}
		// If PHP dies anyway (memory, a fatal in another plugin), answer with the real reason
		// instead of a bare HTTP 500, so it can be reported and fixed.
		// WordPress's own "critical error" page would answer first with HTML and a 500.
		add_filter( 'wp_fatal_error_handler_enabled', '__return_false' );
		// Held back so the error report below can still run after PHP runs out of memory.
		$reserve = str_repeat( ' ', 2 * 1024 * 1024 );
		register_shutdown_function(
			function () use ( &$reserve ) {
				$reserve = null;
				$err     = error_get_last();
				if ( ! $err || ! in_array( $err['type'], [ E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR ], true ) ) {
					return;
				}
				while ( ob_get_level() ) {
					ob_end_clean();
				}
				if ( ! headers_sent() ) {
					status_header( 200 );
					header( 'Content-Type: application/json; charset=utf-8' );
				}
				echo wp_json_encode(
					[
						'success' => false,
						'data'    => [
							'message' => sprintf( 'PHP error while exporting %s: %s in %s:%d', AISA_Exchange::$current, $err['message'], $err['file'], $err['line'] ),
							'fatal'   => true,
						],
					]
				);
			}
		);
		$offset = isset( $_POST['offset'] ) ? absint( $_POST['offset'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$limit  = isset( $_POST['limit'] ) ? min( 50, max( 1, absint( $_POST['limit'] ) ) ) : 10; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		wp_send_json_success( AISA_Exchange::export( $offset, $limit ) );
	}

	public static function ajax_import() {
		self::guard();
		$raw     = isset( $_POST['payload'] ) ? wp_unslash( $_POST['payload'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.NonceVerification.Missing -- JSON, sanitized per field in import().
		$payload = json_decode( (string) $raw, true );
		if ( ! is_array( $payload ) ) {
			wp_send_json_error( [ 'message' => __( 'That file is not valid JSON.', 'ai-seo-autopilot' ) ] );
		}
		if ( isset( $_POST['apply'] ) && '1' === $_POST['apply'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			$payload['apply']         = true;
			$payload['apply_profile'] = true;
		}
		wp_send_json_success( AISA_Exchange::import( $payload ) );
	}

	public static function ajax_test_api() {
		self::guard();
		$out = AISA_Claude_Client::json(
			'Reply with the requested JSON.',
			'Return {"ok": true}.',
			[
				'type'                 => 'object',
				'additionalProperties' => false,
				'required'             => [ 'ok' ],
				'properties'           => [ 'ok' => [ 'type' => 'boolean' ] ],
			]
		);
		self::respond( is_wp_error( $out ) ? $out : [ 'message' => __( 'Connected. Claude is responding.', 'ai-seo-autopilot' ) ] );
	}
}
