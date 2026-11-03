<?php
/**
 * Experiences listing (/experiences/).
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

get_header();

get_template_part(
	'template-parts/page-hero',
	null,
	array(
		'image'    => popeye_img( 'public_fbab_6229d9679bfe4e8c8741d48790e51b52' ),
		'eyebrow'  => __( 'Charter Experiences · Charleston, SC', 'popeye-charters' ),
		'title'    => __( 'Every Charter,', 'popeye-charters' ),
		'title_em' => __( 'A Different Adventure', 'popeye-charters' ),
		'text'     => __( 'From golden-hour sunset cruises to Charleston Harbor sightseeing, private celebrations to family days — Popeye is ready for whatever you have in mind.', 'popeye-charters' ),
		'size'     => 'lg',
	)
);
?>

<section class="section section--ivory">
	<div class="container">
		<?php if ( have_posts() ) : ?>
			<div class="grid grid--2 exp-list">
				<?php
				while ( have_posts() ) :
					the_post();
					?>
					<article class="exp-card">
						<a class="exp-card__media" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
							<img src="<?php echo esc_url( popeye_exp_image( get_the_ID(), 'popeye-wide' ) ); ?>" alt="" loading="lazy">
							<?php if ( popeye_exp( 'duration_short' ) ) : ?>
								<span class="exp-tile__badge"><?php popeye_the_icon( 'clock' ); ?> <?php echo esc_html( popeye_exp( 'duration_short' ) ); ?></span>
							<?php endif; ?>
						</a>
						<div class="exp-card__body">
							<p class="eyebrow eyebrow--gold"><?php echo esc_html( popeye_exp( 'tagline' ) ); ?></p>
							<h2 class="exp-card__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
							<p><?php echo esc_html( get_the_excerpt() ); ?></p>
							<a class="link-arrow" href="<?php the_permalink(); ?>"><?php esc_html_e( 'Explore this experience', 'popeye-charters' ); ?> <?php popeye_the_icon( 'arrow' ); ?></a>
						</div>
					</article>
				<?php endwhile; ?>
			</div>
		<?php else : ?>
			<p class="center"><?php esc_html_e( 'No experiences yet. Run Appearance → Popeye Setup to import them.', 'popeye-charters' ); ?></p>
		<?php endif; ?>

		<aside class="callout">
			<h3><?php esc_html_e( "Don't see what you're looking for?", 'popeye-charters' ); ?></h3>
			<p><?php esc_html_e( "Stepp has never said no to a great idea. Tell us what you're dreaming up.", 'popeye-charters' ); ?></p>
			<div class="btn-row btn-row--center">
				<?php $custom = get_page_by_path( 'custom-charter', OBJECT, 'experience' ); ?>
				<?php if ( $custom ) : ?>
					<a class="btn btn--gold" href="<?php echo esc_url( get_permalink( $custom ) ); ?>"><?php esc_html_e( 'Custom Charter', 'popeye-charters' ); ?></a>
				<?php endif; ?>
				<a class="btn btn--ghost" href="<?php echo esc_url( popeye_contact_url() ); ?>"><?php esc_html_e( 'Get in Touch', 'popeye-charters' ); ?></a>
			</div>
		</aside>
	</div>
</section>

<?php
get_footer();
