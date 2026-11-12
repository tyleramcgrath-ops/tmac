<?php
/**
 * The work: the sites that make up the Works page.
 *
 * One array, one entry per site, so adding or dropping a piece of work never
 * means touching the template. Each entry needs a matching screenshot at
 * assets/img/work-{slug}.webp; mcg_img() skips any entry whose file is
 * missing rather than leaving a grey box, so a half-finished entry degrades
 * quietly.
 *
 * On the copy: every 'line' below is the site's own description of itself,
 * taken from its meta description or its opening paragraph. Nothing here
 * claims a result, a budget, a date or a scope of work, because none of that
 * is knowable from the sites themselves. If you want a role or an outcome on
 * a card, write it into 'line' yourself — do not let it be guessed.
 *
 * @package McGrath_Chrome
 */

defined( 'ABSPATH' ) || exit;

/**
 * Every piece of work, in the order it appears on the page.
 *
 * slug   basename of the screenshot in assets/img, minus the work- prefix
 * name   the site's name as it styles itself
 * host   bare domain, shown in the frame's address bar
 * url    where the card links
 * tag    sector, in two or three words
 * line   the site's own one-line account of what it is
 *
 * @return array<int,array<string,string>>
 */
function mcg_works() {
	return array(
		array(
			'slug' => 'saysites',
			'name' => 'SaySites',
			'host' => 'saysites.com',
			'url'  => 'https://saysites.com/',
			'tag'  => 'Software',
			'line' => 'Tell Sofie about your business and watch your website appear. Then say anything you want changed, in plain words.',
		),
		array(
			'slug' => 'wehaverehabs',
			'name' => 'We Have Rehabs',
			'host' => 'wehaverehabs.com',
			'url'  => 'https://wehaverehabs.com/',
			'tag'  => 'Retreats & recovery',
			'line' => 'Hand-selected retreats and treatment programs for the mind, body and spirit, in places that feel like they were made for you.',
		),
		array(
			'slug' => 'lawmatchnow',
			'name' => 'LawMatchNow',
			'host' => 'lawmatchnow.com',
			'url'  => 'https://lawmatchnow.com/',
			'tag'  => 'Legal directory',
			'line' => 'Search attorneys by practice area and city across all 50 states, read plain-English legal guides, and request a free case review.',
		),
		array(
			'slug' => 'palmtreesurf',
			'name' => 'Palm Tree Surf',
			'host' => 'palmtreesurf.com',
			'url'  => 'https://palmtreesurf.com/',
			'tag'  => 'Surf & tours',
			'line' => 'Surf lessons, fishing charters, boat tours and wildlife trips, booked with local guides in one place.',
		),
		array(
			'slug' => 'drip',
			'name' => 'DRIP Clothing Company',
			'host' => 'dripclothingcompany.com',
			'url'  => 'https://dripclothingcompany.com/',
			'tag'  => 'Apparel',
			'line' => 'Surf-meets-street apparel. Heavyweight back print graphic tees, hoodies, crewnecks and caps designed between the break and the block.',
		),
		array(
			'slug' => 'kinoko',
			'name' => 'Kinoko',
			'host' => 'eatkinoko.com',
			'url'  => 'https://eatkinoko.com/',
			'tag'  => 'Restaurant',
			'line' => 'A NOLA-born restaurant with a modern take on a Japanese staple, creating inspired sushi and Japanese combinations.',
		),
		array(
			'slug' => 'coastlinebuilders',
			'name' => 'Coastline Builders',
			'host' => 'coastlinebuildersfl.com',
			'url'  => 'https://coastlinebuildersfl.com/',
			'tag'  => 'Home building',
			'line' => 'A Jupiter contractor specialising in custom residential construction, renovations and coastal home improvements across Palm Beach County.',
		),
		array(
			'slug' => 'tylermcgrath',
			'name' => 'Tyler McGrath',
			'host' => 'tylermcgrath.com',
			'url'  => 'https://tylermcgrath.com/',
			'tag'  => 'Studio',
			'line' => 'Awaken the Compass. Web design, marketing and SEO work, behind a door you have to open first.',
		),
		array(
			'slug' => 'dbistro',
			'name' => 'D’s Bistro',
			'host' => 'dbistrocr.com',
			'url'  => 'https://dbistrocr.com/',
			'tag'  => 'Restaurant',
			'line' => 'A hidden jungle gem in the heart of Tamarindo. Fresh, locally sourced breakfast and lunch served in a lush garden.',
		),
		array(
			'slug' => 'eliteelectrical',
			'name' => 'Elite Electrical Concepts',
			'host' => 'eec-fl.com',
			'url'  => 'https://eec-fl.com/',
			'tag'  => 'Electrical',
			'line' => 'Residential, commercial and EV charger installation across Deerfield Beach and South Florida.',
		),
		array(
			'slug' => 'tamarindomarketing',
			'name' => 'Tamarindo Marketing',
			'host' => 'tamarindomarketing.com',
			'url'  => 'https://tamarindomarketing.com/',
			'tag'  => 'Marketing',
			'line' => 'Full service marketing for local businesses across Tamarindo and the surrounding areas of Guanacaste, Costa Rica.',
		),
		array(
			'slug' => 'comfyhuman',
			'name' => 'ComfyHuman',
			'host' => 'comfyhuman.com',
			'url'  => 'https://comfyhuman.com/',
			'tag'  => 'Publishing',
			'line' => 'A site about pillows, and cushions, and warmth, and blankets, and all the things that make life a little more comfortable.',
		),
	);
}

/**
 * One card: the browser frame, the screenshot, and the line of type under it.
 *
 * The frame is a plain address bar rather than a drawn window: it names the
 * real domain, which is the one piece of proof a portfolio screenshot
 * otherwise lacks.
 *
 * @param array $w One entry from mcg_works().
 * @param int   $i Zero-based position, for the index number and the stagger.
 */
function mcg_work_card( $w, $i ) {
	$alt = sprintf(
		/* translators: %s: the name of the site shown in the screenshot. */
		__( 'The %s home page', 'mcgrath-chrome' ),
		$w['name']
	);
	?>
	<a class="wkCard rv" href="<?php echo esc_url( $w['url'] ); ?>"
		target="_blank" rel="noopener"
		data-d="<?php echo (int) ( $i % 2 ); ?>">

		<span class="wkFrame">
			<span class="wkBar" aria-hidden="true">
				<i></i><i></i><i></i>
				<em><?php echo esc_html( $w['host'] ); ?></em>
			</span>
			<span class="wkShot">
				<?php mcg_img( 'work-' . $w['slug'], $alt ); ?>
			</span>
		</span>

		<span class="wkMeta">
			<span class="wkN"><?php echo esc_html( sprintf( '%02d', $i + 1 ) ); ?></span>
			<span class="wkName"><?php echo esc_html( $w['name'] ); ?></span>
			<span class="wkTag"><?php echo esc_html( $w['tag'] ); ?></span>
			<span class="wkLine"><?php echo esc_html( $w['line'] ); ?></span>
			<span class="wkGo">
				<?php esc_html_e( 'Visit site', 'mcgrath-chrome' ); ?>
				<span class="arw" aria-hidden="true">&#8599;</span>
			</span>
		</span>
	</a>
	<?php
}
