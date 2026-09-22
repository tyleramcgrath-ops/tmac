<?php
/**
 * English and Spanish, without requiring a multilingual plugin.
 *
 * Polylang and WPML are the right answer for a large multilingual site, and if
 * either is active this file gets out of the way entirely and the switcher
 * defers to them. For a site this size they are a lot of machinery, so the
 * theme ships a working bilingual mode of its own:
 *
 * - Theme interface strings come from the bundled Spanish translation.
 * - Page, post and experience content comes from Spanish fields on each edit
 *   screen, so the client writes translations where they write everything else.
 * - Customizer text has an optional Spanish companion value.
 * - `?lang=es` selects it, with hreflang so search engines index both.
 *
 * Nothing is machine-translated. A page with no Spanish written for it serves
 * the English, which is honest and is better than half a translation.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

/**
 * Whether a multilingual plugin is handling this already.
 *
 * @return bool
 */
function pt_multilingual_plugin_active() {
	return function_exists( 'pll_the_languages' ) || function_exists( 'icl_get_languages' );
}

/**
 * The languages the theme's own bilingual mode offers.
 *
 * @return array<string, array<string, string>>
 */
function pt_languages() {
	return array(
		'en' => array(
			'label'  => __( 'English', 'palmtreesurf' ),
			'short'  => 'EN',
			'locale' => 'en_US',
			'hrefl'  => 'en',
		),
		'es' => array(
			'label'  => __( 'Español', 'palmtreesurf' ),
			'short'  => 'ES',
			'locale' => 'es_CR',
			'hrefl'  => 'es',
		),
	);
}

/**
 * Whether the theme's own bilingual mode is switched on.
 *
 * Off by default: a toggle that flips an untranslated site is worse than no
 * toggle. The client turns it on in the Customizer once they have written some
 * Spanish.
 *
 * @return bool
 */
function pt_bilingual_enabled() {
	return ! empty( $GLOBALS['pt_bilingual'] );
}

/**
 * Work out the language once, early, and cache it.
 *
 * This runs on `after_setup_theme` before the text domain is loaded and long
 * before anything renders, so the `locale` filter below never has to touch the
 * database. That matters: deciding the language needs a theme mod, theme mods
 * are an option read, and option reads can load translations and ask for the
 * locale again. Doing the lookup inside the filter recurses until PHP's stack
 * gives out, which is exactly what happened before this was split out.
 */
function pt_prime_language() {
	$GLOBALS['pt_bilingual'] = pt_multilingual_plugin_active()
		? false
		: (bool) get_theme_mod( 'pt_enable_spanish', false );

	$lang = 'en';

	if ( $GLOBALS['pt_bilingual'] ) {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Read-only display preference.
		if ( isset( $_GET['lang'] ) ) {
			$requested = sanitize_key( wp_unslash( $_GET['lang'] ) );

			if ( in_array( $requested, array( 'en', 'es' ), true ) ) {
				$lang = $requested;
			}
		} elseif ( isset( $_COOKIE['pt_lang'] ) ) {
			$stored = sanitize_key( wp_unslash( $_COOKIE['pt_lang'] ) );

			if ( in_array( $stored, array( 'en', 'es' ), true ) ) {
				$lang = $stored;
			}
		}
		// phpcs:enable
	}

	$GLOBALS['pt_language'] = $lang;
}
add_action( 'after_setup_theme', 'pt_prime_language', 1 );

/**
 * The language for this request.
 *
 * @return string 'en' or 'es'.
 */
function pt_current_language() {
	return isset( $GLOBALS['pt_language'] ) ? $GLOBALS['pt_language'] : 'en';
}

/**
 * Remember the choice, so the visitor is not re-choosing on every page.
 */
function pt_remember_language() {
	if ( is_admin() || ! pt_bilingual_enabled() ) {
		return;
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only display preference.
	if ( ! isset( $_GET['lang'] ) || headers_sent() ) {
		return;
	}

	$lang = pt_current_language();
	$path = COOKIEPATH ? COOKIEPATH : '/';

	/*
	 * English is the site's default, so it is remembered by clearing the cookie
	 * rather than storing "en", and the visitor is sent to the clean URL. That
	 * keeps the English page canonical and query-string free, which is what the
	 * hreflang tags point at.
	 */
	if ( 'en' === $lang ) {
		setcookie( 'pt_lang', '', time() - YEAR_IN_SECONDS, $path, COOKIE_DOMAIN, is_ssl(), true );
		unset( $_COOKIE['pt_lang'] );

		wp_safe_redirect( remove_query_arg( 'lang' ) );
		exit;
	}

	setcookie( 'pt_lang', $lang, time() + MONTH_IN_SECONDS, $path, COOKIE_DOMAIN, is_ssl(), true );
}
add_action( 'template_redirect', 'pt_remember_language', 1 );

/**
 * Serve the Spanish translation of the theme's own strings.
 *
 * Safe as a `locale` filter only because pt_prime_language() has already done
 * the database work — see the note there.
 *
 * @param string $locale Current locale.
 * @return string
 */
function pt_filter_locale( $locale ) {
	if ( is_admin() || ! pt_bilingual_enabled() ) {
		return $locale;
	}

	/*
	 * Nothing translatable may be touched in here. pt_languages() labels its
	 * entries with __(), and calling __() inside the `locale` filter triggers
	 * just-in-time text domain loading, which asks for the locale again and
	 * recurses until the stack gives out. Hence the bare map.
	 */
	$locales = array(
		'en' => 'en_US',
		'es' => 'es_CR',
	);

	$lang = pt_current_language();

	return isset( $locales[ $lang ] ) ? $locales[ $lang ] : $locale;
}
add_filter( 'locale', 'pt_filter_locale' );

/**
 * Add `lang=es` to a URL when Spanish is active.
 *
 * @param string $url URL to localise.
 * @return string
 */
function pt_localize_url( $url ) {
	if ( ! pt_bilingual_enabled() || 'es' !== pt_current_language() ) {
		return $url;
	}

	return add_query_arg( 'lang', 'es', $url );
}

/**
 * The Spanish companion for a Customizer value, when one has been written.
 *
 * `pt_mod( 'pt_hero_heading' )` returns the Spanish heading automatically once
 * `pt_hero_heading_es` is filled in, so no template needs to know about this.
 *
 * @param string $value Value so far.
 * @param string $key   Theme mod name.
 * @return string
 */
function pt_mod_spanish( $value, $key ) {
	if ( ! pt_bilingual_enabled() || 'es' !== pt_current_language() ) {
		return $value;
	}

	if ( '_es' === substr( $key, -3 ) ) {
		return $value;
	}

	$spanish = (string) get_theme_mod( $key . '_es', '' );

	if ( '' !== trim( $spanish ) ) {
		return $spanish;
	}

	// No Spanish entered for this setting, so fall back to the catalogue, which
	// knows the values the theme ships as defaults.
	return pt_translate_seeded( $value );
}
add_filter( 'pt_mod_value', 'pt_mod_spanish', 10, 2 );

/**
 * The post types that can carry a Spanish translation.
 *
 * @return array<int, string>
 */
function pt_translatable_post_types() {
	return apply_filters(
		'pt_translatable_post_types',
		array( 'page', 'post', PT_EXPERIENCE_POST_TYPE )
	);
}

/**
 * Translate a value that the seeder wrote into the database in English.
 *
 * Seeded content — an experience's inclusions, its itinerary, its FAQ — is
 * stored as plain post meta, so the locale filter never touches it and it
 * stayed English while the interface around it turned Spanish. Every one of
 * those lines was written as a `__()` string in the seed definitions, so the
 * catalogue already knows them: looking each line up at render time turns them
 * over without writing a second copy of anything into the database.
 *
 * Lines are looked up individually because these fields are one item per line.
 * A line the catalogue does not know — anything the client typed themselves —
 * comes back exactly as it went in, which is the behaviour we want: the theme
 * must never mangle words it was not given a translation for.
 *
 * @param string $value Stored value.
 * @return string
 */
function pt_translate_seeded( $value ) {
	if ( is_admin() || '' === $value || ! pt_bilingual_enabled() || 'es' !== pt_current_language() ) {
		return $value;
	}

	if ( false === strpos( $value, "\n" ) ) {
		return translate( $value, 'palmtreesurf' );
	}

	$lines = explode( "\n", $value );

	foreach ( $lines as $index => $line ) {
		$trimmed = trim( $line );

		if ( '' !== $trimmed ) {
			$lines[ $index ] = translate( $trimmed, 'palmtreesurf' );
		}
	}

	return implode( "\n", $lines );
}

/**
 * Translate seeded copy inside a block of HTML, one text run at a time.
 *
 * Page and experience bodies are stored as block markup assembled from many
 * separate `__()` paragraphs, so the body as a whole never matches a catalogue
 * entry even though every paragraph in it does. Looking up each text run
 * individually turns the whole page over without a second copy of the body
 * being written into the database.
 *
 * Anything the catalogue does not know is left exactly as it was, so a page the
 * client has written themselves passes through untouched.
 *
 * @param string $html Markup.
 * @return string
 */
function pt_translate_seeded_html( $html ) {
	if ( is_admin() || '' === $html || ! pt_bilingual_enabled() || 'es' !== pt_current_language() ) {
		return $html;
	}

	return (string) preg_replace_callback(
		'/>([^<>]+)</',
		function ( $matches ) {
			$raw     = $matches[1];
			$trimmed = trim( $raw );

			// Too short to be a sentence, or pure punctuation: leave it alone.
			if ( strlen( $trimmed ) < 3 ) {
				return $matches[0];
			}

			$translated = translate( $trimmed, 'palmtreesurf' );

			if ( $translated === $trimmed ) {
				return $matches[0];
			}

			return '>' . str_replace( $trimmed, $translated, $raw ) . '<';
		},
		$html
	);
}

/**
 * Lend the theme's Spanish catalogue to the booking plugin.
 *
 * The plugin ships no translations and is deliberately left untouched between
 * releases, so its form would stay English inside an otherwise Spanish page.
 * Rather than fork it, its strings are looked up in the theme's own catalogue
 * whenever the plugin has no translation of its own. If the plugin ever ships
 * Spanish, its translation arrives already resolved and this leaves it be.
 *
 * @param string $translated Translated text.
 * @param string $text       Original text.
 * @param string $domain     Text domain.
 * @return string
 */
function pt_lend_catalogue( $translated, $text, $domain ) {
	if ( 'palm-tree-bookings' !== $domain || $translated !== $text ) {
		return $translated;
	}

	if ( is_admin() || ! pt_bilingual_enabled() || 'es' !== pt_current_language() ) {
		return $translated;
	}

	return translate( $text, 'palmtreesurf' );
}
add_filter( 'gettext', 'pt_lend_catalogue', 10, 3 );

/**
 * Swap in the Spanish title when one exists.
 *
 * @param string   $title   Title.
 * @param int|null $post_id Post ID.
 * @return string
 */
function pt_translate_title( $title, $post_id = null ) {
	if ( is_admin() || ! pt_bilingual_enabled() || 'es' !== pt_current_language() || ! $post_id ) {
		return $title;
	}

	$spanish = get_post_meta( $post_id, 'pt_es_title', true );

	if ( '' !== trim( (string) $spanish ) ) {
		return $spanish;
	}

	// No hand-written translation, so try the catalogue — seeded titles are in it.
	return pt_translate_seeded( $title );
}
add_filter( 'the_title', 'pt_translate_title', 10, 2 );

/**
 * Swap in the Spanish body when one exists.
 *
 * @param string $content Content.
 * @return string
 */
function pt_translate_content( $content ) {
	if ( is_admin() || ! pt_bilingual_enabled() || 'es' !== pt_current_language() || ! in_the_loop() ) {
		return $content;
	}

	$spanish = get_post_meta( get_the_ID(), 'pt_es_content', true );

	if ( '' === trim( (string) $spanish ) ) {
		// No hand-written Spanish body, so translate the seeded copy in place.
		return pt_translate_seeded_html( $content );
	}

	return wpautop( wp_kses_post( $spanish ) );
}
add_filter( 'the_content', 'pt_translate_content', 8 );

/**
 * Swap in the Spanish excerpt when one exists.
 *
 * @param string  $excerpt Excerpt.
 * @param WP_Post $post    Post object.
 * @return string
 */
function pt_translate_excerpt( $excerpt, $post = null ) {
	if ( is_admin() || ! pt_bilingual_enabled() || 'es' !== pt_current_language() || ! $post ) {
		return $excerpt;
	}

	$spanish = get_post_meta( $post->ID, 'pt_es_excerpt', true );

	if ( '' !== trim( (string) $spanish ) ) {
		return $spanish;
	}

	return pt_translate_seeded( $excerpt );
}
add_filter( 'get_the_excerpt', 'pt_translate_excerpt', 10, 2 );

/**
 * hreflang tags, so both versions are indexed and neither is treated as
 * duplicate content.
 */
function pt_print_hreflang() {
	if ( ! pt_bilingual_enabled() || is_404() ) {
		return;
	}

	$base = pt_current_url();
	$base = remove_query_arg( 'lang', $base );

	printf( '<link rel="alternate" hreflang="en" href="%s" />' . "\n", esc_url( $base ) );
	printf( '<link rel="alternate" hreflang="es" href="%s" />' . "\n", esc_url( add_query_arg( 'lang', 'es', $base ) ) );
	printf( '<link rel="alternate" hreflang="x-default" href="%s" />' . "\n", esc_url( $base ) );
}
add_action( 'wp_head', 'pt_print_hreflang', 3 );

/**
 * Keep the html lang attribute honest.
 *
 * @param string $output Language attributes.
 * @return string
 */
function pt_language_attributes( $output ) {
	if ( ! pt_bilingual_enabled() || 'es' !== pt_current_language() ) {
		return $output;
	}

	return preg_replace( '/lang="[^"]*"/', 'lang="es"', $output );
}
add_filter( 'language_attributes', 'pt_language_attributes' );

/**
 * The Spanish translation box on an edit screen.
 */
function pt_add_translation_meta_box() {
	if ( ! pt_bilingual_enabled() ) {
		return;
	}

	foreach ( pt_translatable_post_types() as $type ) {
		add_meta_box(
			'pt-translation',
			__( 'Español', 'palmtreesurf' ),
			'pt_render_translation_meta_box',
			$type,
			'normal',
			'default'
		);
	}
}
add_action( 'add_meta_boxes', 'pt_add_translation_meta_box' );

/**
 * Render the Spanish fields.
 *
 * @param WP_Post $post Post being edited.
 */
function pt_render_translation_meta_box( $post ) {
	wp_nonce_field( 'pt_translation', 'pt_translation_nonce' );

	$title   = (string) get_post_meta( $post->ID, 'pt_es_title', true );
	$excerpt = (string) get_post_meta( $post->ID, 'pt_es_excerpt', true );
	$content = (string) get_post_meta( $post->ID, 'pt_es_content', true );
	?>
	<p class="description">
		<?php esc_html_e( 'Leave any field empty and Spanish visitors see the English version of it. Nothing here is machine-translated.', 'palmtreesurf' ); ?>
	</p>

	<p>
		<label for="pt-es-title"><strong><?php esc_html_e( 'Title in Spanish', 'palmtreesurf' ); ?></strong></label>
		<input type="text" id="pt-es-title" name="pt_es_title" class="widefat" value="<?php echo esc_attr( $title ); ?>" />
	</p>

	<p>
		<label for="pt-es-excerpt"><strong><?php esc_html_e( 'Short description in Spanish', 'palmtreesurf' ); ?></strong></label>
		<textarea id="pt-es-excerpt" name="pt_es_excerpt" class="widefat" rows="2"><?php echo esc_textarea( $excerpt ); ?></textarea>
	</p>

	<p>
		<label for="pt-es-content"><strong><?php esc_html_e( 'Body in Spanish', 'palmtreesurf' ); ?></strong></label>
		<textarea id="pt-es-content" name="pt_es_content" class="widefat" rows="14"><?php echo esc_textarea( $content ); ?></textarea>
		<span class="description">
			<?php esc_html_e( 'Plain paragraphs separated by a blank line. Basic HTML is allowed.', 'palmtreesurf' ); ?>
		</span>
	</p>
	<?php
}

/**
 * Save the Spanish fields.
 *
 * @param int     $post_id Post ID.
 * @param WP_Post $post    Post object.
 */
function pt_save_translation( $post_id, $post ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( ! in_array( $post->post_type, pt_translatable_post_types(), true ) ) {
		return;
	}

	$nonce = isset( $_POST['pt_translation_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['pt_translation_nonce'] ) ) : '';

	if ( ! wp_verify_nonce( $nonce, 'pt_translation' ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$fields = array(
		'pt_es_title'   => 'sanitize_text_field',
		'pt_es_excerpt' => 'sanitize_textarea_field',
		'pt_es_content' => 'wp_kses_post',
	);

	foreach ( $fields as $key => $sanitizer ) {
		$value = isset( $_POST[ $key ] ) ? call_user_func( $sanitizer, wp_unslash( $_POST[ $key ] ) ) : '';

		if ( '' === trim( $value ) ) {
			delete_post_meta( $post_id, $key );
		} else {
			update_post_meta( $post_id, $key, $value );
		}
	}
}
add_action( 'save_post', 'pt_save_translation', 10, 2 );

/**
 * Show which content already has a Spanish version.
 *
 * @param array<string, string> $columns Columns.
 * @return array<string, string>
 */
function pt_translation_column( $columns ) {
	if ( pt_bilingual_enabled() ) {
		$columns['pt_es'] = __( 'ES', 'palmtreesurf' );
	}

	return $columns;
}

/**
 * Fill the translation column.
 *
 * @param string $column  Column key.
 * @param int    $post_id Post ID.
 */
function pt_translation_column_value( $column, $post_id ) {
	if ( 'pt_es' !== $column ) {
		return;
	}

	$has = get_post_meta( $post_id, 'pt_es_content', true ) || get_post_meta( $post_id, 'pt_es_title', true );

	echo $has
		? '<span title="' . esc_attr__( 'Spanish version written', 'palmtreesurf' ) . '">&#10003;</span>'
		: '<span style="color:#a7aaad" title="' . esc_attr__( 'No Spanish version yet', 'palmtreesurf' ) . '">&mdash;</span>';
}

/**
 * Hook the column onto every translatable type.
 */
function pt_translation_columns() {
	foreach ( pt_translatable_post_types() as $type ) {
		$screen = 'page' === $type ? 'pages' : 'posts';
		add_filter( "manage_{$type}_{$screen}_columns", 'pt_translation_column' );
		add_action( "manage_{$type}_{$screen}_custom_column", 'pt_translation_column_value', 10, 2 );
	}
}
add_action( 'admin_init', 'pt_translation_columns' );

/**
 * The theme's own EN/ES toggle.
 *
 * Returns false when it did not render, so the switcher can fall through to a
 * plugin's own control.
 *
 * @return bool
 */
function pt_render_language_toggle() {
	if ( ! pt_bilingual_enabled() ) {
		return false;
	}

	$current = pt_current_language();
	$base    = remove_query_arg( 'lang', pt_current_url() );

	echo '<div class="lang-switch" role="group" aria-label="' . esc_attr__( 'Language', 'palmtreesurf' ) . '">';

	foreach ( pt_languages() as $code => $language ) {
		/*
		 * Both links carry ?lang=. Linking English to the bare URL looks
		 * tidier and does not work: with no parameter the request falls
		 * through to the stored preference, which is still Spanish, so the
		 * toggle could switch to Spanish and never switch back. The redirect
		 * in pt_remember_language() strips the parameter again afterwards.
		 */
		$url = add_query_arg( 'lang', $code, $base );

		printf(
			'<a class="lang-switch__item%1$s" href="%2$s" hreflang="%3$s" lang="%3$s"%4$s><span class="screen-reader-text">%5$s</span><span aria-hidden="true">%6$s</span></a>',
			$code === $current ? ' is-current' : '',
			esc_url( $url ),
			esc_attr( $language['hrefl'] ),
			$code === $current ? ' aria-current="true"' : '',
			esc_html( $language['label'] ),
			esc_html( $language['short'] )
		);
	}

	echo '</div>';

	return true;
}

/**
 * Use a page's Spanish title in the navigation menus.
 *
 * Menu items store their own label, so translating the page title is not
 * enough — the menu keeps showing the English one until this runs.
 *
 * @param string   $title Menu item label.
 * @param WP_Post  $item  Menu item.
 * @return string
 */
function pt_translate_menu_title( $title, $item ) {
	if ( is_admin() || ! pt_bilingual_enabled() || 'es' !== pt_current_language() ) {
		return $title;
	}

	if ( ! isset( $item->object_id ) ) {
		return $title;
	}

	if ( isset( $item->type ) && 'taxonomy' === $item->type ) {
		return pt_term_name_es( (int) $item->object_id, $title );
	}

	$spanish = get_post_meta( (int) $item->object_id, 'pt_es_title', true );

	if ( '' !== trim( (string) $spanish ) ) {
		return $spanish;
	}

	/*
	 * A custom-link menu item has no post behind it to carry a translation, so
	 * fall back to the theme's own string table. That catches the labels the
	 * seeder wrote, like "Experiences", and leaves anything unknown alone.
	 */
	$translated = __( $title, 'palmtreesurf' ); // phpcs:ignore WordPress.WP.I18n -- Deliberate runtime lookup of a stored label.

	return $translated ? $translated : $title;
}
add_filter( 'nav_menu_item_title', 'pt_translate_menu_title', 10, 2 );

/**
 * A term's Spanish name, when one has been written.
 *
 * @param int    $term_id  Term ID.
 * @param string $fallback English name.
 * @return string
 */
function pt_term_name_es( $term_id, $fallback ) {
	$spanish = get_term_meta( $term_id, 'pt_es_name', true );

	if ( '' !== trim( (string) $spanish ) ) {
		return $spanish;
	}

	// Seeded category names are in the catalogue, so fall back to it.
	return pt_translate_seeded( $fallback );
}

/**
 * Swap category and skill-level names for their Spanish versions.
 *
 * @param string $name    Term name.
 * @param int    $term_id Term ID.
 * @return string
 */
function pt_translate_term_name( $name, $term_id ) {
	if ( is_admin() || ! pt_bilingual_enabled() || 'es' !== pt_current_language() ) {
		return $name;
	}

	return pt_term_name_es( (int) $term_id, $name );
}
add_filter( 'term_name', 'pt_translate_term_name', 10, 2 );

/**
 * And the same for a term's description.
 *
 * @param string $description Description.
 * @param int    $term_id     Term ID.
 * @return string
 */
function pt_translate_term_description( $description, $term_id ) {
	if ( is_admin() || ! pt_bilingual_enabled() || 'es' !== pt_current_language() ) {
		return $description;
	}

	$spanish = get_term_meta( (int) $term_id, 'pt_es_description', true );

	if ( '' !== trim( (string) $spanish ) ) {
		return $spanish;
	}

	return pt_translate_seeded( $description );
}
add_filter( 'term_description', 'pt_translate_term_description', 10, 2 );

/**
 * Terms come back from get_term() with the English name, so swap there too —
 * that is what template code actually reads.
 *
 * @param WP_Term|mixed $term Term object.
 * @return WP_Term|mixed
 */
function pt_translate_term_object( $term ) {
	if ( is_admin() || ! $term instanceof WP_Term || ! pt_bilingual_enabled() || 'es' !== pt_current_language() ) {
		return $term;
	}

	if ( ! in_array( $term->taxonomy, pt_experience_taxonomies(), true ) ) {
		return $term;
	}

	$term->name        = pt_term_name_es( (int) $term->term_id, $term->name );
	$spanish_desc      = get_term_meta( (int) $term->term_id, 'pt_es_description', true );
	$term->description = '' !== trim( (string) $spanish_desc ) ? $spanish_desc : $term->description;

	return $term;
}
add_filter( 'get_term', 'pt_translate_term_object' );

/**
 * Spanish fields on the category and skill-level edit screens.
 *
 * @param WP_Term|string $term Term being edited, or the taxonomy on the add form.
 */
function pt_term_translation_field( $term ) {
	if ( ! pt_bilingual_enabled() ) {
		return;
	}

	$is_edit     = $term instanceof WP_Term;
	$name        = $is_edit ? (string) get_term_meta( $term->term_id, 'pt_es_name', true ) : '';
	$description = $is_edit ? (string) get_term_meta( $term->term_id, 'pt_es_description', true ) : '';

	$label_name = esc_html__( 'Name in Spanish', 'palmtreesurf' );
	$label_desc = esc_html__( 'Description in Spanish', 'palmtreesurf' );
	$hint       = esc_html__( 'Leave empty and Spanish visitors see the English version.', 'palmtreesurf' );

	if ( $is_edit ) {
		printf(
			'<tr class="form-field"><th scope="row"><label for="pt-es-name">%1$s</label></th><td><input type="text" id="pt-es-name" name="pt_es_name" value="%2$s" /><p class="description">%3$s</p></td></tr>'
			. '<tr class="form-field"><th scope="row"><label for="pt-es-description">%4$s</label></th><td><textarea id="pt-es-description" name="pt_es_description" rows="4" cols="40">%5$s</textarea></td></tr>',
			$label_name, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above.
			esc_attr( $name ),
			$hint, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above.
			$label_desc, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above.
			esc_textarea( $description )
		);

		return;
	}

	printf(
		'<div class="form-field"><label for="pt-es-name">%1$s</label><input type="text" id="pt-es-name" name="pt_es_name" value="" /><p>%2$s</p></div>',
		$label_name, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above.
		$hint // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above.
	);
}

/**
 * Save the Spanish term fields.
 *
 * @param int $term_id Term ID.
 */
function pt_save_term_translation( $term_id ) {
	if ( ! current_user_can( 'manage_categories' ) ) {
		return;
	}

	// WordPress verifies the term form's own nonce before this fires.
	foreach ( array( 'pt_es_name' => 'sanitize_text_field', 'pt_es_description' => 'sanitize_textarea_field' ) as $key => $sanitizer ) {
		if ( ! isset( $_POST[ $key ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			continue;
		}

		$value = call_user_func( $sanitizer, wp_unslash( $_POST[ $key ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

		if ( '' === trim( $value ) ) {
			delete_term_meta( $term_id, $key );
		} else {
			update_term_meta( $term_id, $key, $value );
		}
	}
}

/**
 * Hook the term translation fields onto both experience taxonomies.
 */
function pt_term_translation_admin() {
	foreach ( pt_experience_taxonomies() as $taxonomy ) {
		add_action( $taxonomy . '_add_form_fields', 'pt_term_translation_field' );
		add_action( $taxonomy . '_edit_form_fields', 'pt_term_translation_field' );
		add_action( 'created_' . $taxonomy, 'pt_save_term_translation' );
		add_action( 'edited_' . $taxonomy, 'pt_save_term_translation' );
	}
}
add_action( 'admin_init', 'pt_term_translation_admin' );

/**
 * Seed Spanish names for the starter categories, once.
 *
 * Only ever fills an empty field, so a client's own wording is never replaced.
 */
function pt_seed_term_translations() {
	if ( get_option( 'pt_term_es_version' ) === PT_VERSION ) {
		return;
	}

	update_option( 'pt_term_es_version', PT_VERSION );

	/*
	 * These strings are the Spanish, not source text, so they are not wrapped
	 * in __() — there is nothing to look up.
	 */
	$names = array(
		'surf-lessons'     => 'Clases de surf',
		'fishing-charters' => 'Pesca deportiva',
		'boat-tours'       => 'Tours en bote',
		'wildlife-nature'  => 'Vida silvestre y naturaleza',
		'adventure'        => 'Aventura',
		'private-custom'   => 'Privado y a medida',
		'all-levels'       => 'Todos los niveles',
		'first-timer'      => 'Primera vez',
		'beginner'         => 'Principiante',
		'intermediate'     => 'Intermedio',
		'advanced'         => 'Avanzado',
	);

	foreach ( $names as $slug => $spanish ) {
		foreach ( pt_experience_taxonomies() as $taxonomy ) {
			$term = get_term_by( 'slug', $slug, $taxonomy );

			if ( ! $term instanceof WP_Term || get_term_meta( $term->term_id, 'pt_es_name', true ) ) {
				continue;
			}

			update_term_meta( $term->term_id, 'pt_es_name', $spanish );
		}
	}

	// Page titles, so the navigation is Spanish too.
	$pages = array(
		'about'           => 'Sobre nosotros',
		'gallery'         => 'Galería',
		'journal'         => 'Blog',
		'contact'         => 'Contacto',
		'list-your-tours' => 'Liste sus tours',
		'privacy-policy'  => 'Política de privacidad',
	);

	foreach ( $pages as $slug => $spanish ) {
		$page = get_page_by_path( $slug );

		if ( ! $page instanceof WP_Post || get_post_meta( $page->ID, 'pt_es_title', true ) ) {
			continue;
		}

		update_post_meta( $page->ID, 'pt_es_title', $spanish );
	}
}
add_action( 'init', 'pt_seed_term_translations', 997 );

/**
 * Warn when Spanish is switched on but WordPress itself has no Spanish.
 *
 * The theme, the category copy, the tours and the booking form all come from
 * this theme's own catalogue and turn over the moment the toggle is used. A
 * handful of strings do not: the comment form's "Save my name, email…", the
 * password-protected notice, and similar come from WordPress core, and core
 * only has Spanish if its language pack has been installed. Setting the locale
 * through a filter does not fetch one.
 *
 * Installing it is a thirty-second job and it is not something a theme should
 * do behind the client's back, so this says so rather than doing it.
 */
function pt_core_language_notice() {
	if ( ! current_user_can( 'install_languages' ) || ! pt_bilingual_enabled() ) {
		return;
	}

	$installed = get_available_languages();

	if ( array_intersect( array( 'es_CR', 'es_ES', 'es_MX' ), $installed ) ) {
		return;
	}

	printf(
		'<div class="notice notice-warning"><p><strong>%1$s</strong> %2$s</p></div>',
		esc_html__( 'Spanish is switched on, but WordPress has no Spanish installed.', 'palmtreesurf' ),
		esc_html__( 'This theme translates itself, the tours and the booking form. A few strings come from WordPress instead — the comment form is the one visitors see. Go to Settings → General, set Site Language to Español de Costa Rica, save, then set it back to English. That downloads the Spanish files once and those strings follow the toggle from then on.', 'palmtreesurf' )
	);
}
add_action( 'admin_notices', 'pt_core_language_notice' );
