<?php
/**
 * One-click setup: creates the pages, experiences and menus from the original site.
 * Appearance → Popeye Setup. Safe to run more than once (existing items are skipped).
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

/**
 * Bump when the bundled content changes so existing installs pick up new items
 * (e.g. blog posts added in 1.1). Existing items are never overwritten.
 */
define( 'POPEYE_CONTENT_VERSION', 2 );

add_action( 'after_switch_theme', 'popeye_activation' );
/**
 * Flush rewrites so /experiences/ works. The content import itself runs on the next admin load.
 */
function popeye_activation() {
	popeye_register_experiences();
	flush_rewrite_rules();
}

add_action( 'admin_init', 'popeye_auto_import', 20 );
/**
 * Import the site content automatically the first time an administrator loads wp-admin
 * with this theme active (and again, adding only missing items, when the bundled content
 * version changes). Afterwards, attach bundled photos to the Media Library a few at a time.
 */
function popeye_auto_import() {
	if ( ! current_user_can( 'manage_options' ) || wp_doing_ajax() || ( defined( 'DOING_CRON' ) && DOING_CRON ) ) {
		return;
	}
	if ( (int) get_option( 'popeye_content_version' ) < POPEYE_CONTENT_VERSION && ! get_transient( 'popeye_import_lock' ) ) {
		set_transient( 'popeye_import_lock', 1, 5 * MINUTE_IN_SECONDS );
		$log = popeye_run_import();
		update_option( 'popeye_content_version', POPEYE_CONTENT_VERSION );
		delete_transient( 'popeye_import_lock' );
		set_transient( 'popeye_import_log', $log, 10 * MINUTE_IN_SECONDS );
		update_option( 'popeye_show_setup_notice', 'done' );
		return;
	}
	popeye_attach_images_batch( 6 );
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
	if ( ! current_user_can( 'manage_options' ) || 'done' !== get_option( 'popeye_show_setup_notice' ) ) {
		return;
	}
	$screen = get_current_screen();
	if ( $screen && 'appearance_page_popeye-setup' === $screen->id ) {
		return;
	}
	delete_option( 'popeye_show_setup_notice' );
	echo '<div class="notice notice-success is-dismissible"><p><strong>' . esc_html__( 'Popeye Charters content imported.', 'popeye-charters' ) . '</strong> ' . esc_html__( 'Pages, charter experiences, blog posts and menus are in place.', 'popeye-charters' ) . ' <a href="' . esc_url( admin_url( 'themes.php?page=popeye-setup' ) ) . '">' . esc_html__( 'See what was created', 'popeye-charters' ) . '</a> · <a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'View site', 'popeye-charters' ) . '</a></p></div>';
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
			<li><?php esc_html_e( 'All 45 blog guides with their categories, tags, dates and cover photos', 'popeye-charters' ); ?></li>
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

	// Match the original site's URLs (/blog/post-slug/) on a fresh site. A site that already
	// has its own posts keeps its permalink settings; old /blog/ links still redirect (see below).
	$structure = (string) get_option( 'permalink_structure' );
	$own_posts = get_posts( array( 'post_type' => 'post', 'post_status' => 'any', 'posts_per_page' => 2, 'fields' => 'ids' ) );
	$own_posts = array_filter( $own_posts, fn( $id ) => 'hello-world' !== get_post_field( 'post_name', $id ) );
	if ( '/blog/%postname%/' !== $structure && ( ! $structure || ! $own_posts ) ) {
		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure( '/blog/%postname%/' );
		$log[] = 'Set permalinks to /blog/%postname%/ to match the original site.';
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

	popeye_import_posts( $log );
	popeye_trash_default_content( $log );

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
	popeye_queue_images();
	update_option( 'popeye_imported', time() );
	delete_option( 'popeye_show_setup_notice' );

	return $log;
}

/**
 * Import the blog guides from inc/data/posts.json. Existing slugs are skipped.
 *
 * @param array $log Log (by reference).
 */
function popeye_import_posts( &$log ) {
	$file = POPEYE_DIR . '/inc/data/posts.json';
	if ( ! file_exists( $file ) ) {
		return;
	}
	$posts = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	if ( ! is_array( $posts ) ) {
		return;
	}
	$created = 0;
	$skipped = 0;
	foreach ( $posts as $p ) {
		if ( get_page_by_path( $p['slug'], OBJECT, 'post' ) ) {
			++$skipped;
			continue;
		}
		$cat = term_exists( $p['category'], 'category' );
		if ( ! $cat ) {
			$cat = wp_insert_term( $p['category'], 'category' );
		}
		$cat_id = is_array( $cat ) ? (int) $cat['term_id'] : (int) $cat;
		$date   = $p['date'] . ' 09:00:00';
		$id     = wp_insert_post(
			array(
				'post_type'     => 'post',
				'post_status'   => 'publish',
				'post_title'    => $p['title'],
				'post_name'     => $p['slug'],
				'post_content'  => $p['content'],
				'post_excerpt'  => $p['excerpt'],
				'post_date'     => $date,
				'post_date_gmt' => get_gmt_from_date( $date ),
				'post_category' => $cat_id ? array( $cat_id ) : array(),
				'tags_input'    => isset( $p['tags'] ) ? $p['tags'] : array(),
				'comment_status' => 'closed',
			),
			true
		);
		if ( is_wp_error( $id ) ) {
			$log[] = sprintf( 'Could not import "%s": %s', $p['title'], $id->get_error_message() );
			continue;
		}
		if ( ! empty( $p['image'] ) ) {
			update_post_meta( $id, '_popeye_image', $p['image'] );
		}
		++$created;
	}
	$log[] = sprintf( 'Blog: imported %d posts%s.', $created, $skipped ? sprintf( ' (%d already existed)', $skipped ) : '' );

	// Remove the empty default category if nothing is in it any more.
	$uncat = get_category_by_slug( 'uncategorized' );
	if ( $uncat && 0 === (int) $uncat->count && (int) get_option( 'default_category' ) === (int) $uncat->term_id ) {
		$first = get_term_by( 'name', 'Charter Guide', 'category' );
		if ( $first ) {
			update_option( 'default_category', $first->term_id );
		}
	}
}

/**
 * Move WordPress's untouched sample post and page to the trash (restorable).
 *
 * @param array $log Log (by reference).
 */
function popeye_trash_default_content( &$log ) {
	foreach ( array( array( 'hello-world', 'post', 'Hello world!' ), array( 'sample-page', 'page', 'Sample Page' ) ) as $d ) {
		$p = get_page_by_path( $d[0], OBJECT, $d[1] );
		if ( $p && $d[2] === $p->post_title && 'publish' === $p->post_status && $p->post_modified_gmt === $p->post_date_gmt ) {
			wp_trash_post( $p->ID );
			$log[] = sprintf( 'Moved the default "%s" to the trash.', $d[2] );
		}
	}
}

/**
 * Queue the bundled photos used as cover images so they can be added to the Media Library
 * and set as real Featured Images (done a few per admin page load to avoid timeouts).
 */
function popeye_queue_images() {
	$queue = array();
	foreach ( get_posts( array( 'post_type' => array( 'post', 'experience' ), 'posts_per_page' => -1, 'fields' => 'ids', 'post_status' => 'publish' ) ) as $id ) {
		if ( has_post_thumbnail( $id ) ) {
			continue;
		}
		$stem = 'experience' === get_post_type( $id ) ? get_post_meta( $id, '_popeye_hero_image', true ) : get_post_meta( $id, '_popeye_image', true );
		if ( $stem ) {
			$queue[] = $id;
		}
	}
	update_option( 'popeye_image_queue', $queue, false );
}

/**
 * Add a bundled image to the Media Library once and return its attachment ID.
 *
 * @param string $stem Image file stem in assets/images.
 * @return int Attachment ID or 0.
 */
function popeye_bundled_attachment( $stem ) {
	$map = get_option( 'popeye_attachments', array() );
	if ( ! empty( $map[ $stem ] ) && get_post( $map[ $stem ] ) ) {
		return (int) $map[ $stem ];
	}
	$src = POPEYE_DIR . '/assets/images/' . $stem . '.jpg';
	if ( ! file_exists( $src ) ) {
		return 0;
	}
	require_once ABSPATH . 'wp-admin/includes/image.php';
	$upload = wp_upload_bits( 'popeye-' . sanitize_file_name( $stem ) . '.jpg', null, (string) file_get_contents( $src ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	if ( ! empty( $upload['error'] ) ) {
		return 0;
	}
	$caption = '';
	foreach ( popeye_content( 'gallery' ) as $g ) {
		if ( $g[0] === $stem ) {
			$caption = $g[1];
			break;
		}
	}
	$att = wp_insert_attachment(
		array(
			'post_mime_type' => 'image/jpeg',
			'post_title'     => $caption ? $caption : 'Popeye Charters',
			'post_status'    => 'inherit',
		),
		$upload['file']
	);
	if ( ! $att || is_wp_error( $att ) ) {
		return 0;
	}
	wp_update_attachment_metadata( $att, wp_generate_attachment_metadata( $att, $upload['file'] ) );
	if ( $caption ) {
		update_post_meta( $att, '_wp_attachment_image_alt', $caption );
	}
	$map[ $stem ] = $att;
	update_option( 'popeye_attachments', $map, false );
	return (int) $att;
}

/**
 * Process a few queued posts: create the attachment (if new) and set it as Featured Image.
 *
 * @param int $limit Max new attachments to generate this request.
 */
function popeye_attach_images_batch( $limit ) {
	$queue = get_option( 'popeye_image_queue', array() );
	if ( ! $queue || get_transient( 'popeye_image_lock' ) ) {
		return;
	}
	set_transient( 'popeye_image_lock', 1, MINUTE_IN_SECONDS );
	$made  = 0;
	$start = microtime( true );
	while ( $queue && $made < $limit && microtime( true ) - $start < 15 ) {
		$id   = array_shift( $queue );
		$stem = 'experience' === get_post_type( $id ) ? get_post_meta( $id, '_popeye_hero_image', true ) : get_post_meta( $id, '_popeye_image', true );
		if ( ! $stem || has_post_thumbnail( $id ) ) {
			continue;
		}
		$map = get_option( 'popeye_attachments', array() );
		if ( empty( $map[ $stem ] ) ) {
			++$made;
		}
		$att = popeye_bundled_attachment( $stem );
		if ( $att ) {
			set_post_thumbnail( $id, $att );
		}
	}
	update_option( 'popeye_image_queue', $queue, false );
	delete_transient( 'popeye_image_lock' );
}

add_action( 'template_redirect', 'popeye_legacy_blog_redirect' );
/**
 * Send old /blog/{slug} links to the post if the permalink structure differs.
 */
function popeye_legacy_blog_redirect() {
	if ( ! is_404() ) {
		return;
	}
	$path = trim( (string) wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '', PHP_URL_PATH ), '/' );
	if ( preg_match( '#^blog/([a-z0-9-]+)$#', $path, $m ) ) {
		$post = get_page_by_path( $m[1], OBJECT, 'post' );
		$target = $post && 'publish' === $post->post_status ? get_permalink( $post ) : '';
		if ( $target && trim( (string) wp_parse_url( $target, PHP_URL_PATH ), '/' ) !== $path ) {
			wp_safe_redirect( $target, 301 );
			exit;
		}
	}
}
