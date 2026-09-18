<?php
/**
 * McGrath Chrome — theme setup.
 *
 * @package mcgrath-chrome
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'MCG_VERSION', '2.0.0' );

require_once get_template_directory() . '/inc/icons.php';
require_once get_template_directory() . '/inc/content.php';
require_once get_template_directory() . '/inc/contact-form.php';

function mcg_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'custom-logo', array( 'height' => 48, 'width' => 240, 'flex-height' => true, 'flex-width' => true ) );
	register_nav_menus( array(
		'primary' => __( 'Primary menu', 'mcgrath-chrome' ),
		'footer'  => __( 'Footer menu', 'mcgrath-chrome' ),
	) );
}
add_action( 'after_setup_theme', 'mcg_setup' );

function mcg_assets() {
	wp_enqueue_style(
		'mcg-fonts',
		'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Inter:wght@400;500;600&family=DM+Mono:wght@400;500&family=Caveat:wght@400;500&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'mcg-style', get_stylesheet_uri(), array( 'mcg-fonts' ), MCG_VERSION );
	wp_enqueue_script( 'mcg-chrome', get_template_directory_uri() . '/assets/js/chrome.js', array(), MCG_VERSION, true );
}
add_action( 'wp_enqueue_scripts', 'mcg_assets' );

/** Editable strings, so copy changes never require touching a template. */
function mcg_customize( $wp_customize ) {
	$wp_customize->add_section( 'mcg_hero', array(
		'title'       => __( 'Homepage & brand', 'mcgrath-chrome' ),
		'description' => __( 'Every string on the homepage that is not normal page content.', 'mcgrath-chrome' ),
		'priority'    => 30,
	) );

	$fields = array(
		'mcg_hero_kicker' => array( 'Hero kicker', 'Jupiter, Florida · Serving Clients Nationwide' ),
		'mcg_hero_l1'     => array( 'Headline line 1', 'Built to Make Your' ),
		'mcg_hero_l2'     => array( 'Headline line 2', 'Business Impossible' ),
		'mcg_hero_l3'     => array( 'Headline line 3', 'to Miss.' ),
		'mcg_hero_sub'    => array( 'Hero paragraph', 'SEO, AI Search Optimization, web design and digital strategies that get you found, build authority and drive measurable growth.' ),
		'mcg_hero_trust'  => array( 'Trust line under the buttons', 'Trusted by growing businesses<br>in Jupiter and across the country.' ),
		'mcg_plate_l1'    => array( 'Photo overlay line 1', 'Higher Visibility' ),
		'mcg_plate_l2'    => array( 'Photo overlay line 2', 'Stronger Businesses' ),
		'mcg_plate_l3'    => array( 'Photo overlay line 3', 'A Brighter Tomorrow' ),
		'mcg_shift_head'  => array( 'Dissolve heading', 'Search changed. We changed with it.' ),
		'mcg_shift_sub'   => array( 'Dissolve paragraph', 'A modern marketing partner for a multi-platform world. From Google to AI search, we help brands show up, stand out and grow — with strategies built for what is next.' ),
		'mcg_hero_query'  => array( 'Search query shown in the dissolve', 'seo company jupiter fl' ),
		'mcg_hero_ask'    => array( 'The question it lands on (words before the highlight)', 'Who is the best SEO company in' ),
		'mcg_hero_mark'   => array( 'Highlighted end of the question', 'Jupiter, FL?' ),
		'mcg_overview_body' => array( 'The overview that comes back (b tags allowed)', 'Searches for SEO in Jupiter, Florida most often surface <b>McGrath Marketing Group</b>, a practice covering SEO, AI search optimisation and web design for local and national clients. Coverage on regional directories and review sites supports the same shortlist.' ),
		'mcg_brand_line'  => array( 'Wordmark sub-line', 'McGrath Marketing Group' ),
		'mcg_tagline'     => array( 'Footer tagline', 'A Higher Visibility. A Brighter Tomorrow.' ),
		'mcg_email'       => array( 'Contact email', 'tyler@mcgrathmarketinggroup.com' ),
		'mcg_location'    => array( 'Location line', 'Jupiter, Florida' ),
		'mcg_reach'       => array( 'Reach line', 'Serving Clients Nationwide' ),
		'mcg_coords'      => array( 'Coordinates under the dashboard', '26.9342° N, 80.0942° W' ),
		'mcg_price_audit'  => array( 'SEO page price: one-off audit', 'On request' ),
		'mcg_price_month'  => array( 'SEO page price: monthly SEO', 'On request' ),
		'mcg_price_launch' => array( 'SEO page price: local launch', 'Fixed scope, on request' ),
		'mcg_case_client' => array( 'Case study: first line', 'What a year of' ),
		'mcg_case_unit'   => array( 'Case study: second line', 'this work moves' ),
		'mcg_case_summary'=> array( 'Case study summary', 'Technical repair first, then the pages that answer what buyers actually search for, then the profiles and citations that decide the map. The shape most engagements take, and the range of movement they produce.' ),
		'mcg_case_headline'=> array( 'Headline shown on the mock site', 'A Clear Offer, Easy to Find' ),
		'mcg_social_linkedin'  => array( 'LinkedIn URL', '' ),
		'mcg_social_instagram' => array( 'Instagram URL', '' ),
		'mcg_social_youtube'   => array( 'YouTube URL', '' ),
	);

	foreach ( $fields as $id => $meta ) {
		$wp_customize->add_setting( $id, array(
			'default'           => $meta[1],
			'sanitize_callback' => 'wp_kses_post',
		) );
		$wp_customize->add_control( $id, array(
			'label'   => $meta[0],
			'section' => 'mcg_hero',
			'type'    => 'text',
		) );
	}

}
add_action( 'customize_register', 'mcg_customize' );

/** Helper: a customizer string with its default. */
function mcg_opt( $key, $fallback = '' ) {
	return get_theme_mod( $key, $fallback );
}

/** Body classes so CSS can target the front page sequence. */
function mcg_body_class( $classes ) {
	if ( is_front_page() ) { $classes[] = 'is-front'; }
	return $classes;
}
add_filter( 'body_class', 'mcg_body_class' );

/** Fallback menu when none is assigned yet. */
function mcg_fallback_menu() {
	$labels = mcg_nav_labels();
	$pages  = array(
		'seo-jupiter-fl'     => $labels['seo-jupiter-fl'],
		'web-design-jupiter' => $labels['web-design-jupiter'],
		'ai-visibility'      => $labels['ai-visibility'],
		'about'              => $labels['about'],
		'contact'            => $labels['contact'],
	);
	echo '<ul>';
	foreach ( $pages as $slug => $label ) {
		echo '<li><a href="' . esc_url( home_url( '/' . $slug . '/' ) ) . '">' . esc_html( $label ) . '</a></li>';
	}
	echo '</ul>';
}

/**
 * The short label each page uses in the navigation.
 *
 * The page titles carry the location because that is what search reads; the
 * menu does not need to repeat it and long labels wrap and crowd the header.
 */
function mcg_nav_labels() {
	return array(
		'seo-jupiter-fl'     => __( 'SEO', 'mcgrath-chrome' ),
		'web-design-jupiter' => __( 'Web Design', 'mcgrath-chrome' ),
		'ai-visibility'      => __( 'AI Visibility', 'mcgrath-chrome' ),
		'about'              => __( 'About', 'mcgrath-chrome' ),
		'contact'            => __( 'Contact', 'mcgrath-chrome' ),
		'vault'              => __( 'Work', 'mcgrath-chrome' ),
		'blog'               => __( 'Insights', 'mcgrath-chrome' ),
	);
}

/**
 * Shorten menu labels at render time.
 *
 * Setting the labels only when the menu is first created missed every site
 * whose menu already existed, which is most of them. Doing it here fixes the
 * menu without anybody having to re-run setup, and only where the label is
 * still the page title — a label somebody typed themselves is left alone.
 *
 * @param array $items Menu items.
 * @return array
 */
function mcg_short_nav_labels( $items ) {
	$labels = mcg_nav_labels();

	foreach ( $items as $item ) {
		if ( 'post_type' !== $item->type || empty( $item->object_id ) ) {
			continue;
		}

		$slug = get_post_field( 'post_name', $item->object_id );
		if ( ! isset( $labels[ $slug ] ) ) {
			continue;
		}

		if ( $item->title === get_the_title( $item->object_id ) ) {
			$item->title = $labels[ $slug ];
		}
	}

	return $items;
}
add_filter( 'wp_nav_menu_objects', 'mcg_short_nav_labels' );

/** Service areas, used by the homepage and by the schema below. */
function mcg_areas() {
	return array(
		'Jupiter', 'Palm Beach Gardens', 'Tequesta', 'Juno Beach',
		'Abacoa', 'Jupiter Farms', 'North Palm Beach', 'Hobe Sound',
		'Stuart', 'Port St. Lucie', 'West Palm Beach', 'Wellington',
	);
}

/**
 * The homepage FAQ. Rendered as <details> on the page and as FAQPage schema in
 * the head, from this one array, so the two can never drift apart.
 */
function mcg_faqs() {
	return array(
		array(
			'q' => 'How much does SEO cost in Jupiter, FL?',
			'a' => 'Most local SEO work in this market runs between a few hundred and a few thousand a month depending on how competitive the term is and how much content the site needs. My own starting points are listed on the services pages rather than hidden behind a discovery call. If a company will not give you a number before a meeting, that is a sales process, not a pricing model.',
		),
		array(
			'q' => 'How long before I see results from SEO?',
			'a' => 'Technical fixes and conversion work can move numbers inside a quarter. Content and authority compound over six to twelve months. Local map results sometimes move faster than that and sometimes slower, and anyone promising a specific position by a specific date is guessing.',
		),
		array(
			'q' => 'Do I need a new website, or can you fix the one I have?',
			'a' => 'Often the existing site is fine and the real problem is structure, speed or thin pages. I will tell you which it is in the audit. Rebuilding a site that did not need rebuilding is the most common way local businesses waste money.',
		),
		array(
			'q' => 'What is answer engine optimization and do I need it?',
			'a' => 'It is the work that gets your business named when someone asks ChatGPT, Gemini, Perplexity or a Google AI Overview for a recommendation instead of running a normal search. If your buyers research before they call, yes. It runs on the same foundation as good SEO: clean structure, clear claims and presence on the sources those models already trust.',
		),
		array(
			'q' => 'Do you require a long contract?',
			'a' => 'No. Website builds are fixed scope. Search work is monthly and you can stop. Long lock-ins exist to protect the agency, not the client.',
		),
		array(
			'q' => 'Who actually does the work?',
			'a' => 'I do. There is no account manager, no offshore content team and no handoff after the proposal. That is also the limit of the model, which is why I take a small number of clients at a time.',
		),
	);
}

/**
 * Structured data. LocalBusiness on every page so the business, the area served
 * and the services are machine readable; FAQPage on the front page.
 */
function mcg_schema() {
	$biz = array(
		'@context'    => 'https://schema.org',
		'@type'       => 'ProfessionalService',
		'@id'         => home_url( '/#business' ),
		'name'        => get_bloginfo( 'name' ),
		'description' => 'SEO, web design and answer engine optimization for businesses in Jupiter, Florida and the surrounding Palm Beach County area.',
		'url'         => home_url( '/' ),
		'email'       => mcg_opt( 'mcg_email', 'tyler@mcgrathmarketinggroup.com' ),
		'priceRange'  => '$$',
		'founder'     => array( '@type' => 'Person', 'name' => 'Tyler McGrath' ),
		'address'     => array(
			'@type'           => 'PostalAddress',
			'addressLocality' => 'Jupiter',
			'addressRegion'   => 'FL',
			'addressCountry'  => 'US',
		),
		'areaServed'  => array_map(
			function ( $a ) {
				return array( '@type' => 'City', 'name' => $a );
			},
			mcg_areas()
		),
		'knowsAbout'  => array(
			'Search engine optimization',
			'Local SEO',
			'Answer engine optimization',
			'Generative engine optimization',
			'Web design',
			'WordPress development',
			'Technical SEO',
		),
	);

	echo '<script type="application/ld+json">' . wp_json_encode( $biz ) . '</script>' . "\n";

	if ( is_front_page() ) {
		$faq = array(
			'@context'   => 'https://schema.org',
			'@type'      => 'FAQPage',
			'mainEntity' => array(),
		);
		foreach ( mcg_faqs() as $item ) {
			$faq['mainEntity'][] = array(
				'@type'          => 'Question',
				'name'           => $item['q'],
				'acceptedAnswer' => array( '@type' => 'Answer', 'text' => $item['a'] ),
			);
		}
		echo '<script type="application/ld+json">' . wp_json_encode( $faq ) . '</script>' . "\n";

		// The four services, generated from the same array the cards render from.
		$services = array();
		foreach ( mcg_services() as $item ) {
			$services[] = array(
				'@context'    => 'https://schema.org',
				'@type'       => 'Service',
				'name'        => $item['title'],
				'description' => $item['sub'] . ' ' . implode( ', ', $item['items'] ) . '.',
				'url'         => mcg_url( $item['url'] ),
				'serviceType' => $item['title'],
				'provider'    => array( '@id' => home_url( '/#business' ) ),
				'areaServed'  => array( '@type' => 'Country', 'name' => 'United States' ),
			);
		}
		echo '<script type="application/ld+json">' . wp_json_encode( $services ) . '</script>' . "\n";
	}
}
add_action( 'wp_head', 'mcg_schema', 20 );

/** Keep the vault out of search results and sitemaps. */
function mcg_hide_vault() {
	if ( is_page_template( 'template-vault.php' ) ) {
		echo '<meta name="robots" content="noindex,nofollow">' . "\n";
	}
}
add_action( 'wp_head', 'mcg_hide_vault', 1 );

/* =====================================================================
 * One-time setup. On activation the theme builds its own pages, assigns
 * the templates, sets the front page and the blog page, and creates the
 * primary menu. Safe to run more than once: nothing is duplicated and
 * nothing you have edited is overwritten.
 * ===================================================================== */

function mcg_pages_map() {
	return array(
		'home' => array(
			'title'    => 'SEO & Web Design in Jupiter, FL',
			'template' => '',
			'excerpt'  => 'SEO, web design and answer engine optimization for businesses in Jupiter, Florida.',
			'content'  => '',
		),
		'seo-jupiter-fl' => array(
			'title'    => 'SEO Company in Jupiter, FL',
			'template' => 'template-seo.php',
			'excerpt'  => 'Local and technical SEO for businesses in Jupiter, Palm Beach Gardens and Tequesta.',
			'content'  => '',
		),
		'web-design-jupiter' => array(
			'title'    => 'Web Design in Jupiter, FL',
			'template' => 'template-webdesign.php',
			'excerpt'  => 'Custom WordPress websites for Palm Beach County businesses, built to convert and to rank.',
			'content'  => '',
		),
		'ai-visibility' => array(
			'title'    => 'AI Visibility & Answer Engine Optimization',
			'template' => 'template-aeo.php',
			'excerpt'  => 'Get named when buyers ask ChatGPT, Gemini, Perplexity or a Google AI Overview.',
			'content'  => '',
		),
		'about' => array(
			'title'    => 'About',
			'template' => 'template-about.php',
			'excerpt'  => 'One person, not an agency. Who you are hiring and how the work runs.',
			'content'  => '',
		),
		'contact' => array(
			'title'    => 'Contact',
			'template' => 'template-contact.php',
			'excerpt'  => 'Request a free Jupiter SEO audit. One call, no pitch.',
			'content'  => '',
		),
		'vault' => array(
			'title'    => 'The Vault',
			'template' => 'template-vault.php',
			'excerpt'  => '',
			'content'  => '',
		),
		'blog' => array(
			'title'    => 'Notes on Search',
			'template' => '',
			'excerpt'  => '',
			'content'  => '',
		),
	);
}

/**
 * The setup notes earlier versions of this theme planted in page bodies.
 *
 * They were meant as a hint in the editor and ended up rendering on the live
 * site. Listed verbatim so they can be matched exactly and nothing anybody has
 * actually written gets touched.
 */
function mcg_stale_page_content() {
	return array(
		'<!-- wp:paragraph --><p>Add anything else you want on this page here. Everything above it is built by the theme.</p><!-- /wp:paragraph -->',
		'<!-- wp:paragraph --><p>Drop your contact form shortcode here and it will render inside the page.</p><!-- /wp:paragraph -->',
		'<!-- wp:paragraph --><p>Client work goes here. Only people with the password can read it.</p><!-- /wp:paragraph -->',
	);
}

/** Pages whose body is still one of those notes, untouched. */
function mcg_stale_pages() {
	$stale = mcg_stale_page_content();
	$found = array();

	foreach ( array_keys( mcg_pages_map() ) as $slug ) {
		$page = get_page_by_path( $slug );
		if ( $page && in_array( trim( $page->post_content ), $stale, true ) ) {
			$found[] = $page;
		}
	}

	return $found;
}

/** Empty those bodies. Exact matches only. */
function mcg_clear_stale_pages() {
	foreach ( mcg_stale_pages() as $page ) {
		wp_update_post( array(
			'ID'           => $page->ID,
			'post_content' => '',
		) );
	}
}

function mcg_activate() {
	$ids = array();

	foreach ( mcg_pages_map() as $slug => $page ) {
		$existing = get_page_by_path( $slug );

		if ( $existing ) {
			$ids[ $slug ] = $existing->ID;
		} else {
			$id = wp_insert_post( array(
				'post_title'   => $page['title'],
				'post_name'    => $slug,
				'post_content' => $page['content'],
				'post_excerpt' => $page['excerpt'],
				'post_status'  => 'publish',
				'post_type'    => 'page',
			) );

			if ( is_wp_error( $id ) || ! $id ) {
				continue;
			}

			$ids[ $slug ] = $id;

			// The vault ships locked. Change the password in the page editor.
			if ( 'vault' === $slug ) {
				wp_update_post( array( 'ID' => $id, 'post_password' => 'jupiter' ) );
			}
		}

		// Assign the template if the page does not already have one.
		if ( $page['template'] && isset( $ids[ $slug ] ) ) {
			$current = get_post_meta( $ids[ $slug ], '_wp_page_template', true );
			if ( ! $current || 'default' === $current ) {
				update_post_meta( $ids[ $slug ], '_wp_page_template', $page['template'] );
			}
		}
	}

	// Static front page and a separate posts page.
	if ( isset( $ids['home'] ) ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $ids['home'] );
	}
	if ( isset( $ids['blog'] ) ) {
		update_option( 'page_for_posts', $ids['blog'] );
	}

	// Primary menu, built once.
	$menu_name = 'Primary';
	$menu      = wp_get_nav_menu_object( $menu_name );

	if ( ! $menu ) {
		$menu_id = wp_create_nav_menu( $menu_name );

		if ( ! is_wp_error( $menu_id ) ) {
			$labels  = mcg_nav_labels();
			$in_menu = array(
				'seo-jupiter-fl'     => $labels['seo-jupiter-fl'],
				'web-design-jupiter' => $labels['web-design-jupiter'],
				'ai-visibility'      => $labels['ai-visibility'],
				'about'              => $labels['about'],
				'contact'            => $labels['contact'],
			);

			foreach ( $in_menu as $slug => $label ) {
				if ( empty( $ids[ $slug ] ) ) {
					continue;
				}
				wp_update_nav_menu_item( $menu_id, 0, array(
					'menu-item-object-id' => $ids[ $slug ],
					'menu-item-object'    => 'page',
					'menu-item-type'      => 'post_type',
					'menu-item-status'    => 'publish',
					// The page titles carry the location for search; the menu
					// does not need to repeat it.
					'menu-item-title'     => $label,
				) );
			}

			$locations = get_theme_mod( 'nav_menu_locations', array() );
			$locations['primary'] = $menu_id;
			$locations['footer']  = $menu_id;
			set_theme_mod( 'nav_menu_locations', $locations );
		}
	}

	mcg_clear_stale_pages();

	// WordPress's default blogname otherwise shows up in page titles, the
	// footer and the schema. Only set it if nobody has chosen one.
	$blogname = get_option( 'blogname' );
	if ( '' === trim( (string) $blogname ) || 'My WordPress' === $blogname || 'My Site' === $blogname ) {
		update_option( 'blogname', 'McGrath Marketing Group' );
	}
	if ( 'Just another WordPress site' === get_option( 'blogdescription' ) ) {
		update_option( 'blogdescription', 'SEO, AI search and web design in Jupiter, Florida' );
	}

	// Pretty permalinks, so /contact/ resolves instead of 404ing.
	if ( ! get_option( 'permalink_structure' ) ) {
		update_option( 'permalink_structure', '/%postname%/' );
	}
	flush_rewrite_rules();

	set_transient( 'mcg_activated', 1, 60 );
}
add_action( 'after_switch_theme', 'mcg_activate' );

/** Tell the user what just happened, once. */
function mcg_activated_notice() {
	if ( ! get_transient( 'mcg_activated' ) || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	delete_transient( 'mcg_activated' );
	?>
	<div class="notice notice-success is-dismissible">
		<p><strong>McGrath Chrome is set up.</strong> Pages created and assigned: home, SEO, Web Design,
		AI Visibility, About, Contact, The Vault and the blog. The primary menu is built and the front
		page is set.</p>
		<p>The Vault is password protected with <code>jupiter</code>. Change it in the page editor under
		Summary &rarr; Visibility.</p>
	</div>
	<?php
}
add_action( 'admin_notices', 'mcg_activated_notice' );

/**
 * If the theme was activated before this routine existed, the activation hook
 * will never fire again. This offers a one-click rerun from the admin.
 */
function mcg_setup_is_done() {
	foreach ( array( 'seo-jupiter-fl', 'web-design-jupiter', 'contact' ) as $slug ) {
		if ( ! get_page_by_path( $slug ) ) {
			return false;
		}
	}
	return true;
}

function mcg_setup_notice() {
	if ( ! current_user_can( 'manage_options' ) || mcg_setup_is_done() || get_transient( 'mcg_activated' ) ) {
		return;
	}
	$url = wp_nonce_url( admin_url( 'themes.php?mcg_setup=1' ), 'mcg_setup' );
	?>
	<div class="notice notice-warning">
		<p><strong>McGrath Chrome:</strong> the site pages have not been created yet, so the menu links
		will 404. One click builds them.</p>
		<p><a class="button button-primary" href="<?php echo esc_url( $url ); ?>">Create the pages and menu</a></p>
	</div>
	<?php
}
add_action( 'admin_notices', 'mcg_setup_notice' );

/**
 * Offer to clear the leftover setup notes.
 *
 * The notice above only appears when the pages are missing, so a site that was
 * set up by an earlier version never saw an invitation to tidy this up.
 */
function mcg_stale_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$pages = mcg_stale_pages();
	if ( ! $pages ) {
		return;
	}

	$names = array();
	foreach ( $pages as $page ) {
		$names[] = get_the_title( $page );
	}

	$url = wp_nonce_url( admin_url( 'themes.php?mcg_tidy=1' ), 'mcg_tidy' );
	?>
	<div class="notice notice-warning">
		<p><strong>McGrath Chrome:</strong>
			<?php
			printf(
				/* translators: %s: comma separated list of page titles. */
				esc_html__( 'these pages still show the setup note this theme used to add, and it is visible to visitors: %s. Everything the page needs is built by the template, so the note can go.', 'mcgrath-chrome' ),
				'<em>' . esc_html( implode( ', ', $names ) ) . '</em>'
			);
			?>
		</p>
		<p><a class="button button-primary" href="<?php echo esc_url( $url ); ?>"><?php esc_html_e( 'Remove the setup notes', 'mcgrath-chrome' ); ?></a></p>
	</div>
	<?php
}
add_action( 'admin_notices', 'mcg_stale_notice' );

/** Handle the tidy-up link. */
function mcg_maybe_tidy() {
	if ( ! isset( $_GET['mcg_tidy'] ) || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	check_admin_referer( 'mcg_tidy' );
	mcg_clear_stale_pages();
	wp_safe_redirect( admin_url( 'themes.php' ) );
	exit;
}
add_action( 'admin_init', 'mcg_maybe_tidy' );

function mcg_maybe_run_setup() {
	if ( ! isset( $_GET['mcg_setup'] ) || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	check_admin_referer( 'mcg_setup' );
	mcg_activate();
	wp_safe_redirect( admin_url( 'themes.php' ) );
	exit;
}
add_action( 'admin_init', 'mcg_maybe_run_setup' );
