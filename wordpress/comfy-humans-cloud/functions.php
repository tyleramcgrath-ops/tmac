<?php
/**
 * Comfy Humans Cloud theme setup.
 *
 * @package comfy-humans-cloud
 */

defined( 'ABSPATH' ) || exit;

define( 'CHC_VERSION', '1.0.0' );

/**
 * Theme supports, menus and WooCommerce.
 */
function chc_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'custom-logo', array( 'height' => 60, 'width' => 240, 'flex-height' => true, 'flex-width' => true ) );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'woocommerce' );
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );

	register_nav_menus(
		array(
			'primary' => __( 'Top menu', 'comfy-humans-cloud' ),
			'footer'  => __( 'Footer menu', 'comfy-humans-cloud' ),
		)
	);
}
add_action( 'after_setup_theme', 'chc_setup' );

/**
 * Fonts, styles and scripts.
 */
function chc_assets() {
	wp_enqueue_style( 'chc-fonts', 'https://fonts.googleapis.com/css2?family=Sniglet:wght@400;800&family=Figtree:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap', array(), null );
	wp_enqueue_style( 'chc-main', get_template_directory_uri() . '/assets/css/main.css', array( 'chc-fonts' ), CHC_VERSION );
	wp_enqueue_style( 'chc-site', get_template_directory_uri() . '/assets/css/site.css', array( 'chc-main' ), CHC_VERSION );
	wp_enqueue_script( 'chc-comfy', get_template_directory_uri() . '/assets/js/comfy.js', array(), CHC_VERSION, true );
}
add_action( 'wp_enqueue_scripts', 'chc_assets' );

/**
 * Preconnect to Google Fonts so the headline face arrives quickly.
 */
function chc_resource_hints( $urls, $relation ) {
	if ( 'preconnect' === $relation ) {
		$urls[] = 'https://fonts.googleapis.com';
		$urls[] = array( 'href' => 'https://fonts.gstatic.com', 'crossorigin' );
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'chc_resource_hints', 10, 2 );

/**
 * WooCommerce: the theme draws its own wrappers and sidebar-free layout.
 */
remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );
remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );
add_filter( 'loop_shop_columns', function () { return 3; } );

/**
 * Number of items in the bag, for the header button.
 */
function chc_bag_count() {
	if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
		return 0;
	}
	return (int) WC()->cart->get_cart_contents_count();
}

/**
 * Keep the header bag count live after "Add to bag" without a page reload.
 */
function chc_bag_fragment( $fragments ) {
	$fragments['b.chc-bag-count'] = '<b class="chc-bag-count">' . esc_html( chc_bag_count() ) . '</b>';
	return $fragments;
}
add_filter( 'woocommerce_add_to_cart_fragments', 'chc_bag_fragment' );

/**
 * "Add to bag" instead of "Add to cart".
 */
function chc_add_to_bag_text() {
	return __( 'Add to bag', 'comfy-humans-cloud' );
}
add_filter( 'woocommerce_product_add_to_cart_text', 'chc_add_to_bag_text' );
add_filter( 'woocommerce_product_single_add_to_cart_text', 'chc_add_to_bag_text' );

/**
 * Customizer: everything on the home page that is a claim about the business
 * is editable, so the owner can say only what is true for their products.
 */
function chc_defaults() {
	return array(
		'hero_eyebrow' => 'Comfort forecast: Sunday, all week',
		'hero_title'   => 'The *comfiest* corner of the **internet.**',
		'hero_lede'    => 'Ridiculously soft stuff for humans who need a break from being human. Slow down, sink in, stay a little longer.',
		'why_title'    => "Why we're the comfiest site on the internet.",
		'why_lede'     => "Shopping for comfort shouldn't stress you out. So this little corner of the internet stays calm, soft and quiet, from the first click to the last.",
		'reasons'      => array(
			array( 'label' => 'Pop-ups on this site', 'stat' => '0', 'unit' => 'pop-ups', 'title' => 'Nothing jumps out at you', 'text' => 'No window asking for your email five seconds after you arrive. Browse in peace.' ),
			array( 'label' => 'Stress on this site', 'stat' => '0', 'unit' => 'timers', 'title' => 'No panic shopping', 'text' => 'No countdown clocks and no "only 2 left!" Take your time. Comfort will wait for you.' ),
			array( 'label' => 'Our one job', 'stat' => 'Soft', 'unit' => 'first', 'title' => 'Picked for softness', 'text' => 'Everything here is chosen for one thing: helping you slow down and get comfy.' ),
			array( 'label' => '', 'stat' => '', 'unit' => '', 'title' => '', 'text' => '' ),
			array( 'label' => '', 'stat' => '', 'unit' => '', 'title' => '', 'text' => '' ),
			array( 'label' => '', 'stat' => '', 'unit' => '', 'title' => '', 'text' => '' ),
		),
		'moods'        => array(
			array( 'label' => 'Mentally in bed', 'slug' => 'mentally-in-bed' ),
			array( 'label' => 'A little squishy', 'slug' => 'a-little-squishy' ),
			array( 'label' => 'Maximum potato', 'slug' => 'maximum-potato' ),
		),
		'letter_title' => 'Being human is a lot. Get comfy.',
		'letter_text'  => 'Join the Sunday Letter: one slow, soft email a week with new arrivals and nap rituals.',
	);
}

/**
 * Read a theme setting, falling back to the default.
 */
function chc_mod( $key ) {
	$d = chc_defaults();
	return get_theme_mod( 'chc_' . $key, isset( $d[ $key ] ) ? $d[ $key ] : '' );
}

/**
 * The "why we're comfy" reasons, with empty ones left out.
 */
function chc_reasons() {
	$d   = chc_defaults();
	$out = array();
	foreach ( $d['reasons'] as $i => $r ) {
		$item = array();
		foreach ( $r as $field => $default ) {
			$item[ $field ] = get_theme_mod( "chc_reason_{$i}_{$field}", $default );
		}
		if ( '' !== trim( $item['title'] ) ) {
			$out[] = $item;
		}
	}
	return $out;
}

/**
 * Register Customizer settings.
 */
function chc_customize( $wp_customize ) {
	$d = chc_defaults();

	$wp_customize->add_panel( 'chc_home', array( 'title' => __( 'Comfy home page', 'comfy-humans-cloud' ), 'priority' => 30 ) );

	$text = function ( $section, $key, $label, $type = 'text', $default = null ) use ( $wp_customize, $d ) {
		$wp_customize->add_setting( 'chc_' . $key, array( 'default' => null === $default ? $d[ $key ] : $default, 'sanitize_callback' => 'textarea' === $type ? 'sanitize_textarea_field' : 'sanitize_text_field' ) );
		$wp_customize->add_control( 'chc_' . $key, array( 'label' => $label, 'section' => $section, 'type' => $type ) );
	};

	$wp_customize->add_section( 'chc_hero', array( 'title' => __( 'Top of the page', 'comfy-humans-cloud' ), 'panel' => 'chc_home' ) );
	$text( 'chc_hero', 'hero_eyebrow', __( 'Small line above the headline', 'comfy-humans-cloud' ) );
	$text( 'chc_hero', 'hero_title', __( 'Headline (put *stars* around words to make them puffy white, **double stars** for puffy coral)', 'comfy-humans-cloud' ) );
	$text( 'chc_hero', 'hero_lede', __( 'Intro sentence', 'comfy-humans-cloud' ), 'textarea' );
	$wp_customize->add_setting( 'chc_hero_image', array( 'default' => '', 'sanitize_callback' => 'absint' ) );
	$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, 'chc_hero_image', array( 'label' => __( 'Hero picture (leave empty for the cloud mascot)', 'comfy-humans-cloud' ), 'section' => 'chc_hero', 'mime_type' => 'image' ) ) );

	$wp_customize->add_section( 'chc_why', array( 'title' => __( 'Why we are the comfiest', 'comfy-humans-cloud' ), 'panel' => 'chc_home', 'description' => __( 'Only list things that are true for your shop. Leave a reason title empty to hide it.', 'comfy-humans-cloud' ) ) );
	$text( 'chc_why', 'why_title', __( 'Section headline', 'comfy-humans-cloud' ) );
	$text( 'chc_why', 'why_lede', __( 'Section intro', 'comfy-humans-cloud' ), 'textarea' );
	foreach ( $d['reasons'] as $i => $r ) {
		$n = $i + 1;
		foreach ( array( 'label' => 'small label', 'stat' => 'big number or word', 'unit' => 'unit after the number', 'title' => 'title', 'text' => 'text' ) as $field => $what ) {
			$text( 'chc_why', "reason_{$i}_{$field}", sprintf( 'Reason %d: %s', $n, $what ), 'text' === $field ? 'textarea' : 'text', $r[ $field ] );
		}
	}

	$wp_customize->add_section( 'chc_moods', array( 'title' => __( 'Pick your current cloud', 'comfy-humans-cloud' ), 'panel' => 'chc_home', 'description' => __( 'Each mood shows products from the product category with this slug. Leave a label empty to hide that mood.', 'comfy-humans-cloud' ) ) );
	foreach ( $d['moods'] as $i => $m ) {
		$n = $i + 1;
		$text( 'chc_moods', "mood_{$i}_label", sprintf( 'Mood %d: button label', $n ), 'text', $m['label'] );
		$text( 'chc_moods', "mood_{$i}_slug", sprintf( 'Mood %d: product category slug', $n ), 'text', $m['slug'] );
	}

	$wp_customize->add_section( 'chc_letter', array( 'title' => __( 'Closing and newsletter', 'comfy-humans-cloud' ), 'panel' => 'chc_home' ) );
	$text( 'chc_letter', 'letter_title', __( 'Closing headline', 'comfy-humans-cloud' ) );
	$text( 'chc_letter', 'letter_text', __( 'Closing text', 'comfy-humans-cloud' ), 'textarea' );
	$wp_customize->add_setting( 'chc_letter_shortcode', array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ) );
	$wp_customize->add_control( 'chc_letter_shortcode', array( 'label' => __( 'Newsletter form shortcode (for example from MailPoet or Mailchimp). Leave empty to show a shop button instead.', 'comfy-humans-cloud' ), 'section' => 'chc_letter', 'type' => 'text' ) );
}
add_action( 'customize_register', 'chc_customize' );

/**
 * The moods that have a label, with their category slug.
 */
function chc_moods() {
	$d   = chc_defaults();
	$out = array();
	foreach ( $d['moods'] as $i => $m ) {
		$label = trim( get_theme_mod( "chc_mood_{$i}_label", $m['label'] ) );
		$slug  = sanitize_title( get_theme_mod( "chc_mood_{$i}_slug", $m['slug'] ) );
		if ( '' !== $label ) {
			$out[] = array( 'label' => $label, 'slug' => $slug );
		}
	}
	return $out;
}

/**
 * Hero picture URL: the owner's upload, or the bundled cloud mascot.
 */
function chc_hero_image() {
	$id = (int) get_theme_mod( 'chc_hero_image', 0 );
	if ( $id ) {
		$src = wp_get_attachment_image_url( $id, 'large' );
		if ( $src ) {
			return array( $src, get_post_meta( $id, '_wp_attachment_image_alt', true ) );
		}
	}
	return array( get_template_directory_uri() . '/assets/img/mascot.jpg', __( 'The Comfy Humans mascot, smiling with eyes closed, wrapped in a lilac fleece hoodie and a giant yellow knit blanket on a cloud', 'comfy-humans-cloud' ) );
}

/**
 * Small cloud icon used in the logo and pills.
 */
function chc_cloud_svg( $fill = '#ef5f4b', $w = 34, $h = 22 ) {
	return '<svg viewBox="0 0 34 22" width="' . (int) $w . '" height="' . (int) $h . '" aria-hidden="true"><path d="M8 21a7 7 0 0 1-.9-13.9A9 9 0 0 1 24.4 5 6.5 6.5 0 1 1 27 21Z" fill="' . esc_attr( $fill ) . '"/></svg>';
}

/**
 * Fallback top menu when none is assigned.
 */
function chc_menu_fallback() {
	$shop = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'shop' ) : home_url( '/' );
	echo '<ul><li><a href="' . esc_url( $shop ) . '">' . esc_html__( 'Shop the fluff', 'comfy-humans-cloud' ) . '</a></li>';
	echo '<li><a href="' . esc_url( home_url( '/#why' ) ) . '">' . esc_html__( 'Why so comfy?', 'comfy-humans-cloud' ) . '</a></li>';
	echo '<li><a href="' . esc_url( home_url( '/#letter' ) ) . '">' . esc_html__( 'The Sunday Letter', 'comfy-humans-cloud' ) . '</a></li></ul>';
}

/**
 * One product card in the home page style.
 */
function chc_product_card( $product, $moods = array() ) {
	$colors = array( 'linear-gradient(140deg,#d9ccff,#b9a5ff)', 'linear-gradient(140deg,#ffe49a,#ffc95a)', 'linear-gradient(140deg,#cfe7ff,#9ccaff)', 'linear-gradient(140deg,#ffd0dc,#ffa8bf)', 'linear-gradient(140deg,#c9f1de,#97ddbd)', 'linear-gradient(140deg,#ffd9c2,#ffb48c)' );
	$id     = $product->get_id();
	$color  = $colors[ $id % count( $colors ) ];
	$cats   = wp_get_post_terms( $id, 'product_cat', array( 'fields' => 'slugs' ) );
	$in     = array();
	foreach ( $moods as $m ) {
		if ( in_array( $m['slug'], (array) $cats, true ) ) {
			$in[] = $m['slug'];
		}
	}
	$tag = $product->is_on_sale() ? __( 'On sale', 'comfy-humans-cloud' ) : ( $product->is_featured() ? __( 'Bestseller', 'comfy-humans-cloud' ) : '' );
	?>
	<article class="product" data-moods="<?php echo esc_attr( implode( ' ', $in ) ); ?>">
		<a class="swatch" href="<?php echo esc_url( $product->get_permalink() ); ?>" style="background:<?php echo esc_attr( $color ); ?>">
			<?php if ( $product->get_image_id() ) : ?>
				<?php echo wp_get_attachment_image( $product->get_image_id(), 'woocommerce_thumbnail', false, array( 'class' => 'swatch-img' ) ); ?>
			<?php else : ?>
				<span class="shape"></span>
			<?php endif; ?>
			<?php if ( $tag ) : ?><span class="label"><?php echo esc_html( $tag ); ?></span><?php endif; ?>
		</a>
		<div class="product-info">
			<div><h3><a href="<?php echo esc_url( $product->get_permalink() ); ?>"><?php echo esc_html( $product->get_name() ); ?></a></h3>
			<p><?php echo esc_html( wp_trim_words( wp_strip_all_tags( $product->get_short_description() ), 8 ) ); ?></p></div>
			<span class="price"><?php echo wp_kses_post( $product->get_price_html() ); ?></span>
		</div>
		<?php
		$GLOBALS['product'] = $product; // The loop button template reads the global product.
		woocommerce_template_loop_add_to_cart(
			array(
				'class' => implode( ' ', array_filter( array( 'add', 'button', 'product_type_' . $product->get_type(), $product->is_purchasable() && $product->is_in_stock() ? 'add_to_cart_button' : '', $product->supports( 'ajax_add_to_cart' ) && $product->is_purchasable() && $product->is_in_stock() ? 'ajax_add_to_cart' : '' ) ) ),
			)
		);
		?>
	</article>
	<?php
}
