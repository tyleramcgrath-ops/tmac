<?php
/**
 * Output helpers shared by the templates.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Where a "Book Now" button should point.
 *
 * Package booking link wins, then the site-wide booking system, then the
 * enquiry form on the contact page.
 *
 * @param int|null $post_id Optional package to check first.
 * @return string
 */
function pts_booking_url( $post_id = null ) {
	if ( $post_id ) {
		$package_url = get_post_meta( $post_id, '_pts_booking_url', true );
		if ( $package_url ) {
			return $package_url;
		}
	}

	$site_url = pts_mod( 'pts_booking_url' );
	if ( $site_url ) {
		return $site_url;
	}

	$contact = get_page_by_path( 'contact' );
	if ( $contact ) {
		return get_permalink( $contact ) . '#enquiry';
	}

	return home_url( '/#enquiry' );
}

/**
 * Print the post date and author for a blog post.
 */
function pts_posted_on() {
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
function pts_post_thumbnail( $size = 'pts-card' ) {
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
function pts_pagination() {
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
 * Build the package detail rows (price, duration, group size, level).
 *
 * @param int $post_id Package ID.
 * @return array<int, array{label: string, value: string}>
 */
function pts_package_details( $post_id ) {
	$rows  = array();
	$price = get_post_meta( $post_id, '_pts_price', true );

	if ( $price ) {
		$suffix = get_post_meta( $post_id, '_pts_price_suffix', true );
		$rows[] = array(
			'label' => __( 'From', 'palmtreesurf' ),
			'value' => trim( '$' . $price . ' ' . $suffix ),
		);
	}

	$duration = get_post_meta( $post_id, '_pts_duration', true );
	if ( $duration ) {
		$rows[] = array(
			'label' => __( 'Duration', 'palmtreesurf' ),
			'value' => $duration,
		);
	}

	$group = get_post_meta( $post_id, '_pts_group_size', true );
	if ( $group ) {
		$rows[] = array(
			'label' => __( 'Group size', 'palmtreesurf' ),
			'value' => $group,
		);
	}

	$levels = get_the_term_list( $post_id, 'pts_skill_level', '', ', ' );
	if ( $levels && ! is_wp_error( $levels ) ) {
		$rows[] = array(
			'label' => __( 'Level', 'palmtreesurf' ),
			'value' => wp_strip_all_tags( $levels ),
		);
	}

	return $rows;
}

/**
 * Print the "what's included" list for a package.
 *
 * @param int $post_id Package ID.
 */
function pts_package_includes( $post_id ) {
	$raw = get_post_meta( $post_id, '_pts_includes', true );
	if ( ! $raw ) {
		return;
	}

	$items = array_filter( array_map( 'trim', explode( "\n", $raw ) ) );
	if ( ! $items ) {
		return;
	}

	echo '<ul class="package__includes">';
	foreach ( $items as $item ) {
		printf( '<li>%s</li>', esc_html( $item ) );
	}
	echo '</ul>';
}

/**
 * Print the configured social links.
 */
function pts_social_links() {
	$links = array(
		'pts_instagram'   => __( 'Instagram', 'palmtreesurf' ),
		'pts_facebook'    => __( 'Facebook', 'palmtreesurf' ),
		'pts_tripadvisor' => __( 'Tripadvisor', 'palmtreesurf' ),
		'pts_youtube'     => __( 'YouTube', 'palmtreesurf' ),
	);

	$output = '';
	foreach ( $links as $key => $label ) {
		$url = pts_mod( $key );
		if ( ! $url ) {
			continue;
		}

		$output .= sprintf(
			'<li><a class="social__link social__link--%1$s" href="%2$s" rel="noopener" target="_blank">%3$s</a></li>',
			esc_attr( str_replace( 'pts_', '', $key ) ),
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
function pts_whatsapp_link() {
	$number = preg_replace( '/\D/', '', pts_mod( 'pts_whatsapp' ) );
	if ( ! $number ) {
		return;
	}

	printf(
		'<a class="btn btn--whatsapp" href="%1$s" rel="noopener" target="_blank">%2$s</a>',
		esc_url( 'https://wa.me/' . $number ),
		esc_html__( 'Message us on WhatsApp', 'palmtreesurf' )
	);
}
