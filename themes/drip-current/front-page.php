<?php
/**
 * Homepage — "The Daily Current".
 *
 * Sections: hero, the graphic tee edit (live WooCommerce products),
 * Between Tides and Traffic, Find Your Line. All copy and images are set in
 * Appearance → Customize → DRIP Homepage.
 *
 * @package drip-current
 */

defined( 'ABSPATH' ) || exit;

get_header();

$drip_edit_anchor = 'tee-edit';
$drip_hero_link   = get_theme_mod( 'drip_hero_link', '' );
$drip_hero_link   = $drip_hero_link ? $drip_hero_link : '#' . $drip_edit_anchor;
$drip_line_link   = get_theme_mod( 'drip_line_link', '' );
$drip_line_link   = $drip_line_link ? $drip_line_link : drip_current_cat_url( 'tees' );
?>
<main id="main" class="site-main home-main">

	<?php if ( get_theme_mod( 'drip_hero_show', true ) ) : ?>
	<section class="hero" aria-labelledby="hero-title">
		<img class="hero__photo" src="<?php echo esc_url( drip_current_image( 'drip_hero_image', 'daily-current-hero.jpg' ) ); ?>" alt="<?php echo esc_attr( drip_current_mod( 'drip_hero_alt' ) ); ?>" fetchpriority="high" decoding="async">
		<h1 class="hero__title" id="hero-title"><?php echo esc_html( drip_current_mod( 'drip_hero_title' ) ); ?></h1>

		<div class="hero__wave" aria-hidden="true">
			<svg viewBox="0 0 1440 220" preserveAspectRatio="none" focusable="false">
				<defs>
					<linearGradient id="wave-back" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stop-color="#ffffff"/>
						<stop offset="1" stop-color="#dcdad5"/>
					</linearGradient>
					<linearGradient id="wave-mid" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0" stop-color="#eeece8"/>
						<stop offset=".45" stop-color="#fbfaf8"/>
						<stop offset="1" stop-color="#e9e7e2"/>
					</linearGradient>
					<linearGradient id="wave-front" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stop-color="#ffffff"/>
						<stop offset="1" stop-color="#f4f2ee"/>
					</linearGradient>
				</defs>
				<path fill="url(#wave-back)" d="M0 92C130 74 230 28 360 22c150-7 250 52 380 84 120 30 220 22 330 8 110-15 200-48 300-40 30 2 52 6 70 10V220H0z"/>
				<path fill="url(#wave-mid)" d="M0 128c140-34 300-62 470-38 150 21 240 64 380 70 150 6 260-36 380-46 90-8 160 0 210 10V220H0z"/>
				<path fill="url(#wave-front)" d="M0 176c180-26 380-44 600-30 210 14 380 34 560 22 110-7 200-20 280-26V220H0z"/>
			</svg>
		</div>

		<a class="pill-button hero__cta" href="<?php echo esc_url( $drip_hero_link ); ?>">
			<?php echo esc_html( drip_current_mod( 'drip_hero_button' ) ); ?>
			<?php echo drip_current_icon( 'chevron-r' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		</a>
	</section>
	<?php endif; ?>

	<?php if ( function_exists( 'drip_current_edit_products' ) ) : ?>
		<?php $drip_products = drip_current_edit_products(); ?>
		<?php if ( $drip_products ) : ?>
		<section class="tee-edit" id="<?php echo esc_attr( $drip_edit_anchor ); ?>" aria-labelledby="tee-edit-title">
			<h2 class="section-title" id="tee-edit-title"><?php echo esc_html( drip_current_mod( 'drip_edit_title' ) ); ?></h2>
			<div class="tee-grid">
				<?php
				foreach ( array_values( $drip_products ) as $drip_i => $drip_product ) {
					drip_current_product_card( $drip_product, get_theme_mod( 'drip_edit_image_' . ( $drip_i + 1 ), '' ) );
				}
				?>
			</div>
		</section>
		<?php endif; ?>
	<?php endif; ?>

	<section class="story-band" aria-labelledby="story-title" style="--story-image:url('<?php echo esc_url( drip_current_image( 'drip_story_image', 'between-tides.jpg' ) ); ?>')">
		<div class="story-band__copy">
			<h2 class="story-band__title" id="story-title"><?php echo esc_html( drip_current_mod( 'drip_story_title' ) ); ?></h2>
			<span class="story-band__rule" aria-hidden="true"></span>
			<p class="story-band__text"><?php echo nl2br( esc_html( drip_current_mod( 'drip_story_text' ) ) ); ?></p>
			<?php
			$drip_story_label = drip_current_mod( 'drip_story_link_label' );
			$drip_story_link  = get_theme_mod( 'drip_story_link', '' );
			if ( $drip_story_label ) :
				?>
				<a class="text-link" href="<?php echo esc_url( $drip_story_link ? $drip_story_link : drip_current_page_url( 'our-story' ) ); ?>"><?php echo esc_html( $drip_story_label ); ?> <?php echo drip_current_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
			<?php endif; ?>
		</div>
	</section>

	<section class="line-band" aria-labelledby="line-title" style="--line-image:url('<?php echo esc_url( drip_current_image( 'drip_line_image', 'find-your-line.jpg' ) ); ?>')">
		<h2 class="line-band__title" id="line-title"><?php echo esc_html( drip_current_mod( 'drip_line_title' ) ); ?></h2>
		<a class="pill-button pill-button--outline" href="<?php echo esc_url( $drip_line_link ); ?>">
			<?php echo esc_html( drip_current_mod( 'drip_line_button' ) ); ?>
			<?php echo drip_current_icon( 'chevron-r' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		</a>
	</section>

</main>
<?php
get_footer();
