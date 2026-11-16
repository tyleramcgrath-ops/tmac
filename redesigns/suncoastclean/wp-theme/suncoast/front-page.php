<?php
/**
 * The home page. The design is the theme's; the words in the intro and the reviews are
 * read from the Home page's own content so they stay editable in WordPress.
 */

get_header();

$img   = get_template_directory_uri() . '/assets/img/';
$phone = suncoast_option( 'phone' );
$tel   = 'tel:' . suncoast_option( 'phone_tel' );
$sms   = 'sms:' . suncoast_option( 'phone_tel' );
$parts = suncoast_home_parts();

$featured = null;
$others   = array();
foreach ( $parts['reviews'] as $r ) {
	if ( ! $featured && strpos( $r['name'], 'Gerry' ) === 0 ) {
		$featured = $r;
	} else {
		$others[] = $r;
	}
}
if ( ! $featured && $others ) {
	$featured = array_shift( $others );
}
$svc_link = function ( $slug, $label ) {
	return '<li><a href="' . esc_url( suncoast_url( $slug ) ) . '">' . esc_html( $label ) . '<svg><use href="#arrow"/></svg></a></li>';
};
$stars = '<div class="stars" aria-hidden="true">' . str_repeat( '<svg><use href="#star"/></svg>', 5 ) . '</div>';
?>

<section class="hero">
  <img class="hero-bg" src="<?php echo esc_url( $img . '1600210492486-724fe5c67fb0.jpg' ); ?>" alt="A bright, freshly cleaned living room with sofas, an area rug and tall sunny windows" width="1800" height="1100" fetchpriority="high">
  <div class="wrap">
    <div>
      <p class="eyebrow">Jupiter &amp; the Palm Beaches · Established 1988</p>
      <h1>Carpet, tile and upholstery, <em>cleaned the careful&nbsp;way.</em></h1>
      <p class="lead">Suncoast Cleaning and Restoration cleans carpet, upholstery, tile and grout, drapery and fine area rugs for homes and businesses from Port St. Lucie to Boca Raton, with eco-friendly, allergy-free options and water removal when you need it fast.</p>
      <div class="ctas">
        <a class="btn btn-primary" href="<?php echo esc_attr( $tel ); ?>"><svg aria-hidden="true"><use href="#phone"/></svg>Call <?php echo esc_html( $phone ); ?></a>
        <a class="btn btn-ghost" href="<?php echo esc_attr( $sms ); ?>"><svg aria-hidden="true"><use href="#chat"/></svg>Text us a photo</a>
      </div>
      <p class="note">Bonded, licensed and insured. Every estimate is free.</p>
    </div>
    <?php echo suncoast_estimate_form(); // phpcs:ignore ?>
  </div>
</section>

<div class="trust" aria-label="Credentials">
  <div class="wrap">
    <div><b>1988</b><span>Serving South Florida since</span></div>
    <div><b>BBB</b><span>Better Business Bureau member since 1993</span></div>
    <div><b>IICRC</b><span>Certified firm since 1998</span></div>
    <div><b>Green</b><span>Eco-friendly, allergy-free cleaning options</span></div>
  </div>
</div>

<section class="block intro" id="about">
  <div class="wrap">
    <div>
      <p class="eyebrow"><?php echo esc_html( $parts['h1'] ); ?></p>
      <h2><?php echo esc_html( $parts['heading'] ); ?></h2>
      <?php foreach ( $parts['intro'] as $p ) : ?>
      <p><?php echo esc_html( $p ); ?></p>
      <?php endforeach; ?>
    </div>
    <div>
      <a class="video-card" href="https://www.youtube.com/watch?v=yWZ7fcNIKxA" target="_blank" rel="noopener">
        <img src="<?php echo esc_url( $img . 'yt.jpg' ); ?>" width="480" height="360" alt="" loading="lazy">
        <span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></span>
        <span>Watch: SunCoast Cleaning &amp; Restoration on YouTube</span>
      </a>
    </div>
  </div>
</section>

<section class="block" id="services" style="padding-top:0">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Our services</p>
        <h2>One call for every floor, fabric and surface in the house.</h2>
      </div>
      <p>From a single stained sofa to a whole office, our technicians handle cleaning, pet stains and odors, heavily soiled areas, disinfecting and water removal. <a href="<?php echo esc_url( suncoast_url( 'best-cleaning-services-in-florida' ) ); ?>">See all services</a>.</p>
    </div>
    <div class="svc-groups">
      <div class="svc-group">
        <img class="ph" src="<?php echo esc_url( $img . '1584622650111-993a426fbf0a.jpg' ); ?>" alt="A clean tiled bathroom with a glass shower stall and wood-look floor" width="800" height="500" loading="lazy">
        <h3><span class="icon"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M3 14h18M9 5v14M15 5v14"/></svg></span>Floors</h3>
        <p class="tag">Carpet, tile, grout and stone</p>
        <ul>
          <?php echo $svc_link( 'carpet-cleaning', 'Carpet cleaning' ) . $svc_link( 'green-carpet-cleaning', 'Green carpet cleaning' ) . $svc_link( 'tile-and-grout-cleaning', 'Tile and grout cleaning' ) . $svc_link( 'natural-stone-restoration-and-polishing', 'Natural stone and polishing' ) . $svc_link( 'shower-stall-cleaning', 'Shower stall cleaning' ); // phpcs:ignore ?>
        </ul>
      </div>
      <div class="svc-group">
        <img class="ph" src="<?php echo esc_url( $img . '1555041469-a586c61ea9bc.jpg' ); ?>" alt="A spotless green velvet sofa on a light wood floor" width="800" height="500" loading="lazy">
        <h3><span class="icon"><svg viewBox="0 0 24 24"><path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v4H3z"/><path d="M5 17v2M19 17v2"/></svg></span>Furniture &amp; fabric</h3>
        <p class="tag">Upholstery, leather, rugs and drapes</p>
        <ul>
          <?php echo $svc_link( 'furniture-cleaning-that-gets-out-stains', 'Furniture and upholstery' ) . $svc_link( 'leather-cleaning-and-conditioning', 'Leather cleaning and conditioning' ) . $svc_link( 'area-rug-cleaning', 'Fine area rug cleaning' ) . $svc_link( 'drapery-and-curtain-cleaning', 'Drapery and curtain cleaning' ); // phpcs:ignore ?>
        </ul>
      </div>
      <div class="svc-group">
        <img class="ph" src="<?php echo esc_url( $img . '1628177142898-93e36e4e3a50.jpg' ); ?>" alt="A gloved hand spraying cleaner over a wood surface" width="800" height="500" loading="lazy">
        <h3><span class="icon"><svg viewBox="0 0 24 24"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/></svg></span>Restoration &amp; more</h3>
        <p class="tag">Water removal, ducts, whole homes and businesses</p>
        <ul>
          <?php echo $svc_link( 'water-damage-cleaning', 'Water damage restoration' ) . $svc_link( 'hurricane-clean-up', 'Hurricane clean up' ) . $svc_link( 'air-duct-cleaning', 'Air duct cleaning and sanitizing' ) . $svc_link( 'full-home-cleaning', 'Full home cleaning' ) . $svc_link( 'move-in-cleaning', 'Move in cleaning' ) . $svc_link( 'commercial-cleaning-for-southern-florida-businesses', 'Commercial cleaning' ); // phpcs:ignore ?>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="block feature-split">
  <div class="wrap">
    <div class="fs-img"><img src="<?php echo esc_url( $img . '1527515637462-cff94eecc1ac.jpg' ); ?>" alt="A vacuum lifting colorful confetti out of a deep carpet" width="1200" height="1300" loading="lazy"></div>
    <div class="fs-copy">
      <p class="eyebrow">Carpet cleaning</p>
      <h2>Pet stains, odors and the high-traffic spots you gave up on.</h2>
      <p>Our technicians handle carpet pet stains and odors, heavily soiled areas and carpet disinfecting, and explain every step before they start. Prefer it gentler? Ask for our eco-friendly, allergy-free green cleaning. Trying it yourself first? <a href="<?php echo esc_url( suncoast_url( 'get-that-stain-out' ) ); ?>">Get That Stain Out!</a> has Sun Coast's own instructions for 29 common stains.</p>
      <ul class="ticks">
        <li>Pet stain and odor treatment</li>
        <li>Heavily soiled and high-traffic areas</li>
        <li>Carpet disinfecting</li>
        <li>Green, allergy-free options</li>
      </ul>
      <a class="btn btn-primary" href="<?php echo esc_url( suncoast_url( 'carpet-cleaning' ) ); ?>">About our carpet cleaning<svg aria-hidden="true"><use href="#arrow"/></svg></a>
    </div>
  </div>
</section>

<section class="block why" id="why">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Why Suncoast</p>
        <h2>The name neighbors have recommended for decades.</h2>
      </div>
      <p>We've been cleaning South Florida homes since 1988. Here's what customers mention most.</p>
    </div>
    <div class="why-grid">
      <div><p class="n">01</p><h3>No pressure, no upsell</h3><p>Technicians explain how the cleaning works and quote what you asked for. Nothing more.</p></div>
      <div><p class="n">02</p><h3>Healthier for your family</h3><p>Eco-friendly, allergy-free and green cleaning options for homes with kids and pets.</p></div>
      <div><p class="n">03</p><h3>Certified and accountable</h3><p>An IICRC certified firm since 1998, BBB member since 1993, and bonded, licensed and insured.</p></div>
      <div><p class="n">04</p><h3>Water removal experts</h3><p>The same team that cleans your carpet knows how to get water out and dry things properly.</p></div>
    </div>
  </div>
</section>

<section class="block">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">How it works</p>
        <h2>Clean floors in three easy steps.</h2>
      </div>
    </div>
    <div class="steps">
      <div class="step"><h3>Call, text or send the form</h3><p>Reach us at <a href="<?php echo esc_attr( $tel ); ?>"><?php echo esc_html( $phone ); ?></a>. A photo of the stain or the room helps.</p></div>
      <div class="step"><h3>Get a free estimate</h3><p>We'll tell you what we'll clean, how, and what it costs before we start.</p></div>
      <div class="step"><h3>We arrive on time and clean</h3><p>Our technicians walk you through the process and leave your home looking and smelling fresh.</p></div>
    </div>
  </div>
</section>

<?php if ( $featured ) : ?>
<section class="block reviews" id="reviews">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Here is what people have to say about us</p>
        <h2>What our customers say.</h2>
      </div>
      <p>Letters and notes from customers across Palm Beach and Martin counties, in their own words.</p>
    </div>
    <div class="feature">
      <div class="mark" aria-hidden="true">“</div>
      <div>
        <blockquote><?php echo esc_html( trim( implode( ' ', $featured['lines'] ), '“”' ) ); ?></blockquote>
        <cite><?php echo esc_html( $featured['name'] . ( $featured['place'] ? ', ' . $featured['place'] : '' ) ); ?></cite>
      </div>
    </div>
    <div class="rev-grid">
      <?php foreach ( $others as $r ) : ?>
      <figure class="rev"><?php echo $stars; // phpcs:ignore ?>
        <?php foreach ( $r['lines'] as $line ) : ?><p><?php echo esc_html( $line ); ?></p><?php endforeach; ?>
        <footer><?php echo esc_html( $r['name'] ); ?><?php if ( $r['place'] ) : ?> <span>· <?php echo esc_html( $r['place'] ); ?></span><?php endif; ?></footer>
      </figure>
      <?php endforeach; ?>
    </div>
  </div>
</section>
<?php endif; ?>

<section class="block area" id="area">
  <div class="wrap">
    <div>
      <p class="eyebrow">Service area</p>
      <h2>Based in Jupiter. Cleaning from Port St. Lucie to Boca&nbsp;Raton.</h2>
      <p>We serve homes and businesses across Palm Beach, Martin and St. Lucie counties. <a href="<?php echo esc_url( suncoast_url( 'locations' ) ); ?>">See every town we come to</a>, or call or text and ask.</p>
    </div>
    <ul class="towns">
      <?php foreach ( suncoast_home_towns() as $town => $slug ) : ?>
      <li class="<?php echo $town === 'Jupiter' ? 'home' : ''; ?>"><?php if ( $slug ) : ?><a href="<?php echo esc_url( suncoast_url( $slug ) ); ?>"><?php echo esc_html( $town ); ?></a><?php else : ?><span><?php echo esc_html( $town ); ?></span><?php endif; ?></li>
      <?php endforeach; ?>
    </ul>
  </div>
</section>

<section class="band">
  <div class="wrap">
    <div class="inner">
      <img class="bg" src="<?php echo esc_url( $img . '1631679706909-1844bbd07221.jpg' ); ?>" alt="" width="1600" height="700" loading="lazy">
      <div>
        <h2>Ready for floors that look new again?</h2>
        <p>Call or text for a free estimate. Tell us what needs cleaning and we'll take it from there.</p>
      </div>
      <div class="acts">
        <a class="phone" href="<?php echo esc_attr( $tel ); ?>"><?php echo esc_html( $phone ); ?></a>
        <a class="btn btn-ghost" href="#estimate">Or request an estimate online<svg aria-hidden="true"><use href="#arrow"/></svg></a>
      </div>
    </div>
  </div>
</section>

<?php get_footer(); ?>
