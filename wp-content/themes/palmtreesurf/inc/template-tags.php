<?php
/**
 * Output helpers shared by the templates.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Print the post date and author for a blog post.
 */
function pt_posted_on() {
	printf(
		'<div class="entry__meta"><time class="entry__date" datetime="%1$s">%2$s</time><span class="entry__author">%3$s</span></div>',
		esc_attr( get_the_date( DATE_W3C ) ),
		esc_html( get_the_date() ),
		esc_html( get_the_author() )
	);
}

/**
 * Print the featured image, linked on archives and plain on single views.
 *
 * @param string $size Registered image size.
 */
function pt_post_thumbnail( $size = 'pts-card' ) {
	if ( post_password_required() || is_attachment() || ! has_post_thumbnail() ) {
		return;
	}

	if ( is_singular() ) {
		echo '<figure class="entry__media">';
		the_post_thumbnail( 'pts-hero', array( 'loading' => 'eager' ) );
		echo '</figure>';
		return;
	}

	printf(
		'<a class="entry__media" href="%1$s" aria-hidden="true" tabindex="-1">%2$s</a>',
		esc_url( get_permalink() ),
		wp_kses_post( get_the_post_thumbnail( null, $size ) )
	);
}

/**
 * Print accessible next/previous archive links.
 */
function pt_pagination() {
	the_posts_pagination(
		array(
			'mid_size'           => 1,
			'prev_text'          => __( 'Previous', 'palmtreesurf' ),
			'next_text'          => __( 'Next', 'palmtreesurf' ),
			'screen_reader_text' => __( 'Page navigation', 'palmtreesurf' ),
			'class'              => 'pagination',
		)
	);
}

/**
 * Build the experience detail rows (price, duration, group size, level).
 *
 * @param int $post_id Experience ID.
 * @return array<int, array{label: string, value: string}>
 */
function pt_experience_details( $post_id ) {
	$rows  = array();
	$price = pt_field( $post_id, 'price_from' );

	if ( $price ) {
		$suffix = pt_field( $post_id, 'price_suffix' );
		$rows[] = array(
			'label' => __( 'From', 'palmtreesurf' ),
			'value' => trim( '$' . $price . ' ' . $suffix ),
		);
	}

	foreach ( array(
		'duration'   => __( 'Duration', 'palmtreesurf' ),
		'group_size' => __( 'Group size', 'palmtreesurf' ),
		'min_age'    => __( 'Minimum age', 'palmtreesurf' ),
	) as $key => $label ) {
		$value = pt_field( $post_id, $key );
		if ( $value ) {
			$rows[] = array(
				'label' => $label,
				'value' => $value,
			);
		}
	}

	$levels = get_the_term_list( $post_id, 'skill_level', '', ', ' );
	if ( $levels && ! is_wp_error( $levels ) ) {
		$rows[] = array(
			'label' => __( 'Level', 'palmtreesurf' ),
			'value' => wp_strip_all_tags( $levels ),
		);
	}

	return $rows;
}

/**
 * Print a one-per-line experience list, such as inclusions or what to bring.
 *
 * @param int    $post_id Experience ID.
 * @param string $key     Field key.
 * @param string $class   List class.
 */
function pt_experience_list( $post_id, $key, $class = 'experience__includes' ) {
	$items = pt_field_lines( $post_id, $key );

	if ( ! $items ) {
		return;
	}

	printf( '<ul class="%s">', esc_attr( $class ) );
	foreach ( $items as $item ) {
		printf( '<li>%s</li>', esc_html( $item ) );
	}
	echo '</ul>';
}

/**
 * Print the configured social links.
 */
function pt_social_links() {
	$links = array(
		'pt_instagram'   => __( 'Instagram', 'palmtreesurf' ),
		'pt_facebook'    => __( 'Facebook', 'palmtreesurf' ),
		'pt_tripadvisor' => __( 'Tripadvisor', 'palmtreesurf' ),
		'pt_youtube'     => __( 'YouTube', 'palmtreesurf' ),
	);

	$output = '';
	foreach ( $links as $key => $label ) {
		$url = pt_mod( $key );
		if ( ! $url ) {
			continue;
		}

		$output .= sprintf(
			'<li><a class="social__link social__link--%1$s" href="%2$s" rel="noopener" target="_blank">%3$s</a></li>',
			esc_attr( str_replace( 'pt_', '', $key ) ),
			esc_url( $url ),
			esc_html( $label )
		);
	}

	if ( $output ) {
		printf( '<ul class="social">%s</ul>', $output ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Built from escaped parts above.
	}
}

/**
 * Print a WhatsApp deep link when a number is configured.
 */
function pt_whatsapp_link() {
	$number = preg_replace( '/\D/', '', pt_mod( 'pt_whatsapp' ) );
	if ( ! $number ) {
		return;
	}

	printf(
		'<a class="btn btn--whatsapp" href="%1$s" rel="noopener" target="_blank">%2$s</a>',
		esc_url( 'https://wa.me/' . $number ),
		esc_html__( 'Message us on WhatsApp', 'palmtreesurf' )
	);
}

/**
 * A Customizer value, but blank if it still holds an unfilled {{PT_*}} token.
 *
 * Section 12 wants placeholders greppable, and the client needs to see what to
 * fill in. Both are satisfied by storing the token as the setting default and
 * hiding it at render time, so a visitor never sees {{PT_PHONE}} on the page.
 *
 * @param string $key Theme mod name.
 * @return string
 */
function pt_filled( $key ) {
	$value = pt_mod( $key );

	return preg_match( '/\{\{\s*PT_[A-Z_]+\s*\}\}/', $value ) ? '' : $value;
}

/**
 * Whether any of the given Customizer values are filled in.
 *
 * Lets a section skip itself rather than render an empty shell (section 7.10).
 *
 * @param array $keys Theme mod names.
 * @return bool
 */
function pt_any_filled( $keys ) {
	foreach ( $keys as $key ) {
		if ( '' !== pt_filled( $key ) ) {
			return true;
		}
	}

	return false;
}

/**
 * A WhatsApp deep link, or '' when no number is configured.
 *
 * @param string $message Optional pre-filled message.
 * @return string
 */
function pt_whatsapp_url( $message = '' ) {
	$number = preg_replace( '/\D/', '', pt_filled( 'pt_whatsapp' ) );

	if ( ! $number ) {
		return '';
	}

	$url = 'https://wa.me/' . $number;

	if ( $message ) {
		$url = add_query_arg( 'text', rawurlencode( $message ), $url );
	}

	return $url;
}

/**
 * Print a language switcher, but only when there is something to switch to.
 *
 * The approved design shows an EN/ES control. Rendering one on a site with no
 * translation layer would be a dead control, so this defers to Polylang or
 * WPML when present and renders nothing otherwise.
 */
function pt_language_switcher() {
	// The theme's own bilingual mode, when the client has switched it on.
	if ( function_exists( 'pt_render_language_toggle' ) && pt_render_language_toggle() ) {
		return;
	}

	// Polylang.
	if ( function_exists( 'pll_the_languages' ) ) {
		$langs = pll_the_languages( array( 'raw' => 1 ) );

		if ( is_array( $langs ) && count( $langs ) > 1 ) {
			echo '<div class="lang-switch">';
			foreach ( $langs as $lang ) {
				printf(
					'<a class="lang-switch__item%1$s" href="%2$s">%3$s</a>',
					! empty( $lang['current_lang'] ) ? ' is-current' : '',
					esc_url( $lang['url'] ),
					esc_html( strtoupper( $lang['slug'] ) )
				);
			}
			echo '</div>';
		}

		return;
	}

	// WPML.
	if ( function_exists( 'icl_get_languages' ) ) {
		$langs = icl_get_languages( 'skip_missing=0' );

		if ( is_array( $langs ) && count( $langs ) > 1 ) {
			echo '<div class="lang-switch">';
			foreach ( $langs as $lang ) {
				printf(
					'<a class="lang-switch__item%1$s" href="%2$s">%3$s</a>',
					! empty( $lang['active'] ) ? ' is-current' : '',
					esc_url( $lang['url'] ),
					esc_html( strtoupper( $lang['language_code'] ) )
				);
			}
			echo '</div>';
		}
	}
}

/**
 * The URL of the page currently being rendered.
 *
 * `wp_get_referer()` deliberately returns false when the referer matches the
 * current request, which is exactly the case for a form that posts to itself —
 * so using it as a redirect target bounced people to the homepage after
 * submitting. Resolving the queried object is reliable for every template.
 *
 * @return string
 */
function pt_current_url() {
	if ( is_singular() || is_page() ) {
		$url = get_permalink( get_queried_object_id() );

		if ( $url ) {
			return $url;
		}
	}

	if ( is_post_type_archive() ) {
		$url = get_post_type_archive_link( get_query_var( 'post_type' ) );

		if ( $url ) {
			return $url;
		}
	}

	if ( is_tax() || is_category() || is_tag() ) {
		$url = get_term_link( get_queried_object() );

		if ( $url && ! is_wp_error( $url ) ) {
			return $url;
		}
	}

	$referer = wp_get_referer();

	return $referer ? $referer : home_url( '/' );
}
