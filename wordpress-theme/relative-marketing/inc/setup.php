<?php
/**
 * One-time setup on theme activation: creates the pages, assigns templates,
 * builds the primary menu, and configures the static front page so the site
 * matches the RMA mockups out of the box.
 *
 * @package rma
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Create or fetch a page by slug.
 *
 * @param string $title    Page title.
 * @param string $slug     Page slug.
 * @param string $template Optional page template file.
 * @param string $content  Optional content.
 * @return int Page ID.
 */
function rma_ensure_page( $title, $slug, $template = '', $content = '' ) {
	$existing = get_page_by_path( $slug );
	if ( $existing ) {
		$page_id = $existing->ID;
	} else {
		$page_id = wp_insert_post( array(
			'post_title'   => $title,
			'post_name'    => $slug,
			'post_status'  => 'publish',
			'post_type'    => 'page',
			'post_content' => $content,
		) );
	}
	if ( $page_id && ! is_wp_error( $page_id ) && $template ) {
		update_post_meta( $page_id, '_wp_page_template', $template );
	}
	return is_wp_error( $page_id ) ? 0 : $page_id;
}

/**
 * Run on theme activation.
 */
function rma_after_switch_theme() {
	// Pages with their RMA templates.
	$home_id     = rma_ensure_page( __( 'Home', 'rma' ), 'home' );
	$services_id = rma_ensure_page( __( 'Services', 'rma' ), 'services', 'template-services.php' );
	rma_ensure_page( __( 'AI Search Optimization', 'rma' ), 'ai-search-optimization', 'template-service-details.php' );
	$about_id    = rma_ensure_page( __( 'About', 'rma' ), 'about', 'template-about.php' );
	$cases_id    = rma_ensure_page( __( 'Case Studies', 'rma' ), 'case-studies', 'template-case-studies.php' );
	$contact_id  = rma_ensure_page( __( 'Contact', 'rma' ), 'contact', 'template-contact.php' );
	rma_ensure_page( __( 'Careers', 'rma' ), 'careers', 'template-careers.php' );
	$blog_id     = rma_ensure_page( __( 'Insights', 'rma' ), 'blog' );

	// Static front page + posts page.
	if ( $home_id ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $home_id );
	}
	if ( $blog_id ) {
		update_option( 'page_for_posts', $blog_id );
	}

	// Build the primary menu.
	$menu_name = 'RMA Primary';
	$menu      = wp_get_nav_menu_object( $menu_name );
	if ( ! $menu ) {
		$menu_id = wp_create_nav_menu( $menu_name );
		if ( ! is_wp_error( $menu_id ) ) {
			$links = array(
				array( 'Services', $services_id ),
				array( 'Case Studies', $cases_id ),
				array( 'About', $about_id ),
				array( 'Insights', $blog_id ),
				array( 'Contact', $contact_id ),
			);
			foreach ( $links as $link ) {
				if ( $link[1] ) {
					wp_update_nav_menu_item( $menu_id, 0, array(
						'menu-item-title'     => $link[0],
						'menu-item-object'    => 'page',
						'menu-item-object-id' => $link[1],
						'menu-item-type'      => 'post_type',
						'menu-item-status'    => 'publish',
					) );
				}
			}
			$locations            = get_theme_mod( 'nav_menu_locations', array() );
			$locations['primary'] = $menu_id;
			set_theme_mod( 'nav_menu_locations', $locations );
		}
	}

	flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'rma_after_switch_theme' );
