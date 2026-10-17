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
 *   the results.
 *
 * Order matters here. Someone landing on a category page came to see what is
 * available, so the results come first and the editorial copy — the intro, the
 * highlights, the FAQ — sits underneath where it still earns its keep in search
 * without pushing the bookable list below the fold.
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
<section class="page-hero page-hero--compact<?php echo $pt_is_tax ? ' page-hero--term' : ''; ?>">
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
				<?php // One line here; the full description runs below the results. ?>
				<p class="page-hero__lede">
					<?php
					// Translate before trimming: a truncated sentence matches no catalogue entry.
					$pt_lede_full = function_exists( 'pt_translate_seeded' )
						? pt_translate_seeded( $pt_term->description )
						: $pt_term->description;
					echo esc_html( wp_trim_words( wp_strip_all_tags( $pt_lede_full ), 16 ) );
					?>
				</p>
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
				<?php esc_html_e( 'Surf lessons, fishing charters, boat tours and wildlife trips, run by people who live here.', 'palmtreesurf' ); ?>
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

	<?php get_template_part( 'template-parts/components/experience-tiles' ); ?>

<?php else : ?>

	<?php // The results, first. ?>
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

	<?php if ( $pt_is_tax && ! empty( $pt_copy['highlights'] ) ) : ?>
		<section class="section section--sand tax-highlights">
			<div class="container">
				<ul class="tax-highlights__list" data-reveal-group>
					<?php foreach ( $pt_copy['highlights'] as $pt_highlight ) : ?>
						<li class="tax-highlight" data-reveal>
							<h2 class="tax-highlight__title"><?php echo esc_html( $pt_highlight[0] ); ?></h2>
							<p class="tax-highlight__text"><?php echo esc_html( $pt_highlight[1] ); ?></p>
						</li>
					<?php endforeach; ?>
				</ul>
			</div>
		</section>
	<?php endif; ?>

	<?php if ( $pt_is_tax && ! empty( $pt_copy['intro'] ) ) : ?>
		<section class="tax-intro">
			<div class="container tax-intro__inner">
				<div class="tax-intro__prose prose">
					<h2 class="tax-intro__title">
						<?php
						printf(
							/* translators: %s: category name. */
							esc_html__( 'About %s in Tamarindo', 'palmtreesurf' ),
							esc_html( $pt_term ? $pt_term->name : '' )
						);
						?>
					</h2>

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
	<?php // Editorial copy for the hub, below the categories for the same reason. ?>
	<section class="tax-intro">
		<div class="container tax-intro__inner">
			<div class="tax-intro__prose prose">
				<h2 class="tax-intro__title"><?php esc_html_e( 'Why everything here is within a few kilometres', 'palmtreesurf' ); ?></h2>
				<p>
					<?php esc_html_e( 'Everything above runs within a few kilometres of Tamarindo beach. The surf breaks over sand rather than reef, which is why this became a teaching beach; the estuary behind the town sits inside a protected wildlife refuge; deep water is close enough that a fishing boat can be inshore or offshore without a long run; and the dry forest inland has the waterfalls.', 'palmtreesurf' ); ?>
				</p>
				<p>
					<?php esc_html_e( 'If you are not sure what suits your group, say so when you message us — it is a normal question and we would rather answer it before you book than after.', 'palmtreesurf' ); ?>
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

	<?php get_template_part( 'template-parts/home/faq' ); ?>
<?php endif; ?>

<?php get_template_part( 'template-parts/home/cta' ); ?>
<?php
get_footer();
