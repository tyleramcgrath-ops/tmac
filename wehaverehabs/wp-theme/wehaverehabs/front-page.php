<?php
/**
 * Homepage.
 *
 * @package WeHaveRehabs
 */

get_header();

$hero_img = whr_image( (int) whr_option( 'hero_image' ), 'whr-hero', array( 'class' => 'hero__img', 'alt' => '', 'loading' => 'eager', 'fetchpriority' => 'high' ), 'palapa.jpg' );
?>

<section class="hero" aria-labelledby="hero-title">
	<?php echo $hero_img; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by whr_image(). ?>
	<div class="hero__shade"></div>
	<div class="hero__body">
		<div class="eyebrow"><?php echo wp_kses_post( whr_text( 'hero_eyebrow' ) ); ?></div>
		<h1 class="hero__title" id="hero-title"><?php echo wp_kses_post( whr_text( 'hero_title' ) ); ?></h1>
		<p class="hero__sub"><?php echo wp_kses_post( whr_text( 'hero_text' ) ); ?></p>
	</div>
</section>

<?php get_template_part( 'template-parts/search-panel' ); ?>

<section class="section welcome">
	<div class="narrow center">
		<img class="mark" src="<?php echo esc_url( whr_asset( 'brand/mark-lotus.svg' ) ); ?>" alt="" width="96" height="52">
		<div class="eyebrow"><?php esc_html_e( 'Welcome', 'wehaverehabs' ); ?></div>
		<p class="big"><?php echo wp_kses_post( whr_text( 'welcome' ) ); ?></p>
		<p class="lede"><?php esc_html_e( 'Every sanctuary is reviewed by our team, labeled honestly as a retreat or a clinical program, and introduced to you without pressure.', 'wehaverehabs' ); ?></p>
	</div>
</section>

<?php
$conditions = get_terms( array( 'taxonomy' => 'condition', 'parent' => 0, 'hide_empty' => false, 'number' => 6 ) );
if ( $conditions && ! is_wp_error( $conditions ) ) :
	$numerals = array( 'i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.' );
	?>
<section class="split bg-sand" id="healing">
	<div class="split__media">
		<?php echo whr_image( (int) whr_option( 'split_image' ), 'whr-wide', array( 'alt' => '' ), 'arches.jpg' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	</div>
	<div class="split__body">
		<div class="eyebrow"><?php esc_html_e( 'What brings you here', 'wehaverehabs' ); ?></div>
		<h2 class="display display--md"><?php echo wp_kses_post( __( 'Begin with what <em>you’re carrying</em>', 'wehaverehabs' ) ); ?></h2>
		<div class="numbered-list">
			<?php foreach ( $conditions as $i => $term ) : ?>
				<a href="<?php echo esc_url( get_term_link( $term ) ); ?>">
					<span class="n" aria-hidden="true"><?php echo esc_html( $numerals[ $i ] ); ?></span>
					<span class="t"><?php echo esc_html( $term->name ); ?></span>
					<span class="c"><?php echo esc_html( whr_count_label( $term ) ); ?></span>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</section>
<?php endif; ?>

<?php
$destinations = get_terms( array( 'taxonomy' => 'destination', 'parent' => 0, 'hide_empty' => false ) );
if ( $destinations && ! is_wp_error( $destinations ) ) :
	// Destinations with their own photo first (imported countries have none yet), then most-listed.
	usort(
		$destinations,
		function ( $a, $b ) {
			$photo = (int) (bool) get_term_meta( $b->term_id, 'whr_image', true ) - (int) (bool) get_term_meta( $a->term_id, 'whr_image', true );
			return $photo ? $photo : whr_term_count( $b ) - whr_term_count( $a );
		}
	);
	$destinations = array_slice( $destinations, 0, 4 );
	?>
<section class="section" id="destinations">
	<div class="wrap">
		<div class="section-head center">
			<div class="eyebrow"><?php esc_html_e( 'Destinations', 'wehaverehabs' ); ?></div>
			<h2 class="display"><?php echo wp_kses_post( __( 'Where would you <em>like to heal?</em>', 'wehaverehabs' ) ); ?></h2>
		</div>
		<div class="tiles">
			<?php foreach ( $destinations as $term ) : ?>
				<a class="tile<?php echo whr_term_has_image( $term ) ? '' : ' tile--plain'; ?>" href="<?php echo esc_url( get_term_link( $term ) ); ?>">
					<?php echo whr_term_has_image( $term ) ? whr_term_image( $term, 'whr-card', array( 'alt' => '' ) ) : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					<span class="tile__label">
						<span class="tile__count"><?php echo esc_html( whr_count_label( $term ) ); ?></span>
						<span class="tile__name"><?php echo esc_html( $term->name ); ?></span>
					</span>
				</a>
			<?php endforeach; ?>
		</div>
		<p class="center" style="margin-top:50px"><a class="btn btn--outline" href="<?php echo esc_url( get_post_type_archive_link( 'sanctuary' ) ); ?>"><?php esc_html_e( 'All sanctuaries', 'wehaverehabs' ); ?></a></p>
	</div>
</section>
<?php endif; ?>

<section class="quote-band">
	<?php echo whr_image( (int) whr_option( 'quote_image' ), 'whr-hero', array( 'alt' => '' ), 'junglepool.jpg' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	<blockquote>
		<p>“<?php echo wp_kses_post( whr_text( 'quote' ) ); ?>”</p>
		<cite><?php echo esc_html( sprintf( /* translators: %s: site name */ __( 'The %s philosophy', 'wehaverehabs' ), get_bloginfo( 'name' ) ) ); ?></cite>
	</blockquote>
</section>

<?php
$featured = new WP_Query(
	array(
		'post_type'      => 'sanctuary',
		'posts_per_page' => 2,
		'meta_key'       => 'whr_featured', // phpcs:ignore WordPress.DB.SlowDBQuery
		'meta_value'     => 1, // phpcs:ignore WordPress.DB.SlowDBQuery
		'no_found_rows'  => true,
	)
);
$shown = wp_list_pluck( $featured->posts, 'ID' );
$more_query  = new WP_Query(
	array(
		'post_type'      => 'sanctuary',
		'posts_per_page' => 3,
		'post__not_in'   => $shown,
		'no_found_rows'  => true,
		'meta_key'       => '_thumbnail_id', // phpcs:ignore WordPress.DB.SlowDBQuery -- only listings with photos on the homepage.
	)
);
if ( $featured->have_posts() || $more_query->have_posts() ) :
	?>
<section class="section">
	<div class="wrap">
		<div class="section-head center">
			<div class="eyebrow"><?php esc_html_e( 'The sanctuaries', 'wehaverehabs' ); ?></div>
			<h2 class="display"><?php echo wp_kses_post( __( 'Places we <em>love</em> right now', 'wehaverehabs' ) ); ?></h2>
		</div>

		<?php
		$i = 0;
		while ( $featured->have_posts() ) :
			$featured->the_post();
			$gallery = whr_gallery_ids();
			?>
			<article class="feature-row<?php echo $i % 2 ? ' feature-row--reverse' : ''; ?>">
				<div class="feature-row__media">
					<?php echo whr_post_image( null, 'whr-wide', array( 'alt' => '' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					<?php
					if ( $gallery ) {
						echo whr_image( $gallery[0], 'whr-square', array( 'class' => 'feature-row__inset', 'alt' => '' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					}
					?>
				</div>
				<div class="feature-row__body">
					<div class="card__kicker"><?php echo esc_html( whr_location() ); ?></div>
					<h3><?php the_title(); ?></h3>
					<?php the_excerpt(); ?>
					<div class="facts-line">
						<?php
						$care = whr_first_term( 'care_level' );
						if ( $care ) {
							echo '<span>' . esc_html( $care->name ) . '</span>';
						}
						if ( whr_stay_text() ) {
							echo '<span>' . esc_html( whr_stay_text() ) . '</span>';
						}
						if ( whr_meta( 'guests' ) ) {
							/* translators: %d: guests */
							echo '<span>' . esc_html( sprintf( __( 'Up to %d guests', 'wehaverehabs' ), (int) whr_meta( 'guests' ) ) ) . '</span>';
						}
						echo '<span>' . whr_price_html() . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						?>
					</div>
					<a class="btn btn--dark" href="<?php the_permalink(); ?>"><?php esc_html_e( 'Discover', 'wehaverehabs' ); ?><span class="screen-reader-text"> <?php the_title(); ?></span></a>
				</div>
			</article>
			<?php
			++$i;
		endwhile;
		wp_reset_postdata();
		?>

		<?php if ( $more_query->have_posts() ) : ?>
			<div class="card-grid">
				<?php
				while ( $more_query->have_posts() ) {
					$more_query->the_post();
					get_template_part( 'template-parts/card-sanctuary' );
				}
				wp_reset_postdata();
				?>
			</div>
		<?php endif; ?>
	</div>
</section>
<?php endif; ?>

<?php
$approaches = get_terms( array( 'taxonomy' => 'approach', 'parent' => 0, 'hide_empty' => false, 'number' => 4 ) );
if ( $approaches && ! is_wp_error( $approaches ) ) :
	?>
<section class="split bg-dark">
	<div class="split__media" style="flex-basis:460px">
		<?php echo whr_image( 0, 'whr-wide', array( 'alt' => '' ), 'candles.jpg' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	</div>
	<div class="split__body" style="flex-grow:1.2">
		<div class="eyebrow"><?php esc_html_e( 'Ways of healing', 'wehaverehabs' ); ?></div>
		<h2 class="display display--md"><?php echo wp_kses_post( __( 'Therapy for the mind. <em>Ritual</em> for the body.', 'wehaverehabs' ) ); ?></h2>
		<p class="lede" style="margin:22px 0 40px;max-width:560px"><?php esc_html_e( 'Each sanctuary blends evidence-based therapy, led by licensed clinicians, with the practices that help it land — and tells you clearly which is which.', 'wehaverehabs' ); ?></p>
		<div class="ways">
			<?php foreach ( $approaches as $term ) : ?>
				<div>
					<h3><a href="<?php echo esc_url( get_term_link( $term ) ); ?>" style="color:inherit;text-decoration:none"><?php echo esc_html( $term->name ); ?></a></h3>
					<p><?php echo esc_html( $term->description ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>
<?php endif; ?>

<?php
// Moments: first gallery photo from several sanctuaries, topped up with bundled photos.
$moments = array();
$pool    = get_posts( array( 'post_type' => 'sanctuary', 'numberposts' => 8, 'fields' => 'ids' ) );
foreach ( $pool as $pid ) {
	$ids = whr_gallery_ids( $pid );
	if ( isset( $ids[1] ) ) {
		$moments[] = whr_image( $ids[1], 'whr-wide', array( 'alt' => '' ) );
	}
	if ( count( $moments ) >= 4 ) {
		break;
	}
}
foreach ( array( 'aerial.jpg', 'calm.jpg', 'daybed.jpg', 'villas.jpg' ) as $file ) {
	if ( count( $moments ) >= 4 ) {
		break;
	}
	$moments[] = whr_image( 0, 'whr-wide', array( 'alt' => '' ), $file );
}
?>
<section class="section">
	<div class="wrap">
		<div class="section-head section-head--split">
			<h2 class="display" style="margin:0"><?php echo wp_kses_post( __( 'Moments of <em>stillness</em>', 'wehaverehabs' ) ); ?></h2>
			<p class="lede" style="max-width:420px;margin:0"><?php esc_html_e( 'A glimpse inside the sanctuaries — the rooms, rituals and quiet corners guests remember most.', 'wehaverehabs' ); ?></p>
		</div>
		<div class="mosaic"><?php echo implode( '', $moments ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
	</div>
</section>

<section class="cta-band">
	<?php echo whr_image( (int) whr_option( 'cta_image' ), 'whr-hero', array( 'alt' => '' ), 'plunge.jpg' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	<div class="wrap">
		<div class="cta-band__body">
			<div class="eyebrow" style="color:var(--gold-light)"><?php esc_html_e( 'Not sure where to begin?', 'wehaverehabs' ); ?></div>
			<h2 class="display display--md"><?php echo wp_kses_post( __( 'Let us <em>guide you</em> there', 'wehaverehabs' ) ); ?></h2>
			<p><?php esc_html_e( 'Speak privately with a care advisor about how you’re feeling, what you can spend and how far you’d travel — in English or Spanish.', 'wehaverehabs' ); ?></p>
			<div class="btn-row">
				<?php if ( whr_option( 'advisor_url' ) ) : ?>
					<a class="btn btn--primary" href="<?php echo esc_url( whr_option( 'advisor_url' ) ); ?>"><?php esc_html_e( 'Speak with an advisor', 'wehaverehabs' ); ?></a>
				<?php endif; ?>
				<?php
				$wa = whr_whatsapp_url( whr_option( 'whatsapp' ), __( 'Hello, I would like some guidance.', 'wehaverehabs' ) );
				if ( $wa ) :
					?>
					<a class="btn btn--light" href="<?php echo esc_url( $wa ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'WhatsApp us', 'wehaverehabs' ); ?></a>
				<?php endif; ?>
				<a class="btn btn--light" href="<?php echo esc_url( get_post_type_archive_link( 'sanctuary' ) ); ?>"><?php esc_html_e( 'Browse sanctuaries', 'wehaverehabs' ); ?></a>
			</div>
		</div>
	</div>
</section>

<?php
$journal = new WP_Query( array( 'post_type' => 'post', 'posts_per_page' => 3, 'no_found_rows' => true, 'ignore_sticky_posts' => true ) );
if ( $journal->have_posts() ) :
	?>
<section class="section">
	<div class="wrap">
		<div class="section-head center">
			<div class="eyebrow"><?php esc_html_e( 'The Journal', 'wehaverehabs' ); ?></div>
			<h2 class="display"><?php echo wp_kses_post( __( 'Stories for the <em>journey</em>', 'wehaverehabs' ) ); ?></h2>
		</div>
		<div class="post-list">
			<?php
			while ( $journal->have_posts() ) {
				$journal->the_post();
				get_template_part( 'template-parts/card-post' );
			}
			wp_reset_postdata();
			?>
		</div>
	</div>
</section>
<?php endif; ?>

<?php
get_footer();
