<?php
/**
 * Front-page content. Kept in one file so copy changes never mean hunting
 * through templates, and so schema can be generated from the same arrays the
 * page renders from.
 *
 * @package mcgrath-chrome
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** A site URL for a known page slug, falling back to the slug itself. */
function mcg_url( $slug ) {
	$page = get_page_by_path( $slug );
	return $page ? get_permalink( $page ) : home_url( '/' . $slug . '/' );
}

/**
 * A photographic plate.
 *
 * If a real photo exists at assets/img/{$name}.jpg (or .webp) it is used.
 * Otherwise a hand-built CSS dusk scene stands in, so the design never ships
 * with a grey box where a photograph belongs.
 *
 * @param string $name  File basename: hero, roots or ocean.
 * @param string $class Extra classes, e.g. "night".
 * @param string $focus background-position for the photo, so a replacement
 *                      shot can be re-aimed without touching the stylesheet.
 * @param string $zoom  background-size. "cover" fits the whole frame with the
 *                      least crop; a value like "auto 135%" pushes in so the
 *                      subject can be moved further across the frame, which a
 *                      photo with its subject on the wrong side needs.
 */
function mcg_plate( $name, $class = '', $focus = '50% 50%', $zoom = 'cover' ) {
	$dir = get_template_directory() . '/assets/img/';
	$uri = get_template_directory_uri() . '/assets/img/';

	foreach ( array( 'webp', 'jpg', 'jpeg', 'png' ) as $ext ) {
		if ( file_exists( $dir . $name . '.' . $ext ) ) {
			printf(
				'<div class="ph bg %s" style="background-image:url(%s);background-position:%s;background-size:%s"><span class="grade"></span></div>',
				esc_attr( $class ),
				esc_url( $uri . $name . '.' . $ext ),
				esc_attr( $focus ),
				esc_attr( $zoom )
			);
			return;
		}
	}

	echo '<div class="ph ' . esc_attr( $class ) . '">';
	mcg_scene( 'night' === $class || false !== strpos( $class, 'night' ) );
	echo '<span class="grade"></span><span class="grain"></span></div>';
}

/**
 * The drawn stand-in scene: the Jupiter Inlet light at dusk, or open water at
 * night for the closing call to action. Inline SVG so it stays sharp, weighs
 * almost nothing and re-colours with the rest of the theme.
 *
 * @param bool $night Night variant.
 */
function mcg_scene( $night = false ) {
	$id = $night ? 'n' : 'd';
	?>
	<svg class="scene" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
		<defs>
			<linearGradient id="sky<?php echo esc_attr( $id ); ?>" x1="0" y1="0" x2="0" y2="1">
				<?php if ( $night ) : ?>
					<stop offset="0" stop-color="#05142A"/><stop offset=".42" stop-color="#0D2A4A"/>
					<stop offset=".74" stop-color="#1B4A70" stop-opacity=".95"/><stop offset="1" stop-color="#2A628C"/>
				<?php else : ?>
					<stop offset="0" stop-color="#6FA9D6"/><stop offset=".34" stop-color="#A6CBE2"/>
					<stop offset=".62" stop-color="#DCDCC8"/><stop offset=".82" stop-color="#EEC79A"/>
					<stop offset="1" stop-color="#D89468"/>
				<?php endif; ?>
			</linearGradient>

			<radialGradient id="sun<?php echo esc_attr( $id ); ?>">
				<?php if ( $night ) : ?>
					<stop offset="0" stop-color="#CFE2F5" stop-opacity=".62"/>
					<stop offset=".5" stop-color="#9FC2E4" stop-opacity=".16"/>
					<stop offset="1" stop-color="#9FC2E4" stop-opacity="0"/>
				<?php else : ?>
					<stop offset="0" stop-color="#FFF4DC" stop-opacity=".98"/>
					<stop offset=".42" stop-color="#FFD9A2" stop-opacity=".5"/>
					<stop offset="1" stop-color="#FFC98A" stop-opacity="0"/>
				<?php endif; ?>
			</radialGradient>

			<linearGradient id="sea<?php echo esc_attr( $id ); ?>" x1="0" y1="0" x2="0" y2="1">
				<?php if ( $night ) : ?>
					<stop offset="0" stop-color="#1A4763"/><stop offset="1" stop-color="#061527"/>
				<?php else : ?>
					<stop offset="0" stop-color="#3B7FA8"/><stop offset=".5" stop-color="#20567E"/>
					<stop offset="1" stop-color="#123A5C"/>
				<?php endif; ?>
			</linearGradient>

			<radialGradient id="lamp<?php echo esc_attr( $id ); ?>">
				<stop offset="0" stop-color="#FFF6CE" stop-opacity=".95"/>
				<stop offset=".45" stop-color="#FFE9A0" stop-opacity=".34"/>
				<stop offset="1" stop-color="#FFE9A0" stop-opacity="0"/>
			</radialGradient>
		</defs>

		<rect width="800" height="600" fill="url(#sky<?php echo esc_attr( $id ); ?>)"/>
		<circle cx="<?php echo $night ? 610 : 545; ?>" cy="<?php echo $night ? 160 : 372; ?>"
			r="<?php echo $night ? 130 : 170; ?>" fill="url(#sun<?php echo esc_attr( $id ); ?>)"/>

		<?php if ( ! $night ) : ?>
			<!-- distant cloud banding -->
			<g fill="#FFFFFF" opacity=".2">
				<ellipse cx="200" cy="150" rx="170" ry="17"/>
				<ellipse cx="540" cy="112" rx="200" ry="13"/>
				<ellipse cx="680" cy="206" rx="140" ry="11"/>
			</g>
		<?php else : ?>
			<g fill="#EAF2FB">
				<circle cx="120" cy="86" r="1.5" opacity=".7"/><circle cx="238" cy="52" r="1.1" opacity=".5"/>
				<circle cx="356" cy="112" r="1.4" opacity=".6"/><circle cx="470" cy="60" r="1" opacity=".45"/>
				<circle cx="700" cy="98" r="1.6" opacity=".7"/><circle cx="60" cy="176" r="1.1" opacity=".4"/>
			</g>
		<?php endif; ?>

		<!-- water -->
		<rect x="0" y="<?php echo $night ? 300 : 396; ?>" width="800" height="<?php echo $night ? 300 : 204; ?>"
			fill="url(#sea<?php echo esc_attr( $id ); ?>)"/>
		<g fill="#FFFFFF" opacity="<?php echo $night ? '.16' : '.2'; ?>">
			<?php
			$top  = $night ? 314 : 406;
			$rows = $night ? 11 : 8;
			for ( $i = 0; $i < $rows; $i++ ) {
				$y = $top + ( $i * $i * 2.4 ) + $i * 9;
				if ( $y > 590 ) { break; }
				printf(
					'<ellipse cx="%d" cy="%d" rx="%d" ry="%s" opacity="%s"/>',
					(int) ( 110 + ( ( $i * 181 ) % 600 ) ), (int) $y,
					(int) ( 60 + $i * 26 ), esc_attr( 1.4 + $i * .35 ), esc_attr( 1 - $i * .09 )
				);
			}
			?>
		</g>
		<!-- the light lays a path across the water -->
		<g fill="#FFFFFF" opacity="<?php echo $night ? '.2' : '.3'; ?>">
			<?php
			$gx = $night ? 610 : 545;
			for ( $i = 0; $i < 10; $i++ ) {
				$y = ( $night ? 312 : 404 ) + $i * 19;
				if ( $y > 590 ) { break; }
				$w = 10 + $i * 7;
				printf(
					'<ellipse cx="%d" cy="%d" rx="%d" ry="1.6" opacity="%s"/>',
					(int) ( $gx + ( $i % 3 - 1 ) * 8 ), (int) $y, (int) $w, esc_attr( .95 - $i * .09 )
				);
			}
			?>
		</g>

		<?php if ( ! $night ) : ?>
			<!-- shoreline -->
			<path d="M0 404 C 140 388, 300 396, 430 402 C 560 408, 690 398, 800 392 L800 430 L0 430Z" fill="#1A4436" opacity=".92"/>

			<!-- the light -->
			<g transform="translate(372 0)">
				<circle cx="0" cy="214" r="86" fill="url(#lamp<?php echo esc_attr( $id ); ?>)"/>
				<path d="M-23 404 L-15 254 L15 254 L23 404 Z" fill="#B8412F"/>
				<path d="M-23 404 L-15 254 L-4 254 L-9 404 Z" fill="#992F21" opacity=".55"/>
				<rect x="-19" y="246" width="38" height="9" rx="2" fill="#F4EEDD"/>
				<rect x="-14" y="236" width="28" height="11" rx="2" fill="#23313B"/>
				<rect x="-10" y="222" width="20" height="15" rx="3" fill="#FFF3C4"/>
				<rect x="-12" y="216" width="24" height="7" rx="2" fill="#23313B"/>
				<path d="M-6 216 L0 206 L6 216 Z" fill="#23313B"/>
				<rect x="-32" y="386" width="64" height="20" rx="3" fill="#E8E0CB"/>
				<rect x="-32" y="386" width="64" height="5" rx="2" fill="#B8412F"/>
			</g>

			<!-- palms -->
			<g fill="#15382B">
				<g transform="translate(96 404)">
					<path d="M0 0 C -4 -52, -10 -86, -20 -116 L-11 -118 C -3 -86, 5 -50, 8 0 Z"/>
					<g transform="translate(-16 -118)">
						<path d="M0 0 C -30 -8, -54 4, -70 24 C -48 8, -22 4, 2 8 Z"/>
						<path d="M0 0 C 26 -14, 54 -10, 76 8 C 54 -2, 26 -2, 2 8 Z"/>
						<path d="M0 0 C -14 -28, -8 -54, 10 -72 C 0 -48, 0 -22, 6 2 Z"/>
						<path d="M0 0 C 20 -22, 46 -30, 68 -26 C 44 -18, 20 -6, 4 6 Z"/>
						<path d="M0 0 C -24 -22, -50 -28, -70 -22 C -46 -16, -20 -6, -2 6 Z"/>
					</g>
				</g>
				<g transform="translate(186 406) scale(.74)">
					<path d="M0 0 C 6 -50, 14 -84, 26 -114 L17 -118 C 5 -86, -5 -50, -8 0 Z"/>
					<g transform="translate(22 -118)">
						<path d="M0 0 C 30 -8, 54 4, 70 24 C 48 8, 22 4, -2 8 Z"/>
						<path d="M0 0 C -26 -14, -54 -10, -76 8 C -54 -2, -26 -2, -2 8 Z"/>
						<path d="M0 0 C 14 -28, 8 -54, -10 -72 C 0 -48, 0 -22, -6 2 Z"/>
						<path d="M0 0 C -20 -22, -46 -30, -68 -26 C -44 -18, -20 -6, -4 6 Z"/>
						<path d="M0 0 C 24 -22, 50 -28, 70 -22 C 46 -16, 20 -6, 2 6 Z"/>
					</g>
				</g>
				<g transform="translate(694 404) scale(.92)">
					<path d="M0 0 C 5 -50, 12 -84, 23 -114 L14 -118 C 4 -86, -6 -50, -9 0 Z"/>
					<g transform="translate(19 -118)">
						<path d="M0 0 C 30 -8, 54 4, 70 24 C 48 8, 22 4, -2 8 Z"/>
						<path d="M0 0 C -26 -14, -54 -10, -76 8 C -54 -2, -26 -2, -2 8 Z"/>
						<path d="M0 0 C 14 -28, 8 -54, -10 -72 C 0 -48, 0 -22, -6 2 Z"/>
						<path d="M0 0 C -20 -22, -46 -30, -68 -26 C -44 -18, -20 -6, -4 6 Z"/>
						<path d="M0 0 C 24 -22, 50 -28, 70 -22 C 46 -16, 20 -6, 2 6 Z"/>
					</g>
				</g>
				<g transform="translate(766 402) scale(.62)">
					<path d="M0 0 C -4 -52, -10 -86, -20 -116 L-11 -118 C -3 -86, 5 -50, 8 0 Z"/>
					<g transform="translate(-16 -118)">
						<path d="M0 0 C -30 -8, -54 4, -70 24 C -48 8, -22 4, 2 8 Z"/>
						<path d="M0 0 C 26 -14, 54 -10, 76 8 C 54 -2, 26 -2, 2 8 Z"/>
						<path d="M0 0 C -14 -28, -8 -54, 10 -72 C 0 -48, 0 -22, 6 2 Z"/>
						<path d="M0 0 C 20 -22, 46 -30, 68 -26 C 44 -18, 20 -6, 4 6 Z"/>
					</g>
				</g>
			</g>
		<?php endif; ?>
	</svg>
	<?php
}

/** The four-up stat strip under the hero. */
function mcg_strip() {
	return array(
		array( 'icon' => 'calendar', 'value' => '19+ Years',      'label' => 'Experience' ),
		array( 'icon' => 'bars',     'value' => 'SEO + AI Search','label' => "Ahead of What's Next" ),
		array( 'icon' => 'pin',      'value' => 'Jupiter, FL',    'label' => 'Local Roots. Real Relationships.' ),
		array( 'icon' => 'globe',    'value' => 'National Reach', 'label' => 'Results Without Boundaries.' ),
	);
}

/** The four service cards. Also drives the Service schema. */
function mcg_services() {
	return array(
		array(
			'icon'   => 'search',
			'title'  => 'SEO',
			'sub'    => 'Own traditional search.',
			'url'    => 'seo-jupiter-fl',
			'accent' => false,
			'items'  => array( 'Keyword Strategy', 'Technical SEO', 'Content & Authority', 'Local SEO' ),
		),
		array(
			'icon'   => 'sparkle',
			'title'  => 'AI Search / GEO / AEO',
			'sub'    => 'Get cited. Get recommended.',
			'url'    => 'ai-visibility',
			'accent' => true,
			'items'  => array( 'ChatGPT, Gemini, Perplexity', 'AI Overviews', 'Entity Optimization', 'Digital PR & Brand Authority' ),
		),
		array(
			'icon'   => 'monitor',
			'title'  => 'Web Design & Development',
			'sub'    => 'Websites built to perform.',
			'url'    => 'web-design-jupiter',
			'accent' => false,
			'items'  => array( 'Custom, Conversion-Focused Design', 'Lightning Fast & SEO Ready', 'CMS Flexibility', 'Ongoing Support' ),
		),
		array(
			'icon'   => 'chart',
			'title'  => 'Analytics & Conversion',
			'sub'    => 'Turn traffic into revenue.',
			'url'    => 'contact',
			'accent' => false,
			'items'  => array( 'Conversion Rate Optimization', 'Advanced Analytics & Tracking', 'Reporting & Insights', 'Continuous Improvement' ),
		),
	);
}

/** The AI platforms shown in the hero dashboard. */
function mcg_platforms() {
	return array(
		array( 'icon' => 'google',  'label' => 'Google<br>Search' ),
		array( 'icon' => 'openai',  'label' => 'ChatGPT' ),
		array( 'icon' => 'gemini',  'label' => 'Gemini' ),
		array( 'icon' => 'perplex', 'label' => 'Perplexity' ),
		array( 'icon' => 'ai',      'label' => 'AI Overviews' ),
	);
}

/** The featured case study. */
function mcg_case() {
	return array(
		'client'  => mcg_opt( 'mcg_case_client', 'A multi-location' ),
		'unit'    => mcg_opt( 'mcg_case_unit', 'healthcare practice' ),
		'summary' => mcg_opt( 'mcg_case_summary', 'Technical repair first, then the pages that answer what patients actually search for, then the profiles and citations that decide the map. The shape most engagements take, and the range of movement they produce.' ),
		'headline'=> mcg_opt( 'mcg_case_headline', 'Expert Care, Close to Home' ),
		'stats'   => array(
			array( 'value' => 180, 'label' => 'Organic Traffic' ),
			array( 'value' => 260, 'label' => 'Keyword Rankings' ),
			array( 'value' => 70,  'label' => 'Enquiries' ),
		),
	);
}

/** The reasons column beside the Jupiter photo. */
function mcg_roots() {
	return array(
		array( 'icon' => 'handshake', 'title' => 'Local Relationships', 'sub' => 'Stronger Communities' ),
		array( 'icon' => 'building',  'title' => 'National Clients',    'sub' => 'Across the U.S.' ),
		array( 'icon' => 'badge',     'title' => 'Big Agency Expertise','sub' => 'Personal Attention' ),
	);
}

/** What the free audit reports on. */
function mcg_audit_checks() {
	return array( 'SEO performance', 'AI search visibility', 'Technical issues', 'Growth opportunities' );
}

/** Social profiles. An empty URL drops the icon from the footer. */
function mcg_social() {
	$map = array(
		'linkedin'  => 'mcg_social_linkedin',
		'instagram' => 'mcg_social_instagram',
		'youtube'   => 'mcg_social_youtube',
	);
	$out = array();
	foreach ( $map as $icon => $key ) {
		$url = mcg_opt( $key, '' );
		if ( $url ) {
			$out[] = array( 'icon' => $icon, 'url' => $url, 'label' => ucfirst( $icon ) );
		}
	}
	return $out;
}
