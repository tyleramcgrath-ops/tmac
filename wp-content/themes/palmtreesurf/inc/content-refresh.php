<?php
/**
 * Bring seeded pages forward on a theme update, without touching client edits.
 *
 * The first-run seeder only ever runs once, so a site installed on an earlier
 * version keeps whatever copy shipped then — which is how the About page ended
 * up sitting on placeholder text.
 *
 * Every seeded page is stamped with a hash of exactly what was written. On an
 * update, a page is refreshed only when its content still hashes to that stamp,
 * i.e. nobody has touched it. The moment anyone edits the page in wp-admin the
 * hash stops matching and the theme never writes to it again.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Meta key holding the hash of the last theme-written body.
 */
const PT_SEED_HASH_META = '_pt_seed_hash';

/**
 * Stamp a page as theme-written.
 *
 * @param int    $post_id Page ID.
 * @param string $content Content that was written.
 */
function pt_stamp_seeded( $post_id, $content ) {
	update_post_meta( $post_id, PT_SEED_HASH_META, md5( $content ) );
}

/**
 * Whether a page still holds exactly what the theme last wrote.
 *
 * @param WP_Post $page Page to test.
 * @return bool
 */
function pt_page_untouched( $page ) {
	$stamp = get_post_meta( $page->ID, PT_SEED_HASH_META, true );

	if ( $stamp ) {
		return md5( $page->post_content ) === $stamp;
	}

	/*
	 * No stamp means the page predates stamping. Fall back to the markers the
	 * old placeholder copy carried — if they are still there, nobody rewrote
	 * it, so refreshing it is safe and is exactly what is wanted.
	 */
	foreach ( pt_placeholder_markers() as $marker ) {
		if ( false !== strpos( $page->post_content, $marker ) ) {
			return true;
		}
	}

	return '' === trim( wp_strip_all_tags( $page->post_content ) );
}

/**
 * Text that only ever appeared in theme placeholder copy.
 *
 * @return array<int, string>
 */
function pt_placeholder_markers() {
	return array(
		'Replace this section with your story',
		'This page is a placeholder and should be rewritten',
	);
}

/**
 * The pages this theme will refresh, and what it would write.
 *
 * @return array<string, array<string, mixed>>
 */
function pt_refreshable_pages() {
	return array(
		'about' => array(
			'content'  => pt_seed_about_body(),
			'template' => 'page-templates/page-about.php',
		),
	);
}

/**
 * Refresh untouched seeded pages when the theme version changes.
 */
function pt_refresh_seeded_pages() {
	if ( get_option( 'pt_content_version' ) === PT_VERSION ) {
		return;
	}

	// Marker first: a failure midway must not retry on every request.
	update_option( 'pt_content_version', PT_VERSION );

	foreach ( pt_refreshable_pages() as $slug => $spec ) {
		$page = get_page_by_path( $slug );

		if ( ! $page instanceof WP_Post ) {
			continue;
		}

		/*
		 * The template is layout, not content, so it is applied whenever the
		 * page is still on the default template. Rewriting the body is the
		 * part that needs the page to be untouched.
		 */
		if ( ! empty( $spec['template'] ) ) {
			$current = get_page_template_slug( $page->ID );

			if ( '' === $current || 'default' === $current ) {
				update_post_meta( $page->ID, '_wp_page_template', $spec['template'] );
			}
		}

		if ( empty( $spec['content'] ) || ! pt_page_untouched( $page ) ) {
			continue;
		}

		wp_update_post(
			array(
				'ID'           => $page->ID,
				'post_content' => $spec['content'],
			)
		);

		pt_stamp_seeded( $page->ID, $spec['content'] );
	}

	pt_sync_menus();
}
add_action( 'init', 'pt_refresh_seeded_pages', 995 );

/**
 * The pages each menu location should link to, in order.
 *
 * @return array<string, array<int, string>>
 */
function pt_menu_pages() {
	return array(
		'primary' => array( 'about', 'gallery', 'journal', 'contact' ),
		'footer'  => array( 'about', 'gallery', 'journal', 'contact' ),
		'legal'   => array( 'privacy-policy' ),
	);
}

/**
 * Make sure the seeded menus actually contain the pages they should.
 *
 * The first-run seeder builds these, but a site seeded by an earlier version
 * can end up with a primary menu holding only the Experiences dropdown and
 * empty footer menus. This adds what is missing and never removes or reorders
 * anything, so a menu the client has arranged by hand is left as they left it.
 */
function pt_sync_menus() {
	$locations = get_theme_mod( 'nav_menu_locations', array() );
	$changed   = false;

	foreach ( pt_menu_pages() as $location => $slugs ) {
		if ( ! empty( $locations[ $location ] ) && wp_get_nav_menu_object( $locations[ $location ] ) ) {
			$menu_id = (int) $locations[ $location ];
		} else {
			$name    = ucfirst( $location );
			$menu    = wp_get_nav_menu_object( $name );
			$menu_id = $menu ? (int) $menu->term_id : (int) wp_create_nav_menu( $name );

			if ( is_wp_error( $menu_id ) || ! $menu_id ) {
				continue;
			}

			$locations[ $location ] = $menu_id;
			$changed                = true;
		}

		// Which pages the menu already points at.
		$existing = array();

		foreach ( (array) wp_get_nav_menu_items( $menu_id ) as $item ) {
			if ( 'post_type' === $item->type ) {
				$existing[] = (int) $item->object_id;
			}
		}

		foreach ( $slugs as $slug ) {
			$page = get_page_by_path( $slug );

			if ( ! $page instanceof WP_Post || in_array( (int) $page->ID, $existing, true ) ) {
				continue;
			}

			wp_update_nav_menu_item(
				$menu_id,
				0,
				array(
					'menu-item-title'     => $page->post_title,
					'menu-item-object'    => 'page',
					'menu-item-object-id' => (int) $page->ID,
					'menu-item-type'      => 'post_type',
					'menu-item-status'    => 'publish',
				)
			);
		}
	}

	if ( $changed ) {
		set_theme_mod( 'nav_menu_locations', $locations );
	}
}
