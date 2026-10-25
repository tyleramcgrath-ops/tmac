<?php
/**
 * Sanctuary search results. Also used for condition / care / setting / approach archives.
 *
 * @package WeHaveRehabs
 */

get_header();

$f    = whr_filters();
$dest = $f['dest'] ? get_term_by( 'slug', $f['dest'], 'destination' ) : null;
if ( is_tax( 'destination' ) ) {
	$dest = get_queried_object();
}
$plain = $dest && ! whr_term_has_image( $dest );
$hero  = $plain ? '' : ( $dest ? whr_term_image( $dest, 'whr-hero', array( 'class' => 'hero__img', 'alt' => '', 'loading' => 'eager' ) ) : whr_image( 0, 'whr-hero', array( 'class' => 'hero__img', 'alt' => '', 'loading' => 'eager' ), 'poolpalms.jpg' ) );
global $wp_query;
?>

<section class="hero hero--sm<?php echo $plain ? ' hero--plain' : ''; ?>">
	<?php if ( $hero ) : ?>
		<?php echo $hero; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<div class="hero__shade"></div>
		<?php if ( $dest ) : ?>
			<span class="whr-place-credit"><?php echo whr_term_photo_credit( $dest ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helper. ?></span>
		<?php endif; ?>
	<?php endif; ?>
	<div class="hero__body">
		<nav class="breadcrumbs" aria-label="<?php esc_attr_e( 'Breadcrumb', 'wehaverehabs' ); ?>">
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'wehaverehabs' ); ?></a>
			<?php if ( $dest ) : ?>
				· <a href="<?php echo esc_url( get_term_link( $dest ) ); ?>"><?php echo esc_html( $dest->name ); ?></a>
			<?php endif; ?>
		</nav>
		<h1 class="hero__title" style="font-size:clamp(44px,6vw,78px);margin:14px auto 8px"><?php echo whr_results_heading(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in helper. ?></h1>
		<p class="hero__sub">
			<?php
			/* translators: %s: number of results */
			echo esc_html( sprintf( _n( '%s place', '%s places', (int) $wp_query->found_posts, 'wehaverehabs' ), number_format_i18n( (int) $wp_query->found_posts ) ) );
			?>
		</p>
	</div>
</section>

<?php get_template_part( 'template-parts/search-panel', null, array( 'compact' => true ) ); ?>

<div class="wrap results-layout">
	<section class="results-main" aria-label="<?php esc_attr_e( 'Results', 'wehaverehabs' ); ?>">
		<form class="results-bar" method="get">
			<?php
			foreach ( array( 'dest', 'need', 'care', 'setting', 'stay', 'budget', 'q' ) as $keep ) {
				if ( $f[ $keep ] ) {
					printf( '<input type="hidden" name="%s" value="%s">', esc_attr( $keep ), esc_attr( $f[ $keep ] ) );
				}
			}
			?>
			<span>
				<?php
				/* translators: %s: number of sanctuaries */
				echo esc_html( sprintf( _n( 'Showing %s sanctuary', 'Showing %s sanctuaries', (int) $wp_query->found_posts, 'wehaverehabs' ), number_format_i18n( (int) $wp_query->found_posts ) ) );
				?>
			</span>
			<label><?php esc_html_e( 'Sort', 'wehaverehabs' ); ?>
				<select name="sort" onchange="this.form.submit()">
					<option value=""><?php esc_html_e( 'Our favorites', 'wehaverehabs' ); ?></option>
					<option value="price" <?php selected( $f['sort'], 'price' ); ?>><?php esc_html_e( 'Price', 'wehaverehabs' ); ?></option>
					<option value="stay" <?php selected( $f['sort'], 'stay' ); ?>><?php esc_html_e( 'Shortest stay', 'wehaverehabs' ); ?></option>
					<option value="name" <?php selected( $f['sort'], 'name' ); ?>><?php esc_html_e( 'Name', 'wehaverehabs' ); ?></option>
				</select>
			</label>
			<noscript><button type="submit" class="btn btn--outline"><?php esc_html_e( 'Sort', 'wehaverehabs' ); ?></button></noscript>
		</form>

		<?php if ( have_posts() ) : ?>
			<div class="card-grid">
				<?php
				while ( have_posts() ) {
					the_post();
					get_template_part( 'template-parts/card-sanctuary' );
				}
				?>
			</div>
			<nav class="pagination" aria-label="<?php esc_attr_e( 'Pages', 'wehaverehabs' ); ?>">
				<?php echo paginate_links( array( 'prev_text' => '←', 'next_text' => '→' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</nav>
		<?php else : ?>
			<div class="empty-state">
				<h2 style="font-size:40px"><?php echo wp_kses_post( __( 'Nothing <em>quite</em> matches yet', 'wehaverehabs' ) ); ?></h2>
				<p class="lede"><?php esc_html_e( 'Try fewer filters, or tell an advisor what you need and we’ll look for you.', 'wehaverehabs' ); ?></p>
				<a class="btn btn--outline" href="<?php echo esc_url( get_post_type_archive_link( 'sanctuary' ) ); ?>"><?php esc_html_e( 'Clear filters', 'wehaverehabs' ); ?></a>
			</div>
		<?php endif; ?>

		<div class="advisor-band">
			<?php echo whr_image( 0, 'whr-wide', array( 'alt' => '' ), 'candles.jpg' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<div>
				<h2><?php echo wp_kses_post( __( 'Feeling unsure? <em>Talk it through.</em>', 'wehaverehabs' ) ); ?></h2>
				<p style="margin:0;font-size:15px;color:var(--on-dark-soft)"><?php esc_html_e( 'A free, private call with an advisor who knows these places — by phone, video or WhatsApp.', 'wehaverehabs' ); ?></p>
				<?php
				$talk = whr_option( 'advisor_url' ) ? whr_option( 'advisor_url' ) : whr_whatsapp_url( whr_option( 'whatsapp' ) );
				if ( $talk ) :
					?>
					<a class="btn btn--primary" href="<?php echo esc_url( $talk ); ?>"><?php esc_html_e( 'Book a call', 'wehaverehabs' ); ?></a>
				<?php endif; ?>
			</div>
		</div>
		<p class="legend">
			<?php
			$levels = get_terms( array( 'taxonomy' => 'care_level', 'hide_empty' => false ) );
			foreach ( is_wp_error( $levels ) ? array() : $levels as $level ) {
				if ( $level->description ) {
					echo '<strong>' . esc_html( $level->name ) . '</strong> — ' . esc_html( $level->description ) . '<br>';
				}
			}
			?>
		</p>
	</section>

	<aside class="results-aside">
		<?php
		$parent  = $dest ? $dest->term_id : 0;
		$regions = get_terms( array( 'taxonomy' => 'destination', 'parent' => $parent, 'hide_empty' => false ) );
		if ( ( ! $regions || is_wp_error( $regions ) ) && $dest && $dest->parent ) {
			$regions = get_terms( array( 'taxonomy' => 'destination', 'parent' => $dest->parent, 'hide_empty' => false ) );
		}
		if ( $regions && ! is_wp_error( $regions ) ) :
			?>
			<div class="region-list">
				<h2><?php echo $dest ? esc_html__( 'Regions', 'wehaverehabs' ) : esc_html__( 'Destinations', 'wehaverehabs' ); ?></h2>
				<ul>
					<?php foreach ( $regions as $r ) : ?>
						<li><a href="<?php echo esc_url( whr_search_url( array_merge( $f, array( 'dest' => $r->slug, 'sort' => $f['sort'] ) ) ) ); ?>" aria-current="<?php echo $dest && $dest->slug === $r->slug ? 'true' : 'false'; ?>"><span><?php echo esc_html( $r->name ); ?></span><span><?php echo esc_html( number_format_i18n( whr_term_count( $r ) ) ); ?></span></a></li>
					<?php endforeach; ?>
				</ul>
			</div>
		<?php endif; ?>
	</aside>
</div>

<?php
get_footer();
