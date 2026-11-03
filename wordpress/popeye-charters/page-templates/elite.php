<?php
/**
 * Template Name: Elite Cruises
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

get_header();

/**
 * Render a row of linked images.
 *
 * @param array  $imgs  stem => alt.
 * @param string $class Extra class.
 */
$popeye_img_row = function ( $imgs, $class = 'grid--3' ) {
	echo '<div class="grid ' . esc_attr( $class ) . ' photo-strip" data-lightbox>';
	foreach ( $imgs as $img => $alt ) {
		echo '<a href="' . esc_url( popeye_img( $img ) ) . '" data-caption="' . esc_attr( $alt ) . '"><img src="' . esc_url( popeye_img( $img ) ) . '" alt="' . esc_attr( $alt ) . '" loading="lazy"></a>';
	}
	echo '</div>';
};
?>

<?php
get_template_part(
	'template-parts/page-hero',
	null,
	array(
		'image'    => popeye_img( 'public_fbab_6229d9679bfe4e8c8741d48790e51b52' ),
		'eyebrow'  => __( 'Elite Special Cruises', 'popeye-charters' ),
		'title'    => __( 'Beyond the', 'popeye-charters' ),
		'title_em' => __( 'Ordinary Charter', 'popeye-charters' ),
		'text'     => __( 'Two exclusive multi-day cruise experiences through the Lowcountry — available only aboard Popeye, with Stepp & Rocio.', 'popeye-charters' ),
		'size'     => 'lg',
	)
);
?>
<div class="stat-bar">
	<div class="container stat-bar__inner stat-bar__inner--3">
		<div><strong><?php esc_html_e( 'Maximum 10 Guests', 'popeye-charters' ); ?></strong></div>
		<div><strong><?php esc_html_e( 'Fully Private', 'popeye-charters' ); ?></strong></div>
		<div><strong><?php esc_html_e( 'Call for Special Pricing', 'popeye-charters' ); ?></strong></div>
	</div>
</div>

<section class="section section--ivory" id="notebook">
	<div class="container">
		<header class="section-head">
			<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Experience I', 'popeye-charters' ); ?></p>
			<h2 class="h-xl"><?php esc_html_e( 'Lowcountry', 'popeye-charters' ); ?><br><em><?php esc_html_e( 'Notebook Cruise', 'popeye-charters' ); ?></em></h2>
			<p class="lead"><?php esc_html_e( "Drift through the quiet, moss-draped creeks of the South Carolina Lowcountry and cruise past the iconic house from one of America's most beloved films.", 'popeye-charters' ); ?></p>
		</header>
		<?php
		$popeye_img_row(
			array(
				'public_706d_Noahs-house-in-The-Notebook-after' => __( 'Lowcountry plantation gardens — South Carolina', 'popeye-charters' ),
				'public_5152_images__4_'                        => __( 'Spanish moss draped over Lowcountry trees', 'popeye-charters' ),
				'public_878a_4170df0dc46b42dc8d8c3e88815ef32d'  => __( 'The Notebook — 2004 film poster', 'popeye-charters' ),
			)
		);
		?>
		<div class="split split--top">
			<div class="split__text">
				<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'About the Film', 'popeye-charters' ); ?></p>
				<h3 class="h-lg"><?php esc_html_e( 'The Notebook — 2004', 'popeye-charters' ); ?></h3>
				<p><?php esc_html_e( 'Released on June 25, 2004, The Notebook is an iconic romantic drama directed by Nick Cassavetes, based on Nicholas Sparks\' 1996 novel. It tells the decades-spanning love story of Noah (Ryan Gosling) and Allie (Rachel McAdams), framed by an elderly man reading to a nursing home resident.', 'popeye-charters' ); ?></p>
				<p><?php esc_html_e( 'The film grossed $118.3 million and is lauded for its portrayal of enduring love. Shot heavily in South Carolina, including Charleston and Cypress Gardens.', 'popeye-charters' ); ?></p>
				<ul class="tag-list"><li>Ryan Gosling</li><li>Rachel McAdams</li><li>Nick Cassavetes</li><li>$118.3M Gross</li></ul>
			</div>
			<figure class="polaroid">
				<img src="<?php echo esc_url( popeye_img( 'public_9696_31b509c56c584ecf93c33b247f5c3798' ) ); ?>" alt="<?php esc_attr_e( "Ryan Gosling at the front door of Noah's house in The Notebook", 'popeye-charters' ); ?>" loading="lazy">
				<figcaption><?php esc_html_e( "Ryan Gosling at the front door of Noah's house", 'popeye-charters' ); ?></figcaption>
			</figure>
		</div>

		<div class="location-card">
			<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'The Filming Location', 'popeye-charters' ); ?></p>
			<h3 class="h-lg"><?php esc_html_e( 'Martins Point Plantation', 'popeye-charters' ); ?></h3>
			<p class="muted-brown"><?php esc_html_e( 'Wadmalaw Island, South Carolina', 'popeye-charters' ); ?></p>
			<div class="grid grid--2">
				<figure class="before-after">
					<img src="<?php echo esc_url( popeye_img( 'public_f53e_0cf59e3b98d047e0b6db265b4f018a75' ) ); ?>" alt="<?php esc_attr_e( "Noah's house before renovation in The Notebook", 'popeye-charters' ); ?>" loading="lazy">
					<figcaption><strong><?php esc_html_e( 'As Seen in the Film', 'popeye-charters' ); ?></strong><?php esc_html_e( 'The dilapidated house Noah restores for Allie', 'popeye-charters' ); ?></figcaption>
				</figure>
				<figure class="before-after">
					<img src="<?php echo esc_url( popeye_img( 'public_b606_1f5d50b5e5ab48eba1b85d5f815fa844' ) ); ?>" alt="<?php esc_attr_e( 'Martins Point Plantation — the real Notebook house today', 'popeye-charters' ); ?>" loading="lazy">
					<figcaption><strong><?php esc_html_e( 'The Real House Today', 'popeye-charters' ); ?></strong><?php esc_html_e( 'The 1850s plantation home on Wadmalaw Island, SC', 'popeye-charters' ); ?></figcaption>
				</figure>
			</div>
			<div class="grid grid--3 mini-facts">
				<div><strong>1850s</strong><span><?php esc_html_e( 'Era of the plantation home', 'popeye-charters' ); ?></span></div>
				<div><strong><?php esc_html_e( 'Private Residence', 'popeye-charters' ); ?></strong><span><?php esc_html_e( 'Not a public tour site — the best view is from the Intracoastal Waterway', 'popeye-charters' ); ?></span></div>
				<div><strong><?php esc_html_e( 'Wadmalaw Island, SC', 'popeye-charters' ); ?></strong><span><?php esc_html_e( 'Stepp knows exactly where to anchor for the perfect view', 'popeye-charters' ); ?></span></div>
			</div>
		</div>

		<div class="grid grid--4 feature-grid">
			<div class="feature"><h4><?php esc_html_e( 'The Notebook House', 'popeye-charters' ); ?></h4><p><?php esc_html_e( 'Cruise past the real filming location on the ICW', 'popeye-charters' ); ?></p></div>
			<div class="feature"><h4><?php esc_html_e( 'Lowcountry Beauty', 'popeye-charters' ); ?></h4><p><?php esc_html_e( 'Spanish moss, tidal creeks and marshland', 'popeye-charters' ); ?></p></div>
			<div class="feature"><h4><?php esc_html_e( 'Up to 10 Guests', 'popeye-charters' ); ?></h4><p><?php esc_html_e( 'Fully private — your group, your experience', 'popeye-charters' ); ?></p></div>
			<div class="feature"><h4><?php esc_html_e( 'Call for Pricing', 'popeye-charters' ); ?></h4><p><?php esc_html_e( 'Custom pricing tailored to your group and dates', 'popeye-charters' ); ?></p></div>
		</div>
		<div class="btn-row btn-row--center"><a class="btn btn--gold" href="#popeye-form-elite"><?php esc_html_e( 'Inquire About This Cruise', 'popeye-charters' ); ?></a></div>
	</div>
</section>

<section class="section section--parchment" id="georgetown">
	<div class="container">
		<header class="section-head">
			<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Experience II', 'popeye-charters' ); ?></p>
			<h2 class="h-xl"><?php esc_html_e( 'Charleston to', 'popeye-charters' ); ?><br><em><?php esc_html_e( 'Georgetown', 'popeye-charters' ); ?></em></h2>
			<p class="lead"><?php esc_html_e( 'Cast off from Charleston Harbor and cruise the Intracoastal Waterway north to Georgetown, South Carolina — one of the oldest and most charming port towns in America. Arrive by water the way sailors have for centuries.', 'popeye-charters' ); ?></p>
		</header>
		<?php
		$popeye_img_row(
			array(
				'public_7390_ea99d85ebabc463c8fe23ac6bf6df2c0' => __( 'Aerial view of Georgetown waterway with sailboats', 'popeye-charters' ),
				'public_4e2f_4ff27514030d49da8d4a3d6280f2f345' => __( 'Georgetown aerial with clock tower and waterway', 'popeye-charters' ),
				'public_eeef_15a704ee29d747439729fd7cfab6687e' => __( 'Historic Front Street Georgetown', 'popeye-charters' ),
				'public_b312_abd9cc95cd554d679e8afa7f1e50a490' => __( 'Georgetown SC Historic Waterfront sign', 'popeye-charters' ),
			),
			'grid--4'
		);
		?>
		<div class="split split--top">
			<div class="split__text">
				<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Along the Intracoastal Waterway', 'popeye-charters' ); ?></p>
				<p><?php esc_html_e( 'The Intracoastal Waterway (ICW) is a diverse, 3,000-mile corridor teeming with wildlife, featuring manatees, bottlenose dolphins, and American alligators in its shallow, brackish waters.', 'popeye-charters' ); ?></p>
				<p><?php esc_html_e( 'The marshes, swamps, and wetlands are critical habitats for migratory birds, including herons, egrets, and bald eagles, alongside mammals such as deer.', 'popeye-charters' ); ?></p>
			</div>
			<figure class="polaroid"><img src="<?php echo esc_url( popeye_img( 'public_ba06_15771bad-989f-49f2-85fd-8dce91a4b9c8' ) ); ?>" alt="<?php esc_attr_e( 'Georgetown waterway aerial overview', 'popeye-charters' ); ?>" loading="lazy"></figure>
		</div>

		<h3 class="h-md center"><?php esc_html_e( 'Wildlife You May Encounter', 'popeye-charters' ); ?></h3>
		<div class="grid grid--4 wildlife" data-lightbox>
			<?php
			foreach ( array(
				'public_44e9_2ce8c47ad4f54cb3bc03b5e6fa1b2cce' => __( 'Bottlenose Dolphin', 'popeye-charters' ),
				'public_6442_62bcb8e791754f8883909373181e1695' => __( 'Dolphin Pods', 'popeye-charters' ),
				'public_c5c9_7d23679f2ab1423eaf7b3dce4b1c3da6' => __( 'American Alligator', 'popeye-charters' ),
				'public_d593_7f2f614251314f6f8aee5daeee1a063b' => __( 'Lowcountry Wildlife', 'popeye-charters' ),
			) as $img => $label ) :
				?>
				<figure><a href="<?php echo esc_url( popeye_img( $img ) ); ?>" data-caption="<?php echo esc_attr( $label ); ?>"><img src="<?php echo esc_url( popeye_img( $img ) ); ?>" alt="<?php echo esc_attr( $label ); ?>" loading="lazy"></a><figcaption><?php echo esc_html( $label ); ?></figcaption></figure>
			<?php endforeach; ?>
		</div>

		<div class="split split--top">
			<div class="split__media">
				<?php
				$popeye_img_row(
					array(
						'public_fad7_28c6d27d489246edb5eec5583a4e2c16' => __( 'Georgetown Harborwalk', 'popeye-charters' ),
						'public_122b_16362482-9930-42be-a360-01a0bb87c70e' => __( 'Georgetown historic shops and streetscape', 'popeye-charters' ),
					),
					'grid--2'
				);
				?>
			</div>
			<div class="split__text">
				<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'The Destination', 'popeye-charters' ); ?></p>
				<h3 class="h-lg"><?php esc_html_e( 'Historic Georgetown, SC', 'popeye-charters' ); ?></h3>
				<p><?php esc_html_e( "Georgetown is a gem of the Lowcountry: antebellum architecture, award-winning restaurants, and a maritime history as rich as Charleston's own. Stepp will take you there in style and ensure the journey is every bit as memorable as the destination.", 'popeye-charters' ); ?></p>
				<p><?php esc_html_e( 'Stay one night or two at the Georgetown Hotel — a beautifully appointed waterfront property — then cruise back to Charleston at your leisure. This is the ultimate Lowcountry adventure.', 'popeye-charters' ); ?></p>
			</div>
		</div>

		<div class="grid grid--4 feature-grid">
			<div class="feature"><h4><?php esc_html_e( '1 Night', 'popeye-charters' ); ?></h4><p><?php esc_html_e( 'Cruise up, enjoy Georgetown, return the next day', 'popeye-charters' ); ?></p></div>
			<div class="feature"><h4><?php esc_html_e( '2 Nights', 'popeye-charters' ); ?></h4><p><?php esc_html_e( 'More time to explore Georgetown at your own pace', 'popeye-charters' ); ?></p></div>
			<div class="feature"><h4><?php esc_html_e( 'The Georgetown Hotel', 'popeye-charters' ); ?></h4><p><?php esc_html_e( 'A beautiful waterfront hotel in the heart of historic Georgetown — perfectly positioned for your arrival by sea.', 'popeye-charters' ); ?></p></div>
			<div class="feature"><h4><?php esc_html_e( 'Call for Special Pricing', 'popeye-charters' ); ?></h4><p><?php esc_html_e( 'Pricing is tailored to group size, nights, and dates. Contact Stepp directly.', 'popeye-charters' ); ?></p></div>
		</div>
		<div class="btn-row btn-row--center"><a class="btn btn--gold" href="#popeye-form-elite"><?php esc_html_e( 'Inquire About This Cruise', 'popeye-charters' ); ?></a></div>
	</div>
</section>

<section class="section section--navy" id="inquire">
	<div class="container container--form">
		<header class="section-head">
			<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Elite Cruises', 'popeye-charters' ); ?></p>
			<h2><?php esc_html_e( 'Contact Stepp & Rocio', 'popeye-charters' ); ?></h2>
			<p class="lead"><?php esc_html_e( 'These exclusive experiences are priced individually based on your group, dates, and itinerary. Reach out and Stepp will get back to you personally.', 'popeye-charters' ); ?></p>
		</header>
		<div class="contact-strip">
			<a href="tel:<?php echo esc_attr( popeye_opt( 'phone_raw' ) ); ?>"><?php popeye_the_icon( 'phone' ); ?> <span><small><?php esc_html_e( 'Call or Text', 'popeye-charters' ); ?></small><?php echo esc_html( popeye_opt( 'phone' ) ); ?></span></a>
			<a href="mailto:<?php echo esc_attr( antispambot( popeye_opt( 'email' ) ) ); ?>"><?php popeye_the_icon( 'mail' ); ?> <span><small><?php esc_html_e( 'Email', 'popeye-charters' ); ?></small><?php echo esc_html( antispambot( popeye_opt( 'email' ) ) ); ?></span></a>
		</div>
		<p class="center divider-text"><?php esc_html_e( '— Or send an inquiry below —', 'popeye-charters' ); ?></p>
		<div class="form-card">
			<?php popeye_render_form( 'elite', __( 'Send Inquiry to Stepp & Rocio', 'popeye-charters' ) ); ?>
		</div>
		<p class="center small"><?php esc_html_e( 'Prefer to call? Stepp & Rocio will respond with pricing tailored to your group.', 'popeye-charters' ); ?> <a href="<?php echo esc_url( popeye_contact_url() ); ?>"><?php esc_html_e( 'Visit our main contact page', 'popeye-charters' ); ?></a></p>
	</div>
</section>

<section class="section section--ivory">
	<div class="container center">
		<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Also available', 'popeye-charters' ); ?></p>
		<h3 class="h-md"><?php esc_html_e( 'Looking for a day charter instead?', 'popeye-charters' ); ?></h3>
		<p class="muted-brown"><?php esc_html_e( 'Popeye offers a full range of day and evening charter experiences around Charleston Harbor.', 'popeye-charters' ); ?></p>
		<a class="link-arrow" href="<?php echo esc_url( popeye_experiences_url() ); ?>"><?php esc_html_e( 'View All Experiences', 'popeye-charters' ); ?> <?php popeye_the_icon( 'arrow' ); ?></a>
	</div>
</section>

<?php
get_footer();
