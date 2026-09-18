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
