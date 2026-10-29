<?php
/**
 * Home page: the sky, the forecast, why we're comfy, and the mood shop.
 *
 * @package comfy-humans-cloud
 */

defined( 'ABSPATH' ) || exit;

get_header();

$chc_shop  = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'shop' ) : home_url( '/' );
$chc_hero  = chc_hero_image();
$chc_moods = chc_moods();

// *word* turns puffy white, **word** turns puffy coral.
$chc_title = esc_html( chc_mod( 'hero_title' ) );
$chc_title = preg_replace( '/\*\*(.+?)\*\*/', '<span class="soft"><span>$1</span></span>', $chc_title );
$chc_title = preg_replace( '/\*(.+?)\*/', '<span class="soft">$1</span>', $chc_title );
?>
<section class="hero">
	<div class="sky-layer back" data-clouds="back" data-depth="0.3"></div>
	<div class="sky-layer front" data-clouds="front" data-depth="1"></div>
	<div class="wrap hero-grid">
		<div>
			<?php if ( chc_mod( 'hero_eyebrow' ) ) : ?>
				<span class="forecast-pill"><span class="dot"><?php echo chc_cloud_svg( '#1f2766', 14, 10 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span><?php echo esc_html( chc_mod( 'hero_eyebrow' ) ); ?></span>
			<?php endif; ?>
			<h1><?php echo $chc_title; // phpcs:ignore WordPress.Security.EscapeOutput -- escaped above, only our spans added. ?></h1>
			<p class="lede"><?php echo esc_html( chc_mod( 'hero_lede' ) ); ?></p>
			<div class="ctas">
				<a class="btn btn-main" href="<?php echo esc_url( $chc_moods ? '#moods' : $chc_shop ); ?>"><?php esc_html_e( 'Find your comfy', 'comfy-humans-cloud' ); ?> <span aria-hidden="true">&#8599;</span></a>
				<a class="btn btn-ghost" href="#why"><?php esc_html_e( "Why we're the comfiest", 'comfy-humans-cloud' ); ?></a>
			</div>
		</div>
		<div class="window-wrap bob">
			<div class="window"><img src="<?php echo esc_url( $chc_hero[0] ); ?>" alt="<?php echo esc_attr( $chc_hero[1] ); ?>" width="1200" height="675" fetchpriority="high"></div>
			<div class="tag t1"><small><?php esc_html_e( 'Current location', 'comfy-humans-cloud' ); ?></small><?php esc_html_e( 'Cloud nine, window seat', 'comfy-humans-cloud' ); ?></div>
			<div class="tag t2"><small><?php esc_html_e( 'Squish index', 'comfy-humans-cloud' ); ?></small><?php esc_html_e( 'Dangerously high', 'comfy-humans-cloud' ); ?><span class="meter"><i></i></span></div>
			<div class="zz" aria-hidden="true">Z<span>z</span></div>
		</div>
	</div>
</section>

<div class="wrap forecast">
	<div class="forecast-card" role="group" aria-label="<?php esc_attr_e( "Today's comfort forecast", 'comfy-humans-cloud' ); ?>">
		<div class="head"><span class="eyebrow"><?php esc_html_e( 'Today in Comfy', 'comfy-humans-cloud' ); ?></span><h2><?php esc_html_e( 'Comfort forecast', 'comfy-humans-cloud' ); ?></h2></div>
		<div class="reading"><span class="eyebrow"><?php esc_html_e( 'Chance of naps', 'comfy-humans-cloud' ); ?></span><b>100%</b></div>
		<div class="reading"><span class="eyebrow"><?php esc_html_e( 'Feels like', 'comfy-humans-cloud' ); ?></span><b><?php esc_html_e( 'A Sunday', 'comfy-humans-cloud' ); ?></b></div>
		<div class="reading"><span class="eyebrow"><?php esc_html_e( 'Wind', 'comfy-humans-cloud' ); ?></span><b><?php esc_html_e( 'Gentle sigh', 'comfy-humans-cloud' ); ?></b></div>
		<div class="reading"><span class="eyebrow"><?php esc_html_e( 'Responsibility index', 'comfy-humans-cloud' ); ?></span><b><?php esc_html_e( 'Low', 'comfy-humans-cloud' ); ?></b></div>
	</div>
</div>

<div class="ticker" aria-hidden="true"><div class="ticker-track">
	<?php for ( $chc_i = 0; $chc_i < 2; $chc_i++ ) : ?>
		<span>Soft stuff <em>&#10022;</em> Happy humans <em>&#10022;</em> Zero plans, maximum fluff <em>&#10022;</em> Warning: may cancel plans <em>&#10022;</em> Main character nap energy <em>&#10022;</em></span>
	<?php endfor; ?>
</div></div>

<?php $chc_reasons = chc_reasons(); ?>
<section class="why" id="why">
	<div class="sky-layer" data-clouds="mid" data-depth="0.6"></div>
	<div class="wrap">
		<div class="why-head">
			<div><p class="eyebrow"><?php esc_html_e( 'The comfort report', 'comfy-humans-cloud' ); ?></p><h2><?php echo esc_html( chc_mod( 'why_title' ) ); ?></h2></div>
			<p><?php echo esc_html( chc_mod( 'why_lede' ) ); ?></p>
		</div>
		<?php if ( $chc_reasons ) : ?>
			<div class="reasons">
				<?php foreach ( $chc_reasons as $chc_r ) : ?>
					<article class="reason">
						<span class="blob" aria-hidden="true"></span>
						<?php if ( $chc_r['label'] ) : ?><span class="num"><?php echo esc_html( $chc_r['label'] ); ?></span><?php endif; ?>
						<?php if ( $chc_r['stat'] ) : ?><div class="stat"><?php echo esc_html( $chc_r['stat'] ); ?><?php if ( $chc_r['unit'] ) : ?><small><?php echo esc_html( $chc_r['unit'] ); ?></small><?php endif; ?></div><?php endif; ?>
						<h3><?php echo esc_html( $chc_r['title'] ); ?></h3>
						<p><?php echo esc_html( $chc_r['text'] ); ?></p>
					</article>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</div>
</section>

<section class="vs">
	<div class="wrap">
		<div class="vs-card">
			<div class="vs-left"><p class="eyebrow"><?php esc_html_e( 'Side by side', 'comfy-humans-cloud' ); ?></p><h2><?php esc_html_e( 'The rest of the internet vs. your comfort zone', 'comfy-humans-cloud' ); ?></h2><p><?php esc_html_e( "The internet is loud. This corner of it is not. Here's what changes when you land on a cloud.", 'comfy-humans-cloud' ); ?></p></div>
			<div class="vs-table">
				<table>
					<thead><tr><th scope="col"><?php esc_html_e( 'On every visit', 'comfy-humans-cloud' ); ?></th><th scope="col"><?php esc_html_e( 'Everywhere else', 'comfy-humans-cloud' ); ?></th><th scope="col"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></th></tr></thead>
					<tbody>
						<tr><td><?php esc_html_e( 'Pop-ups', 'comfy-humans-cloud' ); ?></td><td class="them"><?php esc_html_e( 'One after another', 'comfy-humans-cloud' ); ?></td><td class="us"><span><?php esc_html_e( 'None', 'comfy-humans-cloud' ); ?></span></td></tr>
						<tr><td><?php esc_html_e( 'Countdown timers', 'comfy-humans-cloud' ); ?></td><td class="them"><?php esc_html_e( 'Constantly', 'comfy-humans-cloud' ); ?></td><td class="us"><span><?php esc_html_e( 'Never', 'comfy-humans-cloud' ); ?></span></td></tr>
						<tr><td><?php esc_html_e( 'Tone of voice', 'comfy-humans-cloud' ); ?></td><td class="them"><?php esc_html_e( 'SHOUTING', 'comfy-humans-cloud' ); ?></td><td class="us"><span><?php esc_html_e( 'a soft whisper', 'comfy-humans-cloud' ); ?></span></td></tr>
						<tr><td><?php esc_html_e( 'Feels like', 'comfy-humans-cloud' ); ?></td><td class="them"><?php esc_html_e( 'Monday, 8 a.m.', 'comfy-humans-cloud' ); ?></td><td class="us"><span><?php esc_html_e( 'Sunday, 11 a.m.', 'comfy-humans-cloud' ); ?></span></td></tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</section>

<section class="moods" id="moods">
	<div class="wrap">
		<div class="moods-head"><p class="eyebrow"><?php esc_html_e( 'How human are you feeling?', 'comfy-humans-cloud' ); ?></p><h2><?php esc_html_e( 'Pick your current cloud.', 'comfy-humans-cloud' ); ?></h2></div>
		<?php
		$chc_products = function_exists( 'wc_get_products' ) ? wc_get_products( array( 'status' => 'publish', 'limit' => 12, 'orderby' => 'popularity', 'visibility' => 'catalog' ) ) : array();
		$chc_used     = array();
		foreach ( $chc_products as $chc_p ) {
			$chc_used = array_merge( $chc_used, (array) wp_get_post_terms( $chc_p->get_id(), 'product_cat', array( 'fields' => 'slugs' ) ) );
		}
		$chc_moods = array_values( array_filter( $chc_moods, function ( $m ) use ( $chc_used ) { return in_array( $m['slug'], $chc_used, true ); } ) );
		?>
		<?php if ( $chc_products ) : ?>
			<?php if ( $chc_moods ) : ?>
				<div class="mood-tabs" role="group" aria-label="<?php esc_attr_e( 'Choose a mood', 'comfy-humans-cloud' ); ?>">
					<button type="button" id="mood-all" data-mood="" aria-pressed="true"><?php esc_html_e( 'All the comfy', 'comfy-humans-cloud' ); ?></button>
					<?php foreach ( $chc_moods as $chc_m ) : ?>
						<button type="button" id="mood-<?php echo esc_attr( $chc_m['slug'] ); ?>" data-mood="<?php echo esc_attr( $chc_m['slug'] ); ?>" aria-pressed="false"><?php echo esc_html( $chc_m['label'] ); ?></button>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
			<div class="products" id="products" aria-live="polite">
				<?php foreach ( $chc_products as $chc_p ) { chc_product_card( $chc_p, $chc_moods ); } ?>
			</div>
			<p class="shop-all"><a class="btn btn-ghost" href="<?php echo esc_url( $chc_shop ); ?>"><?php esc_html_e( 'Shop all the comfy', 'comfy-humans-cloud' ); ?> <span aria-hidden="true">&#8599;</span></a></p>
		<?php else : ?>
			<div class="empty-cloud"><h3><?php esc_html_e( 'A little comfort is on its way.', 'comfy-humans-cloud' ); ?></h3><p><?php esc_html_e( 'Our collection is getting cozy. Check back soon.', 'comfy-humans-cloud' ); ?></p></div>
		<?php endif; ?>
	</div>
</section>

<section class="close" id="letter">
	<div class="sky-layer" data-clouds="mid" data-depth="0.6"></div>
	<div class="wrap">
		<div class="close-cloud">
			<p class="eyebrow"><?php esc_html_e( 'A softer way to everyday', 'comfy-humans-cloud' ); ?></p>
			<h2><?php echo esc_html( chc_mod( 'letter_title' ) ); ?></h2>
			<?php $chc_sc = trim( (string) get_theme_mod( 'chc_letter_shortcode', '' ) ); ?>
			<?php if ( $chc_sc ) : ?>
				<p><?php echo esc_html( chc_mod( 'letter_text' ) ); ?></p>
				<div class="letter-form"><?php echo do_shortcode( $chc_sc ); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
			<?php else : ?>
				<p><?php esc_html_e( 'For slow mornings, blanket burrito evenings, and your very human need to recharge.', 'comfy-humans-cloud' ); ?></p>
				<a class="btn btn-main" href="<?php echo esc_url( $chc_shop ); ?>"><?php esc_html_e( 'Find your soft spot', 'comfy-humans-cloud' ); ?> <span aria-hidden="true">&#8599;</span></a>
			<?php endif; ?>
		</div>
	</div>
</section>
<?php
get_footer();
