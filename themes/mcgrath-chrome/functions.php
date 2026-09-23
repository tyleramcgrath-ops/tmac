<?php
/**
 * McGrath Chrome — theme setup.
 *
 * @package mcgrath-chrome
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'MCG_VERSION', '2.5.0' );

require_once get_template_directory() . '/inc/icons.php';
require_once get_template_directory() . '/inc/content.php';
require_once get_template_directory() . '/inc/page-seo.php';
require_once get_template_directory() . '/inc/page-depth.php';
require_once get_template_directory() . '/inc/contact-form.php';
require_once get_template_directory() . '/inc/diagnostics.php';

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
/**
 * The navigation.
 *
 * Rendered from the theme's own pages rather than from a WordPress menu. A
 * menu item stores a page ID, so a menu built under whatever site was here
 * before goes on pointing at that site's pages however the theme is changed.
 * The links below always lead to this theme's pages.
 */
function mcg_nav() {
	$labels = mcg_nav_labels();
	$slugs  = mcg_slugs();

	echo '<ul>';
	foreach ( array( 'seo', 'webdesign', 'aeo', 'about', 'contact' ) as $key ) {
		printf(
			'<li%s><a href="%s">%s</a></li>',
			mcg_page_id( $key ) && is_page( mcg_page_id( $key ) ) ? ' class="current"' : '',
			esc_url( mcg_url( $key ) ),
			esc_html( $labels[ $slugs[ $key ] ] )
		);
	}
	echo '</ul>';
}

function mcg_fallback_menu() {
	$s      = mcg_slugs();
	$labels = mcg_nav_labels();
	$pages  = array();

	foreach ( array( 'seo', 'webdesign', 'aeo', 'about', 'contact' ) as $key ) {
		$pages[ $s[ $key ] ] = $labels[ $s[ $key ] ];
	}
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
	$s = mcg_slugs();

	return array(
		$s['seo']       => __( 'SEO', 'mcgrath-chrome' ),
		$s['webdesign'] => __( 'Web Design', 'mcgrath-chrome' ),
		$s['aeo']       => __( 'AI Visibility', 'mcgrath-chrome' ),
		$s['about']     => __( 'About', 'mcgrath-chrome' ),
		$s['contact']   => __( 'Contact', 'mcgrath-chrome' ),
		$s['vault']     => __( 'Work', 'mcgrath-chrome' ),
		$s['blog']      => __( 'Insights', 'mcgrath-chrome' ),
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
			'a' => 'Most local SEO work in this market runs between a few hundred and a few thousand a month depending on how competitive the term is and how much content the site needs. Ask and you will get a number before a meeting rather than after one. If a company will not quote you until you have sat through a discovery call, that is a sales process, not a pricing model.',
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
/**
 * Whether the theme should emit its own structured data.
 *
 * Yoast, Rank Math and the rest publish their own Organization, LocalBusiness
 * and FAQ graph. Two competing sets on one page is worse than either alone, so
 * the theme stands down when one of them is active. Force it either way with
 * the mcg_output_schema filter.
 */
function mcg_should_output_schema() {
	$seo_plugins = array(
		'WPSEO_VERSION',     // Yoast SEO
		'RANK_MATH_VERSION', // Rank Math
		'AIOSEO_VERSION',    // All in One SEO
		'SEOPRESS_VERSION',  // SEOPress
		'SLIM_SEO_VER',      // Slim SEO
	);

	$output = true;
	foreach ( $seo_plugins as $const ) {
		if ( defined( $const ) ) {
			$output = false;
			break;
		}
	}

	return (bool) apply_filters( 'mcg_output_schema', $output );
}

/**
 * Whether the theme should emit its PAGE-level structured data.
 *
 * Deliberately not the same gate as the business graph. An SEO plugin
 * publishes Organization, WebSite, WebPage and BreadcrumbList, which is why
 * the theme stands down on those. It does not publish an FAQPage built from
 * this theme's FAQ arrays, or a Service describing the page you are on,
 * because it has no idea those exist. Those two are additive rather than
 * competing, so they ship either way.
 *
 * If a plugin has been configured to output its own FAQ schema for these
 * pages, turn this off with the mcg_output_page_schema filter.
 */
function mcg_should_output_page_schema() {
	return (bool) apply_filters( 'mcg_output_page_schema', true );
}

function mcg_schema() {
	mcg_page_schema();

	if ( ! mcg_should_output_schema() ) {
		return;
	}

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

}

/**
 * FAQPage and Service for the page being rendered, from the same arrays the
 * page itself renders from.
 */
function mcg_page_schema() {
	if ( ! mcg_should_output_page_schema() ) {
		return;
	}

	if ( is_front_page() ) {
		mcg_emit_faq_schema( mcg_faqs() );

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
		return;
	}

	// Every other page the theme ships: its own FAQ, and the one service it
	// sells, generated from the arrays that page renders from.
	$key = mcg_current_key();
	if ( $key && 'home' !== $key ) {
		// The FAQ accordion plus the question-shaped headings in the body.
		// Both are visible questions with visible answers, so both belong in
		// the graph; the audit's rule is that structured data must not
		// describe content a visitor cannot see, and these are all on the page.
		$questions = mcg_page_questions();
		$faqs      = mcg_page_faqs();
		$items     = array_merge(
			! empty( $questions[ $key ] ) ? $questions[ $key ] : array(),
			! empty( $faqs[ $key ] ) ? $faqs[ $key ] : array()
		);
		if ( $items ) {
			mcg_emit_faq_schema( $items );
		}

		$services = mcg_page_service();
		if ( ! empty( $services[ $key ] ) ) {
			$svc = $services[ $key ];
			echo '<script type="application/ld+json">' . wp_json_encode(
				array(
					'@context'    => 'https://schema.org',
					'@type'       => 'Service',
					'name'        => $svc['name'],
					'serviceType' => $svc['type'],
					'description' => $svc['desc'],
					'url'         => get_permalink(),
					'provider'    => array( '@id' => home_url( '/#business' ) ),
					'areaServed'  => array_map(
						function ( $a ) {
							return array( '@type' => 'City', 'name' => $a );
						},
						mcg_areas()
					),
				)
			) . '</script>' . "\n";
		}
	}
}

/** One FAQPage graph from a list of question/answer pairs. */
function mcg_emit_faq_schema( $items ) {
	$faq = array(
		'@context'   => 'https://schema.org',
		'@type'      => 'FAQPage',
		'mainEntity' => array(),
	);
	foreach ( $items as $item ) {
		$faq['mainEntity'][] = array(
			'@type'          => 'Question',
			'name'           => $item['q'],
			'acceptedAnswer' => array( '@type' => 'Answer', 'text' => $item['a'] ),
		);
	}
	echo '<script type="application/ld+json">' . wp_json_encode( $faq ) . '</script>' . "\n";
}

/**
 * The meta description.
 *
 * Written per page in mcg_page_terms() so the head term appears in it. Stands
 * down when an SEO plugin is active, for the same reason the schema does: two
 * descriptions on one page is worse than either alone. A page excerpt the
 * owner has written always wins over the theme's default.
 */
function mcg_meta_description() {
	if ( ! mcg_should_output_schema() ) {
		return;
	}

	$desc = '';

	// The theme's own pages use the description written for their head term.
	// Deliberately ahead of the excerpt: the excerpt is only set when the page
	// is first created, so a page that already existed still carries the old
	// text, and the one place the head term is guaranteed to appear is here.
	$key   = mcg_current_key();
	$terms = mcg_page_terms();
	if ( $key && isset( $terms[ $key ]['meta'] ) ) {
		$desc = $terms[ $key ]['meta'];
	}

	// Anything else: the excerpt, then the site tagline.
	if ( ! $desc && is_singular() ) {
		$desc = (string) get_post_field( 'post_excerpt', get_queried_object_id() );
	}

	if ( ! $desc && ( is_home() || is_archive() || is_search() ) ) {
		$desc = get_bloginfo( 'description' );
	}

	$desc = apply_filters( 'mcg_meta_description', $desc, $key );

	if ( $desc ) {
		echo '<meta name="description" content="' . esc_attr( wp_strip_all_tags( $desc ) ) . '">' . "\n";
	}
}
add_action( 'wp_head', 'mcg_meta_description', 2 );

/**
 * Open Graph and Twitter card tags.
 *
 * A link pasted into a message, a group chat or a social post is rendered by
 * the receiving platform from these tags. Unset, the platform guesses, and a
 * link to the business arrives looking like an error. The web design page
 * says the build handles this, so the theme has to actually handle it.
 *
 * Gated the same way as the meta description: an SEO plugin publishes its own
 * Open Graph tags, and two sets on one page is worse than either alone.
 */
function mcg_social_tags() {
	if ( ! mcg_should_output_schema() ) {
		return;
	}

	$key   = mcg_current_key();
	$terms = mcg_page_terms();

	$title = wp_get_document_title();
	$desc  = '';
	if ( $key && isset( $terms[ $key ]['meta'] ) ) {
		$desc = $terms[ $key ]['meta'];
	} elseif ( is_singular() ) {
		$desc = (string) get_post_field( 'post_excerpt', get_queried_object_id() );
	}
	if ( ! $desc ) {
		$desc = get_bloginfo( 'description' );
	}

	$url = is_singular() ? get_permalink() : home_url( '/' );

	// The page's own photograph where it has one, the hero otherwise.
	$image = '';
	$dir   = get_template_directory() . '/assets/img/';
	$uri   = get_template_directory_uri() . '/assets/img/';
	foreach ( array( 'page-' . $key, 'hero' ) as $name ) {
		foreach ( array( 'webp', 'jpg', 'png' ) as $ext ) {
			if ( $name && file_exists( $dir . $name . '.' . $ext ) ) {
				$image = $uri . $name . '.' . $ext;
				break 2;
			}
		}
	}

	$tags = array(
		'og:type'        => is_singular() && ! is_page() ? 'article' : 'website',
		'og:site_name'   => get_bloginfo( 'name' ),
		'og:title'       => $title,
		'og:description' => wp_strip_all_tags( $desc ),
		'og:url'         => $url,
		'og:locale'      => 'en_US',
	);
	if ( $image ) {
		$tags['og:image'] = $image;
	}

	foreach ( $tags as $prop => $val ) {
		printf( '<meta property="%s" content="%s">' . "\n", esc_attr( $prop ), esc_attr( $val ) );
	}

	printf( '<meta name="twitter:card" content="%s">' . "\n", $image ? 'summary_large_image' : 'summary' );
	printf( '<meta name="twitter:title" content="%s">' . "\n", esc_attr( $title ) );
	printf( '<meta name="twitter:description" content="%s">' . "\n", esc_attr( wp_strip_all_tags( $desc ) ) );
	if ( $image ) {
		printf( '<meta name="twitter:image" content="%s">' . "\n", esc_attr( $image ) );
	}
}
add_action( 'wp_head', 'mcg_social_tags', 3 );
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
	$s = mcg_slugs();

	return array(
		$s['home'] => array(
			'title'    => 'SEO & Web Design in Jupiter, FL',
			'template' => '',
			'excerpt'  => mcg_page_terms()['home']['meta'],
			'content'  => '',
		),
		$s['seo'] => array(
			'title'    => 'SEO Company in Jupiter, FL',
			'template' => 'template-seo.php',
			'excerpt'  => mcg_page_terms()['seo']['meta'],
			'content'  => '',
		),
		$s['webdesign'] => array(
			'title'    => 'Web Design in Jupiter, FL',
			'template' => 'template-webdesign.php',
			'excerpt'  => mcg_page_terms()['webdesign']['meta'],
			'content'  => '',
		),
		$s['aeo'] => array(
			'title'    => 'AI Search Optimization',
			'template' => 'template-aeo.php',
			'excerpt'  => mcg_page_terms()['aeo']['meta'],
			'content'  => '',
		),
		$s['about'] => array(
			'title'    => 'About Tyler McGrath',
			'template' => 'template-about.php',
			'excerpt'  => mcg_page_terms()['about']['meta'],
			'content'  => '',
		),
		$s['contact'] => array(
			'title'    => 'Free SEO Audit',
			'template' => 'template-contact.php',
			'excerpt'  => mcg_page_terms()['contact']['meta'],
			'content'  => '',
		),
		$s['vault'] => array(
			'title'    => 'The Vault',
			'template' => 'template-vault.php',
			'excerpt'  => '',
			'content'  => '',
		),
		$s['blog'] => array(
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

			// The vault ships locked, with a password generated per install.
			// A fixed one would be published in the theme's source, which is
			// not a password at all. It is shown once in the setup notice.
			if ( mcg_slug( 'vault' ) === $slug ) {
				$pass = wp_generate_password( 12, false );
				wp_update_post( array( 'ID' => $id, 'post_password' => $pass ) );
				set_transient( 'mcg_vault_pass', $pass, DAY_IN_SECONDS );
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

	// Static front page and a separate posts page — but never over the top of a
	// site that already has them. front-page.php takes the front page either
	// way, static or posts index, and it renders nothing from the loop, so
	// repointing a live site's homepage buys nothing and orphans whatever was
	// there. Same for the posts page, where repointing would move the blog's
	// archive URL out from under existing links.
	if ( isset( $ids[ mcg_slug( 'home' ) ] ) && 'page' !== get_option( 'show_on_front' ) ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $ids[ mcg_slug( 'home' ) ] );
	}
	if ( isset( $ids[ mcg_slug( 'blog' ) ] ) && ! get_option( 'page_for_posts' ) ) {
		update_option( 'page_for_posts', $ids[ mcg_slug( 'blog' ) ] );
	}

	// Primary menu, built once.
	$menu_name = 'Primary';
	$menu      = wp_get_nav_menu_object( $menu_name );

	if ( ! $menu ) {
		$menu_id = wp_create_nav_menu( $menu_name );

		if ( ! is_wp_error( $menu_id ) ) {
			$slugs   = mcg_slugs();
			$labels  = mcg_nav_labels();
			$in_menu = array();

			foreach ( array( 'seo', 'webdesign', 'aeo', 'about', 'contact' ) as $key ) {
				$in_menu[ $slugs[ $key ] ] = $labels[ $slugs[ $key ] ];
			}

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
		<p><strong>McGrath Chrome is set up.</strong> Any of these pages that did not already exist have
		been created and assigned a template: home, SEO, Web Design, AI Visibility, About, Contact,
		The Vault and the blog. An existing front page or posts page is left exactly as it was.</p>
		<?php $mcg_pass = get_transient( 'mcg_vault_pass' ); ?>
		<?php if ( $mcg_pass ) : ?>
			<?php delete_transient( 'mcg_vault_pass' ); ?>
			<p>The Vault is password protected with <code><?php echo esc_html( $mcg_pass ); ?></code> —
			<strong>this is shown once</strong>. Change it, or write it down, in the page editor under
			Summary &rarr; Visibility.</p>
		<?php endif; ?>
		<p>Next: check <em>Settings &rarr; Reading</em>, assign your menu under <em>Appearance &rarr; Menus</em>,
		and fill in <em>Appearance &rarr; Customize &rarr; Homepage &amp; brand</em>.</p>
	</div>
	<?php
}
add_action( 'admin_notices', 'mcg_activated_notice' );

/**
 * If the theme was activated before this routine existed, the activation hook
 * will never fire again. This offers a one-click rerun from the admin.
 */
function mcg_setup_is_done() {
	$s = mcg_slugs();

	foreach ( array( $s['seo'], $s['webdesign'], $s['contact'] ) as $slug ) {
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
