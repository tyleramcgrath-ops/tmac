<?php
/**
 * Navigation walker adding the classes the stylesheet expects.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Renders the primary menu with BEM classes and accessible submenus.
 */
class PT_Nav_Walker extends Walker_Nav_Menu {

	/**
	 * Open a submenu list.
	 *
	 * @param string   $output Menu markup, by reference.
	 * @param int      $depth  Current depth.
	 * @param stdClass $args   Menu arguments.
	 */
	public function start_lvl( &$output, $depth = 0, $args = null ) {
		$indent  = str_repeat( "\t", $depth );
		$output .= "\n{$indent}<ul class=\"nav__submenu\">\n";
	}

	/**
	 * Open a menu item.
	 *
	 * @param string   $output Menu markup, by reference.
	 * @param WP_Post  $item   Menu item.
	 * @param int      $depth  Current depth.
	 * @param stdClass $args   Menu arguments.
	 * @param int      $id     Menu item ID.
	 */
	public function start_el( &$output, $item, $depth = 0, $args = null, $id = 0 ) {
		$classes   = empty( $item->classes ) ? array() : (array) $item->classes;
		$classes[] = 'nav__item';
		$classes[] = 'nav__item--depth-' . (int) $depth;

		$has_children = in_array( 'menu-item-has-children', $classes, true );
		if ( $has_children ) {
			$classes[] = 'nav__item--has-children';
		}

		if ( in_array( 'current-menu-item', $classes, true ) || in_array( 'current_page_item', $classes, true ) ) {
			$classes[] = 'is-current';
		}

		$class_names = implode( ' ', array_map( 'sanitize_html_class', array_filter( $classes ) ) );

		$output .= sprintf( '<li class="%s">', esc_attr( $class_names ) );

		$atts = array(
			'href'   => ! empty( $item->url ) ? $item->url : '',
			'title'  => ! empty( $item->attr_title ) ? $item->attr_title : '',
			'target' => ! empty( $item->target ) ? $item->target : '',
			'rel'    => ! empty( $item->xfn ) ? $item->xfn : '',
			'class'  => 'nav__link',
		);

		if ( in_array( 'is-current', $classes, true ) ) {
			$atts['aria-current'] = 'page';
		}

		if ( '_blank' === $atts['target'] && empty( $atts['rel'] ) ) {
			$atts['rel'] = 'noopener';
		}

		$attributes = '';
		foreach ( $atts as $attr => $value ) {
			if ( '' === $value ) {
				continue;
			}

			$value       = ( 'href' === $attr ) ? esc_url( $value ) : esc_attr( $value );
			$attributes .= ' ' . $attr . '="' . $value . '"';
		}

		$title = apply_filters( 'the_title', $item->title, $item->ID );

		$output .= sprintf(
			'<a%1$s>%2$s</a>',
			$attributes, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped per attribute above.
			esc_html( $title )
		);

		if ( $has_children && 0 === $depth ) {
			$output .= sprintf(
				'<button class="nav__toggle" type="button" aria-expanded="false"><span class="screen-reader-text">%s</span></button>',
				esc_html__( 'Show submenu', 'palmtreesurf' )
			);
		}
	}
}
