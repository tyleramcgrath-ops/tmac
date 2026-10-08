<?php
/**
 * Journal post helpers.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Reading time in minutes.
 *
 * @param string $content Post content.
 * @return int
 */
function pt_reading_time( $content ) {
	$words = str_word_count( wp_strip_all_tags( strip_shortcodes( $content ) ) );

	return $words ? max( 1, (int) round( $words / 220 ) ) : 0;
}

/**
 * Top-level headings in a post, for the contents list.
 *
 * Ids are derived the same way the content filter below applies them, so the
 * links always land.
 *
 * @param string $content Post content.
 * @return array<int, array<string, string>>
 */
function pt_post_headings( $content ) {
	if ( ! preg_match_all( '#<h2[^>]*>(.*?)</h2>#s', $content, $matches, PREG_SET_ORDER ) ) {
		return array();
	}

	$headings = array();
	$seen     = array();

	foreach ( $matches as $match ) {
		$text = trim( wp_strip_all_tags( $match[1] ) );

		if ( '' === $text ) {
			continue;
		}

		$id = pt_heading_id( $text, $seen );

		$headings[] = array(
			'id'   => $id,
			'text' => $text,
		);
	}

	return $headings;
}

/**
 * A stable, unique id for a heading.
 *
 * @param string $text Heading text.
 * @param array  $seen Ids already used, by reference.
 * @return string
 */
function pt_heading_id( $text, &$seen ) {
	$base = sanitize_title( $text );
	$base = $base ? $base : 'section';
	$id   = $base;
	$n    = 2;

	while ( isset( $seen[ $id ] ) ) {
		$id = $base . '-' . $n;
		++$n;
	}

	$seen[ $id ] = true;

	return $id;
}

/**
 * Give every H2 in a post an id, so the contents list and deep links work.
 *
 * @param string $content Post content.
 * @return string
 */
function pt_add_heading_ids( $content ) {
	if ( ! is_singular( 'post' ) || is_admin() ) {
		return $content;
	}

	$seen = array();

	return preg_replace_callback(
		'#<h2([^>]*)>(.*?)</h2>#s',
		function ( $match ) use ( &$seen ) {
			// Never overwrite an id the author set themselves.
			if ( false !== strpos( $match[1], 'id=' ) ) {
				return $match[0];
			}

			$id = pt_heading_id( wp_strip_all_tags( $match[2] ), $seen );

			return '<h2' . $match[1] . ' id="' . esc_attr( $id ) . '">' . $match[2] . '</h2>';
		},
		$content
	);
}
add_filter( 'the_content', 'pt_add_heading_ids', 9 );

/**
 * Tag list at the foot of a post.
 */
function pt_post_tags() {
	$tags = get_the_tags();

	if ( ! $tags || is_wp_error( $tags ) ) {
		return;
	}
	?>
	<p class="post-tags">
		<?php foreach ( $tags as $tag ) : ?>
			<a class="post-tag" href="<?php echo esc_url( get_tag_link( $tag ) ); ?>">#<?php echo esc_html( $tag->name ); ?></a>
		<?php endforeach; ?>
	</p>
	<?php
}

/**
 * No widget sidebar on the journal.
 *
 * The theme registers a sidebar so a client can use one if they want it, but
 * a long-form guide reads better without Search and Recent Comments beside it.
 *
 * @param bool   $is_active Whether the sidebar has widgets.
 * @param string $index     Sidebar id.
 * @return bool
 */
function pt_hide_sidebar_on_posts( $is_active, $index ) {
	if ( 'sidebar-1' !== $index ) {
		return $is_active;
	}

	if ( is_singular( 'post' ) || is_home() || is_category() || is_tag() ) {
		return false;
	}

	return $is_active;
}
add_filter( 'is_active_sidebar', 'pt_hide_sidebar_on_posts', 10, 2 );
