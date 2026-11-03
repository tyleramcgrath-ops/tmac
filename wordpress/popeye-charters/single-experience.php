<?php
/**
 * Single experience page.
 *
 * @package Popeye_Charters
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	$book_url   = add_query_arg( 'charter', rawurlencode( get_the_title() ), popeye_book_url() );
	$cta        = popeye_exp( 'cta_label' ) ? popeye_exp( 'cta_label' ) : __( 'Book This Charter', 'popeye-charters' );
	$highlights = popeye_lines( popeye_exp( 'highlights' ) );
	$included   = popeye_lines( popeye_exp( 'included' ) );
	$gallery    = popeye_lines( popeye_exp( 'gallery' ) );
	?>
	<section class="hero hero--md hero--left hero--bottom">
		<img class="hero__bg" src="<?php echo esc_url( popeye_exp_image( get_the_ID(), 'full' ) ); ?>" alt="" fetchpriority="high">
		<div class="hero__shade" aria-hidden="true"></div>
		<div class="container hero__content">
			<nav class="breadcrumbs" aria-label="<?php esc_attr_e( 'Breadcrumb', 'popeye-charters' ); ?>">
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'popeye-charters' ); ?></a> /
				<a href="<?php echo esc_url( popeye_experiences_url() ); ?>"><?php esc_html_e( 'Experiences', 'popeye-charters' ); ?></a> /
				<span aria-current="page"><?php the_title(); ?></span>
			</nav>
			<?php if ( popeye_exp( 'tagline' ) ) : ?>
				<p class="eyebrow eyebrow--gold"><?php echo esc_html( popeye_exp( 'tagline' ) ); ?></p>
			<?php endif; ?>
			<h1 class="hero__title"><?php the_title(); ?></h1>
		</div>
	</section>

	<div class="stat-bar">
		<div class="container stat-bar__inner stat-bar__inner--3">
			<div><span><?php esc_html_e( 'Duration', 'popeye-charters' ); ?></span><strong><?php echo esc_html( popeye_exp( 'duration' ) ); ?></strong></div>
			<div><span><?php esc_html_e( 'Capacity', 'popeye-charters' ); ?></span><strong><?php echo esc_html( popeye_exp( 'capacity' ) ? popeye_exp( 'capacity' ) : __( 'Up to 10 Guests', 'popeye-charters' ) ); ?></strong></div>
			<div><span><?php esc_html_e( 'Perfect For', 'popeye-charters' ); ?></span><strong><?php echo esc_html( popeye_exp( 'perfect_for_short' ) ); ?></strong></div>
		</div>
	</div>

	<section class="section section--ivory">
		<div class="container exp-layout">
			<div class="exp-layout__main">
				<div class="prose prose--lead-first">
					<?php the_content(); ?>
				</div>

				<?php if ( $highlights ) : ?>
					<h2 class="h-md"><?php esc_html_e( 'What Makes This Special', 'popeye-charters' ); ?></h2>
					<div class="grid grid--2 feature-grid">
						<?php foreach ( $highlights as $h ) : ?>
							<div class="feature">
								<h4><?php echo esc_html( $h[0] ); ?></h4>
								<?php if ( isset( $h[1] ) ) : ?>
									<p><?php echo esc_html( $h[1] ); ?></p>
								<?php endif; ?>
							</div>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
			</div>

			<aside class="exp-layout__side">
				<div class="book-card">
					<p class="eyebrow eyebrow--gold"><?php esc_html_e( 'Ready?', 'popeye-charters' ); ?></p>
					<h3><?php the_title(); ?></h3>
					<a class="btn btn--gold btn--block" href="<?php echo esc_url( $book_url ); ?>"><?php echo esc_html( $cta ); ?></a>
					<a class="btn btn--ghost btn--block" href="<?php echo esc_url( popeye_contact_url() ); ?>"><?php esc_html_e( 'Ask a Question', 'popeye-charters' ); ?></a>
					<p class="book-card__note"><?php esc_html_e( 'No credit card required to inquire', 'popeye-charters' ); ?></p>
				</div>
				<?php if ( $included ) : ?>
					<div class="side-card side-card--parchment">
						<h4><?php esc_html_e( "What's Included", 'popeye-charters' ); ?></h4>
						<ul class="dot-list">
							<?php foreach ( $included as $row ) : ?>
								<li><?php echo esc_html( $row[0] ); ?></li>
							<?php endforeach; ?>
						</ul>
					</div>
				<?php endif; ?>
				<?php if ( popeye_exp( 'perfect_for' ) ) : ?>
					<div class="side-card">
						<h4><?php esc_html_e( 'Perfect For', 'popeye-charters' ); ?></h4>
						<p><?php echo esc_html( popeye_exp( 'perfect_for' ) ); ?></p>
					</div>
				<?php endif; ?>
			</aside>
		</div>

		<?php if ( $gallery ) : ?>
			<div class="container">
				<h2 class="h-md"><?php esc_html_e( 'Gallery', 'popeye-charters' ); ?></h2>
				<div class="grid grid--3 exp-gallery" data-lightbox>
					<?php foreach ( $gallery as $g ) : ?>
						<figure>
							<a href="<?php echo esc_url( popeye_img( $g[0] ) ); ?>" data-caption="<?php echo esc_attr( isset( $g[1] ) ? $g[1] : '' ); ?>">
								<img src="<?php echo esc_url( popeye_img( $g[0] ) ); ?>" alt="<?php echo esc_attr( isset( $g[1] ) ? $g[1] : '' ); ?>" loading="lazy">
							</a>
						</figure>
					<?php endforeach; ?>
				</div>
			</div>
		<?php endif; ?>

		<?php if ( popeye_exp( 'quote' ) ) : ?>
			<div class="container">
				<figure class="quote-card">
					<span class="rule" aria-hidden="true"></span>
					<blockquote><p><?php echo esc_html( popeye_exp( 'quote' ) ); ?></p></blockquote>
					<?php if ( popeye_exp( 'quote_cite' ) ) : ?>
						<figcaption>— <?php echo esc_html( popeye_exp( 'quote_cite' ) ); ?></figcaption>
					<?php endif; ?>
				</figure>
			</div>
		<?php endif; ?>

		<div class="container center exp-footer-cta">
			<h3 class="h-md"><?php esc_html_e( 'Ready to make it happen?', 'popeye-charters' ); ?></h3>
			<p class="muted-brown"><?php esc_html_e( 'Stepp & Rocio are ready when you are.', 'popeye-charters' ); ?></p>
			<div class="btn-row btn-row--center">
				<a class="btn btn--gold" href="<?php echo esc_url( $book_url ); ?>"><?php echo esc_html( $cta ); ?></a>
			</div>
			<p><a class="link-arrow" href="<?php echo esc_url( popeye_experiences_url() ); ?>">&larr; <?php esc_html_e( 'All Experiences', 'popeye-charters' ); ?></a></p>
		</div>
	</section>
	<?php
endwhile;

get_footer();
