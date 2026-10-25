<?php
/**
 * The homepage: the swell, the drop, the story, the colorways, what's
 * next, and the cap.
 *
 * @package drip
 */

get_header();

$drip_drop  = drip_catalog(
	array(
		'limit'  => 8,
		'filter' => function ( $p ) {
			return ! drip_is_coming_soon( $p );
		},
	)
);
$drip_next  = drip_catalog(
	array(
		'limit'  => 3,
		'filter' => 'drip_is_coming_soon',
	)
);
$drip_all   = drip_catalog( array( 'limit' => 60 ) );
$drip_black = null;
$drip_white = null;
$drip_cap   = null;
foreach ( $drip_all as $drip_p ) {
	$drip_tone = drip_tone( $drip_p );
	if ( ! $drip_black && 'black' === $drip_tone && ! drip_is_coming_soon( $drip_p ) ) {
		$drip_black = $drip_p;
	}
	if ( ! $drip_white && 'white' === $drip_tone && ! drip_is_coming_soon( $drip_p ) ) {
		$drip_white = $drip_p;
	}
	if ( ! $drip_cap && false !== stripos( $drip_p->get_name(), 'cap' ) && ! drip_is_coming_soon( $drip_p ) ) {
		$drip_cap = $drip_p;
	}
}
$drip_story = drip_product_by_slug( 'drip-shoreline-minimal-back-tee-lifestyle' );
$drip_count = count(
	array_filter(
		$drip_all,
		function ( $p ) {
			return ! drip_is_coming_soon( $p );
		}
	)
);
?>
<main id="main">

	<section class="hero" aria-labelledby="hero-title">
		<div class="hero-art" aria-hidden="true">
			<?php echo drip_swell(); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			<span class="hero-drop"><?php echo drip_drop( 'hero-drop-svg' ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
		</div>
		<div class="wrap hero-inner">
			<p class="eyebrow hero-eyebrow"><span class="pulse" aria-hidden="true"></span>New drop · Back prints</p>
			<h1 class="hero-title" id="hero-title"><span>Born from</span> <span>salt water.</span></h1>
			<p class="hero-serif">Built for where you are.</p>
			<p class="hero-copy">DRIP is the collision of two worlds: the raw energy of ocean swells and the grit of urban streets. Every piece is made for the ones who live between tides and traffic.</p>
			<div class="hero-actions">
				<a class="btn btn-foam" href="<?php echo drip_wc_url( 'shop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Shop the drop <?php echo drip_icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
				<a class="btn btn-ghost" href="<?php echo drip_url( 'about' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Our story</a>
			</div>
		</div>
		<div class="wrap hero-foot">
			<?php if ( $drip_count ) : ?>
				<span><b><?php echo (int) $drip_count; ?></b> pieces in the drop</span>
			<?php endif; ?>
			<span><b>2</b> colorways · black &amp; white</span>
			<span class="hero-scroll" aria-hidden="true">Scroll</span>
		</div>
	</section>

	<div class="ticker" aria-hidden="true">
		<div class="ticker-track">
			<?php for ( $drip_i = 0; $drip_i < 2; $drip_i++ ) : ?>
				<span>Between tides and traffic</span><?php echo drip_drop( 'ticker-drop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<span>The back is the statement</span><?php echo drip_drop( 'ticker-drop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<span>Black / White</span><?php echo drip_drop( 'ticker-drop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<span>Born from salt water</span><?php echo drip_drop( 'ticker-drop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			<?php endfor; ?>
		</div>
	</div>

	<?php if ( $drip_drop ) : ?>
	<section class="section light drop-section" aria-labelledby="drop-title">
		<div class="wrap">
			<div class="section-head">
				<div>
					<p class="eyebrow">01 — The drop</p>
					<h2 class="section-title" id="drop-title">Wear the wave.</h2>
				</div>
				<div class="section-tools">
					<div class="chips" role="group" aria-label="Filter by color" data-tone-filter="drop-grid">
						<button type="button" class="chip is-on" data-tone="all" aria-pressed="true">All</button>
						<button type="button" class="chip" data-tone="black" aria-pressed="false">Black</button>
						<button type="button" class="chip" data-tone="white" aria-pressed="false">White</button>
					</div>
					<a class="link-arrow" href="<?php echo drip_wc_url( 'shop' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Shop all <?php echo drip_icon( 'arrow', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
				</div>
			</div>
			<div class="grid products-grid" id="drop-grid">
				<?php
				foreach ( $drip_drop as $drip_p ) {
					drip_card( $drip_p );
				}
				?>
			</div>
		</div>
	</section>
	<?php endif; ?>

	<section class="section story" aria-labelledby="story-title">
		<div class="wrap story-grid">
			<div class="story-media" data-reveal>
				<?php if ( $drip_story && $drip_story->get_image_id() ) : ?>
					<?php echo drip_image( $drip_story->get_image_id(), 'large', 'story-img', 'The DRIP Shoreline back print, worn by the water' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<?php else : ?>
					<?php echo drip_swell( array( 'lines' => 18, 'width' => 800, 'height' => 1000, 'seed' => 3 ) ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<?php endif; ?>
				<p class="story-caption">Shoreline Minimal · worn by the water</p>
			</div>
			<div class="story-copy">
				<p class="eyebrow">02 — The brand</p>
				<h2 class="section-title" id="story-title">Between tides and traffic.</h2>
				<p class="lede">Morning is salt, sand, and a set rolling in. Afternoon is concrete, noise, and the city moving fast. DRIP is made for both, and for the drive in between.</p>
				<ol class="principles">
					<li data-reveal>
						<span class="principle-n">01</span>
						<div><h3>The back is the statement.</h3><p>Every tee carries its print high across the shoulders. Clean up front, the wave is what you leave behind you.</p></div>
					</li>
					<li data-reveal>
						<span class="principle-n">02</span>
						<div><h3>Black and white. Nothing to hide behind.</h3><p>Two colorways, silver and foam-white ink. The prints do the talking.</p></div>
					</li>
					<li data-reveal>
						<span class="principle-n">03</span>
						<div><h3>Salt and street.</h3><p>Lines drawn from ocean swells, worn on pavement. The same shirt for both halves of the day.</p></div>
					</li>
				</ol>
				<a class="btn btn-ghost" href="<?php echo drip_url( 'about' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>">Read the story <?php echo drip_icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
			</div>
		</div>
	</section>

	<?php if ( $drip_black && $drip_white ) : ?>
	<section class="tones" aria-label="Shop by color">
		<?php
		foreach ( array(
			'black' => array( $drip_black, 'Night set', 'Silver and foam ink on black.' ),
			'white' => array( $drip_white, 'Day set', 'Graphite and silver ink on white.' ),
		) as $drip_key => $drip_tone_row ) :
			?>
			<a class="tone-panel tone-<?php echo esc_attr( $drip_key ); ?>" href="<?php echo esc_url( add_query_arg( 'tone', $drip_key, drip_wc_url( 'shop' ) ) ); ?>">
				<?php echo drip_image( $drip_tone_row[0]->get_image_id(), 'large', 'tone-img', '' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<span class="tone-text">
					<span class="eyebrow"><?php echo esc_html( $drip_tone_row[1] ); ?></span>
					<span class="tone-name"><?php echo esc_html( ucfirst( $drip_key ) ); ?></span>
					<span class="tone-note"><?php echo esc_html( $drip_tone_row[2] ); ?></span>
					<span class="link-arrow">Shop <?php echo esc_html( $drip_key ); ?> <?php echo drip_icon( 'arrow', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
				</span>
			</a>
		<?php endforeach; ?>
	</section>
	<?php endif; ?>

	<?php if ( $drip_next ) : ?>
	<section class="section next" aria-labelledby="next-title">
		<div class="wrap">
			<div class="section-head">
				<div>
					<p class="eyebrow">03 — Next swell</p>
					<h2 class="section-title" id="next-title"><?php echo esc_html( implode( '. ', array_map( function ( $p ) { return drip_split_name( $p->get_name() )['title']; }, $drip_next ) ) . '.' ); ?></h2>
				</div>
				<div class="section-tools">
					<p class="section-note">Not in the shop yet. Get on the list and hear first.</p>
					<a class="btn btn-foam" href="#join">Join the drop list</a>
				</div>
			</div>
			<div class="grid next-grid">
				<?php
				foreach ( $drip_next as $drip_p ) {
					drip_card( $drip_p, array( 'size' => 'tall' ) );
				}
				?>
			</div>
		</div>
	</section>
	<?php endif; ?>

	<?php if ( $drip_cap ) : ?>
		<?php $drip_cap_name = drip_split_name( $drip_cap->get_name() ); ?>
	<section class="section cap" aria-labelledby="cap-title">
		<div class="wrap cap-grid">
			<a class="cap-media" href="<?php echo esc_url( $drip_cap->get_permalink() ); ?>" data-reveal>
				<?php echo drip_image( $drip_cap->get_image_id(), 'large', 'cap-img', $drip_cap->get_name() ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			</a>
			<div class="cap-copy">
				<p class="eyebrow">04 — Up top</p>
				<h2 class="section-title" id="cap-title">The drop,<br>on your head.</h2>
				<p class="lede"><?php echo esc_html( wp_strip_all_tags( $drip_cap->get_short_description() ) ); ?></p>
				<p class="cap-price"><?php echo wp_kses_post( $drip_cap->get_price_html() ); ?></p>
				<a class="btn btn-foam" href="<?php echo esc_url( $drip_cap->get_permalink() ); ?>">Shop the <?php echo esc_html( $drip_cap_name['title'] ); ?> <?php echo drip_icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
			</div>
		</div>
	</section>
	<?php endif; ?>

</main>
<?php
get_footer();
