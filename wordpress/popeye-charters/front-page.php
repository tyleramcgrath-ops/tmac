<?php
/**
 * Homepage.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

get_header();

$hero_image = popeye_opt( 'hero_image' ) ? popeye_opt( 'hero_image' ) : popeye_img( 'public_6df4_fb82495efd9f484c9512765f3476f647' );
?>

<section class="hero hero--lg hero--left hero--home">
	<img class="hero__bg" src="<?php echo esc_url( $hero_image ); ?>" alt="<?php esc_attr_e( 'Popeye at the marina — golden sunset behind her classic hull', 'popeye-charters' ); ?>" fetchpriority="high">
	<div class="hero__shade" aria-hidden="true"></div>
	<div class="container hero__content">
		<p class="pill pill--glass"><?php echo esc_html( popeye_opt( 'hero_eyebrow' ) ); ?></p>
		<h1 class="hero__title"><?php echo esc_html( popeye_opt( 'hero_title' ) ); ?><br><em><?php echo esc_html( popeye_opt( 'hero_title_em' ) ); ?></em></h1>
		<p class="hero__text"><?php echo esc_html( popeye_opt( 'hero_text' ) ); ?></p>
		<?php if ( popeye_opt( 'hero_note' ) ) : ?>
			<p class="hero__note"><?php echo esc_html( popeye_opt( 'hero_note' ) ); ?></p>
		<?php endif; ?>
		<div class="btn-row">
			<a class="btn btn--gold" href="<?php echo esc_url( popeye_book_url() ); ?>"><?php esc_html_e( 'Book a Charter', 'popeye-charters' ); ?></a>
			<a class="btn btn--ghost" href="<?php echo esc_url( popeye_experiences_url() ); ?>"><?php esc_html_e( 'See Experiences', 'popeye-charters' ); ?></a>
		</div>
	</div>
</section>

<div class="stat-bar">
	<div class="container stat-bar__inner">
		<div><span><?php esc_html_e( 'Home Port', 'popeye-charters' ); ?></span><strong><?php esc_html_e( 'Charleston, SC', 'popeye-charters' ); ?></strong></div>
		<div><span><?php esc_html_e( 'Built', 'popeye-charters' ); ?></span><strong><?php esc_html_e( 'Young Bros. · 1979', 'popeye-charters' ); ?></strong></div>
		<div><span><?php esc_html_e( 'Movie Fame', 'popeye-charters' ); ?></span><strong><?php esc_html_e( 'Popeye · 1980', 'popeye-charters' ); ?></strong></div>
		<div><span><?php esc_html_e( 'Capacity', 'popeye-charters' ); ?></span><strong><?php esc_html_e( 'Up to 10 Guests', 'popeye-charters' ); ?></strong></div>
	</div>
</div>

<section class="section section--ivory">
	<div class="container split">
		<div class="split__text">
			<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Meet Popeye', 'popeye-charters' ); ?></p>
			<h2 class="h-xl"><?php esc_html_e( 'A Boat With Character', 'popeye-charters' ); ?></h2>
			<?php
			// Editor content of the Home page replaces the default intro copy.
			$intro = get_post_field( 'post_content', get_queried_object_id() );
			if ( trim( (string) $intro ) ) :
				echo '<div class="prose">' . apply_filters( 'the_content', $intro ) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput
			else :
				?>
				<p><?php esc_html_e( 'Built in 1979 by the Young Brothers of Cohasset, Massachusetts, Popeye is a lobster-style cruiser with timeless lines, a warm wood interior, and a hull built for the open water. Today she calls Charleston Harbor home — and the harbor has never looked so good.', 'popeye-charters' ); ?></p>
				<p><?php esc_html_e( 'Under the care of Stepp and Rocio, Popeye has been lovingly maintained to offer guests a rare taste of classic coastal charm on the South Carolina coast.', 'popeye-charters' ); ?></p>
			<?php endif; ?>
			<div class="badges">
				<div class="badge"><span><?php esc_html_e( 'Home Port', 'popeye-charters' ); ?></span><strong><?php esc_html_e( 'Charleston', 'popeye-charters' ); ?></strong><small><?php esc_html_e( 'South Carolina', 'popeye-charters' ); ?></small></div>
				<div class="badge"><span><?php esc_html_e( 'Sailing', 'popeye-charters' ); ?></span><strong><?php esc_html_e( '45+ Years', 'popeye-charters' ); ?></strong><small><?php esc_html_e( 'On the Water', 'popeye-charters' ); ?></small></div>
				<div class="badge"><span>1980</span><strong><?php esc_html_e( 'Movie Star', 'popeye-charters' ); ?></strong><small><?php esc_html_e( '(Allegedly)', 'popeye-charters' ); ?></small></div>
			</div>
			<a class="link-arrow" href="<?php echo esc_url( popeye_story_url() ); ?>"><?php esc_html_e( 'Read the full story', 'popeye-charters' ); ?> <?php popeye_the_icon( 'arrow' ); ?></a>
		</div>
		<div class="split__media polaroids">
			<figure class="polaroid polaroid--main">
				<img src="<?php echo esc_url( popeye_img( 'public_46fc_9c29c3b9f3064f5699d8db58f9dd6cc8' ) ); ?>" alt="<?php esc_attr_e( "Popeye's classic wood wheelhouse and helm", 'popeye-charters' ); ?>" loading="lazy">
				<figcaption><?php esc_html_e( 'The Wheelhouse', 'popeye-charters' ); ?></figcaption>
			</figure>
			<figure class="polaroid polaroid--side">
				<img src="<?php echo esc_url( popeye_img( 'public_c286_dd2b787c429e479d9691e5d0c8d797f0' ) ); ?>" alt="<?php esc_attr_e( 'Guests aboard Popeye at sunset', 'popeye-charters' ); ?>" loading="lazy">
				<figcaption><?php esc_html_e( 'Aboard Popeye', 'popeye-charters' ); ?></figcaption>
			</figure>
		</div>
	</div>
</section>

<?php
$featured = new WP_Query(
	array(
		'post_type'      => 'experience',
		'posts_per_page' => 4,
		'orderby'        => 'menu_order',
		'order'          => 'ASC',
		'post_name__in'  => array( 'sunset-cruise', 'harbor-tour', 'private-celebrations', 'custom-charter' ),
		'no_found_rows'  => true,
	)
);
if ( ! $featured->have_posts() ) {
	$featured = new WP_Query( array( 'post_type' => 'experience', 'posts_per_page' => 4, 'orderby' => 'menu_order', 'order' => 'ASC' ) );
}
$total = (int) wp_count_posts( 'experience' )->publish;
if ( $featured->have_posts() ) :
	?>
	<section class="section section--navy section--rope-bottom">
		<div class="container">
			<header class="section-head">
				<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Charter Experiences', 'popeye-charters' ); ?></p>
				<h2><?php esc_html_e( 'What Will Your Day Look Like?', 'popeye-charters' ); ?></h2>
				<p class="lead"><?php esc_html_e( "Sunset cruises, harbor sightseeing, private celebrations, family adventures — there's an experience for every occasion.", 'popeye-charters' ); ?></p>
			</header>
			<div class="grid grid--4">
				<?php
				while ( $featured->have_posts() ) :
					$featured->the_post();
					get_template_part( 'template-parts/experience-card' );
				endwhile;
				wp_reset_postdata();
				?>
			</div>
			<div class="btn-row btn-row--center">
				<a class="btn btn--gold" href="<?php echo esc_url( popeye_experiences_url() ); ?>">
					<?php
					/* translators: %d: number of experiences */
					echo esc_html( sprintf( __( 'See All %d Experiences', 'popeye-charters' ), $total ) );
					?>
					<?php popeye_the_icon( 'arrow' ); ?>
				</a>
			</div>
		</div>
	</section>
<?php endif; ?>

<section class="section section--cream">
	<div class="container">
		<header class="section-head">
			<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Gallery', 'popeye-charters' ); ?></p>
			<h2><?php esc_html_e( 'Scenes From the Water', 'popeye-charters' ); ?></h2>
			<p class="lead"><?php esc_html_e( 'From golden sunrises to movie stills — every corner of Popeye tells a different story.', 'popeye-charters' ); ?></p>
		</header>
		<?php get_template_part( 'template-parts/gallery-grid', null, array( 'items' => array_slice( popeye_content( 'gallery' ), 0, 6 ) ) ); ?>
		<p class="center"><a class="link-arrow" href="<?php echo esc_url( popeye_gallery_url() ); ?>"><?php esc_html_e( 'View the full gallery', 'popeye-charters' ); ?> <?php popeye_the_icon( 'arrow' ); ?></a></p>
	</div>
</section>

<?php get_template_part( 'template-parts/testimonials' ); ?>
<?php get_template_part( 'template-parts/faq' ); ?>

<?php
$posts = new WP_Query(
	array(
		'post_type'           => 'post',
		'posts_per_page'      => 3,
		'ignore_sticky_posts' => true,
	)
);
if ( $posts->have_posts() ) :
	?>
	<section class="section section--parchment">
		<div class="container">
			<header class="section-head">
				<p class="eyebrow eyebrow--gold"><?php esc_html_e( "Captain's Log", 'popeye-charters' ); ?></p>
				<h2><?php esc_html_e( 'Plan Your Perfect Charter', 'popeye-charters' ); ?></h2>
				<p class="lead"><?php esc_html_e( 'Guides, inspiration, and local knowledge from the crew of Popeye — everything you need before you step aboard.', 'popeye-charters' ); ?></p>
			</header>
			<div class="grid grid--3">
				<?php
				while ( $posts->have_posts() ) :
					$posts->the_post();
					get_template_part( 'template-parts/post-card' );
				endwhile;
				wp_reset_postdata();
				?>
			</div>
			<div class="btn-row btn-row--center">
				<a class="btn btn--outline-dark" href="<?php echo esc_url( popeye_blog_url() ); ?>">
					<?php
					$count = (int) wp_count_posts()->publish;
					/* translators: %d: number of posts */
					echo esc_html( sprintf( _n( 'Browse all %d guide', 'Browse all %d guides', $count, 'popeye-charters' ), $count ) );
					?>
					<?php popeye_the_icon( 'arrow' ); ?>
				</a>
			</div>
		</div>
	</section>
<?php endif; ?>

<?php get_template_part( 'template-parts/cta-band' ); ?>

<?php
get_footer();
