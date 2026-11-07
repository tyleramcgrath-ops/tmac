<?php
/**
 * Appearance > McGrath Chrome: what the theme can actually see.
 *
 * Built because too much guessing went into "the links go to the wrong pages".
 * This shows the page each part of the theme resolves to, every duplicate, and
 * where each navigation item actually points, so the answer is on the screen
 * rather than inferred.
 *
 * @package mcgrath-chrome
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Human names for the theme's page keys. */
function mcg_key_names() {
	return array(
		'home'      => __( 'Home', 'mcgrath-chrome' ),
		'seo'       => __( 'SEO', 'mcgrath-chrome' ),
		'webdesign' => __( 'Web Design', 'mcgrath-chrome' ),
		'aeo'       => __( 'AI Visibility', 'mcgrath-chrome' ),
		'about'     => __( 'About', 'mcgrath-chrome' ),
		'contact'   => __( 'Contact', 'mcgrath-chrome' ),
		'vault'     => __( 'The Vault', 'mcgrath-chrome' ),
		'blog'      => __( 'Blog', 'mcgrath-chrome' ),
	);
}

/** Every page ID the theme considers one of its own. */
function mcg_owned_page_ids() {
	$ids = array();

	foreach ( array_keys( mcg_key_names() ) as $key ) {
		$id = mcg_page_id( $key );
		if ( $id ) {
			$ids[ $id ] = $key;
		}
	}

	return $ids;
}

/**
 * What each of the theme's pages needs, given what is actually on the site.
 *
 * Four states, and every one of them has turned up in practice:
 *
 *   ok      the page exists, carries the template and sits on its slug
 *   adopt   a page exists but is not running the theme's template, so it
 *           renders through the generic page.php — a bare title on an empty
 *           band. This is what "the menu goes to the old page" looks like.
 *   rename  it has the template but is still on an older address
 *   create  nothing matches, so the theme has no page to point at
 *
 * A page is matched by template first, then by the slug the theme uses now,
 * then by the slugs it has used before. Adopting keeps the existing page, with
 * its ID, its history and every menu item and inbound link already pointing at
 * it; the template renders the theme's copy and then whatever was in the body.
 *
 * @return array key => array( action, page, target_slug, target_title )
 */
function mcg_page_plan() {
	$slugs     = mcg_slugs();
	$legacy    = mcg_legacy_slugs();
	$templates = mcg_templates();
	$map       = mcg_pages_map();
	$plan      = array();
	$claimed   = array();

	foreach ( $templates as $key => $template ) {
		$target = $slugs[ $key ];
		$page   = null;

		// 1. a page already running this template, oldest first.
		foreach ( mcg_pages_using_template( $template ) as $candidate ) {
			if ( ! isset( $claimed[ $candidate->ID ] ) ) {
				$page = $candidate;
				break;
			}
		}

		// 2. the slug the theme uses now, then the ones it used before.
		if ( ! $page ) {
			$tries = array_merge( array( $target ), isset( $legacy[ $key ] ) ? $legacy[ $key ] : array() );
			foreach ( $tries as $slug ) {
				$found = get_page_by_path( $slug );
				if ( $found && ! isset( $claimed[ $found->ID ] ) ) {
					$page = $found;
					break;
				}
			}
		}

		$title = isset( $map[ $target ]['title'] ) ? $map[ $target ]['title'] : '';

		if ( ! $page ) {
			$plan[ $key ] = array(
				'action'       => 'create',
				'page'         => null,
				'target_slug'  => $target,
				'target_title' => $title,
			);
			continue;
		}

		$claimed[ $page->ID ] = true;

		$has_template = get_post_meta( $page->ID, '_wp_page_template', true ) === $template;
		$on_slug      = $page->post_name === $target;

		if ( ! $has_template ) {
			$action = 'adopt';
		} elseif ( ! $on_slug ) {
			$action = 'rename';
		} else {
			$action = 'ok';
		}

		$plan[ $key ] = array(
			'action'       => $action,
			'page'         => $page,
			'target_slug'  => $target,
			'target_title' => $title,
		);
	}

	return $plan;
}

/**
 * Apply the plan.
 *
 * @param bool $rename Also move pages onto the theme's slugs. Off by default:
 *                     an address that has been live and collecting links is
 *                     worth more than a tidier one, so moving it is a choice.
 */
function mcg_apply_page_plan( $rename = false ) {
	$templates = mcg_templates();
	$map       = mcg_pages_map();

	foreach ( mcg_page_plan() as $key => $item ) {
		$template = $templates[ $key ];

		if ( 'create' === $item['action'] ) {
			$id = wp_insert_post( array(
				'post_title'   => $item['target_title'],
				'post_name'    => $item['target_slug'],
				'post_status'  => 'publish',
				'post_type'    => 'page',
				'post_excerpt' => isset( $map[ $item['target_slug'] ]['excerpt'] ) ? $map[ $item['target_slug'] ]['excerpt'] : '',
			) );

			if ( ! is_wp_error( $id ) && $id ) {
				update_post_meta( $id, '_wp_page_template', $template );

				if ( 'vault' === $key ) {
					$pass = wp_generate_password( 12, false );
					wp_update_post( array( 'ID' => $id, 'post_password' => $pass ) );
					set_transient( 'mcg_vault_pass', $pass, DAY_IN_SECONDS );
				}
			}
			continue;
		}

		if ( ! $item['page'] ) {
			continue;
		}

		if ( 'adopt' === $item['action'] ) {
			update_post_meta( $item['page']->ID, '_wp_page_template', $template );
		}

		if ( $rename && $item['page']->post_name !== $item['target_slug'] ) {
			$taken = get_page_by_path( $item['target_slug'] );
			if ( ! $taken || (int) $taken->ID === (int) $item['page']->ID ) {
				wp_update_post( array(
					'ID'         => $item['page']->ID,
					'post_name'  => $item['target_slug'],
					'post_title' => $item['target_title'] ? $item['target_title'] : $item['page']->post_title,
				) );
			}
		}
	}
}

/**
 * Build any of the theme's pages that are missing, once.
 *
 * The navigation links to the theme's pages, so they have to exist or those
 * links lead nowhere. Activation only fires on a theme switch, and uploading a
 * new version of the same theme is not one, so this covers the gap. It runs in
 * the admin only, once, and creates — it never edits or claims a page that is
 * already there.
 */
function mcg_ensure_pages() {
	if ( ! is_admin() || ! current_user_can( 'edit_theme_options' ) ) {
		return;
	}

	if ( get_option( 'mcg_pages_built' ) === MCG_VERSION ) {
		return;
	}

	$missing = false;
	foreach ( mcg_page_plan() as $item ) {
		if ( 'create' === $item['action'] ) {
			$missing = true;
			break;
		}
	}

	if ( $missing ) {
		mcg_apply_page_plan( false );
	}

	update_option( 'mcg_pages_built', MCG_VERSION );
}
add_action( 'admin_init', 'mcg_ensure_pages', 20 );

/** Handle the apply link. */
function mcg_maybe_apply_plan() {
	if ( ! isset( $_GET['mcg_fix_pages'] ) || ! current_user_can( 'edit_theme_options' ) ) {
		return;
	}
	check_admin_referer( 'mcg_fix_pages' );
	mcg_apply_page_plan( ! empty( $_GET['rename'] ) );
	// The pages are no use if the navigation still points at the old site's,
	// so the one button finishes the job.
	mcg_repair_menus();
	wp_safe_redirect( admin_url( 'themes.php?page=mcg-chrome&applied=1' ) );
	exit;
}
add_action( 'admin_init', 'mcg_maybe_apply_plan' );

/** Point the menus at the theme's pages. */
function mcg_repair_menus() {
	$locations = get_nav_menu_locations();
	$labels    = mcg_nav_labels();
	$slugs     = mcg_slugs();
	$order     = array( 'seo', 'webdesign', 'aeo', 'about', 'contact' );

	foreach ( array( 'primary', 'footer' ) as $location ) {
		if ( empty( $locations[ $location ] ) ) {
			continue;
		}

		$menu_id = (int) $locations[ $location ];
		$items   = wp_get_nav_menu_items( $menu_id );

		// Clear it out, then rebuild from the pages the theme resolves to. A
		// menu pointing at the wrong pages is the whole problem; patching it
		// item by item leaves whatever else was in there still pointing wrong.
		if ( $items ) {
			foreach ( $items as $item ) {
				wp_delete_post( $item->ID, true );
			}
		}

		foreach ( $order as $key ) {
			$id = mcg_page_id( $key );
			if ( ! $id ) {
				continue;
			}

			wp_update_nav_menu_item( $menu_id, 0, array(
				'menu-item-object-id' => $id,
				'menu-item-object'    => 'page',
				'menu-item-type'      => 'post_type',
				'menu-item-status'    => 'publish',
				'menu-item-title'     => $labels[ $slugs[ $key ] ],
			) );
		}
	}
}

/** Handle the repair link. */
function mcg_maybe_repair_menus() {
	if ( ! isset( $_GET['mcg_fix_menu'] ) || ! current_user_can( 'edit_theme_options' ) ) {
		return;
	}
	check_admin_referer( 'mcg_fix_menu' );
	mcg_repair_menus();
	wp_safe_redirect( admin_url( 'themes.php?page=mcg-chrome&fixed=1' ) );
	exit;
}
add_action( 'admin_init', 'mcg_maybe_repair_menus' );

/** Register the screen. */
function mcg_diagnostics_menu() {
	add_theme_page(
		__( 'McGrath Chrome', 'mcgrath-chrome' ),
		__( 'McGrath Chrome', 'mcgrath-chrome' ),
		'edit_theme_options',
		'mcg-chrome',
		'mcg_diagnostics_screen'
	);
}
add_action( 'admin_menu', 'mcg_diagnostics_menu' );

/** Render it. */
function mcg_diagnostics_screen() {
	$names     = mcg_key_names();
	$templates = mcg_templates();
	$owned     = mcg_owned_page_ids();
	$locations = get_nav_menu_locations();
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'McGrath Chrome', 'mcgrath-chrome' ); ?></h1>

		<?php if ( isset( $_GET['fixed'] ) ) : ?>
			<div class="notice notice-success"><p><?php esc_html_e( 'The menus now point at the pages below.', 'mcgrath-chrome' ); ?></p></div>
		<?php endif; ?>
		<?php if ( isset( $_GET['applied'] ) ) : ?>
			<div class="notice notice-success"><p><?php esc_html_e( 'Done. Check the pages below, then clear your cache before looking at the live site.', 'mcgrath-chrome' ); ?></p></div>
		<?php endif; ?>

		<?php
		$plan    = mcg_page_plan();
		$todo    = array_filter( $plan, function ( $i ) { return 'ok' !== $i['action']; } );
		$renames = array_filter( $plan, function ( $i ) { return $i['page'] && $i['page']->post_name !== $i['target_slug']; } );
		$names   = mcg_key_names();
		?>

		<?php if ( $todo ) : ?>
			<h2><?php esc_html_e( 'These pages need attention', 'mcgrath-chrome' ); ?></h2>
			<table class="widefat striped" style="max-width:900px">
				<thead><tr>
					<th><?php esc_html_e( 'Section', 'mcgrath-chrome' ); ?></th>
					<th><?php esc_html_e( 'Page', 'mcgrath-chrome' ); ?></th>
					<th><?php esc_html_e( 'What is wrong', 'mcgrath-chrome' ); ?></th>
				</tr></thead>
				<tbody>
				<?php foreach ( $todo as $key => $item ) : ?>
					<tr>
						<td><strong><?php echo esc_html( isset( $names[ $key ] ) ? $names[ $key ] : $key ); ?></strong></td>
						<td>
							<?php if ( $item['page'] ) : ?>
								<a href="<?php echo esc_url( get_edit_post_link( $item['page']->ID ) ); ?>"><?php echo esc_html( $item['page']->post_title ); ?></a>
								<code>/<?php echo esc_html( $item['page']->post_name ); ?>/</code>
							<?php else : ?>
								<em><?php esc_html_e( 'does not exist', 'mcgrath-chrome' ); ?></em>
							<?php endif; ?>
						</td>
						<td>
							<?php if ( 'adopt' === $item['action'] ) : ?>
								<span style="color:#b32d2e"><?php esc_html_e( 'This is one of the theme\'s own pages but it is not running its template, so it renders as a bare title. The template will be assigned; nothing else about the page changes.', 'mcgrath-chrome' ); ?></span>
							<?php elseif ( 'rename' === $item['action'] ) : ?>
								<?php
								printf(
									/* translators: %s: the slug the page would move to. */
									esc_html__( 'Correct layout, still on its older address. It would move to /%s/.', 'mcgrath-chrome' ),
									esc_html( $item['target_slug'] )
								);
								?>
							<?php else : ?>
								<?php
								printf(
									/* translators: %s: the slug the page would be created at. */
									esc_html__( 'Nothing on the site matches, so the theme has no page to link to. It would be created at /%s/.', 'mcgrath-chrome' ),
									esc_html( $item['target_slug'] )
								);
								?>
							<?php endif; ?>
						</td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>

			<p>
				<a class="button button-primary button-hero"
					href="<?php echo esc_url( wp_nonce_url( admin_url( 'themes.php?mcg_fix_pages=1' ), 'mcg_fix_pages' ) ); ?>">
					<?php esc_html_e( 'Build the theme\'s pages and fix the menu', 'mcgrath-chrome' ); ?>
				</a>
			</p>
			<p class="description" style="max-width:70ch">
				<?php esc_html_e( 'Builds the theme\'s pages at its own addresses and points the Primary and Footer menus at them. Pages belonging to whatever site was here before are not touched, moved or deleted — they keep their addresses and their content, they are simply no longer in the menu.', 'mcgrath-chrome' ); ?>
			</p>

			<?php if ( $renames ) : ?>
				<p>
					<a class="button"
						href="<?php echo esc_url( wp_nonce_url( admin_url( 'themes.php?mcg_fix_pages=1&rename=1' ), 'mcg_fix_pages' ) ); ?>">
						<?php esc_html_e( 'Fix these pages and move them to the new addresses', 'mcgrath-chrome' ); ?>
					</a>
				</p>
				<p class="description" style="max-width:70ch">
					<?php esc_html_e( 'The same, but also moves each page onto the theme\'s address. The menu follows on its own, because a menu item stores the page rather than the link. WordPress redirects the old address to the new one. An address that has been live for years and collected links is usually worth keeping, so this is the second button rather than the first.', 'mcgrath-chrome' ); ?>
				</p>
			<?php endif; ?>
		<?php else : ?>
			<div class="notice notice-success inline"><p><?php esc_html_e( 'Every page is present and using the right template.', 'mcgrath-chrome' ); ?></p></div>
		<?php endif; ?>

		<h2><?php esc_html_e( 'The pages the theme is using', 'mcgrath-chrome' ); ?></h2>
		<p><?php esc_html_e( 'Every button and link the theme renders points at these. If one says "not found", that page does not exist yet.', 'mcgrath-chrome' ); ?></p>

		<table class="widefat striped">
			<thead><tr>
				<th><?php esc_html_e( 'Section', 'mcgrath-chrome' ); ?></th>
				<th><?php esc_html_e( 'Page it uses', 'mcgrath-chrome' ); ?></th>
				<th><?php esc_html_e( 'Address', 'mcgrath-chrome' ); ?></th>
				<th><?php esc_html_e( 'Other pages with the same template', 'mcgrath-chrome' ); ?></th>
			</tr></thead>
			<tbody>
			<?php foreach ( $names as $key => $name ) : ?>
				<?php
				$id   = mcg_page_id( $key );
				$dupes = array();
				if ( isset( $templates[ $key ] ) ) {
					foreach ( mcg_pages_using_template( $templates[ $key ] ) as $p ) {
						if ( (int) $p->ID !== $id ) {
							$dupes[] = $p;
						}
					}
				}
				?>
				<tr>
					<td><strong><?php echo esc_html( $name ); ?></strong></td>
					<td>
						<?php if ( $id ) : ?>
							<a href="<?php echo esc_url( get_edit_post_link( $id ) ); ?>">
								<?php echo esc_html( get_the_title( $id ) ); ?>
							</a>
							<span style="color:#787c82">(ID <?php echo (int) $id; ?>)</span>
						<?php else : ?>
							<span style="color:#b32d2e"><?php esc_html_e( 'not found', 'mcgrath-chrome' ); ?></span>
						<?php endif; ?>
					</td>
					<td>
						<?php if ( $id ) : ?>
							<a href="<?php echo esc_url( get_permalink( $id ) ); ?>"><code><?php echo esc_html( wp_make_link_relative( get_permalink( $id ) ) ); ?></code></a>
						<?php else : ?>
							<code>/<?php echo esc_html( mcg_slug( $key ) ); ?>/</code>
						<?php endif; ?>
					</td>
					<td>
						<?php if ( $dupes ) : ?>
							<span style="color:#b32d2e"><strong><?php echo count( $dupes ); ?></strong></span>
							<?php foreach ( $dupes as $p ) : ?>
								<a href="<?php echo esc_url( get_edit_post_link( $p->ID ) ); ?>"><?php echo esc_html( $p->post_title ); ?></a>
								<span style="color:#787c82">(ID <?php echo (int) $p->ID; ?>)</span>
							<?php endforeach; ?>
						<?php else : ?>
							<span style="color:#787c82">&mdash;</span>
						<?php endif; ?>
					</td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>

		<h2><?php esc_html_e( 'Where the navigation actually points', 'mcgrath-chrome' ); ?></h2>
		<p><?php esc_html_e( 'The menu is stored in WordPress, not in the theme, so its links are whatever the menu says. Anything marked below is pointing somewhere the theme does not own — usually a page left over from a previous theme.', 'mcgrath-chrome' ); ?></p>

		<?php foreach ( array( 'primary' => __( 'Primary menu', 'mcgrath-chrome' ), 'footer' => __( 'Footer menu', 'mcgrath-chrome' ) ) as $loc => $loc_name ) : ?>
			<h3><?php echo esc_html( $loc_name ); ?></h3>
			<?php if ( empty( $locations[ $loc ] ) ) : ?>
				<p><em><?php esc_html_e( 'No menu assigned to this location, so the theme falls back to a built-in list of links.', 'mcgrath-chrome' ); ?></em></p>
			<?php else : ?>
				<?php $items = wp_get_nav_menu_items( (int) $locations[ $loc ] ); ?>
				<table class="widefat striped">
					<thead><tr>
						<th><?php esc_html_e( 'Label', 'mcgrath-chrome' ); ?></th>
						<th><?php esc_html_e( 'Points at', 'mcgrath-chrome' ); ?></th>
						<th><?php esc_html_e( 'One of the theme\'s pages?', 'mcgrath-chrome' ); ?></th>
					</tr></thead>
					<tbody>
					<?php foreach ( (array) $items as $item ) : ?>
						<?php $is_ours = 'post_type' === $item->type && isset( $owned[ (int) $item->object_id ] ); ?>
						<tr>
							<td><strong><?php echo esc_html( $item->title ); ?></strong></td>
							<td><code><?php echo esc_html( wp_make_link_relative( $item->url ) ); ?></code></td>
							<td>
								<?php if ( $is_ours ) : ?>
									<span style="color:#008a20">&#10003; <?php echo esc_html( $names[ $owned[ (int) $item->object_id ] ] ); ?></span>
								<?php else : ?>
									<span style="color:#b32d2e">&#10007; <?php esc_html_e( 'no', 'mcgrath-chrome' ); ?></span>
								<?php endif; ?>
							</td>
						</tr>
					<?php endforeach; ?>
					</tbody>
				</table>
			<?php endif; ?>
		<?php endforeach; ?>

		<h2><?php esc_html_e( 'Repair the menus', 'mcgrath-chrome' ); ?></h2>
		<p><?php esc_html_e( 'This empties the Primary and Footer menus and rebuilds them from the pages in the first table, with short labels. Your pages are not touched, only the menu. If a menu holds links you want to keep, edit it by hand under Appearance > Menus instead.', 'mcgrath-chrome' ); ?></p>
		<p>
			<a class="button button-primary"
				href="<?php echo esc_url( wp_nonce_url( admin_url( 'themes.php?mcg_fix_menu=1' ), 'mcg_fix_menu' ) ); ?>">
				<?php esc_html_e( 'Point the menus at these pages', 'mcgrath-chrome' ); ?>
			</a>
		</p>

		<h2><?php esc_html_e( 'Reading settings', 'mcgrath-chrome' ); ?></h2>
		<table class="widefat striped">
			<tbody>
				<tr>
					<td><?php esc_html_e( 'Front page', 'mcgrath-chrome' ); ?></td>
					<td>
						<?php
						$front = (int) get_option( 'page_on_front' );
						echo 'page' === get_option( 'show_on_front' ) && $front
							? esc_html( get_the_title( $front ) ) . ' (ID ' . (int) $front . ')'
							: esc_html__( 'the latest posts', 'mcgrath-chrome' );
						?>
					</td>
				</tr>
				<tr>
					<td><?php esc_html_e( 'Posts page', 'mcgrath-chrome' ); ?></td>
					<td>
						<?php
						$posts_page = (int) get_option( 'page_for_posts' );
						echo $posts_page ? esc_html( get_the_title( $posts_page ) ) . ' (ID ' . (int) $posts_page . ')' : esc_html__( 'not set', 'mcgrath-chrome' );
						?>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
	<?php
}
