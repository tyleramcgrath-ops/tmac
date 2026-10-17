<?php
/**
 * Homepage: hero with the "I'm looking for" picker, swipe demo, city explorer,
 * how it works, Globe+, FAQ and the sign-up form.
 *
 * @package gag
 */

get_header();

$gag_join_link = get_theme_mod( 'gag_join_url', '' );
$gag_price     = get_theme_mod( 'gag_price', '$14.99/month' );
$gag_signup    = isset( $_GET['signup'] ) ? sanitize_key( wp_unslash( $_GET['signup'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification

// Illustrative demo profiles (photos of models), not members.
$gag_demo = array(
	array( 'name' => 'Valeria', 'age' => 27, 'city' => 'Cartagena, Colombia', 'langs' => 'Spanish, English', 'wants' => 'Looking for a relationship', 'tag' => 'Salsa on Fridays', 'quote' => 'Sunset walks in the old town, and a man who calls when he says he will.', 'photo' => 'valeria.jpg', 'pos' => '50% 22%', 'alt' => 'Valeria, with long curly hair, on an evening street', 'likesBack' => true ),
	array( 'name' => 'Isabela', 'age' => 25, 'city' => 'Medellín, Colombia', 'langs' => 'Spanish, some English', 'wants' => 'Marriage & family', 'tag' => 'Wants kids', 'quote' => 'Sunday lunch with my family is sacred. Bring flowers, not excuses.', 'photo' => 'isabela.jpg', 'pos' => '55% 35%', 'alt' => 'Isabela smiling with a pink flower in her hair', 'likesBack' => true ),
	array( 'name' => 'Camila', 'age' => 29, 'city' => 'Mexico City, Mexico', 'langs' => 'Spanish, English', 'wants' => 'Looking for a relationship', 'tag' => 'Open to relocating', 'quote' => 'Tacos at 1am, museums on Sunday. Keep up with me.', 'photo' => 'camila.jpg', 'pos' => '58% 30%', 'alt' => 'Camila leaning against a stone column on a lit street at night', 'likesBack' => false ),
	array( 'name' => 'Daniela', 'age' => 26, 'city' => 'Barranquilla, Colombia', 'langs' => 'Spanish', 'wants' => 'Dating to see where it goes', 'tag' => 'Beach every weekend', 'quote' => "Teach me your favorite song and I'll teach you to dance to it.", 'photo' => 'daniela.jpg', 'pos' => '55% 30%', 'alt' => 'Daniela with long dark hair in a tropical garden', 'likesBack' => true ),
	array( 'name' => 'Mariana', 'age' => 28, 'city' => 'Rio de Janeiro, Brazil', 'langs' => 'Portuguese, English', 'wants' => 'Looking for a relationship', 'tag' => 'Loves to travel', 'quote' => 'The city lights are better with someone to share them.', 'photo' => 'mariana.jpg', 'pos' => '42% 40%', 'alt' => 'Mariana smiling over her shoulder on a city street at night', 'likesBack' => true ),
);
foreach ( $gag_demo as &$gag_p ) {
	$gag_p['photo'] = gag_asset( 'img/' . $gag_p['photo'] );
}
unset( $gag_p );

$gag_cities = array(
	array( 'city' => 'Cartagena', 'country' => 'Colombia', 'tz' => 'America/Bogota', 'lang' => 'Spanish', 'date' => 'Rooftop cocktails over the walled old town at sunset' ),
	array( 'city' => 'Medellín', 'country' => 'Colombia', 'tz' => 'America/Bogota', 'lang' => 'Spanish', 'date' => 'Coffee in El Poblado, then salsa in Laureles' ),
	array( 'city' => 'Mexico City', 'country' => 'Mexico', 'tz' => 'America/Mexico_City', 'lang' => 'Spanish', 'date' => 'A long lunch in Roma Norte that turns into dinner' ),
	array( 'city' => 'Rio de Janeiro', 'country' => 'Brazil', 'tz' => 'America/Sao_Paulo', 'lang' => 'Portuguese', 'date' => 'Sunset at Arpoador, then live samba in Lapa' ),
	array( 'city' => 'Buenos Aires', 'country' => 'Argentina', 'tz' => 'America/Argentina/Buenos_Aires', 'lang' => 'Spanish', 'date' => 'Malbec in Palermo and a late tango lesson' ),
	array( 'city' => 'Lima', 'country' => 'Peru', 'tz' => 'America/Lima', 'lang' => 'Spanish', 'date' => 'Ceviche by the sea in Barranco' ),
	array( 'city' => 'San Juan', 'country' => 'Puerto Rico', 'tz' => 'America/Puerto_Rico', 'lang' => 'Spanish, English', 'date' => 'Walking the blue streets of Old San Juan' ),
	array( 'city' => 'Santo Domingo', 'country' => 'Dominican Republic', 'tz' => 'America/Santo_Domingo', 'lang' => 'Spanish', 'date' => 'Bachata night in the Zona Colonial' ),
);

$gag_faqs = array(
	array( 'Is it free to join?', 'Yes. Creating a profile, swiping, matching, messaging and video dates are free. Globe+ is optional and adds Passport, unlimited likes, and seeing who likes you.' ),
	array( 'Are the women real?', 'Members sign up as themselves, adults only, with their own photos. Anyone can be reported in one tap, and fake profiles are removed. A video date is the surest way to know.' ),
	array( 'Do I need to speak Spanish or Portuguese?', 'No. Every profile lists the languages she speaks, and plenty of members speak English. A video date is the fastest way to find your rhythm.' ),
	array( 'How do video dates work?', 'Once you match, either of you can start a video call right in the chat. No phone numbers or other apps, and you can hang up anytime.' ),
	array( 'How do you stop scams?', 'Messages that ask for money, gift cards or crypto are flagged in the chat, and anyone who asks is removed. Real love never needs a wire transfer.' ),
	array( 'Can I cancel Globe+ anytime?', 'Yes. Cancel from your account in a couple of taps, and you keep Globe+ until the end of the month you paid for.' ),
);
?>

<section class="hero" aria-label="<?php esc_attr_e( 'Welcome', 'gag' ); ?>">
	<div class="hero-media"><img src="<?php echo esc_url( gag_asset( 'img/hero.jpg' ) ); ?>" alt="<?php esc_attr_e( 'A woman lying on the sand at the beach, looking at the camera', 'gag' ); ?>" fetchpriority="high"></div>
	<div class="hero-shade" aria-hidden="true"></div>
	<div class="hero-fade" aria-hidden="true"></div>
	<div class="hero-body">
		<div class="wrap">
			<div class="hero-copy">
				<p class="label rise"><?php esc_html_e( 'Serious dating, worldwide', 'gag' ); ?></p>
				<h1 class="rise d1"><?php esc_html_e( 'Meet someone', 'gag' ); ?> <em class="gold"><?php esc_html_e( 'worth the flight.', 'gag' ); ?></em></h1>
				<p class="lede rise d2"><?php esc_html_e( 'Real women from Cartagena to Rio who want something serious. See what she’s looking for, get to know her on video, then go meet her.', 'gag' ); ?></p>
				<div class="rise d3" data-picker data-join-base="<?php echo esc_url( $gag_join_link ); ?>">
					<p class="picker-label"><?php esc_html_e( 'I’m looking for', 'gag' ); ?></p>
					<div class="chips" role="group" aria-label="<?php esc_attr_e( 'What are you looking for?', 'gag' ); ?>">
						<button type="button" class="chip" aria-pressed="true" data-looking="relationship" data-cta="<?php esc_attr_e( 'Find a relationship', 'gag' ); ?>"><?php esc_html_e( 'A relationship', 'gag' ); ?></button>
						<button type="button" class="chip" aria-pressed="false" data-looking="marriage" data-cta="<?php esc_attr_e( 'Find your future wife', 'gag' ); ?>"><?php esc_html_e( 'Marriage & family', 'gag' ); ?></button>
						<button type="button" class="chip" aria-pressed="false" data-looking="dating" data-cta="<?php esc_attr_e( 'Start meeting women', 'gag' ); ?>"><?php esc_html_e( 'Dating to see', 'gag' ); ?></button>
					</div>
					<div class="cta-row" style="margin-top:24px">
						<a class="btn btn-gold btn-lg" href="<?php echo esc_url( gag_join_url( 'relationship' ) ); ?>" data-cta>
							<span data-cta-label><?php esc_html_e( 'Find a relationship', 'gag' ); ?></span>
							<?php echo gag_icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
						</a>
						<a class="link-underline" href="#try"><?php esc_html_e( 'Try a swipe first', 'gag' ); ?></a>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="trust">
		<div class="wrap">
			<ul>
				<li><?php echo gag_icon( 'heart', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php esc_html_e( 'Everyone says what they’re looking for', 'gag' ); ?></li>
				<li><?php echo gag_icon( 'video', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php esc_html_e( 'Video dates in the app', 'gag' ); ?></li>
				<li><?php echo gag_icon( 'shield', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php esc_html_e( 'Scam shield in every chat', 'gag' ); ?></li>
			</ul>
			<small><?php esc_html_e( 'Photos show models, for illustration', 'gag' ); ?></small>
		</div>
	</div>
</section>

<section id="try" class="section" style="overflow:hidden">
	<div class="glow" style="right:-12rem;top:5rem;width:46rem;height:46rem" aria-hidden="true"></div>
	<div class="wrap try">
		<div class="try-copy">
			<p class="label"><?php esc_html_e( 'Try it now', 'gag' ); ?></p>
			<h2 class="h2"><?php esc_html_e( 'Swipe like', 'gag' ); ?> <em class="gold"><?php esc_html_e( 'you mean it.', 'gag' ); ?></em></h2>
			<p class="lede"><?php esc_html_e( 'Drag the card, or tap the buttons. Every profile tells you what she’s looking for, the languages she speaks, and a little about the life she wants.', 'gag' ); ?></p>
			<ul>
				<li><span class="dot dot-gold"><?php echo gag_icon( 'heart', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span><?php esc_html_e( 'Right or the heart to like', 'gag' ); ?></li>
				<li><span class="dot" aria-hidden="true">✕</span><?php esc_html_e( 'Left or the cross to pass', 'gag' ); ?></li>
				<li><span class="dot"><?php echo gag_icon( 'video', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span><?php esc_html_e( 'When it’s mutual, start a video date', 'gag' ); ?></li>
			</ul>
			<p class="muted" style="font-size:13px"><?php esc_html_e( 'Illustrative profiles. Photos show models.', 'gag' ); ?></p>
		</div>
		<div class="try-demo" data-demo>
			<div class="deck" data-deck>
				<noscript><p class="dim"><?php esc_html_e( 'Turn on JavaScript to try the swipe demo.', 'gag' ); ?></p></noscript>
			</div>
			<div class="deck-controls">
				<button type="button" class="round" data-pass aria-label="<?php esc_attr_e( 'Pass', 'gag' ); ?>">✕</button>
				<span class="count" data-count></span>
				<button type="button" class="round round-gold" data-like aria-label="<?php esc_attr_e( 'Like', 'gag' ); ?>"><?php echo gag_icon( 'heart', 26 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			</div>
			<script type="application/json" data-demo-profiles><?php echo wp_json_encode( $gag_demo ); ?></script>
			<script type="application/json" data-demo-strings><?php echo wp_json_encode( array( 'join' => gag_join_url(), 'logo' => gag_asset( 'img/gag-mark.png' ) ) ); ?></script>
		</div>
	</div>
</section>

<section id="cities" class="section section-alt">
	<div class="wrap">
		<div class="section-head">
			<div>
				<p class="label"><?php esc_html_e( 'Where will you meet her?', 'gag' ); ?></p>
				<h2 class="h2" style="margin-top:16px"><?php esc_html_e( 'Pick a city.', 'gag' ); ?> <em class="gold"><?php esc_html_e( 'See her evening.', 'gag' ); ?></em></h2>
			</div>
			<p><?php esc_html_e( 'Local times are live, so you know when she’s free for a video date.', 'gag' ); ?></p>
		</div>
		<div class="cities" data-cities>
			<div class="city-list" role="group" aria-label="<?php esc_attr_e( 'Cities', 'gag' ); ?>">
				<?php foreach ( $gag_cities as $gag_i => $gag_c ) : ?>
					<button type="button" class="city" aria-pressed="<?php echo 0 === $gag_i ? 'true' : 'false'; ?>" data-index="<?php echo (int) $gag_i; ?>" data-tz="<?php echo esc_attr( $gag_c['tz'] ); ?>">
						<span><?php echo esc_html( $gag_c['city'] ); ?></span><small data-time>--:--</small>
					</button>
				<?php endforeach; ?>
			</div>
			<div class="city-panel" aria-live="polite">
				<img class="watermark" src="<?php echo esc_url( gag_asset( 'img/gag-mark.png' ) ); ?>" alt="">
				<div class="city-top">
					<div>
						<p class="label" style="color:var(--ink-mute)" data-f="country"><?php echo esc_html( $gag_cities[0]['country'] ); ?></p>
						<p class="city-name" data-f="city"><?php echo esc_html( $gag_cities[0]['city'] ); ?></p>
					</div>
					<div>
						<p class="label" style="color:var(--ink-mute);text-align:right"><?php esc_html_e( 'Local time now', 'gag' ); ?></p>
						<p class="city-time gold" data-f="time">--:--</p>
					</div>
				</div>
				<p class="city-mood" data-f="mood"><?php echo esc_html( $gag_cities[0]['city'] . ', ' . $gag_cities[0]['country'] . '.' ); ?></p>
				<div class="city-foot">
					<div><small><?php esc_html_e( 'She speaks', 'gag' ); ?></small><strong data-f="lang"><?php echo esc_html( $gag_cities[0]['lang'] ); ?></strong></div>
					<div class="grow"><small><?php esc_html_e( 'Perfect first date', 'gag' ); ?></small><strong class="dim" data-f="date"><?php echo esc_html( $gag_cities[0]['date'] ); ?></strong></div>
					<a class="btn btn-line" href="<?php echo esc_url( gag_join_url() ); ?>"><?php esc_html_e( 'Meet women in', 'gag' ); ?>&nbsp;<span data-f="city2"><?php echo esc_html( $gag_cities[0]['city'] ); ?></span></a>
				</div>
			</div>
			<script type="application/json" data-cities-json><?php echo wp_json_encode( $gag_cities ); ?></script>
		</div>
	</div>
</section>

<section id="how" class="section">
	<div class="wrap">
		<div class="section-head">
			<h2 class="h2" style="max-width:680px"><?php esc_html_e( 'Three steps from hello', 'gag' ); ?> <em class="gold"><?php esc_html_e( 'to her city.', 'gag' ); ?></em></h2>
			<p><?php esc_html_e( 'No swiping into silence. Everyone here has said what they want, so conversations go somewhere.', 'gag' ); ?></p>
		</div>
		<ol class="steps">
			<li class="step"><p class="step-n gold">01</p><h3><?php esc_html_e( 'Tell us what you want', 'gag' ); ?></h3><p><?php esc_html_e( 'Two minutes: a few photos, where you live, and the kind of relationship you’re after.', 'gag' ); ?></p></li>
			<li class="step"><p class="step-n gold">02</p><h3><?php esc_html_e( 'Match when it’s mutual', 'gag' ); ?></h3><p><?php esc_html_e( 'Browse women across Latin America and beyond. When you both like each other, the chat opens.', 'gag' ); ?></p></li>
			<li class="step"><p class="step-n gold">03</p><h3><?php esc_html_e( 'Video date, then visit', 'gag' ); ?></h3><p><?php esc_html_e( 'See each other face to face in the app first. When it feels right, plan the trip.', 'gag' ); ?></p></li>
		</ol>
		<ul class="features">
			<li><?php echo gag_icon( 'heart', 24 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><h3><?php esc_html_e( 'Her intentions, up front', 'gag' ); ?></h3><p><?php esc_html_e( 'A relationship, marriage, or dating to see: every profile says it plainly.', 'gag' ); ?></p></li>
			<li><?php echo gag_icon( 'video', 24 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><h3><?php esc_html_e( 'Video dates first', 'gag' ); ?></h3><p><?php esc_html_e( 'Talk face to face before anyone books a ticket. No phone numbers swapped.', 'gag' ); ?></p></li>
			<li><?php echo gag_icon( 'translate', 24 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><h3><?php esc_html_e( 'Chat across languages', 'gag' ); ?></h3><p><?php esc_html_e( 'Write in English. Her languages are on her profile, so you know where to start.', 'gag' ); ?></p></li>
			<li><?php echo gag_icon( 'shield', 24 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><h3><?php esc_html_e( 'Scam shield', 'gag' ); ?></h3><p><?php esc_html_e( 'Chats that mention money, gift cards or crypto get flagged on the spot.', 'gag' ); ?></p></li>
		</ul>
	</div>
</section>

<section class="section" style="padding-top:0">
	<div class="wrap">
		<div class="plus">
			<div class="plus-inner">
				<div class="plus-copy">
					<p class="label gold"><?php esc_html_e( 'Globe+', 'gag' ); ?></p>
					<h2 class="h2"><?php esc_html_e( 'Get there faster.', 'gag' ); ?></h2>
					<p class="plus-price"><strong><?php echo esc_html( $gag_price ); ?></strong><span class="dim"><?php esc_html_e( 'cancel anytime', 'gag' ); ?></span></p>
					<a class="btn btn-gold" href="<?php echo esc_url( gag_join_url() ); ?>"><?php esc_html_e( 'Start free, upgrade anytime', 'gag' ); ?></a>
				</div>
				<ul>
					<?php foreach ( array( 'Passport: match in a city before you land', 'See everyone who likes you', 'Unlimited likes', '5 super likes a day' ) as $gag_perk ) : ?>
						<li><?php echo gag_icon( 'check', 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( $gag_perk ); ?></li>
					<?php endforeach; ?>
				</ul>
			</div>
		</div>
	</div>
</section>

<section id="faq" class="section section-alt">
	<div class="wrap faq-grid">
		<div>
			<p class="label"><?php esc_html_e( 'Questions', 'gag' ); ?></p>
			<h2 class="h2"><?php esc_html_e( 'Good to', 'gag' ); ?> <em class="gold"><?php esc_html_e( 'know.', 'gag' ); ?></em></h2>
		</div>
		<div class="faq-list">
			<?php foreach ( $gag_faqs as $gag_i => $gag_q ) : ?>
				<details <?php echo 0 === $gag_i ? 'open' : ''; ?>>
					<summary><?php echo esc_html( $gag_q[0] ); ?><span aria-hidden="true">+</span></summary>
					<p><?php echo esc_html( $gag_q[1] ); ?></p>
				</details>
			<?php endforeach; ?>
		</div>
	</div>
</section>

<section id="join" class="section join">
	<div class="glow" aria-hidden="true"></div>
	<div class="wrap join-inner">
		<?php echo gag_logo( 'full' ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in gag_logo(). ?>
		<h2><?php esc_html_e( 'She’s out there.', 'gag' ); ?> <em class="gold"><?php esc_html_e( 'Go find her.', 'gag' ); ?></em></h2>
		<p class="lede" style="max-width:480px"><?php esc_html_e( 'Free to join. Two minutes to set up. Start meeting women who want the same thing you do.', 'gag' ); ?></p>

		<?php if ( $gag_join_link ) : ?>
			<a class="btn btn-gold btn-lg" href="<?php echo esc_url( $gag_join_link ); ?>"><?php esc_html_e( 'Create your free profile', 'gag' ); ?></a>
		<?php else : ?>
			<form class="signup" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" data-signup>
				<?php if ( 'thanks' === $gag_signup ) : ?>
					<p class="notice notice-ok" role="status"><?php esc_html_e( 'You’re on the list. We’ll email you the moment your profile is ready.', 'gag' ); ?></p>
				<?php elseif ( 'missing' === $gag_signup ) : ?>
					<p class="notice notice-error" role="alert"><?php esc_html_e( 'Add your first name and a valid email, and confirm you’re 18 or older.', 'gag' ); ?></p>
				<?php elseif ( 'error' === $gag_signup ) : ?>
					<p class="notice notice-error" role="alert"><?php esc_html_e( 'That form expired. Please try again.', 'gag' ); ?></p>
				<?php endif; ?>
				<input type="hidden" name="action" value="gag_signup">
				<?php wp_nonce_field( 'gag_signup', 'gag_nonce' ); ?>
				<div class="row">
					<label><?php esc_html_e( 'First name', 'gag' ); ?><input class="field" name="name" required maxlength="40" autocomplete="given-name"></label>
					<label><?php esc_html_e( 'Email', 'gag' ); ?><input class="field" type="email" name="email" required autocomplete="email"></label>
				</div>
				<label><?php esc_html_e( 'I’m looking for', 'gag' ); ?>
					<select class="field" name="looking" data-looking-select>
						<?php foreach ( GAG_LOOKING as $gag_key => $gag_label ) : ?>
							<option value="<?php echo esc_attr( $gag_key ); ?>"><?php echo esc_html( $gag_label ); ?></option>
						<?php endforeach; ?>
					</select>
				</label>
				<label class="hp" aria-hidden="true"><?php esc_html_e( 'Website', 'gag' ); ?><input name="website" tabindex="-1" autocomplete="off"></label>
				<label class="check"><input type="checkbox" name="adult" value="1" required> <?php esc_html_e( 'I’m 18 or older and agree to be emailed about my profile.', 'gag' ); ?></label>
				<button type="submit" class="btn btn-gold btn-lg"><?php esc_html_e( 'Create your free profile', 'gag' ); ?></button>
			</form>
		<?php endif; ?>
	</div>
</section>

<?php
get_footer();
