<?php
/**
 * Template Name: Our Story
 *
 * The page's own editor content (if any) is shown after the intro.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

get_header();

get_template_part(
	'template-parts/page-hero',
	null,
	array(
		'image'   => popeye_img( 'public_583e_c4c50122f0be43ec90b249a5001ec9c7' ),
		'eyebrow' => __( 'Our Story', 'popeye-charters' ),
		'title'   => __( 'The Legend of Popeye', 'popeye-charters' ),
		'text'    => __( 'Part boat, part time capsule, possibly part movie star', 'popeye-charters' ),
		'size'    => 'lg',
	)
);
?>

<section class="section section--ivory">
	<div class="container container--narrow center">
		<p class="lead-serif"><?php esc_html_e( 'Some boats are built to work. Others are built to endure. Popeye was built for both — and along the way, she may have become a movie star.', 'popeye-charters' ); ?></p>
	</div>
	<div class="container split split--top">
		<div class="split__text">
			<h3 class="h-md"><?php esc_html_e( 'Born on the New England Coast', 'popeye-charters' ); ?></h3>
			<p><?php esc_html_e( 'Popeye is a 1979 Young Brothers lobster boat, crafted in Cohasset, Massachusetts, by a family of boatbuilders known for their uncompromising commitment to quality. The Young Brothers built vessels for a living — rugged, seaworthy boats designed to handle the punishing New England waters day after day, season after season.', 'popeye-charters' ); ?></p>
			<p><?php esc_html_e( "With her classic downeast lines, deep hull, and warm wood interior, Popeye embodies the best of that tradition. Step inside the wheelhouse and you'll find original wood paneling, a classic ship's wheel, and instruments that tell the story of decades at sea.", 'popeye-charters' ); ?></p>
			<p><?php esc_html_e( 'She was built to be practical, but her beauty is undeniable — the kind that comes from honest craftsmanship, not cosmetic flourish.', 'popeye-charters' ); ?></p>
			<div class="badges badges--square">
				<div class="badge"><span>1979</span><strong><?php esc_html_e( 'Young Bros.', 'popeye-charters' ); ?></strong><small><?php esc_html_e( 'Cohasset, MA', 'popeye-charters' ); ?></small></div>
				<div class="badge"><span><?php esc_html_e( 'Type', 'popeye-charters' ); ?></span><strong><?php esc_html_e( 'Lobster Boat', 'popeye-charters' ); ?></strong><small><?php esc_html_e( 'Downeast Style', 'popeye-charters' ); ?></small></div>
				<div class="badge"><span><?php esc_html_e( 'At Sea', 'popeye-charters' ); ?></span><strong><?php esc_html_e( '45+ Years', 'popeye-charters' ); ?></strong><small><?php esc_html_e( '& Counting', 'popeye-charters' ); ?></small></div>
			</div>
		</div>
		<div class="split__media">
			<figure class="polaroid">
				<img src="<?php echo esc_url( popeye_img( 'public_46fc_9c29c3b9f3064f5699d8db58f9dd6cc8' ) ); ?>" alt="<?php esc_attr_e( "Popeye's warm wood wheelhouse", 'popeye-charters' ); ?>" loading="lazy">
				<figcaption><?php esc_html_e( 'The Wheelhouse — all original wood', 'popeye-charters' ); ?></figcaption>
			</figure>
		</div>
	</div>
	<div class="container">
		<div class="grid grid--3 photo-strip" data-lightbox>
			<?php
			foreach ( array(
				'public_34b2_2e24aef9a5c34cf2a499b905dcb7dcee' => __( 'Popeye at the marina at sunset', 'popeye-charters' ),
				'public_2c6f_27187fdb371947b38874246d662372ee' => __( "View from Popeye's aft deck underway", 'popeye-charters' ),
				'public_105e_d19ecaaa679349798fb8b43bdba0936a' => __( 'Popeye docked at the marina', 'popeye-charters' ),
			) as $img => $alt ) :
				?>
				<a href="<?php echo esc_url( popeye_img( $img ) ); ?>" data-caption="<?php echo esc_attr( $alt ); ?>"><img src="<?php echo esc_url( popeye_img( $img ) ); ?>" alt="<?php echo esc_attr( $alt ); ?>" loading="lazy"></a>
			<?php endforeach; ?>
		</div>
		<p class="center home-port"><?php popeye_the_icon( 'pin' ); ?> <strong><?php esc_html_e( 'Home Port', 'popeye-charters' ); ?></strong> — <?php esc_html_e( 'Charleston Harbor, South Carolina — where every trip is a tour of history, beauty, and open water.', 'popeye-charters' ); ?></p>
	</div>
</section>

<section class="section section--parchment">
	<div class="container split">
		<div class="split__media polaroids">
			<figure class="polaroid polaroid--main">
				<img src="<?php echo esc_url( popeye_img( 'public_2bc3_b468179afe45400786a1199c93721adf' ) ); ?>" alt="<?php esc_attr_e( 'Stepp and Rocio — owners of Popeye', 'popeye-charters' ); ?>" loading="lazy">
				<figcaption><?php esc_html_e( 'Stepp & Rocio — at home on the Lowcountry coast', 'popeye-charters' ); ?></figcaption>
			</figure>
			<figure class="polaroid polaroid--mini">
				<img src="<?php echo esc_url( popeye_img( 'public_fc65_731ac94f857b4a678172cf1ddf5d7c20' ) ); ?>" alt="<?php esc_attr_e( 'Stepp and Rocio enjoying time on the water', 'popeye-charters' ); ?>" loading="lazy">
			</figure>
		</div>
		<div class="split__text">
			<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Your Hosts', 'popeye-charters' ); ?></p>
			<h2 class="h-xl"><?php esc_html_e( 'Meet the Owners', 'popeye-charters' ); ?></h2>
			<p class="script-gold"><?php esc_html_e( 'Stepp & Rocio', 'popeye-charters' ); ?></p>
			<p><?php esc_html_e( "When Stepp Sydnor stumbled upon Popeye sitting in Alabama, he didn't just see a classic boat — he saw a calling. Together with his wife Rocio, they recognized something rare: a vessel with a soul worth sharing with the world.", 'popeye-charters' ); ?></p>
			<p><?php esc_html_e( 'Stepp and Rocio bring warmth, sea legs, and an infectious love for the water to every charter. Their genuine enthusiasm for Popeye and for the people who come aboard is evident the moment you step on deck. Every trip feels less like a charter and more like a day out with friends who happen to own the coolest boat in Charleston Harbor.', 'popeye-charters' ); ?></p>
			<p><?php esc_html_e( "Ask them about the boat's Hollywood past. Ask them about the bridge. Ask them about the dolphins. They've got a story for all of it.", 'popeye-charters' ); ?></p>
			<blockquote class="pull-quote">
				<p><?php esc_html_e( '"We didn\'t buy a boat. We found a partner for the life we wanted to live — on the water, with people who become friends by the end of the day."', 'popeye-charters' ); ?></p>
				<cite>— Stepp Sydnor</cite>
			</blockquote>
		</div>
	</div>
</section>

<section class="section section--navy">
	<div class="container">
		<header class="section-head">
			<p class="pill pill--dark"><?php esc_html_e( 'At the Helm', 'popeye-charters' ); ?></p>
			<h2><?php esc_html_e( 'Meet Your Captain', 'popeye-charters' ); ?></h2>
		</header>
		<div class="split split--top captain">
			<div class="split__media">
				<figure class="polaroid">
					<img src="<?php echo esc_url( popeye_img( 'public_4e58_906b59a2c36841a7aed1637c888031e2' ) ); ?>" alt="<?php esc_attr_e( 'Captain Jeff Jacobs — USCG 100-Ton Master, Popeye Charters', 'popeye-charters' ); ?>" loading="lazy">
					<figcaption><?php esc_html_e( 'Captain Jeff Jacobs — Charleston Harbor', 'popeye-charters' ); ?></figcaption>
				</figure>
				<div class="license-card">
					<span class="eyebrow eyebrow--gold"><?php esc_html_e( 'Licensed & Certified', 'popeye-charters' ); ?></span>
					<strong><?php esc_html_e( 'USCG 100-Ton', 'popeye-charters' ); ?></strong>
					<small><?php esc_html_e( "Master Captain's License", 'popeye-charters' ); ?></small>
				</div>
			</div>
			<div class="split__text">
				<p class="pill pill--dark"><?php esc_html_e( 'Your Captain', 'popeye-charters' ); ?></p>
				<h3 class="h-lg"><?php esc_html_e( 'Captain Jeff Jacobs', 'popeye-charters' ); ?></h3>
				<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'U.S. Coast Guard 100-Ton Master · 35+ Years at Sea', 'popeye-charters' ); ?></p>
				<p><?php esc_html_e( 'Captain Jeff Jacobs brings more than thirty-five years of professional marine experience to every charter aboard Popeye. A U.S. Coast Guard licensed 100-Ton Master, Jeff has commanded private and charter yachts ranging from 40 to 84 feet throughout the Eastern United States and the Caribbean — accumulating a record defined by safe passage-making, meticulous seamanship, and a calm command presence that guests consistently remark on.', 'popeye-charters' ); ?></p>
				<p><?php esc_html_e( "Jeff works closely with Stepp and Rocio to deliver every charter with professionalism and care. Whether you're out for a sunset cruise or an overnight passage, you're in experienced hands.", 'popeye-charters' ); ?></p>
				<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Licenses & Certifications', 'popeye-charters' ); ?></p>
				<ul class="cert-list">
					<li>USCG 100-Ton Master License</li>
					<li>CPR · BLS · First Aid Certified</li>
					<li>Fire &amp; Chemical Combustion Training</li>
					<li>Man Overboard (MOB) Certified</li>
					<li>Basic Survival Training (BST)</li>
					<li>APCA Drug Consortium Member</li>
				</ul>
			</div>
		</div>
	</div>
</section>

<section class="section section--navy-dark">
	<div class="container">
		<header class="section-head">
			<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Hollywood Heritage', 'popeye-charters' ); ?></p>
			<h2><?php esc_html_e( 'From the Silver Screen', 'popeye-charters' ); ?><br><em class="teal"><?php esc_html_e( 'to Your Charter', 'popeye-charters' ); ?></em></h2>
			<p class="lead"><?php esc_html_e( "According to multiple previous owners, Popeye appeared as the sailor man's own boat in the 1980 film starring Robin Williams — making every charter a brush with cinematic history.", 'popeye-charters' ); ?></p>
		</header>
		<div class="split split--top">
			<div class="split__media film-stack" data-lightbox>
				<figure class="film-main">
					<a href="<?php echo esc_url( popeye_img( '95db6b4e53c847a9844482058ca95cac' ) ); ?>" data-caption="<?php esc_attr_e( 'Sweethaven Village, Malta — filming location of the 1980 Popeye movie', 'popeye-charters' ); ?>"><img src="<?php echo esc_url( popeye_img( '95db6b4e53c847a9844482058ca95cac' ) ); ?>" alt="<?php esc_attr_e( 'The Popeye boat at Sweethaven Village in Malta — used in the 1980 film', 'popeye-charters' ); ?>" loading="lazy"></a>
					<figcaption><?php esc_html_e( 'Sweethaven Village, Malta — filming location of the 1980 Popeye movie', 'popeye-charters' ); ?></figcaption>
				</figure>
				<div class="grid grid--2">
					<a href="<?php echo esc_url( popeye_img( 'public_1fb4_0d1fa8b595034410b666708f21835d87' ) ); ?>" data-caption="1980 Popeye movie poster"><img src="<?php echo esc_url( popeye_img( 'public_1fb4_0d1fa8b595034410b666708f21835d87' ) ); ?>" alt="<?php esc_attr_e( '1980 Popeye movie poster starring Robin Williams and Shelley Duvall', 'popeye-charters' ); ?>" loading="lazy"></a>
					<a href="<?php echo esc_url( popeye_img( 'public_d339_ee732259813844259aed51d985daebbe' ) ); ?>" data-caption="Robin Williams as Popeye"><img src="<?php echo esc_url( popeye_img( 'public_d339_ee732259813844259aed51d985daebbe' ) ); ?>" alt="<?php esc_attr_e( 'Robin Williams as Popeye the Sailor Man in the 1980 film', 'popeye-charters' ); ?>" loading="lazy"></a>
				</div>
			</div>
			<div class="film-card">
				<p class="eyebrow eyebrow--gold center"><?php esc_html_e( 'The 1980 Film', 'popeye-charters' ); ?></p>
				<h3><?php esc_html_e( "Popeye's Own Boat in the Classic Film", 'popeye-charters' ); ?></h3>
				<p><?php echo wp_kses( __( 'The 1980 <em>Popeye</em> movie — starring <strong>Robin Williams</strong> and <strong>Shelley Duvall</strong> — was filmed on location in Malta, where the iconic Sweethaven Village was built just for the production.', 'popeye-charters' ), array( 'em' => array(), 'strong' => array() ) ); ?></p>
				<p><?php echo wp_kses( __( 'According to previous owners, our vessel was outfitted with movie props and appeared as <strong>Popeye\'s own boat</strong> in the film. Although the hull number was changed and full verification remains inconclusive, the story has been passed down through every owner since.', 'popeye-charters' ), array( 'strong' => array() ) ); ?></p>
				<p class="small"><?php esc_html_e( "We believe you may be stepping aboard a unique piece of movie history — and we hope you enjoy your charter. Don't forget to eat your spinach!", 'popeye-charters' ); ?></p>
				<p class="script-gold center"><?php esc_html_e( '"I yam what I yam and that\'s all what I yam!"', 'popeye-charters' ); ?></p>
				<div class="grid grid--2" data-lightbox>
					<a href="<?php echo esc_url( popeye_img( 'public_a861_cf8d7e47078a4d5bb7aae1d621420b70' ) ); ?>" data-caption="Cast aboard boats during filming"><img src="<?php echo esc_url( popeye_img( 'public_a861_cf8d7e47078a4d5bb7aae1d621420b70' ) ); ?>" alt="<?php esc_attr_e( 'Cast aboard boats during filming of the 1980 Popeye movie', 'popeye-charters' ); ?>" loading="lazy"></a>
					<a href="<?php echo esc_url( popeye_img( 'public_8850_58d93c2e033541038246839ebaba25c5' ) ); ?>" data-caption="Brutus on set"><img src="<?php echo esc_url( popeye_img( 'public_8850_58d93c2e033541038246839ebaba25c5' ) ); ?>" alt="<?php esc_attr_e( 'Brutus (Paul L. Smith) on set of the 1980 Popeye movie', 'popeye-charters' ); ?>" loading="lazy"></a>
				</div>
			</div>
		</div>
	</div>
</section>

<section class="section section--cream">
	<div class="container">
		<header class="section-head">
			<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Fun Facts', 'popeye-charters' ); ?></p>
			<h2><?php esc_html_e( 'Popeye by the Numbers', 'popeye-charters' ); ?></h2>
		</header>
		<div class="numbers">
			<div><strong>1979</strong><span><?php esc_html_e( 'Year Built', 'popeye-charters' ); ?></span></div>
			<div><strong>45+</strong><span><?php esc_html_e( 'Years on the Water', 'popeye-charters' ); ?></span></div>
			<div><strong>1</strong><span><?php esc_html_e( 'Rumored Movie', 'popeye-charters' ); ?></span></div>
			<div><strong>&infin;</strong><span><?php esc_html_e( 'Stories to Tell', 'popeye-charters' ); ?></span></div>
		</div>
		<?php
		while ( have_posts() ) :
			the_post();
			if ( trim( get_the_content() ) ) :
				?>
				<div class="prose container--narrow"><?php the_content(); ?></div>
				<?php
			endif;
		endwhile;
		?>
		<div class="btn-row btn-row--center">
			<a class="btn btn--gold" href="<?php echo esc_url( popeye_book_url() ); ?>"><?php esc_html_e( 'Book Your Experience', 'popeye-charters' ); ?></a>
		</div>
	</div>
</section>

<?php
get_footer();
