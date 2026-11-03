<?php
/**
 * One-click setup: creates the pages, experiences and menus from the original site.
 * Appearance → Popeye Setup. Safe to run more than once (existing items are skipped).
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

add_action( 'after_switch_theme', 'popeye_activation' );
/**
 * Flush rewrites so /experiences/ works and flag the setup notice.
 */
function popeye_activation() {
	popeye_register_experiences();
	flush_rewrite_rules();
	if ( ! get_option( 'popeye_imported' ) ) {
		update_option( 'popeye_show_setup_notice', 1 );
	}
}

add_action( 'admin_menu', 'popeye_setup_page' );
/**
 * Register the setup screen.
 */
function popeye_setup_page() {
	add_theme_page( __( 'Popeye Setup', 'popeye-charters' ), __( 'Popeye Setup', 'popeye-charters' ), 'manage_options', 'popeye-setup', 'popeye_setup_page_html' );
}

add_action( 'admin_notices', 'popeye_setup_notice' );
/**
 * Nudge to run the importer after activation.
 */
function popeye_setup_notice() {
	if ( ! current_user_can( 'manage_options' ) || ! get_option( 'popeye_show_setup_notice' ) ) {
		return;
	}
	$screen = get_current_screen();
	if ( $screen && 'appearance_page_popeye-setup' === $screen->id ) {
		return;
	}
	echo '<div class="notice notice-info"><p><strong>' . esc_html__( 'Popeye Charters theme is active.', 'popeye-charters' ) . '</strong> ' . esc_html__( 'Import the site pages, charter experiences and menus to get started.', 'popeye-charters' ) . ' <a class="button button-primary" href="' . esc_url( admin_url( 'themes.php?page=popeye-setup' ) ) . '">' . esc_html__( 'Run Popeye Setup', 'popeye-charters' ) . '</a></p></div>';
}

/**
 * Render the setup screen.
 */
function popeye_setup_page_html() {
	$log = get_transient( 'popeye_import_log' );
	delete_transient( 'popeye_import_log' );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Popeye Charters Setup', 'popeye-charters' ); ?></h1>
		<?php if ( $log ) : ?>
			<div class="notice notice-success"><p><?php esc_html_e( 'Import finished:', 'popeye-charters' ); ?></p><ul style="list-style:disc;padding-left:20px">
				<?php foreach ( (array) $log as $line ) : ?>
					<li><?php echo esc_html( $line ); ?></li>
				<?php endforeach; ?>
			</ul></div>
		<?php endif; ?>
		<p><?php esc_html_e( 'This creates everything the original site had, ready to edit:', 'popeye-charters' ); ?></p>
		<ul style="list-style:disc;padding-left:20px">
			<li><?php esc_html_e( 'Pages: Home, Our Story, Elite Cruises, Blog, Gallery, Contact, Book (with the matching page templates)', 'popeye-charters' ); ?></li>
			<li><?php esc_html_e( 'The 8 charter Experiences with durations, highlights, inclusions, galleries and guest quotes', 'popeye-charters' ); ?></li>
			<li><?php esc_html_e( 'Primary and footer menus, static front page, posts page and pretty permalinks', 'popeye-charters' ); ?></li>
		</ul>
		<p><?php esc_html_e( 'Anything that already exists (same slug) is left untouched, so it is safe to run again.', 'popeye-charters' ); ?></p>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="popeye_import">
			<?php wp_nonce_field( 'popeye_import' ); ?>
			<?php submit_button( __( 'Import Popeye Charters content', 'popeye-charters' ) ); ?>
		</form>
	</div>
	<?php
}

add_action( 'admin_post_popeye_import', 'popeye_handle_import' );
/**
 * Handle the import request.
 */
function popeye_handle_import() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Sorry, you are not allowed to do that.', 'popeye-charters' ) );
	}
	check_admin_referer( 'popeye_import' );
	$log = popeye_run_import();
	set_transient( 'popeye_import_log', $log, 120 );
	wp_safe_redirect( admin_url( 'themes.php?page=popeye-setup' ) );
	exit;
}

/**
 * Create a page if no page with that slug exists.
 *
 * @param string $slug     Slug.
 * @param string $title    Title.
 * @param string $template Page template ('' for default).
 * @param string $content  Content.
 * @param array  $log      Log (by reference).
 * @return int Page ID.
 */
function popeye_ensure_page( $slug, $title, $template, $content, &$log ) {
	$existing = get_page_by_path( $slug );
	if ( $existing ) {
		$log[] = sprintf( 'Page "%s" already exists — skipped.', $title );
		return $existing->ID;
	}
	$id = wp_insert_post(
		array(
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => $title,
			'post_name'    => $slug,
			'post_content' => $content,
		)
	);
	if ( $id && $template ) {
		update_post_meta( $id, '_wp_page_template', $template );
	}
	$log[] = sprintf( 'Created page "%s".', $title );
	return (int) $id;
}

/**
 * Run the import. Also usable from WP-CLI: wp eval 'print_r( popeye_run_import() );'
 *
 * @return string[] Log lines.
 */
function popeye_run_import() {
	$log = array();

	if ( ! get_option( 'permalink_structure' ) ) {
		update_option( 'permalink_structure', '/%postname%/' );
		$log[] = 'Set permalinks to /%postname%/.';
	}

	$home    = popeye_ensure_page( 'home', 'Home', '', '', $log );
	$story   = popeye_ensure_page( 'story', 'Our Story', 'page-templates/story.php', '', $log );
	$elite   = popeye_ensure_page( 'elite-cruises', 'Elite Cruises', 'page-templates/elite.php', '', $log );
	$blog    = popeye_ensure_page( 'blog', 'Blog', '', '', $log );
	$gallery = popeye_ensure_page( 'gallery', 'Gallery', 'page-templates/gallery.php', '', $log );
	$contact = popeye_ensure_page( 'contact', 'Contact', 'page-templates/contact.php', '', $log );
	$book    = popeye_ensure_page( 'book', 'Book a Charter', 'page-templates/book.php', '', $log );

	update_option( 'show_on_front', 'page' );
	update_option( 'page_on_front', $home );
	update_option( 'page_for_posts', $blog );
	if ( 'Just another WordPress site' === get_option( 'blogdescription' ) || ! get_option( 'blogdescription' ) ) {
		update_option( 'blogdescription', 'Charleston Harbor Boat Tours & Charters' );
	}
	if ( 'My WordPress' === get_option( 'blogname' ) || ! get_option( 'blogname' ) ) {
		update_option( 'blogname', 'Popeye Charters' );
	}

	// Experiences.
	$experiences = require POPEYE_DIR . '/inc/data/experiences.php';
	$exp_ids     = array();
	foreach ( $experiences as $i => $e ) {
		$found = get_page_by_path( $e['slug'], OBJECT, 'experience' );
		if ( $found ) {
			$exp_ids[] = $found->ID;
			$log[]     = sprintf( 'Experience "%s" already exists — skipped.', $e['title'] );
			continue;
		}
		$id = wp_insert_post(
			array(
				'post_type'    => 'experience',
				'post_status'  => 'publish',
				'post_title'   => $e['title'],
				'post_name'    => $e['slug'],
				'post_excerpt' => $e['excerpt'],
				'post_content' => $e['body'],
				'menu_order'   => $i + 1,
			)
		);
		if ( ! $id || is_wp_error( $id ) ) {
			continue;
		}
		foreach ( array_keys( popeye_experience_fields() ) as $key ) {
			if ( isset( $e[ $key ] ) ) {
				update_post_meta( $id, '_popeye_' . $key, $e[ $key ] );
			}
		}
		$exp_ids[] = $id;
		$log[]     = sprintf( 'Created experience "%s".', $e['title'] );
	}

	// Menus.
	$locations = get_theme_mod( 'nav_menu_locations', array() );
	if ( empty( $locations['primary'] ) && ! wp_get_nav_menu_object( 'Primary' ) ) {
		$menu = wp_create_nav_menu( 'Primary' );
		if ( ! is_wp_error( $menu ) ) {
			$add = function ( $args ) use ( $menu ) {
				return wp_update_nav_menu_item( $menu, 0, array_merge( array( 'menu-item-status' => 'publish' ), $args ) );
			};
			$add( array( 'menu-item-title' => 'Home', 'menu-item-object' => 'page', 'menu-item-object-id' => $home, 'menu-item-type' => 'post_type' ) );
			$add( array( 'menu-item-object' => 'page', 'menu-item-object-id' => $story, 'menu-item-type' => 'post_type' ) );
			$parent = $add( array( 'menu-item-title' => 'Experiences', 'menu-item-type' => 'post_type_archive', 'menu-item-object' => 'experience' ) );
			$add( array( 'menu-item-title' => 'All Experiences', 'menu-item-type' => 'post_type_archive', 'menu-item-object' => 'experience', 'menu-item-parent-id' => $parent ) );
			foreach ( $exp_ids as $eid ) {
				$add( array( 'menu-item-object' => 'experience', 'menu-item-object-id' => $eid, 'menu-item-type' => 'post_type', 'menu-item-parent-id' => $parent ) );
			}
			$add( array( 'menu-item-object' => 'page', 'menu-item-object-id' => $elite, 'menu-item-type' => 'post_type', 'menu-item-classes' => 'menu-item-elite' ) );
			$add( array( 'menu-item-object' => 'page', 'menu-item-object-id' => $blog, 'menu-item-type' => 'post_type' ) );
			$add( array( 'menu-item-object' => 'page', 'menu-item-object-id' => $gallery, 'menu-item-type' => 'post_type' ) );
			$add( array( 'menu-item-object' => 'page', 'menu-item-object-id' => $contact, 'menu-item-type' => 'post_type' ) );
			$locations['primary'] = $menu;
			$log[]                = 'Created and assigned the Primary menu.';
		}
	}
	if ( empty( $locations['footer'] ) && ! wp_get_nav_menu_object( 'Footer' ) ) {
		$menu = wp_create_nav_menu( 'Footer' );
		if ( ! is_wp_error( $menu ) ) {
			$i = 0;
			foreach ( array( $home => 'Home', 'experience' => 'Experiences', $story => 'Our Story', $gallery => 'Gallery', $book => 'Book a Charter', $contact => 'Contact' ) as $obj => $title ) {
				$args = 'experience' === $obj
					? array( 'menu-item-type' => 'post_type_archive', 'menu-item-object' => 'experience' )
					: array( 'menu-item-type' => 'post_type', 'menu-item-object' => 'page', 'menu-item-object-id' => $obj );
				wp_update_nav_menu_item( $menu, 0, array_merge( $args, array( 'menu-item-title' => $title, 'menu-item-status' => 'publish', 'menu-item-position' => ++$i ) ) );
			}
			$locations['footer'] = $menu;
			$log[]               = 'Created and assigned the Footer menu.';
		}
	}
	set_theme_mod( 'nav_menu_locations', $locations );

	popeye_register_experiences();
	flush_rewrite_rules();
	update_option( 'popeye_imported', time() );
	delete_option( 'popeye_show_setup_notice' );

	return $log;
}
