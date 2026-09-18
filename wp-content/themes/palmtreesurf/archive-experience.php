<?php
/**
 * Experiences — the hub, and every category and skill-level page.
 *
 * Two modes share this file, because they share the same furniture:
 *
 * - Hub (/experiences/). A photo hero, the finder, a sticky category bar and
 *   then one anchored block per category. Arriving from a category link drops
 *   you at that block with everything else still above and below you, so you
 *   can keep browsing instead of backing out to a menu. A filtered request
 *   (search, finder, skill level) falls back to a plain results grid, because
 *   at that point the visitor has told us what they want.
 *
 * - Category (/experiences/category/surf-lessons/). The same hero and bar, then
 *   the term's own copy, the full result grid with facets, and the supporting
 *   sections that give the page something to rank on.
 *
 * @package PalmTreeSurf
 */

defined( 'ABSPATH' ) || exit;

get_header();

$pt_is_tax = is_tax();
$pt_term   = $pt_is_tax ? get_queried_object() : null;
$pt_copy   = $pt_is_tax ? pt_term_copy( $pt_term ) : array();

// The hub only shows its category blocks when nobody has filtered it.
$pt_filtered = ! $pt_is_tax && ( is_search() || ! empty( $_GET['experience_type'] ) || ! empty( $_GET['s'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$pt_hub      = ! $pt_is_tax && ! $pt_filtered;
$pt_search   = get_search_query();
?>
<section class="page-hero<?php echo $pt_is_tax ? ' page-hero--term' : ''; ?>">
	<div class="page-hero__media" aria-hidden="true">
		<?php
		if ( $pt_is_tax ) {
			pt_term_image( $pt_term );
		} else {
			pt_image( 'story-banner', array( 'priority' => true ) );
		}
		?>
	</div>

	<div class="page-hero__inner container">
		<p class="page-hero__script">
			<?php echo esc_html( $pt_is_tax ? __( 'Tamarindo', 'palmtreesurf' ) : __( 'Explore', 'palmtreesurf' ) ); ?>
		</p>

		<?php if ( $pt_is_tax ) : ?>
			<?php the_archive_title( '<h1 class="page-hero__title">', '</h1>' ); ?>

			<?php if ( $pt_term && $pt_term->description ) : ?>
				<div class="page-hero__lede"><?php echo wp_kses_post( wpautop( $pt_term->description ) ); ?></div>
			<?php endif; ?>
		<?php elseif ( $pt_search ) : ?>
			<h1 class="page-hero__title">
				<?php
				printf(
					/* translators: %s: search term. */
					esc_html__( 'Searching for &ldquo;%s&rdquo;', 'palmtreesurf' ),
					esc_html( $pt_search )
				);
				?>
			</h1>
			<p class="page-hero__lede">
				<?php esc_html_e( 'Experiences matching your search. Clear it to browse everything we run.', 'palmtreesurf' ); ?>
			</p>
		<?php else : ?>
			<h1 class="page-hero__title"><?php esc_html_e( 'Experiences in Tamarindo', 'palmtreesurf' ); ?></h1>
			<p class="page-hero__lede">
				<?php esc_html_e( 'Surf lessons, fishing charters, boat tours and wildlife trips, run by people who live here. Pick a category below.', 'palmtreesurf' ); ?>
			</p>
		<?php endif; ?>
	</div>
</section>

<div class="container">
	<?php get_template_part( 'template-parts/components/filter-panel' ); ?>
</div>

<?php get_template_part( 'template-parts/components/category-nav' ); ?>

<div class="container">
	<?php get_template_part( 'template-parts/components/breadcrumbs' ); ?>
</div>

<?php if ( $pt_hub ) : ?>

	<?php
	$pt_types = get_terms(
		array(
			'taxonomy'   => 'experience_type',
			'hide_empty' => true,
			'orderby'    => 'name',
		)
	);
	?>

	<section class="tax-intro">
		<div class="container tax-intro__inner">
			<div class="tax-intro__prose prose">
				<p>
					<?php esc_html_e( 'Everything below runs within a few kilometres of Tamarindo beach. The surf breaks over sand rather than reef, which is why this became a teaching beach; the estuary behind the town sits inside a protected wildlife refuge; deep water is close enough that a fishing boat can be inshore or offshore without a long run; and the dry forest inland has the waterfalls.', 'palmtreesurf' ); ?>
				</p>
				<p>
					<?php esc_html_e( 'Pick a category to see everything in it, or use the finder above if you already know your dates. If you are not sure what suits your group, say so when you message us — it is a normal question and we would rather answer it before you book than after.', 'palmtreesurf' ); ?>
				</p>
			</div>

			<aside class="tax-know">
				<h2 class="tax-know__title"><?php esc_html_e( 'Good to know', 'palmtreesurf' ); ?></h2>
				<ul class="tax-know__list">
					<li><?php esc_html_e( 'Book water activities for the morning — the wind builds through the day.', 'palmtreesurf' ); ?></li>
					<li><?php esc_html_e( 'Water sits in the high twenties Celsius all year. No wetsuit needed, ever.', 'palmtreesurf' ); ?></li>
					<li><?php esc_html_e( 'Nothing here needs prior experience unless its page says so.', 'palmtreesurf' ); ?></li>
					<li><?php esc_html_e( 'Conditions decide. If a day is wrong for your group, we move you rather than run it.', 'palmtreesurf' ); ?></li>
				</ul>
			</aside>
		</div>
	</section>

	<?php if ( $pt_types && ! is_wp_error( $pt_types ) ) : ?>
		<div class="cat-sections">
			<?php foreach ( $pt_types as $pt_type ) : ?>
				<?php
				get_template_part(
					'template-parts/components/category',
					'section',
					array( 'term' => $pt_type )
				);
				?>
			<?php endforeach; ?>
		</div>
	<?php else : ?>
		<div class="container"><?php get_template_part( 'template-parts/content', 'none' ); ?></div>
	<?php endif; ?>

<?php else : ?>

	<?php if ( $pt_is_tax && ! empty( $pt_copy['intro'] ) ) : ?>
		<section class="tax-intro">
			<div class="container tax-intro__inner">
				<div class="tax-intro__prose prose">
					<?php foreach ( $pt_copy['intro'] as $pt_paragraph ) : ?>
						<p><?php echo esc_html( $pt_paragraph ); ?></p>
					<?php endforeach; ?>
				</div>

				<?php if ( ! empty( $pt_copy['know'] ) ) : ?>
					<aside class="tax-know">
						<h2 class="tax-know__title"><?php esc_html_e( 'Good to know', 'palmtreesurf' ); ?></h2>
						<ul class="tax-know__list">
							<?php foreach ( $pt_copy['know'] as $pt_point ) : ?>
								<li><?php echo esc_html( $pt_point ); ?></li>
							<?php endforeach; ?>
						</ul>
					</aside>
				<?php endif; ?>
			</div>
		</section>
	<?php endif; ?>

	<?php if ( $pt_is_tax && ! empty( $pt_copy['highlights'] ) ) : ?>
		<section class="section section--sand tax-highlights">
			<div class="container">
				<ul class="tax-highlights__list" data-reveal-group>
					<?php foreach ( $pt_copy['highlights'] as $pt_highlight ) : ?>
						<li class="tax-highlight" data-reveal>
							<h3 class="tax-highlight__title"><?php echo esc_html( $pt_highlight[0] ); ?></h3>
							<p class="tax-highlight__text"><?php echo esc_html( $pt_highlight[1] ); ?></p>
						</li>
					<?php endforeach; ?>
				</ul>
			</div>
		</section>
	<?php endif; ?>

	<div class="container" id="results">
		<div class="listing">
			<?php get_template_part( 'template-parts/components/facets' ); ?>

			<div class="listing__results">
				<div class="listing__head">
					<p class="listing__count">
						<?php
						global $wp_query;
						$pt_total = (int) $wp_query->found_posts;
						printf(
							/* translators: %s: number of experiences. */
							esc_html( _n( '%s experience', '%s experiences', $pt_total, 'palmtreesurf' ) ),
							esc_html( number_format_i18n( $pt_total ) )
						);
						?>
					</p>
				</div>

				<?php if ( have_posts() ) : ?>
					<div class="card-grid" data-reveal-group>
						<?php
						while ( have_posts() ) :
							the_post();
							get_template_part( 'template-parts/components/card', 'experience' );
						endwhile;
						?>
					</div>

					<?php pt_pagination(); ?>
				<?php else : ?>
					<?php get_template_part( 'template-parts/content', 'none' ); ?>
				<?php endif; ?>
			</div>
		</div>
	</div>

	<?php if ( $pt_is_tax && ! empty( $pt_copy['faq'] ) ) : ?>
		<section class="section tax-faq">
			<div class="container container--narrow">
				<header class="section__header">
					<p class="eyebrow"><?php esc_html_e( 'Questions', 'palmtreesurf' ); ?></p>
					<h2 class="section__title"><?php esc_html_e( 'Before you book', 'palmtreesurf' ); ?></h2>
				</header>

				<div class="faq">
					<?php foreach ( $pt_copy['faq'] as $pt_index => $pt_pair ) : ?>
						<details class="faq__item"<?php echo 0 === $pt_index ? ' open' : ''; ?>>
							<summary><?php echo esc_html( $pt_pair[0] ); ?></summary>
							<div class="faq__answer"><p><?php echo esc_html( $pt_pair[1] ); ?></p></div>
						</details>
					<?php endforeach; ?>
				</div>
			</div>
		</section>
	<?php endif; ?>

	<?php if ( $pt_is_tax ) : ?>
		<?php get_template_part( 'template-parts/components/category-others', null, array( 'current' => $pt_term ) ); ?>
	<?php endif; ?>

<?php endif; ?>

<?php if ( $pt_hub ) : ?>
	<?php get_template_part( 'template-parts/home/faq' ); ?>
<?php endif; ?>

<?php get_template_part( 'template-parts/home/cta' ); ?>
<?php
get_footer();
