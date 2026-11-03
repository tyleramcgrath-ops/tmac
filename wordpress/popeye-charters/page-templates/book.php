<?php
/**
 * Template Name: Book a Charter
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

get_header();

get_template_part(
	'template-parts/page-hero',
	null,
	array(
		'image'   => popeye_img( 'public_fbab_6229d9679bfe4e8c8741d48790e51b52' ),
		'eyebrow' => __( 'Book a Charter · Charleston, SC', 'popeye-charters' ),
		'title'   => __( 'Plan Your Day on the Water', 'popeye-charters' ),
		'text'    => __( "Choose your experience, fill in the details, and we'll take care of the rest.", 'popeye-charters' ),
		'size'    => 'sm',
	)
);
?>

<section class="section section--ivory">
	<div class="container container--form">
		<div class="form-card">
			<?php popeye_render_form( 'booking', __( 'Submit Inquiry', 'popeye-charters' ) ); ?>
		</div>
		<p class="eyebrow center"><?php esc_html_e( 'All inquiries are handled by Stepp & Rocio', 'popeye-charters' ); ?></p>

		<div class="contact-box">
			<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Charter Bookings — Stepp & Rocio', 'popeye-charters' ); ?></p>
			<p><a href="tel:<?php echo esc_attr( popeye_opt( 'phone_raw' ) ); ?>"><?php echo esc_html( popeye_opt( 'phone' ) ); ?></a></p>
			<p><a href="mailto:<?php echo esc_attr( antispambot( popeye_opt( 'email' ) ) ); ?>"><?php echo esc_html( antispambot( popeye_opt( 'email' ) ) ); ?></a></p>
		</div>

		<?php
		while ( have_posts() ) :
			the_post();
			if ( trim( get_the_content() ) ) :
				?>
				<div class="prose"><?php the_content(); ?></div>
				<?php
			endif;
		endwhile;
		?>

		<h3 class="h-md center"><?php esc_html_e( 'What to Expect', 'popeye-charters' ); ?></h3>
		<div class="grid grid--2 feature-grid">
			<?php foreach ( popeye_content( 'expect' ) as $e ) : ?>
				<div class="feature"><h4><?php echo esc_html( $e[0] ); ?></h4><p><?php echo esc_html( $e[1] ); ?></p></div>
			<?php endforeach; ?>
		</div>
	</div>

	<div class="container">
		<div class="aboard">
			<img src="<?php echo esc_url( popeye_img( 'public_94dc_0601782452514a6b819b72d48b349bac' ) ); ?>" alt="<?php esc_attr_e( 'Guests enjoying the aft deck at sunset', 'popeye-charters' ); ?>" loading="lazy">
			<div class="aboard__text">
				<h3><?php esc_html_e( 'Step Aboard Something Special', 'popeye-charters' ); ?></h3>
				<p><?php esc_html_e( "Popeye's mahogany doors swing open, the Charleston skyline stretches out behind you, and the water does the rest. Every charter is a chance to slow down, breathe deep, and make memories that stick.", 'popeye-charters' ); ?></p>
				<p class="script-gold"><?php esc_html_e( '(Spinach-fueled arm strength not required, but appreciated)', 'popeye-charters' ); ?></p>
			</div>
		</div>
		<div class="grid grid--3 photo-strip" data-lightbox>
			<?php
			foreach ( array(
				'public_8555_1417e3bb588a49a0aa0e9522fddd7af9' => __( 'Guests on the aft deck with the bridge behind', 'popeye-charters' ),
				'public_7970_769ca322dcc04625abc94f30ba3076e6' => __( "USS Yorktown from Popeye's deck", 'popeye-charters' ),
				'public_4114_7215344bbf124e30a59b01153b1bd2d3' => __( 'Sunset from the deck', 'popeye-charters' ),
			) as $img => $alt ) :
				?>
				<a href="<?php echo esc_url( popeye_img( $img ) ); ?>" data-caption="<?php echo esc_attr( $alt ); ?>"><img src="<?php echo esc_url( popeye_img( $img ) ); ?>" alt="<?php echo esc_attr( $alt ); ?>" loading="lazy"></a>
			<?php endforeach; ?>
		</div>
		<p class="center muted-brown"><?php esc_html_e( 'Want to explore all our experiences first?', 'popeye-charters' ); ?></p>
		<div class="btn-row btn-row--center"><a class="btn btn--outline-dark" href="<?php echo esc_url( popeye_experiences_url() ); ?>"><?php esc_html_e( 'View All Experiences', 'popeye-charters' ); ?></a></div>
	</div>
</section>

<?php
get_footer();
