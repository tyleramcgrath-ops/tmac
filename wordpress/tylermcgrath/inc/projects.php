<?php
/**
 * The portfolio: a Projects post type, a Discipline taxonomy, project details
 * meta box, sample data and a one-click importer.
 *
 * @package tylermcgrath
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register the post type and taxonomy.
 */
function tm_register_projects() {
	register_post_type(
		'tm_project',
		array(
			'labels'        => array(
				'name'          => __( 'Portfolio', 'tylermcgrath' ),
				'singular_name' => __( 'Project', 'tylermcgrath' ),
				'add_new_item'  => __( 'Add project', 'tylermcgrath' ),
				'edit_item'     => __( 'Edit project', 'tylermcgrath' ),
				'all_items'     => __( 'All projects', 'tylermcgrath' ),
				'menu_name'     => __( 'Portfolio', 'tylermcgrath' ),
			),
			'public'        => true,
			'has_archive'   => 'portfolio',
			'rewrite'       => array( 'slug' => 'portfolio' ),
			'menu_icon'     => 'dashicons-star-filled',
			'menu_position' => 5,
			'show_in_rest'  => true,
			'supports'      => array( 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes' ),
		)
	);

	register_taxonomy(
		'tm_discipline',
		'tm_project',
		array(
			'labels'            => array(
				'name'          => __( 'Disciplines', 'tylermcgrath' ),
				'singular_name' => __( 'Discipline', 'tylermcgrath' ),
			),
			'hierarchical'      => true,
			'show_admin_column' => true,
			'show_in_rest'      => true,
			'rewrite'           => array( 'slug' => 'discipline' ),
		)
	);
}
add_action( 'init', 'tm_register_projects' );

/**
 * Flush permalinks once when the theme is switched on, so /portfolio/ works.
 */
function tm_activate() {
	tm_register_projects();
	flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'tm_activate' );

/**
 * Project detail fields.
 *
 * @return array key => label
 */
function tm_project_fields() {
	return array(
		'client' => __( 'Client', 'tylermcgrath' ),
		'year'   => __( 'Year', 'tylermcgrath' ),
		'role'   => __( 'My role', 'tylermcgrath' ),
		'result' => __( 'Headline result (e.g. "+212% organic traffic")', 'tylermcgrath' ),
		'stack'  => __( 'Services / stack (comma separated)', 'tylermcgrath' ),
		'url'    => __( 'Live URL', 'tylermcgrath' ),
	);
}

/**
 * Meta box for the project details.
 */
function tm_project_meta_box() {
	add_meta_box( 'tm_project_details', __( 'Project details', 'tylermcgrath' ), 'tm_project_meta_box_html', 'tm_project', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'tm_project_meta_box' );

/**
 * Render the meta box.
 *
 * @param WP_Post $post Current post.
 */
function tm_project_meta_box_html( $post ) {
	wp_nonce_field( 'tm_project_save', 'tm_project_nonce' );
	echo '<table class="form-table"><tbody>';
	foreach ( tm_project_fields() as $key => $label ) {
		$value = get_post_meta( $post->ID, '_tm_' . $key, true );
		printf(
			'<tr><th><label for="tm_%1$s">%2$s</label></th><td><input type="%3$s" class="widefat" id="tm_%1$s" name="tm_%1$s" value="%4$s"></td></tr>',
			esc_attr( $key ),
			esc_html( $label ),
			'url' === $key ? 'url' : 'text',
			esc_attr( $value )
		);
	}
	echo '</tbody></table>';
	echo '<p class="description">' . esc_html__( 'The excerpt is the one-line description shown on the portfolio card. Set the featured image for the card artwork, and the Order field (Page attributes) to sort.', 'tylermcgrath' ) . '</p>';
}

/**
 * Save the meta box.
 *
 * @param int $post_id Post ID.
 */
function tm_project_save( $post_id ) {
	if ( ! isset( $_POST['tm_project_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['tm_project_nonce'] ) ), 'tm_project_save' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	foreach ( array_keys( tm_project_fields() ) as $key ) {
		if ( ! isset( $_POST[ 'tm_' . $key ] ) ) {
			continue;
		}
		$raw   = wp_unslash( $_POST[ 'tm_' . $key ] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$value = 'url' === $key ? esc_url_raw( $raw ) : sanitize_text_field( $raw );
		update_post_meta( $post_id, '_tm_' . $key, $value );
	}
}
add_action( 'save_post_tm_project', 'tm_project_save' );

/**
 * Sample portfolio, shown until real projects are published and available
 * to import as editable posts.
 *
 * @return array[]
 */
function tm_sample_projects() {
	return array(
		array(
			'title'      => 'Citation Gap',
			'excerpt'    => 'Scores a page against Google’s live top 10 and the AI Overview, then hands back an ordered list of what to change.',
			'discipline' => 'SEO & AI Search',
			'client'     => 'Product',
			'year'       => '2026',
			'role'       => 'Strategy, design & build',
			'result'     => 'Ranks for Google and AI answers',
			'stack'      => 'AI Search, SERP analysis, Claude',
			'url'        => 'https://citation-gap.vercel.app',
		),
		array(
			'title'      => 'North Star HQ',
			'excerpt'    => 'A live 3D mission-control room for watching a team of AI SEO agents work a project, built around the brass compass.',
			'discipline' => 'SEO & AI Search',
			'client'     => 'Product',
			'year'       => '2026',
			'role'       => 'Creative direction & engineering',
			'result'     => 'Real Search Console data, live',
			'stack'      => 'Three.js, AI agents, Google APIs',
			'url'        => '',
		),
		array(
			'title'      => 'LawMatchNow',
			'excerpt'    => 'A server-rendered attorney directory and legal library, with researched law guides for every state.',
			'discipline' => 'Web Design',
			'client'     => 'LawMatchNow',
			'year'       => '2026',
			'role'       => 'Rebuild, SEO architecture',
			'result'     => 'Fully crawlable by Google and AI',
			'stack'      => 'Next.js, Directory SEO, Schema',
			'url'        => 'https://lawmatchnow.com',
		),
		array(
			'title'      => 'SaySites',
			'excerpt'    => 'Tell it about your business and it builds a clean, fast website that ranks, with a weekly visibility score.',
			'discipline' => 'Web Design',
			'client'     => 'Product',
			'year'       => '2026',
			'role'       => 'Product & brand',
			'result'     => 'Sites that win on merit',
			'stack'      => 'Website builder, Local SEO, AI',
			'url'        => '',
		),
		array(
			'title'      => 'SEO Competitor Intelligence',
			'excerpt'    => 'Pulls the live top 10, crawls every competitor and produces a side-by-side gap analysis with a prioritized action plan.',
			'discipline' => 'SEO & AI Search',
			'client'     => 'Product',
			'year'       => '2026',
			'role'       => 'Design & build',
			'result'     => 'Gap analysis in minutes',
			'stack'      => 'Competitive research, Content gaps',
			'url'        => '',
		),
		array(
			'title'      => 'SaySites Instagram',
			'excerpt'    => 'A content system and campaign calendar for a website brand: hooks, carousels and short-form video built around real customer questions.',
			'discipline' => 'Marketing',
			'client'     => 'SaySites',
			'year'       => '2026',
			'role'       => 'Campaign strategy & content',
			'result'     => 'Always-on social calendar',
			'stack'      => 'Social, Content strategy, Video',
			'url'        => '',
		),
		array(
			'title'      => 'Reloop',
			'excerpt'    => 'The pricing and distribution layer for secondhand fashion: list once, sell everywhere, protected by SafeBuy escrow.',
			'discipline' => 'Marketing',
			'client'     => 'Concept',
			'year'       => '2026',
			'role'       => 'Positioning & prototype',
			'result'     => 'Go-to-market prototype',
			'stack'      => 'Positioning, Product marketing',
			'url'        => '',
		),
	);
}

/**
 * Projects for the home page: published posts, or the sample set when there
 * are none yet. Each item is normalised to the same shape.
 *
 * @return array[]
 */
function tm_get_projects() {
	$posts = get_posts(
		array(
			'post_type'      => 'tm_project',
			'posts_per_page' => 60,
			'orderby'        => array(
				'menu_order' => 'ASC',
				'date'       => 'DESC',
			),
		)
	);

	if ( ! $posts ) {
		return array_map(
			function ( $p ) {
				$p['link']     = $p['url'] ? $p['url'] : '';
				$p['image']    = '';
				$p['external'] = (bool) $p['url'];
				return $p;
			},
			tm_sample_projects()
		);
	}

	$out = array();
	foreach ( $posts as $post ) {
		$terms = get_the_terms( $post, 'tm_discipline' );
		$item  = array(
			'title'      => get_the_title( $post ),
			'excerpt'    => get_the_excerpt( $post ),
			'discipline' => ( $terms && ! is_wp_error( $terms ) ) ? $terms[0]->name : '',
			'link'       => get_permalink( $post ),
			'image'      => get_the_post_thumbnail_url( $post, 'tm-card' ),
			'external'   => false,
		);
		foreach ( array_keys( tm_project_fields() ) as $key ) {
			$item[ $key ] = get_post_meta( $post->ID, '_tm_' . $key, true );
		}
		$out[] = $item;
	}
	return $out;
}

/**
 * Admin notice offering to import the sample projects.
 */
function tm_import_notice() {
	if ( ! current_user_can( 'edit_posts' ) || get_option( 'tm_samples_imported' ) ) {
		return;
	}
	$count = wp_count_posts( 'tm_project' );
	if ( $count && ( $count->publish + $count->draft ) > 0 ) {
		return;
	}
	$url = wp_nonce_url( admin_url( 'admin-post.php?action=tm_import_samples' ), 'tm_import_samples' );
	echo '<div class="notice notice-info"><p><strong>' . esc_html__( 'Tyler McGrath theme:', 'tylermcgrath' ) . '</strong> ';
	echo esc_html__( 'Your portfolio is showing sample projects. Import them as editable posts to start replacing them with your own work.', 'tylermcgrath' );
	echo ' <a class="button button-primary" href="' . esc_url( $url ) . '">' . esc_html__( 'Import sample projects', 'tylermcgrath' ) . '</a></p></div>';
}
add_action( 'admin_notices', 'tm_import_notice' );

/**
 * Import the sample projects as real posts.
 */
function tm_import_samples() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( esc_html__( 'You are not allowed to do that.', 'tylermcgrath' ) );
	}
	check_admin_referer( 'tm_import_samples' );

	foreach ( tm_sample_projects() as $i => $p ) {
		$id = wp_insert_post(
			array(
				'post_type'    => 'tm_project',
				'post_status'  => 'publish',
				'post_title'   => $p['title'],
				'post_excerpt' => $p['excerpt'],
				'post_content' => '<!-- wp:paragraph --><p>' . esc_html( $p['excerpt'] ) . '</p><!-- /wp:paragraph -->',
				'menu_order'   => $i,
			)
		);
		if ( ! $id || is_wp_error( $id ) ) {
			continue;
		}
		foreach ( array_keys( tm_project_fields() ) as $key ) {
			update_post_meta( $id, '_tm_' . $key, $p[ $key ] );
		}
		wp_set_object_terms( $id, $p['discipline'], 'tm_discipline' );
	}
	update_option( 'tm_samples_imported', 1 );
	wp_safe_redirect( admin_url( 'edit.php?post_type=tm_project' ) );
	exit;
}
add_action( 'admin_post_tm_import_samples', 'tm_import_samples' );
