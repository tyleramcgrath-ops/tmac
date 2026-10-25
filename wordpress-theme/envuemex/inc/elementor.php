<?php
/**
 * Elementor compatibility.
 *
 * Declares Elementor support so Elementor stops nagging users that the theme
 * isn't certified, and registers the theme's Canvas / Header-Footer page
 * templates that Elementor users typically want.
 *
 * @package envuemex
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Declare basic Elementor support.
 */
function envuemex_register_elementor_support() {
	add_theme_support( 'elementor' );

	// Locations for Elementor Pro Theme Builder.
	if ( did_action( 'elementor/loaded' ) && class_exists( '\ElementorPro\Modules\ThemeBuilder\Module' ) ) {
		// nothing else needed — Theme Builder discovers locations automatically.
	}
}
add_action( 'after_setup_theme', 'envuemex_register_elementor_support' );

/**
 * Register two Elementor-friendly page templates:
 *  - elementor-canvas.php  → blank page, no header/footer
 *  - elementor-blank.php   → theme header + footer, blank content area
 */
function envuemex_register_page_templates( $templates ) {
	$templates['templates/elementor-canvas.php'] = __( 'Elementor Canvas (Blank)', 'envuemex' );
	$templates['templates/elementor-blank.php']  = __( 'Elementor (Header + Footer)', 'envuemex' );
	return $templates;
}
add_filter( 'theme_page_templates', 'envuemex_register_page_templates' );

/**
 * Add theme-builder location notice for Elementor users.
 */
function envuemex_elementor_admin_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	if ( ! did_action( 'elementor/loaded' ) ) {
		return;
	}
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen || $screen->id !== 'themes' ) {
		return;
	}
	echo '<div class="notice notice-info"><p><strong>Envue Mex:</strong> ';
	echo esc_html__( 'Elementor is supported. New pages: choose template "Elementor (Header + Footer)" or "Elementor Canvas". The homepage is coded for pixel accuracy and is not Elementor-editable by design.', 'envuemex' );
	echo '</p></div>';
}
add_action( 'admin_notices', 'envuemex_elementor_admin_notice' );
