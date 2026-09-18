<?php
/**
 * The booking assistant.
 *
 * A chat widget that answers questions from this site's own content and, when
 * it cannot, hands the visitor to WhatsApp with their question already typed.
 *
 * It is a matcher over a knowledge base built from the FAQs, the category copy
 * and the live experience data — not a language model. That is deliberate: it
 * needs no API key, costs nothing per conversation, works with the site
 * offline, and — most importantly — it can only ever say things that are
 * already written on this site, so it cannot invent a price or promise a
 * departure time that does not exist.
 *
 * `pt_assistant_endpoint` is the seam for a real model later: return a URL and
 * the widget posts the question there first, falling back to the local matcher
 * if the request fails.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Whether the assistant should render.
 *
 * @return bool
 */
function pt_assistant_enabled() {
	return (bool) apply_filters( 'pt_assistant_enabled', get_theme_mod( 'pt_assistant_on', true ) );
}

/**
 * Every experience, as the assistant needs to talk about it.
 *
 * @return array<int, array<string, mixed>>
 */
function pt_assistant_experiences() {
	$posts = get_posts(
		array(
			'post_type'      => PT_EXPERIENCE_POST_TYPE,
			'posts_per_page' => 40,
			'orderby'        => array(
				'menu_order' => 'ASC',
				'title'      => 'ASC',
			),
		)
	);

	$items = array();

	foreach ( $posts as $post ) {
		$terms  = get_the_terms( $post->ID, 'experience_type' );
		$levels = get_the_terms( $post->ID, 'skill_level' );
		$price  = pt_field( $post->ID, 'price_from' );

		$items[] = array(
			'title'    => get_the_title( $post ),
			'url'      => get_permalink( $post ),
			'excerpt'  => wp_strip_all_tags( get_the_excerpt( $post ) ),
			'duration' => pt_field( $post->ID, 'duration' ),
			'group'    => pt_field( $post->ID, 'group_size' ),
			// Empty stays empty. The assistant must never guess a price.
			'price'    => $price ? $price : '',
			'category' => ( $terms && ! is_wp_error( $terms ) ) ? $terms[0]->name : '',
			'level'    => ( $levels && ! is_wp_error( $levels ) ) ? $levels[0]->name : '',
		);
	}

	return $items;
}

/**
 * The question and answer pairs the assistant can draw on.
 *
 * @return array<int, array<string, mixed>>
 */
function pt_assistant_faq() {
	$entries = array();

	foreach ( pt_about_faq() as $pair ) {
		$entries[] = array(
			'q' => $pair[0],
			'a' => $pair[1],
		);
	}

	// Category FAQs, each tagged with a link to the category it belongs to.
	foreach ( pt_term_copy_map() as $slug => $copy ) {
		if ( empty( $copy['faq'] ) ) {
			continue;
		}

		$term = get_term_by( 'slug', $slug, 'experience_type' );
		$link = $term instanceof WP_Term ? get_term_link( $term ) : '';
		$link = ( $link && ! is_wp_error( $link ) ) ? $link : '';

		foreach ( $copy['faq'] as $pair ) {
			$entries[] = array(
				'q'    => $pair[0],
				'a'    => $pair[1],
				'url'  => $link,
				'tag'  => $term instanceof WP_Term ? $term->name : '',
			);
		}
	}

	return $entries;
}

/**
 * Everything the widget needs, in one payload.
 *
 * @return array<string, mixed>
 */
function pt_assistant_data() {
	$contact = get_page_by_path( 'contact' );

	return array(
		'greeting'    => pt_filled( 'pt_assistant_greeting' )
			? pt_filled( 'pt_assistant_greeting' )
			: __( 'Hi! Ask me anything about surfing, fishing or getting out on the water here — or I can put you straight through to a person.', 'palmtreesurf' ),
		'whatsapp'    => pt_whatsapp_url(),
		'bookingUrl'  => get_post_type_archive_link( PT_EXPERIENCE_POST_TYPE ),
		'contactUrl'  => $contact ? get_permalink( $contact ) : '',
		'endpoint'    => (string) apply_filters( 'pt_assistant_endpoint', '' ),
		'experiences' => pt_assistant_experiences(),
		'faq'         => pt_assistant_faq(),
		'chips'       => array(
			__( 'I have never surfed', 'palmtreesurf' ),
			__( 'What can I do with kids?', 'palmtreesurf' ),
			__( 'Best time to visit', 'palmtreesurf' ),
			__( 'What should I bring?', 'palmtreesurf' ),
			__( 'Show me everything', 'palmtreesurf' ),
		),
		'strings'     => array(
			'title'       => __( 'Ask us anything', 'palmtreesurf' ),
			'subtitle'    => __( 'Answers from this site, or a real person on WhatsApp', 'palmtreesurf' ),
			'open'        => __( 'Open the booking assistant', 'palmtreesurf' ),
			'close'       => __( 'Close', 'palmtreesurf' ),
			'placeholder' => __( 'Type your question…', 'palmtreesurf' ),
			'send'        => __( 'Send', 'palmtreesurf' ),
			'you'         => __( 'You', 'palmtreesurf' ),
			'book'        => __( 'Book this', 'palmtreesurf' ),
			'seeAll'      => __( 'See all experiences', 'palmtreesurf' ),
			'readMore'    => __( 'Read more', 'palmtreesurf' ),
			'whatsapp'    => __( 'Ask on WhatsApp', 'palmtreesurf' ),
			'noAnswer'    => __( 'I do not have that one written down. A person can answer it properly — shall I pass it on?', 'palmtreesurf' ),
			'notice'      => __( 'Answers come from this site. For prices, availability and anything specific, message us.', 'palmtreesurf' ),
			'from'        => __( 'From $%s', 'palmtreesurf' ),
		),
	);
}

/**
 * Print the widget.
 */
function pt_render_assistant() {
	if ( ! pt_assistant_enabled() || is_admin() ) {
		return;
	}

	$data = pt_assistant_data();

	// With no WhatsApp number and no booking archive there is nothing to hand
	// off to, so the widget would be a dead end.
	if ( ! $data['whatsapp'] && ! $data['bookingUrl'] ) {
		return;
	}
	?>
	<div class="assistant" data-assistant>
		<button class="assistant__launcher" type="button" data-assistant-toggle aria-expanded="false" aria-controls="pt-assistant-panel">
			<span class="assistant__launcher-icon" aria-hidden="true">
				<?php echo pt_get_icon( 'chat', '', 24 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static SVG. ?>
			</span>
			<span class="assistant__launcher-label"><?php echo esc_html( $data['strings']['title'] ); ?></span>
		</button>

		<div class="assistant__panel" id="pt-assistant-panel" role="dialog" aria-modal="false" aria-label="<?php echo esc_attr( $data['strings']['title'] ); ?>" hidden>
			<header class="assistant__head">
				<div>
					<p class="assistant__title"><?php echo esc_html( $data['strings']['title'] ); ?></p>
					<p class="assistant__subtitle"><?php echo esc_html( $data['strings']['subtitle'] ); ?></p>
				</div>
				<button class="assistant__close" type="button" data-assistant-close aria-label="<?php echo esc_attr( $data['strings']['close'] ); ?>">&times;</button>
			</header>

			<div class="assistant__log" data-assistant-log role="log" aria-live="polite" aria-atomic="false"></div>

			<div class="assistant__chips" data-assistant-chips></div>

			<form class="assistant__form" data-assistant-form>
				<label class="screen-reader-text" for="pt-assistant-input"><?php echo esc_html( $data['strings']['placeholder'] ); ?></label>
				<input
					class="assistant__input"
					id="pt-assistant-input"
					type="text"
					autocomplete="off"
					placeholder="<?php echo esc_attr( $data['strings']['placeholder'] ); ?>"
					data-assistant-input
				/>
				<button class="assistant__send" type="submit"><?php echo esc_html( $data['strings']['send'] ); ?></button>
			</form>

			<p class="assistant__notice"><?php echo esc_html( $data['strings']['notice'] ); ?></p>
		</div>
	</div>
	<?php
}
add_action( 'wp_footer', 'pt_render_assistant', 5 );
